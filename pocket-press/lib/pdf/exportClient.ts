import type { SheetRequest } from "./requests";

type WorkerReply =
  | { type: "progress"; done: number; total: number }
  | { type: "done"; bytes: Uint8Array }
  | { type: "error"; error: string };

/** Builds the PDF in a Web Worker, falling back to the main thread if workers aren't available. */
export async function exportSheet(req: SheetRequest, onProgress?: (done: number, total: number) => void): Promise<Uint8Array> {
  let worker: Worker | null = null;
  try {
    worker = new Worker(new URL("./export.worker.ts", import.meta.url));
  } catch {
    worker = null;
  }
  if (!worker) return mainThread(req, onProgress);
  const w = worker;
  try {
    return await new Promise<Uint8Array>((resolve, reject) => {
      w.onmessage = (e: MessageEvent<WorkerReply>) => {
        if (e.data.type === "progress") onProgress?.(e.data.done, e.data.total);
        else if (e.data.type === "done") resolve(e.data.bytes);
        else reject(new Error(e.data.error));
      };
      w.onerror = (e) => reject(new Error(e.message || "PDF worker failed"));
      w.postMessage(req);
    });
  } finally {
    w.terminate();
  }
}

async function mainThread(req: SheetRequest, onProgress?: (done: number, total: number) => void) {
  const { buildRequestPdf } = await import("./requests");
  return buildRequestPdf(req, {
    loadFont: async (file) => (await fetch(`/fonts/${file}`)).arrayBuffer(),
    onProgress,
  });
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
