import type { TestSheetRequest } from "./testSheet";

type WorkerReply = { ok: true; bytes: Uint8Array } | { ok: false; error: string };

/** Builds the PDF in a Web Worker, falling back to the main thread if workers aren't available. */
export async function exportTestSheet(req: TestSheetRequest): Promise<Uint8Array> {
  if (typeof Worker === "undefined") return mainThread(req);
  let worker: Worker;
  try {
    worker = new Worker(new URL("./export.worker.ts", import.meta.url));
  } catch {
    return mainThread(req);
  }
  try {
    return await new Promise<Uint8Array>((resolve, reject) => {
      worker.onmessage = (e: MessageEvent<WorkerReply>) =>
        e.data.ok ? resolve(e.data.bytes) : reject(new Error(e.data.error));
      worker.onerror = (e) => reject(new Error(e.message || "PDF worker failed"));
      worker.postMessage(req);
    });
  } finally {
    worker.terminate();
  }
}

async function mainThread(req: TestSheetRequest) {
  const { buildTestSheetPdf } = await import("./testSheet");
  return buildTestSheetPdf(req);
}

export function downloadBytes(bytes: Uint8Array, fileName: string) {
  const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
