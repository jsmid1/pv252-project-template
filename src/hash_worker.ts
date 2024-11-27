import { AsyncSha256 } from "./sha-256.js";
import { ResultMessage } from './hash_worker_messages.js';


// In this file, you can define the worker script that will compute the
// hash digest for a given file. Of course, it is up to you what kind
// of messages should the worker receive/send.

onmessage = (e) => {
  const file: File = e.data;
  const started = new Date();
  const reader = new FileReader();

  const resultMessage: ResultMessage = {
    total: 0,
    hash: null,
    remaining: 0,
    elapsed: new Date().getTime() - started.getTime(),
  };

  reader.onload = () => {
    // The result should always be a string in this case.
    const fileData = reader.result as string;

    // At this point, we know how much data we have.
    resultMessage.total = fileData.length;

    const hasher = new AsyncSha256();
    hasher.async_digest(
      fileData,
      (hash) => {
        // We are done.
        resultMessage.hash = hash;
        resultMessage.remaining = 0;
        resultMessage.elapsed = new Date().getTime() - started.getTime();

        postMessage(resultMessage);
      },
      (remaining) => {
        // Update progress.
        resultMessage.remaining = remaining;
        resultMessage.elapsed = new Date().getTime() - started.getTime();

        postMessage(resultMessage);
      },
    );
  };

  reader.readAsText(file);
};