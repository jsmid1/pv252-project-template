import { attr, FASTElement, html, nullableNumberConverter, ref } from "@microsoft/fast-element";

const SCALE_FACTOR = 4;

/**
 * The purpose of `socket-canvas` is to display pixel data on a canvas of specified dimensions.
 */
export class SocketCanvasElement extends FASTElement {

    @attr({ converter: nullableNumberConverter })
    width: number | null = null;

    @attr({ converter: nullableNumberConverter })
    height: number | null = null;

    canvas: HTMLCanvasElement | undefined;    
    context: CanvasRenderingContext2D | undefined;

    is_clicked: boolean = false;

    ondraw: ((x: number, y: number) => void) | null = null; 

    connectedCallback(): void {
        super.connectedCallback();
        let canvas = this.canvas!;                
        this.context = canvas.getContext('2d')!;
        canvas.onmousedown = (e) => {
            this.is_clicked = true;            
            this.#notifyMouseEvent(e.clientX, e.clientY);
        };
        canvas.onmouseup = (_e) => {
            this.is_clicked = false;
        }
        canvas.onmousemove = (e) => {
            if (this.is_clicked) {
                this.#notifyMouseEvent(e.clientX, e.clientY);
            }
        }
    }

    #notifyMouseEvent(clientX: number, clientY: number) {
        let bounds = this.canvas!.getBoundingClientRect();
        let x = Math.max(0, Math.min(clientX - bounds.x, (this.width ?? 0) * SCALE_FACTOR)) / SCALE_FACTOR;
        let y = Math.max(0, Math.min(clientY - bounds.y, (this.height ?? 0) * SCALE_FACTOR)) / SCALE_FACTOR;
        if (this.ondraw != null) {
            this.ondraw(Math.round(x), Math.round(y));
        }
    }

    setPixel(x: number, y: number, value: boolean) {                        
        this.context!.fillStyle = value ? "black" : "white";        
        this.context!.fillRect(Math.round(SCALE_FACTOR * x), Math.round(SCALE_FACTOR * y), SCALE_FACTOR, SCALE_FACTOR);
    }

}

const socketCanvasTemplate = html<SocketCanvasElement>`
<style>
canvas {
    border: 1px solid black; 
    margin: 0 auto; 
    image-rendering: pixelated; 
    image-rendering: crisp-edges;
}
</style>
<canvas ${ref('canvas')} width='${(x) => (x.width ?? 0) * SCALE_FACTOR}' height='${(x) => (x.height ?? 0) * SCALE_FACTOR}'></canvas>
`

SocketCanvasElement.define({
    name: "socket-canvas",
    template: socketCanvasTemplate,
});