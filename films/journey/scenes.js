// The journey of life: the picture for each chapter of script.js.
//
// Each milestone opens with a drawn animation of what happened on Earth (ART),
// then fades to the real simulation (films/footage.js) at the narration's
// 'sim' line, with a camera that moves on the narration's cues. The opening
// and the long wait are drawn planets and a clock that squeezes Earth's 4.54
// billion years into one day; the ending is a flock of agents that follow
// only local rules, then every level we visited.
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
    if (h > 23.99 && h < 24) { const s = Math.round((24 - h) * 3600); return '23:59:' + String(60 - s).padStart(2, '0'); }
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
  // The long wait: microbes, oxygen, ice, then bodies (a drawn planet).
  const WAIT = function (ctx, S) {
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
  };

  // ---------- Small tools for the drawn scenes ----------
  const hash = (n, s) => { const x = Math.sin(n * 127.1 + (s || 0) * 311.7) * 43758.5453123; return x - Math.floor(x); };
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function glow(ctx, x, y, r, c, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function vgrad(ctx, y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }
  // Specks drifting in water, for depth.
  function specks(ctx, t, n, seed, colour, alpha) {
    for (let i = 0; i < n; i++) {
      const x = ((hash(i, seed) * W + t * (8 + hash(i, seed + 1) * 18)) % (W + 40)) - 20;
      const y = (hash(i, seed + 2) * H + Math.sin(t * 0.4 + i) * 12 + H) % H;
      const r = 1 + hash(i, seed + 3) * 3;
      ctx.fillStyle = rgba(colour, alpha * (0.3 + 0.7 * hash(i, seed + 4)));
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  }
  // Sun rays through water.
  function rays(ctx, t, a) {
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const x = 200 + i * 260 + Math.sin(t * 0.2 + i) * 40;
      const g = ctx.createLinearGradient(x, 0, x + 260, H);
      g.addColorStop(0, `rgba(220,240,255,${0.08 * a})`); g.addColorStop(1, 'rgba(220,240,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x + 360, H); ctx.lineTo(x + 160, H); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // A wobbly closed outline, like a membrane.
  function blob(ctx, x, y, r, t, seed, sx, sy) {
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = i / 64 * TAU;
      const rr = r * (1 + 0.035 * Math.sin(3 * a + t * 1.3 + seed) + 0.025 * Math.sin(5 * a - t * 0.9 + seed * 2));
      const px = x + Math.cos(a) * rr * (sx || 1), py = y + Math.sin(a) * rr * (sy || 1);
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }
  function cellBody(ctx, x, y, r, t, seed, hue, opts) {
    const o = opts || {};
    const base = hue || [120, 220, 150];
    blob(ctx, x, y, r, t, seed, o.sx, o.sy);
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r * 1.1);
    g.addColorStop(0, rgba(base.map((v) => Math.min(255, v + 50)), 0.95));
    g.addColorStop(1, rgba(base.map((v) => v * 0.45), 0.95));
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.05); ctx.strokeStyle = rgba(base.map((v) => Math.min(255, v + 80)), 0.9); ctx.stroke();
    if (o.inside !== false) {
      // The instructions: a coiled strand.
      ctx.save(); ctx.lineWidth = Math.max(1.5, r * 0.035); ctx.strokeStyle = 'rgba(255,240,200,0.85)';
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const u = i / 80, a = u * TAU * 1.6 + t * 0.3 + seed;
        const px = x + Math.cos(a) * r * 0.32 * (0.6 + 0.4 * Math.sin(u * 9 + t)), py = y + Math.sin(a) * r * 0.22 + Math.sin(u * 23 + t * 2) * r * 0.04;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.stroke(); ctx.restore();
      for (let i = 0; i < 14; i++) {
        const a = hash(i, seed) * TAU, d = r * (0.45 + 0.4 * hash(i, seed + 1));
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.arc(x + Math.cos(a + t * 0.1) * d, y + Math.sin(a + t * 0.1) * d * 0.85, r * 0.035, 0, TAU); ctx.fill();
      }
    }
  }
  function tail(ctx, x, y, ang, len, t, w) {
    ctx.save(); ctx.strokeStyle = 'rgba(230,250,240,0.85)'; ctx.lineWidth = w || 4; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
      const u = i / 30, d = u * len, wv = Math.sin(u * 9 - t * 14) * len * 0.08 * u;
      const px = x - Math.cos(ang) * d - Math.sin(ang) * wv, py = y - Math.sin(ang) * d + Math.cos(ang) * wv;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke(); ctx.restore();
  }
  // Fade to dark and back where the animation hands over to the simulation.
  function handover(ctx, S, anim, sim) {
    const k = S.c('sim'), lt = S.lt;
    if (lt < k) {
      anim(ctx, S);
      const d = sstep(k - 0.9, k - 0.05, lt);
      if (d > 0) { ctx.fillStyle = `rgba(5,8,10,${d})`; ctx.fillRect(0, 0, W, H); }
      S.st.live = false;
    } else {
      sim(ctx, S);
      const d = 1 - sstep(k, k + 0.8, lt);
      if (d > 0) { ctx.fillStyle = `rgba(5,8,10,${d})`; ctx.fillRect(0, 0, W, H); }
      S.st.live = true;
    }
  }
  const tag = (ctx, S, text, a) => label(ctx, S.L(text), 70, 160, { size: 30, font: F.mono, alpha: a, box: 'rgba(8,12,11,0.6)' });

  // ---------- The drawn scenes ----------
  const ART = {
    // The opening: today's Earth, the question, a small world, the levels, then the day clock.
    hook(ctx, S) {
      const lt = S.lt, c = S.c;
      ctx.fillStyle = '#05080a'; ctx.fillRect(0, 0, W, H);
      stars(ctx, 5, 1);
      const back = sstep(c('day') + 0.8, c('midnight') + 0.5, lt);   // rewind to the young planet
      const side = sstep(c('nobody') - 0.2, c('nobody') + 1.2, lt);
      const px = lerp(960, 600, side), R = lerp(lerp(330, 300, side), 280, back);
      const k = { ocean: 1 - back * 0.98, oxy: 1 - back, ice: 0.1 * (1 - back), mats: 0.5 * (1 - back), life: 0.85 * (1 - back) };
      const rot = lt * 0.06 - back * back * 9;
      planet(ctx, px, 560, R * sstep(0, 1.2, lt + 0.4), rot, k);
      // The question, large.
      const qa = sstep(c('wonder') + 0.9, c('wonder') + 1.7, lt) * (1 - sstep(c('nobody') - 0.6, c('nobody'), lt));
      label(ctx, S.L({ en: 'How did life get here?', es: '¿Cómo llegó aquí la vida?' }), 960, 130, { align: 'center', size: 76, font: F.serif, alpha: qa });
      // A small world with simple rules: the real coast, in a window.
      const wa = side * (1 - sstep(c('portal') - 0.4, c('portal') + 0.2, lt));
      if (wa > 0) {
        const f = root.Footage.get('earth'), x0 = 1060, y0 = 330, w = 720, h = 450;
        ctx.save(); ctx.globalAlpha = wa;
        ctx.fillStyle = '#0b100e'; ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 20); ctx.fill();
        if (f.ready) {
          ctx.save(); ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 20); ctx.clip(); ctx.translate(x0, y0);
          const s = w / W; ctx.scale(s, s); f.draw(ctx, W, h / s, { cx: 80, cy: 50, zoom: 1.15 }); ctx.restore();
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 20); ctx.stroke();
        ctx.restore();
        label(ctx, S.L({ en: 'A small world, simple rules', es: 'Un mundo pequeño, reglas sencillas' }), x0 + w / 2, y0 - 50, { align: 'center', size: 40, font: F.serif, alpha: wa });
      }
      // Every step you can explore.
      const la = sstep(c('portal'), c('portal') + 0.8, lt) * (1 - sstep(c('day') - 0.3, c('day') + 0.4, lt));
      if (la > 0) {
        label(ctx, S.L({ en: 'Explore every step', es: 'Explora cada paso' }), 1150, 190, { size: 46, font: F.serif, alpha: la });
        ladder(ctx, S, 1160, 300, la, (lt - c('portal')) * 3);
      }
      // The day clock.
      const ca = sstep(c('day') + 0.3, c('day') + 1.3, lt);
      if (ca > 0) {
        let h = lerp(24, 0, sstep(c('day') + 0.5, c('midnight'), lt));
        if (lt > c('midnight') + 2.2) h = lerp(0, 24 - 6 / 3600, sstep(c('midnight') + 2.2, c('midnight') + 4.2, lt));
        clock(ctx, 1440, 470, 220, h % 24.0001, { alpha: ca, caption: S.L({ en: 'Earth’s history as one day', es: 'La historia de la Tierra en un día' }) });
        const ha = sstep(c('midnight') + 4.2, c('midnight') + 4.8, lt);
        label(ctx, S.L({ en: 'Humans: the last 6 seconds', es: 'Humanos: los últimos 6 segundos' }), 1440, 150, { align: 'center', size: 36, weight: 600, colour: '#ffd08a', alpha: ha });
      }
    },

    // The young coast in cross-section: sky, tide pools on the rocks, a vent below; a lens on a drying pool.
    sea(ctx, S) {
      const lt = S.lt, c = S.c, t = lt;
      const sky = vgrad(ctx, 0, 560, [[0, '#2a130d'], [0.6, '#8a3f22'], [1, '#d98a4a']]);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 600);
      glow(ctx, 1460, 230 - lt * 2, 220, [255, 200, 120], 0.6);
      ctx.fillStyle = '#ffe2b0'; ctx.beginPath(); ctx.arc(1460, 230 - lt * 2, 46, 0, TAU); ctx.fill();
      const tide = Math.sin(lt * 0.55) * 22;
      const seaY = 560 + tide;
      // The sea.
      ctx.fillStyle = vgrad(ctx, seaY, H, [[0, '#2b6a6a'], [0.5, '#123a44'], [1, '#07141c']]);
      ctx.fillRect(0, seaY, W, H - seaY);
      // Rock shelf on the left, sloping into the deep.
      const rock = (x) => 470 + Math.pow(Math.max(0, x - 200) / 700, 2.2) * 600 + Math.sin(x * 0.02) * 10;
      ctx.fillStyle = '#4b3a32';
      ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 470);
      for (let x = 0; x <= 1300; x += 10) ctx.lineTo(x, rock(x));
      ctx.lineTo(1300, H); ctx.closePath(); ctx.fill();
      // Deep floor to the right, with a vent.
      ctx.fillStyle = '#2b2420';
      ctx.beginPath(); ctx.moveTo(1100, H); ctx.lineTo(1100, 1010);
      for (let x = 1100; x <= W; x += 20) ctx.lineTo(x, 990 + Math.sin(x * 0.01) * 14);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      const vx = 1560, vy = 985;
      ctx.fillStyle = '#3a2c24'; ctx.beginPath(); ctx.moveTo(vx - 50, vy + 10); ctx.lineTo(vx - 18, vy - 90); ctx.lineTo(vx + 18, vy - 90); ctx.lineTo(vx + 50, vy + 10); ctx.closePath(); ctx.fill();
      glow(ctx, vx, vy - 95, 90, [255, 140, 50], 0.55 + 0.15 * Math.sin(t * 3));
      for (let i = 0; i < 50; i++) {
        const u = ((t * 0.25 + hash(i, 3)) % 1), y = vy - 95 - u * 330, x = vx + Math.sin(u * 8 + i) * 30 * u;
        ctx.fillStyle = `rgba(${lerp(255, 90, u) | 0},${lerp(150, 80, u) | 0},${lerp(70, 70, u) | 0},${0.5 * (1 - u)})`;
        ctx.beginPath(); ctx.arc(x, y, 6 + u * 16, 0, TAU); ctx.fill();
      }
      // Tide pools on the shelf: full at high tide, drying at low tide.
      const pools = [[240, 120], [470, 140], [700, 110]];
      for (const [x, w] of pools) {
        const y = rock(x) - 4, depth = 34;
        const level = clamp(0.35 + 0.65 * (seaY < y + 5 ? 1 : 0.6 + 0.4 * Math.cos(lt * 0.55)), 0.2, 1);
        ctx.fillStyle = '#2a1f1a'; ctx.beginPath(); ctx.ellipse(x, y, w / 2, depth, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = 'rgba(70,140,140,0.9)';
        ctx.beginPath(); ctx.ellipse(x, y + depth * (1 - level), w / 2 * Math.sqrt(level), depth * level, 0, 0, Math.PI); ctx.fill();
      }
      // Waves on the surface.
      ctx.strokeStyle = 'rgba(230,240,235,0.5)'; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) { const y = seaY + Math.sin(x * 0.02 + t * 2) * 5; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      // Labels.
      const pa = sstep(c('pools') + 0.3, c('pools') + 1, lt) * (1 - sstep(c('crowd') - 0.3, c('crowd'), lt));
      label(ctx, S.L({ en: 'Tide pools', es: 'Pozas de marea' }), 470, 380, { align: 'center', size: 34, weight: 600, alpha: pa, box: 'rgba(8,12,11,0.55)' });
      label(ctx, S.L({ en: 'Hot vent', es: 'Fuente caliente' }), vx, 700, { align: 'center', size: 34, weight: 600, alpha: sstep(c('pools') + 3, c('pools') + 4, lt) * (1 - sstep(c('crowd') - 0.3, c('crowd'), lt)), box: 'rgba(8,12,11,0.55)' });
      // A lens on a drying pool: molecules crowd and join into chains.
      const la = sstep(c('crowd'), c('crowd') + 0.8, lt);
      if (la > 0) {
        const cx = 1180, cy = 430, r = 330, dry = sstep(c('crowd') + 0.5, c('sim') - 1, lt);
        ctx.save(); ctx.globalAlpha = la;
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(470, rock(470) + 10); ctx.lineTo(cx - r * 0.8, cy + r * 0.55); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = '#123c3e'; ctx.fill(); ctx.stroke();
        ctx.clip();
        const R2 = r * lerp(1, 0.45, dry), pts = [];
        for (let i = 0; i < 70; i++) {
          const a = hash(i, 9) * TAU, d = Math.sqrt(hash(i, 10)) * R2;
          const x = cx + Math.cos(a) * d + Math.sin(t * 1.7 + i) * 9, y = cy + Math.sin(a) * d + Math.cos(t * 1.3 + i * 2) * 9;
          pts.push([x, y, i]);
        }
        ctx.strokeStyle = 'rgba(255,214,120,0.9)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        const link = 26 + 30 * dry;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          if ((i + j) % 3 && dry < 0.9) continue;
          const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1];
          if (dx * dx + dy * dy < link * link * dry) { ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); }
        }
        ctx.stroke();
        for (const [x, y, i] of pts) { ctx.fillStyle = ['#7fd3ff', '#ffd078', '#ff8fb0', '#a8f0a0'][i % 4]; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); }
        ctx.restore();
        label(ctx, S.L(dry > 0.5 ? { en: 'Chains form as the pool dries', es: 'Se forman cadenas al secarse la poza' } : { en: 'Molecules in a pool', es: 'Moléculas en una poza' }), cx, cy + r + 50, { align: 'center', size: 34, weight: 600, alpha: la, box: 'rgba(8,12,11,0.6)' });
      }
      tag(ctx, S, { en: 'Drawing · about 4 billion years ago', es: 'Dibujo · hace unos 4.000 millones de años' }, sstep(0.5, 1.5, lt));
    },

    // A cell: skin and instructions; it grows, splits, and a daughter with a small change swims away.
    cells(ctx, S) {
      const lt = S.lt, c = S.c, t = lt;
      ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#0f3a40'], [1, '#05141a']]); ctx.fillRect(0, 0, W, H);
      rays(ctx, t, 0.8);
      specks(ctx, t, 90, 4, [200, 240, 230], 0.35);
      const grow = sstep(c('four'), c('four') + 1.5, lt);
      const split = sstep(c('divide') + 1.5, c('divide') + 4.5, lt);
      const R = 200 * grow * (1 + 0.15 * sstep(c('divide'), c('divide') + 1.5, lt));
      if (split <= 0) {
        if (R > 1) cellBody(ctx, 960, 540, R, t, 1);
        const la = sstep(c('four') + 2, c('four') + 2.8, lt) * (1 - sstep(c('divide') - 0.3, c('divide'), lt));
        callout(ctx, { x: 960 + R * 0.7, y: 540 - R * 0.7 }, 26, S.L({ en: 'Skin', es: 'Piel' }), la);
        callout(ctx, { x: 960 - R * 0.1, y: 540 + R * 0.05 }, 40, S.L({ en: 'Instructions', es: 'Instrucciones' }), la);
      } else {
        const d = split * 300, r = lerp(R * 0.82, 170, split);
        // The waist between the two halves while they part.
        if (split < 0.6) {
          ctx.fillStyle = 'rgb(90,180,120)';
          const wh = r * 0.9 * (1 - split / 0.6);
          ctx.beginPath(); ctx.ellipse(960, 540, d * 0.9 + 1, wh, 0, 0, TAU); ctx.fill();
        }
        const swim = sstep(c('sim') - 4, c('sim') - 0.5, lt);
        cellBody(ctx, 960 - d, 540, r, t, 1);
        const rx = 960 + d + swim * 900, ry = 540 - swim * 120;
        const tl = sstep(c('divide') + 4.5, c('divide') + 5.5, lt);
        if (tl > 0) tail(ctx, rx - r * 0.95, ry, 0, r * 1.4 * tl, t, 6);
        cellBody(ctx, rx, ry, r, t, 2, [150, 210, 120]);
        const la = sstep(c('divide') + 4.5, c('divide') + 5.2, lt) * (1 - swim);
        callout(ctx, { x: rx + r * 0.5, y: ry - r * 0.6 }, 30, S.L({ en: 'A small mistake: a tail', es: 'Un pequeño error: una cola' }), la);
      }
      tag(ctx, S, { en: 'Drawing · about 3.8 billion years ago', es: 'Dibujo · hace unos 3.800 millones de años' }, sstep(0.5, 1.5, lt));
    },

    // Stromatolites growing layer by layer, then a predator that swallows a cell but not a clump.
    colonies(ctx, S) {
      const lt = S.lt, c = S.c, t = lt;
      const micro = sstep(c('predators') - 0.6, c('predators') + 0.2, lt);
      if (micro < 1) {
        ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#3f8f8a'], [0.6, '#1f5a5c'], [1, '#14302e']]); ctx.fillRect(0, 0, W, H);
        rays(ctx, t, 1);
        const g = sstep(0.3, c('predators') - 0.5, lt);
        ctx.fillStyle = '#b8a27a'; ctx.fillRect(0, 900, W, 180);
        const domes = [[260, 1.0], [560, 0.8], [880, 1.2], [1220, 0.9], [1560, 1.1], [1800, 0.7]];
        domes.forEach(([x, s]) => {
          const layers = Math.floor(4 + 22 * g * s);
          for (let i = 0; i < layers; i++) {
            const hgt = 900 - i * 10 * s, w = 150 * s * (1 - i / 60);
            ctx.fillStyle = i % 2 ? '#7d6a4c' : '#93805c';
            if (i === layers - 1) ctx.fillStyle = '#5f8a54';   // the living mat on top
            ctx.beginPath(); ctx.ellipse(x, hgt, w, 18 + i * 2.2 * s, 0, Math.PI, TAU); ctx.fill();
          }
        });
        label(ctx, S.L({ en: 'Stromatolites: domes built by microbes, layer by layer', es: 'Estromatolitos: cúpulas hechas por microbios, capa a capa' }), 960, 980, { align: 'center', size: 34, weight: 600, alpha: sstep(1, 2, lt) * (1 - micro), box: 'rgba(8,12,11,0.55)' });
        if (micro > 0) { ctx.fillStyle = `rgba(5,8,10,${micro})`; ctx.fillRect(0, 0, W, H); }
        tag(ctx, S, { en: 'Drawing · from 3.5 billion years ago', es: 'Dibujo · desde hace 3.500 millones de años' }, sstep(0.5, 1.5, lt) * (1 - micro));
        return;
      }
      // Up close: a predator.
      const u = lt - c('predators');
      ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#12343a'], [1, '#081a1e']]); ctx.fillRect(0, 0, W, H);
      specks(ctx, t, 60, 7, [200, 240, 230], 0.3);
      for (let i = 0; i < 14; i++) cellBody(ctx, 120 + hash(i, 1) * 1700, 120 + hash(i, 2) * 840 + Math.sin(t + i) * 10, 26, t, i + 5, [120, 220, 150], { inside: false });
      // The lone cell, then the clump of four.
      const eat = sstep(1.2, 2.6, u);
      const px = lerp(300, 820, sstep(0, 2.2, u)) + lerp(0, 380, sstep(3.2, 5, u)) - lerp(0, 260, sstep(5.2, 6.2, u));
      const py = 540 + Math.sin(u * 0.8) * 20;
      const single = { x: 900, y: 540 };
      if (eat < 1) cellBody(ctx, lerp(single.x, px, eat), lerp(single.y, py, eat), 40 * (1 - eat * 0.5), t, 3, [120, 220, 150], { inside: false });
      const clump = [[1350, 500], [1410, 500], [1350, 560], [1410, 560]];
      for (const [x, y] of clump) cellBody(ctx, x, y, 34, t, x, [110, 200, 230], { inside: false });
      ctx.save(); ctx.globalAlpha = 0.85;
      cellBody(ctx, px, py, 120, t, 9, [220, 80, 60], { inside: false });
      ctx.restore();
      if (eat > 0 && eat < 1) cellBody(ctx, lerp(single.x, px, eat), lerp(single.y, py, eat), 40 * (1 - eat * 0.5), t, 3, [120, 220, 150], { inside: false });
      label(ctx, S.L({ en: 'Swallowed', es: 'Tragada' }), 820, 360, { align: 'center', size: 34, weight: 600, alpha: sstep(2, 2.6, u) * (1 - sstep(3.2, 3.6, u)), box: 'rgba(8,12,11,0.6)' });
      label(ctx, S.L({ en: 'Too big to swallow', es: 'Demasiado grande para tragar' }), 1380, 380, { align: 'center', size: 34, weight: 600, alpha: sstep(5, 5.6, u), box: 'rgba(8,12,11,0.6)' });
    },

    // Fronds on the Ediacaran floor, then a jelly whose nerve net makes it squeeze as one.
    bodies(ctx, S) {
      const lt = S.lt, c = S.c, t = lt;
      ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#2f6f86'], [0.7, '#183e52'], [1, '#0e2430']]); ctx.fillRect(0, 0, W, H);
      rays(ctx, t, 0.8);
      const jelly = sstep(c('jelly') - 0.5, c('jelly') + 0.8, lt);
      // The sea floor with fronds and discs.
      ctx.save(); ctx.globalAlpha = 1 - jelly * 0.7;
      ctx.fillStyle = '#8c7a5c'; ctx.fillRect(0, 930, W, 150);
      for (let i = 0; i < 9; i++) {
        const x = 120 + i * 210 + hash(i, 3) * 60, hgt = 260 + hash(i, 4) * 220, sway = Math.sin(t * 0.8 + i) * 0.08;
        ctx.save(); ctx.translate(x, 935); ctx.rotate(sway);
        ctx.strokeStyle = '#6f8f6a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -hgt * 0.25); ctx.stroke();
        // A quilted leaf.
        for (let k = 0; k < 14; k++) {
          const y = -hgt * 0.25 - k * hgt * 0.054, w = 46 * Math.sin((k + 1) / 15 * Math.PI);
          ctx.fillStyle = k % 2 ? '#9fbf8a' : '#88aa78';
          ctx.beginPath(); ctx.ellipse(-w * 0.5, y, w * 0.55, hgt * 0.03, -0.4, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.ellipse(w * 0.5, y, w * 0.55, hgt * 0.03, 0.4, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
      for (let i = 0; i < 5; i++) {
        const x = 250 + i * 380, y = 990;
        for (let k = 4; k > 0; k--) { ctx.fillStyle = k % 2 ? '#a08c68' : '#b49e78'; ctx.beginPath(); ctx.ellipse(x, y, k * 22, k * 7, 0, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
      tag(ctx, S, { en: 'Drawing · about 575 million years ago', es: 'Dibujo · hace unos 575 millones de años' }, sstep(0.5, 1.5, lt) * (1 - jelly));
      if (jelly <= 0) return;
      // The jelly: a nerve signal spreads, then the bell squeezes.
      const P = 2.4, ph = (lt % P) / P;
      const squeeze = sstep(0.45, 0.6, ph) * (1 - sstep(0.7, 0.95, ph));
      const cx = 960, cy = 470 - squeeze * 30, bw = 330 * (1 - 0.14 * squeeze), bh = 260 * (1 + 0.06 * squeeze);
      ctx.save(); ctx.globalAlpha = jelly;
      // Tentacles.
      ctx.strokeStyle = 'rgba(230,200,240,0.5)'; ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const x0 = cx - bw * 0.85 + i * bw * 1.7 / 11;
        ctx.beginPath(); ctx.moveTo(x0, cy + 10);
        for (let k = 1; k <= 12; k++) ctx.lineTo(x0 + Math.sin(t * 2 + i + k * 0.5) * 12, cy + 10 + k * 30);
        ctx.stroke();
      }
      const bell = () => { ctx.beginPath(); ctx.ellipse(cx, cy, bw, bh, 0, Math.PI, TAU); ctx.quadraticCurveTo(cx, cy + 60 - squeeze * 30, cx - bw, cy); ctx.closePath(); };
      bell();
      const g = ctx.createRadialGradient(cx, cy - bh * 0.6, 20, cx, cy, bw);
      g.addColorStop(0, 'rgba(240,210,250,0.75)'); g.addColorStop(1, 'rgba(170,120,220,0.35)');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = `rgba(255,${lerp(200, 140, squeeze) | 0},${lerp(250, 60, squeeze) | 0},0.9)`; ctx.lineWidth = 5 + 6 * squeeze; ctx.stroke();
      // The nerve net: nodes in the bell, lit by a spreading wave.
      const nodes = [];
      for (let i = 0; i < 46; i++) {
        const a = Math.PI + hash(i, 21) * Math.PI, d = Math.sqrt(hash(i, 22)) * 0.88;
        nodes.push([cx + Math.cos(a) * bw * d, cy + Math.sin(a) * bh * d]);
      }
      const origin = nodes[0], front = sstep(0.05, 0.45, ph) * bw * 2.2;
      ctx.lineWidth = 2;
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i][0] - nodes[j][0], dy = nodes[i][1] - nodes[j][1];
        if (dx * dx + dy * dy > 120 * 120) continue;
        const di = Math.hypot(nodes[i][0] - origin[0], nodes[i][1] - origin[1]);
        const lit = Math.abs(di - front) < 60 ? 1 : 0;
        ctx.strokeStyle = lit ? 'rgba(255,255,255,0.9)' : 'rgba(190,160,255,0.35)';
        ctx.beginPath(); ctx.moveTo(nodes[i][0], nodes[i][1]); ctx.lineTo(nodes[j][0], nodes[j][1]); ctx.stroke();
      }
      for (const [x, y] of nodes) {
        const di = Math.hypot(x - origin[0], y - origin[1]), lit = Math.abs(di - front) < 60;
        if (lit) glow(ctx, x, y, 26, [255, 255, 255], 0.8);
        ctx.fillStyle = lit ? '#ffffff' : '#b59cff'; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill();
      }
      ctx.restore();
      const ja = jelly * sstep(c('jelly') + 1.5, c('jelly') + 2.3, lt);
      label(ctx, S.L({ en: 'Nerve net: no centre', es: 'Red nerviosa: sin centro' }), cx - bw - 40, cy - bh * 0.5, { align: 'right', size: 34, weight: 600, alpha: ja, box: 'rgba(8,12,11,0.55)' });
      label(ctx, S.L({ en: 'Squeezing cells', es: 'Células contráctiles' }), cx + bw + 40, cy, { size: 34, weight: 600, colour: '#ffb36a', alpha: ja, box: 'rgba(8,12,11,0.55)' });
    },

    // The Cambrian sea: eyes, shells, legs, and a chase.
    brains(ctx, S) {
      const lt = S.lt, c = S.c, t = lt;
      ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#2e7e94'], [0.6, '#17465a'], [1, '#0c2430']]); ctx.fillRect(0, 0, W, H);
      rays(ctx, t, 1);
      specks(ctx, t, 70, 11, [220, 240, 255], 0.3);
      ctx.fillStyle = '#7d6b50'; ctx.fillRect(0, 950, W, 130);
      // Sponges.
      for (let i = 0; i < 6; i++) {
        const x = 150 + i * 330, h = 90 + hash(i, 31) * 90;
        ctx.fillStyle = '#c98c5a'; ctx.beginPath(); ctx.moveTo(x - 30, 955); ctx.lineTo(x - 42, 955 - h); ctx.lineTo(x + 42, 955 - h); ctx.lineTo(x + 30, 955); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#6b4a30'; ctx.beginPath(); ctx.ellipse(x, 955 - h, 42, 10, 0, 0, TAU); ctx.fill();
      }
      // Crawlers with shells and eyes, walking the floor.
      for (let i = 0; i < 5; i++) {
        const x = ((i * 420 + t * (25 + i * 6)) % (W + 200)) - 100, y = 960 - 14;
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = '#5a4a6a'; ctx.beginPath(); ctx.ellipse(0, 0, 60, 26, 0, Math.PI, TAU); ctx.fill();
        ctx.strokeStyle = '#8a7aa0'; ctx.lineWidth = 3;
        for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 14, -2); ctx.lineTo(k * 14, -24 + Math.abs(k) * 3); ctx.stroke(); }
        ctx.strokeStyle = '#3a2c40'; ctx.lineWidth = 3;
        for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(k * 12, 0); ctx.lineTo(k * 12 + Math.sin(t * 8 + k) * 6, 12); ctx.stroke(); }
        ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(52, -14, 5, 0, TAU); ctx.fill();
        ctx.restore();
      }
      // A school of small swimmers and a hunter after them.
      const chase = sstep(c('race') - 0.5, c('race') + 1, lt);
      const sx = lerp(1300, 700, ((t * 0.06) % 1)), sy = 420 + Math.sin(t * 0.7) * 60;
      for (let i = 0; i < 22; i++) {
        const ox = (hash(i, 41) - 0.5) * 260, oy = (hash(i, 42) - 0.5) * 180;
        const x = sx + ox + Math.sin(t * 2 + i) * 8 - chase * 60 * Math.sin(t * 3 + i), y = sy + oy + Math.cos(t * 1.7 + i) * 8;
        ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
        ctx.fillStyle = '#e8efe9'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 7, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-28, -8 + Math.sin(t * 10 + i) * 3); ctx.lineTo(-28, 8 + Math.sin(t * 10 + i) * 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(10, -2, 2.4, 0, TAU); ctx.fill();
        ctx.restore();
      }
      const hx = sx + 520 - chase * 250 + Math.sin(t * 0.9) * 30, hy = sy + 40 + Math.sin(t * 1.1) * 40;
      ctx.save(); ctx.translate(hx, hy); ctx.scale(-1, 1);
      ctx.fillStyle = '#d4573f';
      ctx.beginPath(); ctx.ellipse(0, 0, 130, 38, 0, 0, TAU); ctx.fill();
      for (let k = -4; k <= 3; k++) { ctx.fillStyle = k % 2 ? '#e0705a' : '#c14b36'; ctx.beginPath(); ctx.ellipse(k * 28, 0, 18, 46 + Math.sin(t * 6 + k) * 6, 0, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#e8866c'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(120, s * 10); ctx.quadraticCurveTo(170, s * 30 + Math.sin(t * 4) * 10, 190, s * 6); ctx.stroke(); }
      glow(ctx, 95, -30, 30, [255, 230, 150], 0.6); glow(ctx, 95, 30, 30, [255, 230, 150], 0.6);
      ctx.fillStyle = '#fff2c0'; ctx.beginPath(); ctx.arc(95, -30, 12, 0, TAU); ctx.arc(95, 30, 12, 0, TAU); ctx.fill();
      ctx.restore();
      label(ctx, S.L({ en: 'Eyes, shells, legs and jaws', es: 'Ojos, conchas, patas y mandíbulas' }), 960, 230, { align: 'center', size: 40, font: F.serif, alpha: sstep(c('cambrian') + 1, c('cambrian') + 2, lt) * (1 - sstep(c('race') - 0.5, c('race'), lt)) });
      label(ctx, S.L({ en: 'An arms race', es: 'Una carrera armamentística' }), 960, 150, { align: 'center', size: 40, font: F.serif, alpha: sstep(c('race') + 0.5, c('race') + 1.3, lt) });
      tag(ctx, S, { en: 'Drawing · about 520 million years ago', es: 'Dibujo · hace unos 520 millones de años' }, sstep(0.5, 1.5, lt));
    },
  };

  // ---------- The ending: local rules, and what emerges ----------
  // A flock of simple agents: each only looks at its neighbours. Once the
  // rules switch on, groups and swirls appear that no agent was told to make.
  function flock(st, n, dt, rule) {
    if (!st.agents) {
      st.agents = [];
      for (let i = 0; i < n; i++) st.agents.push({ x: hash(i, 51) * W, y: hash(i, 52) * H, vx: Math.cos(hash(i, 53) * TAU) * 60, vy: Math.sin(hash(i, 53) * TAU) * 60 });
    }
    const A = st.agents, R = 90;
    const steps = Math.max(1, Math.round(dt * 60));
    for (let s = 0; s < steps; s++) {
      for (const a of A) {
        let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, k = 0;
        for (const b of A) {
          if (a === b) continue;
          const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
          if (d2 > R * R) continue;
          k++; cx += b.x; cy += b.y; ax += b.vx; ay += b.vy;
          if (d2 < 30 * 30) { sx -= dx; sy -= dy; }
        }
        if (k) {
          a.vx += rule * ((cx / k - a.x) * 0.01 + (ax / k - a.vx) * 0.06) + sx * 0.05;
          a.vy += rule * ((cy / k - a.y) * 0.01 + (ay / k - a.vy) * 0.06) + sy * 0.05;
        }
        a.vx += (hash(a.x, s) - 0.5) * 8 * (1 - rule); a.vy += (hash(a.y, s + 1) - 0.5) * 8 * (1 - rule);
        const sp = Math.hypot(a.vx, a.vy) || 1, want = 90;
        a.vx *= lerp(1, want / sp, 0.1); a.vy *= lerp(1, want / sp, 0.1);
      }
      for (const a of A) { a.x = (a.x + a.vx / 60 + W) % W; a.y = (a.y + a.vy / 60 + H) % H; }
    }
    return A;
  }

  function footagePanels(ctx, S, a, lt) {
    const kinds = ['earth', 'cells', 'colonies', 'nerves', 'ecosystems'];
    const names = [LEVELS[0], LEVELS[1], LEVELS[2], { en: 'Bodies and nerves', es: 'Cuerpos y nervios' }, { en: 'Brains and ecosystems', es: 'Cerebros y ecosistemas' }];
    const pw = 560, ph = 350, slots = [[80, 80], [680, 80], [1280, 80], [380, 470], [980, 470]];
    kinds.forEach((k, i) => {
      const f = root.Footage.get(k);
      if (!f.ready) return;
      if (S.frame % kinds.length === i) f.advance(S.dt * kinds.length, 2);
      const [x0, y0] = slots[i], ai = a * sstep(i * 0.25, i * 0.25 + 0.6, lt);
      if (ai <= 0) return;
      ctx.save(); ctx.globalAlpha = ai;
      ctx.beginPath(); ctx.roundRect(x0, y0, pw, ph, 18); ctx.clip(); ctx.translate(x0, y0);
      const e = f.earth;
      if (!S.st['c' + i]) {
        const cam = { cx: e.cols / 2, cy: e.rows / 2, zoom: [1.3, 2.2, 2.6, 3, 1.4][i] };
        if (f.life && f.life.cells.length) { let best = f.life.cells[0]; for (const x of f.life.cells) if (x.clumpSize > best.clumpSize) best = x; cam.cx = best.x; cam.cy = best.y; }
        S.st['c' + i] = clampCam(cam, e);
      }
      const s = pw / W; ctx.scale(s, s); f.draw(ctx, W, ph / s, S.st['c' + i]);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = ai; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(x0, y0, pw, ph, 18); ctx.stroke(); ctx.restore();
      label(ctx, S.L(names[i]), x0 + 20, y0 + ph - 32, { size: 30, weight: 600, alpha: ai, box: 'rgba(8,12,11,0.7)' });
    });
  }

  // ---------- Chapters ----------
  const SCENES = {
    hook: ART.hook,
    wait(ctx, S) { WAIT(ctx, S); },

    sea(ctx, S) {
      handover(ctx, S, ART.sea, (ctx2, S2) => {
        const f = S2.footage, e = f.earth, lt = S2.lt, c = S2.c, st = S2.st;
        if (!st.pool) st.pool = findPool(e);
        if (!st.vent) st.vent = { x: e.vents[0].x, y: e.vents[0].y };
        let target = fit(e), layer = 'nature', mark = null, text = '', since = 99;
        if (lt > c('heat')) { target = { cx: st.vent.x, cy: st.vent.y, zoom: 3 }; layer = 'temp'; mark = st.vent; text = S2.L({ en: 'Hot vent', es: 'Fuente caliente' }); since = lt - c('heat'); }
        if (lt > c('chains')) { target = { cx: st.pool.x, cy: st.pool.y, zoom: 3.5 }; layer = 'chains'; mark = st.pool; text = S2.L({ en: 'Chains in a tide pool', es: 'Cadenas en una poza' }); since = lt - c('chains'); }
        if (lt > c('copiers')) {
          if (!st.cop) st.cop = findField(e, f.chem.f.copiers);
          target = { cx: st.cop.x, cy: st.cop.y, zoom: 2.6 }; layer = 'copiers'; mark = st.cop; text = S2.L({ en: 'Copiers', es: 'Copiadores' }); since = lt - c('copiers');
        }
        if (lt > S2.ce('copiers') + 0.5) { target = fit(e); mark = null; }
        const cam = camTo(S2, e, target, 1.3);
        f.draw(ctx2, W, H, cam, { layer });
        if (mark) callout(ctx2, toScreen(cam, e, mark.x + 0.5, mark.y + 0.5), 46, text, sstep(0.8, 1.6, since) * (1 - sstep(5, 5.6, since)));
        if (layer !== 'nature') {
          const names = { temp: { en: 'Showing: heat', es: 'Mostrando: calor' }, chains: { en: 'Showing: chains', es: 'Mostrando: cadenas' }, copiers: { en: 'Showing: copiers', es: 'Mostrando: copiadores' } };
          label(ctx2, S2.L(names[layer]), 60, H - 210, { size: 28, font: F.mono, box: 'rgba(8,12,11,0.7)' });
        }
      });
    },

    cells(ctx, S) {
      handover(ctx, S, ART.cells, (ctx2, S2) => {
        const f = S2.footage, L = f.life, e = f.earth, lt = S2.lt, c = S2.c, st = S2.st;
        let target = fit(e);
        if (lt > c('motor')) {
          const p = follow(L, st, 'one', () => { let best = null; for (const x of L.cells) if (x.clumpSize === 1 && (!best || x.g.speed > best.g.speed)) best = x; return best; });
          if (p) target = { cx: p.x, cy: p.y, zoom: 16 };
        }
        if (lt > c('chart')) target = Object.assign({}, st.cam || target, { zoom: 3 });
        const cam = camTo(S2, e, target, lt > c('motor') ? 2.4 : 1.4);
        f.draw(ctx2, W, H, cam);
        if (st.one && lt > c('motor') && lt < c('chart')) callout(ctx2, toScreen(cam, e, st.one.x, st.one.y), 60, S2.L({ en: 'Tail: its motor', es: 'Cola: su motor' }), sstep(1, 1.6, lt - c('motor')));
        chart(ctx2, 1080, 140, 760, 520, root.FilmData.journey.cells, {
          alpha: sstep(c('chart'), c('chart') + 0.8, lt), reveal: (lt - c('chart')) / 4, max: 0.12, ticks: [0, 0.04, 0.08, 0.12], colour: '#8fe3a8', start: 0.01,
          startLabel: S2.L({ en: 'at the start', es: 'al principio' }),
          title: S2.L({ en: 'Motor gene, average of all cells', es: 'Gen del motor, media de todas las células' }),
          foot: S2.L({ en: 'Real run · seed 3 · 12,000 steps · 26 generations', es: 'Simulación real · semilla 3 · 12.000 pasos · 26 generaciones' }),
        });
      });
    },

    colonies(ctx, S) {
      handover(ctx, S, ART.colonies, (ctx2, S2) => {
        const f = S2.footage, L = f.life, e = f.earth, lt = S2.lt, c = S2.c, st = S2.st;
        let target = fit(e), pred = null, clump = null;
        if (L.predators.length) {
          if (!st.pred || !L.predators.includes(st.pred)) st.pred = L.predators[0];
          pred = st.pred; target = { cx: pred.x, cy: pred.y, zoom: 5 };
        }
        if (lt > c('stick')) {
          clump = follow(L, st, 'clump', () => { let best = null; for (const x of L.cells) if (!best || x.clumpSize > best.clumpSize) best = x; return best; });
          if (clump) target = { cx: clump.x, cy: clump.y, zoom: 10 };
        }
        if (lt > c('chart')) target = Object.assign({}, st.cam || target, { zoom: 3 });
        const cam = camTo(S2, e, target, 1.5);
        f.draw(ctx2, W, H, cam);
        if (pred && lt < c('stick')) callout(ctx2, toScreen(cam, e, pred.x, pred.y), 50, S2.L({ en: 'Predator', es: 'Depredador' }), sstep(1, 1.6, lt - c('sim')));
        if (clump && lt < c('chart')) callout(ctx2, toScreen(cam, e, clump.x, clump.y), 80, S2.L({ en: 'Too big to swallow', es: 'Demasiado grande para tragar' }), sstep(1.5, 2.1, lt - c('stick')));
        chart(ctx2, 1080, 140, 760, 520, root.FilmData.journey.colonies, {
          alpha: sstep(c('chart'), c('chart') + 0.8, lt), reveal: (lt - c('chart')) / 4, max: 0.4, ticks: [0, 0.1, 0.2, 0.3, 0.4], colour: '#6cc4ee', start: 0.075,
          startLabel: S2.L({ en: 'at the start', es: 'al principio' }),
          title: S2.L({ en: 'Sticking gene, average of all cells', es: 'Gen de pegarse, media de todas las células' }),
          foot: S2.L({ en: 'Real run · seed 3 · 12,000 steps · 71 generations', es: 'Simulación real · semilla 3 · 12.000 pasos · 71 generaciones' }),
        });
      });
    },

    bodies(ctx, S) {
      handover(ctx, S, ART.bodies, (ctx2, S2) => {
        const f = S2.footage, L = f.life, e = f.earth, lt = S2.lt, c = S2.c, st = S2.st, M = root.LifeSim;
        const ok = (x) => { const m = L.clumpOf(x); return m.some((y) => y.role === M.MOVER) && m.some((y) => y.role === M.GERM); };
        let target = fit(e);
        const p = follow(L, st, 'body', () => L.cells.find((x) => x.role === M.GERM && x.clumpSize >= 6 && ok(x)) || L.cells.find((x) => x.role === M.MOVER));
        if (p) target = { cx: p.x, cy: p.y, zoom: 14 };
        if (lt > c('nerves')) {
          const q = follow(L, st, 'nerve', () => {
            let best = 0, pick = null;
            for (const x of L.cells) if (x.role === M.NERVE) { const n = L.clumpOf(x).filter((m) => m.role === M.NERVE).length; if (n > best) { best = n; pick = x; } }
            return pick;
          });
          if (q) target = { cx: q.x, cy: q.y, zoom: 11 };
        }
        const cam = camTo(S2, e, target, 2);
        f.draw(ctx2, W, H, cam);
        const D = root.LifeDraw, rows = [[D.ROLE_RGB[2], { en: 'Squeezing cell', es: 'Célula contráctil' }], [D.CONTRACT_RGB, { en: 'Squeezing now', es: 'Contrayéndose ahora' }], [D.ROLE_RGB[3], { en: 'Germ cell: makes new cells', es: 'Célula germinal: hace células nuevas' }]];
        if (lt > c('nerves')) rows.push([D.ROLE_RGB[4], { en: 'Nerve cell: passes signals', es: 'Célula nerviosa: pasa señales' }]);
        const ka = sstep(c('sim') + 1, c('sim') + 1.8, lt);
        ctx2.save(); ctx2.globalAlpha = ka; ctx2.fillStyle = 'rgba(8,12,11,0.78)';
        ctx2.beginPath(); ctx2.roundRect(60, 150, 640, 40 + rows.length * 56, 14); ctx2.fill(); ctx2.restore();
        rows.forEach(([col, tx], i) => {
          ctx2.save(); ctx2.globalAlpha = ka; ctx2.fillStyle = col; ctx2.beginPath(); ctx2.arc(100, 198 + i * 56, 14, 0, TAU); ctx2.fill(); ctx2.restore();
          label(ctx2, S2.L(tx), 130, 198 + i * 56, { size: 30, alpha: ka });
        });
      });
    },

    brains(ctx, S) {
      handover(ctx, S, ART.brains, (ctx2, S2) => {
        const f = S2.footage, w = f.world, e = f.earth, lt = S2.lt, c = S2.c, st = S2.st;
        const centre = (x) => ({ cx: x.x / w.sx, cy: x.y / w.sx });
        let target = fit(e), sel = null;
        if (!st.prey || !w.creatures.includes(st.prey)) st.prey = w.creatures.find((x) => !x.meat && x.brain) || w.creatures[0];
        sel = st.prey;
        if (sel) target = Object.assign(centre(sel), { zoom: 5 });
        if (lt > c('hunters')) {
          if (!st.hunter || !w.creatures.includes(st.hunter)) st.hunter = w.creatures.find((x) => x.meat);
          sel = st.hunter;
          if (sel) target = Object.assign(centre(sel), { zoom: 4 });
        }
        if (lt > c('balance')) { target = fit(e); sel = null; }
        const cam = camTo(S2, e, target, 1.8);
        f.draw(ctx2, W, H, cam, { selected: sel });
        let prey = 0, hunters = 0;
        for (const x of w.creatures) { if (x.meat) hunters++; else prey++; }
        const a = sstep(c('hunters'), c('hunters') + 1, lt);
        label(ctx2, S2.L({ en: 'Prey', es: 'Presas' }) + '  ' + prey, 1860, 170, { align: 'right', size: 40, weight: 600, font: F.mono, colour: '#e8efe9', alpha: a, box: 'rgba(8,12,11,0.7)' });
        label(ctx2, S2.L({ en: 'Hunters', es: 'Cazadores' }) + '  ' + hunters, 1860, 250, { align: 'right', size: 40, weight: 600, font: F.mono, colour: '#ff8a72', alpha: a, box: 'rgba(8,12,11,0.7)' });
        if (sel && lt < c('hunters')) callout(ctx2, toScreen(cam, e, sel.x / w.sx, sel.y / w.sx), 50, S2.L({ en: 'A brain that learns', es: 'Un cerebro que aprende' }), sstep(1, 1.6, lt - c('sim')));
        if (sel && lt > c('hunters') && lt < c('balance')) callout(ctx2, toScreen(cam, e, sel.x / w.sx, sel.y / w.sx), 50, S2.L({ en: 'Hunter', es: 'Cazador' }), sstep(1, 1.6, lt - c('hunters')));
      });
    },

    // Only local rules: a flock that organises itself, then every level we visited, then Gaia.
    emerge(ctx, S) {
      const lt = S.lt, c = S.c, st = S.st;
      ctx.fillStyle = '#05080a'; ctx.fillRect(0, 0, W, H);
      stars(ctx, 13, 0.7);
      const rule = sstep(c('local') + 2, c('emerges') + 1, lt);
      const fa = 1 - sstep(c('gaia') - 0.5, c('gaia') + 0.3, lt);
      if (fa > 0) {
        const A = flock(st, 170, S.dt, rule);
        ctx.save(); ctx.globalAlpha = fa;
        for (const a of A) {
          const ang = Math.atan2(a.vy, a.vx);
          ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(ang);
          ctx.fillStyle = '#9fe3c8'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, 6); ctx.lineTo(-8, -6); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        // One agent and what it can see.
        const ha = sstep(c('local'), c('local') + 0.8, lt) * (1 - sstep(c('emerges') - 0.5, c('emerges'), lt));
        if (ha > 0) {
          const a0 = A[0];
          ctx.globalAlpha = fa * ha;
          ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
          ctx.beginPath(); ctx.arc(a0.x, a0.y, 90, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          glow(ctx, a0.x, a0.y, 40, [255, 208, 138], 0.8);
        }
        ctx.restore();
        const rules = [{ en: 'React with what is near', es: 'Reaccionar con lo cercano' }, { en: 'Eat', es: 'Comer' }, { en: 'Copy, with small mistakes', es: 'Copiarse, con pequeños errores' }, { en: 'Stick, or let go', es: 'Pegarse, o soltarse' }];
        rules.forEach((r, i) => {
          const a = sstep(c('local') + 1 + i * 0.9, c('local') + 1.6 + i * 0.9, lt) * (1 - sstep(c('emerges') - 0.5, c('emerges'), lt));
          label(ctx, S.L(r), 90, 300 + i * 90, { size: 44, weight: 600, alpha: a, box: 'rgba(8,12,11,0.7)' });
        });
        const na = sstep(c('nothing'), c('nothing') + 0.8, lt) * (1 - sstep(c('local') - 0.3, c('local') + 0.2, lt));
        label(ctx, S.L({ en: 'No plan · no designer · no one in control', es: 'Sin plan · sin diseñador · sin nadie al mando' }), 960, 540, { align: 'center', size: 56, font: F.serif, alpha: na, box: 'rgba(5,8,10,0.7)' });
        const ia = sstep(c('idea') + 0.3, c('idea') + 1, lt) * (1 - sstep(c('nothing') - 0.3, c('nothing'), lt));
        label(ctx, S.L({ en: 'The big idea', es: 'La gran idea' }), 960, 540, { align: 'center', size: 72, font: F.serif, alpha: ia, box: 'rgba(5,8,10,0.7)' });
        const ea = sstep(c('emerges') + 0.5, c('emerges') + 1.3, lt);
        label(ctx, S.L({ en: 'Local rules → emergence', es: 'Reglas locales → emergencia' }), 960, 980, { align: 'center', size: 56, font: F.serif, alpha: ea * fa, box: 'rgba(5,8,10,0.7)' });
      }
      // Every level we visited, then the planet.
      const pa = sstep(c('gaia') - 0.2, c('gaia') + 0.8, lt) * (1 - sstep(c('next') - 0.3, c('next') + 0.6, lt));
      if (pa > 0) footagePanels(ctx, S, pa, lt - c('gaia') + 0.2);
      const out = sstep(c('next') - 0.3, c('next') + 1, lt);
      if (out > 0) {
        planet(ctx, 960, 560, lerp(200, 360, out), lt * 0.1, { ocean: 1, oxy: 1, ice: 0.08, mats: 0.6, life: 0.7 });
        label(ctx, 'Gaia', 960, 110, { align: 'center', size: 72, font: F.serif, alpha: out });
        label(ctx, S.L({ en: 'Your turn: what will emerge?', es: 'Te toca: ¿qué surgirá?' }), 960, 1000, { align: 'center', size: 44, alpha: sstep(c('next') + 1, c('next') + 2, lt) });
      }
    },
  };

  root.FilmScenes = root.FilmScenes || {};
  root.FilmScenes.journey = { SCENES, W, H, clock, hourOf, clockText, MARKS, label, F };
})(typeof self !== 'undefined' ? self : this);
