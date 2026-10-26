/// <reference lib="webworker" />
import { buildTestSheetPdf, type TestSheetRequest } from "./testSheet";

// PDF export runs off the main thread so the interface never freezes.
self.onmessage = async (e: MessageEvent<TestSheetRequest>) => {
  try {
    const bytes = await buildTestSheetPdf(e.data);
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ ok: true, bytes }, [bytes.buffer]);
  } catch (err) {
    self.postMessage({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
