// The journey of life: the picture for each chapter of script.js.
//
// Chapters with footage show the real simulation (films/footage.js) through a
// camera that moves on the narration's cues. The others are drawn Earth-history
// scenes: a planet whose oceans, sky and ice change, and a clock that squeezes
// Earth's 4.54 billion years into one day.
//
// Every draw(ctx, S) works in a 1920 x 1080 frame. S gives the chapter's local
// time (S.lt), when each line starts (S.c(id)) and ends (S.ce(id)), the
// chapter's length (S.len), the language (S.L(text)) and a state object kept
// for the chapter (S.st). Times are in seconds.
(function (root) {
  'use strict';

  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const F = {
    sans: '"IBM Plex Sans", system-ui, sans-serif',
    serif: '"IBM Plex Serif", Georgia, serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  };

  // ---------- Earth's history as one day ----------
  const AGE = 4.54e9;
  const hourOf = (yearsAgo) => 24 * (1 - yearsAgo / AGE);
  function clockText(h) {
    const m = Math.round(h * 60) % (24 * 60);
    return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
  }

  // A 24-hour dial. h: hours since midnight; big: 0 (corner) to 1 (centre stage).
  function clock(ctx, x, y, r, h, opts) {
    const o = opts || {};
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(8,12,11,0.72)';
    ctx.beginPath(); ctx.arc(0, 0, r * 1.12, 0, TAU); ctx.fill();
    // Night and day on the dial, so the hours read as a day.
    const a0 = -Math.PI / 2;
    ctx.lineWidth = r * 0.12;
    ctx.strokeStyle = 'rgba(120,150,190,0.18)';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.86, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,196,110,0.85)';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.86, a0, a0 + TAU * clamp(h, 0, 24) / 24); ctx.stroke();
    // Marks for the moments the film visits.
    for (const m of o.marks || []) {
      const a = a0 + TAU * m.h / 24;
      ctx.fillStyle = m.colour || '#fff';
      ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, r * 0.05, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(230,240,235,0.55)'; ctx.lineWidth = Math.max(1.5, r * 0.012);
    for (let i = 0; i < 24; i++) {
      const a = a0 + TAU * i / 24, r1 = r * (i % 6 ? 0.68 : 0.62);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.lineTo(Math.cos(a) * r * 0.74, Math.sin(a) * r * 0.74); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(230,240,235,0.75)';
    ctx.font = '500 ' + Math.round(r * 0.13) + 'px ' + F.mono;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const i of [0, 6, 12, 18]) {
      const a = a0 + TAU * i / 24;
      ctx.fillText(String(i), Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
    }
    const a = a0 + TAU * h / 24;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, r * 0.03); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.04, 0, TAU); ctx.fill();
    if (o.label !== false) {
      ctx.font = '600 ' + Math.round(r * 0.3) + 'px ' + F.mono;
      ctx.fillStyle = '#fff';
      ctx.fillText(clockText(h), 0, r * 1.45);
      if (o.caption) {
        ctx.font = '500 ' + Math.round(r * 0.13) + 'px ' + F.sans;
        ctx.fillStyle = 'rgba(230,240,235,0.8)';
        ctx.fillText(o.caption, 0, r * 1.8);
      }
    }
    ctx.restore();
  }

  // ---------- A planet ----------
  // Height comes from 3D value noise, so the map has no seam. Its colours are
  // recomputed from a few knobs: lava, ocean, ice, mats (microbial mats along
  // the coasts) and oxygen (the sky and sea after the Great Oxidation).
  const TW = 512, TH = 256;
  let heightMap = null;
  function noise3(seed) {
    const P = new Uint8Array(512);
    let s = seed;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const perm = [...Array(256).keys()].sort(() => rnd() - 0.5);
    for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
    const fade = (t) => t * t * (3 - 2 * t);
    const h = (x, y, z) => P[P[P[x & 255] + (y & 255)] + (z & 255)] / 255;
    return (x, y, z) => {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
      const l = (a, b, t) => a + (b - a) * t;
      return l(l(l(h(xi, yi, zi), h(xi + 1, yi, zi), xf), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf), yf),
        l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf), yf), zf);
    };
  }
  function buildHeight() {
    const n = noise3(11);
    heightMap = new Float32Array(TW * TH);
    for (let j = 0; j < TH; j++) {
      const lat = (0.5 - (j + 0.5) / TH) * Math.PI;
      for (let i = 0; i < TW; i++) {
        const lon = (i / TW) * TAU;
        const x = Math.cos(lat) * Math.cos(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(lon);
        let v = 0, amp = 0.55, f = 1.6;
        for (let o = 0; o < 5; o++) { v += amp * n(x * f + 7, y * f + 3, z * f + 5); amp *= 0.5; f *= 2.1; }
        heightMap[j * TW + i] = v;
      }
    }
  }
  const tex = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const ball = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  function paintTexture(k) {
    if (!heightMap) buildHeight();
    tex.width = TW; tex.height = TH;
    const c = tex.getContext('2d'), img = c.createImageData(TW, TH), d = img.data;
    const sea = 0.5;
    const iceLat = lerp(90, 8, k.ice || 0);
    for (let j = 0; j < TH; j++) {
      const lat = Math.abs(90 - (j + 0.5) / TH * 180);
      for (let i = 0; i < TW; i++) {
        const v = heightMap[j * TW + i], p = (j * TW + i) * 4;
        let r, g, b;
        // Ocean or land, after the planet has cooled.
        if (v < sea) {
          const deep = clamp((sea - v) * 5, 0, 1);
          r = lerp(lerp(28, 30, k.oxy), lerp(12, 8, k.oxy), deep);
          g = lerp(lerp(78, 92, k.oxy), lerp(46, 40, k.oxy), deep);
          b = lerp(lerp(84, 150, k.oxy), lerp(62, 110, k.oxy), deep);
        } else {
          const hi = clamp((v - sea) * 6, 0, 1);
          r = lerp(118, 150, hi); g = lerp(98, 128, hi); b = lerp(82, 112, hi);
          if (k.oxy > 0) { r = lerp(r, 160, k.oxy * 0.4 * (1 - hi)); g = lerp(g, 92, k.oxy * 0.3 * (1 - hi)); b = lerp(b, 64, k.oxy * 0.3 * (1 - hi)); }
          // Microbial mats along the shore.
          const shore = clamp(1 - (v - sea) * 14, 0, 1);
          r = lerp(r, 70, k.mats * shore * 0.8); g = lerp(g, 120, k.mats * shore * 0.8); b = lerp(b, 70, k.mats * shore * 0.8);
          if (k.life) { r = lerp(r, 60, k.life * (1 - hi) * 0.6); g = lerp(g, 110, k.life * (1 - hi) * 0.6); b = lerp(b, 60, k.life * (1 - hi) * 0.6); }
        }
        if (k.ocean < 1) {
          // Molten: a dark crust with glowing cracks, cooling into the sea.
          const crack = clamp(1 - Math.abs(((v * 9) % 1) - 0.5) * 9, 0, 1);
          const lr = lerp(60, 255, crack * 0.9), lg = lerp(18, 120, crack * 0.8), lb = lerp(10, 30, crack);
          const m = 1 - k.ocean;
          r = lerp(r, lr, m); g = lerp(g, lg, m); b = lerp(b, lb, m);
        }
        if (lat > iceLat) { const f = clamp((lat - iceLat) / 6, 0, 1); r = lerp(r, 236, f); g = lerp(g, 244, f); b = lerp(b, 250, f); }
        d[p] = r; d[p + 1] = g; d[p + 2] = b; d[p + 3] = 255;
      }
    }
    c.putImageData(img, 0, 0);
    return img;
  }
  let lastKey = '', lastTex = null;
  function planet(ctx, x, y, R, rot, k) {
    const key = [k.lava, k.ocean, k.ice, k.mats, k.oxy, k.life].map((v) => (v || 0).toFixed(2)).join();
    if (key !== lastKey) { lastTex = paintTexture(k); lastKey = key; }
    const S = 300;
    ball.width = S; ball.height = S;
    const c = ball.getContext('2d'), img = c.createImageData(S, S), d = img.data, td = lastTex.data;
    const light = [-0.55, -0.35, 0.76];
    for (let j = 0; j < S; j++) {
      const ny = (j + 0.5) / S * 2 - 1;
      for (let i = 0; i < S; i++) {
        const nx = (i + 0.5) / S * 2 - 1, rr = nx * nx + ny * ny;
        if (rr > 1) continue;
        const nz = Math.sqrt(1 - rr);
        const lat = Math.asin(-ny), lon = Math.atan2(nx, nz) + rot;
        const u = ((lon / TAU) % 1 + 1) % 1, v = 0.5 - lat / Math.PI;
        const ti = ((Math.min(TH - 1, Math.floor(v * TH)) * TW) + Math.floor(u * TW)) * 4;
        let sh = clamp(nx * light[0] + ny * light[1] + nz * light[2], 0, 1);
        sh = 0.12 + 0.88 * sh;
        const glow = (1 - (k.ocean || 0)) * 0.6;   // lava glows on the night side
        const p = (j * S + i) * 4;
        d[p] = td[ti] * lerp(sh, 1, glow * (td[ti] > 150 ? 1 : 0));
        d[p + 1] = td[ti + 1] * lerp(sh, 1, glow * (td[ti] > 150 ? 0.7 : 0));
        d[p + 2] = td[ti + 2] * sh;
        d[p + 3] = rr > 0.985 ? 255 * (1 - rr) / 0.015 : 255;
      }
    }
    c.putImageData(img, 0, 0);
    // Atmosphere: an orange haze before oxygen, blue after.
    const haze = k.ocean > 0.3 ? 1 : k.ocean / 0.3;
    const ar = lerp(240, 110, k.oxy), ag = lerp(150, 170, k.oxy), ab = lerp(80, 255, k.oxy);
    const g = ctx.createRadialGradient(x, y, R * 0.92, x, y, R * 1.18);
    g.addColorStop(0, `rgba(${ar | 0},${ag | 0},${ab | 0},${0.45 * haze})`);
    g.addColorStop(1, `rgba(${ar | 0},${ag | 0},${ab | 0},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 1.18, 0, TAU); ctx.fill();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(ball, x - R, y - R, R * 2, R * 2);
  }

  function stars(ctx, seed, alpha) {
    let s = seed;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = '#dde8e2';
    for (let i = 0; i < 260; i++) { const r = rnd() * 1.8 + 0.3; ctx.globalAlpha = (alpha == null ? 1 : alpha) * (0.25 + rnd() * 0.6); ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, r, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  // ---------- Text on the picture ----------
  function label(ctx, text, x, y, opts) {
    const o = opts || {};
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.font = (o.weight || 500) + ' ' + (o.size || 34) + 'px ' + (o.font || F.sans);
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle';
    if (o.box) {
      const w = ctx.measureText(text).width, pad = (o.size || 34) * 0.5;
      const bx = o.align === 'center' ? x - w / 2 - pad : o.align === 'right' ? x - w - pad : x - pad;
      ctx.fillStyle = o.box;
      ctx.beginPath(); ctx.roundRect(bx, y - (o.size || 34) * 0.85, w + pad * 2, (o.size || 34) * 1.7, 10); ctx.fill();
    }
    ctx.fillStyle = o.colour || '#fff';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // A ring and a label on something in the footage. p: screen point.
  function callout(ctx, p, r, text, a) {
    if (!p || a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
    // The label goes on whichever side has room.
    const side = p.x > W - 520 ? -1 : 1, up = p.y < 260 ? -1 : 1;
    const lx = p.x + side * (r * 0.75 + 30), ly = p.y - up * (r * 0.75 + 30);
    ctx.beginPath(); ctx.moveTo(p.x + side * r * 0.71, p.y - up * r * 0.71); ctx.lineTo(lx, ly); ctx.stroke();
    ctx.restore();
    label(ctx, text, lx + side * 10, ly, { size: 32, weight: 600, box: 'rgba(8,12,11,0.75)', alpha: a, align: side < 0 ? 'right' : 'left' });
  }

  // ---------- Cameras on the coast ----------
  const FIT = 1.12;
  function clampCam(cam, e) {
    const k = Math.min(W / e.cols, H / e.rows) * cam.zoom, hw = W / 2 / k, hh = H / 2 / k;
    cam.cx = hw * 2 >= e.cols ? e.cols / 2 : clamp(cam.cx, hw, e.cols - hw);
    cam.cy = hh * 2 >= e.rows ? e.rows / 2 : clamp(cam.cy, hh, e.rows - hh);
    return cam;
  }
  // Ease the chapter's camera toward a target; the first frame jumps.
  function camTo(S, e, target, speed) {
    const st = S.st, tgt = clampCam(Object.assign({}, target), e);
    if (!st.cam) { st.cam = tgt; return st.cam; }
    const f = 1 - Math.exp(-S.dt * (speed || 1.6));
    // Zoom moves in log space, so zooming in and out feel the same.
    const lz = lerp(Math.log(st.cam.zoom), Math.log(tgt.zoom), f);
    st.cam.cx = lerp(st.cam.cx, tgt.cx, f); st.cam.cy = lerp(st.cam.cy, tgt.cy, f); st.cam.zoom = Math.exp(lz);
    clampCam(st.cam, e);
    return st.cam;
  }
  function toScreen(cam, e, x, y) {
    const k = Math.min(W / e.cols, H / e.rows) * cam.zoom;
    return { x: W / 2 + (x - cam.cx) * k, y: H / 2 + (y - cam.cy) * k, k };
  }
  const fit = (e) => ({ cx: e.cols / 2, cy: e.rows / 2, zoom: FIT });

  // Where to look: picked once and kept, so the camera does not jump around.
  function findPool(e) {
    let best = -1, bi = -1;
    for (let i = 0; i < e.n; i++) {
      const v = !e.connected[i] && e.water[i] > 0.01 ? 2 + e.water[i] : Math.abs(e.ground[i]) < e.p.tideRange ? 1 : 0;
      if (v > best) { best = v; bi = i; }
    }
    return { x: bi % e.cols, y: Math.floor(bi / e.cols) };
  }
  function findField(e, f) {
    let best = -1, bi = 0;
    for (let i = 0; i < e.n; i++) if (f[i] > best) { best = f[i]; bi = i; }
    return { x: bi % e.cols, y: Math.floor(bi / e.cols) };
  }
  // A cell's clump, followed through deaths of single members.
  function follow(L, st, key, pick) {
    let c = st[key];
    if (c && c.dead) c = c.bonds.map((id) => L.byId.get(id)).find((m) => m && !m.dead) || null;
    if (!c) c = pick();
    st[key] = c;
    if (!c) return null;
    const members = c.clumpSize > 1 ? L.clumpOf(c) : [c];
    let x = 0, y = 0;
    for (const m of members) { x += m.x; y += m.y; }
    return { x: x / members.length, y: y / members.length, n: members.length, c };
  }

  // ---------- A small chart of a real run ----------
  function chart(ctx, x, y, w, h, data, opts) {
    const o = opts || {}, rows = data.rows, a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0) return;
    const reveal = clamp(o.reveal == null ? 1 : o.reveal, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(8,12,11,0.82)';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.fill();
    const px = x + 70, py = y + 92, pw = w - 110, ph = h - 160;
    const tMax = rows[rows.length - 1][0], vMax = o.max;
    ctx.strokeStyle = 'rgba(230,240,235,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + ph); ctx.lineTo(px + pw, py + ph); ctx.stroke();
    ctx.font = '500 22px ' + F.mono; ctx.fillStyle = 'rgba(230,240,235,0.7)'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const v of o.ticks) { const yy = py + ph - v / vMax * ph; ctx.fillText(v.toFixed(2), px - 12, yy); ctx.strokeStyle = 'rgba(230,240,235,0.08)'; ctx.beginPath(); ctx.moveTo(px, yy); ctx.lineTo(px + pw, yy); ctx.stroke(); }
    ctx.strokeStyle = o.colour || '#8fe3a8'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    ctx.beginPath();
    const last = Math.max(1, Math.floor(rows.length * reveal));
    for (let i = 0; i < last; i++) {
      const xx = px + rows[i][0] / tMax * pw, yy = py + ph - rows[i][1] / vMax * ph;
      if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
    }
    ctx.stroke();
    if (o.start != null) {
      ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(230,240,235,0.5)'; ctx.lineWidth = 2;
      const yy = py + ph - o.start / vMax * ph;
      ctx.beginPath(); ctx.moveTo(px, yy); ctx.lineTo(px + pw, yy); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(230,240,235,0.75)'; ctx.font = '500 22px ' + F.sans;
      ctx.fillText(o.startLabel, px + 10, yy - 18);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff'; ctx.font = '600 32px ' + F.sans; ctx.fillText(o.title, x + 30, y + 52);
    ctx.fillStyle = 'rgba(230,240,235,0.7)'; ctx.font = '500 22px ' + F.mono;
    ctx.fillText(o.foot, x + 30, y + h - 28);
    ctx.restore();
  }

  // ---------- The levels of life ----------
  const LEVELS = [
    { en: 'Chemistry', es: 'Química', colour: '#7fb6d8' },
    { en: 'Cells', es: 'Células', colour: '#8fe3a8' },
    { en: 'Colonies', es: 'Colonias', colour: '#6cc4ee' },
    { en: 'Bodies', es: 'Cuerpos', colour: '#f2c14e' },
    { en: 'Nerves', es: 'Nervios', colour: '#b59cff' },
    { en: 'Brains', es: 'Cerebros', colour: '#ee6fb0' },
    { en: 'Ecosystems', es: 'Ecosistemas', colour: '#e8553f' },
  ];
  function ladder(ctx, S, x, y, a, upTo) {
    if (a <= 0) return;
    const n = LEVELS.length, gap = 74;
    for (let i = 0; i < n; i++) {
      const lv = LEVELS[i], yy = y + (n - 1 - i) * gap;
      const show = a * clamp(upTo - i, 0, 1);
      if (show <= 0) continue;
      ctx.save(); ctx.globalAlpha = show;
      ctx.fillStyle = lv.colour; ctx.beginPath(); ctx.roundRect(x, yy - 24, 14, 48, 4); ctx.fill();
      ctx.restore();
      label(ctx, S.L(lv), x + 34, yy, { size: 40, weight: 600, alpha: show, font: F.serif });
    }
  }

  // Each chapter's moments on the dial.
  const MARKS = [
    { h: hourOf(4.0e9), colour: '#7fb6d8' }, { h: hourOf(3.8e9), colour: '#8fe3a8' }, { h: hourOf(3.5e9), colour: '#6cc4ee' },
    { h: hourOf(2.4e9), colour: '#9ad0ff' }, { h: hourOf(6.4e8), colour: '#f2f6f8' }, { h: hourOf(5.75e8), colour: '#f2c14e' },
    { h: hourOf(5.4e8), colour: '#ee6fb0' },
  ];

  // ---------- Chapters ----------
  const SCENES = {
    // 0. The planet forms; the clock appears; the levels stack up; we dive in.
    day(ctx, S) {
      const lt = S.lt, c = S.c;
      ctx.fillStyle = '#05080a'; ctx.fillRect(0, 0, W, H);
      stars(ctx, 5, 1);
      const form = sstep(0.3, c('midnight') + 3.5, lt);
      const cool = sstep(c('humans') - 1, c('between') + 1, lt);
      const dive = sstep(c('watch') + 0.6, S.len - 0.2, lt);
      // Dust spiralling in.
      if (form < 1) {
        let s = 3;
        const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
        for (let i = 0; i < 900; i++) {
          const r0 = 120 + rnd() * 900, a0 = rnd() * TAU, sp = 0.3 + rnd();
          const r = lerp(r0, 240 * Math.sqrt(rnd()), form), a = a0 + lt * sp * 0.35 + form * 3;
          ctx.fillStyle = `rgba(255,${(150 + rnd() * 80) | 0},90,${0.5 * (1 - form)})`;
          ctx.fillRect(760 + Math.cos(a) * r, 540 + Math.sin(a) * r * 0.55, 3, 3);
        }
      }
      const R = lerp(lerp(40, 260, form), 2600, dive * dive);
      const px = lerp(760, 960, dive), py = lerp(540, 540 + 1400, dive * dive);
      if (form > 0.02) planet(ctx, px, py, R, lt * 0.08, { ocean: cool, oxy: 0, ice: 0, mats: 0 });
      // The clock.
      const cA = sstep(c('imagine') + 0.2, c('imagine') + 1.6, lt) * (1 - sstep(c('between') - 0.2, c('between') + 0.4, lt));
      let h = 0;
      if (lt > c('humans')) h = lerp(0, 24 - 6 / 3600, sstep(c('humans'), c('humans') + 2.2, lt));
      if (lt > c('between')) h = lerp(24, 0, sstep(c('between'), c('between') + 1, lt));
      clock(ctx, 1480, 470, 230, h, { alpha: cA, caption: S.L({ en: 'Earth’s history as one day', es: 'La historia de la Tierra en un día' }) });
      if (lt > c('humans') && lt < c('between') + 0.5) {
        const a = sstep(c('humans') + 2.2, c('humans') + 2.8, lt) * (1 - sstep(c('between'), c('between') + 0.5, lt));
        label(ctx, S.L({ en: 'Humans: the last 6 seconds', es: 'Humanos: los últimos 6 segundos' }), 1480, 900, { align: 'center', size: 36, weight: 600, colour: '#ffd08a', alpha: a });
      }
      if (lt < c('humans')) label(ctx, S.lang === 'es' ? '4.540.000.000' : '4,540,000,000', 760, 150, { align: 'center', size: 44, font: F.mono, alpha: sstep(c('midnight'), c('midnight') + 1, lt) * (1 - sstep(c('humans') - 0.5, c('humans'), lt)), colour: 'rgba(255,220,170,0.9)' });
      if (lt < c('humans')) label(ctx, S.L({ en: 'years ago', es: 'años atrás' }), 760, 202, { align: 'center', size: 30, alpha: sstep(c('midnight'), c('midnight') + 1, lt) * (1 - sstep(c('humans') - 0.5, c('humans'), lt)), colour: 'rgba(255,220,170,0.75)' });
      // The levels, stacking up.
      const lA = sstep(c('between'), c('between') + 0.6, lt) * (1 - sstep(c('watch') + 0.3, c('watch') + 1.2, lt));
      ladder(ctx, S, 1340, 250, lA, (lt - c('between')) * 2.4);
    },

    // 1. The young coast, with no life.
    sea(ctx, S) {
      const f = S.footage, e = f.earth, lt = S.lt, c = S.c, st = S.st;
      if (!st.pool) st.pool = findPool(e);
      if (!st.vent) st.vent = { x: e.vents[0].x, y: e.vents[0].y };
      let target = fit(e), layer = 'nature', mark = null, text = '';
      if (lt > c('sun')) { target = { cx: st.pool.x, cy: st.pool.y, zoom: 3 }; mark = st.pool; text = S.L({ en: 'Tide pools', es: 'Pozas de marea' }); }
      if (lt > c('vents')) { target = { cx: st.vent.x, cy: st.vent.y, zoom: 3 }; layer = 'temp'; mark = st.vent; text = S.L({ en: 'Hot vent', es: 'Fuente hidrotermal' }); }
      if (lt > c('chains')) { target = { cx: st.pool.x, cy: st.pool.y, zoom: 3.5 }; layer = 'chains'; mark = st.pool; text = S.L({ en: 'Chains', es: 'Cadenas' }); }
      if (lt > c('copiers')) {
        if (!st.cop) st.cop = findField(e, f.chem.f.copiers);
        target = { cx: st.cop.x, cy: st.cop.y, zoom: 2.6 }; layer = 'copiers'; mark = st.cop; text = S.L({ en: 'Copiers', es: 'Copiadores' });
      }
      if (lt > S.ce('copiers') + 0.5) { target = fit(e); layer = 'copiers'; mark = null; }
      const cam = camTo(S, e, target, 1.3);
      f.draw(ctx, W, H, cam, { layer });
      const keys = ['sun', 'vents', 'chains', 'copiers'].map(c);
      const since = Math.min(...keys.map((k) => (lt > k ? lt - k : 99)));
      if (mark) callout(ctx, toScreen(cam, e, mark.x + 0.5, mark.y + 0.5), 46, text, sstep(0.8, 1.6, since) * (1 - sstep(4.5, 5.2, since)));
      if (layer !== 'nature') {
        const names = { temp: { en: 'Showing: heat', es: 'Mostrando: calor' }, chains: { en: 'Showing: chains', es: 'Mostrando: cadenas' }, copiers: { en: 'Showing: copiers', es: 'Mostrando: copiadores' } };
        label(ctx, S.L(names[layer]), 60, H - 210, { size: 28, font: F.mono, box: 'rgba(8,12,11,0.7)' });
      }
    },

    // 2. First cells: swimming evolves; a real run's motor gene.
    cells(ctx, S) {
      const f = S.footage, L = f.life, e = f.earth, lt = S.lt, c = S.c, st = S.st;
      let target = fit(e);
      if (lt > c('eat')) {
        const p = follow(L, st, 'one', () => { let best = null; for (const x of L.cells) if (x.clumpSize === 1 && (!best || x.g.speed > best.g.speed)) best = x; return best; });
        if (p) target = { cx: p.x, cy: p.y, zoom: lt > c('copy') ? 16 : 6 };
      }
      if (lt > c('chart')) target = Object.assign({}, st.cam || target, { zoom: 3 });
      const cam = camTo(S, e, target, lt > c('copy') ? 2.4 : 1.4);
      f.draw(ctx, W, H, cam);
      const one = st.one;
      if (one && lt > c('copy') && lt < c('chart')) {
        const p = toScreen(cam, e, one.x, one.y);
        const since = lt - c('copy');
        callout(ctx, p, 60, S.L({ en: 'Tail: its motor', es: 'Cola: su motor' }), sstep(1, 1.6, since) * (1 - sstep(c('motor') - c('copy') + 3, c('motor') - c('copy') + 3.6, since)));
      }
      const a = sstep(c('chart'), c('chart') + 0.8, lt);
      const data = root.FilmData.journey.cells;
      chart(ctx, 1080, 140, 760, 520, data, {
        alpha: a, reveal: (lt - c('chart')) / 4, max: 0.12, ticks: [0, 0.04, 0.08, 0.12], colour: '#8fe3a8', start: 0.01,
        startLabel: S.L({ en: 'at the start', es: 'al principio' }),
        title: S.L({ en: 'Motor gene, average of all cells', es: 'Gen del motor, media de todas las células' }),
        foot: S.L({ en: 'Real run · seed 3 · 12,000 steps · 26 generations', es: 'Simulación real · semilla 3 · 12.000 pasos · 26 generaciones' }),
      });
    },

    // 3. Colonies: predators and clumps; a real run's sticking gene.
    colonies(ctx, S) {
      const f = S.footage, L = f.life, e = f.earth, lt = S.lt, c = S.c, st = S.st;
      let target = fit(e), pred = null;
      if (lt > c('predators') && L.predators.length) {
        if (!st.pred || !L.predators.includes(st.pred)) st.pred = L.predators[0];
        pred = st.pred;
        target = { cx: pred.x, cy: pred.y, zoom: 5 };
      }
      let clump = null;
      if (lt > c('stick')) {
        clump = follow(L, st, 'clump', () => { let best = null; for (const x of L.cells) if (!best || x.clumpSize > best.clumpSize) best = x; return best; });
        if (clump) target = { cx: clump.x, cy: clump.y, zoom: 10 };
      }
      if (lt > c('rise')) target = Object.assign({}, st.cam || target, { zoom: 3 });
      if (lt > c('algae') + 1) target = fit(e);
      const cam = camTo(S, e, target, 1.5);
      f.draw(ctx, W, H, cam);
      if (pred && lt < c('stick')) callout(ctx, toScreen(cam, e, pred.x, pred.y), 50, S.L({ en: 'Predator', es: 'Depredador' }), sstep(0.8, 1.4, lt - c('predators')));
      if (clump && lt < c('rise')) callout(ctx, toScreen(cam, e, clump.x, clump.y), 80, S.L({ en: 'Too big to swallow', es: 'Demasiado grande para tragar' }), sstep(1.5, 2.1, lt - c('stick')));
      const a = sstep(c('rise'), c('rise') + 0.8, lt) * (1 - sstep(S.ce('algae') + 1.5, S.ce('algae') + 2.2, lt));
      chart(ctx, 1080, 140, 760, 520, root.FilmData.journey.colonies, {
        alpha: a, reveal: (lt - c('rise')) / 4, max: 0.4, ticks: [0, 0.1, 0.2, 0.3, 0.4], colour: '#6cc4ee', start: 0.075,
        startLabel: S.L({ en: 'at the start', es: 'al principio' }),
        title: S.L({ en: 'Sticking gene, average of all cells', es: 'Gen de pegarse, media de todas las células' }),
        foot: S.L({ en: 'Real run · seed 3 · 12,000 steps · 71 generations', es: 'Simulación real · semilla 3 · 12.000 pasos · 71 generaciones' }),
      });
    },

    // 4. The long wait: microbes, oxygen, ice, then bodies.
    wait(ctx, S) {
      const lt = S.lt, c = S.c;
      ctx.fillStyle = '#05080a'; ctx.fillRect(0, 0, W, H);
      stars(ctx, 9, 1);
      const oxy = sstep(c('oxygen') + 0.5, c('oxygen') + 3.5, lt);
      const ice = sstep(c('snow') + 0.3, c('snow') + 2.2, lt) * (1 - sstep(c('snow') + 3.2, c('bodies') + 0.5, lt));
      const mats = sstep(0.5, c('microbes') + 2, lt);
      const life = sstep(c('bodies') + 0.5, c('bodies') + 2.5, lt);
      planet(ctx, 760, 540, 330, lt * 0.12, { ocean: 1, oxy, ice: ice * 0.92, mats, life: life * 0.5 });
      // The clock runs from the colonies to the first big bodies.
      const hShow = lt < c('oxygen') ? lerp(hourOf(3.5e9), hourOf(2.4e9), sstep(c('microbes') + 1, c('oxygen') + 0.5, lt))
        : lt < c('snow') ? lerp(hourOf(2.4e9), hourOf(7.2e8), sstep(c('oxygen') + 2.5, c('snow') + 0.3, lt))
          : lerp(hourOf(7.2e8), hourOf(5.75e8), sstep(c('snow') + 2.5, c('bodies') + 1, lt));
      clock(ctx, 1480, 440, 200, hShow, { marks: MARKS.slice(0, 3) });
      const notes = [
        [c('microbes'), c('oxygen'), { en: 'Microbial mats on the coasts', es: 'Tapetes microbianos en las costas' }],
        [c('oxygen'), c('snow'), { en: 'The Great Oxidation · 2.4 billion years ago', es: 'La Gran Oxidación · hace 2.400 millones de años' }],
        [c('snow'), c('bodies'), { en: 'Snowball Earth · 720 to 635 million years ago', es: 'Tierra bola de nieve · hace 720 a 635 millones de años' }],
        [c('bodies'), S.len, { en: 'The first large bodies · about 575 million years ago', es: 'Los primeros cuerpos grandes · hace unos 575 millones de años' }],
      ];
      for (const [a, b, t] of notes) {
        const al = sstep(a + 0.3, a + 1, lt) * (1 - sstep(b - 0.2, b + 0.3, lt));
        if (al > 0) label(ctx, S.L(t), 760, 960, { align: 'center', size: 36, weight: 600, alpha: al, box: 'rgba(8,12,11,0.6)' });
      }
    },

    // 5. Bodies with roles, muscles in step, then a nerve net.
    bodies(ctx, S) {
      const f = S.footage, L = f.life, e = f.earth, lt = S.lt, c = S.c, st = S.st, M = root.LifeSim;
      let target = fit(e);
      if (lt > c('roles')) {
        const ok = (x) => { const m = L.clumpOf(x); return m.some((y) => y.role === M.MOVER) && m.some((y) => y.role === M.GERM); };
        const p = follow(L, st, 'body', () => L.cells.find((x) => x.role === M.GERM && x.clumpSize >= 6 && ok(x)) || L.cells.find((x) => x.role === M.MOVER));
        if (p) target = { cx: p.x, cy: p.y, zoom: lt > c('squeeze') ? 14 : 8 };
      }
      if (lt > c('nerves')) {
        const p = follow(L, st, 'nerve', () => {
          let best = 0, pick = null;
          for (const x of L.cells) if (x.role === M.NERVE) { const n = L.clumpOf(x).filter((m) => m.role === M.NERVE).length; if (n > best) { best = n; pick = x; } }
          return pick;
        });
        if (p) target = { cx: p.x, cy: p.y, zoom: 11 };
      }
      if (lt > S.ce('nerves') + 1) target = Object.assign({}, st.cam || target, { zoom: 4 });
      const cam = camTo(S, e, target, 1.6);
      f.draw(ctx, W, H, cam);
      // A key for the roles, while we are close.
      const keyA = sstep(c('squeeze'), c('squeeze') + 0.8, lt) * (1 - sstep(S.ce('nerves') + 1, S.ce('nerves') + 2, lt));
      if (keyA > 0) {
        const D = root.LifeDraw, rows = [[D.ROLE_RGB[2], { en: 'Squeezing cell', es: 'Célula contráctil' }], [D.CONTRACT_RGB, { en: 'Squeezing now', es: 'Contrayéndose ahora' }], [D.ROLE_RGB[3], { en: 'Germ cell: makes new cells', es: 'Célula germinal: hace células nuevas' }]];
        if (lt > c('nerves')) rows.push([D.ROLE_RGB[4], { en: 'Nerve cell: passes signals', es: 'Célula nerviosa: pasa señales' }]);
        ctx.save(); ctx.globalAlpha = keyA; ctx.fillStyle = 'rgba(8,12,11,0.78)';
        ctx.beginPath(); ctx.roundRect(60, 150, 640, 40 + rows.length * 56, 14); ctx.fill(); ctx.restore();
        rows.forEach(([col, t], i) => {
          ctx.save(); ctx.globalAlpha = keyA; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(100, 198 + i * 56, 14, 0, TAU); ctx.fill(); ctx.restore();
          label(ctx, S.L(t), 130, 198 + i * 56, { size: 30, alpha: keyA });
        });
      }
    },

    // 6. Prey and hunters with brains on the Gaia coast.
    brains(ctx, S) {
      const f = S.footage, w = f.world, e = f.earth, lt = S.lt, c = S.c, st = S.st;
      let target = fit(e), sel = null;
      const centre = (x) => ({ cx: x.x / w.sx, cy: x.y / w.sx });
      if (lt > c('descend')) {
        if (!st.prey || !w.creatures.includes(st.prey)) st.prey = w.creatures.find((x) => !x.meat && x.brain) || w.creatures[0];
        sel = st.prey;
        if (sel) target = Object.assign(centre(sel), { zoom: 5 });
      }
      if (lt > c('hunters')) {
        if (!st.hunter || !w.creatures.includes(st.hunter)) st.hunter = w.creatures.find((x) => x.meat);
        sel = st.hunter;
        if (sel) target = Object.assign(centre(sel), { zoom: 4 });
      }
      if (lt > c('balance')) { target = fit(e); sel = null; }
      const cam = camTo(S, e, target, 1.8);
      f.draw(ctx, W, H, cam, { selected: sel });
      // Live counts.
      let prey = 0, hunters = 0;
      for (const x of w.creatures) { if (x.meat) hunters++; else prey++; }
      const a = sstep(c('hunters'), c('hunters') + 1, lt);
      if (a > 0) {
        label(ctx, S.L({ en: 'Prey', es: 'Presas' }) + '  ' + prey, 1860, 170, { align: 'right', size: 40, weight: 600, font: F.mono, colour: '#e8efe9', alpha: a, box: 'rgba(8,12,11,0.7)' });
        label(ctx, S.L({ en: 'Hunters', es: 'Cazadores' }) + '  ' + hunters, 1860, 250, { align: 'right', size: 40, weight: 600, font: F.mono, colour: '#ff8a72', alpha: a, box: 'rgba(8,12,11,0.7)' });
      }
      if (sel && lt < c('hunters')) callout(ctx, toScreen(cam, e, sel.x / w.sx, sel.y / w.sx), 50, S.L({ en: 'A brain that learns', es: 'Un cerebro que aprende' }), sstep(1, 1.6, lt - c('descend')));
      if (sel && lt > c('hunters') && lt < c('balance')) callout(ctx, toScreen(cam, e, sel.x / w.sx, sel.y / w.sx), 50, S.L({ en: 'Hunter', es: 'Cazador' }), sstep(1, 1.6, lt - c('hunters')));
    },

    // 7. One world: every level we visited, live, then the planet.
    gaia(ctx, S) {
      const lt = S.lt, c = S.c;
      ctx.fillStyle = '#05080a'; ctx.fillRect(0, 0, W, H);
      stars(ctx, 13, 1);
      const kinds = ['earth', 'cells', 'colonies', 'nerves', 'ecosystems'];
      const names = [LEVELS[0], LEVELS[1], LEVELS[2], { en: 'Bodies and nerves', es: 'Cuerpos y nervios' }, { en: 'Brains and ecosystems', es: 'Cerebros y ecosistemas' }];
      const out = sstep(c('built') + 0.5, c('next'), lt);
      const pa = sstep(0.2, 1.2, lt);
      // The planet grows behind the panels.
      planet(ctx, 960, 560, lerp(180, 380, out), lt * 0.1, { ocean: 1, oxy: 1, ice: 0.08, mats: 0.6, life: 0.7 });
      const pw = 560, ph = 350;
      const slots = [[80, 80], [680, 80], [1280, 80], [380, 470], [980, 470]];
      kinds.forEach((k, i) => {
        const f = root.Footage.get(k);
        if (!f.ready) return;
        // One world steps each frame, in turn, so all of them stay alive.
        if (S.frame % kinds.length === i) f.advance(S.dt * kinds.length, 2);
        const [x0, y0] = slots[i];
        const hl = lt > c('same') ? sstep(c('same') + i * 0.9, c('same') + i * 0.9 + 0.4, lt) : 0;
        const a = pa * (1 - out) * sstep(i * 0.25, i * 0.25 + 0.6, lt);
        if (a <= 0) return;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.roundRect(x0, y0, pw, ph, 18); ctx.clip();
        ctx.translate(x0, y0);
        const e = f.earth;
        const cam = { cx: e.cols / 2, cy: e.rows / 2, zoom: [1.3, 2.2, 2.6, 3, 1.4][i] };
        if (!S.st['c' + i]) {
          // Each panel looks where its chapter's interesting things are.
          if (f.life && f.life.cells.length) { let best = f.life.cells[0]; for (const x of f.life.cells) if (x.clumpSize > best.clumpSize) best = x; cam.cx = best.x; cam.cy = best.y; }
          S.st['c' + i] = clampCam(Object.assign({}, cam), e);
        }
        // The panel shows the footage at full width, shrunk.
        const s = pw / W;
        ctx.scale(s, s);
        f.draw(ctx, W, ph / s, S.st['c' + i]);
        ctx.restore();
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = hl > 0 ? `rgba(255,255,255,${0.3 + 0.6 * hl})` : 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(x0, y0, pw, ph, 18); ctx.stroke(); ctx.restore();
        label(ctx, S.L(names[i]), x0 + 20, y0 + ph - 32, { size: 30, weight: 600, alpha: a, box: 'rgba(8,12,11,0.7)' });
      });
      const tA = sstep(c('next') + 0.5, c('next') + 1.5, lt);
      label(ctx, 'Gaia', 960, 120, { align: 'center', size: 72, font: F.serif, alpha: out });
      label(ctx, S.L({ en: 'One world, seen at different levels', es: 'Un mundo, visto a distintos niveles' }), 960, 990, { align: 'center', size: 40, alpha: tA });
    },
  };

  root.FilmScenes = root.FilmScenes || {};
  root.FilmScenes.journey = { SCENES, W, H, clock, hourOf, clockText, MARKS, label, F };
})(typeof self !== 'undefined' ? self : this);
