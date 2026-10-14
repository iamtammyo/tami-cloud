/*
 * Edit Bay overlay renderer.
 *
 * One file, two jobs: the Edit Bay page uses it for the live preview, and
 * render.mjs loads it in headless Chromium to draw every frame of the export.
 * Everything here is a pure function of (segments, time), so the preview and
 * the render can't drift apart.
 *
 * Sizes are fractions of the video height and are written in `cqh` units, so
 * the root element must be a size container with the video's aspect ratio.
 */
(function (global) {
  "use strict";

  // Caption looks. size = font size as a fraction of video height.
  var STYLES = {
    block: {
      label: "Block caps",
      hint: "Heavy all-caps on a dark slab, left aligned",
      font: "'Archivo Black', 'Arial Black', sans-serif",
      size: 0.05, maxChars: 12, align: "left", upper: true,
      color: "#ffffff", accent: "#ffd23f", box: "#111111"
    },
    serif: {
      label: "Serif accent",
      hint: "Soft editorial serif; *starred* words go big and italic",
      font: "'Instrument Serif', Georgia, serif",
      size: 0.036, maxChars: 22, align: "center",
      color: "#ffffff", accent: "#ffffff", shadow: true, emphScale: 2.1
    },
    hand: {
      label: "Handwritten",
      hint: "Marker-style note written over the shot",
      font: "'Caveat', 'Comic Sans MS', cursive",
      size: 0.046, maxChars: 20, align: "center", weight: 700,
      color: "#ffffff", accent: "#ffd23f", shadow: true, tilt: -2
    },
    clean: {
      label: "Clean caption",
      hint: "Readable subtitle with a yellow keyword",
      font: "'Inter', Helvetica, Arial, sans-serif",
      size: 0.036, maxChars: 24, align: "center", weight: 700,
      color: "#ffffff", accent: "#ffd23f", outline: true
    },
    sticker: {
      label: "Sticker",
      hint: "Rounded pill, like an IG story text label",
      font: "'Inter', Helvetica, Arial, sans-serif",
      size: 0.034, maxChars: 20, align: "center", weight: 700,
      color: "#e0313b", accent: "#111111", pill: "#fde2e4"
    }
  };

  // Vertical anchor (center of the text block), fraction of height.
  var PLACES = {
    top: { label: "Top", y: 0.16 },
    upper: { label: "Upper", y: 0.3 },
    middle: { label: "Middle", y: 0.5 },
    lower: { label: "Lower third", y: 0.68 },
    bottom: { label: "Bottom", y: 0.8 }
  };

  var MOTIONS = {
    none: { label: "None" },
    fade: { label: "Fade in", dur: 0.25 },
    pop: { label: "Pop", dur: 0.3 },
    slide: { label: "Slide up", dur: 0.32 },
    build: { label: "Word by word", dur: 0.09 }
  };

  var SFX = {
    none: { label: "None" },
    pop: { label: "Pop" },
    whoosh: { label: "Whoosh" },
    click: { label: "Click" },
    ding: { label: "Ding" }
  };

  var DEFAULT_LOOK = { style: "block", place: "lower", y: 0.68, size: 1, motion: "build", sfx: "none" };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOutCubic(p) { return 1 - Math.pow(1 - p, 3); }
  function easeOutBack(p) { var c = 1.7; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }

  function look(seg) {
    var l = {}, k, src = seg.look || {};
    for (k in DEFAULT_LOOK) l[k] = src[k] != null ? src[k] : DEFAULT_LOOK[k];
    if (!STYLES[l.style]) l.style = DEFAULT_LOOK.style;
    if (!MOTIONS[l.motion]) l.motion = "none";
    return l;
  }

  // Words with their emphasis flag. "*word*" marks emphasis; newlines are kept
  // as explicit line breaks.
  function tokenize(text) {
    var out = [], open = false, lines = String(text || "").split(/\n/);
    lines.forEach(function (line, li) {
      line.split(/\s+/).filter(Boolean).forEach(function (raw, wi) {
        var starts = raw.charAt(0) === "*", ends = raw.length > 1 && raw.charAt(raw.length - 1) === "*";
        var em = open || starts;
        if (starts && !ends) open = true;
        if (ends && (open || starts)) open = false;
        var word = raw.replace(/^\*+|\*+$/g, "");
        if (word) out.push({ text: word, em: em, br: li > 0 && wi === 0 });
      });
    });
    return out;
  }

  // Greedy wrap by character count, honouring manual breaks.
  function layout(tokens, maxChars) {
    var lines = [], cur = [], len = 0;
    tokens.forEach(function (t, i) {
      var add = t.text.length + (cur.length ? 1 : 0);
      if (cur.length && (t.br || len + add > maxChars)) { lines.push(cur); cur = []; len = 0; add = t.text.length; }
      cur.push(i); len += add;
    });
    if (cur.length) lines.push(cur);
    return lines;
  }

  // Start time of each word. Uses transcript word timings when the text still
  // has the same word count; otherwise spreads words by length across 85% of
  // the segment.
  function wordStarts(seg, tokens) {
    var w = seg.words;
    if (w && w.length === tokens.length) return w.map(function (x) { return x.s; });
    var total = 0, acc = 0, span = (seg.end - seg.start) * 0.85;
    tokens.forEach(function (t) { total += t.text.length + 1; });
    return tokens.map(function (t) {
      var s = seg.start + (total ? (acc / total) * span : 0);
      acc += t.text.length + 1;
      return s;
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  // Frame state for one segment at time t, or null when it isn't on screen.
  function segState(seg, t) {
    if (!(t >= seg.start && t < seg.end) || !String(seg.text || "").trim()) return null;
    var l = look(seg), st = STYLES[l.style], m = MOTIONS[l.motion];
    var tokens = tokenize(seg.text), local = t - seg.start, tail = seg.end - t;
    var opacity = 1, scale = 1, dy = 0, visible = tokens.length, wordFade = null;

    if (l.motion === "fade") opacity = easeOutCubic(clamp(local / m.dur, 0, 1));
    if (l.motion === "pop") {
      var p = clamp(local / m.dur, 0, 1);
      scale = 0.6 + 0.4 * easeOutBack(p);
      opacity = clamp(local / 0.08, 0, 1);
    }
    if (l.motion === "slide") {
      var q = easeOutCubic(clamp(local / m.dur, 0, 1));
      dy = (1 - q) * 0.03; opacity = q;
    }
    if (l.motion === "build") {
      var starts = wordStarts(seg, tokens);
      visible = 0; wordFade = [];
      starts.forEach(function (s, i) {
        if (t >= s || i === 0) { visible = i + 1; wordFade[i] = clamp((t - s) / m.dur, 0, 1); }
      });
      if (wordFade.length) wordFade[0] = Math.max(wordFade[0], clamp(local / m.dur, 0, 1));
    }
    if (l.motion !== "none" && l.motion !== "build" && tail < 0.12) opacity *= clamp(tail / 0.12, 0, 1);

    return { seg: seg, look: l, style: st, tokens: tokens, opacity: opacity, scale: scale, dy: dy, visible: visible, wordFade: wordFade };
  }

  function q(v) { return Math.round(v * 100) / 100; }

  function stateKey(states) {
    return states.map(function (s) {
      return [s.seg.id, s.seg.text, JSON.stringify(s.look), q(s.opacity), q(s.scale), q(s.dy), s.visible,
        s.wordFade ? s.wordFade.map(q).join(",") : ""].join("|");
    }).join("§");
  }

  function segHTML(s) {
    var st = s.style, l = s.look, size = st.size * l.size * 100; // cqh
    var lines = layout(s.tokens, st.maxChars);
    var left = st.align === "left";
    var x = left ? "left:7cqw;" : "left:50cqw;";
    var tx = left ? "0" : "-50%";
    var css = [
      "position:absolute", x, "top:" + (l.y * 100) + "cqh",
      "width:" + (left ? "86cqw" : "88cqw"),
      "transform:translate(" + tx + ",calc(-50% + " + (s.dy * 100) + "cqh)) scale(" + s.scale + ")" + (st.tilt ? " rotate(" + st.tilt + "deg)" : ""),
      "transform-origin:" + (left ? "left center" : "center center"),
      "opacity:" + s.opacity,
      "text-align:" + st.align,
      "font-family:" + st.font,
      "font-weight:" + (st.weight || 400),
      "font-size:" + size + "cqh",
      "line-height:" + (st.box ? 1.08 : st.pill ? 1.25 : 1.12),
      "color:" + st.color,
      "pointer-events:none"
    ];
    if (st.upper) css.push("text-transform:uppercase");
    if (st.shadow) css.push("text-shadow:0 0.15cqh 0.9cqh rgba(0,0,0,.55)");
    if (st.outline) css.push("-webkit-text-stroke:0.32cqh rgba(0,0,0,.85);paint-order:stroke fill;text-shadow:0 0.2cqh 0.6cqh rgba(0,0,0,.5)");

    var html = '<div class="eb-seg" style="' + css.join(";") + '">';
    lines.forEach(function (line) {
      var words = [];
      line.forEach(function (i) {
        if (i >= s.visible) return;
        var tok = s.tokens[i], wcss = [];
        if (s.wordFade) wcss.push("opacity:" + s.wordFade[i]);
        if (tok.em) {
          wcss.push("color:" + st.accent);
          if (st.emphScale) wcss.push("font-style:italic;font-size:" + st.emphScale + "em;line-height:0.9");
        }
        words.push('<span style="' + wcss.join(";") + '">' + esc(tok.text) + "</span>");
      });
      if (!words.length) return;
      var lineCss = "display:inline;-webkit-box-decoration-break:clone;box-decoration-break:clone;";
      if (st.box) lineCss += "background:" + st.box + ";padding:0.1em 0.22em 0.04em;";
      if (st.pill) lineCss += "background:" + st.pill + ";padding:0.22em 0.6em;border-radius:0.5em;";
      html += '<div style="white-space:nowrap;margin:' + (st.box ? "0" : st.pill ? "0.18em 0" : "0") + '"><span style="' + lineCss + '">' + words.join(" ") + "</span></div>";
    });
    return html + "</div>";
  }

  // Draw every segment visible at time t into root. Returns a key that only
  // changes when the picture changes (the renderer reuses frames on a match).
  function draw(root, segments, t) {
    var states = [];
    (segments || []).forEach(function (seg) { var s = segState(seg, t); if (s) states.push(s); });
    var key = stateKey(states);
    if (root.__ebKey !== key) {
      root.innerHTML = states.map(segHTML).join("");
      root.__ebKey = key;
    }
    return key;
  }

  // Segments whose start falls in [a, b): used to fire sound effects.
  function cuesBetween(segments, a, b) {
    return (segments || []).filter(function (s) {
      var l = look(s);
      return l.sfx && l.sfx !== "none" && SFX[l.sfx] && s.start >= a && s.start < b;
    });
  }

  // ---------- B-roll ----------
  // A segment can carry broll: {clipId, layout, in, span}. It covers that
  // caption plus `span` following captions, starting `in` seconds into the clip.

  var LAYOUTS = {
    full: { label: "Full screen", hint: "B-roll fills the frame; your voice keeps playing" },
    pip: { label: "Picture in picture", hint: "B-roll in a box at the upper right, you stay on screen" },
    split: { label: "Split screen", hint: "B-roll on top, you in the bottom half" }
  };

  // Placements in timeline order, from the segments' broll fields.
  function placements(segments) {
    var segs = (segments || []).slice().sort(function (a, b) { return a.start - b.start; });
    var out = [];
    segs.forEach(function (s, i) {
      var b = s.broll;
      if (!b || !b.clipId) return;
      var last = segs[Math.min(segs.length - 1, i + (b.span || 0))];
      out.push({ segId: s.id, clipId: b.clipId, layout: LAYOUTS[b.layout] ? b.layout : "full", in: b.in || 0, start: s.start, end: last.end });
    });
    return out;
  }

  // The B-roll on screen at time t (the latest one to start wins).
  function placementAt(pl, t) {
    var hit = null;
    pl.forEach(function (p) { if (t >= p.start && t < p.end) hit = p; });
    return hit;
  }

  // Source crop (sx, sy, sw, sh) that fills a dw x dh box, centred on fy.
  function coverCrop(cw, ch, dw, dh, fy) {
    var r = dw / dh, sw = cw, sh = cw / r;
    if (sh > ch) { sh = ch; sw = ch * r; }
    var sx = (cw - sw) / 2, sy = clamp(ch * (fy == null ? 0.5 : fy) - sh / 2, 0, ch - sh);
    return { sx: sx, sy: sy, sw: sw, sh: sh };
  }

  // Where things go for a layout on a W x H frame. The preview canvas and the
  // ffmpeg render both draw from these rectangles.
  //   b:  the B-roll clip (cw x ch) -> {sx,sy,sw,sh, dx,dy,dw,dh}
  //   a2: for split, the A-roll (aw x ah) re-cropped into the bottom half
  function brollRects(layout, W, H, cw, ch, aw, ah) {
    var b, a2 = null, c;
    if (layout === "pip") {
      var dw = W * 0.42, dh = dw * ch / cw;
      if (dh > H * 0.42) { dh = H * 0.42; dw = dh * cw / ch; }
      b = { sx: 0, sy: 0, sw: cw, sh: ch, dx: W - dw - W * 0.05, dy: H * 0.13, dw: dw, dh: dh };
    } else if (layout === "split") {
      c = coverCrop(cw, ch, W, H / 2, 0.5);
      b = { sx: c.sx, sy: c.sy, sw: c.sw, sh: c.sh, dx: 0, dy: 0, dw: W, dh: H / 2 };
      // Faces usually sit a little above the middle of a talking-head frame.
      var ca = coverCrop(aw, ah, W, H / 2, 0.42);
      a2 = { sx: ca.sx, sy: ca.sy, sw: ca.sw, sh: ca.sh, dx: 0, dy: H / 2, dw: W, dh: H / 2 };
    } else {
      c = coverCrop(cw, ch, W, H, 0.5);
      b = { sx: c.sx, sy: c.sy, sw: c.sw, sh: c.sh, dx: 0, dy: 0, dw: W, dh: H };
    }
    return { b: b, a2: a2 };
  }

  global.EditBay = {
    STYLES: STYLES, PLACES: PLACES, MOTIONS: MOTIONS, SFX: SFX, DEFAULT_LOOK: DEFAULT_LOOK, LAYOUTS: LAYOUTS,
    look: look, tokenize: tokenize, layout: layout, draw: draw, cuesBetween: cuesBetween,
    placements: placements, placementAt: placementAt, brollRects: brollRects
  };
})(typeof window !== "undefined" ? window : globalThis);
