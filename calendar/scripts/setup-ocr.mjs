/**
 * Copies the Tesseract worker + wasm core into public/tesseract and fetches the
 * English model, so OCR runs entirely from this origin with no CDN at runtime.
 * Runs automatically after `npm install`.
 */
import { cp, mkdir, access, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "tesseract");

// Only the LSTM builds are used for recognition; the rest of the core package
// is legacy-engine weight we do not need.
const CORE_FILES = [
  // Tesseract picks a build at runtime from the browser's wasm features, so
  // ship every LSTM variant. Chrome prefers relaxed-SIMD.
  "tesseract-core-relaxedsimd-lstm.wasm.js",
  "tesseract-core-relaxedsimd-lstm.wasm",
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-simd-lstm.wasm",
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-lstm.wasm",
];

const LANG_URL =
  "https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz";

const exists = (p) => access(p).then(() => true, () => false);

await mkdir(outDir, { recursive: true });

await cp(
  join(root, "node_modules", "tesseract.js", "dist", "worker.min.js"),
  join(outDir, "worker.min.js")
);

for (const file of CORE_FILES) {
  await cp(join(root, "node_modules", "tesseract.js-core", file), join(outDir, file));
}

const langFile = join(outDir, "eng.traineddata.gz");
if (!(await exists(langFile))) {
  // This runs as a postinstall inside the Docker build. A CDN hiccup must not
  // fail the image build over an asset OCR can also fetch at runtime.
  try {
    const res = await fetch(LANG_URL);
    if (!res.ok) {
      console.warn(`OCR language data download failed (${res.status}); OCR will fall back to the CDN.`);
    } else {
      await writeFile(langFile, Buffer.from(await res.arrayBuffer()));
    }
  } catch (err) {
    console.warn(`OCR language data unreachable (${err.message}); OCR will fall back to the CDN.`);
  }
}

console.log("OCR assets ready in public/tesseract");
