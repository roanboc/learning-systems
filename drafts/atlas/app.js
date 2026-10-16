// Field Atlas: the home page as a printed atlas. An engraved globe stays in
// view while the plates scroll past, one per system in the order they arose,
// and scrolling moves the planet through time. The index lists the same
// things as plain links.
(function () {
  'use strict';

  const C = window.SystemCatalogue;
  const $ = (s) => document.querySelector(s);
  const ROOT = '../../';
  const T0 = C.T_START;
  const RAD = Math.PI / 180;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const SUN = [-0.55, 0.42, 0.72];
  const cap = (s) => s.replace(/^./, (c) => c.toUpperCase());

  const state = {
    t: 0, active: -1, view: 'atlas', hover: null,
    kinds: new Set(), layers: new Set(), show: { sun: 0, currents: 0, heat: 0, life: 0 },
  };

  // ---------- Inks ----------
  const ink = {};
  const KCOL = {};
  function readInks() {
    const css = getComputedStyle(document.documentElement);
    const v = (n) => css.getPropertyValue(n).trim();
    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    for (const n of ['paper', 'ink', 'ink-2', 'sea-ink', 'red', 'leaf', 'ochre']) ink[n] = v('--' + n);
    ink.gl = { u_paper: rgb(ink.paper), u_ink: rgb(ink.ink), u_seaInk: rgb(ink['sea-ink']), u_red: rgb(ink.red), u_leaf: rgb(ink.leaf), u_ochre: rgb(ink.ochre),
      u_dark: css.colorScheme.includes('dark') ? 1 : 0 };
    ink.serif = v('--serif');
    for (const k of C.KINDS) KCOL[k.id] = v('--k-' + k.id);
  }
  readInks();

  // ---------- Globe ----------
  const fig = $('#figure'), glCanvas = $('#globe'), over = $('#overlay');
  const octx = over.getContext('2d');
  const globe = new Globe(over, { lat: 18, lon: 12, spin: 2.5, wheel: false, minZoom: 0.8, maxZoom: 2.6 });
  let W = 1, H = 1, dpr = 1, narrow = false;

  // An engraving: paper and ink only. Water lines echo the coasts, pen
  // strokes shade the land and the night, and the graticule is drawn in blue.
  const FRAG = `
uniform vec3 u_sun;
uniform vec4 u_show;     // sunlight, heat, life, (unused)
uniform float u_lifeSea; // 0 before the first cells, 1 after
uniform float u_px;      // device pixels per CSS pixel
uniform vec3 u_paper, u_ink, u_seaInk, u_red, u_leaf, u_ochre;
uniform float u_dark;    // 1 when printed in blueprint ink

// A line where v crosses a whole number, w device pixels wide.
float iso(float v, float w) {
  float fw = max(fwidth(v), 1e-6);
  float d = abs(fract(v - 0.5) - 0.5) / fw;
  return 1.0 - smoothstep(w * 0.5 - 0.5, w * 0.5 + 0.5, d);
}
// Parallel pen strokes across the page, spacing s and width w in device pixels.
float strokes(vec2 p, vec2 dir, float s, float w) {
  float d = abs(fract(dot(p, dir) / s) - 0.5) * s;
  return (1.0 - smoothstep(w * 0.5 - 0.6, w * 0.5 + 0.6, d)) * clamp(w, 0.0, 1.0);
}

void main() {
  vec2 q = globeQ();
  float d = length(q);
  vec3 sun = normalize(u_sun);
  vec2 fc = gl_FragCoord.xy;
  vec4 outc = vec4(0.0);

  // The frame: the edge of the globe and a second ring just outside it.
  float limb = 1.0 - smoothstep(0.8 * u_px, 1.6 * u_px, abs(d - 1.0) * u_radius);
  float ring = 1.0 - smoothstep(0.3 * u_px, 1.0 * u_px, abs(d - 1.05) * u_radius);

  if (d < 1.0 + 3.0 / u_radius) {
    vec2 qq = q / max(1.0, d);
    vec3 n = viewNormal(qq);
    vec3 w = normalize(u_rot * n);
    vec4 f = fields(w);
    float hgt = heightAt(f, w);
    float hw = max(fwidth(hgt), 1e-4);
    float land = smoothstep(-0.5, 0.5, hgt / hw);
    float diffuse = dot(n, sun);
    vec2 ll = lonLat(w) * 57.29578;

    // Paper, a shade darker toward the night so the sphere has volume.
    vec3 c = u_paper * (0.93 + 0.07 * smoothstep(-0.3, 0.6, diffuse));
    // Sea: a faint wash and water lines that echo the coast, farther apart offshore.
    vec3 sea = mix(c, u_seaInk, 0.07);
    float wv = sqrt(max(-hgt, 0.0) / 0.42);
    float wl = iso(wv, 1.0 * u_px) * step(0.5, wv) * (1.0 - smoothstep(1.2, 3.6, wv));
    sea = mix(sea, u_seaInk, wl * 0.6);
    // Land: the paper itself, a little green where plants grow today, ochre where it is dry.
    float veg = u_green * smoothstep(0.25, 0.75, f.a);
    float dry = u_green * (1.0 - smoothstep(0.12, 0.4, f.a));
    float tint = 1.0 - 0.75 * u_dark;
    vec3 ground = mix(c, u_leaf, veg * 0.18 * tint);
    ground = mix(ground, u_ochre, dry * 0.16 * tint);
    ground = mix(ground, u_ink, (1.0 - u_green) * 0.05 + 0.07 * u_dark);
    c = mix(sea, ground, land);

    // Ice: blank paper with short blue strokes.
    float ice = iceAt(w, land);
    c = mix(c, u_paper, ice * 0.9);
    float dash = step(0.42, fract(fc.x / (11.0 * u_px) + floor(fc.y / (5.0 * u_px)) * 0.37));
    c = mix(c, u_seaInk, strokes(fc, vec2(0.0, 1.0), 5.0 * u_px, 0.9 * u_px) * dash * ice * 0.45);

    // Shading: strokes on the land where the sun is low, cross-strokes on the night side.
    float tone = smoothstep(0.55, -0.1, diffuse);
    float h1 = strokes(fc, vec2(0.7071, 0.7071), 4.0 * u_px, tone * 1.7 * u_px);
    c = mix(c, u_ink, h1 * 0.5 * land * (1.0 - ice * 0.6));
    float night = smoothstep(0.06, -0.3, diffuse);
    float h2 = strokes(fc, vec2(0.7071, -0.7071), 4.0 * u_px, night * 1.5 * u_px);
    c = mix(c, mix(u_seaInk, u_ink, land), h2 * 0.45);

    // Graticule every 15 degrees, a firmer equator, dashed tropics and polar circles.
    float g = max(iso(ll.x / 15.0, 0.8 * u_px) * (1.0 - smoothstep(72.0, 80.0, abs(ll.y))), iso(ll.y / 15.0, 0.8 * u_px)) * 0.3;
    g = max(g, iso(ll.y / 360.0, 1.4 * u_px) * 0.55);
    float circles = max(iso((abs(ll.y) - 23.44) / 360.0, 1.0 * u_px), iso((abs(ll.y) - 66.56) / 360.0, 1.0 * u_px));
    g = max(g, circles * step(0.5, fract(ll.x / 2.0)) * 0.45);
    c = mix(c, u_seaInk, g * (1.0 - land * 0.35));

    // The young planet: red marbling where the crust is still molten.
    if (u_molten > 0.001) {
      float m = fbm(w * 3.5 + vec3(0.0, u_time * 0.012, 0.0));
      c = mix(c, mix(u_paper, u_red, 0.16), u_molten);
      c = mix(c, u_red, (iso(m * 9.0, 1.1 * u_px) * 0.75 + iso(m * 3.0, 1.8 * u_px) * 0.25) * u_molten);
    }

    // Overlays.
    if (u_show.x > 0.001) {
      float bands = iso(diffuse * 6.0, 0.9 * u_px) * step(0.02, diffuse);
      float term = 1.0 - smoothstep(0.9 * u_px, 1.9 * u_px, abs(diffuse) / max(fwidth(diffuse), 1e-5));
      c = mix(c, mix(c, u_ochre, 0.3), smoothstep(0.0, 1.0, diffuse) * u_show.x);
      c = mix(c, u_red, (bands * 0.45 + term * step(0.5, fract(atan(n.y, n.x) * 30.0))) * u_show.x);
    }
    if (u_show.y > 0.001) {
      float heat = f.b;
      c = mix(c, mix(c, u_red, 0.45), smoothstep(0.12, 0.8, heat) * u_show.y);
      c = mix(c, u_red, iso(heat * 5.0, 1.0 * u_px) * step(0.1, heat) * u_show.y * 0.8);
    }
    if (u_show.z > 0.001) {
      float lf = f.a * mix(u_lifeSea, u_green, land);
      float dots = noise3(w * u_radius / (2.0 * u_px));
      float st = smoothstep(0.98 - lf * 0.42, 1.0 - lf * 0.42, dots) * step(0.06, lf);
      c = mix(c, u_leaf, st * u_show.z);
    }

    // The coast, in a firm line.
    float coast = 1.0 - smoothstep(0.55 * u_px, 1.35 * u_px, abs(hgt) / hw);
    c = mix(c, u_ink, coast * (0.9 - u_molten * 0.5));

    float inside = 1.0 - smoothstep(-0.5, 0.5, (d - 1.0) * u_radius);
    outc = vec4(c, 1.0) * inside;
  }
  float a = max(limb, ring * 0.7);
  gl_FragColor = vec4(u_ink, 1.0) * a + outc * (1.0 - a);
}`;

  const gl = Globe.webgl(glCanvas, FRAG, { derivatives: true });
  const flat = gl ? null : glCanvas.getContext('2d');
  let planet = null;
  Planet.load().then((p) => {
    planet = p;
    if (gl) { gl.texture(p.texture()); gl.texture(p.fine(), 'u_fine'); }
    $('#loading').hidden = true;
    seedArrows();
  }).catch((e) => { $('#loading').textContent = e.message; });

  function resize() {
    const r = fig.getBoundingClientRect();
    narrow = innerWidth <= 900;
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    dpr = Math.min(2, devicePixelRatio || 1);
    for (const c of [glCanvas, over]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    over.style.touchAction = narrow ? 'pan-y' : 'none';
    if (narrow) globe.layout((W - 30) / 2, (H - 92) * 0.5, Math.min((W - 60) * 0.42, (H - 100) * 0.47));
    else globe.layout((W - 70) / 2, H * 0.44, Math.min((W - 110) * 0.42, H * 0.36));
    buildRail();
    onScroll();
  }

  // ---------- Plates ----------
  const plates = $('#plates');
  const anchors = [{ el: plates.querySelector('.intro'), t: 0, kind: 'intro' }];
  const kindOf = (id) => C.kind(id);
  function buildPlates() {
    const done = C.labsDone();
    let fig = 0;
    for (const it of C.history()) {
      const sec = document.createElement('section');
      if (it.system) {
        const s = it.system, n = C.SYSTEMS.indexOf(s), k = kindOf(s.kind), p = C.periodAt(s.t);
        fig++;
        sec.className = 'leaf plate';
        sec.id = 'plate-' + s.id;
        sec.style.setProperty('--kc', KCOL[s.kind]);
        const links = C.links(s).map((l, i) => {
          const small = l.kind === 'lab' ? `<small>${esc(l.lab.question)}${done.includes(l.lab.id) ? ' · done ✓' : ''}</small>` : l.text ? `<small>${esc(l.text)}</small>` : '';
          return `<a class="${i === 0 ? 'main' : ''}" href="${esc(ROOT + l.path)}"><span>${esc(l.label)}${small}</span><i>→</i></a>`;
        }).join('');
        sec.innerHTML = `
          <div class="no"><b>PLATE ${ROMAN[n]}</b><span class="smallcaps">${esc(k.name)}${s.chapter != null ? ' · chapter ' + s.chapter : ''}</span></div>
          <h2>${esc(s.title)}</h2>
          <p class="era"><b>${esc(cap(s.when))}</b>${s.t > 0 ? ' · ' + esc(p.name) : ''} · ${esc(s.place)}, ${C.where(s.lat, s.lon)}</p>
          <figure class="fig"><div class="frame"><canvas aria-label="Live simulation: ${esc(s.title)}"></canvas><div class="poster">The simulation starts when you reach this plate</div><span class="status" hidden></span></div>
            <figcaption><b>Fig. ${fig}.</b> ${esc(s.title)}, running live in this page.</figcaption></figure>
          <p>${esc(s.text)}</p>
          <p class="fieldnote"><b>Field note</b>${esc(s.evidence)}</p>
          <div class="go">${links}</div>`;
        anchors.push({ el: sec, t: s.t, kind: 'plate', system: s, n, lat: s.lat, lon: s.lon });
      } else {
        const e = it.event, first = e.t >= T0;
        sec.className = 'leaf note' + (first ? ' rewind' : '');
        sec.innerHTML = first
          ? `<span class="smallcaps date">Rewind · ${esc(C.when(e.t))}</span><h3>${esc(e.title)}</h3><p>${esc(e.text)} Scroll on, and time runs forward to today.</p>`
          : `<span class="smallcaps date">${esc(C.when(e.t))}${e.until ? ' to ' + esc(C.when(e.until)) : ''}</span><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>`;
        anchors.push({ el: sec, t: e.until ? (e.t + e.until) / 2 : e.t, at: e.t, kind: 'note', event: e, lat: e.lat, lon: e.lon });
      }
      plates.appendChild(sec);
    }
    const end = document.createElement('section');
    end.className = 'leaf end';
    end.innerHTML = `<span class="smallcaps kicker">End of the plates</span><h2>Every world in this atlas, on one page</h2>
      <p>The index lists every system, where to open it and the history it comes from.</p>
      <div><button class="begin" id="to-index">Open the index</button></div>`;
    plates.appendChild(end);
    anchors.push({ el: end, t: 0, kind: 'end' });
    $('#to-index').addEventListener('click', () => setView('index'));
  }

  // ---------- Scrolling through time ----------
  // Every plate and note has a resting place on the page: a plate with its
  // heading at the top of the reading area, a note in its middle. Resting
  // there shows the planet at that age; in between, time runs on to the next.
  function focusPoints() {
    const y = scrollY, view = narrow ? fig.getBoundingClientRect().bottom : $('.bar').getBoundingClientRect().bottom;
    let prev = -Infinity;
    return anchors.map((a) => {
      let f = 0;
      if (a.kind !== 'intro') {
        const top = a.el.getBoundingClientRect().top + y;
        f = a.kind === 'note' ? top + a.el.offsetHeight / 2 - (innerHeight + view) / 2 : top - view - 8;
      }
      prev = Math.max(f, prev + 1);
      return prev;
    });
  }
  function onScroll() {
    if (state.view !== 'atlas') return;
    const F = focusPoints(), y = scrollY, n = anchors.length;
    let j = 0;
    while (j < n - 1 && F[j + 1] <= y) j++;
    let t = anchors[j].t, active = j;
    if (j < n - 1 && y > F[j]) {
      const a = anchors[j], b = anchors[j + 1], u = (y - F[j]) / (F[j + 1] - F[j]);
      t = a.t + (b.t - a.t) * smooth(a.kind === 'plate' ? 0.45 : 0.3, b.kind === 'plate' ? 0.95 : 0.75, u);
      if (u > 0.5) active = j + 1;
    }
    state.t = t;
    if (active !== state.active) activate(active);
  }
  function scrollToAnchor(i) {
    scrollTo({ top: Math.max(0, focusPoints()[i]), behavior: reduce ? 'auto' : 'smooth' });
  }

  // The plate being read runs its simulation; it starts once the reader
  // settles, so scrolling fast past several plates stays smooth.
  let preview = null, pending = 0;
  function activate(i) {
    state.active = i;
    const a = anchors[i];
    clearTimeout(pending);
    if (preview) { preview.stop(); preview = null; }
    if (a.system) {
      pending = setTimeout(() => {
        if (state.active !== i || state.view !== 'atlas') return;
        const frame = a.el.querySelector('.frame'), status = frame.querySelector('.status');
        frame.querySelector('.poster').hidden = true;
        preview = Previews.mount(a.system.preview, frame.querySelector('canvas'), { onStatus: (txt) => { status.hidden = !txt; status.textContent = txt; } });
      }, 350);
    }
    if (a.lat != null) { globe.hold = true; globe.flyTo(a.lat, a.lon, narrow ? 1.1 : 1.25); }
    else if (a.kind === 'intro' || a.kind === 'end') { globe.hold = false; globe.flyTo(18, globe.lon, 1); }
    else globe.hold = false;
    caption(a);
    for (const el of document.querySelectorAll('.rail .stop')) el.setAttribute('aria-current', String(+el.dataset.i === i));
  }
  function caption(a) {
    let html;
    if (a.kind === 'plate') {
      const s = a.system, p = C.periodAt(s.t);
      html = `<b>Plate ${ROMAN[a.n]}</b>${s.t > 0 ? 'The Earth ' + esc(s.when) + ', in the ' + esc(p.name) + '.' : 'The Earth today.'} <span class="where">Site: ${esc(s.place)}.</span>`;
    } else if (a.kind === 'note') {
      html = `<b>Note</b>The Earth ${esc(C.when(a.at))}: ${esc(a.event.title.replace(/^./, (c) => c.toLowerCase()))}.`;
    } else {
      html = '<b>Frontispiece</b>The Earth today. Drag to turn it; scroll to travel through time.';
    }
    $('#caption').innerHTML = html;
  }

  // ---------- Time rail ----------
  const railStops = () => anchors.map((a, i) => ({ a, i })).filter((x) => x.a.kind === 'plate' || x.a.kind === 'note');
  // Where an age sits on the rail, 0 at the top: evenly between the stops.
  function railPos(t) {
    const R = railStops(), n = R.length - 1;
    if (t >= R[0].a.t) return 0;
    for (let j = 0; j < n; j++) {
      const a = R[j].a.t, b = R[j + 1].a.t;
      if (t <= a && t >= b) return (j + (a === b ? 0 : (a - t) / (a - b))) / n;
    }
    return 1;
  }
  function buildRail() {
    const rail = $('#rail');
    const R = railStops(), n = R.length - 1;
    let html = '';
    for (const e of C.EONS) {
      const y0 = railPos(Math.min(e.t0, T0)), y1 = railPos(e.t1);
      html += `<div class="eon" style="top:${y0 * 100}%;height:${(y1 - y0) * 100}%;--c:${e.color}"><span>${esc(e.name)}</span></div>`;
    }
    R.forEach(({ a, i }, j) => {
      const label = a.system ? a.system.title + ', ' + a.system.when : a.event.title + ', ' + C.when(a.at);
      html += `<button class="stop${a.system ? ' sys' : ''}" data-i="${i}" style="top:${j / n * 100}%;${a.system ? '--c:' + KCOL[a.system.kind] : ''}" aria-label="${esc(label)}" title="${esc(label)}">${a.system ? '<b>' + ROMAN[a.n] + '</b>' : ''}</button>`;
    });
    html += '<div class="here" id="here"></div>';
    rail.innerHTML = html;
    hereT = null;
    for (const b of rail.querySelectorAll('.stop')) b.addEventListener('click', () => scrollToAnchor(+b.dataset.i));
  }

  // ---------- Key ----------
  function symbolSVG(kind, color) {
    const s = `stroke="var(--ink)" stroke-width="1.3" fill="${color}"`;
    switch (kind) {
      case 'chemistry': return `<svg viewBox="-7 -7 14 14"><circle r="5.5" ${s}/><circle r="1.6" fill="var(--ink)"/></svg>`;
      case 'cells': return `<svg viewBox="-7 -7 14 14"><circle r="5" ${s}/></svg>`;
      case 'bodies': return `<svg viewBox="-7 -7 14 14"><path d="M0 -6 L5.6 4.5 L-5.6 4.5 Z" ${s}/></svg>`;
      case 'nervous': return `<svg viewBox="-7 -7 14 14"><path d="M0 -6V6M-5.2 -3 5.2 3M-5.2 3 5.2 -3" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/><circle r="1.6" fill="var(--ink)"/></svg>`;
      default: return `<svg viewBox="-7 -7 14 14"><path d="M0 -6 L6 0 L0 6 L-6 0 Z" ${s}/></svg>`;
    }
  }
  const LAYER_ICON = {
    sun: '<svg viewBox="-7 -7 14 14"><circle r="3" fill="var(--ochre)" stroke="var(--red)" stroke-width="1.2"/><path d="M0 -6.5V-5M0 5V6.5M-6.5 0H-5M5 0H6.5" stroke="var(--red)" stroke-width="1.2"/></svg>',
    currents: '<svg viewBox="-7 -7 14 14"><path d="M-6 2 Q-2 -4 3 -1" fill="none" stroke="var(--sea-ink)" stroke-width="1.4"/><path d="M1 -3.5 L5 -0.5 L0.5 1.5 Z" fill="var(--sea-ink)"/></svg>',
    heat: '<svg viewBox="-7 -7 14 14"><path d="M-6 4 L-2 -2 L1 2 L5 -5" fill="none" stroke="var(--red)" stroke-width="1.6"/></svg>',
    life: '<svg viewBox="-7 -7 14 14"><g fill="var(--leaf)"><circle cx="-3" cy="-2" r="1.3"/><circle cx="2" cy="-3" r="1.3"/><circle cx="0" cy="1" r="1.3"/><circle cx="4" cy="3" r="1.3"/><circle cx="-4" cy="3.5" r="1.3"/></g></svg>',
  };
  function buildKey() {
    const kinds = $('#key-kinds'), layers = $('#key-layers');
    for (const k of C.KINDS) {
      const b = toggle(symbolSVG(k.id, KCOL[k.id]) + esc(k.short), k.text);
      b.dataset.kind = k.id;
      b.addEventListener('click', () => {
        const on = !state.kinds.has(k.id);
        on ? state.kinds.add(k.id) : state.kinds.delete(k.id);
        b.setAttribute('aria-pressed', String(on));
        dimPlates();
        if (on) lookAt(C.SYSTEMS.filter((s) => s.kind === k.id && s.t >= state.t));
      });
      kinds.appendChild(b);
    }
    for (const l of C.LAYERS) {
      const b = toggle(LAYER_ICON[l.id] + esc(l.name), l.text);
      b.addEventListener('click', () => {
        const on = !state.layers.has(l.id);
        on ? state.layers.add(l.id) : state.layers.delete(l.id);
        b.setAttribute('aria-pressed', String(on));
      });
      layers.appendChild(b);
    }
  }
  function toggle(html, title) {
    const b = document.createElement('button');
    b.className = 'toggle';
    b.setAttribute('aria-pressed', 'false');
    b.title = title;
    b.innerHTML = html;
    return b;
  }
  function dimPlates() {
    for (const a of anchors) if (a.system) a.el.classList.toggle('dim', state.kinds.size > 0 && !state.kinds.has(a.system.kind));
  }
  function lookAt(list) {
    if (!list.length) return;
    let x = 0, y = 0, z = 0;
    for (const s of list) { x += Math.cos(s.lat * RAD) * Math.sin(s.lon * RAD); y += Math.sin(s.lat * RAD); z += Math.cos(s.lat * RAD) * Math.cos(s.lon * RAD); }
    globe.flyTo(clamp(Math.atan2(y, Math.hypot(x, z)) / RAD, -45, 45), Math.atan2(x, z) / RAD, 1);
  }
  function easeShow(dt) {
    const k = reduce ? 1 : 1 - Math.exp(-dt * 5);
    for (const id in state.show) state.show[id] += ((state.layers.has(id) ? 1 : 0) - state.show[id]) * k;
  }

  // ---------- Symbols on the globe ----------
  const appear = (t) => clamp((t - state.t) / 4e7 + 1, 0, 1);
  function marks() {
    const out = [];
    C.SYSTEMS.forEach((s, n) => {
      const a = appear(s.t);
      if (a <= 0) return;
      const p = globe.project(s.lat, s.lon);
      if (p.z < 0.02) return;
      out.push({ s, n, x: p.x, y: p.y, z: p.z, a: a * Math.min(1, p.z * 5) });
    });
    for (const e of C.EVENTS) {
      if (e.lat == null || appear(e.t) <= 0) continue;
      const p = globe.project(e.lat, e.lon);
      if (p.z < 0.02) continue;
      out.push({ e, x: p.x, y: p.y, z: p.z, a: appear(e.t) * Math.min(1, p.z * 5) });
    }
    return out;
  }
  function symbol(ctx, kind, x, y, r, color) {
    ctx.fillStyle = color; ctx.strokeStyle = ink.ink; ctx.lineWidth = 1.3;
    ctx.beginPath();
    switch (kind) {
      case 'chemistry': ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = ink.ink; ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, Math.PI * 2); ctx.fill(); return;
      case 'cells': ctx.arc(x, y, r * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); return;
      case 'bodies': ctx.moveTo(x, y - r * 1.1); ctx.lineTo(x + r, y + r * 0.8); ctx.lineTo(x - r, y + r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke(); return;
      case 'nervous':
        ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        for (let k = 0; k < 3; k++) { const an = k * Math.PI / 3 + Math.PI / 2, dx = Math.cos(an) * r * 1.05, dy = Math.sin(an) * r * 1.05; ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); }
        ctx.stroke(); ctx.fillStyle = ink.ink; ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, Math.PI * 2); ctx.fill(); return;
      default: ctx.moveTo(x, y - r * 1.1); ctx.lineTo(x + r * 1.1, y); ctx.lineTo(x, y + r * 1.1); ctx.lineTo(x - r * 1.1, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  const placeLabels = Globe.labels();
  function drawMarks(now) {
    const ctx = octx, active = anchors[state.active] || {}, names = [];
    ctx.save();
    ctx.textBaseline = 'middle';
    for (const m of marks()) {
      if (m.e) {
        const on = active.event === m.e;
        ctx.globalAlpha = m.a * (on ? 1 : 0.7);
        ctx.strokeStyle = ink.red; ctx.lineWidth = on ? 2 : 1.4;
        ctx.beginPath(); ctx.moveTo(m.x - 4, m.y - 4); ctx.lineTo(m.x + 4, m.y + 4); ctx.moveTo(m.x + 4, m.y - 4); ctx.lineTo(m.x - 4, m.y + 4); ctx.stroke();
        if (on) names.push(name(ctx, 'e' + m.e.title, m.e.title, m, 9, true, ink.red, 3));
        continue;
      }
      const s = m.s, on = active.system === s, hov = state.hover === s;
      const dim = state.kinds.size && !state.kinds.has(s.kind) ? 0.25 : 1;
      ctx.globalAlpha = m.a * dim;
      if (on) {
        // A reticle around the plate being read.
        const r = 15 + (reduce ? 0 : Math.sin(now / 500) * 1.5);
        ctx.strokeStyle = ink.red; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        for (let k = 0; k < 4; k++) { const an = k * Math.PI / 2; ctx.moveTo(m.x + Math.cos(an) * (r - 4), m.y + Math.sin(an) * (r - 4)); ctx.lineTo(m.x + Math.cos(an) * (r + 5), m.y + Math.sin(an) * (r + 5)); }
        ctx.stroke();
      }
      symbol(ctx, s.kind, m.x, m.y, on || hov ? 6.5 : 5.2, KCOL[s.kind]);
      if (m.z > 0.25 || on) names.push(name(ctx, s.id, ROMAN[m.n] + '  ' + s.title, m, on ? 22 : 11, on || hov, ink.ink, (on ? 2 : hov ? 1 : 0) + m.z));
    }
    // Names last, the plate being read and the nearest first, so none covers another.
    names.sort((p, q) => q.rank - p.rank);
    for (const n of placeLabels(names, { bounds: [4, W - (narrow ? 40 : 84)] })) {
      if (!n.side) continue;
      ctx.globalAlpha = n.a;
      label(ctx, n.text, n.lx, n.y, n.strong, n.color);
    }
    ctx.restore();
  }
  const fontOf = (strong) => (strong ? 'italic 600 15px ' : 'italic 14px ') + ink.serif;
  function name(ctx, key, text, m, pad, strong, color, rank) {
    ctx.font = fontOf(strong);
    return { key, text, x: m.x, y: m.y, w: ctx.measureText(text).width, h: 17, pad, strong, color, rank, a: ctx.globalAlpha };
  }
  function label(ctx, text, x, y, strong, color) {
    ctx.font = fontOf(strong);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4; ctx.strokeStyle = ink.paper;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
  function nearest(x, y, r) {
    let best = null, bd = r * r;
    for (const m of marks()) { const d = (m.x - x) ** 2 + (m.y - y) ** 2; if (d < bd) { bd = d; best = m; } }
    return best;
  }
  globe.ontap = (x, y) => {
    const m = nearest(x, y, 22);
    if (!m) return;
    const i = anchors.findIndex((a) => (m.s && a.system === m.s) || (m.e && a.event === m.e));
    if (i >= 0) scrollToAnchor(i);
  };
  globe.onhover = (x, y) => {
    const m = x == null ? null : nearest(x, y, 16);
    state.hover = m && (m.s || m.e);
    over.classList.toggle('over-mark', !!m);
    const el = $('#hover');
    if (!m) { el.hidden = true; return; }
    el.hidden = false;
    el.style.left = m.x + 'px'; el.style.top = m.y + 'px';
    el.querySelector('b').textContent = m.s ? 'Plate ' + ROMAN[m.n] + ': ' + m.s.title : m.e.title;
    el.querySelector('small').textContent = m.s ? cap(m.s.when) + ' · ' + m.s.place : cap(C.when(m.e.t));
  };

  // ---------- Currents: pen arrows that follow the flow ----------
  const arrows = [], flow = [0, 0];
  function seedArrows() {
    for (let lat = -62; lat <= 62; lat += 6) {
      const step = 6 / Math.max(0.35, Math.cos(lat * RAD));
      for (let lon = -180 + ((lat * 7.3) % step + step) % step; lon < 180; lon += step) {
        if (planet.coastAt(lat, lon) > -1.2) continue;
        const pts = [[lat, lon]];
        let la = lat, lo = lon, sp = 0;
        for (let k = 0; k < 6; k++) {
          planet.current(la, lo, flow);
          const m = Math.hypot(flow[0], flow[1]);
          if (m < 0.05) break;
          sp += m;
          la += flow[1] / m * 0.75;
          lo += flow[0] / m * 0.75 / Math.max(0.3, Math.cos(la * RAD));
          pts.push([la, lo]);
        }
        if (pts.length >= 4) arrows.push({ pts, sp: sp / (pts.length - 1) });
      }
    }
  }
  function drawArrows(now) {
    const a = state.show.currents;
    if (a < 0.01 || !arrows.length) return;
    const ctx = octx;
    ctx.save();
    ctx.strokeStyle = ink['sea-ink']; ctx.fillStyle = ink['sea-ink'];
    ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    ctx.setLineDash([5, 3]);
    ctx.lineDashOffset = reduce ? 0 : -(now / 90) % 8;
    for (const ar of arrows) {
      const P = ar.pts.map(([la, lo]) => globe.project(la, lo));
      if (P.some((p) => p.z < 0.08)) continue;
      ctx.globalAlpha = a * clamp(ar.sp * 1.4, 0.25, 0.9) * Math.min(1, P[0].z * 3);
      ctx.beginPath();
      ctx.moveTo(P[0].x, P[0].y);
      for (let k = 1; k < P.length; k++) ctx.lineTo(P[k].x, P[k].y);
      ctx.stroke();
      const p1 = P[P.length - 1], p0 = P[P.length - 2], an = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      ctx.beginPath();
      ctx.moveTo(p1.x + Math.cos(an) * 4, p1.y + Math.sin(an) * 4);
      ctx.lineTo(p1.x + Math.cos(an + 2.5) * 4.5, p1.y + Math.sin(an + 2.5) * 4.5);
      ctx.lineTo(p1.x + Math.cos(an - 2.5) * 4.5, p1.y + Math.sin(an - 2.5) * 4.5);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- Drawing ----------
  function drawGlobe(sec) {
    const look = C.look(state.t);
    if (gl) {
      gl.draw(Object.assign(Globe.lookUniforms(look), ink.gl, {
        u_res: [glCanvas.width, glCanvas.height], u_center: [globe.cx * dpr, globe.cy * dpr], u_radius: globe.radius * dpr,
        u_rot: globe.matrix(), u_time: sec, u_sun: SUN, u_px: dpr,
        u_show: [state.show.sun, state.show.heat, state.show.life, 0], u_lifeSea: state.t <= 3.8e9 ? 1 : 0,
      }));
    } else if (flat && planet) {
      // Without WebGL: coasts as dots of ink.
      flat.setTransform(dpr, 0, 0, dpr, 0, 0);
      flat.clearRect(0, 0, W, H);
      flat.strokeStyle = ink.ink; flat.lineWidth = 1.5;
      flat.beginPath(); flat.arc(globe.cx, globe.cy, globe.radius, 0, Math.PI * 2); flat.stroke();
      flat.fillStyle = ink.ink;
      for (let lat = -80; lat <= 80; lat += 1.5) {
        for (let lon = -180; lon < 180; lon += 1.5 / Math.max(0.2, Math.cos(lat * RAD))) {
          const c = planet.coastAt(lat, lon);
          if (c < 0 || c > 1.6) continue;
          const p = globe.project(lat, lon);
          if (p.z > 0) flat.fillRect(p.x - 0.7, p.y - 0.7, 1.4, 1.4);
        }
      }
    }
  }
  let hereT = null;
  function drawHere() {
    if (hereT !== null && Math.abs(state.t - hereT) < 1e5) return;
    hereT = state.t;
    const here = $('#here');
    if (here) here.style.top = (railPos(state.t) * 100) + '%';
  }

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden || state.view !== 'atlas') return;
    globe.tick(dt);
    easeShow(dt);
    drawGlobe(now / 1000);
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, W, H);
    if (planet) { drawArrows(now); drawMarks(now); }
    drawHere();
  }

  // ---------- Index (list view) ----------
  function buildIndex() {
    const done = C.labsDone(), labs = window.LabCatalogue || [];
    const entries = C.KINDS.map((k) => {
      const items = C.SYSTEMS.map((s, n) => ({ s, n })).filter(({ s }) => s.kind === k.id).map(({ s, n }) => {
        const ls = C.links(s);
        return `<li class="entry">
          <div class="line"><a href="${esc(ROOT + ls[0].path)}">${esc(s.title)}</a><span class="dots"></span><span>Plate ${ROMAN[n]} · ${esc(C.short(s.t))}</span></div>
          <p>${esc(s.text)}</p>
          <div class="sub">${ls.slice(1).map((l) => `<a href="${esc(ROOT + l.path)}">${esc(l.label)}${l.lab && done.includes(l.lab.id) ? ' ✓' : ''}</a>`).join('')}</div>
        </li>`;
      }).join('');
      return `<li class="kind" style="--kc:${KCOL[k.id]}">${symbolSVG(k.id, KCOL[k.id]).replace('<svg', '<svg width="14" height="14"')}${esc(k.name)}</li>${items}`;
    }).join('');
    const chron = C.history().map((it) => {
      const s = it.system;
      const title = s ? `<a href="${esc(ROOT + C.links(s)[0].path)}">${esc(it.title)}</a> <span class="sim">· plate ${ROMAN[C.SYSTEMS.indexOf(s)]}</span>` : esc(it.title);
      return `<li><time>${esc(C.short(it.t))}</time><div><b>${title}</b><br><span>${esc(it.text)}</span></div></li>`;
    }).join('');
    $('#index-view').innerHTML = `<div class="index-inner">
      <header><span class="smallcaps kicker">Index</span><h1>Every system, every plate</h1>
        <p class="lede">Small simulated worlds where living systems organise themselves from local rules, listed plainly: three ways in, every system by kind, and the history of the planet they belong to.</p></header>
      <section><h2>Ways in</h2><div class="ways">
        <a href="${ROOT}world/index.html#story"><b>Watch the story</b><span>A guided tour of one world, from the first chemistry to brains.</span><i>→</i></a>
        <a href="${ROOT}labs/index.html"><b>Take a mechanism apart</b><span>Guided labs: change one thing in a twin world and follow the effect. ${done.length} of ${labs.length} done.</span><i>→</i></a>
        <a href="${ROOT}world/index.html"><b>Explore freely</b><span>The World Viewer: every chapter on one stage.</span><i>→</i></a>
      </div></section>
      <div class="cols">
        <section><h2>Systems, simplest first</h2><ul class="entries">${entries}</ul></section>
        <section><h2>Chronology</h2><ol class="chron">${chron}</ol></section>
      </div>
      <p class="foot">Places are where the oldest evidence was found, or a living example. Coastlines are today's, so places can be found.</p>
    </div>`;
  }

  // ---------- Views and ink ----------
  const STORE = 'learning-systems.atlas-view', INK = 'learning-systems.atlas-ink';
  // quiet: opened from a link or a remembered choice, so nothing new to remember.
  function setView(v, quiet) {
    state.view = v;
    const idx = v === 'index';
    $('#atlas-view').hidden = idx; $('#index-view').hidden = !idx;
    $('#tab-atlas').setAttribute('aria-selected', String(!idx));
    $('#tab-index').setAttribute('aria-selected', String(idx));
    if (idx && preview) { preview.stop(); preview = null; state.active = -1; }
    if (!quiet) { try { localStorage.setItem(STORE, v); } catch (e) { /* not kept */ } }
    scrollTo(0, 0);
    if (!idx) requestAnimationFrame(resize);
  }
  $('#tab-atlas').addEventListener('click', () => setView('atlas'));
  $('#tab-index').addEventListener('click', () => setView('index'));

  const dark = () => getComputedStyle(document.documentElement).colorScheme.includes('dark');
  function setInk(mode) {
    if (mode) document.documentElement.dataset.theme = mode;
    readInks();
    $('#ink').setAttribute('aria-pressed', String(dark()));
    buildRail(); hereT = null;
    buildIndex();
  }
  $('#ink').addEventListener('click', () => {
    const mode = dark() ? 'light' : 'dark';
    try { localStorage.setItem(INK, mode); } catch (e) { /* not kept */ }
    setInk(mode);
  });

  // Screen readers and keyboards: the plates are the content; the globe is a picture of them.
  $('#begin').addEventListener('click', () => scrollToAnchor(1));
  const done = C.labsDone(), labs = window.LabCatalogue || [];
  $('#labs-done').textContent = labs.length ? done.length + '/' + labs.length : '';

  buildPlates();
  buildKey();
  buildIndex();
  let mode = null;
  try { mode = localStorage.getItem(INK); } catch (e) { /* not kept */ }
  setInk(mode);
  addEventListener('resize', resize);
  addEventListener('scroll', onScroll, { passive: true });
  if (document.fonts) document.fonts.ready.then(() => { readInks(); onScroll(); });
  resize();
  let start = 'atlas';
  try { start = localStorage.getItem(STORE) || 'atlas'; } catch (e) { /* not kept */ }
  if (location.hash === '#index' || location.hash === '#list') start = 'index';
  if (start === 'index') setView('index', true);
  requestAnimationFrame(frame);
  window.Atlas = { globe, state, anchors, scrollToAnchor };
})();
