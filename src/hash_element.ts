import { FASTElement, html, observable, when } from "@microsoft/fast-element";
import { ResultMessage } from './hash_worker_messages.js';

/**
 * The purpose of `HashElement` is to compute the SHA256 checksum of the given file, using the
 * implementation provided in `sha-256.js`. It will display progress, elapsed time, and the
 * final hash once computed.
 */
export class HashElement extends FASTElement {
  /*
        Note that all of these are observable properties and not attributes, 
        because these are not intended to be "parameters" of the element, but
        rather something that the element is updating internally.
    */

  // The name of the file that is being processed.
  @observable
  fileName: string = "";

  // The (approximate) total size of the file.
  @observable
  total: number = -1;

  // The (approximate) size of the remaining unprocessed data.
  @observable
  remaining: number = -1;

  // The final SHA256 hash, once computed.
  @observable
  hash: string | null = null;

  // The time (in ms) elapsed while computing the file hash.
  @observable
  elapsed: number = 0;

  constructor(file: File) {
    super();
    this.fileName = file.name;

    const hash_worker = new Worker(new URL("./hash_worker.js", import.meta.url));

    hash_worker.postMessage(file);

    hash_worker.onmessage = (e) => {
      const resultMessage: ResultMessage = e.data;
      this.total = resultMessage.total;
      this.hash = resultMessage.hash;
      this.remaining = resultMessage.remaining;
      this.elapsed = resultMessage.elapsed;
    };
  }
}

const hashElementTemplate = html<HashElement>`
  <div style="margin-top: 12px;">
    <b>File name:</b> ${(x) => x.fileName}<br />
    ${when(
  (x) => x.hash !== null,
  html<HashElement>`<b>Hash:</b> ${(x) => x.hash}<br />`,
  html<HashElement>`
        <progress
          max="${(x) => x.total}"
          value="${(x) => x.total - x.remaining}"
          style="margin-right: 12px;"
        ></progress>
        ${when(
    (x) => x.total > 0,
    html<HashElement>`
            <code
              >${(x) => Math.ceil((x.total - x.remaining) / 1024 / 1024)} MiB /
              ${(x) => Math.ceil(x.total / 1024 / 1024)} MiB</code
            ><br />
          `,
    html<HashElement>` Pending...<br /> `,
  )}
      `,
)}
    <b>Elapsed:</b> <code>${(x) => Math.floor(x.elapsed / 100) / 10} s</code>
  </div>
`;

HashElement.define({
  name: "hash-element",
  template: hashElementTemplate,
});
