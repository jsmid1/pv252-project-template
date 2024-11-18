import { AsyncSha256 } from "./sha-256.js";

// In this file, you can define the worker script that will compute the
// hash digest for a given file. Of course, it is up to you what kind
// of messages should the worker receive/send.

const hasher = new AsyncSha256();
hasher.async_digest(
  "Some data (represented as string)",
  (hash) => console.log(hash),
  (remaining) => console.log(remaining),
);
