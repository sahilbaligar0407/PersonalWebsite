/** Longest edge sent to the vision model. Bigger costs time without reading better. */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

export const MAX_ATTACHMENTS = 4;

export interface Attachment {
  id: string;
  name: string;
  dataUrl: string;
}

export function isImageFile(file: File | null | undefined): file is File {
  return !!file && file.type.startsWith("image/");
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name || "the image"}.`));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file isn't a readable image."));
    img.src = src;
  });
}

/**
 * Shrink oversized screenshots in the browser. A full 4K screen grab is several
 * MB of base64 and slows the model down for no gain in legibility.
 */
export async function fileToAttachment(file: File): Promise<Attachment> {
  const original = await readAsDataUrl(file);
  const name = file.name || "pasted image";
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const img = await loadImage(original);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));

  // Already small enough, and not a format the canvas would re-encode badly.
  if (scale === 1 && original.length < 3_000_000) {
    return { id, name, dataUrl: original };
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { id, name, dataUrl: original };

  // Screenshots are usually flat UI on white; a white matte avoids black
  // backgrounds where a transparent PNG gets flattened into JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return { id, name, dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY) };
}

/** Pulls image files out of a paste event's clipboard payload. */
export function imagesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return [];
  return Array.from(data.files).filter(isImageFile);
}
