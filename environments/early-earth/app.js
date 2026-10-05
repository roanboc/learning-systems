// Early Earth page: worlds side by side, each a map you can fly over.
(function () {
  'use strict';

  const { makeWorld, PRESETS, SPECIES } = window.ChemSim;
  const { MapPainter, drawWorld, toCell, LAYERS } = window.EarthDraw;
  const css = getComputedStyle(document.documentElement);
  const token = (n) => css.getPropertyValue(n).trim();
  const WORLD_COLOURS = ['--s1', '--s2', '--s3'];
  const MAX_WORLDS = 3;

  const METRICS = [
    { key: 'withCopiers', label: 'Bubbles with copiers' },
    { key: 'bubbles', label: 'Bubbles' },
    { key: 'maxGen', label: 'Longest lineage' },
    { key: 'copierPatch', label: 'Copier patches' },
    { key: 'chains', label: 'Chains' },
    { key: 'blocks', label: 'Building blocks' },
    { key: 'oils', label: 'Oils' },
  ];
  let metric = 'withCopiers';

  const worlds = [];
  let running = true;
  let seedCounter = 3;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, el) => (el || document).querySelector(s);
  const fmt = (v, d) => (v >= 100 ? Math.round(v).toString() : v.toFixed(d == null ? 2 : d));
  function timeOfDay(e) {
    const h = e.dayPhase * 24, hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  }
  function tideWord(e) {
    const c = Math.cos(e.tidePhase * Math.PI * 2);
    if (e.seaLevel > e.p.tideRange * 0.8) return 'high tide';
    if (e.seaLevel < -e.p.tideRange * 0.8) return 'low tide';
    return c > 0 ? 'tide rising' : 'tide falling';
  }

  // ---------- Worlds ----------
  function addWorld(preset, seed) {
    if (worlds.length >= MAX_WORLDS) return;
    const el = $('#world-tpl').content.firstElementChild.cloneNode(true);
    const W = {
      preset, seed, el, sim: null, painter: null,
      cam: { cx: 80, cy: 50, zoom: 1 }, layer: 'nature', tool: 'look',
      selected: null, follow: false, inspectCell: null, mark: null, journalShown: 0,
    };
    worlds.push(W);
    $('#worlds').appendChild(el);
    build(W);
    wire(W);
    refreshHeads();
    renderLegend();
  }

  function build(W) {
    W.sim = makeWorld(W.preset, W.seed);
    W.painter = new MapPainter(W.sim);
    W.cam = { cx: W.sim.earth.cols / 2, cy: W.sim.earth.rows / 2, zoom: 1 };
    W.selected = null; W.follow = false; W.inspectCell = null; W.mark = null; W.journalShown = 0;
    $('.journal', W.el).innerHTML = '';
    $('.inspect', W.el).textContent = 'Click the map to look at a spot or a bubble.';
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
    const toolSel = $('.tool', el);
    toolSel.onchange = () => { W.tool = toolSel.value; cv.classList.toggle('tool', W.tool !== 'look'); };
    $('.remove', el).onclick = () => {
      worlds.splice(worlds.indexOf(W), 1); el.remove(); refreshHeads(); renderLegend();
    };
    $('.reseed', el).onclick = () => { W.seed = ++seedCounter; build(W); refreshHeads(); };
    $('.zin', el).onclick = () => zoomAt(W, 1.5);
    $('.zout', el).onclick = () => zoomAt(W, 1 / 1.5);
    $('.zfit', el).onclick = () => { W.follow = false; W.cam = { cx: W.sim.earth.cols / 2, cy: W.sim.earth.rows / 2, zoom: 1 }; };

    // Pan with drag, zoom with wheel or pinch, click to look or act.
    const pts = new Map();
    let moved = 0, pinch = null;
    cv.addEventListener('pointerdown', (ev) => {
      cv.setPointerCapture(ev.pointerId);
      pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      moved = 0;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: W.cam.zoom };
      }
    });
    cv.addEventListener('pointermove', (ev) => {
      const p = pts.get(ev.pointerId);
      if (!p) return;
      const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
      p.x = ev.clientX; p.y = ev.clientY;
      if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        W.cam.zoom = clampZoom(pinch.zoom * d / pinch.d);
        moved += 10;
        return;
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
    const e = W.sim.earth, r = cv.getBoundingClientRect();
    return Math.min(r.width / e.cols, r.height / e.rows) * W.cam.zoom;
  }
  function clampZoom(z) { return Math.max(1, Math.min(14, z)); }
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
    const e = W.sim.earth;
    if (p.x < 0 || p.y < 0 || p.x >= e.cols || p.y >= e.rows) return;
    if (W.tool === 'look') {
      const b = W.sim.bubbleNear(p.x, p.y, Math.max(1.2, 6 / scale(W, cv)));
      W.mark = null;
      if (b) { W.selected = b; W.inspectCell = null; }
      else { W.selected = null; W.follow = false; W.inspectCell = e.cellAt(p.x, p.y); }
      showInspect(W);
      return;
    }
    if (W.tool === 'vent') W.sim.addVent(p.x, p.y);
    else W.sim.pour(W.tool, p.x, p.y, W.tool === 'copiers' ? 1 : 2, 3);
    W.sim._add(
      { blocks: 'You poured building blocks', oils: 'You poured oils', copiers: 'You seeded copiers', vent: 'You opened a vent' }[W.tool],
      'An experiment. Watch what happens here, and compare with a world you left alone.', Math.floor(p.x), Math.floor(p.y));
  }

  // ---------- Inspect ----------
  function showInspect(W) {
    const box = $('.inspect', W.el), e = W.sim.earth;
    if (W.selected) {
      const b = W.selected;
      const alive = W.sim.bubbles.includes(b);
      box.innerHTML =
        `<b>Bubble #${b.id}</b>${alive ? '' : ' (burst)'} · generation <b>${b.gen}</b> · ` +
        `age ${e.t - b.born} steps · size ${fmt(b.lipid)} · chains ${fmt(b.chains, 3)} · copiers <b>${fmt(b.copiers, 3)}</b> · ` +
        `blocks ${fmt(b.blocks, 3)} · split ${b.children}× · parent ${b.parent ? '#' + b.parent : 'none (formed from oils)'}` +
        `<button class="follow">${W.follow ? 'Stop following' : 'Follow'}</button>`;
      $('.follow', box).onclick = () => {
        W.follow = !W.follow;
        if (W.follow && W.cam.zoom < 5) W.cam.zoom = 5;
        showInspect(W);
      };
      return;
    }
    if (W.inspectCell != null) {
      const i = W.inspectCell, c = W.sim.at(i);
      const x = i % e.cols, y = Math.floor(i / e.cols);
      const sp = Math.hypot(e.vx[i], e.vy[i]);
      box.innerHTML =
        `<b>${e.kind(i)}</b> at ${x},${y} · water ${fmt(e.water[i])} m · ${fmt(e.temp[i], 0)} °C · light ${fmt(e.light[i])}` +
        (e.ventHeat[i] > 0.05 ? ' · <b>vent</b>' : '') + (sp > 0.01 ? ` · current ${fmt(sp)}` : '') + '<br>' +
        SPECIES.map((s) => `${s.key} <b>${fmt(c[s.key], 3)}</b>`).join(' · ');
    }
  }

  // ---------- Journal ----------
  function showJournal(W) {
    const j = W.sim.journal;
    if (j.length === W.journalShown) return;
    const box = $('.journal', W.el);
    for (let k = W.journalShown; k < j.length; k++) {
      const it = j[k];
      const b = document.createElement('button');
      b.className = 'entry';
      const h = ((it.t % W.sim.earth.p.dayLength) / W.sim.earth.p.dayLength) * 24;
      b.innerHTML = `<small>Day ${it.day} · ${String(Math.floor(h)).padStart(2, '0')}:00${it.x != null ? ' · show on map' : ''}</small><b></b><span></span>`;
      $('b', b).textContent = it.title;
      $('span', b).textContent = it.text;
      if (it.x != null) {
        b.onclick = () => {
          W.follow = false; W.selected = null;
          W.cam.cx = it.x; W.cam.cy = it.y; W.cam.zoom = Math.max(W.cam.zoom, 4);
          clampCam(W);
          W.mark = { x: it.x, y: it.y };
          W.inspectCell = W.sim.earth.cellAt(it.x, it.y);
          showInspect(W);
        };
      } else b.disabled = true;
      box.prepend(b);
    }
    W.journalShown = j.length;
  }

  // ---------- Stats ----------
  function showStats(W) {
    const st = W.sim.stats, e = W.sim.earth;
    if (!st.t && st.t !== 0) return;
    const items = [
      ['Bubbles', st.bubbles], ['with copiers', st.withCopiers], ['Longest lineage', st.maxGen],
      ['Copier patches', st.copierPatch], ['Copier origins lost', st.extinctions],
    ];
    $('.stats', W.el).innerHTML = items.map(([k, v]) => `<div class="stat"><b>${v}</b><small>${k}</small></div>`).join('');
    $('.hud', W.el).textContent = `Day ${e.day} · ${timeOfDay(e)} · ${tideWord(e)}` + (W.follow && W.selected ? ` · following bubble #${W.selected.id}` : '');
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
    let tMax = 1, vMax = ['bubbles', 'withCopiers', 'maxGen', 'copierPatch'].includes(metric) ? 1 : 0.01;
    for (const W of worlds) for (const s of W.sim.history) { tMax = Math.max(tMax, s.t); vMax = Math.max(vMax, s[metric]); }
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
      const hist = W.sim.history;
      if (!hist.length) return;
      ctx.strokeStyle = token(WORLD_COLOURS[k]); ctx.lineWidth = 2;
      ctx.beginPath();
      hist.forEach((s, i) => {
        const x = padL + pw * (s.t / tMax), y = 6 + ph * (1 - s[metric] / vMax);
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
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
      if (!W.sim.bubbles.includes(W.selected)) W.follow = false;
      else { W.cam.cx = W.selected.x; W.cam.cy = W.selected.y; clampCam(W); }
    }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWorld(ctx, W.painter, r.width, r.height, W.cam, {
      layer: W.layer, selected: W.selected, mark: W.mark, background: token('--dish'),
    });
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
    const ff = sp === 'ff' && running;
    if (!ff || frame % 6 === 0) {
      for (const W of worlds) drawMap(W);
    }
    if (frame % 15 === 0) {
      for (const W of worlds) { showStats(W); showJournal(W); if (W.selected || W.inspectCell != null) showInspect(W); }
      drawChart();
      const e = worlds[0] && worlds[0].sim.earth;
      if (e) $('#clock').textContent = `Day ${e.day} · ${timeOfDay(e)} · ${tideWord(e)}`;
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
  window.EarlyEarthPage = {
    get worlds() { return worlds; },
    replaceWorlds(list) {         // [[preset, seed], ...]
      for (const W of worlds) W.el.remove();
      worlds.length = 0;
      for (const [p, s] of list) addWorld(p, s);
    },
    setLayer(W, key) { W.layer = key; $('.layer', W.el).value = key; },
    look(W, x, y, zoom) {
      W.follow = false; W.selected = null;
      W.cam.cx = x; W.cam.cy = y; W.cam.zoom = clampZoom(zoom);
      clampCam(W);
      W.mark = { x, y };
    },
    scale(W) { return scale(W, $('canvas.map', W.el)); },
    setSpeed(v) { $('#speed').value = v; },
    play() { if (!running) $('#play').click(); },
    setMetric(k) { metric = k; renderMetrics(); drawChart(); },
    reveal() { $('#worlds').scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }); },
  };

  renderMetrics();
  addWorld('full', 3);
  requestAnimationFrame(loop);
})();
