import {
  allComponents,
  provideFluentDesignSystem,
} from "@fluentui/web-components";
import { SocketCanvasElement } from "./socket_canvas.js";
// Make everything use microsoft fluent by default.
provideFluentDesignSystem().register(allComponents);

/* 

Useful types (you don't have to use them explicitly, 
they serve as documentation for what the protocol is doing) 

*/

interface Point {
  x: number,
  y: number,
}

interface WelcomeMessage {
  // The size of the remote canvas.
  x: number,
  y: number,
  data: [number]
}

interface UpdateMessage {
  point: Point,
  value: boolean,
}

let messageCounter = 0;

// Create a websocket connection. 
// More info at https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
const socket = new WebSocket("ws:socket.zavazadlo.unsigned-short.com");
socket.onmessage = (m) => {
  console.log(m)

  if (messageCounter == 0) {
    const welcomeMessage: WelcomeMessage = JSON.parse(m.data);

    canvas.width = welcomeMessage.x;
    canvas.height = welcomeMessage.y;

    const points = welcomeMessage.data;

    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        const value: boolean = points[x * canvas.width + y] == 1;
        canvas.setPixel(x, y, value)
      }
    }
  } else {
    const updates: UpdateMessage[] = JSON.parse(m.data);
    updates.forEach(function (update: UpdateMessage) {
      canvas.setPixel(update.point.x, update.point.y, update.value);
    });
  }

  messageCounter++;
}

// Example of how to use the canvas element:
const canvas = new SocketCanvasElement();
canvas.width = 128;
canvas.height = 128;
canvas.ondraw = (x, y) => {
  console.log(x, y);

  const point: Point = { x: x, y: y }
  const message: UpdateMessage = { point: point, value: true };
  socket.send(JSON.stringify(message));

}
document.querySelector("#container")!.appendChild(canvas);

// We can only draw into canvas once it is actually shown, hence we postpose the draw operation.
setTimeout(() => {
  for (let x = 0; x < 128; x++) {
    canvas.setPixel(x, x, true);
  }
})
