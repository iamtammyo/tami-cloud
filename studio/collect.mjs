// Turn an Edit Bay database dump into an edit.json for render.mjs.
//
// usage: node collect.mjs <db dump dir> <media dir> <out edit.json>
//   db dump dir: ArtifactData reads saved with out_dir (segments/*.json, clips/*.json)
//   media dir:   downloaded clips named <clipId>.<ext>
import fs from "node:fs";
import path from "node:path";

const [dbDir, mediaDir, out] = process.argv.slice(2);
if (!dbDir || !mediaDir || !out) { console.error("usage: node collect.mjs <db dump dir> <media dir> <out edit.json>"); process.exit(1); }

const read = (coll) => {
  const dir = path.join(dbDir, coll);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const doc = raw.data && typeof raw.data === "object" ? raw.data : raw;
    return { id: raw.id || path.basename(f, ".json"), ...doc };
  });
};

const media = fs.existsSync(mediaDir) ? fs.readdirSync(mediaDir) : [];
const fileFor = (id) => { const f = media.find((m) => path.parse(m).name === id); return f ? path.resolve(mediaDir, f) : null; };

const segments = read("segments").sort((a, b) => a.start - b.start)
  .map(({ id, start, end, text, words, look, broll }) => ({ id, start, end, text, words, look, broll }));
const clips = {};
for (const c of read("clips")) clips[c.id] = { file: fileFor(c.id), name: c.name, role: c.role };

const missing = Object.entries(clips).filter(([, c]) => !c.file).map(([id, c]) => `${id} (${c.name})`);
fs.writeFileSync(out, JSON.stringify({ segments, clips }, null, 2));
console.log(`${segments.length} segments, ${Object.keys(clips).length} clips -> ${out}`);
if (missing.length) console.log(`no local file yet for: ${missing.join(", ")}`);
