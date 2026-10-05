// Life pages (First cells, Bodies): Early Earth coasts with cells (lib/life.js), side by side.
(function () {
  'use strict';

  const { makeLife, ROLE_NAMES } = window.LifeSim;
  const { MapPainter, drawWorld, toCell, LAYERS } = window.EarthDraw;
  const { drawCells } = window.LifeDraw;
  const css = getComputedStyle(document.documentElement);
  const token = (n) => css.getPropertyValue(n).trim();
  const WORLD_COLOURS = ['--s1', '--s2', '--s3'];
  const MAX_WORLDS = 3;

  // Light at cells compared with light in the water, by day only.
  const lightRel = (s) => (s.lightInWater > 0.15 ? s.lightAtCells / s.lightInWater : null);
  const bodyOf = (L, c) => (L._beatOrder && L._beatOrder.get(c.clump)) || null;

  // One page per chapter: the page says which (<body data-stage="...">).
  // Each world is the same coast with one ability switched off (or none).
  const CONFIGS = {
    cells: {
      start: 'evolve',
      presets: {
        evolve: { label: 'Free to evolve', params: {} },
        fast: { label: 'Start with strong motors', params: { geneStart: { speed: [0.2, 0.3] } } },
        nomotor: { label: 'No motors', params: { geneStart: { speed: [0, 0] }, fixed: ['speed'] } },
        noeyes: { label: 'No eyespots', params: { geneStart: { eyespot: [0, 0] }, fixed: ['eyespot'] } },
        nolight: { label: 'No food from light', params: { lightGain: 0 } },
      },
      metrics: [
        { key: 'speed', label: 'Motor', get: (s) => s.speed, note: 'Average motor strength. Everyone starts near zero.' },
        { key: 'tumble', label: 'Follows food', get: (s) => s.tumble, note: 'How much cells hold course while food improves. It only matters for cells that can swim.' },
        { key: 'eyespot', label: 'Eyespot', get: (s) => s.eyespot, note: 'Average eyespot gene. Genes that do nothing still wander, so compare with a world where they matter.' },
        { key: 'light', label: 'Light found (by day)', get: lightRel, min: 1.5, note: 'Light where the cells are, compared with light in the water on average (1 = no better than drifting). Daytime only.' },
        { key: 'cells', label: 'Cells', get: (s) => s.cells, min: 10, note: 'Number of cells. The coast holds at most 900.' },
      ],
      stats: (W, st) => [['Cells', st.cells], ['Generations', st.maxGen], ['Motor', fmt(st.speed)], ['Follows food', fmt(st.tumble)],
        ['Eyespot', fmt(st.eyespot)], ['Starved', W.sim.deathsBy.starved], ['Stranded', W.sim.deathsBy.stranded], ['Cooked', W.sim.deathsBy.cooked]],
      genes: (c) => `motor <b>${fmt(c.g.speed)}</b> · follows food <b>${fmt(c.g.tumble)}</b> · eyespot <b>${fmt(c.g.eyespot)}</b> · divides at ${fmt(c.g.divideAt)} · light here ${fmt(c.light)}`,
    },
    bodies: {
      start: 'free',
      presets: {
        free: { label: 'Free to evolve', params: {} },
        coupled: { label: 'Linked rhythm', params: { geneStart: { sync: [1, 1] }, fixed: ['sync'] } },
        uncoupled: { label: 'Each cell on its own rhythm', params: { geneStart: { sync: [0, 0] }, fixed: ['sync'] } },
        noroles: { label: 'No roles', params: { geneStart: { specialise: [0, 0] }, fixed: ['specialise'] } },
      },
      metrics: [
        { key: 'inStep', label: 'In step', get: (s) => s.inStep, min: 1, note: 'How together the contracting cells of each body squeeze, on average (1 = all at once). A few cells on random rhythms still score about 0.5.' },
        { key: 'bodySpeed', label: 'Body speed', get: (s) => s.bodySpeed, min: 0.05, note: 'How fast bodies push themselves along, on average, not counting the current.' },
        { key: 'sync', label: 'Linking gene', get: (s) => s.sync, note: 'Average "sync" gene: how strongly a contracting cell falls into step with the rest of its body.' },
        { key: 'specialise', label: 'Takes a role', get: (s) => s.specialise, min: 1, note: 'Average "specialise" gene: the chance that a cell in a body takes a role.' },
        { key: 'cells', label: 'Cells', get: (s) => s.cells, min: 10, note: 'Number of cells. The coast holds at most 900.' },
      ],
      stats: (W, st) => [['Cells', st.cells], ['Bodies with roles', st.bodies], ['Contracting cells', st.movers], ['Germ cells', st.germs],
        ['In step', fmt(st.inStep)], ['Body speed', fmt(st.bodySpeed, 3)], ['Linking gene', fmt(st.sync)], ['Predators', st.predators]],
      genes: (c, L) => {
        const b = c.clumpSize > 1 ? bodyOf(L, c) : null;
        const roles = [0, 0, 0, 0, 0];
        if (c.clumpSize > 1) for (const m of L.clumpOf(c)) roles[m.role]++;
        return (c.clumpSize > 1 ? `body of <b>${c.clumpSize}</b>: ${roles[2]} contracting, ${roles[3]} germ, ${roles[1]} without a role` +
          (b && b.n > 1 ? ` · in step <b>${fmt(Math.hypot(b.x, b.y) / b.n)}</b>` : '') + '<br>' : '') +
          (c.role === window.LifeSim.MOVER ? (c.contracting ? '<b>contracting now</b> · ' : 'resting · ') : '') +
          `linking gene <b>${fmt(c.g.sync)}</b> · takes a role ${fmt(c.g.specialise)} · sticks ${fmt(c.g.stick)}`;
      },
    },
  };
  const STAGE = document.body.dataset.stage || 'cells';
  const CFG = CONFIGS[STAGE], PRESETS = CFG.presets, METRICS = CFG.metrics;
  let metric = METRICS[0].key;

  const worlds = [];
  let running = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, el) => (el || document).querySelector(s);
  const fmt = (v, d) => (v >= 100 ? Math.round(v).toString() : v.toFixed(d == null ? 2 : d));
  function timeOfDay(e) {
    const h = e.dayPhase * 24, hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  }

  function addWorld(preset, seed) {
    if (worlds.length >= MAX_WORLDS) return;
    const el = $('#world-tpl').content.firstElementChild.cloneNode(true);
    const W = { preset, seed, el, sim: null, painter: null, cam: { cx: 80, cy: 50, zoom: 1 }, layer: 'nature', selected: null, follow: false, journalShown: 0 };
    worlds.push(W);
    $('#worlds').appendChild(el);
    build(W);
    wire(W);
    refreshHeads();
    renderLegend();
    return W;
  }

  function build(W) {
    W.sim = makeLife(STAGE, W.seed, PRESETS[W.preset].params);
    W.painter = new MapPainter(W.sim.chem);
    W.cam = { cx: W.sim.earth.cols / 2, cy: W.sim.earth.rows / 2, zoom: 1 };
    W.selected = null; W.follow = false; W.journalShown = 0;
    $('.journal', W.el).innerHTML = '';
    $('.inspect', W.el).textContent = 'Click a cell to follow it.';
  }

  function refreshHeads() {
    worlds.forEach((W, k) => {
      $('.dot', W.el).style.background = token(WORLD_COLOURS[k]);
      $('.name', W.el).textContent = PRESETS[W.preset].label;
      $('.badge', W.el).textContent = 'seed ' + W.seed;
      $('.badge', W.el).style.cssText = 'font:500 11px var(--mono);color:var(--muted)';
      $('.remove', W.el).hidden = worlds.length === 1;
    });
    $('#add').disabled = worlds.length >= MAX_WORLDS;
  }

  function wire(W) {
    const el = W.el, cv = $('canvas.map', el);
    const layerSel = $('.layer', el);
    for (const l of LAYERS) layerSel.add(new Option(l.label, l.key));
    layerSel.onchange = () => { W.layer = layerSel.value; };
    $('.remove', el).onclick = () => { worlds.splice(worlds.indexOf(W), 1); el.remove(); refreshHeads(); renderLegend(); };
    $('.zin', el).onclick = () => zoomAt(W, 1.5);
    $('.zout', el).onclick = () => zoomAt(W, 1 / 1.5);
    $('.zfit', el).onclick = () => { W.follow = false; W.cam = { cx: W.sim.earth.cols / 2, cy: W.sim.earth.rows / 2, zoom: 1 }; };

    const pts = new Map();
    let moved = 0, pinch = null;
    cv.addEventListener('pointerdown', (ev) => {
      cv.setPointerCapture(ev.pointerId);
      pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      moved = 0;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: W.cam.zoom }; }
    });
    cv.addEventListener('pointermove', (ev) => {
      const p = pts.get(ev.pointerId);
      if (!p) return;
      const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
      p.x = ev.clientX; p.y = ev.clientY;
      if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()];
        W.cam.zoom = clampZoom(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d);
        clampCam(W); moved += 10; return;
      }
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 4) {
        cv.classList.add('dragging');
        W.follow = false;
        const s = scale(W, cv);
        W.cam.cx -= dx / s; W.cam.cy -= dy / s;
        clampCam(W);
      }
    });
    const end = (ev) => {
      const had = pts.has(ev.pointerId);
      pts.delete(ev.pointerId);
      if (pts.size < 2) pinch = null;
      cv.classList.remove('dragging');
      if (had && moved <= 4 && ev.type === 'pointerup') click(W, cv, ev);
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const r = cv.getBoundingClientRect();
      zoomAt(W, Math.exp(-ev.deltaY * 0.0015), ev.clientX - r.left, ev.clientY - r.top);
    }, { passive: false });
  }

  function scale(W, cv) {
    const e = W.sim.earth, r = (cv || $('canvas.map', W.el)).getBoundingClientRect();
    return Math.min(r.width / e.cols, r.height / e.rows) * W.cam.zoom;
  }
  function clampZoom(z) { return Math.max(1, Math.min(16, z)); }
  function clampCam(W) {
    const e = W.sim.earth;
    const hw = e.cols / 2 / W.cam.zoom, hh = e.rows / 2 / W.cam.zoom;
    W.cam.cx = Math.max(hw, Math.min(e.cols - hw, W.cam.cx));
    W.cam.cy = Math.max(hh, Math.min(e.rows - hh, W.cam.cy));
  }
  function zoomAt(W, k, px, py) {
    const cv = $('canvas.map', W.el), r = cv.getBoundingClientRect();
    if (px == null) { px = r.width / 2; py = r.height / 2; }
    const before = toCell(px, py, r.width, r.height, W.cam, W.sim.earth);
    W.cam.zoom = clampZoom(W.cam.zoom * k);
    if (!W.follow) {
      const after = toCell(px, py, r.width, r.height, W.cam, W.sim.earth);
      W.cam.cx += before.x - after.x; W.cam.cy += before.y - after.y;
    }
    clampCam(W);
  }

  function click(W, cv, ev) {
    const r = cv.getBoundingClientRect();
    const p = toCell(ev.clientX - r.left, ev.clientY - r.top, r.width, r.height, W.cam, W.sim.earth);
    const c = W.sim.cellNear(p.x, p.y, Math.max(0.8, 12 / scale(W, cv)));
    W.selected = c; W.follow = !!c;
    if (c && W.cam.zoom < 8) W.cam.zoom = 8;
    showInspect(W);
  }

  // ---------- Inspect ----------
  function showInspect(W) {
    const box = $('.inspect', W.el), c = W.selected;
    if (!c) { box.textContent = 'Click a cell to follow it.'; return; }
    if (c.dead) { box.innerHTML = `<b>Cell #${c.id}</b> died. Click another cell.`; W.follow = false; return; }
    box.innerHTML =
      `<b>Cell #${c.id}</b> · ${ROLE_NAMES[c.role]} · generation <b>${c.gen}</b> · age ${c.age} · energy ${fmt(c.energy)} · ${c.kids} daughters<br>` +
      CFG.genes(c, W.sim) +
      `<button class="follow">${W.follow ? 'Stop following' : 'Follow'}</button>`;
    $('.follow', box).onclick = () => { W.follow = !W.follow; if (W.follow && W.cam.zoom < 8) W.cam.zoom = 8; showInspect(W); };
  }

  // ---------- Journal ----------
  function showJournal(W) {
    const j = W.sim.journal;
    if (j.length === W.journalShown) return;
    const box = $('.journal', W.el);
    for (let k = W.journalShown; k < j.length; k++) {
      const it = j[k], b = document.createElement('button');
      b.className = 'entry';
      const h = ((it.t % W.sim.earth.p.dayLength) / W.sim.earth.p.dayLength) * 24;
      b.innerHTML = `<small>Day ${it.day} · ${String(Math.floor(h)).padStart(2, '0')}:00${it.x != null ? ' · show on map' : ''}</small><b></b><span></span>`;
      $('b', b).textContent = it.title;
      $('span', b).textContent = it.text;
      if (it.x != null) b.onclick = () => { W.follow = false; W.cam.cx = it.x; W.cam.cy = it.y; W.cam.zoom = Math.max(W.cam.zoom, 4); clampCam(W); };
      else b.disabled = true;
      box.prepend(b);
    }
    W.journalShown = j.length;
  }

  // ---------- Stats ----------
  function showStats(W) {
    const st = W.sim.stats, e = W.sim.earth;
    if (st.cells == null) return;
    const items = CFG.stats(W, st);
    $('.stats', W.el).innerHTML = items.map(([k, v]) => `<div class="stat"><b>${v}</b><small>${k}</small></div>`).join('');
    $('.hud', W.el).textContent = `Day ${e.day} · ${timeOfDay(e)}` + (W.follow && W.selected ? ` · following cell #${W.selected.id}` : '');
  }

  // ---------- Chart ----------
  function renderMetrics() {
    const box = $('#metrics');
    box.innerHTML = '';
    for (const m of METRICS) {
      const b = document.createElement('button');
      b.className = 'chip'; b.textContent = m.label;
      b.setAttribute('aria-pressed', String(m.key === metric));
      b.onclick = () => { metric = m.key; renderMetrics(); drawChart(); };
      box.appendChild(b);
    }
    $('#chart-note').textContent = METRICS.find((m) => m.key === metric).note;
  }
  function renderLegend() {
    $('#legend').innerHTML = worlds.map((W, k) =>
      `<span><i class="sw" style="background:${token(WORLD_COLOURS[k])}"></i>${PRESETS[W.preset].label} (seed ${W.seed})</span>`).join('');
  }
  function drawChart() {
    const cv = $('#chart'), dpr = devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const m = METRICS.find((x) => x.key === metric), get = m.get;
    let tMax = 1, vMax = m.min || 0.2;
    for (const W of worlds) for (const s of W.sim.history) { tMax = Math.max(tMax, s.t); const v = get(s); if (v != null) vMax = Math.max(vMax, v); }
    const padL = 40, padB = 18, pw = w - padL - 6, ph = h - padB - 6;
    ctx.strokeStyle = token('--line'); ctx.lineWidth = 1;
    ctx.fillStyle = token('--muted'); ctx.font = '11px ' + token('--mono');
    for (let k = 0; k <= 2; k++) {
      const y = 6 + ph * (1 - k / 2);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke();
      ctx.fillText(fmt(vMax * k / 2), 2, y + 4);
    }
    const dayLen = worlds[0] ? worlds[0].sim.earth.p.dayLength : 720;
    ctx.fillText('day ' + Math.floor(tMax / dayLen), padL + pw - 44, h - 4);
    worlds.forEach((W, k) => {
      ctx.strokeStyle = token(WORLD_COLOURS[k]); ctx.lineWidth = 2;
      ctx.beginPath();
      let pen = false;
      for (const s of W.sim.history) {
        const v = get(s);
        if (v == null) { pen = false; continue; }
        const x = padL + pw * (s.t / tMax), y = 6 + ph * (1 - v / vMax);
        if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        pen = true;
      }
      ctx.stroke();
    });
  }

  // ---------- Loop ----------
  function drawMap(W) {
    const cv = $('canvas.map', W.el), dpr = devicePixelRatio || 1;
    const r = cv.getBoundingClientRect();
    const pw = Math.round(r.width * dpr), ph = Math.round(r.height * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    if (W.follow && W.selected) {
      // If the followed cell dies, keep following its body if any of it is left.
      if (W.selected.dead) { const n = W.selected.bonds.map((id) => W.sim.byId.get(id)).find(Boolean); if (n) W.selected = n; }
      if (W.selected.dead) W.follow = false;
      else { W.cam.cx = W.selected.x; W.cam.cy = W.selected.y; clampCam(W); }
    }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWorld(ctx, W.painter, r.width, r.height, W.cam, { layer: W.layer, mark: W.mark, background: token('--dish') });
    drawCells(ctx, W.sim, r.width, r.height, W.cam, { selected: W.selected });
  }

  let frame = 0;
  function loop() {
    const sp = $('#speed').value;
    if (running && !document.hidden) {
      if (sp === 'ff') {
        const t0 = performance.now();
        while (performance.now() - t0 < 40) for (const W of worlds) W.sim.step();
      } else {
        const n = +sp;
        for (let k = 0; k < n; k++) for (const W of worlds) W.sim.step();
        for (const W of worlds) W.painter.moveTracers(n, 500);
      }
    }
    frame++;
    if (!(sp === 'ff' && running) || frame % 6 === 0) for (const W of worlds) drawMap(W);
    if (frame % 15 === 0) {
      for (const W of worlds) { showStats(W); showJournal(W); if (W.selected) showInspect(W); }
      drawChart();
      const e = worlds[0] && worlds[0].sim.earth;
      if (e) $('#clock').textContent = `Day ${e.day} · ${timeOfDay(e)}`;
    }
    requestAnimationFrame(loop);
  }

  // ---------- Toolbar ----------
  $('#play').onclick = () => { running = !running; $('#play').textContent = running ? 'Pause' : 'Play'; };
  for (const [k, p] of Object.entries(PRESETS)) $('#add').add(new Option(p.label, k));
  $('#add').onchange = () => {
    const v = $('#add').value;
    if (v) addWorld(v, worlds[0] ? worlds[0].seed : 3);
    $('#add').value = '';
  };
  if (reduce) { running = false; $('#play').textContent = 'Play'; }

  // ---------- For guided labs (lib/learn.js) ----------
  window.FirstCellsPage = window.LifePage = {
    addWorld(preset, seed) { return addWorld(preset, seed); },
    get worlds() { return worlds; },
    replaceWorlds(list) { // [[preset, seed], ...]
      for (const W of worlds) W.el.remove();
      worlds.length = 0;
      for (const [p, s] of list) addWorld(p, s);
    },
    setLayer(W, key) { W.layer = key; $('.layer', W.el).value = key; },
    look(W, x, y, zoom) {
      W.follow = false; W.selected = null;
      W.cam.cx = x; W.cam.cy = y; W.cam.zoom = clampZoom(zoom);
      clampCam(W);
    },
    follow(W, c, zoom) { W.selected = c; W.follow = true; W.cam.zoom = clampZoom(zoom || 12); showInspect(W); },
    scale(W) { return scale(W); },
    setSpeed(v) { $('#speed').value = v; },
    play() { if (!running) $('#play').click(); },
    setMetric(k) { metric = k; renderMetrics(); drawChart(); },
    reveal() { $('#worlds').scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }); },
  };

  renderMetrics();
  addWorld(CFG.start, 3);
  requestAnimationFrame(loop);
})();
