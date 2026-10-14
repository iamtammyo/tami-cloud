// Shared helpers for prepare.mjs and render.mjs.
import { execFileSync, spawn } from "node:child_process";

export function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 30, ...opts });
}

// Display size (rotation applied), duration, fps and whether there is audio.
export function probe(file) {
  const j = JSON.parse(run("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file]).toString());
  const v = j.streams.find((s) => s.codec_type === "video");
  if (!v) throw new Error(`${file} has no video stream`);
  let rot = 0;
  for (const sd of v.side_data_list || []) if (sd.rotation != null) rot = Number(sd.rotation);
  if (v.tags?.rotate) rot = Number(v.tags.rotate);
  const swap = Math.abs(rot) % 180 === 90;
  const [n, d] = String(v.avg_frame_rate || v.r_frame_rate || "30/1").split("/").map(Number);
  const fps = d ? n / d : 30;
  return {
    w: swap ? v.height : v.width,
    h: swap ? v.width : v.height,
    fps: fps > 0 && fps < 121 ? Math.round(fps * 1000) / 1000 : 30,
    duration: Number(j.format.duration || v.duration || 0),
    hasAudio: j.streams.some((s) => s.codec_type === "audio"),
  };
}

// 16 kHz mono float PCM, the input Whisper expects.
export function decodeAudio(file) {
  const buf = run("ffmpeg", ["-v", "error", "-i", file, "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"]);
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

// Words [{w, s, e}] -> caption segments of a few words each. Breaks at
// sentence ends, then commas and pauses, then splits long phrases into even
// chunks so no caption is left holding one stray word.
export function wordsToSegments(words, { maxWords = 6, gap = 0.45 } = {}) {
  const phrases = [];
  let cur = [];
  words.forEach((w, i) => {
    const next = words[i + 1];
    cur.push(w);
    const end = /[.!?]$/.test(w.w);
    const soft = /[,;:]$/.test(w.w) && cur.length >= 3;
    const pause = next && next.s - w.e > gap && cur.length >= 2;
    if (!next || end || soft || pause) { phrases.push(cur); cur = []; }
  });
  // Fold one- and two-word scraps into the phrase before when it stays short.
  const merged = [];
  phrases.forEach((p) => {
    const prev = merged[merged.length - 1];
    if (prev && p.length <= 2 && prev.length + p.length <= maxWords + 1 && !/[.!?]$/.test(prev[prev.length - 1].w)) prev.push(...p);
    else merged.push(p);
  });
  const segs = [];
  merged.forEach((p) => {
    const k = p.length <= maxWords + 2 ? 1 : Math.ceil(p.length / maxWords);
    const size = Math.ceil(p.length / k);
    for (let i = 0; i < p.length; i += size) {
      const part = p.slice(i, i + size);
      segs.push({ start: part[0].s, end: part[part.length - 1].e, text: part.map((w) => w.w).join(" "), words: part.map(({ s, e }) => ({ s, e })) });
    }
  });
  // Hold each caption until the next one starts (short gaps only), so text
  // doesn't flicker off between phrases.
  segs.forEach((s, i) => {
    const next = segs[i + 1];
    if (next && next.start - s.end < 0.6) s.end = next.start;
    else s.end += 0.25;
  });
  return segs;
}

// Phrase chunks [{text, start, end}] -> words, with times spread by length.
export function chunksToWords(chunks) {
  const words = [];
  for (const c of chunks) {
    const parts = c.text.trim().split(/\s+/).filter(Boolean);
    const total = parts.reduce((a, p) => a + p.length + 1, 0) || 1;
    let acc = 0;
    for (const p of parts) {
      const s = c.start + ((c.end - c.start) * acc) / total;
      acc += p.length + 1;
      words.push({ w: p, s, e: c.start + ((c.end - c.start) * acc) / total });
    }
  }
  return words;
}

export function parseSrt(text) {
  const t = (x) => { const [h, m, s] = x.replace(",", ".").split(":"); return +h * 3600 + +m * 60 + parseFloat(s); };
  return text.replace(/\r/g, "").split(/\n\n+/).map((block) => {
    const lines = block.trim().split("\n");
    const i = lines.findIndex((l) => l.includes("-->"));
    if (i < 0) return null;
    const [a, b] = lines[i].split("-->").map((s) => t(s.trim().split(" ")[0]));
    return { start: a, end: b, text: lines.slice(i + 1).join(" ").replace(/<[^>]+>/g, "").trim() };
  }).filter((c) => c && c.text);
}

export { spawn };
