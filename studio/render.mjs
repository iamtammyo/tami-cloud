// Render an edit: draw the caption overlay frame by frame in headless Chromium
// (the same overlay.js the Edit Bay page previews with), composite it over the
// source with ffmpeg, and mix in the sound effects.
//
// usage: node render.mjs <source video> <edit.json> <out.mp4> [--preview]
//   --preview  720p copy sized to stay under 18 MB (for the Edit Bay page)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { probe, spawn } from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const preview = args.includes("--preview");
const [src, editPath, outPath] = args.filter((a) => !a.startsWith("--"));
if (!src || !editPath || !outPath) { console.error("usage: node render.mjs <source> <edit.json> <out.mp4> [--preview]"); process.exit(1); }

const edit = JSON.parse(fs.readFileSync(editPath, "utf8"));
const segments = (edit.segments || []).filter((s) => String(s.text || "").trim());
const info = probe(src);

// Overlay canvas: at most 1080 wide, same aspect as the source; ffmpeg scales
// it up to full size.
const even = (n) => Math.max(2, Math.round(n / 2) * 2);
const ow = even(Math.min(info.w, 1080));
const oh = even((ow * info.h) / info.w);
const fps = Math.min(info.fps, 30);
const total = Math.ceil(info.duration * fps);

// Output size and quality.
const portrait = info.h >= info.w;
const outScale = preview ? (portrait ? "scale=720:-2" : "scale=-2:720") : null;
const kbps = Math.max(400, Math.min(2500, Math.floor((17 * 8000) / Math.max(1, info.duration)) - 128));
const vcodec = preview
  ? ["-c:v", "libx264", "-preset", "veryfast", "-b:v", `${kbps}k`, "-maxrate", `${kbps}k`, "-bufsize", `${kbps * 2}k`]
  : ["-c:v", "libx264", "-preset", "medium", "-crf", "18"];

// Sound effects: one input per cue, delayed to its segment start.
const cues = segments.filter((s) => s.look?.sfx && s.look.sfx !== "none" && fs.existsSync(path.join(here, "sfx", s.look.sfx + ".mp3")));
const ffArgs = ["-v", "error", "-y", "-i", src, "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "pipe:0"];
cues.forEach((c) => ffArgs.push("-i", path.join(here, "sfx", c.look.sfx + ".mp3")));

let filter = `[1:v]scale=${info.w}:${info.h}:flags=lanczos[ov];[0:v][ov]overlay=0:0:eof_action=pass:format=auto${outScale ? "," + outScale : ""},format=yuv420p[v]`;
const mix = [];
if (info.hasAudio) mix.push("[0:a]");
cues.forEach((c, i) => {
  const ms = Math.round(c.start * 1000);
  filter += `;[${i + 2}:a]adelay=${ms}|${ms},volume=0.55[fx${i}]`;
  mix.push(`[fx${i}]`);
});
if (mix.length > 1) filter += `;${mix.join("")}amix=inputs=${mix.length}:duration=first:normalize=0[a]`;
ffArgs.push("-filter_complex", filter, "-map", "[v]");
if (mix.length > 1) ffArgs.push("-map", "[a]");
else if (info.hasAudio) ffArgs.push("-map", "0:a");
ffArgs.push(...vcodec, "-r", String(info.fps));
if (mix.length) ffArgs.push("-c:a", "aac", "-b:a", "128k");
ffArgs.push("-t", String(info.duration), "-movflags", "+faststart", outPath);

const ff = spawn("ffmpeg", ffArgs, { stdio: ["pipe", "inherit", "inherit"] });
const ffDone = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exited ${code}`)))));

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: ow, height: oh } });
  await page.goto(pathToFileURL(path.join(here, "frame.html")).href);
  await page.evaluate(([s, w, h]) => window.setup(s, w, h), [segments, ow, oh]);

  let lastKey = null, lastPng = null, drawn = 0;
  const started = Date.now();
  for (let f = 0; f < total; f++) {
    const key = await page.evaluate((t) => window.frame(t), f / fps);
    if (key !== lastKey || !lastPng) {
      lastPng = await page.screenshot({ type: "png", omitBackground: true, clip: { x: 0, y: 0, width: ow, height: oh } });
      lastKey = key; drawn++;
    }
    if (!ff.stdin.write(lastPng)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % Math.round(fps * 5) === 0) process.stdout.write(`\rframe ${f}/${total} (${drawn} drawn)`);
  }
  ff.stdin.end();
  await ffDone;
  console.log(`\rrendered ${total} frames (${drawn} drawn) in ${((Date.now() - started) / 1000).toFixed(1)}s -> ${outPath} (${(fs.statSync(outPath).size / 1e6).toFixed(1)} MB)`);
} finally {
  await browser.close();
}
