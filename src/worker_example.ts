// Respond to all messages by sending the content back with a prefix.
// This assumes that all messages are strings.
onmessage = (e) => {
  postMessage("Pong... " + e.data);
};
