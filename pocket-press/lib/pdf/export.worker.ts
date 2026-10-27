/// <reference lib="webworker" />
import { buildRequestPdf, type SheetRequest } from "./requests";

// PDF export runs off the main thread so the interface never freezes.
const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = async (e: MessageEvent<SheetRequest>) => {
  try {
    const bytes = await buildRequestPdf(e.data, {
      loadFont: async (file) => (await fetch(new URL(`/fonts/${file}`, scope.location.origin))).arrayBuffer(),
      onProgress: (done, total) => scope.postMessage({ type: "progress", done, total }),
    });
    scope.postMessage({ type: "done", bytes }, [bytes.buffer]);
  } catch (err) {
    scope.postMessage({ type: "error", error: err instanceof Error ? err.message : String(err) });
  }
};
