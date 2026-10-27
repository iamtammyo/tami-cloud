import { coverPlacement, type DrawOp } from "../render/ops";

type ImageOp = Extract<DrawOp, { kind: "image" }>;
export type PreparedImage = { bytes: Uint8Array; type: "jpg" | "png"; cropped: boolean };

const DPI = 300;
const QUALITY = 0.88;

function sniff(bytes: Uint8Array): "jpg" | "png" {
  return bytes[0] === 0x89 && bytes[1] === 0x50 ? "png" : "jpg";
}

/**
 * Cuts a photo down to exactly what its frame shows, at 300dpi, as JPEG q0.88.
 * Needs OffscreenCanvas (browsers and workers). Without it (Node tests) the
 * original goes in and the PDF crops it with a clip path instead.
 */
export async function prepareImage(src: Blob, op: ImageOp): Promise<PreparedImage> {
  if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap !== "function") {
    const bytes = new Uint8Array(await src.arrayBuffer());
    return { bytes, type: sniff(bytes), cropped: false };
  }
  const bitmap = await createImageBitmap(src);
  const k = bitmap.width / op.imgW;
  const { source } = coverPlacement(op.imgW, op.imgH, { x: 0, y: 0, w: op.w, h: op.h }, op.crop);
  const sw = source.w * k;
  const sh = source.h * k;
  let tw = Math.round((op.w / 72) * DPI);
  let th = Math.round((op.h / 72) * DPI);
  if (sw < tw) {
    // Never upscale past the photo's own pixels.
    th = Math.round(th * (sw / tw));
    tw = Math.round(sw);
  }
  const canvas = new OffscreenCanvas(Math.max(1, tw), Math.max(1, th));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, source.x * k, source.y * k, sw, sh, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: QUALITY });
  return { bytes: new Uint8Array(await blob.arrayBuffer()), type: "jpg", cropped: true };
}
