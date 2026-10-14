// Prepare a clip for the Edit Bay:
//   1. a web-friendly preview copy (H.264 MP4, under 18 MB) for the page
//   2. caption segments from Whisper, or from an SRT you already have
//
// usage: node prepare.mjs <video> [--srt captions.srt] [--out work/name] [--no-transcribe]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run, probe, decodeAudio, wordsToSegments, chunksToWords, parseSrt } from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : null; };
const srt = flag("--srt");
const noTranscribe = args.includes("--no-transcribe") && args.splice(args.indexOf("--no-transcribe"), 1);
const outArg = flag("--out");
const src = args[0];
if (!src) { console.error("usage: node prepare.mjs <video> [--srt captions.srt] [--out dir] [--no-transcribe]"); process.exit(1); }

const out = path.resolve(outArg || path.join(here, "work", path.parse(src).name));
fs.mkdirSync(out, { recursive: true });
const info = probe(src);
console.log(`source: ${info.w}x${info.h} @ ${info.fps}fps, ${info.duration.toFixed(1)}s`);

// Preview copy: short side 720px, bitrate sized to stay under the 18 MB
// asset limit (the artifact store takes up to 20 MB).
const portrait = info.h >= info.w;
const scale = portrait ? "scale=720:-2" : "scale=-2:720";
const kbps = Math.max(400, Math.min(2500, Math.floor((17 * 8000) / Math.max(1, info.duration)) - 96));
const proxy = path.join(out, "proxy.mp4");
run("ffmpeg", ["-v", "error", "-y", "-i", src, "-vf", scale, "-c:v", "libx264", "-preset", "veryfast",
  "-b:v", `${kbps}k`, "-maxrate", `${kbps}k`, "-bufsize", `${kbps * 2}k`, "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", proxy]);
console.log(`preview copy: ${proxy} (${(fs.statSync(proxy).size / 1e6).toFixed(1)} MB)`);

let segments = [];
if (srt) {
  segments = wordsToSegments(chunksToWords(parseSrt(fs.readFileSync(srt, "utf8"))));
  console.log(`captions from ${srt}: ${segments.length} segments`);
} else if (!noTranscribe && info.hasAudio) {
  segments = await transcribe(src);
  console.log(`transcribed: ${segments.length} segments`);
}

segments = segments.map((s, i) => ({
  id: "s" + String(i + 1).padStart(4, "0"),
  i, start: round(s.start), end: round(s.end), text: s.text,
  ...(s.words ? { words: s.words.map((w) => ({ s: round(w.s), e: round(w.e) })) } : {}),
}));
const edit = { video: info, segments };
fs.writeFileSync(path.join(out, "edit.json"), JSON.stringify(edit, null, 2));
console.log(`edit file: ${path.join(out, "edit.json")}`);

function round(x) { return Math.round(x * 1000) / 1000; }

async function transcribe(file) {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.localModelPath = path.join(here, "models");
  env.cacheDir = path.join(here, "models", ".cache");
  let asr;
  try {
    asr = await pipeline("automatic-speech-recognition", "Xenova/whisper-small", { dtype: "q8" });
  } catch (e) {
    console.error(`\nCouldn't load the speech model (${e.message}).\n` +
      "Either allow huggingface.co in this environment's network settings, or pass captions with --srt.");
    process.exit(2);
  }
  const audio = decodeAudio(file);
  const opts = { chunk_length_s: 30, stride_length_s: 5, language: "english", task: "transcribe" };
  let words;
  try {
    const r = await asr(audio, { ...opts, return_timestamps: "word" });
    words = r.chunks.map((c) => ({ w: c.text.trim(), s: c.timestamp[0], e: c.timestamp[1] ?? c.timestamp[0] + 0.3 })).filter((w) => w.w);
  } catch {
    // This model export may not carry word alignment; fall back to phrase
    // timestamps and spread words across each phrase.
    const r = await asr(audio, { ...opts, return_timestamps: true });
    words = chunksToWords(r.chunks.map((c) => ({ text: c.text, start: c.timestamp[0], end: c.timestamp[1] ?? c.timestamp[0] + 2 })));
  }
  return wordsToSegments(words);
}
