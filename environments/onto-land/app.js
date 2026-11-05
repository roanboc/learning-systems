// Onto land: two Gaia coasts in the `shores` era (lib/gaia.js), side by side.
// Left, mats grow on the damp ground the tide uncovers; right, the twin with
// nothing to eat on land. Same seed, same coast.
//
// API for the guided lab (labs.js): window.ShoresPage.
(function () {
  'use strict';

  const $ = (s, el) => (el || document).querySelector(s);
  const css = () => getComputedStyle(document.documentElement);
  const tok = (n) => css().getPropertyValue(n).trim();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Seed 1: legs spread and hunters survive (README). On seed 3, the other
  // chapters' seed, the hunters die out.
  const SEED = 1;
  const pc = (v) => (v == null ? '–' : Math.round(v * 100) + '%');
  const n2 = (v) => (v == null ? '–' : v >= 10 ? v.toFixed(0) : v.toFixed(2));

  const WORLDS = [
    { key: 'mats', name: 'Shore mats', what: 'Mats grow on the damp ground the tide uncovers.', world: {}, colour: '--s1' },
    { key: 'sea', name: 'Kept in the sea', what: 'The twin: the same coast with nothing to eat on land.', world: { shoreMats: 0 }, colour: '--s2' },
  ];

  const METRICS = [
    { key: 'legs', label: 'Legs', note: 'Share of grazers whose limbs are legs.', fmt: pc, max: 1 },
    { key: 'shoreShare', label: 'On the shore', note: 'Share of grazers that spend over a tenth of their recent life on dry ground.', fmt: pc, max: 1 },
    { key: 'sturdy', label: 'Sturdy limbs', note: 'Average sturdiness gene: how much weight a limb can carry (0 to 1).', fmt: n2, max: 1 },
    { key: 'air', label: 'Air skin', note: 'Average air-skin gene: how slowly a creature dries out on land (0 to 1).', fmt: n2, max: 1 },
    { key: 'disparity', label: 'Disparity', note: 'Spread of body plans: the summed variance of the shape genes, each scaled to its range.', fmt: n2, max: null },
    { key: 'prey', label: 'Grazers', note: 'Number of grazers.', fmt: (v) => (v == null ? '–' : String(v)), max: null },
  ];

  // Grazer colours by limb type: none, fins, legs.
  const LIMB_FILL = ['#e8efe9', '#bfe1ec', '#e9c27a'];

  const state = { running: !reduce, speed: '2', metric: 'legs', worlds: [] };

  // ---------- Worlds ----------
  function build(def) {
    const g = window.Gaia.make({ era: 'shores', seed: SEED, world: def.world });
    const w = g.world;
    return {
      def, g, w, painter: new window.EarthDraw.MapPainter(g.chem),
      cam: { cx: w.p.size / 2, cy: w.H / 2, zoom: 1 }, selected: null, follow: false,
      el: null, plansAt: -1,
    };
  }

  function mount(W) {
    const el = $('#world-tpl').content.firstElementChild.cloneNode(true);
    W.el = el;
    $('.dot', el).style.background = tok(W.def.colour);
    $('.name', el).textContent = W.def.name;
    $('.what', el).textContent = W.def.what;
    const cv = $('canvas.map', el);
    cv.setAttribute('aria-label', 'Map of the coast: ' + W.def.name);
    $('.zin', el).onclick = () => zoom(W, 1.6);
    $('.zout', el).onclick = () => zoom(W, 1 / 1.6);
    $('.zfit', el).onclick = () => { W.follow = false; W.cam = { cx: W.w.p.size / 2, cy: W.w.H / 2, zoom: 1 }; };
    cv.addEventListener('click', (ev) => pick(W, ev));
    cv.addEventListener('keydown', (ev) => {
      if (ev.key === '+' || ev.key === '=') zoom(W, 1.6);
      else if (ev.key === '-') zoom(W, 1 / 1.6);
      else if (ev.key === 'n') { pickNext(W); }
      else return;
      ev.preventDefault();
    });
    $('#worlds').appendChild(el);
  }

  function restart() {
    $('#worlds').innerHTML = '';
    state.worlds = WORLDS.map(build);
    state.worlds.forEach(mount);
    renderChips();
  }

  // ---------- Camera ----------
  function scale(W, cv) {
    const r = cv.getBoundingClientRect();
    return Math.min(r.width / W.w.p.size, r.height / W.w.H) * W.cam.zoom;
  }
  function clamp(W, cv) {
    const r = cv.getBoundingClientRect(), k = scale(W, cv), c = W.cam;
    const hw = r.width / 2 / k, hh = r.height / 2 / k;
    c.cx = hw * 2 >= W.w.p.size ? W.w.p.size / 2 : Math.max(hw, Math.min(W.w.p.size - hw, c.cx));
    c.cy = hh * 2 >= W.w.H ? W.w.H / 2 : Math.max(hh, Math.min(W.w.H - hh, c.cy));
  }
  function zoom(W, f) { W.cam.zoom = Math.max(1, Math.min(10, W.cam.zoom * f)); }

  function pick(W, ev) {
    const cv = ev.currentTarget, r = cv.getBoundingClientRect(), k = scale(W, cv);
    const x = (ev.clientX - r.left - r.width / 2) / k + W.cam.cx, y = (ev.clientY - r.top - r.height / 2) / k + W.cam.cy;
    let best = null, bd = (14 / k) ** 2;
    for (const c of W.w.creatures) {
      const d = (c.x - x) ** 2 + (c.y - y) ** 2;
      if (d < bd) { bd = d; best = c; }
    }
    W.selected = best;
    renderInspect(W);
  }
  // Keyboard: select the next grazer.
  function pickNext(W) {
    const list = W.w.creatures.filter((c) => !c.meat);
    if (!list.length) return;
    const i = W.selected ? list.indexOf(W.selected) : -1;
    W.selected = list[(i + 1) % list.length];
    renderInspect(W);
  }

  // ---------- Drawing ----------
  function fitCanvas(cv) {
    const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1;
    const w = Math.round(r.width * d), h = Math.round(r.height * d);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return [r.width, r.height, d];
  }

  function drawWorld(W) {
    const cv = $('canvas.map', W.el), [w, h, d] = fitCanvas(cv), ctx = cv.getContext('2d');
    if (W.follow && W.selected) { W.cam.cx = W.selected.x; W.cam.cy = W.selected.y; }
    clamp(W, cv);
    const world = W.w, sx = world.sx, k = scale(W, cv);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    window.EarthDraw.drawWorld(ctx, W.painter, w, h, { cx: W.cam.cx / sx, cy: W.cam.cy / sx, zoom: W.cam.zoom }, { layer: 'nature', background: tok('--dish') });
    ctx.save();
    ctx.translate(w / 2 - W.cam.cx * k, h / 2 - W.cam.cy * k);
    ctx.scale(k, k);
    const green = tok('--green'), violet = tok('--violet'), GREEN = window.WorldSim.GREEN;
    for (const pl of world.plants) {
      ctx.fillStyle = world.plantColour(pl) === GREEN ? green : violet;
      ctx.globalAlpha = pl.size < world.p.biteSize ? 0.4 : 1;
      ctx.beginPath(); ctx.arc(pl.x, pl.y, 1 + 2.6 * pl.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const danger = tok('--danger');
    for (const c of world.creatures) {
      const sz = 4 + Math.min(4, c.energy / 40);
      window.CreatureDraw.draw(ctx, c, c.x, c.y, sz, c.meat ? danger : LIMB_FILL[world.plan(c).type], { px: k });
    }
    const c = W.selected;
    if (c && world.creatures.includes(c)) {
      ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.7; ctx.lineWidth = 2 / k;
      ctx.beginPath(); ctx.arc(c.x, c.y, 13, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    const day = Math.floor(world.t / W.g.chem.earth.p.dayLength);
    $('.hud', W.el).textContent = `Day ${day} · ${world.creatures.length} creatures`;
  }

  // ---------- Panels ----------
  function last(W) { const h = W.w.history; return h[h.length - 1] || {}; }

  function renderStats(W) {
    const h = last(W), box = $('.stats', W.el);
    const rows = [
      ['Grazers', h.prey == null ? '–' : h.prey],
      ['Hunters', h.predators == null ? '–' : h.predators],
      ['On the shore', pc(h.shoreShare)],
      ['With legs', pc(h.legs)],
      ['Sturdy limbs', n2(h.sturdy)],
      ['Air skin', n2(h.air)],
    ];
    box.innerHTML = rows.map(([k, v]) => `<div class="stat"><b>${v}</b><small>${k}</small></div>`).join('');
  }

  const LIMB_NAME = ['no limbs', 'fins', 'legs'];
  const limbsText = (P) => (P.pairs ? `${P.pairs} ${P.pairs === 1 ? 'pair' : 'pairs'} of ${LIMB_NAME[P.type]}` : 'no limbs');
  function planText(world, c) {
    const P = world.plan(c), g = c.g;
    const limbs = limbsText(P);
    const hold = P.type === 2 ? ` · legs hold ${Math.round(P.hold * 100)}% of its weight` : '';
    return `${P.segs} segments · ${limbs} (length ${n2(g.limbLength)}, sturdiness ${n2(g.sturdy)})${hold} · tail fin ${n2(g.tail)} · air skin ${n2(g.air)}`;
  }

  function renderInspect(W) {
    const box = $('.inspect', W.el), c = W.selected, world = W.w;
    if (!c || !world.creatures.includes(c)) {
      if (W.selected) { W.selected = null; W.follow = false; }
      box.textContent = 'Click a grazer to see its body plan.';
      return;
    }
    const who = c.meat ? 'Hunter' : 'Grazer';
    const life = c.meat ? '' : ` · ${Math.round((c.dry || 0) * 100)}% of recent life on land`;
    box.innerHTML = `<b>${who} #${c.id}</b> · generation ${c.gen} · energy ${Math.round(c.energy)}${life}<br>${planText(world, c)}`;
    const b = document.createElement('button');
    b.textContent = W.follow ? 'Stop following' : 'Follow it';
    b.onclick = () => { W.follow = !W.follow; if (W.follow && W.cam.zoom < 5) W.cam.zoom = 5; renderInspect(W); };
    box.appendChild(b);
  }

  // The most common body plans among grazers, drawn small.
  function renderPlans(W) {
    const world = W.w, groups = new Map();
    for (const c of world.creatures) {
      if (c.meat) continue;
      const P = world.plan(c), key = [P.segs, P.type, P.pairs].join();
      const g = groups.get(key);
      if (g) g.n++; else groups.set(key, { n: 1, c, P });
    }
    const top = [...groups.values()].sort((a, b) => b.n - a.n).slice(0, 6);
    const row = $('.plans-row', W.el);
    row.innerHTML = '';
    for (const { n, c, P } of top) {
      const fig = document.createElement('div');
      fig.className = 'plan';
      const cv = document.createElement('canvas'), d = devicePixelRatio || 1;
      cv.width = 64 * d; cv.height = 44 * d;
      const ctx = cv.getContext('2d');
      ctx.scale(d, d);
      const model = { id: 0, age: 0, heading: 0, brain: c.brain, meat: false, g: c.g };
      window.CreatureDraw.draw(ctx, model, 33, 22, 7, LIMB_FILL[P.type], { px: 1 });
      const label = `${P.segs} segments, ${limbsText(P)}`;
      cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', label);
      const cap = document.createElement('span');
      cap.textContent = `× ${n}`;
      cap.title = label;
      fig.append(cv, cap);
      row.appendChild(fig);
    }
  }

  // ---------- Chart ----------
  function renderChips() {
    const box = $('#metrics');
    box.innerHTML = '';
    for (const m of METRICS) {
      const b = document.createElement('button');
      b.className = 'chip'; b.textContent = m.label;
      b.setAttribute('aria-pressed', String(m.key === state.metric));
      b.onclick = () => setMetric(m.key);
      box.appendChild(b);
    }
    const m = METRICS.find((x) => x.key === state.metric);
    $('#chart-note').textContent = m.note;
    $('#legend').innerHTML = state.worlds.map((W) => `<span><i class="sw" style="background:${tok(W.def.colour)}"></i>${W.def.name}</span>`).join('');
  }
  function setMetric(k) { state.metric = k; renderChips(); }

  function drawChart() {
    const cv = $('#chart'), [w, h, d] = fitCanvas(cv), ctx = cv.getContext('2d');
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const m = METRICS.find((x) => x.key === state.metric);
    const pad = { l: 40, r: 10, t: 8, b: 20 };
    let tMax = 1, vMax = m.max || 0;
    for (const W of state.worlds) {
      const hs = W.w.history;
      if (hs.length) tMax = Math.max(tMax, hs[hs.length - 1].t);
      if (!m.max) for (const r of hs) if (r[m.key] != null) vMax = Math.max(vMax, r[m.key]);
    }
    vMax = vMax || 1;
    const X = (t) => pad.l + (w - pad.l - pad.r) * t / tMax, Y = (v) => h - pad.b - (h - pad.t - pad.b) * v / vMax;
    ctx.strokeStyle = tok('--line'); ctx.fillStyle = tok('--muted'); ctx.lineWidth = 1;
    ctx.font = '11px ' + tok('--mono');
    for (let i = 0; i <= 2; i++) {
      const v = vMax * i / 2;
      ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(w - pad.r, Y(v)); ctx.stroke();
      ctx.fillText(m.fmt(v), 2, Y(v) + 4);
    }
    const days = tMax / 720;
    ctx.fillText(`Day ${Math.floor(days)}`, w - pad.r - 50, h - 4);
    for (const W of state.worlds) {
      ctx.strokeStyle = tok(W.def.colour); ctx.lineWidth = 2;
      ctx.beginPath();
      let on = false;
      for (const r of W.w.history) {
        const v = r[m.key];
        if (v == null) { on = false; continue; }
        if (on) ctx.lineTo(X(r.t), Y(v)); else { ctx.moveTo(X(r.t), Y(v)); on = true; }
      }
      ctx.stroke();
    }
  }

  // ---------- Results (headless runs, README) ----------
  // Means over 6 seeds of the last 2,000 of 10,000 steps.
  const RESULTS = window.ShoresResults || [];
  function renderResults() {
    const body = $('#results tbody');
    body.innerHTML = RESULTS.map((r) => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[3]}</td></tr>`).join('');
  }

  // ---------- Loop ----------
  function stepAll() {
    if (state.speed === 'ff') {
      const t0 = performance.now();
      while (performance.now() - t0 < 28) for (const W of state.worlds) W.g.step();
    } else {
      const n = Number(state.speed);
      for (let i = 0; i < n; i++) for (const W of state.worlds) W.g.step();
    }
  }
  let frame = 0;
  function loop() {
    if (state.running) stepAll();
    for (const W of state.worlds) drawWorld(W);
    if (frame++ % 10 === 0) {
      for (const W of state.worlds) { renderStats(W); if (W.selected) renderInspect(W); }
      drawChart();
      const W = state.worlds[0];
      $('#clock').textContent = `Day ${Math.floor(W.w.t / W.g.chem.earth.p.dayLength)}`;
    }
    if (frame % 120 === 1) for (const W of state.worlds) renderPlans(W);
    requestAnimationFrame(loop);
  }

  function play() { state.running = true; $('#play').textContent = 'Pause'; }
  function setSpeed(v) { state.speed = v; $('#speed').value = v; }
  $('#play').onclick = () => { state.running = !state.running; $('#play').textContent = state.running ? 'Pause' : 'Play'; };
  $('#play').textContent = state.running ? 'Pause' : 'Play';
  $('#speed').onchange = (e) => { state.speed = e.target.value; };
  $('#restart').onclick = () => { restart(); renderPlans(state.worlds[0]); renderPlans(state.worlds[1]); };

  restart();
  renderResults();
  requestAnimationFrame(loop);

  window.ShoresPage = {
    get worlds() { return state.worlds; },
    restart, play, setSpeed, setMetric, last,
    follow(W, c, z) { if (!c) return; W.selected = c; W.follow = true; W.cam.zoom = z || 5; renderInspect(W); },
    pickGrazer(W, best) {
      let c = null;
      for (const x of W.w.creatures) if (!x.meat && (!c || best(x) > best(c))) c = x;
      return c;
    },
  };
})();
