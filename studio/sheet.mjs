// Contact sheet: 12 timestamped frames from a clip in one image, so Claude can
// see what's in it when sorting A-roll and B-roll.
//
// usage: node sheet.mjs <clip> <out.jpg>
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run, probe } from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const [clip, out] = process.argv.slice(2);
if (!clip || !out) { console.error("usage: node sheet.mjs <clip> <out.jpg>"); process.exit(1); }
const info = probe(clip);
const n = 12, step = Math.max(0.1, info.duration / n);
const font = path.join(here, "fonts", "Inter.ttf").replace(/:/g, "\\:");
const tileW = info.h >= info.w ? 240 : 360;
run("ffmpeg", ["-v", "error", "-y", "-i", clip, "-vf",
  `fps=1/${step},scale=${tileW}:-2,drawtext=fontfile='${font}':text='%{pts\\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4,tile=4x3:padding=4:color=black`,
  "-frames:v", "1", "-q:v", "4", out]);
console.log(`${out}: ${n} frames, every ${step.toFixed(1)}s of ${info.duration.toFixed(1)}s (${info.w}x${info.h})`);
