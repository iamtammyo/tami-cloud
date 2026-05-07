"use client";

import exifr from "exifr";
import type { Exif } from "./types";

export async function extractExif(file: File): Promise<Exif | null> {
  try {
    const raw = (await exifr.parse(file, {
      pick: [
        "Make",
        "Model",
        "LensModel",
        "LensMake",
        "FocalLength",
        "FocalLengthIn35mmFormat",
        "FNumber",
        "ExposureTime",
        "ISO",
        "DateTimeOriginal",
        "Orientation",
      ],
    })) as Record<string, unknown> | undefined;
    if (!raw) return null;

    const exif: Exif = {
      cameraMake: typeof raw.Make === "string" ? raw.Make : undefined,
      cameraModel: typeof raw.Model === "string" ? raw.Model : undefined,
      lensModel: typeof raw.LensModel === "string" ? raw.LensModel : undefined,
      focalLength: typeof raw.FocalLength === "number" ? raw.FocalLength : undefined,
      focalLength35: typeof raw.FocalLengthIn35mmFormat === "number"
        ? raw.FocalLengthIn35mmFormat
        : undefined,
      aperture: typeof raw.FNumber === "number" ? raw.FNumber : undefined,
      shutterSeconds: typeof raw.ExposureTime === "number" ? raw.ExposureTime : undefined,
      iso: typeof raw.ISO === "number" ? raw.ISO : undefined,
      dateTaken: raw.DateTimeOriginal instanceof Date
        ? raw.DateTimeOriginal.toISOString()
        : typeof raw.DateTimeOriginal === "string"
          ? raw.DateTimeOriginal
          : undefined,
    };

    const hasAny = Object.values(exif).some((v) => v !== undefined);
    return hasAny ? exif : null;
  } catch {
    return null;
  }
}

export function formatAperture(f: number | undefined): string | null {
  if (typeof f !== "number" || !isFinite(f) || f <= 0) return null;
  return `f/${f >= 10 ? Math.round(f) : f.toFixed(1).replace(/\.0$/, "")}`;
}

export function formatShutter(s: number | undefined): string | null {
  if (typeof s !== "number" || !isFinite(s) || s <= 0) return null;
  if (s >= 1) return `${s % 1 === 0 ? s : s.toFixed(1)}s`;
  return `1/${Math.round(1 / s)}s`;
}

export function formatFocal(mm: number | undefined): string | null {
  if (typeof mm !== "number" || !isFinite(mm)) return null;
  return `${Math.round(mm)}mm`;
}

export function formatIso(iso: number | undefined): string | null {
  if (typeof iso !== "number" || !isFinite(iso)) return null;
  return `ISO ${Math.round(iso)}`;
}

export function formatCamera(exif: Exif): string | null {
  const parts = [exif.cameraMake, exif.cameraModel].filter(Boolean) as string[];
  if (parts.length === 0) return null;
  if (parts.length === 2 && parts[1].toLowerCase().startsWith(parts[0].toLowerCase())) {
    return parts[1];
  }
  return parts.join(" ");
}

export function exifSummaryLine(exif: Exif): string | null {
  const bits = [
    formatFocal(exif.focalLength),
    formatAperture(exif.aperture),
    formatShutter(exif.shutterSeconds),
    formatIso(exif.iso),
  ].filter(Boolean);
  if (bits.length === 0) return null;
  return bits.join(" · ");
}

export function exifPromptString(exif: Exif): string {
  const parts: string[] = [];
  const cam = formatCamera(exif);
  if (cam) parts.push(`Camera: ${cam}`);
  if (exif.lensModel) parts.push(`Lens: ${exif.lensModel}`);
  const focal = formatFocal(exif.focalLength);
  if (focal) parts.push(`Focal length: ${focal}`);
  const ap = formatAperture(exif.aperture);
  if (ap) parts.push(`Aperture: ${ap}`);
  const shutter = formatShutter(exif.shutterSeconds);
  if (shutter) parts.push(`Shutter: ${shutter}`);
  const iso = formatIso(exif.iso);
  if (iso) parts.push(iso);
  return parts.join(", ");
}
