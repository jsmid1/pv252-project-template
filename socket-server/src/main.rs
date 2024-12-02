use atom_box::AtomBox;
use serde::{Deserialize, Serialize};
use std::net::TcpListener;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread::{sleep, spawn};
use std::time::Duration;
use tungstenite::{accept, Error, Message};

const X_LEN: u32 = 640;
const Y_LEN: u32 = 480;

#[derive(Serialize, Deserialize, PartialEq, Eq, Debug, Clone, Copy, Default)]
struct Point {
    x: u32,
    y: u32,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, Default, PartialEq, Eq)]
struct Update {
    point: Point,
    value: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq, Eq)]
struct WelcomeMessage {
    x: u32,
    y: u32,
    data: Vec<u8>,
}

type SharedLink = Arc<HistoryLink>;

struct HistoryLink {
    update: Update,
    next: AtomBox<'static, Option<SharedLink>, 0>,
}

impl HistoryLink {
    fn new(update: Update) -> HistoryLink {
        HistoryLink {
            update,
            next: AtomBox::new(None),
        }
    }

    fn new_shared(update: Update) -> SharedLink {
        Arc::new(HistoryLink::new(update))
    }

    /// Advance through the [SharedLink] linked-list specified by `head`, gathering the copies
    /// of all [Update] values (except for the one in `head` itself). Once the end of the list
    /// is found, `to_append` is added as the last element, saved to the result vector, and
    /// returned.
    ///
    /// In other words, at the end, `to_append` is the last item in the list, and the result
    /// vector has all items between the original `head` (exclusive) and `to_append` (inclusive).
    fn gather_and_append(mut head: SharedLink, to_append: SharedLink) -> Vec<Update> {
        let mut result = Vec::new();
        loop {
            let current = head.next.load();
            if let Some(inner) = current.as_ref() {
                // If the head has a successor, move to the successor and save its value.
                head = inner.clone();
                result.push(head.update);
            } else {
                // If the head does not have a successor, try to append the new link.
                match head.next.compare_exchange(current, Some(to_append.clone())) {
                    Ok(old) => {
                        // Append success. Add last item to `result` and return.
                        assert!(old.is_none());
                        result.push(to_append.update);
                        return result;
                    }
                    Err(new_current) => {
                        // Append failed. A new successor has been found.
                        head = new_current.as_ref().unwrap().clone();
                        result.push(head.update);
                    }
                }
            }
        }
    }
}

fn main() {
    let args = std::env::args().collect::<Vec<_>>();
    let port = args[1].parse::<u16>().unwrap();

    let dummy_link = HistoryLink::new_shared(Update::default());
    // Chain-init stores the "approximate" end of the update history. It is used to initialize
    // new connections so that the history before the connection does not have to be taken into
    // account. As such, it does not have to be the exact last element in the chain, just "close
    // enough" to make sure old items can be dropped safely.
    let chain_init: Arc<AtomBox<'static, SharedLink, 0>> = Arc::new(AtomBox::new(dummy_link));

    // Current data array.
    let data = {
        let mut array = Vec::new();
        for _ in 0..(X_LEN * Y_LEN) {
            array.push(AtomicBool::new(false));
        }
        Arc::new(array)
    };

    let server = TcpListener::bind(("0.0.0.0", port)).unwrap();
    println!("Listening on {}", server.local_addr().unwrap());

    for (my_id, stream) in server.incoming().enumerate() {
        let stream = match stream {
            Ok(stream) => stream,
            Err(e) => {
                eprintln!("[{}] Bad connection: {}", my_id, e);
                continue;
            }
        };

        let local_data = data.clone();
        let local_chain = chain_init.clone();

        spawn(move || {
            eprintln!("[{}] Initializing connection.", my_id);

            let data = local_data;
            let chain_init = local_chain.clone();
            let mut chain = chain_init.load().clone();

            let welcome_data = data
                .iter()
                .map(|atomic| u8::from(atomic.load(Ordering::SeqCst)))
                .collect::<Vec<_>>();

            let welcome = WelcomeMessage {
                x: X_LEN,
                y: Y_LEN,
                data: welcome_data,
            };

            let welcome_json = match serde_json::to_string(&welcome) {
                Ok(json) => json,
                Err(e) => {
                    eprintln!("[{}] Welcome message serialization error: {}", my_id, e);
                    return;
                }
            };

            let mut websocket = match accept(stream) {
                Ok(socket) => socket,
                Err(e) => {
                    eprintln!("[{}] Connection failed: {}", my_id, e);
                    return;
                }
            };

            if let Err(e) = websocket.send(Message::Text(welcome_json)) {
                eprintln!("[{}] Cannot send welcome message: {}", my_id, e);
                return;
            }

            loop {
                match websocket.read() {
                    Err(e) => {
                        eprintln!("[{}] Message error: {}", my_id, e);

                        // Socket closed on the client side. Just shut down.
                        if matches!(e, Error::ConnectionClosed) {
                            eprintln!("[{}] Socket closed.", my_id);
                            break;
                        }

                        // Some other error. Attempt to close the socket (we still have to call
                        // `read` until the closure is confirmed by the client).
                        if let Ok(()) = websocket.close(None) {
                            eprintln!("[{}] Attempting socket closure...", my_id);
                            continue;
                        } else {
                            // If we can't close the socket, we can just stop everything.
                            eprintln!("[{}] Cannot close socket.", my_id);
                            break;
                        }
                    }
                    Ok(msg) => {
                        // We only react to text messages. The rest should be handled
                        // by the library/protocol itself.
                        if let Message::Text(text) = msg {
                            //eprintln!("[{}] Received message: {}", my_id, text);

                            // Read data.
                            let update = match serde_json::from_str::<Update>(&text) {
                                Ok(update) => update,
                                Err(e) => {
                                    eprintln!("[{}] Cannot parse update: {}", my_id, e);
                                    continue;
                                }
                            };

                            // Update data buffer so that new clients see a coherent picture.
                            let i = update.point.x * Y_LEN + update.point.y;
                            if let Some(atomic) = data.get(i as usize) {
                                atomic.store(update.value, Ordering::SeqCst);
                            } else {
                                eprintln!("[{}] Invalid update position.", my_id);
                            }

                            // Update history linked-list so that connected clients know
                            // which pixels to update.
                            let update_link = HistoryLink::new_shared(update);
                            let history =
                                HistoryLink::gather_and_append(chain.clone(), update_link.clone());

                            // Update "chain start" approximation so that new clients can
                            // resume history near the current "tail".
                            chain_init.store(update_link.clone());

                            // Update our local chain link.
                            chain = update_link;

                            // Send history timeline to client.
                            let history_json = match serde_json::to_string(&history) {
                                Ok(json) => json,
                                Err(e) => {
                                    eprintln!("[{}] Cannot serialize history: {}", my_id, e);
                                    continue;
                                }
                            };
                            match websocket.send(Message::Text(history_json)) {
                                Ok(_) => {
                                    //eprintln!("[{}] Sent history: {}", my_id, history.len());
                                }
                                Err(e) => {
                                    eprintln!("[{}] Cannot send history: {}", my_id, e);
                                }
                            }

                            // Wait 16ms until next message can be received. This should throttle
                            // each client to ~60fps and avoid basic DDOS attacks. If the client
                            // exceeds this rate, the connection will fail with buffer full error.
                            sleep(Duration::from_millis(16));
                        }
                    }
                }
            }

            eprintln!("[{}] Terminated.", my_id);
        });
    }
}
