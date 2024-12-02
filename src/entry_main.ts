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

// Create a websocket connection. 
// More info at https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
const socket = new WebSocket("ws:socket.zavazadlo.unsigned-short.com");
socket.onmessage = (m) => {
  console.log(m)
}

// Example of how to use the canvas element:
let canvas = new SocketCanvasElement();
canvas.width = 128;
canvas.height = 128;
document.querySelector("#container")!.appendChild(canvas);

// We can only draw into canvas once it is actually shown, hence we postpose the draw operation.
setTimeout(() => {
  for (let x=0; x<128; x++) {
    canvas.setPixel(x,x,true);
  }
})