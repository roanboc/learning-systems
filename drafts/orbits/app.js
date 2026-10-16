// Orbits: the home page as a systems diagram. A dotted Earth turns in the
// middle; each level of organisation is a ring around it, with its systems
// as moons, and a line from each moon to the place on Earth where it began.
// Around everything, the history of the Earth as one 24-hour day.
(function () {
  'use strict';

  const C = window.SystemCatalogue;
  const $ = (s) => document.querySelector(s);
  const ROOT = '../../';
  const T0 = C.T_START;
  const RAD = Math.PI / 180, TAU = Math.PI * 2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cap = (s) => s.replace(/^./, (c) => c.toUpperCase());
  const hourOf = (t) => 24 * (1 - Math.min(T0, t) / T0);
  const tOfHour = (h) => T0 * (1 - h / 24);

  const state = {
    t: 0, anim: null, playing: false, spin: 0,
    kinds: new Set(), layers: new Set(), show: { sun: 0, currents: 0, heat: 0, life: 0 },
    focus: null, hover: null, view: 'orbits',
  };

  // ---------- Colours ----------
  const col = {}, KCOL = {};
  function readColors() {
    const css = getComputedStyle(document.documentElement);
    for (const n of ['bg', 'bg-2', 'ink', 'ink-2', 'ink-3', 'line', 'sea', 'sea-dim', 'land', 'sand', 'rock', 'ice', 'molten', 'hand']) col[n] = css.getPropertyValue('--' + n).trim();
    col.sans = css.getPropertyValue('--sans').trim();
    col.mono = css.getPropertyValue('--mono').trim();
    col.display = css.getPropertyValue('--display').trim();
    for (const k of C.KINDS) KCOL[k.id] = css.getPropertyValue('--k-' + k.id).trim();
  }
  readColors();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors);
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixHex = (a, b, f) => { const x = rgb(a), y = rgb(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * f)).join(',')})`; };

  // ---------- Geometry ----------
  const stage = $('#orbit-view'), cv = $('#orrery'), ctx = cv.getContext('2d'), spinEl = $('#spin');
  const globe = new Globe(spinEl, { lat: 22, lon: 10, spin: 5, wheel: false, minZoom: 1, maxZoom: 1 });
  let W = 1, H = 1, dpr = 1, narrow = false;
  const G = { cx: 0, cy: 0, R: 100, ready: false }, goal = { cx: 0, cy: 0, R: 100 };
  // Radii derived from the outer size R.
  const rings = () => {
    const rd = G.R - (narrow ? 16 : 26), rg = G.R * (narrow ? 0.27 : 0.29), gap = (rd - 18 - rg) / C.KINDS.length;
    return { rd, rg, gap, ring: C.KINDS.map((k, i) => rg + gap * (i + 0.85)) };
  };
  function resize() {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    narrow = W < 860;
    target();
    if (!G.ready) { Object.assign(G, goal); G.ready = true; }
  }
  function target() {
    if (narrow) {
      // Below the clock and chips, and above the card when one is open.
      const sr = stage.getBoundingClientRect(), side = $('.side').getBoundingClientRect();
      const top = side.bottom - sr.top + 10;
      const bottom = state.focus ? H - ($('#card').getBoundingClientRect().top - sr.top) + 6 : 30;
      const h = Math.max(120, H - top - bottom);
      goal.R = Math.min(W / 2 - 20, h / 2);
      goal.cx = W / 2; goal.cy = top + (state.focus ? h / 2 : goal.R + 4);
      return;
    }
    const left = Math.min(330, W * 0.26), right = state.focus ? 430 : 0, aw = W - left - right;
    goal.cx = left + aw / 2; goal.cy = H / 2; goal.R = Math.min(aw / 2, H / 2) - 14;
  }
  function easeLayout(dt) {
    const k = reduce ? 1 : 1 - Math.exp(-dt * 6);
    G.cx += (goal.cx - G.cx) * k; G.cy += (goal.cy - G.cy) * k; G.R += (goal.R - G.R) * k;
    const { rg } = rings();
    globe.layout(G.cx, G.cy, rg);
    spinEl.style.cssText = `left:${G.cx - rg}px;top:${G.cy - rg}px;width:${rg * 2}px;height:${rg * 2}px`;
  }

  // ---------- The dotted Earth ----------
  let planet = null;
  const DOTS = [];
  const STEP = 2.2;
  Planet.load().then((p) => {
    planet = p;
    for (let lat = -88 + STEP / 2; lat < 88; lat += STEP) {
      const n = Math.max(1, Math.round(360 * Math.cos(lat * RAD) / STEP));
      for (let i = 0; i < n; i++) {
        const lon = -180 + (i + 0.5) * 360 / n, la = lat * RAD, lo = lon * RAD;
        DOTS.push({ lat, lon, c: p.coastAt(lat, lon), life: p.lifeAt(lat, lon), heat: p.heatAt(lat, lon),
          x: Math.cos(la) * Math.sin(lo), y: Math.sin(la), z: Math.cos(la) * Math.cos(lo), j: Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453 % 1 });
      }
    }
    seedCurrents();
  });
  const SUN = [-0.55, 0.45, 0.7];
  function drawEarth(now) {
    const { rg } = rings(), look = C.look(state.t), M = globe.matrix();
    const cx = G.cx, cy = G.cy, sp = rg * STEP * RAD;
    // Sea disc.
    ctx.fillStyle = look.molten > 0.5 ? mixHex(col.sea, col.molten, look.molten * 0.6) : col['sea-dim'];
    ctx.beginPath(); ctx.arc(cx, cy, rg, 0, TAU); ctx.fill();
    if (!DOTS.length) return;
    const showSun = state.show.sun, heat = state.show.heat, life = state.show.life;
    const landAt = (1 - look.land) * 20;
    const iceEdge = 90 - 100 * Math.pow(look.ice, 1.3);
    const green = look.green;
    const flick = reduce ? 0 : now / 400;
    for (const d of DOTS) {
      const vz = M[6] * d.x + M[7] * d.y + M[8] * d.z;
      if (vz < 0.02) continue;
      const vx = M[0] * d.x + M[1] * d.y + M[2] * d.z, vy = M[3] * d.x + M[4] * d.y + M[5] * d.z;
      const light = SUN[0] * vx + SUN[1] * vy + SUN[2] * vz;
      const land = d.c > landAt;
      let fill, size = sp * (land ? 0.62 : 0.42) * (0.55 + 0.45 * vz), a = 1;
      if (Math.abs(d.lat) > iceEdge + (land ? 0 : 6) + (d.j - 0.5) * 6) { fill = col.ice; size = sp * 0.6 * (0.55 + 0.45 * vz); }
      else if (land) fill = green > 0 ? (d.life > 0.45 * (2 - green) ? col.land : col.sand) : col.rock;
      else fill = col.sea;
      if (look.molten > 0.05) { fill = mixHex(col.sea, col.molten, look.molten); a = 0.55 + 0.45 * Math.sin(flick + d.j * 20); }
      if (heat > 0.01 && d.heat > 0.25) { fill = mixHex(fill.startsWith('#') ? fill : col.sea, col.molten, heat); size *= 1 + heat * d.heat * (0.8 + 0.3 * Math.sin(flick * 2 + d.j * 9)); }
      if (life > 0.01) { const lv = d.life * (land ? green : state.t <= 3.8e9 ? 1 : 0); size *= 1 + life * (lv * 1.2 - 0.3); if (lv > 0.35) fill = mixHex(fill.startsWith('#') ? fill : col.sea, col.land, life); }
      const night = light < 0 ? 1 : 0;
      a *= 1 - (0.45 + 0.4 * showSun) * Math.min(1, Math.max(0, -light * 4 + 0.2) * (night ? 1 : 0.5));
      if (showSun > 0.01 && light > 0) a = Math.min(1, a + showSun * light * 0.3);
      ctx.globalAlpha = a;
      ctx.fillStyle = fill;
      const x = cx + vx * rg, y = cy - vy * rg;
      if (land || size > 2.6) { ctx.beginPath(); ctx.arc(x, y, size / 2, 0, TAU); ctx.fill(); }
      else ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    // A soft rim.
    ctx.strokeStyle = col.sea; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(cx, cy, rg, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
    if (showSun > 0.01) {
      // The sun, off to the upper left, and the line between day and night.
      const sx = cx + SUN[0] * rg * 1.25, sy = cy - SUN[1] * rg * 1.25;
      ctx.globalAlpha = showSun;
      ctx.fillStyle = '#ffcf3a';
      ctx.beginPath(); ctx.arc(sx, sy, 9, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffcf3a'; ctx.lineWidth = 2;
      for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4 + (reduce ? 0 : now / 3000); ctx.beginPath(); ctx.moveTo(sx + Math.cos(an) * 13, sy + Math.sin(an) * 13); ctx.lineTo(sx + Math.cos(an) * 18, sy + Math.sin(an) * 18); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
  }

  // Currents: little tracers riding the surface flow.
  const parts = [], flow = [0, 0];
  function seedCurrents() { for (let i = 0; i < 500; i++) parts.push(spawn({}, true)); }
  function spawn(p, early) {
    for (let k = 0; k < 40; k++) {
      p.lat = Math.asin(Math.random() * 2 - 1) / RAD; p.lon = Math.random() * 360 - 180;
      if (Math.abs(p.lat) < 72 && planet.coastAt(p.lat, p.lon) < -0.8) break;
    }
    p.life = 2 + Math.random() * 3; p.age = early ? Math.random() * p.life : 0;
    return p;
  }
  function drawCurrents(dt) {
    const a = state.show.currents;
    if (a < 0.01 || !parts.length) return;
    const { rg } = rings();
    ctx.fillStyle = '#ffffff';
    for (const p of parts) {
      if (!reduce) {
        planet.current(p.lat, p.lon, flow);
        p.lat += flow[1] * 6 * dt;
        p.lon = Globe.wrap(p.lon + flow[0] * 6 * dt / Math.max(0.25, Math.cos(p.lat * RAD)));
        p.age += dt;
        if (p.age > p.life || Math.abs(p.lat) > 76 || planet.coastAt(p.lat, p.lon) > -0.2 || Math.hypot(flow[0], flow[1]) < 0.03) spawn(p);
      }
      const q = globe.project(p.lat, p.lon);
      if (q.z < 0.05) continue;
      ctx.globalAlpha = a * Math.sin(Math.PI * Math.min(1, p.age / p.life)) * 0.9;
      ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(1, rg / 110), 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- Rings, moons and the clock ----------
  const MOONS = C.SYSTEMS.map((s) => ({ s, k: C.KINDS.findIndex((k) => k.id === s.kind) }));
  {
    const byRing = {};
    for (const m of MOONS) (byRing[m.k] = byRing[m.k] || []).push(m);
    for (const k in byRing) byRing[k].forEach((m, i, list) => { m.phase = -Math.PI / 2 + 0.9 + k * 1.37 + i * TAU / list.length; });
  }
  const appear = (t) => clamp((t - state.t) / 4e7 + 1, 0, 1);
  function moonAt(m) {
    const { ring } = rings(), r = ring[m.k];
    const an = m.phase + state.spin / (1 + m.k * 0.55);
    return { x: G.cx + Math.cos(an) * r, y: G.cy + Math.sin(an) * r, an };
  }
  const moonR = () => clamp(rings().gap * 0.34, 8, 17);

  function drawRings() {
    const { ring, gap } = rings();
    C.KINDS.forEach((k, i) => {
      const on = state.kinds.size === 0 || state.kinds.has(k.id);
      ctx.strokeStyle = KCOL[k.id];
      ctx.globalAlpha = on ? (state.kinds.has(k.id) ? 0.95 : 0.4) : 0.12;
      ctx.lineWidth = state.kinds.has(k.id) ? 3 : 1.5;
      ctx.setLineDash(state.t > C.SYSTEMS.filter((s) => s.kind === k.id).reduce((a, s) => Math.max(a, s.t), 0) ? [3, 6] : []);
      ctx.beginPath(); ctx.arc(G.cx, G.cy, ring[i], 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      if (gap > 22) arcText(`${i + 1} · ${k.short.toUpperCase()}`, ring[i] + 4, -Math.PI / 2 + 0.55, KCOL[k.id], on ? 0.9 : 0.25);
    });
    ctx.globalAlpha = 1;
  }
  // Letters set along a circle, centred on an angle, reading clockwise.
  function arcText(text, r, an, color, alpha) {
    ctx.save();
    ctx.font = '600 10.5px ' + col.mono;
    ctx.fillStyle = color; ctx.globalAlpha = alpha;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    const widths = [...text].map((ch) => ctx.measureText(ch).width + 0.8), total = widths.reduce((a, b) => a + b, 0);
    let a = an - total / 2 / r;
    [...text].forEach((ch, i) => {
      const w = widths[i], m = a + w / 2 / r;
      ctx.save();
      ctx.translate(G.cx + Math.cos(m) * r, G.cy + Math.sin(m) * r);
      ctx.rotate(m + Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      a += w / r;
    });
    ctx.restore();
  }

  function drawLinks() {
    for (const m of MOONS) {
      const a = appear(m.s.t);
      if (a <= 0) continue;
      const p = globe.project(m.s.lat, m.s.lon);
      if (p.z < 0.05) continue;
      const mp = moonAt(m), hot = state.focus === m.s || state.hover === m.s;
      const dim = state.kinds.size && !state.kinds.has(m.s.kind);
      ctx.globalAlpha = a * (dim ? 0.08 : hot ? 0.95 : 0.35) * Math.min(1, p.z * 4);
      ctx.strokeStyle = KCOL[m.s.kind]; ctx.lineWidth = hot ? 2 : 1.2;
      ctx.setLineDash(hot ? [] : [2, 4]);
      ctx.beginPath(); ctx.moveTo(mp.x, mp.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = KCOL[m.s.kind];
      ctx.beginPath(); ctx.arc(p.x, p.y, hot ? 4.5 : 3, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Each system's moon carries a small picture of what it is.
  function glyph(id, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = Math.max(1.2, r * 0.12); ctx.lineCap = 'round';
    const s = r * 0.55;
    const dot = (px, py, rr, fill) => { ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); fill ? ctx.fill() : ctx.stroke(); };
    switch (id) {
      case 'early-earth': dot(-s * 0.45, s * 0.25, s * 0.38); dot(s * 0.45, -s * 0.1, s * 0.3); dot(s * 0.05, -s * 0.6, s * 0.18); break;
      case 'first-cells': dot(0, 0, s * 0.8); dot(s * 0.15, -s * 0.1, s * 0.25, true); break;
      case 'colonies': dot(-s * 0.4, -s * 0.4, s * 0.38); dot(s * 0.4, -s * 0.4, s * 0.38); dot(-s * 0.4, s * 0.4, s * 0.38); dot(s * 0.4, s * 0.4, s * 0.38); break;
      case 'bodies': ctx.beginPath(); ctx.ellipse(0, 0, s * 0.95, s * 0.5, 0, 0, TAU); ctx.stroke(); for (const px of [-0.4, 0, 0.4]) { ctx.beginPath(); ctx.moveTo(px * s, -s * 0.45); ctx.lineTo(px * s, s * 0.45); ctx.stroke(); } break;
      case 'nerve-nets': for (let k = 0; k < 5; k++) { const an = k * TAU / 5 - Math.PI / 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * s * 0.9, Math.sin(an) * s * 0.9); ctx.stroke(); dot(Math.cos(an) * s * 0.9, Math.sin(an) * s * 0.9, s * 0.14, true); } dot(0, 0, s * 0.2, true); break;
      case 'brains': ctx.beginPath(); ctx.arc(-s * 0.32, 0, s * 0.55, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(s * 0.32, 0, s * 0.55, -Math.PI * 0.5, Math.PI * 0.5); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -s * 0.55); ctx.lineTo(0, s * 0.55); ctx.stroke(); break;
      case 'ecosystems': ctx.beginPath(); ctx.moveTo(-s * 0.8, s * 0.5); ctx.quadraticCurveTo(-s * 0.2, -s * 0.9, s * 0.8, -s * 0.5); ctx.quadraticCurveTo(s * 0.1, s * 0.9, -s * 0.8, s * 0.5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-s * 0.8, s * 0.5); ctx.lineTo(s * 0.4, -s * 0.2); ctx.stroke(); break;
      default: dot(0, 0, s * 0.3, true); for (let k = 0; k < 6; k++) { const an = k * TAU / 6; ctx.beginPath(); ctx.moveTo(Math.cos(an) * s * 0.3, Math.sin(an) * s * 0.3); ctx.lineTo(Math.cos(an) * s * 0.95, Math.sin(an) * s * 0.95); ctx.stroke(); }
    }
    ctx.restore();
  }

  function drawMoons(now) {
    const mr = moonR();
    ctx.textBaseline = 'middle';
    for (const m of MOONS) {
      const a = appear(m.s.t), p = moonAt(m), s = m.s;
      const hot = state.focus === s || state.hover === s, dim = state.kinds.size && !state.kinds.has(s.kind);
      if (a <= 0) {
        // Not yet: a dashed outline where it will be.
        ctx.globalAlpha = dim ? 0.1 : 0.35;
        ctx.strokeStyle = KCOL[s.kind]; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(p.x, p.y, mr * 0.8, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        continue;
      }
      const r = mr * (hot ? 1.18 : 1) * (0.6 + 0.4 * a);
      ctx.globalAlpha = a * (dim ? 0.25 : 1);
      if (hot && !reduce) {
        const ph = (now / 1400) % 1;
        ctx.strokeStyle = KCOL[s.kind]; ctx.lineWidth = 2; ctx.globalAlpha *= 1 - ph;
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 4 + ph * 14, 0, TAU); ctx.stroke();
        ctx.globalAlpha = a * (dim ? 0.25 : 1);
      }
      ctx.fillStyle = KCOL[s.kind];
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = col['bg-2']; ctx.lineWidth = 2.5; ctx.stroke();
      glyph(s.id, p.x, p.y, r);
      // On a phone with a card open the rings are small: only the open moon is named.
      if (hot || !narrow || G.R >= 140) {
        ctx.font = (hot ? '700 ' : '600 ') + (narrow ? '11.5px ' : hot ? '14px ' : '13px ') + col.sans;
        const name = narrow && !hot ? s.title.split(':')[0] : s.title, tw = ctx.measureText(name).width;
        // Outward from the planet, unless that runs off the screen.
        let right = Math.cos(p.an) >= -0.15;
        if (right && p.x + r + 7 + tw > W - 4) right = false;
        else if (!right && p.x - r - 7 - tw < 4) right = true;
        ctx.textAlign = right ? 'left' : 'right';
        const lx = p.x + (right ? r + 7 : -r - 7);
        ctx.lineWidth = 4; ctx.strokeStyle = col.bg; ctx.lineJoin = 'round';
        ctx.strokeText(name, lx, p.y);
        ctx.fillStyle = col.ink;
        ctx.fillText(name, lx, p.y);
        ctx.textAlign = 'left';
      }
    }
    ctx.globalAlpha = 1;
  }

  const handAngle = (h) => h / 24 * TAU - Math.PI / 2;
  function drawClock() {
    const { rd, rg } = rings(), cx = G.cx, cy = G.cy, h = hourOf(state.t);
    // Eons as coloured arcs just inside the dial.
    ctx.lineWidth = narrow ? 3 : 4;
    for (const e of C.EONS) {
      ctx.strokeStyle = e.color; ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(cx, cy, rd - (narrow ? 5 : 7), handAngle(hourOf(Math.min(T0, e.t0))) + 0.004, handAngle(hourOf(e.t1)) - 0.004); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // The dial and the part of the day that has passed.
    ctx.strokeStyle = col.line; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, rd, 0, TAU); ctx.stroke();
    ctx.strokeStyle = col.ink; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, rd, handAngle(0), handAngle(h)); ctx.stroke();
    // Hours.
    ctx.font = '500 11px ' + col.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let k = 0; k < 24; k++) {
      const an = handAngle(k), major = k % 3 === 0;
      ctx.strokeStyle = col['ink-3']; ctx.lineWidth = major ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * (rd + 3), cy + Math.sin(an) * (rd + 3)); ctx.lineTo(cx + Math.cos(an) * (rd + (major ? 9 : 6)), cy + Math.sin(an) * (rd + (major ? 9 : 6))); ctx.stroke();
      if (major && (!narrow || k % 6 === 0)) { ctx.fillStyle = col['ink-3']; ctx.fillText(k === 0 ? '0h · 24h' : k + 'h', cx + Math.cos(an) * (rd + 18), cy + Math.sin(an) * (rd + 18)); }
    }
    // Systems and events on the dial.
    for (const e of C.EVENTS) {
      const an = handAngle(hourOf(e.t)), x = cx + Math.cos(an) * rd, y = cy + Math.sin(an) * rd;
      ctx.fillStyle = col['bg-2']; ctx.strokeStyle = col['ink-2']; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    for (const s of C.SYSTEMS) {
      const an = handAngle(hourOf(s.t)), x = cx + Math.cos(an) * rd, y = cy + Math.sin(an) * rd;
      ctx.fillStyle = KCOL[s.kind];
      ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill();
      ctx.strokeStyle = col['bg-2']; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // The hand.
    const an = handAngle(h);
    ctx.strokeStyle = col.hand; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * (rg + 6), cy + Math.sin(an) * (rg + 6)); ctx.lineTo(cx + Math.cos(an) * (rd - 9), cy + Math.sin(an) * (rd - 9)); ctx.stroke();
    ctx.fillStyle = col.hand;
    ctx.beginPath(); ctx.arc(cx + Math.cos(an) * rd, cy + Math.sin(an) * rd, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = col.bg;
    ctx.beginPath(); ctx.arc(cx + Math.cos(an) * rd, cy + Math.sin(an) * rd, 3, 0, TAU); ctx.fill();
  }

  // ---------- Time ----------
  function travelTo(t, ms) {
    state.playing = false; syncPlay();
    if (reduce || !ms) { state.t = t; state.anim = null; return; }
    state.anim = { from: state.t, to: t, k: 0, ms };
  }
  let lastClock = '';
  function stepTime(dt) {
    const before = state.t;
    if (state.anim) {
      const a = state.anim;
      a.k += dt * 1000 / a.ms;
      const e = a.k >= 1 ? 1 : (a.k < 0.5 ? 4 * a.k ** 3 : 1 - (-2 * a.k + 2) ** 3 / 2);
      state.t = a.from + (a.to - a.from) * e;
      if (a.k >= 1) state.anim = null;
    } else if (state.playing) {
      // The whole day in about 45 seconds: an hour of the day every two seconds.
      state.t = Math.max(0, state.t - T0 / 24 / 1.9 * dt);
      for (const it of C.history()) if (it.t <= before && it.t > state.t && it.t < T0) toast(C.clock(it.t) + ' · ' + it.title);
      if (state.t <= 0) { state.playing = false; syncPlay(); }
    }
    const clock = C.clock(state.t);
    if (clock !== lastClock) {
      lastClock = clock;
      const p = C.periodAt(state.t);
      $('#clock-time').textContent = state.t < 1e4 ? '24:00' : clock.slice(0, 5);
      $('#clock-ago').textContent = cap(C.when(state.t));
      $('#clock-era').textContent = state.t < 1e4 ? 'Quaternary period. Everything on the rings is here.' : (p.name || '') + ' · ' + C.systemsAt(state.t).length + ' of ' + C.SYSTEMS.length + ' systems so far';
    }
  }
  function syncPlay() { $('#play').textContent = state.playing ? 'Pause' : 'Play the day'; }
  $('#play').addEventListener('click', () => {
    state.anim = null;
    if (!state.playing && state.t < 1e7) state.t = T0;
    state.playing = !state.playing;
    if (state.playing) { closeCard(); toast('00:00 · Earth forms'); }
    syncPlay();
  });
  $('#now').addEventListener('click', () => travelTo(0, 1200));
  let toastEl = null;
  function toast(text) {
    if (toastEl) toastEl.remove();
    toastEl = document.createElement('div');
    toastEl.className = 'tip';
    toastEl.innerHTML = `<b>${esc(text)}</b>`;
    const { rd } = rings();
    toastEl.style.left = G.cx + 'px'; toastEl.style.top = (G.cy + rd + 6) + 'px';
    toastEl.style.transform = 'translate(-50%, 0)';
    stage.appendChild(toastEl);
    const el = toastEl;
    setTimeout(() => { if (el === toastEl) { el.remove(); toastEl = null; } }, 2200);
  }

  // ---------- Pointer: moons, the dial and the hand ----------
  function moonUnder(x, y) {
    const mr = moonR() + 6;
    let best = null, bd = mr * mr;
    for (const m of MOONS) {
      if (appear(m.s.t) <= 0) continue;
      const p = moonAt(m), d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }
  const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const onDial = (x, y) => { const { rd } = rings(); return Math.abs(Math.hypot(x - G.cx, y - G.cy) - rd) < 16; };
  const hourAt = (x, y) => { let a = Math.atan2(y - G.cy, x - G.cx) + Math.PI / 2; if (a < 0) a += TAU; return a / TAU * 24; };
  let dial = null, press = null;
  cv.addEventListener('pointerdown', (e) => {
    const [x, y] = local(e);
    if (onDial(x, y)) {
      dial = { id: e.pointerId, last: hourOf(state.t) };
      cv.setPointerCapture(e.pointerId);
      state.anim = null; state.playing = false; syncPlay();
      setHour(hourAt(x, y));
      return;
    }
    press = { x, y };
  });
  // Dragging the hand: it cannot wrap past midnight, so the day has a start and an end.
  function setHour(h) {
    if (dial && Math.abs(h - dial.last) > 12) h = dial.last > 12 ? 24 : 0;
    dial.last = h;
    state.t = tOfHour(clamp(h, 0, 24));
    showTip(null);
  }
  cv.addEventListener('pointermove', (e) => {
    const [x, y] = local(e);
    if (dial) { setHour(hourAt(x, y)); return; }
    if (e.pointerType !== 'mouse') return;
    const m = moonUnder(x, y);
    state.hover = m ? m.s : null;
    cv.classList.toggle('pointer', !!m);
    cv.classList.toggle('dial', !m && onDial(x, y));
    if (m) { const p = moonAt(m); showTip(p.x, p.y - moonR(), m.s.title, cap(m.s.when) + ' · ' + C.clock(m.s.t)); }
    else if (onDial(x, y)) { const h = hourAt(x, y), t = tOfHour(h); const ev = nearestEvent(h); showTip(x, y - 4, ev ? ev.title : C.clock(t).slice(0, 5), ev ? C.clock(ev.t) + ' · ' + C.when(ev.t) : cap(C.when(t))); }
    else showTip(null);
  });
  function nearestEvent(h) {
    let best = null, bd = 0.25;
    for (const it of C.history()) { const d = Math.abs(hourOf(it.t) - h); if (d < bd) { bd = d; best = it; } }
    return best;
  }
  const up = (e) => {
    if (dial && dial.id === e.pointerId) { dial = null; return; }
    if (press) {
      const [x, y] = local(e);
      if (Math.hypot(x - press.x, y - press.y) < 8) { const m = moonUnder(x, y); if (m) openCard(m.s); }
      press = null;
    }
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', () => { dial = null; press = null; });
  cv.addEventListener('pointerleave', () => { if (!dial) { state.hover = null; showTip(null); } });
  cv.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      state.anim = null; state.playing = false; syncPlay();
      state.t = tOfHour(clamp(hourOf(state.t) + (e.key === 'ArrowRight' ? 0.25 : -0.25), 0, 24));
    }
  });
  globe.ontap = (x, y) => {
    let best = null, bd = 18 * 18;
    for (const s of C.SYSTEMS) {
      if (appear(s.t) <= 0) continue;
      const p = globe.project(s.lat, s.lon);
      if (p.z < 0.05) continue;
      const d = (p.x - G.cx - (x - globe.radius)) ** 2 + (p.y - G.cy - (y - globe.radius)) ** 2;
      if (d < bd) { bd = d; best = s; }
    }
    if (best) openCard(best);
  };
  function showTip(x, y, title, text) {
    const el = $('#tip');
    if (x == null) { el.hidden = true; return; }
    el.hidden = false;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.querySelector('b').textContent = title;
    el.querySelector('small').textContent = text || '';
  }

  // ---------- Highlights ----------
  function buildChips() {
    const kinds = $('#kind-chips'), layers = $('#layer-chips');
    C.KINDS.forEach((k, i) => {
      const b = chip(`${i + 1} ${k.short}`, KCOL[k.id], k.text, true);
      b.addEventListener('click', () => {
        const on = !state.kinds.has(k.id);
        on ? state.kinds.add(k.id) : state.kinds.delete(k.id);
        b.setAttribute('aria-pressed', String(on));
      });
      kinds.appendChild(b);
    });
    const LCOL = { sun: '#f5a524', currents: '#2f6bff', heat: '#ff5a1f', life: '#17b26a' };
    for (const l of C.LAYERS) {
      const b = chip(l.name, LCOL[l.id], l.text);
      b.addEventListener('click', () => {
        const on = !state.layers.has(l.id);
        on ? state.layers.add(l.id) : state.layers.delete(l.id);
        b.setAttribute('aria-pressed', String(on));
      });
      layers.appendChild(b);
    }
  }
  function chip(label, color, title, ring) {
    const b = document.createElement('button');
    b.className = 'chip';
    b.style.setProperty('--c', color);
    b.setAttribute('aria-pressed', 'false');
    b.title = title;
    b.innerHTML = `<i class="${ring ? 'ring' : ''}"></i>${esc(label)}`;
    return b;
  }
  function easeShow(dt) {
    const k = reduce ? 1 : 1 - Math.exp(-dt * 5);
    for (const id in state.show) state.show[id] += ((state.layers.has(id) ? 1 : 0) - state.show[id]) * k;
  }

  // ---------- Card ----------
  let preview = null;
  function openCard(s) {
    state.focus = s;
    const card = $('#card');
    card.hidden = false;
    card.style.setProperty('--kc', KCOL[s.kind]);
    const k = C.kind(s.kind), lvl = C.KINDS.indexOf(k) + 1, done = C.labsDone();
    const links = C.links(s).map((l, i) => {
      const small = l.kind === 'lab' ? `<small>${esc(l.lab.question)}${done.includes(l.lab.id) ? ' · done ✓' : ''}</small>` : l.text ? `<small>${esc(l.text)}</small>` : '';
      return `<a class="${i === 0 ? 'main' : ''}" href="${esc(ROOT + l.path)}"><span>${esc(l.label)}${small}</span><span aria-hidden="true">→</span></a>`;
    }).join('');
    $('#card-body').innerHTML = `
      <span class="tag">Level ${lvl} · ${esc(k.short)}</span>
      <h2>${esc(s.title)}</h2>
      <dl class="facts"><dt>When</dt><dd>${esc(cap(s.when))}</dd><dt>Clock</dt><dd>${s.t > 0 ? C.clock(s.t).slice(0, 5) + ' on Earth’s day' : 'Midnight: now'}</dd><dt>Where</dt><dd>${esc(s.place)}</dd></dl>
      <p>${esc(s.text)}</p>
      <p class="evidence"><b>The evidence</b>${esc(s.evidence)}</p>
      <div class="links">${links}</div>`;
    const i = C.SYSTEMS.indexOf(s);
    walk($('#walk-prev'), C.SYSTEMS[i - 1], '‹ ');
    walk($('#walk-next'), C.SYSTEMS[i + 1], '', ' ›');
    if (preview) preview.stop();
    const status = $('#preview-status');
    preview = Previews.mount(s.preview, $('#preview'), { onStatus: (t) => { status.hidden = !t; status.textContent = t; } });
    globe.hold = true;
    globe.flyTo(s.lat, s.lon, 1);
    travelTo(s.until || s.t, 1200);
    document.body.classList.add('focused');
    requestAnimationFrame(target);
    $('#card-body').scrollTop = 0;
  }
  function walk(btn, s, pre, post) {
    btn.disabled = !s;
    btn.textContent = s ? (pre || '') + s.title + (post || '') : '';
    btn.onclick = s ? () => openCard(s) : null;
  }
  function closeCard() {
    if (!state.focus) return;
    state.focus = null;
    $('#card').hidden = true;
    document.body.classList.remove('focused');
    if (preview) { preview.stop(); preview = null; }
    globe.hold = false;
    target();
  }
  $('#card-close').addEventListener('click', closeCard);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCard(); });

  // ---------- Frame ----------
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden || state.view !== 'orbits') return;
    if (!reduce && !state.focus && !state.hover && !dial) state.spin += dt * 0.05;
    globe.tick(dt);
    stepTime(dt);
    easeShow(dt);
    easeLayout(dt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawClock();
    drawRings();
    drawEarth(now);
    if (planet) drawCurrents(dt);
    drawLinks();
    drawMoons(now);
  }

  // ---------- List view ----------
  function buildList() {
    const done = C.labsDone(), labs = window.LabCatalogue || [];
    const day = C.EONS.map((e) => {
      const a = hourOf(Math.min(T0, e.t0)) / 24, b = hourOf(e.t1) / 24;
      return `<div class="eon" style="left:${a * 100}%;width:${(b - a) * 100}%;--c:${e.color}"><span>${esc(e.name)}</span></div>`;
    }).join('') + C.SYSTEMS.map((s) => `<a href="${esc(ROOT + C.links(s)[0].path)}" title="${esc(s.title)} · ${C.clock(s.t).slice(0, 5)}" style="left:${hourOf(s.t) / 24 * 100}%;--kc:${KCOL[s.kind]}" aria-label="${esc(s.title)}"></a>`).join('');
    const levels = C.KINDS.map((k, i) => {
      const tiles = C.SYSTEMS.filter((s) => s.kind === k.id).map((s) => {
        const ls = C.links(s);
        return `<article class="tile" style="--kc:${KCOL[s.kind]}">
          <div class="top"><a href="${esc(ROOT + ls[0].path)}">${esc(s.title)}</a><span>${s.t > 0 ? C.clock(s.t).slice(0, 5) : '24:00'} · ${esc(C.short(s.t))}</span></div>
          <p>${esc(s.text)}</p>
          <span class="where">${esc(s.place)}</span>
          <div class="more">${ls.slice(1).map((l) => `<a href="${esc(ROOT + l.path)}">${esc(l.label)}${l.lab && done.includes(l.lab.id) ? ' ✓' : ''}</a>`).join('')}</div>
        </article>`;
      }).join('');
      return `<section style="--kc:${KCOL[k.id]}"><h2><span class="n">${i + 1}</span>${esc(k.name)} <small>${esc(k.text)}</small></h2><div class="cards">${tiles}</div></section>`;
    }).join('');
    $('#list-view').innerHTML = `<div class="list-inner">
      <header><h1>Every system, level by level</h1><p class="lede">Small simulated worlds where living systems organise themselves from local rules. Here they are as a plain list, from chemistry to ecosystems, with the time each one appears on Earth's 24-hour day.</p></header>
      <section><h2>Ways in</h2><div class="ways-grid">
        <a href="${ROOT}world/index.html#story"><b>Watch the story</b><span>A guided tour of one world, chapter by chapter.</span></a>
        <a href="${ROOT}labs/index.html"><b>Take a mechanism apart</b><span>Guided labs: change one thing and follow the effect. ${done.length} of ${labs.length} done.</span></a>
        <a href="${ROOT}world/index.html"><b>Explore freely</b><span>The World Viewer: every chapter on one stage.</span></a>
      </div></section>
      <section><h2>Earth's day <small>4.54 billion years as 24 hours</small></h2><div class="day">${day}</div><div class="day-scale"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span></div></section>
      ${levels}
      <p class="foot">Places are where the oldest evidence was found, or a living example. Continents on the Earth are today's, so places can be found.</p>
    </div>`;
  }

  // ---------- Views ----------
  const STORE = 'learning-systems.orbits-view';
  // quiet: opened from a link or a remembered choice, so nothing new to remember.
  function setView(v, quiet) {
    state.view = v;
    const list = v === 'list';
    $('#orbit-view').hidden = list; $('#list-view').hidden = !list;
    $('#tab-orbits').setAttribute('aria-selected', String(!list));
    $('#tab-list').setAttribute('aria-selected', String(list));
    document.body.classList.toggle('listing', list);
    if (list && preview) { preview.stop(); preview = null; }
    if (!list && state.focus) openCard(state.focus);
    if (!quiet) { try { localStorage.setItem(STORE, v); } catch (e) { /* not kept */ } }
    if (!list) requestAnimationFrame(resize);
  }
  $('#tab-orbits').addEventListener('click', () => setView('orbits'));
  $('#tab-list').addEventListener('click', () => setView('list'));

  $('#sr-systems').innerHTML = C.SYSTEMS.map((s) => `<li><button data-id="${s.id}">${esc(s.title)}, ${esc(s.when)}, ${esc(s.place)}</button></li>`).join('');
  $('#sr-systems').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) openCard(C.system(b.dataset.id)); });
  const done = C.labsDone(), labs = window.LabCatalogue || [];
  $('#labs-done').textContent = labs.length ? done.length + '/' + labs.length : '';

  buildChips();
  buildList();
  addEventListener('resize', resize);
  resize();
  stepTime(0);
  let start = 'orbits';
  try { start = localStorage.getItem(STORE) || 'orbits'; } catch (e) { /* not kept */ }
  if (location.hash === '#list') start = 'list';
  if (start === 'list') setView('list', true);
  requestAnimationFrame(frame);
  window.Orbits = { globe, state, openCard, travelTo };
})();
