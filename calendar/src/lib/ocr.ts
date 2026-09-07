import { createWorker, type Worker } from "tesseract.js";

/**
 * Reads text out of a screenshot in the browser.
 *
 * Tesseract gives word-level bounding boxes, not a flat string, so the words
 * are regrouped into visual rows and columns before being handed to the text
 * parser. That matters: a course page is a table, and "Homework #1" only means
 * something next to the date on its own row.
 *
 * Everything is served from this origin (see scripts/setup-ocr.mjs), so no
 * model download and no request leaves the machine.
 */

// Must go through the app's base path: in production the site is served at
// /Calendar, and a bare "/tesseract" would resolve against the parent domain
// (outside the proxy) and 404.
const ASSET_BASE = `${(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}/tesseract`;

/** Row tolerance as a fraction of median text height. */
const ROW_OVERLAP_RATIO = 0.6;
/** A horizontal gap wider than this many spaces reads as a column break. */
const COLUMN_GAP_MULTIPLIER = 2.2;
/** Tesseract confidence below this is usually noise from icons and borders. */
const MIN_WORD_CONFIDENCE = 40;

interface Word {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

let workerPromise: Promise<Worker> | null = null;

/** One worker for the session — startup costs a second or two. */
function getWorker(): Promise<Worker> {
  workerPromise ??= createWorker("eng", 1, {
    workerPath: `${ASSET_BASE}/worker.min.js`,
    corePath: ASSET_BASE,
    langPath: ASSET_BASE,
    gzip: true,
  });
  return workerPromise;
}

export async function terminateOcr() {
  if (!workerPromise) return;
  const worker = await workerPromise;
  workerPromise = null;
  await worker.terminate();
}

function midHeight(w: Word) {
  return w.bbox.y1 - w.bbox.y0;
}

const centerY = (w: Word) => (w.bbox.y0 + w.bbox.y1) / 2;

/**
 * Group words into visual rows by comparing vertical centres.
 *
 * Comparing spans instead misses table rows whose cells use different font
 * sizes — on a Gradescope list the assignment title and its due date sit on the
 * same line but their boxes barely overlap, which split "Homework #1" away from
 * the date next to it and left the parser guessing.
 */
function groupIntoRows(words: Word[]): Word[][] {
  const sorted = [...words].sort((a, b) => centerY(a) - centerY(b));
  const heights = sorted.map(midHeight).sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)] || 10;
  const tolerance = medianHeight * ROW_OVERLAP_RATIO;

  const rows: Word[][] = [];
  let current: Word[] = [];
  let rowCentre = -Infinity;

  for (const word of sorted) {
    if (current.length === 0 || Math.abs(centerY(word) - rowCentre) <= tolerance) {
      current.push(word);
      // Track the running centre so a tall row does not drift.
      rowCentre = current.reduce((sum, w) => sum + centerY(w), 0) / current.length;
    } else {
      rows.push(current);
      current = [word];
      rowCentre = centerY(word);
    }
  }
  if (current.length) rows.push(current);

  return rows;
}

/**
 * Join a row back into text, turning wide horizontal gaps into a separator so
 * the parser can still tell "Homework #1" from the date column beside it.
 */
function rowToText(row: Word[]): string {
  const words = [...row].sort((a, b) => a.bbox.x0 - b.bbox.x0);
  const charWidth =
    words.reduce((sum, w) => sum + (w.bbox.x1 - w.bbox.x0) / Math.max(w.text.length, 1), 0) /
    words.length;

  let line = words[0].text;
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].bbox.x0 - words[i - 1].bbox.x1;
    line += gap > charWidth * COLUMN_GAP_MULTIPLIER ? `  |  ${words[i].text}` : ` ${words[i].text}`;
  }
  return line;
}

export interface OcrResult {
  text: string;
  /** Mean word confidence, 0-100. Low means the screenshot was hard to read. */
  confidence: number;
}

/** v7 only returns the block tree when asked; flatten it back to words. */
function collectWords(data: { blocks?: unknown }): Word[] {
  const words: Word[] = [];

  for (const block of (data.blocks ?? []) as any[]) {
    for (const paragraph of block?.paragraphs ?? []) {
      for (const line of paragraph?.lines ?? []) {
        for (const word of line?.words ?? []) {
          if (word?.text?.trim() && word.bbox) {
            words.push({ text: word.text, confidence: word.confidence ?? 0, bbox: word.bbox });
          }
        }
      }
    }
  }

  return words;
}

export async function readImage(dataUrl: string): Promise<OcrResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(dataUrl, {}, { blocks: true, text: true });

  const words = collectWords(data).filter((w) => w.confidence >= MIN_WORD_CONFIDENCE);

  if (words.length === 0) {
    return { text: (data.text ?? "").trim(), confidence: data.confidence ?? 0 };
  }

  const text = groupIntoRows(words)
    .map(rowToText)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  const confidence = words.reduce((sum, w) => sum + w.confidence, 0) / words.length;

  return { text, confidence };
}

/** Reads several screenshots and returns one document for the parser. */
export async function readImages(dataUrls: string[]): Promise<OcrResult> {
  const results = await Promise.all(dataUrls.map(readImage));
  const usable = results.filter((r) => r.text);

  return {
    text: usable.map((r) => r.text).join("\n\n"),
    confidence: usable.length
      ? usable.reduce((sum, r) => sum + r.confidence, 0) / usable.length
      : 0,
  };
}
