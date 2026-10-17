// The home page, as a dive. A glowing planet floats in the dark;
// scroll, swipe, press the arrow keys or use the depth gauge to sink through
// the levels of life, from an ecosystem down to the molecules life began
// with. Every stop is the real simulation running full screen, and the next
// one opens in the middle of the current one like a porthole.
(function () {
  'use strict';

  const C = window.SystemCatalogue;
  const $ = (s) => document.querySelector(s);
  const ROOT = '';             // where the catalogue's paths start: this page is at the site root
  const T0 = C.T_START;
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cap = (s) => s.replace(/^./, (c) => c.toUpperCase());
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  // "540 million", "3.8 billion", "300 thousand", "today": years ago, for tight spaces.
  const ago = (t) => (t < 1e4 ? 'today' : t >= 1e9 ? (t / 1e9).toFixed(1) + ' billion' : t >= 1e6 ? Math.round(t / 1e6) + ' million' : Math.round(t / 1e3) + ' thousand');

  // The stops, from the top down. Each level of life is built from the one
  // below it: deeper is smaller and, below the brain, simpler and older.
  const LADDER = [
    { id: 'planet' },
    { id: 'ecosystems', into: 'Many creatures sharing one sea floor.' },
    { id: 'brains', into: 'One of those creatures, and the small brain that steers it.' },
    { id: 'tissue', into: 'Inside a brain: a slice of living tissue.' },
    { id: 'nerve-nets', into: 'Simpler and older: nerves with no brain.' },
    { id: 'bodies', into: 'Before nerves: cells that squeeze together.' },
    { id: 'colonies', into: 'Before bodies: cells that stick together.' },
    { id: 'first-cells', into: 'Before colonies: single cells on their own.' },
    { id: 'early-earth', into: 'Before life: molecules in a young sea.' },
  ];

  const css = getComputedStyle(document.documentElement);
  const KCOL = {};
  for (const k of C.KINDS) KCOL[k.id] = css.getPropertyValue('--k-' + k.id).trim();
  const GLOW = css.getPropertyValue('--glow').trim() || '#4ff0e0';
  const SANS = css.getPropertyValue('--sans').trim();
  const MONO = css.getPropertyValue('--mono').trim();
  const LCOL = { plates: '#ff5c8a', currents: '#8fc8ff' };
  const STOPS = LADDER.map((l, i) => {
    const s = i ? C.system(l.id) : null;
    return Object.assign({ i, s, kind: s ? C.kind(s.kind) : null, color: s ? KCOL[s.kind] : GLOW, name: s ? s.title.split(':')[0] : 'Surface' }, l);
  });
  const N = STOPS.length;
  // The planet's age while a stop is open: when that system was in place.
  const timeOf = (st) => (st.s ? st.s.until || st.s.t : 0);

  const state = {
    at: 0, tr: null, t: 0, age: null, view: 'dive', shown: -1, dived: false, hover: null,
    layers: new Set(), show: { plates: 0, currents: 0 },
    pick: null,   // with the plates lit up: the plate or edge under the pointer
  };
  const appear = (t) => clamp((t - state.t) / 4e7 + 1, 0, 1);

  // ---------- The planet ----------
  const glc = $('#globe'), glow = $('#glow'), hit = $('#hit'), panel = $('#stop'), strip = $('#strip'), cue = $('#cue');
  const gx = glow.getContext('2d');
  const globe = new Globe(hit, { lat: 22, lon: -45, spin: 4, minZoom: 1, maxZoom: 1.6 });
  const ZMAX = 9;              // how far the planet zooms in before a dive covers it
  const SUN = [-0.55, 0.45, 0.7];

  const FRAG = `
uniform vec3 u_sun;
uniform float u_plates;       // the tectonic plates layer, 0 to 1
uniform float u_plateHover;   // id of the plate under the pointer, or -1
uniform sampler2D u_plateIds; // lib/plates.js: which plate is where
uniform float u_lifeSea;      // 0 before the first cells, 1 after
uniform float u_fade;         // 1 hides the planet once a dive covers it
const vec3 GLOW = vec3(0.31, 0.94, 0.88);

vec3 lava(vec3 w) {
  float n = fbm(w * 4.0 + vec3(0.0, u_time * 0.015, 0.0));
  float crack = pow(1.0 - abs(n * 2.0 - 1.0), 7.0);
  return mix(vec3(0.07, 0.01, 0.03), vec3(1.0, 0.36, 0.32), crack) + vec3(0.6, 0.12, 0.2) * pow(crack, 24.0);
}

void main() {
  vec2 q = globeQ();
  float d = length(q);
  float pix = 1.0 / u_radius;
  vec3 halo = mix(GLOW, u_sky, 0.2);
  vec4 col = vec4(0.0);
  // A halo of light around the planet.
  if (d > 1.0 - 2.0 * pix) {
    float h = max(0.0, d - 1.0);
    float g = exp(-h / 0.02) * 0.55 + exp(-h / 0.12) * 0.18;
    col = vec4(halo * g, g);
  }
  if (d < 1.0) {
    vec3 n = viewNormal(q);
    vec3 w = normalize(u_rot * n);
    vec4 f = fields(w);
    float hgt = heightAt(f, w);
    float aa = 57.3 * pix / max(n.z, 0.15);   // degrees across one pixel
    float land = smoothstep(-aa, aa, hgt);
    float grain = fbm(w * 16.0);

    // Dark water, lighter over the shallows, with depth lines offshore like a sonar map.
    float shallow = smoothstep(-3.5, -0.1, hgt) * (1.0 - land);
    vec3 c = mix(vec3(0.004, 0.022, 0.04), vec3(0.01, 0.085, 0.11), shallow);
    float off = max(-hgt, 0.0);
    float contour = abs(fract(off / 2.4 + 0.5) - 0.5) * 2.4;
    c += GLOW * (1.0 - smoothstep(0.0, aa * 1.3, contour)) * exp(-off / 8.0) * 0.18 * (1.0 - land) * step(0.6, off);
    // Dark land with a little relief.
    vec3 ground = vec3(0.02, 0.045, 0.055) * (0.6 + 0.8 * grain) + vec3(0.0, 0.035, 0.03) * f.g;
    c = mix(c, ground, land);
    // Coasts glow.
    c += GLOW * (exp(-abs(hgt) / (aa * 1.6 + 0.004)) * 0.8 + exp(-abs(hgt) / (aa * 6.5 + 0.01)) * 0.1);
    // Life, faintly: plankton twinkling at sea once there are cells, a green glow on land once there are plants.
    float lf = mix(u_lifeSea, u_green * 0.6, land);
    float tw = noise3(w * 140.0 + vec3(0.0, u_time * 0.4, u_time * 0.25));
    c += mix(vec3(0.12, 0.85, 0.95), vec3(0.55, 1.0, 0.35), land) * lf * 0.035 * (0.4 + 1.1 * smoothstep(0.6, 0.92, tw));
    // Heat from below: ridges and rifts where plates pull apart, hot spots and vents.
    float pulse = 0.75 + 0.25 * sin(u_time * 1.7 + f.b * 14.0);
    c += vec3(1.0, 0.36, 0.54) * pow(f.b, 1.6) * (0.05 + 0.9 * u_plates) * pulse;
    // The plate under the pointer.
    if (u_plateHover > 0.0) {
      float id = floor(texture2D(u_plateIds, uvOf(w)).r * 255.0 + 0.5);
      c += vec3(1.0, 0.62, 0.42) * 0.08 * u_plates * (1.0 - step(0.5, abs(id - u_plateHover)));
    }
    // Ice, and the molten young planet.
    float ice = iceAt(w, land);
    c = mix(c, vec3(0.42, 0.78, 0.88) * (0.45 + 0.35 * grain), ice * 0.8);
    if (u_molten > 0.001) c = mix(c, lava(w), u_molten);
    // A soft day side.
    float day = smoothstep(-0.2, 0.45, dot(n, normalize(u_sun)));
    c *= 0.72 + 0.4 * day;
    // Rim light.
    c += halo * pow(1.0 - n.z, 3.0) * 0.55;
    float edge = smoothstep(1.0, 1.0 - 1.5 * pix, d);
    col = mix(col, vec4(c, 1.0), edge);
  }
  gl_FragColor = col * (1.0 - u_fade);
}`;

  const gl = Globe.webgl(glc, FRAG);
  const flat = gl ? null : glc.getContext('2d');
  let planet = null;
  Planet.load().then((p) => {
    planet = p;
    if (gl) { gl.texture(p.texture()); gl.texture(p.fine(), 'u_fine'); }
    seedDots();
    seedCurrents();
  }).catch((e) => console.error(e));
  let plateMap = null;
  Plates.load().then((m) => {
    plateMap = m;
    if (gl) gl.texture(m.texture(), 'u_plateIds');
  }).catch((e) => console.error(e));

  // ---------- Layout ----------
  // The lens: one round window where the planet floats, and where each level
  // of life opens when you dive.
  let W = 1, H = 1, dpr = 1, glScale = 1, narrow = false;
  const lens = { cx: 0, cy: 0, r: 100, tx: 0, ty: 0, tr: 100 };
  function resize() {
    W = Math.max(1, innerWidth); H = Math.max(1, innerHeight);
    dpr = Math.min(2, devicePixelRatio || 1);
    narrow = W < 860;
    glow.width = Math.round(W * dpr); glow.height = Math.round(H * dpr);
    sizeGL();
    aimLens();
    lens.cx = lens.tx; lens.cy = lens.ty; lens.r = lens.tr;
  }
  function sizeGL() {
    const k = gl ? Math.min(dpr, 1.5) * glScale : dpr;
    glc.width = Math.round(W * k); glc.height = Math.round(H * k);
  }
  // Right of the panel and left of the gauge; on a phone, between the header
  // and the panel, leaving room for the history strip on the planet.
  function aimLens() {
    const hist = $('#history');
    if (narrow) {
      const pt = panel.offsetTop || H * 0.6;
      hist.style.top = 'auto';
      hist.style.bottom = Math.round(H - pt + 10) + 'px';
      const top = 60, bottom = pt - 10 - (state.shown === 0 ? (hist.offsetHeight || 50) + 10 : 0);
      const w = W - 52, h = Math.max(120, bottom - top);
      lens.tr = Math.max(60, Math.min(w, h) / 2 - 4);
      lens.tx = 6 + w / 2; lens.ty = top + h / 2;
    } else {
      hist.style.top = hist.style.bottom = '';
      const left = panel.offsetLeft + panel.offsetWidth + 20, right = W - gauge.offsetWidth - 30, top = 64, bottom = H - 132;
      const w = Math.max(220, right - left), h = Math.max(220, bottom - top);
      lens.tr = Math.min(w, h) / 2 - 8;
      lens.tx = left + w / 2; lens.ty = top + h / 2;
      // "Scroll to dive" sits just under the planet.
      cue.style.left = Math.round(lens.tx) + 'px';
      cue.style.top = Math.round(lens.ty + lens.tr + 8) + 'px';
    }
  }
  function easeLens(dt) {
    const k = reduce ? 1 : 1 - Math.exp(-dt * 6);
    lens.cx += (lens.tx - lens.cx) * k; lens.cy += (lens.ty - lens.cy) * k; lens.r += (lens.tr - lens.r) * k;
  }

  // ---------- The dive ----------
  // A move between two stops is state.tr: f runs from 0 at "from" to 1 at "to".
  // Scrolling and swiping drive f by hand; buttons and keys let it run.
  function start(from, to, auto) {
    const tr = { from, to, f: 0, auto, goal: 1, dir: 1, t0: state.t, t1: state.t, view0: { lat: globe.lat, lon: globe.lon } };
    if (from === 0) tr.t1 = timeOf(STOPS[to]);
    if (to === 0) {
      // Surfacing: the planet comes back centred on the place we dived into.
      const s = STOPS[from].s;
      globe.lat = clamp(s.lat, -globe.maxLat, globe.maxLat); globe.lon = s.lon;
      tr.view0 = { lat: globe.lat, lon: globe.lon };
    }
    globe.vlon = globe.vlat = 0; globe.hold = true;
    state.age = null;
    state.tr = tr;
    state.dived = true;
    unpick();
    return tr;
  }
  function arrive(i) {
    state.tr = null;
    state.at = i;
    if (i > 0) state.t = timeOf(STOPS[i]);
    globe.zoom = 1; globe.hold = i > 0; globe.idle = 0;
    syncHash();
  }
  function cancel() {
    const tr = state.tr;
    state.tr = null;
    if (tr && tr.from === 0) { globe.zoom = 1; globe.lat = tr.view0.lat; globe.lon = tr.view0.lon; state.t = tr.t0; }
    globe.hold = state.at > 0;
  }
  // Where the dive is heading: the stop the next key press moves on from.
  const heading = () => (state.tr ? (state.tr.goal === 1 ? state.tr.to : state.tr.from) : state.at);
  function go(i) {
    i = clamp(Math.round(i), 0, N - 1);
    const tr = state.tr;
    if (tr) {
      if (tr.to === i) { tr.auto = true; tr.goal = 1; return; }
      if (tr.from === i) { tr.auto = true; tr.goal = 0; return; }
      if (tr.f >= 0.5) arrive(tr.to); else cancel();
    }
    if (i === state.at) return;
    if (reduce) { arrive(i); return; }
    start(state.at, i, true);
  }
  // By hand: + deeper, - back up, in stops.
  function scrub(delta) {
    let tr = state.tr;
    if (tr) tr.auto = false;      // a hand on the wheel takes over a move under way
    const dir = Math.sign(delta);
    if (!tr) {
      const to = state.at + dir;
      if (to < 0 || to >= N) return;
      tr = start(state.at, to, false);
    }
    const toward = Math.sign(tr.to - tr.from) === dir ? 1 : -1;
    tr.f += Math.abs(delta) * toward;
    tr.dir = toward;
    if (tr.f >= 1) { arrive(tr.to); detent = performance.now() + 320; }
    else if (tr.f <= 0) cancel();
  }
  // Let go: finish the move if it was heading on, or slide back.
  function settle() {
    const tr = state.tr;
    if (!tr || tr.auto) return;
    tr.auto = true;
    tr.goal = tr.dir > 0 && tr.f > 0.04 ? 1 : 0;
  }
  function stepMove(dt) {
    const tr = state.tr;
    if (!tr || !tr.auto) return;
    const d = tr.goal - tr.f, step = Math.max(Math.abs(d) * (1 - Math.exp(-dt * 4.2)), dt * 0.35);
    tr.f = Math.abs(d) <= step ? tr.goal : tr.f + Math.sign(d) * step;
    if (tr.f === tr.goal) { if (tr.goal === 1) arrive(tr.to); else cancel(); }
  }

  // What is on screen: the outer level, and the inner one opening inside it.
  // u is how far the porthole has opened, 0 to 1.
  function view() {
    const tr = state.tr;
    if (!tr) return { outer: state.at, inner: -1, g: 0, u: 0 };
    const deeper = tr.to > tr.from, g = clamp(deeper ? tr.f : 1 - tr.f, 0, 1);
    const outer = deeper ? tr.from : tr.to, inner = deeper ? tr.to : tr.from;
    // From the planet, it turns to the place first and opens after.
    return { outer, inner, g, u: outer === 0 ? clamp((g - 0.3) / 0.7, 0, 1) : g };
  }
  function aimGlobe(v, dt) {
    globe.layout(lens.cx, lens.cy, lens.r);
    if (v.inner > 0) {
      const s = STOPS[v.inner].s, tr = state.tr, k = smooth(0, 0.45, v.g);
      globe.lat = tr.view0.lat + (clamp(s.lat, -globe.maxLat, globe.maxLat) - tr.view0.lat) * k;
      globe.lon = Globe.wrap(tr.view0.lon + Globe.wrap(s.lon - tr.view0.lon) * k);
      globe.zoom = Math.pow(ZMAX, Math.pow(v.u, 1.15));
      state.t = tr.t0 + (tr.t1 - tr.t0) * smooth(0.05, 0.6, v.g);
    } else {
      globe.tick(dt);
    }
  }
  // The porthole opens in the middle of the lens, or on the planet at the
  // place we are diving into, and grows until it fills the lens.
  function porthole(v) {
    if (v.inner < 0) return;
    let X = lens.cx, Y = lens.cy;
    if (v.outer === 0) {
      const s = STOPS[v.inner].s, p = globe.project(s.lat, s.lon), k = smooth(0, 1, v.u);
      X = p.x + (lens.cx - p.x) * k; Y = p.y + (lens.cy - p.y) * k;
    }
    v.X = X; v.Y = Y;
    v.R = (lens.r + Math.hypot(X - lens.cx, Y - lens.cy)) * Math.pow(v.u, 1.5);
  }

  // ---------- Simulations ----------
  // Two slots: the level you are at, and the one opening inside it.
  const slots = ['#sim-a', '#sim-b'].map((id) => { const el = $(id); return { el, canvas: el.querySelector('canvas'), status: el.querySelector('.status'), stop: -1, p: null, css: '', zoom: '' }; });
  let need = '', needSince = 0;
  function wantStops(list, now) {
    const key = list.join(',');
    if (key !== need) { need = key; needSince = now; }
    for (const sl of slots) if (sl.stop >= 0 && !list.includes(sl.stop)) unmount(sl);
    // Skimming past a stop does not start its world.
    if (now - needSince < 90) return;
    for (const i of list) {
      if (slots.some((sl) => sl.stop === i)) continue;
      const sl = slots.find((x) => x.stop < 0);
      if (sl) mount(sl, i);
    }
  }
  function mount(sl, i) {
    sl.stop = i;
    sl.status.hidden = true;
    const c = sl.canvas.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, sl.canvas.width, sl.canvas.height);
    sl.p = Previews.mount(STOPS[i].s.preview, sl.canvas, {
      maxDpr: 1.5,
      onStatus: (t) => { if (sl.stop !== i) return; sl.status.hidden = !t; sl.status.textContent = t; },
    });
  }
  function unmount(sl) {
    if (sl.p) sl.p.stop();
    sl.p = null; sl.stop = -1; sl.status.hidden = true;
    sl.css = 'opacity:0;visibility:hidden';
    sl.el.style.cssText = sl.css;
  }
  const circle = (r, x, y) => { const c = `circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`; return `;clip-path:${c};-webkit-clip-path:${c}`; };
  function placeSims(v, now) {
    const list = [];
    if (v.outer > 0) list.push(v.outer);
    if (v.inner > 0) list.push(v.inner);
    wantStops(list, now);
    const L = lens, x0 = L.cx - L.r, y0 = L.cy - L.r;
    const box = `left:${x0.toFixed(1)}px;top:${y0.toFixed(1)}px;width:${(2 * L.r).toFixed(1)}px;height:${(2 * L.r).toFixed(1)}px`;
    for (const sl of slots) {
      // The window is the slot; the picture inside it zooms.
      let s = 'opacity:0;visibility:hidden', z = '';
      if (sl.stop >= 0 && sl.stop === v.outer && !(v.inner >= 0 && v.u >= 1)) {
        s = `${box};opacity:${v.inner < 0 ? 1 : (1 - 0.75 * v.u).toFixed(3)};z-index:0` + circle(L.r, L.r, L.r);
        if (v.inner >= 0 && v.u > 0) z = `transform:scale(${(1 + 1.6 * Math.pow(v.u, 1.4)).toFixed(4)})`;
      } else if (sl.stop >= 0 && sl.stop === v.inner && v.u > 0) {
        const ox = v.X - x0, oy = v.Y - y0;
        s = `${box};opacity:1;z-index:2` + circle(Math.min(v.R, L.r + Math.hypot(ox - L.r, oy - L.r)), ox, oy);
        if (v.u < 1) z = `transform-origin:${ox.toFixed(1)}px ${oy.toFixed(1)}px;transform:scale(${(0.5 + 0.5 * v.u).toFixed(4)})`;
      }
      if (s !== sl.css) { sl.el.style.cssText = s; sl.css = s; }
      if (z !== sl.zoom) { sl.canvas.style.cssText = z; sl.zoom = z; }
    }
  }

  // ---------- Painting ----------
  let globeShown = false;
  function drawGlobe(v, sec) {
    if (v.outer !== 0) {
      if (globeShown) {
        globeShown = false;
        if (gl) { gl.gl.viewport(0, 0, glc.width, glc.height); gl.gl.clear(gl.gl.COLOR_BUFFER_BIT); }
        else flat.clearRect(0, 0, glc.width, glc.height);
      }
      return;
    }
    globeShown = true;
    const look = C.look(state.t);
    if (gl) {
      const k = Math.min(dpr, 1.5) * glScale;
      gl.draw(Object.assign(Globe.lookUniforms(look), {
        u_res: [glc.width, glc.height], u_center: [globe.cx * k, globe.cy * k], u_radius: globe.radius * k,
        u_rot: globe.matrix(), u_time: sec, u_sun: SUN,
        u_plates: state.show.plates, u_plateHover: state.pick && state.pick.plate ? state.pick.plate.id : -1,
        u_lifeSea: state.t <= 3.8e9 ? 1 : 0,
        u_fade: smooth(0.8, 1, v.u),
      }));
    } else if (planet) {
      drawFlat(look, 1 - smooth(0.8, 1, v.u));
    }
  }

  // Without WebGL: the planet as glowing dots.
  const DOTS = [];
  function seedDots() {
    if (gl) return;
    for (let lat = -84; lat <= 84; lat += 2.4) {
      const n = Math.max(1, Math.round(360 * Math.cos(lat * RAD) / 2.4));
      for (let i = 0; i < n; i++) {
        const lon = -180 + (i + 0.5) * 360 / n, c = planet.coastAt(lat, lon), la = lat * RAD, lo = lon * RAD;
        if (c > -1.5) DOTS.push({ c, x: Math.cos(la) * Math.sin(lo), y: Math.sin(la), z: Math.cos(la) * Math.cos(lo) });
      }
    }
  }
  function drawFlat(look, alpha) {
    const ctx = flat, r = globe.radius, M = globe.matrix(), shore = (1 - look.land) * 20;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(globe.cx, globe.cy, r * 0.2, globe.cx, globe.cy, r * 1.1);
    g.addColorStop(0, '#06202a'); g.addColorStop(0.9, '#03121a'); g.addColorStop(0.91, 'rgba(79,240,224,0.35)'); g.addColorStop(1, 'rgba(79,240,224,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(globe.cx, globe.cy, r * 1.1, 0, TAU); ctx.fill();
    ctx.fillStyle = GLOW;
    for (const d of DOTS) {
      const vz = M[6] * d.x + M[7] * d.y + M[8] * d.z;
      if (vz < 0.02 || d.c < shore - 1.2) continue;
      const vx = M[0] * d.x + M[1] * d.y + M[2] * d.z, vy = M[3] * d.x + M[4] * d.y + M[5] * d.z;
      ctx.globalAlpha = alpha * (Math.abs(d.c - shore) < 1.2 ? 0.95 : 0.3) * (0.4 + 0.6 * vz);
      ctx.fillRect(globe.cx + vx * r - 1, globe.cy - vy * r - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  // Marine snow: specks drifting in the dark that stream past as you dive.
  const SNOW = [];
  function flake(p, z) { p.x = Math.random() * 2 - 1; p.y = Math.random() * 2 - 1; p.z = z; return p; }
  for (let i = 0; i < 140; i++) SNOW.push(flake({}, 0.08 + Math.random() * 0.92));
  let pair = '', lastU = 0;
  function drawSnow(v, dt) {
    const key = v.outer + '>' + v.inner;
    const rate = key === pair && dt > 0 ? (v.u - lastU) / dt : 0;
    pair = key; lastU = v.u;
    const dz = reduce ? 0 : clamp(-0.02 - rate * 0.8, -2, 2);
    const base = v.inner >= 0 ? 0.5 + 0.45 * Math.sin(Math.PI * v.u) : v.outer === 0 ? 0.5 : 0.26;
    const cx = W / 2, cy = H / 2, fl = Math.max(W, H) * 0.32, inside = v.outer > 0 && v.inner < 0;
    gx.fillStyle = gx.strokeStyle = '#c4fbf4';
    gx.lineCap = 'round';
    for (const p of SNOW) {
      const ox = cx + p.x / p.z * fl, oy = cy + p.y / p.z * fl;
      p.z += dz * dt;
      if (!reduce) p.y += 0.012 * dt;
      if (p.z < 0.08) { flake(p, 1); continue; }        // it passed us: a new one far ahead
      if (p.z > 1) { flake(p, 0.08); continue; }        // left behind: a new one close by
      if (p.y > 1.1) p.y -= 2.2;
      const sx = cx + p.x / p.z * fl, sy = cy + p.y / p.z * fl;
      if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) { if (dz < 0) flake(p, 1); continue; }
      if (inside && (sx - lens.cx) ** 2 + (sy - lens.cy) ** 2 < lens.r * lens.r) continue;
      const k = 1 - p.z, a = base * k * 0.7;
      if (a < 0.01) continue;
      gx.globalAlpha = a;
      const r = 0.35 + k * 1.5, run = Math.hypot(sx - ox, sy - oy);
      if (run > 2) {
        // A streak, no longer than a short dash, fainter the longer it is.
        const f = Math.min(1, 60 / run);
        gx.globalAlpha = a * Math.min(1, 6 / Math.sqrt(run));
        gx.lineWidth = r * 1.2;
        gx.beginPath(); gx.moveTo(sx - (sx - ox) * f, sy - (sy - oy) * f); gx.lineTo(sx, sy); gx.stroke();
      } else {
        gx.beginPath(); gx.arc(sx, sy, r, 0, TAU); gx.fill();
      }
    }
    gx.globalAlpha = 1;
  }

  // Currents: glowing plankton riding the surface flow.
  const PLANKTON = [], flow = [0, 0];
  function seedCurrents() { for (let i = 0; i < 460; i++) PLANKTON.push(drift({}, true)); }
  function drift(p, early) {
    for (let k = 0; k < 40; k++) {
      p.lat = Math.asin(Math.random() * 2 - 1) / RAD; p.lon = Math.random() * 360 - 180;
      if (Math.abs(p.lat) < 72 && planet.coastAt(p.lat, p.lon) < -0.8) break;
    }
    p.life = 2 + Math.random() * 3; p.age = early ? Math.random() * p.life : 0;
    return p;
  }
  function drawCurrents(a, dt) {
    if (a < 0.01 || !PLANKTON.length) return;
    const size = Math.max(0.9, globe.radius / 200);
    gx.fillStyle = LCOL.currents;
    for (const p of PLANKTON) {
      if (!reduce) {
        planet.current(p.lat, p.lon, flow);
        p.lat += flow[1] * 6 * dt;
        p.lon = Globe.wrap(p.lon + flow[0] * 6 * dt / Math.max(0.25, Math.cos(p.lat * RAD)));
        p.age += dt;
        if (p.age > p.life || Math.abs(p.lat) > 76 || planet.coastAt(p.lat, p.lon) > -0.2 || Math.hypot(flow[0], flow[1]) < 0.03) drift(p);
      }
      const q = globe.project(p.lat, p.lon);
      if (q.z < 0.05) continue;
      gx.globalAlpha = a * Math.sin(Math.PI * Math.min(1, p.age / p.life)) * Math.min(1, q.z * 3);
      gx.beginPath(); gx.arc(q.x, q.y, size, 0, TAU); gx.fill();
    }
    gx.globalAlpha = 1;
  }

  // ---------- Tectonic plates ----------
  // The plates as they are today (lib/plates.js): their edges, coloured by what
  // they do, with teeth on the plate that rides on top where one sinks under
  // the other; arrows for which way and how fast the plates drift; their names.
  const PCOL = { s: '#ff5c8a', u: '#ffb35c', c: '#ffb35c', t: '#efe3c8' };
  const ARROW = '#ffe2c8';
  // How each kind of edge is drawn: rifts like ridges, pushing at sea like on land.
  const edgeStyle = (k) => (k === 'r' ? 's' : k === 'o' ? 'c' : k);
  const PB = Plates.BOUNDARIES, NPT = Plates.LATLON.length / 2;
  // Every edge point as a unit vector, and where it is on screen this frame: x, y and how much it faces us.
  const PW = new Float32Array(NPT * 3), PS = new Float32Array(NPT * 3);
  for (let j = 0; j < NPT; j++) {
    const la = Plates.LATLON[2 * j] * RAD, lo = Plates.LATLON[2 * j + 1] * RAD;
    PW[3 * j] = Math.cos(la) * Math.sin(lo); PW[3 * j + 1] = Math.sin(la); PW[3 * j + 2] = Math.cos(la) * Math.cos(lo);
  }
  function projectPlates() {
    const M = globe.matrix(), r = globe.radius;
    for (let j = 0; j < PS.length; j += 3) {
      const x = PW[j], y = PW[j + 1], z = PW[j + 2];
      PS[j] = globe.cx + (M[0] * x + M[1] * y + M[2] * z) * r;
      PS[j + 1] = globe.cy - (M[3] * x + M[4] * y + M[5] * z) * r;
      PS[j + 2] = M[6] * x + M[7] * y + M[8] * z;
    }
  }
  // The edge from step i0 to i1 of boundary b (only its steps of one kind, if
  // given), as a path, broken where it goes round the back. Points closer than
  // a pixel and a half to the last one drawn are skipped.
  function edgePath(path, b, i0, i1, kind) {
    let open = false, skipped = false, lx = 0, ly = 0, px = 0, py = 0;
    const close = () => { if (skipped) path.lineTo(px, py); open = skipped = false; };
    for (let i = i0; i <= i1; i++) {
      const j = 3 * (b.at + i);
      if ((kind && edgeStyle(b.kinds[i]) !== kind) || PS[j + 2] < 0 || PS[j + 5] < 0) { close(); continue; }
      if (!open) { path.moveTo(lx = PS[j], ly = PS[j + 1]); open = true; }
      px = PS[j + 3]; py = PS[j + 4];
      skipped = (px - lx) ** 2 + (py - ly) ** 2 < 2.25;
      if (!skipped) path.lineTo(lx = px, ly = py);
    }
    close();
  }
  function drawPlates(a, names) {
    projectPlates();
    gx.lineCap = gx.lineJoin = 'round';
    for (const k of ['t', 'c', 'u', 's']) {
      const path = new Path2D();
      for (const b of PB) edgePath(path, b, 0, b.n - 2, k);
      gx.strokeStyle = PCOL[k];
      if (k === 't') {
        // Sliding past: a thin dashed line.
        gx.globalAlpha = a * 0.75; gx.lineWidth = 1.1; gx.setLineDash([3, 3]);
        gx.stroke(path);
        gx.setLineDash([]);
        continue;
      }
      // A soft glow and a bright core. Ridges glow wider from the planet itself.
      for (const [w, al] of [[4, 0.2], [k === 'c' ? 2.2 : 1.3, 0.9]]) {
        gx.globalAlpha = a * al; gx.lineWidth = w;
        gx.stroke(path);
      }
    }
    // Teeth along a line where one plate sinks, on the plate that rides on top.
    const teeth = new Path2D(), gap = 14, th = narrow ? 3.5 : 4.5;
    for (const b of PB) {
      if (!b.top) continue;
      const side = b.top === 'L' ? 1 : -1;
      let since = gap / 2;   // distance along the line since the last tooth
      for (let i = 0; i < b.n - 1; i++) {
        const j = 3 * (b.at + i);
        if (b.kinds[i] !== 'u' || PS[j + 2] < 0.05 || PS[j + 5] < 0.05) { since = gap / 2; continue; }
        const x0 = PS[j], y0 = PS[j + 1], dx = PS[j + 3] - x0, dy = PS[j + 4] - y0, len = Math.hypot(dx, dy);
        if (len < 1e-6) continue;
        // Along the line, and across it to its left as we see it (screen y points down).
        const ux = dx / len, uy = dy / len, nx = uy * side, ny = -ux * side;
        let t = gap - since;
        for (; t <= len; t += gap) {
          const px = x0 + ux * t, py = y0 + uy * t;
          teeth.moveTo(px - ux * th * 0.65, py - uy * th * 0.65);
          teeth.lineTo(px + nx * th, py + ny * th);
          teeth.lineTo(px + ux * th * 0.65, py + uy * th * 0.65);
          teeth.closePath();
        }
        since = len - (t - gap);
      }
    }
    gx.fillStyle = PCOL.u; gx.globalAlpha = a * 0.9;
    gx.fill(teeth);
    // The stretch of edge under the pointer.
    const e = state.pick && state.pick.edge;
    if (e) {
      const path = new Path2D();
      edgePath(path, e.b, e.i0, e.i1);
      gx.strokeStyle = '#ffffff';
      for (const [w, al] of [[9, 0.12], [2.2, 0.9]]) { gx.globalAlpha = a * al; gx.lineWidth = w; gx.stroke(path); }
    }
    gx.globalAlpha = 1;
    // The names of the big plates, across them, in capitals like on a map.
    gx.font = `500 ${narrow ? 9.5 : 10.5}px ${MONO}`;
    for (const code of Plates.NAMED) {
      const p = Plates.plate(code), q = globe.project(p.label[0], p.label[1]);
      if (q.z < 0.35) continue;
      const text = p.name.toUpperCase();
      names.push({ key: 'p' + code, x: q.x, y: q.y, w: gx.measureText(text).width, h: 13, center: true, plate: true, text, a: a * 0.8 * Math.min(1, (q.z - 0.35) * 4), rank: q.z - 2 });
    }
  }

  // Drift arrows on an even spread of places (a Fibonacci sphere), each with its
  // plate's velocity there; more of them on a bigger globe.
  const arrowSets = {};
  function arrowSet(n) {
    if (arrowSets[n] || !plateMap) return arrowSets[n] || null;
    const out = [], turn = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const lat = Math.asin(1 - (2 * i + 1) / n) / RAD, lon = Globe.wrap(i * turn / RAD);
      const p = plateMap.at(lat, lon), k = 2.5 / Math.max(0.25, Math.cos(lat * RAD));
      // None right at an edge, where the arrow would cross into the next plate.
      if (!p || [[2.5, 0], [-2.5, 0], [0, k], [0, -k]].some(([dl, dn]) => plateMap.at(lat + dl, lon + dn) !== p)) continue;
      const [e, nn] = Plates.drift(p, lat, lon), la = lat * RAD, lo = lon * RAD, sa = Math.sin(la), ca = Math.cos(la);
      // Place and velocity (mm a year) in the globe's frame: x towards 90° E, y north, z towards 0° E.
      out.push({
        x: ca * Math.sin(lo), y: sa, z: ca * Math.cos(lo),
        vx: Math.cos(lo) * e - sa * Math.sin(lo) * nn, vy: ca * nn, vz: -Math.sin(lo) * e - sa * Math.cos(lo) * nn,
      });
    }
    return (arrowSets[n] = out);
  }
  function drawArrows(a) {
    const set = arrowSet(globe.radius < 220 ? 150 : 300);
    if (!set) return;
    const M = globe.matrix(), r = globe.radius, k = r / 500, max = r * 0.18, boxes = placeLabels.boxes;
    const shafts = new Path2D(), heads = new Path2D();
    for (const p of set) {
      if (M[6] * p.x + M[7] * p.y + M[8] * p.z < 0.25) continue;
      const sx = globe.cx + (M[0] * p.x + M[1] * p.y + M[2] * p.z) * r, sy = globe.cy - (M[3] * p.x + M[4] * p.y + M[5] * p.z) * r;
      let dx = (M[0] * p.vx + M[1] * p.vy + M[2] * p.vz) * k, dy = -(M[3] * p.vx + M[4] * p.vy + M[5] * p.vz) * k, len = Math.hypot(dx, dy);
      if (len < 2) continue;
      if (len > max) { dx *= max / len; dy *= max / len; len = max; }
      const x0 = sx - dx / 2, y0 = sy - dy / 2, x1 = sx + dx / 2, y1 = sy + dy / 2;
      // Never across a name or a light.
      const bx0 = Math.min(x0, x1) - 3, bx1 = Math.max(x0, x1) + 3, by0 = Math.min(y0, y1) - 3, by1 = Math.max(y0, y1) + 3;
      if (boxes.some((b) => bx1 > b[0] && bx0 < b[2] && by1 > b[1] && by0 < b[3])) continue;
      const ux = dx / len, uy = dy / len, h = Math.min(4.5, 1.5 + len * 0.3);
      shafts.moveTo(x0, y0); shafts.lineTo(x1 - ux * h * 0.6, y1 - uy * h * 0.6);
      heads.moveTo(x1, y1);
      heads.lineTo(x1 - ux * h - uy * h * 0.6, y1 - uy * h + ux * h * 0.6);
      heads.lineTo(x1 - ux * h + uy * h * 0.6, y1 - uy * h - ux * h * 0.6);
      heads.closePath();
    }
    gx.strokeStyle = gx.fillStyle = ARROW;
    gx.lineCap = 'round';
    gx.globalAlpha = a * 0.85; gx.lineWidth = 1.4;
    gx.stroke(shafts);
    gx.fill(heads);
    gx.globalAlpha = 1;
  }

  // What the pointer is on while the plates are lit up: an edge, within a few
  // pixels, or else a plate.
  function plateAt(x, y, touch) {
    if (x == null || !state.layers.has('plates') || state.show.plates < 0.5 || !plateMap || state.at !== 0 || state.tr) return null;
    const ll = globe.pick(x, y);
    if (!ll) return null;
    const tol = touch ? 14 : 7;
    let best = null, bd = tol * tol;
    for (const b of PB) {
      for (let i = 0; i < b.n - 1; i++) {
        const j = 3 * (b.at + i);
        if (PS[j + 2] < 0.05 || PS[j + 5] < 0.05) continue;
        const ax = PS[j], ay = PS[j + 1], ex = PS[j + 3] - ax, ey = PS[j + 4] - ay, l2 = ex * ex + ey * ey;
        const t = l2 ? clamp(((x - ax) * ex + (y - ay) * ey) / l2, 0, 1) : 0;
        const d = (ax + ex * t - x) ** 2 + (ay + ey * t - y) ** 2;
        if (d < bd) { bd = d; best = { b, i }; }
      }
    }
    if (best) {
      // The whole stretch of that edge that does the same thing.
      const { b, i } = best, k = b.kinds[i];
      let i0 = i, i1 = i;
      while (i0 > 0 && b.kinds[i0 - 1] === k) i0--;
      while (i1 < b.n - 2 && b.kinds[i1 + 1] === k) i1++;
      return { edge: { b, i, i0, i1 }, lat: ll.lat, lon: ll.lon };
    }
    const plate = plateMap.at(ll.lat, ll.lon);
    return plate ? { plate, lat: ll.lat, lon: ll.lon } : null;
  }
  const COMPASS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  // "7 cm", or "4 mm" when slower than a centimetre.
  const rate = (mm) => (mm >= 9.5 ? Math.round(mm / 10) + ' cm' : Math.max(1, Math.round(mm)) + ' mm');
  // What happens at each kind of edge. Where one plate sinks, {a} is the one that goes under.
  const EDGE = {
    s: ['The {a} and the {b} pull apart', 'About {r} a year. Hot rock wells up and makes new sea floor.'],
    r: ['The {a} and the {b} pull apart', 'About {r} a year. A continent is slowly splitting.'],
    u: ['The {a} sinks under the {b}', 'About {r} a year. Deep trenches, earthquakes and volcanoes.'],
    c: ['The {a} and the {b} push together', 'About {r} a year. The crust crumples into mountains.'],
    o: ['The {a} and the {b} push together', 'About {r} a year. The sea floor buckles, with earthquakes.'],
    t: ['The {a} and the {b} slide past each other', 'About {r} a year. Earthquakes along the fault.'],
  };
  // The title and line under it for what the pointer is on.
  function plateTip(h) {
    if (h.plate) {
      const [e, n] = Plates.drift(h.plate, h.lat, h.lon), d = COMPASS[Math.round((Math.atan2(e, n) / RAD + 360) / 45) % 8];
      return [h.plate.name, `Drifts ${d}, about ${rate(Math.hypot(e, n))} a year`];
    }
    const { b, i } = h.edge, k = b.kinds[i];
    const v1 = Plates.drift(b.left, h.lat, h.lon), v2 = Plates.drift(b.right, h.lat, h.lon);
    const L = Plates.plate(b.left).name, R = Plates.plate(b.right).name;
    const o = k === 'u' && b.top === 'L' ? { a: R, b: L } : { a: L, b: R };
    o.r = rate(Math.hypot(v1[0] - v2[0], v1[1] - v2[1]));
    return EDGE[k].map((t) => t.replace(/\{(\w)\}/g, (m, x) => o[x]));
  }

  // Beacons: where each system's oldest evidence was found. Their names go in names.
  const placeLabels = Globe.labels();
  function drawBeacons(v, now, fade, names) {
    if (fade <= 0.01) return;
    gx.font = `600 ${narrow ? 11 : 12.5}px ${SANS}`;
    for (const st of STOPS) {
      if (!st.s) continue;
      const p = globe.project(st.s.lat, st.s.lon);
      if (p.z < 0.03) continue;
      const here = appear(st.s.t), hot = state.hover === st.i || v.inner === st.i;
      const a = fade * Math.min(1, p.z * 4) * (here > 0 ? 0.5 + 0.5 * here : 0.45);
      const r = (narrow ? 3.8 : 4.5) * (hot ? 1.35 : 1);
      gx.globalAlpha = a;
      gx.fillStyle = gx.strokeStyle = st.color;
      if (here > 0) {
        if (!reduce) {
          const ph = (now / 1800 + st.i * 0.29) % 1;
          gx.globalAlpha = a * (1 - ph) * 0.9; gx.lineWidth = 1.5;
          gx.beginPath(); gx.arc(p.x, p.y, r + 2 + ph * 15, 0, TAU); gx.stroke();
          gx.globalAlpha = a;
        }
        gx.beginPath(); gx.arc(p.x, p.y, r, 0, TAU); gx.fill();
        gx.fillStyle = '#ffffff';
        gx.beginPath(); gx.arc(p.x, p.y, r * 0.45, 0, TAU); gx.fill();
      } else {
        // Not yet: a dashed ring where it will be.
        gx.setLineDash([2, 3]); gx.lineWidth = 1.2;
        gx.beginPath(); gx.arc(p.x, p.y, r + 1, 0, TAU); gx.stroke();
        gx.setLineDash([]);
      }
      if (p.z > 0.3) names.push({ key: st.i, x: p.x, y: p.y, w: gx.measureText(st.name).width, h: 15, pad: r + 7, hot, a: a * (hot ? 1 : 0.85), text: st.name, rank: (hot ? 2 : 0) + p.z });
    }
    gx.globalAlpha = 1;
  }
  // Names are placed after every light is drawn, the most important first
  // (the lights', nearest first, then the plates'), so none covers another.
  function placeNames(names) {
    names.sort((p, q) => q.rank - p.rank);
    placeLabels(names, { bounds: [4, W - gauge.offsetWidth - 10] });
  }
  function writeNames(names) {
    gx.textBaseline = 'middle';
    gx.textAlign = 'left';
    const lightFont = `600 ${narrow ? 11 : 12.5}px ${SANS}`, plateFont = `500 ${narrow ? 9.5 : 10.5}px ${MONO}`;
    for (const n of names) {
      if (!n.side) continue;
      gx.font = n.plate ? plateFont : lightFont;
      gx.globalAlpha = n.a;
      gx.fillStyle = n.plate ? '#ffd9c2' : n.hot ? '#ffffff' : '#d9f6f4';
      gx.fillText(n.text, n.lx, n.y);
    }
    gx.globalAlpha = 1;
  }
  function ring(x, y, r, color, a) {
    if (a < 0.01 || r < 0.5) return;
    gx.strokeStyle = color;
    for (const [w, al] of [[18, 0.06], [8, 0.14], [2, 0.75]]) {
      gx.globalAlpha = a * al; gx.lineWidth = w;
      gx.beginPath(); gx.arc(x, y, r, 0, TAU); gx.stroke();
    }
    gx.globalAlpha = a * 0.18; gx.lineWidth = 1;
    gx.beginPath(); gx.arc(x, y, r + 9, 0, TAU); gx.stroke();
    gx.globalAlpha = 1;
  }
  // The rim of the lens in the colour of the level inside, and the porthole as it opens.
  function drawRings(v) {
    const L = lens;
    if (v.outer > 0) ring(L.cx, L.cy, L.r, STOPS[v.outer].color, v.inner < 0 ? 1 : 1 - v.u);
    if (v.inner > 0) {
      ring(L.cx, L.cy, L.r, STOPS[v.inner].color, v.outer === 0 ? smooth(0.5, 1, v.u) : v.u);
      if (v.R < L.r - 1) ring(v.X, v.Y, v.R, STOPS[v.inner].color, Math.sin(Math.PI * v.u));
    }
  }
  function drawGlow(v, dt, now) {
    gx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gx.clearRect(0, 0, W, H);
    drawSnow(v, dt);
    if (v.outer === 0 && planet) {
      // The layers and lights fade as a dive begins.
      const fade = 1 - smooth(0, 0.35, v.g), pa = state.show.plates * fade, names = [];
      drawCurrents(state.show.currents * fade, dt);
      if (pa > 0.01) drawPlates(pa, names);
      drawBeacons(v, now, fade, names);
      placeNames(names);
      if (pa > 0.01) drawArrows(pa);
      writeNames(names);
    }
    drawRings(v);
  }

  // ---------- The panel ----------
  function renderPanel(i) {
    const st = STOPS[i];
    panel.style.setProperty('--kc', st.color);
    if (!st.s) {
      const chips = C.LAYERS.map((l) => `<button class="chip" data-layer="${l.id}" aria-pressed="${state.layers.has(l.id)}" style="--c:${LCOL[l.id]}" title="${esc(l.text)}"><i></i>${esc(l.name)}</button>`).join('');
      panel.innerHTML = `
        <div class="depth">Surface <span>The whole planet, 12,742 km across</span></div>
        <h1>Dive into a <em>living planet</em></h1>
        <p>Small simulated worlds where life organises itself. Scroll down to sink from a whole ecosystem to the molecules life began with. Every stop is a live simulation.</p>
        <div class="chips" role="group" aria-label="Light up on the planet"><span class="lab">Light up</span>${chips}</div>
        ${plateKey()}
        <div class="acts"><button class="main" data-go="1">Start the dive ↓</button><a href="${ROOT}world/index.html#story">Watch the story</a></div>`;
      return;
    }
    const s = st.s, k = st.kind, done = C.labsDone(), up = STOPS[i - 1], down = STOPS[i + 1];
    const links = C.links(s).map((l, j) => {
      const label = l.kind === 'lab' ? 'Guided lab' + (done.includes(l.lab.id) ? ' ✓' : '') : l.label;
      return `<a class="${j ? '' : 'main'}" href="${esc(ROOT + l.path)}" title="${esc(l.label)}">${esc(label)}</a>`;
    }).join('');
    panel.innerHTML = `
      <div class="depth">Level ${k.level} · ${esc(k.name)} <span>Stop ${i} of ${N - 1}</span></div>
      <p class="into">${esc(st.into)}</p>
      <h2>${esc(s.title)}</h2>
      <div class="facts"><span><b>When</b> ${esc(s.when)}</span><span><b>Where</b> ${esc(s.place)}</span><span><b>Earth’s day</b> ${s.t ? C.clock(s.t).slice(0, 5) : '24:00'}</span></div>
      <p>${esc(s.text)}</p>
      <p class="ev">${esc(s.evidence)}</p>
      <div class="acts">${links}</div>
      <div class="steps"><button data-go="${i - 1}" aria-label="Up to ${esc(up.name)}">↑ ${esc(up.name)}</button>${down ? `<button data-go="${i + 1}" aria-label="Deeper: ${esc(down.name)}">↓ ${esc(down.name)}</button>` : ''}</div>`;
  }
  // The key to the plates layer, shown while it is lit up.
  function plateKey() {
    const line = (style) => `<svg viewBox="0 0 18 8" aria-hidden="true"><path d="M1 4h16" fill="none" stroke-linecap="round" ${style}/></svg>`;
    return `<div class="key" id="plate-key"${state.layers.has('plates') ? '' : ' hidden'}>
        <span class="key-title">Plates today <small>PB2002 model, Peter Bird 2003</small></span>
        <span class="key-item">${line(`stroke="${PCOL.s}" stroke-width="2"`)}Pull apart</span>
        <span class="key-item"><svg viewBox="0 0 18 8" aria-hidden="true"><path d="M1 7h16" stroke="${PCOL.u}" stroke-width="1.4"/><path d="M3 7l2-4.5 2 4.5zM11 7l2-4.5 2 4.5z" fill="${PCOL.u}"/></svg>One sinks under</span>
        <span class="key-item">${line(`stroke="${PCOL.c}" stroke-width="2.6"`)}Push together</span>
        <span class="key-item">${line(`stroke="${PCOL.t}" stroke-width="1.4" stroke-dasharray="3 3"`)}Slide past</span>
        <span class="key-item"><svg viewBox="0 0 18 8" aria-hidden="true"><path d="M1 4h11" stroke="${ARROW}" stroke-width="1.4" stroke-linecap="round"/><path d="M17 4l-5.5-3.2v6.4z" fill="${ARROW}"/></svg>Drift: longer is faster</span>
        <span class="key-hint">Point at a plate or an edge to see what it does.</span>
      </div>`;
  }
  let panelTimer = 0;
  // The panel can change height after it is drawn (fonts, translation), so keep the lens clear of it.
  if (window.ResizeObserver) new ResizeObserver(() => aimLens()).observe(panel);
  function showPanel(i) {
    state.shown = i;
    clearTimeout(panelTimer);
    const done = () => {
      renderPanel(state.shown);
      panel.classList.remove('fading');
      aimLens();
    };
    if (reduce || !panel.innerHTML.trim()) { done(); return; }
    panel.classList.add('fading');
    panelTimer = setTimeout(done, 170);
  }
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) { go(+b.dataset.go); return; }
    const c = e.target.closest('[data-layer]');
    if (c) {
      const id = c.dataset.layer, on = !state.layers.has(id);
      on ? state.layers.add(id) : state.layers.delete(id);
      c.setAttribute('aria-pressed', String(on));
      if (id === 'plates') {
        const key = $('#plate-key');
        if (key) key.hidden = !on;
        if (!on) unpick();
      }
    }
  });
  function easeShow(dt) {
    const k = reduce ? 1 : 1 - Math.exp(-dt * 5);
    for (const id in state.show) state.show[id] += ((state.layers.has(id) ? 1 : 0) - state.show[id]) * k;
  }

  // ---------- The depth gauge ----------
  const gauge = $('#gauge');
  const pos = (i) => i / (N - 1) * 100;
  gauge.innerHTML = `<div class="rail" style="background:linear-gradient(${STOPS.map((st, i) => `${st.color} ${pos(i)}%`).join(', ')})"></div>` +
    STOPS.map((st) => `<button class="lvl" data-i="${st.i}" style="top:${pos(st.i)}%;--c:${st.color}" aria-label="${esc(st.s ? st.s.title : 'The surface')}"><span>${esc(st.name)}<small>${esc(st.s ? (st.s.t ? ago(st.s.t) + ' years ago' : 'today') : 'the whole planet')}</small></span><i></i></button>`).join('') +
    '<div class="here" aria-hidden="true"><b></b></div>';
  const here = gauge.querySelector('.here'), hereLabel = here.querySelector('b');
  gauge.addEventListener('click', (e) => {
    const b = e.target.closest('.lvl');
    if (b) { go(+b.dataset.i); return; }
    if (e.target.closest('.rail')) {
      const r = gauge.getBoundingClientRect();
      go(Math.round(clamp((e.clientY - r.top) / r.height, 0, 1) * (N - 1)));
    }
  });
  let lastHere = null, lastCur = -1;
  function syncGauge() {
    const tr = state.tr, p = tr ? tr.from + (tr.to - tr.from) * tr.f : state.at;
    if (p !== lastHere) { lastHere = p; here.style.top = pos(p).toFixed(3) + '%'; }
    if (state.shown !== lastCur) {
      lastCur = state.shown;
      for (const b of gauge.querySelectorAll('.lvl')) b.setAttribute('aria-current', String(+b.dataset.i === state.shown));
      const st = STOPS[state.shown];
      hereLabel.textContent = st.s ? ago(st.s.t) : 'surface';
    }
  }

  // ---------- The age of the planet ----------
  const xOf = (t) => 1 - Math.min(T0, t) / T0;
  strip.innerHTML = C.EONS.map((e) => { const a = xOf(e.t0), b = xOf(e.t1); return `<div class="eon" style="left:${a * 100}%;width:${(b - a) * 100}%;--c:${e.color}"><span>${esc(e.name)}</span></div>`; }).join('') +
    STOPS.filter((st) => st.s).map((st) => `<i class="sys" style="left:${xOf(st.s.t) * 100}%;--c:${st.color}"></i>`).join('') +
    '<div class="knob"></div>';
  strip.tabIndex = 0;
  strip.setAttribute('role', 'slider');
  strip.setAttribute('aria-label', 'Age of the planet');
  strip.setAttribute('aria-valuemin', '0');
  strip.setAttribute('aria-valuemax', String(Math.round(T0 / 1e6)));
  const knob = strip.querySelector('.knob');
  let stripDrag = null, lastAge = null;
  // The time under the pointer, caught by a system or an event close to it.
  function stripPick(e, snap) {
    const r = strip.getBoundingClientRect(), x = clamp((e.clientX - r.left) / r.width, 0, 1);
    let best = null;
    for (const it of C.history()) { const px = Math.abs(xOf(it.t) - x) * r.width; if (px < 7 && (!best || px < best.px)) best = { it, px }; }
    const item = best && best.it, t = item && snap ? item.t : T0 * (1 - x);
    return { t, item, x: r.left + xOf(item ? item.t : t) * r.width, y: r.top - 4 };
  }
  function stripTip(p) {
    if (p.item) tip(p.x, p.y, p.item.title, cap(C.when(p.item.t)));
    else tip(p.x, p.y, cap(C.when(p.t)), C.periodAt(p.t).name);
  }
  strip.addEventListener('pointerdown', (e) => {
    stripDrag = e.pointerId;
    try { strip.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
    const p = stripPick(e, true);
    state.age = null; state.t = p.t;
    stripTip(p);
  });
  strip.addEventListener('pointermove', (e) => {
    const p = stripPick(e, stripDrag != null);
    if (stripDrag != null) state.t = p.t;
    if (stripDrag != null || e.pointerType === 'mouse') stripTip(p);
  });
  const stripEnd = () => { stripDrag = null; tip(null); };
  strip.addEventListener('pointerup', stripEnd);
  strip.addEventListener('pointercancel', stripEnd);
  strip.addEventListener('pointerleave', () => { if (stripDrag == null) tip(null); });
  strip.addEventListener('keydown', (e) => {
    const step = T0 / 96;   // a quarter of an hour on Earth's day
    const keys = { ArrowLeft: step, ArrowDown: step, ArrowRight: -step, ArrowUp: -step, Home: T0, End: -T0 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    state.age = null;
    state.t = clamp(state.t + keys[e.key], 0, T0);
  });
  $('#today').addEventListener('click', () => ageTo(0));
  function ageTo(t) { state.age = reduce ? null : { from: state.t, to: t, k: 0 }; if (reduce) state.t = t; }
  function stepAge(dt) {
    const a = state.age;
    if (!a || state.tr) return;
    a.k = Math.min(1, a.k + dt / 1.4);
    const e = a.k < 0.5 ? 4 * a.k ** 3 : 1 - (-2 * a.k + 2) ** 3 / 2;
    state.t = a.from + (a.to - a.from) * e;
    if (a.k >= 1) state.age = null;
  }
  function syncStrip() {
    if (state.t === lastAge) return;
    lastAge = state.t;
    knob.style.left = (xOf(state.t) * 100).toFixed(3) + '%';
    const text = state.t < 1e4 ? 'Today' : cap(C.when(state.t)) + ' · ' + C.periodAt(state.t).name;
    $('#age').textContent = text;
    $('#today').hidden = state.t < 1e4;
    strip.setAttribute('aria-valuenow', String(Math.round((T0 - state.t) / 1e6)));
    strip.setAttribute('aria-valuetext', text);
  }

  // ---------- Pointer, wheel and keys ----------
  // The title is in a span of its own, so a translation matches it alone.
  let tipNow = '';
  function tip(x, y, title, sub) {
    const el = $('#tip');
    if (x == null) { if (tipNow) { el.hidden = true; tipNow = ''; } return; }
    const html = `<span>${esc(title)}</span>` + (sub ? `<small>${esc(sub)}</small>` : '');
    if (html !== tipNow) { el.innerHTML = html; tipNow = html; }
    el.hidden = false;
    const half = el.offsetWidth / 2 + 6;
    el.style.left = Math.round(clamp(x, half, W - half)) + 'px';
    el.style.top = Math.round(y) + 'px';
  }
  function beaconAt(x, y) {
    if (x == null || state.at !== 0 || state.tr || !planet) return null;
    let best = null, bd = 20 * 20;
    for (const st of STOPS) {
      if (!st.s) continue;
      const p = globe.project(st.s.lat, st.s.lon);
      if (p.z < 0.05) continue;
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bd) { bd = d; best = { st, p }; }
    }
    return best;
  }
  // A light under the mouse, or with the plates lit up, a plate or an edge.
  // The planet turns under a still mouse, so this runs every frame.
  let mouse = null, pointerType = 'mouse';
  function hover() {
    const x = mouse && mouse.x, y = mouse && mouse.y, b = beaconAt(x, y);
    state.hover = b ? b.st.i : null;
    hit.classList.toggle('over', !!b);
    state.pick = b ? null : plateAt(x, y);
    if (b) tip(b.p.x, b.p.y - 10, b.st.s.title, `${b.st.kind.name}, ${b.st.s.when}. Click to dive in.`);
    else if (state.pick) tip(x, y - 14, ...plateTip(state.pick));
    else tip(null);
  }
  globe.onhover = (x, y) => { mouse = x == null ? null : { x, y }; hover(); };
  // On a touch screen a tap shows what is there and keeps it beside that place as the planet turns.
  globe.ontap = (x, y) => {
    const b = beaconAt(x, y);
    if (b) { go(b.st.i); return; }
    if (pointerType === 'mouse') return;
    state.pick = plateAt(x, y, true);
    if (state.pick) { state.pick.pinned = true; trackPick(); } else tip(null);
  };
  function unpick() { state.pick = null; tip(null); }
  function trackPick() {
    if (mouse) { hover(); return; }
    const p = state.pick;
    if (!p || !p.pinned) return;
    const q = globe.project(p.lat, p.lon);
    if (q.z < 0.1 || !plateAt(q.x, q.y, true)) { unpick(); return; }
    tip(q.x, q.y - 14, ...plateTip(p));
  }

  // On the planet a drag turns it; anywhere else a swipe dives.
  let swipe = null;
  hit.addEventListener('pointerdown', (e) => {
    const r = hit.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const onGlobe = state.at === 0 && !state.tr && Math.hypot(x - globe.cx, y - globe.cy) < globe.radius;
    pointerType = e.pointerType;
    if (onGlobe) return;
    if (state.pick && state.pick.pinned) unpick();
    e.stopImmediatePropagation();
    if (e.pointerType === 'mouse') return;
    swipe = { id: e.pointerId, last: y };
    try { hit.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
  }, true);
  hit.addEventListener('pointermove', (e) => {
    if (!swipe || swipe.id !== e.pointerId) return;
    const y = e.clientY - hit.getBoundingClientRect().top, dy = swipe.last - y;
    swipe.last = y;
    if (dy) scrub(dy / (H * 0.55));
  });
  const endSwipe = (e) => { if (swipe && swipe.id === e.pointerId) { swipe = null; settle(); } };
  hit.addEventListener('pointerup', endSwipe);
  hit.addEventListener('pointercancel', endSwipe);

  const PER_STOP = 380;   // pixels of scrolling per stop
  let wheelTimer = 0, detent = 0, wheelSteps = false;
  addEventListener('wheel', (e) => {
    if (state.view !== 'dive') return;
    e.preventDefault();
    if (e.ctrlKey) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? H : 1);
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelSteps = false; settle(); }, 150);
    if (!dy || performance.now() < detent) return;
    if (reduce) {
      // One stop per turn of the wheel.
      if (!wheelSteps) { wheelSteps = true; go(heading() + Math.sign(dy)); }
      return;
    }
    scrub(dy / PER_STOP);
  }, { passive: false });

  addEventListener('keydown', (e) => {
    if (state.view !== 'dive' || e.altKey || e.ctrlKey || e.metaKey) return;
    const el = e.target, tag = el.tagName || '';
    if (el === strip || /^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    let to;
    switch (e.key) {
      case 'ArrowDown': case 'PageDown': to = heading() + 1; break;
      case 'ArrowUp': case 'PageUp': to = heading() - 1; break;
      case ' ': if (/^(BUTTON|A)$/.test(tag)) return; to = heading() + (e.shiftKey ? -1 : 1); break;
      case 'Home': to = 0; break;
      case 'End': to = N - 1; break;
      case 'Escape': to = heading() - 1; break;
      default: return;
    }
    // Before the planet's own keys, so up and down dive instead of tilting it.
    e.preventDefault();
    e.stopPropagation();
    go(to);
  }, true);

  // ---------- The list ----------
  function buildLog() {
    const done = C.labsDone(), labs = window.LabCatalogue || [];
    const levels = STOPS.filter((st) => st.s).map((st) => {
      const s = st.s, ls = C.links(s);
      const more = ls.slice(1).map((l) => `<a href="${esc(ROOT + l.path)}">${esc(l.label)}${l.lab && done.includes(l.lab.id) ? ' ✓' : ''}</a>`).join('') +
        `<button type="button" data-dive="${st.i}">Dive here</button>`;
      return `<li style="--c:${st.color}">
        <div class="head"><a href="${esc(ROOT + ls[0].path)}">${esc(s.title)}</a><span>Level ${st.kind.level} · ${esc(st.kind.short)} · ${esc(cap(ago(s.t)))}${s.t ? ' years ago' : ''} · ${esc(s.place)}</span></div>
        <p>${esc(s.text)}</p>
        <div class="more">${more}</div>
      </li>`;
    }).join('');
    const chron = C.history().map((it) => `<li><time>${esc(cap(ago(it.t)))}</time><div><b>${esc(it.title)}</b> <span>${esc(it.text)}</span></div></li>`).join('');
    $('#log').innerHTML = `<div class="log-inner">
      <header><h1>Every level of life</h1><p class="lede">Small simulated worlds where living systems organise themselves from local rules. Here they are as a plain list, from a whole ecosystem down to the chemistry life began with.</p>
        <ul class="principles"><li>no global controller</li><li>only local rules</li><li>grounded in biology</li><li>compare, don't assume</li></ul></header>
      <section><h2>Ways in</h2><div class="ways-list">
        <a href="${ROOT}world/index.html#story"><b>Watch the story</b><span>A guided tour of one world, chapter by chapter.</span></a>
        <a href="${ROOT}labs/index.html"><b>Take a mechanism apart</b><span>Guided labs: change one thing and follow the effect. ${done.length} of ${labs.length} done.</span></a>
        <a href="${ROOT}world/index.html"><b>Explore freely</b><span>The World Viewer: every chapter on one stage.</span></a>
      </div></section>
      <section><h2>The levels, from the top down</h2><ol class="levels">${levels}</ol></section>
      <section><h2>In order of time <small>years ago</small></h2><ol class="chron">${chron}</ol></section>
      <p class="foot">Places are where the oldest evidence was found, or a living example. Continents on the planet are today's, so places can be found.</p>
      <p class="foot">Tectonic plates: the <a href="https://doi.org/10.1029/2001GC000252">PB2002 model</a> by Peter Bird (2003), in the version prepared by <a href="https://github.com/fraxen/tectonicplates">Hugo Ahlenius</a> under the Open Data Commons Attribution License. Drift is measured against the planet as a whole, as GPS sees it.</p>
    </div>`;
  }

  // ---------- Views ----------
  const STORE = 'learning-systems.home-view';
  function syncHash() {
    const h = state.view === 'log' ? '#list' : state.at ? '#' + STOPS[state.at].id : '';
    if (location.hash !== h) history.replaceState(null, '', h || location.pathname + location.search);
  }
  // quiet: opened from a link or a remembered choice, so nothing new to remember.
  function setView(v, quiet) {
    state.view = v;
    const log = v === 'log';
    $('#dive').hidden = log; $('#log').hidden = !log;
    $('#tab-dive').setAttribute('aria-selected', String(!log));
    $('#tab-log').setAttribute('aria-selected', String(log));
    document.body.classList.toggle('listing', log);
    if (log) {
      if (state.tr) { if (state.tr.f >= 0.5) arrive(state.tr.to); else cancel(); }
      for (const sl of slots) if (sl.stop >= 0) unmount(sl);
      need = '';
      tip(null);
    }
    if (!quiet) { try { localStorage.setItem(STORE, v); } catch (e) { /* not kept */ } }
    syncHash();
    if (!log) requestAnimationFrame(resize);
  }
  $('#tab-dive').addEventListener('click', () => setView('dive'));
  $('#log').addEventListener('click', (e) => {
    const b = e.target.closest('[data-dive]');
    if (!b) return;
    jump(+b.dataset.dive);
    setView('dive');
    scrollTo(0, 0);
  });
  $('#tab-log').addEventListener('click', () => setView('log'));
  // Straight to a stop, with no dive on the way.
  function jump(i) {
    if (state.tr) cancel();
    arrive(i);
    state.dived = true;
  }
  // A link to #list or to a stop, opened while the page is already open.
  addEventListener('hashchange', () => {
    if (location.hash === '#list') { setView('log', true); return; }
    const i = STOPS.findIndex((st) => st.i > 0 && '#' + st.id === location.hash);
    if (i < 0) return;
    setView('dive', true);
    jump(i);
  });

  // ---------- Frame ----------
  let last = performance.now(), slow = 0, lastDeep = null, lastCue = null;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden || state.view !== 'dive') return;
    // Keep the frame rate up on slower machines by painting the planet at a lower resolution.
    slow = dt > 0.024 ? slow + 1 : Math.max(0, slow - 1);
    if (gl && slow > 50 && glScale > 0.5) { glScale *= 0.75; sizeGL(); slow = 0; }
    stepMove(dt);
    stepAge(dt);
    easeShow(dt);
    easeLens(dt);
    const v = view();
    if (v.outer === 0) aimGlobe(v, dt);
    trackPick();
    porthole(v);
    const shown = state.tr ? (state.tr.f >= 0.5 ? state.tr.to : state.tr.from) : state.at;
    if (shown !== state.shown) showPanel(shown);
    drawGlobe(v, now / 1000);
    placeSims(v, now);
    drawGlow(v, dt, now);
    syncGauge();
    syncStrip();
    const deep = state.at > 0 || !!state.tr;
    if (deep !== lastDeep) { lastDeep = deep; document.body.classList.toggle('deep', deep); }
    const cued = !state.dived && !deep;
    if (cued !== lastCue) { lastCue = cued; cue.hidden = !cued; }
  }

  // ---------- Start ----------
  const labs = window.LabCatalogue || [];
  $('#labs-done').textContent = labs.length ? C.labsDone().length + '/' + labs.length : '';
  buildLog();
  const first = STOPS.findIndex((st) => '#' + st.id === location.hash);
  if (first > 0) { state.at = first; state.t = timeOf(STOPS[first]); globe.hold = true; state.dived = true; }
  showPanel(state.at);
  addEventListener('resize', resize);
  resize();
  let startView = 'dive';
  try { startView = localStorage.getItem(STORE) || 'dive'; } catch (e) { /* not kept */ }
  if (location.hash === '#list') startView = 'log';
  else if (first > 0) startView = 'dive';
  if (startView === 'log') setView('log', true);
  requestAnimationFrame(frame);
  // For tests and the console.
  window.HomePage = { globe, state, go, STOPS, setView, slots };
})();
