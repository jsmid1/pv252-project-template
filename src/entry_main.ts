import {
  allComponents,
  provideFluentDesignSystem,
} from "@fluentui/web-components";
import UIkit from "uikit";
import { HashElement } from "./hash_element.js";
// For some reason, TypeScript has some problem recognizing the types within the UIKit namespace.
// This ensures the types are recognized properly, but ideally we would find a better way to resolve this.
const kit = UIkit as unknown as typeof UIkit.default;
// Make everything use microsoft fluent by default.
provideFluentDesignSystem().register(allComponents);

const upload = document.getElementById("sha-upload-input")! as HTMLInputElement;

// For each file, check its size (100MB), and if it is small enough, add a new HashElement
// to the digest list.
function processFile(file: File) {
  if (file.size > 100_000_000) {
    kit.notification({
      message: `File "${file.name}" is too large.`,
      status: "danger",
      pos: "bottom-right",
    });
  } else {
    const el = new HashElement(file);
    document.getElementById("sha-digests")!.prepend(el);
  }
}

// Invoke processFile for every file that was selected, and then
// clear the upload value to make sure new files can be added later.
function onFiles() {
  const fileList = upload.files;
  if (fileList !== null) {
    for (let i = 0; i < fileList.length; i++) {
      const item = fileList.item(i);
      if (item !== null) {
        processFile(item);
      }
    }
  }
  upload.value = "";
}

upload.addEventListener("change", onFiles);

// For Webpack to recognize that this is a webworker, we have to use `new URL(...)`
// and can't just use "./worker_example.js" directly.
const pong_worker = new Worker(new URL("./worker_example.js", import.meta.url));
pong_worker.onmessage = (e) => {
  console.log("Received from worker:", e.data);
};

pong_worker.postMessage("Ping!");
pong_worker.postMessage("Second message");
