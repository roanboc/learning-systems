// Observatory: the home page as a planet at night. Turn the Earth, travel
// through deep time along the ruler, and open any system at the place where
// its evidence was found. A list view shows the same things as plain links.
(function () {
  'use strict';

  const C = window.SystemCatalogue;
  const $ = (s) => document.querySelector(s);
  const ROOT = '../../';
  const T0 = C.T_START;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const css = getComputedStyle(document.documentElement);
  const KCOL = {};
  for (const k of C.KINDS) KCOL[k.id] = css.getPropertyValue('--k-' + k.id).trim();
  const SUN = [-0.62, 0.36, 0.7];

  const state = {
    t: 0, anim: null, playing: false,
    kinds: new Set(), layers: new Set(),
    show: { sun: 0, currents: 0, heat: 0, life: 0 },
    focus: null, hover: null, view: 'planet',
  };

  // ---------- Globe ----------
  const stage = $('#planet-view'), glCanvas = $('#globe'), over = $('#overlay');
  const octx = over.getContext('2d');
  const globe = new Globe(over, { lat: 16, lon: 24, spin: 3.5, wheel: true, minZoom: 0.7, maxZoom: 3.6 });
  let W = 1, H = 1, dpr = 1, glScale = 1;
  const place = { cx: 0, cy: 0, r: 0, tx: 0, ty: 0, tr: 0, ready: false };

  const FRAG = `
uniform vec3 u_sun;
uniform vec4 u_show;     // sunlight, heat, life, (unused)
uniform float u_lifeSea; // 0 before the first cells, 1 after

vec3 lava(vec3 w) {
  float n = fbm(w * 4.0 + vec3(0.0, u_time * 0.015, 0.0));
  float crack = pow(1.0 - abs(n * 2.0 - 1.0), 7.0);
  return mix(vec3(0.09, 0.03, 0.02), vec3(1.0, 0.42, 0.1), crack) + vec3(0.5, 0.1, 0.0) * pow(crack, 24.0);
}

void main() {
  vec2 q = globeQ();
  float d = length(q);
  float pix = 1.0 / u_radius;
  vec3 sun = normalize(u_sun);
  vec4 col = vec4(0.0);

  // Atmosphere: a thin glow around the disc, brighter on the sunlit side.
  if (d > 1.0 - 2.0 * pix) {
    float h = max(0.0, d - 1.0);
    float side = clamp(dot(q / max(d, 1e-4), normalize(sun.xy)) * 0.5 + 0.5, 0.0, 1.0);
    float g = exp(-h / 0.022) * (0.18 + 0.82 * side * side) * (0.55 + u_haze);
    g += exp(-h / 0.11) * 0.18 * side * (0.4 + u_haze);
    col = vec4(u_sky * g, clamp(g, 0.0, 1.0));
  }

  if (d < 1.0) {
    vec3 n = viewNormal(q);
    vec3 w = normalize(u_rot * n);
    vec4 f = fields(w);
    float hgt = heightAt(f, w);
    float aa = 57.3 * pix / max(n.z, 0.18) * 0.8;
    float land = smoothstep(-aa, aa, hgt);
    float diffuse = dot(n, sun);
    float day = smoothstep(-0.1, 0.22, diffuse);

    // Sea: deep, and lighter over shallows near land.
    float shallow = smoothstep(-2.6, -0.15, hgt) * (1.0 - land);
    vec3 sea = mix(u_ocean, u_shallow, shallow * 0.9);
    // Land: bare rock, deserts, then plants where life is dense today.
    float grain = noise3(w * 40.0) * 0.5 + fbm(w * 9.0) * 0.5;
    vec3 rock = u_ground * (0.72 + 0.55 * grain);
    float dry = u_green * (1.0 - smoothstep(0.12, 0.45, f.a));
    vec3 soil = mix(rock, vec3(0.8, 0.69, 0.5) * (0.82 + 0.3 * grain), dry * 0.75);
    float veg = u_green * smoothstep(0.2, 0.8, f.a);
    vec3 ground = mix(soil, vec3(0.15, 0.31, 0.15) * (0.75 + 0.5 * grain), veg);
    vec3 c = mix(sea, ground, land);
    float ice = iceAt(w, land);
    c = mix(c, vec3(0.86, 0.91, 0.96) * (0.92 + 0.12 * grain), ice);
    if (u_molten > 0.001) c = mix(c, lava(w), u_molten);

    // Light: the sun from the upper left, a glint on the water, clouds.
    vec3 lit = c * (0.035 + 1.08 * max(diffuse, 0.0));
    vec3 r = reflect(-sun, n);
    lit += vec3(1.0, 0.94, 0.82) * pow(max(r.z, 0.0), 60.0) * 0.5 * (1.0 - land) * (1.0 - ice) * day;
    float cl = fbm(w * 3.0 + vec3(u_time * 0.004, 0.0, u_time * 0.003));
    float cloud = smoothstep(0.66 - u_clouds * 0.24, 0.92, cl) * u_clouds * 1.25;
    lit = mix(lit, vec3(0.94, 0.95, 0.97) * (0.03 + 1.0 * max(diffuse, 0.0)), clamp(cloud, 0.0, 0.8));
    if (u_molten > 0.001) lit += lava(w) * u_molten * 0.7 * (1.0 - day);
    float rim = pow(1.0 - n.z, 2.4);
    lit += u_sky * rim * (0.22 + 0.7 * u_haze) * (0.25 + 0.75 * day);

    // Highlights.
    if (u_show.x > 0.001) {
      float ins = max(diffuse, 0.0);
      lit = mix(lit, lit * 0.35 + vec3(1.0, 0.76, 0.32) * pow(ins, 1.4) * 0.8, u_show.x * 0.8);
      lit += vec3(1.0, 0.66, 0.28) * (1.0 - smoothstep(0.0, 0.025, abs(diffuse))) * u_show.x;
    }
    if (u_show.y > 0.001) {
      lit = mix(lit, lit * 0.4, u_show.y * 0.55);
      lit += vec3(1.0, 0.34, 0.08) * pow(f.b, 1.6) * u_show.y * 1.5;
    }
    if (u_show.z > 0.001) {
      float lf = f.a * mix(u_lifeSea, u_green, land);
      lit = mix(lit, lit * 0.4, u_show.z * 0.55);
      lit += mix(vec3(0.05, 0.75, 0.85), vec3(0.4, 0.95, 0.35), land) * pow(lf, 1.3) * u_show.z;
    }
    float edge = smoothstep(1.0, 1.0 - 1.5 * pix, d);
    col = mix(col, vec4(lit, 1.0), edge);
  }
  gl_FragColor = col;
}`;

  let gl = Globe.webgl(glCanvas, FRAG);
  let planet = null;
  Planet.load().then((p) => {
    planet = p;
    if (gl) { gl.texture(p.texture()); gl.texture(p.fine(), 'u_fine'); }
    $('#loading').hidden = true;
    seedCurrents();
  }).catch((e) => { $('#loading').textContent = e.message; });
  const fallback = gl ? null : glCanvas.getContext('2d');

  // ---------- Layout ----------
  function resize() {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    dpr = Math.min(2, devicePixelRatio || 1);
    over.width = Math.round(W * dpr); over.height = Math.round(H * dpr);
    sizeGL();
    target();
    if (!place.ready) { place.cx = place.tx; place.cy = place.ty; place.r = place.tr; place.ready = true; }
    drawSky();
    buildTicks();
  }
  function sizeGL() {
    const k = gl ? dpr * glScale : dpr;
    glCanvas.width = Math.round(W * k); glCanvas.height = Math.round(H * k);
  }
  // Where the globe should sit: right of the statement, left of the focus panel.
  function target() {
    const narrow = W < 860;
    if (narrow) {
      place.tx = W / 2;
      place.ty = state.focus ? H * 0.15 : H * 0.57;
      place.tr = state.focus ? W * 0.42 : Math.min(W * 0.43, H * 0.36);
      return;
    }
    const left = state.focus ? 0 : Math.min(420, W * 0.32), right = state.focus ? 410 : 0;
    const avail = W - left - right;
    place.tx = left + avail / 2;
    place.ty = H * 0.5;
    place.tr = Math.min(avail * 0.4, H * 0.41);
  }
  function easeLayout(dt) {
    const k = reduce ? 1 : 1 - Math.exp(-dt * 7);
    place.cx += (place.tx - place.cx) * k; place.cy += (place.ty - place.cy) * k; place.r += (place.tr - place.r) * k;
    globe.layout(place.cx, place.cy, place.r);
  }

  // ---------- Sky ----------
  function drawSky() {
    const sky = $('#sky'), w = innerWidth, h = innerHeight, d = Math.min(2, devicePixelRatio || 1);
    sky.width = Math.round(w * d); sky.height = Math.round(h * d);
    const g = sky.getContext('2d');
    g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = '#04060c'; g.fillRect(0, 0, w, h);
    const band = g.createLinearGradient(0, h, w, 0);
    band.addColorStop(0, 'rgba(60,70,120,0)'); band.addColorStop(0.5, 'rgba(70,80,130,0.10)'); band.addColorStop(1, 'rgba(60,70,120,0)');
    g.fillStyle = band; g.fillRect(0, 0, w, h);
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const n = Math.round(w * h / 1800);
    for (let i = 0; i < n; i++) {
      const x = rnd() * w, y = rnd() * h, m = rnd();
      const r = m > 0.985 ? 1.4 : m > 0.9 ? 0.9 : 0.55;
      g.fillStyle = `rgba(${200 + rnd() * 55 | 0},${210 + rnd() * 45 | 0},255,${0.25 + rnd() * 0.6})`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  }

  // ---------- Time ----------
  const tx = (t) => (T0 - t) / T0;
  function travelTo(t, ms) {
    state.playing = false; syncPlay();
    if (reduce || !ms) { state.t = t; state.anim = null; return; }
    state.anim = { from: state.t, to: t, k: 0, ms };
  }
  function stepTime(dt) {
    const before = state.t;
    if (state.anim) {
      const a = state.anim;
      a.k += dt * 1000 / a.ms;
      const e = a.k >= 1 ? 1 : (a.k < 0.5 ? 4 * a.k ** 3 : 1 - (-2 * a.k + 2) ** 3 / 2);
      state.t = a.from + (a.to - a.from) * e;
      if (a.k >= 1) state.anim = null;
    } else if (state.playing) {
      const rate = state.t > 1e9 ? 2.2e8 : state.t > 6.5e8 ? 1.2e8 : state.t > 3e8 ? 4.5e7 : 6e7;
      state.t = Math.max(0, state.t - rate * dt);
      announce(before, state.t);
      if (state.t <= 0) { state.playing = false; syncPlay(); }
    }
    if (state.t !== before || !syncTime.done) syncTime();
  }
  // While history plays, name each moment as the playhead passes it.
  function announce(a, b) {
    for (const it of C.history()) if (it.t <= a && it.t > b && it.t < T0) toast(it.title + ' · ' + C.when(it.t));
  }
  function syncTime() {
    syncTime.done = true;
    const p = C.periodAt(state.t);
    $('#now-when').textContent = state.t < 1e4 ? 'Today' : C.when(state.t).replace(/^./, (c) => c.toUpperCase());
    $('#now-era').textContent = (p.name || '') + ' · Earth clock ' + C.clock(state.t);
    const v = Math.round((T0 - state.t) / 1e6);
    const input = $('#time');
    if (+input.value !== v) input.value = v;
    input.setAttribute('aria-valuetext', C.when(state.t) + ', ' + (p.name || ''));
    $('#head').style.left = (tx(state.t) * 100) + '%';
  }
  function syncPlay() { $('#play').textContent = state.playing ? 'Pause' : 'Play history'; }

  function buildTrack() {
    const track = $('#track');
    $('#eons').innerHTML = C.EONS.map((e) => {
      const a = tx(Math.min(T0, e.t0)), b = tx(e.t1);
      return `<span class="eon" style="left:${a * 100}%;width:${(b - a) * 100}%;--c:${e.color}" title="${esc(e.name)}">${esc(e.name)}</span>`;
    }).join('');
    // Systems: dots above the line, stacked where they crowd together.
    const rows = [];
    for (const s of C.SYSTEMS.slice().sort((a, b) => b.t - a.t)) {
      const x = tx(s.t);
      let row = 0;
      while (rows[row] != null && x - rows[row] < 0.022) row++;
      rows[row] = x;
      if (s.until) {
        const sp = document.createElement('span');
        sp.className = 'span';
        sp.style.cssText = `left:${x * 100}%;width:${(tx(s.until) - x) * 100}%;--c:${KCOL[s.kind]}`;
        track.appendChild(sp);
      }
      const b = document.createElement('button');
      b.className = 'mark';
      b.style.cssText = `left:${x * 100}%;top:${24 - row * 12}px;--c:${KCOL[s.kind]}`;
      b.innerHTML = '<i></i>';
      b.dataset.id = s.id;
      b.setAttribute('aria-label', s.title + ', ' + s.when);
      b.addEventListener('click', () => openSystem(s));
      b.addEventListener('pointerenter', () => tip(x, s.title, s.when));
      b.addEventListener('pointerleave', () => tip(null));
      track.appendChild(b);
    }
    for (const e of C.EVENTS) {
      const x = tx(e.t);
      const b = document.createElement('button');
      b.className = 'ev';
      b.style.left = (x * 100) + '%';
      b.setAttribute('aria-label', e.title + ', ' + C.when(e.t));
      b.addEventListener('click', () => { travelTo(e.t, 1100); toast(e.title + ' · ' + C.when(e.t)); });
      b.addEventListener('pointerenter', () => tip(x, e.title, C.when(e.t), e.text));
      b.addEventListener('pointerleave', () => tip(null));
      track.appendChild(b);
    }
    // Dragging anywhere on the ruler travels in time.
    const fromX = (cx) => { const r = track.getBoundingClientRect(); return T0 * (1 - Math.max(0, Math.min(1, (cx - r.left) / r.width))); };
    let drag = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.mark, .ev')) return;
      drag = true; track.setPointerCapture(e.pointerId);
      state.anim = null; state.playing = false; syncPlay();
      state.t = fromX(e.clientX);
    });
    track.addEventListener('pointermove', (e) => { if (drag) state.t = fromX(e.clientX); });
    track.addEventListener('pointerup', () => { drag = false; });
    track.addEventListener('pointercancel', () => { drag = false; });
    $('#time').addEventListener('input', (e) => { state.anim = null; state.playing = false; syncPlay(); state.t = (4540 - +e.target.value) * 1e6; });
  }
  function buildTicks() {
    const step = W < 600 ? 1e9 : 5e8, out = [];
    for (let t = 4e9; t > step / 2; t -= step) out.push(`<span class="tick" style="left:${tx(t) * 100}%">${(t / 1e9).toFixed(t % 1e9 ? 1 : 0)} Ga</span>`);
    out.push('<span class="tick today">today</span>');
    $('#ticks').innerHTML = out.join('');
  }
  function tip(x, title, when, text) {
    const track = $('#track');
    let el = track.querySelector('.tip');
    if (x == null) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.className = 'tip'; track.appendChild(el); }
    el.innerHTML = `<b>${esc(title)}</b><small>${esc(when)}</small>${text ? '<br>' + esc(text) : ''}`;
    el.style.left = Math.max(8, Math.min(92, x * 100)) + '%';
  }
  function toast(text) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = text;
    stage.appendChild(el);
    setTimeout(() => el.remove(), 2700);
  }

  // ---------- Highlights ----------
  function buildChips() {
    const kinds = $('#kind-chips'), layers = $('#layer-chips');
    for (const k of C.KINDS) {
      const b = chip(k.short, KCOL[k.id], k.text);
      b.addEventListener('click', () => {
        const on = !state.kinds.has(k.id);
        on ? state.kinds.add(k.id) : state.kinds.delete(k.id);
        b.setAttribute('aria-pressed', String(on));
        if (on) lookAt(C.SYSTEMS.filter((s) => s.kind === k.id && s.t >= state.t));
      });
      kinds.appendChild(b);
    }
    const LCOL = { sun: '#ffcf8a', currents: '#bcd8ff', heat: '#ff7a3d', life: '#7fe39a' };
    for (const l of C.LAYERS) {
      const b = chip(l.name, LCOL[l.id], l.text);
      b.addEventListener('click', () => {
        const on = !state.layers.has(l.id);
        on ? state.layers.add(l.id) : state.layers.delete(l.id);
        b.setAttribute('aria-pressed', String(on));
        if (on) toast(l.text);
      });
      layers.appendChild(b);
    }
  }
  function chip(label, color, title) {
    const b = document.createElement('button');
    b.className = 'chip';
    b.style.setProperty('--c', color);
    b.setAttribute('aria-pressed', 'false');
    b.title = title;
    b.innerHTML = '<i></i>' + esc(label);
    return b;
  }
  // Turn the globe to face a group of places.
  function lookAt(list) {
    if (!list.length) return;
    let x = 0, y = 0, z = 0;
    for (const s of list) {
      const la = s.lat * Math.PI / 180, lo = s.lon * Math.PI / 180;
      x += Math.cos(la) * Math.sin(lo); y += Math.sin(la); z += Math.cos(la) * Math.cos(lo);
    }
    const lat = Math.atan2(y, Math.hypot(x, z)) * 180 / Math.PI, lon = Math.atan2(x, z) * 180 / Math.PI;
    globe.flyTo(Globe.clamp(lat, -45, 45), lon, Math.min(globe.zoom, 1.1));
  }
  function easeShow(dt) {
    const k = reduce ? 1 : 1 - Math.exp(-dt * 5);
    for (const id in state.show) state.show[id] += ((state.layers.has(id) ? 1 : 0) - state.show[id]) * k;
  }

  // ---------- Focus ----------
  let preview = null;
  function openSystem(s) {
    if (state.view !== 'planet') setView('planet');
    state.focus = s;
    document.body.classList.add('focused');
    const panel = $('#focus');
    panel.hidden = false;
    panel.style.setProperty('--kc', KCOL[s.kind]);
    const k = C.kind(s.kind), done = C.labsDone();
    const links = C.links(s).map((l, i) => {
      const small = l.kind === 'lab' ? `<small>${esc(l.lab.question)}${done.includes(l.lab.id) ? ' · done ✓' : ''}</small>` : l.text ? `<small>${esc(l.text)}</small>` : '';
      return `<a class="${i === 0 ? 'primary' : ''}" href="${esc(ROOT + l.path)}"><span>${esc(l.label)}${small}</span><span aria-hidden="true">→</span></a>`;
    }).join('');
    $('#focus-body').innerHTML =
      `<span class="eyebrow" style="color:${KCOL[s.kind]}">${esc(k.name)}${s.chapter != null ? ' · chapter ' + s.chapter : ''}</span>` +
      `<h2>${esc(s.title)}</h2>` +
      `<div class="meta"><b>${esc(s.when.replace(/^./, (c) => c.toUpperCase()))}</b><span>${esc(s.place)} · ${C.where(s.lat, s.lon)}</span></div>` +
      `<p>${esc(s.text)}</p>` +
      `<p class="evidence"><b>Where the evidence is</b>${esc(s.evidence)}</p>` +
      `<div class="links">${links}</div>`;
    const i = C.SYSTEMS.indexOf(s), prev = C.SYSTEMS[i - 1], next = C.SYSTEMS[i + 1];
    walk($('#walk-prev'), prev, '‹ ');
    walk($('#walk-next'), next, '', ' ›');
    if (preview) preview.stop();
    const status = $('#preview-status');
    preview = Previews.mount(s.preview, $('#preview'), { onStatus: (t) => { status.hidden = !t; status.textContent = t; } });
    globe.hold = true;
    target();
    globe.flyTo(s.lat, s.lon, W < 860 ? 1.25 : 1.55);
    travelTo(s.until || s.t, 1500);
    for (const m of document.querySelectorAll('.track .mark')) m.setAttribute('aria-current', String(m.dataset.id === s.id));
    $('#focus-body').scrollTop = 0;
  }
  function walk(btn, s, pre, post) {
    btn.disabled = !s;
    btn.textContent = s ? (pre || '') + s.title + (post || '') : '';
    btn.onclick = s ? () => openSystem(s) : null;
  }
  function closeSystem() {
    if (!state.focus) return;
    state.focus = null;
    document.body.classList.remove('focused');
    $('#focus').hidden = true;
    if (preview) { preview.stop(); preview = null; }
    globe.hold = false;
    globe.flyTo(globe.lat, globe.lon, 1);
    target();
    for (const m of document.querySelectorAll('.track .mark')) m.setAttribute('aria-current', 'false');
    over.focus({ preventScroll: true });
  }
  $('#focus-close').addEventListener('click', closeSystem);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSystem(); });

  // ---------- On the globe ----------
  // A system is on the planet once it has arisen.
  const appear = (t) => Math.max(0, Math.min(1, (t - state.t) / 4e7 + 1));
  function marks() {
    const out = [];
    for (const s of C.SYSTEMS) {
      const a = appear(s.t);
      if (a <= 0) continue;
      const p = globe.project(s.lat, s.lon);
      if (p.z < 0.03) continue;
      out.push({ s, x: p.x, y: p.y, z: p.z, a: a * Math.min(1, p.z * 5) });
    }
    for (const e of C.EVENTS) {
      if (e.lat == null) continue;
      const a = appear(e.t);
      if (a <= 0) continue;
      const p = globe.project(e.lat, e.lon);
      if (p.z < 0.03) continue;
      out.push({ e, x: p.x, y: p.y, z: p.z, a: a * Math.min(1, p.z * 5) });
    }
    return out;
  }
  function nearest(x, y, r) {
    let best = null, bd = r * r;
    for (const m of marks()) {
      const d = (m.x - x) ** 2 + (m.y - y) ** 2;
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }
  globe.ontap = (x, y) => {
    const m = nearest(x, y, 24);
    if (!m) return;
    if (m.s) openSystem(m.s);
    else { travelTo(m.e.t, 1100); toast(m.e.title + ' · ' + m.e.text); }
  };
  globe.onhover = (x, y) => {
    const m = x == null ? null : nearest(x, y, 18);
    state.hover = m && (m.s || m.e);
    over.classList.toggle('over-mark', !!m);
    const el = $('#hover');
    if (!m) { el.hidden = true; return; }
    el.hidden = false;
    el.style.left = m.x + 'px'; el.style.top = m.y + 'px';
    el.querySelector('b').textContent = m.s ? m.s.title : m.e.title;
    el.querySelector('small').textContent = m.s ? m.s.when + ' · ' + m.s.place : C.when(m.e.t);
  };

  const placeLabels = Globe.labels();
  function drawMarks(now) {
    const ms = marks(), ctx = octx, names = [];
    ctx.save();
    ctx.textBaseline = 'middle';
    for (const m of ms) {
      if (m.e) {
        ctx.globalAlpha = m.a * 0.8;
        ctx.fillStyle = '#f2f5fb';
        ctx.beginPath(); ctx.moveTo(m.x, m.y - 4); ctx.lineTo(m.x + 4, m.y); ctx.lineTo(m.x, m.y + 4); ctx.lineTo(m.x - 4, m.y); ctx.closePath(); ctx.fill();
        continue;
      }
      const s = m.s, col = KCOL[s.kind];
      const dim = state.kinds.size && !state.kinds.has(s.kind) ? 0.2 : 1;
      const focused = state.focus === s, hovered = state.hover === s;
      ctx.globalAlpha = m.a * dim;
      if (!reduce) {
        const ph = ((now / 2600 + (s.chapter || 7) * 0.29) % 1);
        ctx.strokeStyle = col; ctx.lineWidth = 1.5;
        ctx.globalAlpha = m.a * dim * (1 - ph) * 0.7;
        ctx.beginPath(); ctx.arc(m.x, m.y, 5 + ph * 18, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = m.a * dim;
      }
      ctx.shadowColor = col; ctx.shadowBlur = 14;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(m.x, m.y, focused || hovered ? 6.5 : 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2); ctx.fill();
      if (focused) {
        ctx.strokeStyle = col; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(m.x, m.y, 13, 0, Math.PI * 2); ctx.stroke();
      }
      if (m.z > 0.3 || focused) {
        const strong = focused || hovered, font = (strong ? '600 13px ' : '500 12px ') + css.getPropertyValue('--sans');
        ctx.font = font;
        names.push({ key: s.id, x: m.x, y: m.y, w: ctx.measureText(s.title).width, h: 16, s, font, strong,
          a: m.a * dim * (strong ? 1 : 0.82), rank: (strong ? 2 : 0) + m.z });
      }
    }
    // Names last, nearest and focused first, so none covers another.
    names.sort((p, q) => q.rank - p.rank);
    for (const n of placeLabels(names, { bounds: [4, W - 4] })) {
      if (!n.side) continue;
      ctx.font = n.font; ctx.globalAlpha = n.a;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(3,5,10,0.75)';
      ctx.strokeText(n.s.title, n.lx, n.y);
      ctx.fillStyle = n.strong ? '#ffffff' : '#dfe6f2';
      ctx.fillText(n.s.title, n.lx, n.y);
    }
    ctx.restore();
  }

  // Currents: tracers that drift with the surface flow, drawn as short trails.
  const parts = [];
  const flow = [0, 0];
  function seedCurrents() { for (let i = 0; i < 1100; i++) parts.push(spawn({}, true)); }
  function spawn(p, early) {
    for (let k = 0; k < 40; k++) {
      p.lat = Math.asin(Math.random() * 2 - 1) * 180 / Math.PI;
      p.lon = Math.random() * 360 - 180;
      if (Math.abs(p.lat) < 74 && planet.coastAt(p.lat, p.lon) < -0.6) break;
    }
    p.life = 2.5 + Math.random() * 4;
    p.age = early ? Math.random() * p.life : 0;
    p.trail = [[p.lat, p.lon]];
    return p;
  }
  function drawCurrents(dt) {
    const a = state.show.currents;
    if (a < 0.01 || !parts.length) return;
    const ctx = octx, K = 5;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(206, 226, 255, 1)';
    const buckets = [[], [], []];
    for (const p of parts) {
      if (!reduce) {
        planet.current(p.lat, p.lon, flow);
        p.lat += flow[1] * K * dt;
        p.lon += flow[0] * K * dt / Math.max(0.25, Math.cos(p.lat * Math.PI / 180));
        p.lon = Globe.wrap(p.lon);
        p.age += dt;
        p.trail.push([p.lat, p.lon]);
        if (p.trail.length > 14) p.trail.shift();
        if (p.age > p.life || Math.abs(p.lat) > 78 || planet.coastAt(p.lat, p.lon) > -0.15 || Math.hypot(flow[0], flow[1]) < 0.03) spawn(p);
      }
      const life = Math.sin(Math.PI * Math.min(1, p.age / p.life));
      buckets[Math.min(2, Math.floor(life * 3))].push(p);
    }
    buckets.forEach((list, bi) => {
      ctx.globalAlpha = a * (0.12 + bi * 0.17);
      ctx.beginPath();
      for (const p of list) {
        let first = true, prevLon = null;
        for (const [la, lo] of p.trail) {
          const q = globe.project(la, lo);
          if (q.z < 0.05 || (prevLon != null && Math.abs(lo - prevLon) > 90)) { first = true; prevLon = lo; continue; }
          if (first) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
          first = false; prevLon = lo;
        }
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  // ---------- Drawing ----------
  function drawGlobe(sec) {
    const look = C.look(state.t);
    if (gl) {
      const k = dpr * glScale;
      gl.draw(Object.assign(Globe.lookUniforms(look), {
        u_res: [glCanvas.width, glCanvas.height], u_center: [globe.cx * k, globe.cy * k], u_radius: globe.radius * k,
        u_rot: globe.matrix(), u_time: sec, u_sun: SUN,
        u_show: [state.show.sun, state.show.heat, state.show.life, 0], u_lifeSea: state.t <= 3.8e9 ? 1 : 0,
      }));
    } else if (fallback && planet) {
      drawDots(fallback, look);
    }
  }
  // Without WebGL: the planet as dots.
  function drawDots(ctx, look) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const r = globe.radius;
    const g = ctx.createRadialGradient(globe.cx - r * 0.4, globe.cy - r * 0.4, r * 0.1, globe.cx, globe.cy, r);
    g.addColorStop(0, `rgb(${look.shallow.join(',')})`); g.addColorStop(1, `rgb(${look.ocean.map((v) => v * 0.4 | 0).join(',')})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(globe.cx, globe.cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgb(${look.ground.join(',')})`;
    for (let lat = -84; lat <= 84; lat += 2) {
      for (let lon = -180; lon < 180; lon += 2 / Math.max(0.2, Math.cos(lat * Math.PI / 180))) {
        if (!planet.isLand(lat, lon) || planet.coastAt(lat, lon) < (1 - look.land) * 20) continue;
        const p = globe.project(lat, lon);
        if (p.z > 0) ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      }
    }
  }

  let last = performance.now(), slow = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden || state.view !== 'planet') return;
    // Keep the frame rate up on slower machines by painting the planet at a lower resolution.
    slow = dt > 0.024 ? slow + 1 : Math.max(0, slow - 1);
    if (gl && slow > 50 && glScale > 0.5) { glScale *= 0.75; sizeGL(); slow = 0; }
    globe.tick(dt);
    stepTime(dt);
    easeShow(dt);
    easeLayout(dt);
    document.body.classList.toggle('zoomed', globe.zoom > 1.45);
    drawGlobe(now / 1000);
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, W, H);
    if (planet) { drawCurrents(dt); drawMarks(now); }
  }

  // ---------- Play ----------
  $('#play').addEventListener('click', () => {
    state.anim = null;
    if (!state.playing && state.t < 1e7) state.t = T0;
    state.playing = !state.playing;
    if (state.playing) { closeSystem(); toast('Earth forms · 4.54 billion years ago'); }
    syncPlay();
  });
  $('#today').addEventListener('click', () => travelTo(0, 1400));
  $('#zoom-in').addEventListener('click', () => globe.zoomBy(1.3));
  $('#zoom-out').addEventListener('click', () => globe.zoomBy(1 / 1.3));
  $('#zoom-fit').addEventListener('click', () => globe.flyTo(globe.lat, globe.lon, 1));

  // ---------- List view ----------
  function buildList() {
    const done = C.labsDone(), labs = window.LabCatalogue || [];
    const groups = C.KINDS.map((k) => {
      const items = C.SYSTEMS.filter((s) => s.kind === k.id).map((s) => {
        const ls = C.links(s);
        return `<li class="item" style="--kc:${KCOL[s.kind]}">
          <div class="head"><a href="${esc(ROOT + ls[0].path)}">${esc(s.title)}</a><span>${esc(C.short(s.t))}</span></div>
          <p>${esc(s.text)}</p>
          <p class="where">${esc(s.place)} · ${C.where(s.lat, s.lon)}</p>
          <p class="go">${ls.slice(1).map((l) => `<a href="${esc(ROOT + l.path)}">${esc(l.label)}${l.lab && done.includes(l.lab.id) ? ' ✓' : ''}</a>`).join('')}</p>
        </li>`;
      }).join('');
      return `<div class="kind-group" style="--kc:${KCOL[k.id]}"><div class="kind"><h3><i></i>${esc(k.name)}</h3><p>${esc(k.text)}</p></div><ul class="items">${items}</ul></div>`;
    }).join('');
    const hist = C.history().map((it) => {
      const s = it.system;
      const title = s ? `<a href="${esc(ROOT + C.links(s)[0].path)}">${esc(it.title)}</a>` : esc(it.title);
      return `<li class="${s ? 'chapter' : ''}"><time>${esc(C.short(it.t))}</time><div><b>${title}</b><br><span>${esc(it.text)}</span></div></li>`;
    }).join('');
    $('#list-view').innerHTML = `<div class="list-inner">
      <header><h1>Everything in Learning Systems</h1><p class="lede">Small simulated worlds where living systems organise themselves from local rules. Here they are as a plain list: three ways in, every system from the simplest to the most complex, and the history they come from.</p></header>
      <section><h2>Ways in</h2><ul class="ways-list">
        <li><a href="${ROOT}world/index.html#story"><b>Watch the story</b><span>A guided tour of one world, from the first chemistry to brains, one chapter at a time.</span></a></li>
        <li><a href="${ROOT}labs/index.html"><b>Take a mechanism apart</b><span>Guided labs: change one thing in a twin world and follow the effect across levels. ${done.length} of ${labs.length} done.</span></a></li>
        <li><a href="${ROOT}world/index.html"><b>Explore freely</b><span>The World Viewer: every chapter on one stage, from a whole coast down to single cells.</span></a></li>
      </ul></section>
      <section><h2>Systems, simplest first</h2><div>${groups}</div></section>
      <section><h2>The history of the planet</h2><ol class="history">${hist}</ol></section>
      <p class="foot">Places are where the oldest evidence was found, or a living example. Continents on the globe are today's, so places can be found.</p>
    </div>`;
  }

  // ---------- Views ----------
  const STORE = 'learning-systems.home-view';
  // quiet: opened from a link or a remembered choice, so nothing new to remember.
  function setView(v, quiet) {
    state.view = v;
    const list = v === 'list';
    $('#planet-view').hidden = list; $('#time-panel').hidden = list; $('#list-view').hidden = !list;
    $('#tab-planet').setAttribute('aria-selected', String(!list));
    $('#tab-list').setAttribute('aria-selected', String(list));
    document.body.classList.toggle('listing', list);
    if (list && preview) { preview.stop(); preview = null; }
    if (!list && state.focus) openSystem(state.focus);
    if (!quiet) { try { localStorage.setItem(STORE, v); } catch (e) { /* not kept */ } }
    if (!list) requestAnimationFrame(resize);
  }
  $('#tab-planet').addEventListener('click', () => setView('planet'));
  $('#tab-list').addEventListener('click', () => setView('list'));

  // Screen readers get the systems as buttons too.
  $('#sr-systems').innerHTML = C.SYSTEMS.map((s) => `<li><button data-id="${s.id}">${esc(s.title)}, ${esc(s.when)}, ${esc(s.place)}</button></li>`).join('');
  $('#sr-systems').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) openSystem(C.system(b.dataset.id)); });

  const done = C.labsDone(), labs = window.LabCatalogue || [];
  $('#labs-done').textContent = labs.length ? done.length + '/' + labs.length : '';

  buildChips();
  buildTrack();
  buildList();
  addEventListener('resize', resize);
  resize();
  syncTime();
  let start = 'planet';
  try { start = localStorage.getItem(STORE) || 'planet'; } catch (e) { /* not kept */ }
  if (location.hash === '#list') start = 'list';
  if (start === 'list') setView('list', true);
  requestAnimationFrame(frame);
  window.Observatory = { globe, state, openSystem, travelTo };
})();
