import type { Asset } from "./types";
import { uid } from "./zine";

// Photo import: HEIC → JPEG when the browser can't decode it, EXIF date + GPS,
// a 3000px working copy, a 400px thumbnail, and caption-contrast luminance.

const FULL_EDGE = 3000;
const THUMB_EDGE = 400;

export function isHeic(file: File) {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

async function decodable(blob: Blob) {
  try {
    const bmp = await createImageBitmap(blob);
    bmp.close();
    return true;
  } catch {
    return false;
  }
}

function makeCanvas(w: number, h: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

async function toJpeg(canvas: OffscreenCanvas | HTMLCanvasElement, quality: number): Promise<Blob> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type: "image/jpeg", quality });
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode image"))), "image/jpeg", quality),
  );
}

function resized(bmp: ImageBitmap, edge: number) {
  const k = Math.min(1, edge / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k));
  const h = Math.max(1, Math.round(bmp.height * k));
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, w, h);
  return { canvas, ctx, w, h };
}

function bandLuma(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, w: number, h: number) {
  const band = Math.max(1, Math.round(h / 8));
  const avg = (y: number) => {
    const d = ctx.getImageData(0, y, w, band).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    return Math.round((sum / (d.length / 4)) * 1000) / 1000;
  };
  return { top: avg(0), bottom: avg(h - band) };
}

type ExifTags = { DateTimeOriginal?: Date; CreateDate?: Date; latitude?: number; longitude?: number };

export async function readExif(file: Blob): Promise<{ takenAt?: string; gps?: { lat: number; lng: number } }> {
  try {
    const exifr = (await import("exifr")).default;
    const tags = (await exifr.parse(file, { gps: true, exif: true, tiff: true, xmp: false, icc: false })) as ExifTags | undefined;
    const when = tags?.DateTimeOriginal ?? tags?.CreateDate;
    const gps =
      typeof tags?.latitude === "number" && typeof tags?.longitude === "number" && (tags.latitude !== 0 || tags.longitude !== 0)
        ? { lat: tags.latitude, lng: tags.longitude }
        : undefined;
    return { takenAt: when instanceof Date && !isNaN(+when) ? when.toISOString() : undefined, gps };
  } catch {
    return {};
  }
}

export async function importPhoto(file: File, zineId: string): Promise<Asset> {
  let source: Blob = file;
  if (isHeic(file) && !(await decodable(file))) {
    const { heicTo } = await import("heic-to/next");
    source = await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 });
  }
  const exif = await readExif(file);
  const bmp = await createImageBitmap(source);
  const full = resized(bmp, FULL_EDGE);
  const thumb = resized(bmp, THUMB_EDGE);
  bmp.close();
  return {
    id: uid(),
    zineId,
    name: file.name,
    blob: await toJpeg(full.canvas, 0.9),
    thumb: await toJpeg(thumb.canvas, 0.8),
    width: full.w,
    height: full.h,
    luma: bandLuma(thumb.ctx, thumb.w, thumb.h),
    takenAt: exif.takenAt,
    gps: exif.gps,
    createdAt: new Date().toISOString(),
  };
}
