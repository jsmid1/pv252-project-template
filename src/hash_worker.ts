import {
  JobDoneMessage,
  JobStartMessage,
  ProgressMessage,
} from "./hash_worker_messages.js";
import { AsyncSha256 } from "./sha-256.js";

function onJobDone(hash: string): void {
  const message: JobDoneMessage = {
    hash: hash,
  };
  postMessage(message);
}

function onJobProgress(total: number, remaining: number): void {
  const message: ProgressMessage = {
    total: total,
    remaining: remaining,
  };
  postMessage(message);
}

onmessage = (msg) => {
  let data = msg.data as JobStartMessage;
  const file = data.file;
  onJobProgress(-1, -1);
  const reader = new FileReader();
  reader.onload = () => {
    // The result should always be a string in this case.
    const fileData = reader.result as string;
    const totalLength = fileData.length;
    onJobProgress(fileData.length, 0);

    const hasher = new AsyncSha256();
    hasher.async_digest(
      fileData,
      (hash) => onJobDone(hash),
      (remaining) => onJobProgress(totalLength, remaining),
    );
  };
  reader.readAsText(file);
};
