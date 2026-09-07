// Ephemeral OCR: read a screenshot buffer, extract text, discard the image.
// We never persist uploads — the buffer lives only for the duration of the scan.
import { createWorker } from "tesseract.js";

// A single reusable worker keeps cold-start cost off the request path.
let workerPromise = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng");
  }
  return workerPromise;
}

export async function extractTextFromImage(buffer) {
  const worker = await getWorker();
  const {
    data: { text },
  } = await worker.recognize(buffer);
  return (text || "").trim();
}
