// World Viewer: one stage, a timeline of chapters, a camera and levels.
//
// Each chapter is its own live world. Only the chapter you are in runs; the
// others wait where you left them. The camera pans and zooms; how far you zoom
// (and what you follow) decides the level you are looking at.
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const css = () => getComputedStyle(document.documentElement);
  const tok = (n) => css().getPropertyValue(n).trim();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (v, d) => (Math.abs(v) >= 100 ? Math.round(v).toString() : v.toFixed(d == null ? 2 : d));

  // ---------- Chapters ----------
  const CHAPTERS = [
    {
      key: 'earth', title: 'Early Earth', era: 'about 4 billion years ago', live: true,
      text: 'A young coast with no life. Sunlight, hot vents and tides drive a made-up chemistry: chains form in drying tide pools, copiers arise and spread, and oily bubbles trap them and split. Zoom in until the water turns into molecules.',
      lab: '../environments/early-earth/index.html',
      lenses: ['Coast', 'Water up close', 'Bubble'],
    },
    {
      key: 'cells', title: 'First cells', era: 'about 3.8 billion years ago',
      text: 'Bubbles that carry copiers become cells: they swim up food gradients, divide and compete. Next to build, in this same Earth.',
    },
    {
      key: 'colonies', title: 'Colonies', era: 'about 3.5 billion years ago',
      text: 'Cells that stay stuck together after dividing, share food and face cheaters. When does sticking together pay?',
    },
    {
      key: 'bodies', title: 'Bodies', era: 'about 1.5 billion to 600 million years ago',
      text: 'Colonies whose cells take on roles (feeding, moving, reproducing), so a whole body becomes one unit of selection.',
    },
    {
      key: 'nerves', title: 'Nerve nets', era: 'about 600 million years ago',
      text: 'A soft body with a net of nerve cells that coordinates movement without a centre, like Hydra.',
    },
    {
      key: 'brains', title: 'Brains', era: 'about 540 million years ago', live: true,
      text: 'Creatures with an eye and a small spiking brain that wires itself and learns which plants are food. Species with small and large brains share living plants on drifting soil. Follow one, then zoom into its body, brain and single cells.',
      lab: '../environments/forager-worlds/index.html',
      lenses: ['World', 'Creature', 'Body, brain and cells'],
      world: { seed: 1, seasonLength: 0, plantMode: 'living', species: [
        { name: 'Small brains', mind: 'brain', count: 30, geneInit: { hidden: [6, 10] } },
        { name: 'Large brains', mind: 'brain', count: 30, geneInit: { hidden: [28, 36] } }] },
    },
    {
      key: 'ecosystems', title: 'Ecosystems', era: 'the Cambrian, 520 million years ago', live: true,
      text: 'Hunters chase and bite plant eaters, which can see them and learn to flee. Cycles, chases and extinctions emerge from nothing but local rules.',
      lab: '../environments/forager-worlds/index.html',
      lenses: ['World', 'Creature', 'Body, brain and cells'],
      world: { seed: 1, seasonLength: 0, plantMode: 'living', species: [
        { name: 'Prey', mind: 'brain', count: 50 },
        { name: 'Hunters', mind: 'brain', count: 10, diet: 'meat' }] },
    },
  ];

  // ---------- State ----------
  const cv = $('#view');
  const state = {
    chapter: 0, running: !reduce, frame: 0,
    sims: {},            // per chapter key, created on first visit
  };

  // ---------- Colours for the forager explorer ----------
  let colours = {};
  function readColours() {
    const s = css(), g = (n) => s.getPropertyValue(n).trim();
    colours = {
      ink: g('--ink'), muted: g('--muted'), line: g('--line'), dish: g('--dish'), dishLine: g('--dish-line'),
      green: g('--green'), violet: g('--violet'), danger: g('--danger'),
      series: ['--s1', '--s2', '--s3', '--s4'].map(g),
    };
  }
  readColours();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColours);

  const explorer = new window.Explorer({ colours: () => colours, font: tok('--mono'), onClose: () => { cv.focus(); renderSide(); } });
  explorer.isPaused = () => !state.running;
  explorer.pauseBtn.addEventListener('click', () => { togglePlay(); explorer.draw(); });

  // ---------- Building chapter worlds ----------
  function sim() {
    const ch = CHAPTERS[state.chapter];
    if (!ch.live) return null;
    let s = state.sims[ch.key];
    if (s) return s;
    if (ch.key === 'earth') {
      const w = window.ChemSim.makeWorld('full', 3);
      const e = w.earth;
      s = { kind: 'earth', w, painter: new window.EarthDraw.MapPainter(w), size: [e.cols, e.rows], journalShown: 0 };
    } else {
      const { World, DEFAULTS } = window.WorldSim;
      const params = Object.assign({}, DEFAULTS, ch.world);
      const w = new World(params);
      s = { kind: 'forager', w, entry: { name: ch.title, world: w, params }, size: [params.size, params.size] };
    }
    s.cam = { cx: s.size[0] / 2, cy: s.size[1] / 2, zoom: 1 };
    s.selected = null; s.follow = false; s.inspectCell = null; s.mark = null;
    state.sims[ch.key] = s;
    return s;
  }

  // ---------- Camera ----------
  function viewSize() { const r = cv.getBoundingClientRect(); return [r.width, r.height]; }
  function baseScale(s) { const [w, h] = viewSize(); return Math.min(w / s.size[0], h / s.size[1]); }
  function maxZoom(s) { return s.kind === 'earth' ? 14 : 8; }
  function clampCam(s) {
    const c = s.cam, [w, h] = viewSize(), k = baseScale(s) * c.zoom;
    const hw = w / 2 / k, hh = h / 2 / k;
    c.cx = hw * 2 >= s.size[0] ? s.size[0] / 2 : Math.max(hw, Math.min(s.size[0] - hw, c.cx));
    c.cy = hh * 2 >= s.size[1] ? s.size[1] / 2 : Math.max(hh, Math.min(s.size[1] - hh, c.cy));
  }
  function toWorld(s, px, py) {
    const [w, h] = viewSize(), k = baseScale(s) * s.cam.zoom;
    return { x: (px - w / 2) / k + s.cam.cx, y: (py - h / 2) / k + s.cam.cy };
  }
  function zoomBy(f, px, py) {
    const s = sim(); if (!s) return;
    const [w, h] = viewSize();
    if (px == null) { px = w / 2; py = h / 2; }
    const before = toWorld(s, px, py);
    const z = s.cam.zoom * f;
    // Zooming past the closest view of a followed creature goes inside it.
    if (s.kind === 'forager' && f > 1 && s.cam.zoom >= maxZoom(s) - 0.01 && s.follow && s.selected) { enterCreature(s); return; }
    s.cam.zoom = Math.max(1, Math.min(maxZoom(s), z));
    if (!s.follow) {
      const after = toWorld(s, px, py);
      s.cam.cx += before.x - after.x; s.cam.cy += before.y - after.y;
    }
    clampCam(s);
    renderSide();
  }
  function fit() {
    const s = sim(); if (!s) return;
    s.follow = false; s.cam = { cx: s.size[0] / 2, cy: s.size[1] / 2, zoom: 1 };
    renderSide();
  }

  // ---------- Levels ----------
  function lensIndex(s) {
    if (!s) return -1;
    if (s.kind === 'earth') {
      if (s.follow && s.selected) return 2;
      return baseScale(s) * s.cam.zoom > 22 ? 1 : 0;
    }
    if (explorer.active) return 2;
    return s.selected ? 1 : 0;
  }
  function renderHud() {
    const s = sim(), ch = CHAPTERS[state.chapter], hud = $('#hud');
    hud.innerHTML = '';
    const add = (label, cur, fn) => {
      if (hud.children.length) { const sp = document.createElement('span'); sp.className = 'sep'; sp.textContent = '›'; hud.appendChild(sp); }
      const b = document.createElement(fn ? 'button' : 'span');
      b.className = 'pill'; b.textContent = label;
      if (cur) b.setAttribute('aria-current', 'true');
      if (fn) b.onclick = fn;
      hud.appendChild(b);
    };
    add('Life', false, null);
    add(ch.title, !s || lensIndex(s) === 0, s ? fit : null);
    if (!s) return;
    const li = lensIndex(s);
    if (s.kind === 'earth') {
      if (li >= 1 && !(s.follow && s.selected)) add('Water up close', true, null);
      if (s.follow && s.selected) add('Bubble #' + s.selected.id, true, null);
    } else if (s.selected) {
      add('Creature #' + s.selected.id, true, null);
    }
  }

  // ---------- Timeline ----------
  function renderTimeline() {
    const nav = $('#timeline');
    nav.innerHTML = '';
    CHAPTERS.forEach((ch, i) => {
      const b = document.createElement('button');
      b.className = 'chap' + (ch.live ? ' live' : '');
      b.setAttribute('aria-current', String(i === state.chapter));
      b.innerHTML = '<span class="node"></span><b></b><small></small>';
      b.querySelector('b').textContent = ch.title;
      b.querySelector('small').textContent = ch.live ? ch.era : 'not built yet';
      b.title = ch.title + ', ' + ch.era;
      b.onclick = () => goChapter(i);
      nav.appendChild(b);
    });
  }
  function goChapter(i) {
    if (i < 0 || i >= CHAPTERS.length || i === state.chapter) return;
    if (explorer.active) explorer.close();
    state.chapter = i;
    const ch = CHAPTERS[i];
    renderTimeline();
    $('#locked').hidden = !!ch.live;
    if (!ch.live) { $('#locked h2').textContent = ch.title; $('#locked p').textContent = ch.text; }
    const s = sim();
    if (s && !reduce) { s.cam.zoom = 1; s.cam.cx = s.size[0] / 2; s.cam.cy = s.size[1] / 2; }
    const card = $('#era');
    card.querySelector('small').textContent = 'Chapter ' + i + ' · ' + ch.era;
    card.querySelector('h2').textContent = ch.title;
    card.querySelector('p').textContent = ch.live ? (ch.lenses || []).join(' › ') : 'Not built yet';
    card.classList.remove('show'); void card.offsetWidth; if (!reduce) card.classList.add('show');
    $('#journal').innerHTML = '';
    if (s && s.kind === 'earth') s.journalShown = 0;
    renderSide();
    draw();
  }

  // ---------- Side panel ----------
  function renderSide() {
    const ch = CHAPTERS[state.chapter], s = sim();
    $('#c-era').textContent = 'Chapter ' + state.chapter + ' · ' + ch.era;
    $('#c-title').textContent = ch.title;
    $('#c-text').textContent = ch.text;
    $('#c-lab').hidden = !ch.lab;
    if (ch.lab) $('#c-lab').href = ch.lab;
    const li = lensIndex(s);
    $('#lenses').innerHTML = (ch.lenses || ['Not built yet']).map((l, i) => `<div class="${i === li ? 'on' : ''}">${l}</div>`).join('');
    const row = $('#layer-row'), sel = $('#layer');
    row.hidden = !(s && s.kind === 'earth');
    if (s && s.kind === 'earth' && !sel.options.length) for (const l of window.EarthDraw.LAYERS) sel.add(new Option(l.label, l.key));
    $('#journal-card').hidden = !(s && s.kind === 'earth');
    renderHud();
    renderInspect();
  }

  // The text refreshes as the world runs; the buttons are only rebuilt when
  // the selection changes, so they stay clickable.
  function setActions(key, buttons) {
    const box = $('#actions');
    if (box.dataset.key === key) {
      buttons.forEach(([label], i) => { if (box.children[i]) box.children[i].textContent = label; });
      return;
    }
    box.dataset.key = key;
    box.innerHTML = '';
    for (const [label, fn] of buttons) {
      const b = document.createElement('button');
      b.textContent = label; b.onclick = fn;
      box.appendChild(b);
    }
  }

  function renderInspect() {
    const s = sim(), box = $('#inspect');
    if (!s) { box.textContent = 'This chapter is not built yet. Travel to a lit chapter on the timeline.'; setActions('', []); return; }
    if (s.kind === 'earth') {
      const e = s.w.earth;
      if (s.selected) {
        const b = s.selected, alive = s.w.bubbles.includes(b);
        box.innerHTML = `<b>Bubble #${b.id}</b>${alive ? '' : ' (burst)'}<br>generation <b>${b.gen}</b> · age ${e.t - b.born} · size ${fmt(b.lipid)}<br>copiers <b>${fmt(b.copiers, 3)}</b> · chains ${fmt(b.chains, 3)} · split ${b.children}×`;
        setActions('b' + b.id, [[s.follow ? 'Stop following' : 'Follow it', () => { s.follow = !s.follow; if (s.follow && s.cam.zoom < 6) s.cam.zoom = 6; renderSide(); }]]);
      } else if (s.inspectCell != null) {
        const i = s.inspectCell, c = s.w.at(i);
        box.innerHTML = `<b>${e.kind(i)}</b> · water ${fmt(e.water[i])} m · ${fmt(e.temp[i], 0)} °C · light ${fmt(e.light[i])}${e.ventHeat[i] > 0.05 ? ' · <b>vent</b>' : ''}<br>` +
          window.ChemSim.SPECIES.map((sp) => `${sp.key} <b>${fmt(c[sp.key], 3)}</b>`).join(' · ');
        setActions('', []);
      } else { box.textContent = 'Click a spot of water or a bubble. Bubbles are the small rings; pink ones hold copiers.'; setActions('', []); }
      return;
    }
    const c = s.selected;
    if (c && s.w.creatures.includes(c)) {
      const sp = s.w.speciesList ? s.w.speciesList[c.sp].name : '';
      box.innerHTML = `<b>Creature #${c.id}</b> · ${sp}<br>generation ${c.gen} · age ${c.age} · energy ${fmt(c.energy, 0)}<br>ate ${c.eaten} food, ${c.poisoned} poison` +
        (c.brain ? ` · ${c.brain.synapseCount()} synapses` : '');
      setActions('c' + c.id, [
        [s.follow ? 'Stop following' : 'Follow it', () => { s.follow = !s.follow; if (s.follow && s.cam.zoom < 4) s.cam.zoom = 4; renderSide(); }],
        ['Zoom into its body →', () => enterCreature(s)],
      ]);
    } else {
      if (c) { s.selected = null; s.follow = false; }
      box.textContent = 'Click a creature to follow it. Keep zooming in on it to go inside its body, brain and cells.';
      setActions('', []);
    }
  }

  function enterCreature(s) {
    if (!s.selected) return;
    const r = cv.getBoundingClientRect();
    explorer.open(s.entry, s.selected.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    renderSide();
  }

  // ---------- Journal (Early Earth) ----------
  function renderJournal(s) {
    const j = s.w.journal, box = $('#journal');
    if (j.length === s.journalShown) return;
    const dayLen = s.w.earth.p.dayLength;
    for (let k = s.journalShown; k < j.length; k++) {
      const it = j[k], b = document.createElement('button');
      b.className = 'entry';
      const h = Math.floor(((it.t % dayLen) / dayLen) * 24);
      b.innerHTML = `<small>Day ${it.day} · ${String(h).padStart(2, '0')}:00${it.x != null ? ' · show me' : ''}</small><b></b><span></span>`;
      b.querySelector('b').textContent = it.title;
      b.querySelector('span').textContent = it.text;
      if (it.x != null) b.onclick = () => {
        s.follow = false; s.selected = null;
        s.cam.cx = it.x; s.cam.cy = it.y; s.cam.zoom = Math.max(s.cam.zoom, 5); clampCam(s);
        s.mark = { x: it.x, y: it.y }; s.inspectCell = s.w.earth.cellAt(it.x, it.y);
        renderSide();
      };
      box.prepend(b);
    }
    s.journalShown = j.length;
  }

  // ---------- Input ----------
  const pts = new Map();
  let moved = 0, pinch = null;
  cv.addEventListener('pointerdown', (ev) => {
    cv.setPointerCapture(ev.pointerId);
    pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    moved = 0;
    const s = sim();
    if (pts.size === 2 && s) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: s.cam.zoom }; }
  });
  cv.addEventListener('pointermove', (ev) => {
    const p = pts.get(ev.pointerId), s = sim();
    if (!p || !s) return;
    const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
    p.x = ev.clientX; p.y = ev.clientY;
    if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()];
      s.cam.zoom = Math.max(1, Math.min(maxZoom(s), pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d));
      clampCam(s); moved += 10; return;
    }
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 4) {
      cv.classList.add('dragging');
      s.follow = false;
      const k = baseScale(s) * s.cam.zoom;
      s.cam.cx -= dx / k; s.cam.cy -= dy / k; clampCam(s);
    }
  });
  function pointerEnd(ev) {
    const had = pts.delete(ev.pointerId);
    if (pts.size < 2) pinch = null;
    cv.classList.remove('dragging');
    if (had && moved <= 4 && ev.type === 'pointerup') click(ev);
  }
  cv.addEventListener('pointerup', pointerEnd);
  cv.addEventListener('pointercancel', pointerEnd);
  cv.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const r = cv.getBoundingClientRect();
    zoomBy(Math.exp(-ev.deltaY * 0.0015), ev.clientX - r.left, ev.clientY - r.top);
  }, { passive: false });
  cv.addEventListener('dblclick', (ev) => {
    const s = sim(); if (!s) return;
    const r = cv.getBoundingClientRect();
    if (s.kind === 'forager' && s.selected) { enterCreature(s); return; }
    zoomBy(2, ev.clientX - r.left, ev.clientY - r.top);
  });

  function click(ev) {
    const s = sim(); if (!s) return;
    const r = cv.getBoundingClientRect();
    const p = toWorld(s, ev.clientX - r.left, ev.clientY - r.top);
    const k = baseScale(s) * s.cam.zoom;
    s.mark = null;
    if (s.kind === 'earth') {
      const b = s.w.bubbleNear(p.x, p.y, Math.max(1.2, 10 / k));
      if (b) { s.selected = b; s.inspectCell = null; }
      else { s.selected = null; s.follow = false; s.inspectCell = s.w.earth.cellAt(p.x, p.y); }
    } else {
      let best = null, bd = (14 / k) ** 2;
      for (const c of s.w.creatures) { const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2; if (d < bd) { bd = d; best = c; } }
      if (best) { s.selected = best; s.follow = true; if (s.cam.zoom < 3) s.cam.zoom = 3; }
      else { s.selected = null; s.follow = false; }
    }
    renderSide();
  }

  window.addEventListener('keydown', (ev) => {
    if (explorer.active || ev.target.closest('select')) return;
    const s = sim();
    const k = ev.key;
    if (k === '[') goChapter(state.chapter - 1);
    else if (k === ']') goChapter(state.chapter + 1);
    else if (k === '+' || k === '=') zoomBy(1.4);
    else if (k === '-' || k === '_') zoomBy(1 / 1.4);
    else if (k === ' ' && ev.target === cv) { ev.preventDefault(); togglePlay(); }
    else if (k === 'Escape' && s) {
      if (s.follow) s.follow = false;
      else if (s.selected || s.inspectCell != null) { s.selected = null; s.inspectCell = null; }
      else fit();
      renderSide();
    } else if (s && k.startsWith('Arrow') && ev.target === cv) {
      ev.preventDefault();
      const step = 60 / (baseScale(s) * s.cam.zoom);
      s.follow = false;
      if (k === 'ArrowLeft') s.cam.cx -= step; if (k === 'ArrowRight') s.cam.cx += step;
      if (k === 'ArrowUp') s.cam.cy -= step; if (k === 'ArrowDown') s.cam.cy += step;
      clampCam(s);
    }
  });
  $('#zin').onclick = () => zoomBy(1.5);
  $('#zout').onclick = () => zoomBy(1 / 1.5);
  $('#zfit').onclick = fit;
  $('#layer').onchange = () => { const s = sim(); if (s) s.layer = $('#layer').value; };
  function togglePlay() { state.running = !state.running; $('#play').textContent = state.running ? 'Pause' : 'Play'; }
  $('#play').onclick = togglePlay;
  if (!state.running) $('#play').textContent = 'Play';

  // ---------- Drawing ----------
  function fitCanvas() {
    const dpr = devicePixelRatio || 1, [w, h] = viewSize();
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function drawLocked(ctx, w, h) {
    // A dim starfield while a chapter waits to be built.
    ctx.fillStyle = tok('--dish'); ctx.fillRect(0, 0, w, h);
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    ctx.fillStyle = 'rgba(220,235,228,0.35)';
    for (let i = 0; i < 160; i++) { ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, rnd() * 1.4, 0, Math.PI * 2); ctx.fill(); }
  }

  function bodyPath(ctx, sp, sz) {
    ctx.beginPath();
    if (sp === 1) { ctx.moveTo(sz * 1.9, 0); ctx.lineTo(-sz, sz * 0.55); ctx.lineTo(-sz, -sz * 0.55); }
    else if (sp === 2) { ctx.arc(0, 0, sz * 0.95, 0.5, Math.PI * 2 - 0.5); ctx.lineTo(sz * 1.7, 0); }
    else { ctx.moveTo(sz * 1.6, 0); ctx.lineTo(-sz, sz); ctx.lineTo(-sz * 0.5, 0); ctx.lineTo(-sz, -sz); }
    ctx.closePath();
  }

  function drawForager(ctx, s, w, h) {
    const world = s.w, k = baseScale(s) * s.cam.zoom, size = s.size[0];
    ctx.fillStyle = colours.dish; ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2 - s.cam.cx * k, h / 2 - s.cam.cy * k);
    ctx.scale(k, k);
    ctx.fillStyle = '#121a16'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = colours.dishLine; ctx.lineWidth = 1 / k;
    ctx.beginPath();
    for (let i = 100; i < size; i += 100) { ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.moveTo(0, i); ctx.lineTo(size, i); }
    ctx.stroke();
    for (const spot of world.soil || []) {
      const r = world.p.soilRadius * 2.2;
      const g = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, r);
      g.addColorStop(0, 'rgba(176,132,82,0.28)'); g.addColorStop(1, 'rgba(176,132,82,0)');
      ctx.fillStyle = g; ctx.fillRect(spot.x - r, spot.y - r, r * 2, r * 2);
    }
    const living = world.p.plantMode === 'living';
    const GREEN = window.WorldSim.GREEN;
    for (const pl of world.plants) {
      ctx.fillStyle = world.plantColour(pl) === GREEN ? colours.green : colours.violet;
      ctx.globalAlpha = living && pl.size < world.p.biteSize ? 0.4 : 1;
      ctx.beginPath(); ctx.arc(pl.x, pl.y, living ? 1 + 2.6 * pl.size : 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const c of world.creatures) {
      const sz = 4 + Math.min(4, c.energy / 40);
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.heading);
      ctx.fillStyle = c.meat ? colours.danger : (c.sp === 1 ? '#f0d58c' : '#e8efe9');
      bodyPath(ctx, c.sp, sz); ctx.fill();
      ctx.restore();
    }
    const c = s.selected;
    if (c && world.creatures.includes(c)) {
      ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.2 / k;
      ctx.beginPath(); ctx.moveTo(c.x, c.y);
      ctx.arc(c.x, c.y, c.g.senseRange, c.heading - c.g.fov / 2, c.heading + c.g.fov / 2); ctx.closePath(); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 2 / k;
      ctx.beginPath(); ctx.arc(c.x, c.y, 11, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    const ctx = fitCanvas(), [w, h] = viewSize(), s = sim();
    if (!s) { drawLocked(ctx, w, h); return; }
    if (s.follow && s.selected) {
      const alive = s.kind === 'earth' ? s.w.bubbles.includes(s.selected) : s.w.creatures.includes(s.selected);
      if (!alive) { s.follow = false; renderSide(); }
      else { s.cam.cx = s.selected.x; s.cam.cy = s.selected.y; clampCam(s); }
    }
    if (s.kind === 'earth') {
      window.EarthDraw.drawWorld(ctx, s.painter, w, h, s.cam, {
        layer: s.layer || 'nature', selected: s.selected, mark: s.mark, background: tok('--dish'),
      });
    } else drawForager(ctx, s, w, h);
  }

  function clockText(s) {
    if (!s) return '';
    if (s.kind === 'earth') {
      const e = s.w.earth, hh = e.dayPhase * 24, m = Math.floor((hh % 1) * 60);
      const tide = e.seaLevel > e.p.tideRange * 0.8 ? 'high tide' : e.seaLevel < -e.p.tideRange * 0.8 ? 'low tide' : 'tide ' + (Math.cos(e.tidePhase * Math.PI * 2) > 0 ? 'rising' : 'falling');
      return `Day ${e.day} · ${String(Math.floor(hh)).padStart(2, '0')}:${String(m).padStart(2, '0')} · ${tide}`;
    }
    const st = s.w;
    const gens = st.creatures.reduce((m, c) => Math.max(m, c.gen), 0);
    return `t ${st.t} · ${st.creatures.length} creatures · generation ${gens}`;
  }

  // Steps per frame for each kind of world at "Normal".
  function stepsFor(s) { return s.kind === 'earth' ? 3 : 5; }

  function advance(s, n) {
    for (let i = 0; i < n; i++) {
      if (s.kind === 'forager') {
        if (s.w.extinctAt !== null && s.w.extinctAt !== undefined) break;
        s.w.step();
        if (explorer.active) explorer.record();
      } else s.w.step();
    }
  }

  let carry = 0;
  function loop() {
    const s = sim(), sp = $('#speed').value;
    if (s && state.running && !document.hidden) {
      if (explorer.active) advance(s, explorer.speed);
      else if (sp === 'ff') { const t0 = performance.now(); while (performance.now() - t0 < 35) advance(s, 5); }
      else {
        carry += stepsFor(s) * +sp;
        const n = Math.floor(carry); carry -= n;
        advance(s, n);
        if (s.kind === 'earth') s.painter.moveTracers(n, 700);
      }
    }
    state.frame++;
    if (explorer.active) explorer.draw();
    else if (!(sp === 'ff' && state.running) || state.frame % 5 === 0) draw();
    if (state.frame % 15 === 0) {
      $('#clock').textContent = clockText(s);
      if (s && s.kind === 'earth') renderJournal(s);
      if (s && !explorer.active) { renderInspect(); renderHud(); }
    }
    requestAnimationFrame(loop);
  }

  // ---------- Story: a guided path through how this world was made ----------
  // Each step moves the camera, picks what to show and says what to look for.
  // The story follows the timeline: the planet first, then chemistry, then
  // bubbles, then creatures with brains, then whole ecosystems.
  const STORY = [
    { ch: 0, focus: 'fit', layer: 'nature', title: 'A young planet',
      text: 'Four billion years ago Earth had land, sea and sky, but nothing alive. This coast is our stand-in: rock on top, a shallow shore in the middle, deep sea below.',
      look: 'Everything you see comes from a few simple rules for ground, water, sun and heat. There is no designer and no goal.' },
    { ch: 0, focus: 'fit', layer: 'light', title: 'The sun',
      text: 'The sun rises and sets. Light is strongest in shallow water and fades with depth. It is the first source of energy in this world.',
      look: 'Watch the bright band along the shore grow at noon and vanish at night.' },
    { ch: 0, focus: 'vent', layer: 'temp', zoom: 3, title: 'Heat from below',
      text: 'On the deep floor, hot vents leak heat and minerals from inside the planet. Many scientists think life may have started near vents like these, in the dark.',
      look: 'The vents are hot spots. Currents smear their heat into plumes.' },
    { ch: 0, focus: 'pool', layer: 'nature', zoom: 4, title: 'Tides and tide pools',
      text: 'The sea rises and falls. When it falls, water is trapped in hollows of rock and starts to dry in the sun. Whatever is dissolved gets more concentrated.',
      look: 'At low tide, look for small pools cut off from the sea along the shore. The next high tide floods them again.' },
    { ch: 0, focus: 'fit', layer: 'nature', title: 'Currents mix everything',
      text: 'Slow eddies and the tidal flow carry the water around. Nothing is pushed toward a goal; molecules just drift and spread.',
      look: 'The pale streaks are currents. Follow one and see how far it carries things.' },
    { ch: 0, focus: 'fit', layer: 'energy', title: 'Energy molecules',
      text: 'Sunlight in the shallows and heat at the vents turn simple dissolved molecules into energy-rich ones. They fall apart again if nothing uses them.',
      look: 'Energy appears in the sunlit shallows by day and near the vents all the time.' },
    { ch: 0, focus: 'fit', layer: 'blocks', title: 'Building blocks',
      text: 'Energy plus simple molecules make building blocks, a stand-in for amino acids and nucleotides. Warmth makes this faster.',
      look: 'Building blocks pile up where energy is made and the water is warm.' },
    { ch: 0, focus: 'pool', layer: 'chains', zoom: 4, title: 'Chains in drying pools',
      text: 'Blocks join into chains, but water breaks chains apart. So chains build up where there is little water: in drying tide pools. Wet and dry cycles are one leading idea for how the first long molecules formed.',
      look: 'Chains glow in pools at low tide and fade when the sea returns.' },
    { ch: 0, focus: 'copiers', layer: 'copiers', zoom: 3, title: 'Copiers: molecules that make more of themselves',
      text: 'Very rarely, two chains make a copier: a molecule that helps build more of itself from blocks. Alone it dies out. With enough company, it spreads as self-copying patches.',
      look: 'Copiers often appear and vanish many times before they take hold. Check the journal for "died out" and "arose again".' },
    { ch: 0, focus: 'vent', layer: 'oils', zoom: 4, title: 'Oils curl into bubbles',
      text: 'Vents also make oily molecules. When oils crowd together they curl up into bubbles with a skin, the way soap does. A bubble traps whatever was dissolved around it.',
      look: 'Bubbles are the small rings near the vents.' },
    { ch: 0, focus: 'bubble', layer: 'nature', zoom: 7, title: 'Protocells: bubbles that pass things on',
      text: 'A bubble holding copiers pulls in oils faster, grows, and splits in two. Both halves share what was inside. Nothing tells bubbles to keep copiers, but those that do leave more daughters. That is heredity and selection, before life.',
      look: 'Pink bubbles carry copiers. Watch the one you are following grow and split.' },
    { ch: 1, focus: 'fit', title: 'First cells (next to build)',
      text: 'From protocells come the first true cells: they swim toward food, divide and compete. This chapter will run in the same Earth, so you can watch bubbles become cells.',
      look: 'Not built yet. The story jumps ahead to animals with brains.' },
    { ch: 5, focus: 'fit', title: 'Bodies with an eye and a brain',
      text: 'Hundreds of millions of years later, animals have bodies, eyes and brains. These creatures see green and violet plants. One colour is food, the other poison, and nobody tells them which.',
      look: 'Creatures are the arrows. Plants are green or violet dots on drifting fertile soil.' },
    { ch: 5, focus: 'creature', zoom: 4, title: 'Follow one creature',
      text: 'Each creature carries a small spiking brain that wires itself while it lives and learns from what it eats. Its genes set how the brain is built, never what it knows.',
      look: 'The fan in front of it is its eye. Watch whether it bites food and avoids poison.' },
    { ch: 5, focus: 'enter', title: 'Inside the body, brain and cells',
      text: 'Zoom into the creature. Senses feed the brain and the brain drives the muscles. Click the brain to see neurons fire, then click any neuron to meet a single cell.',
      look: 'Close the inside view to come back to the world.' },
    { ch: 6, focus: 'fit', title: 'Ecosystems',
      text: 'Add hunters, and plant eaters must see them and flee. Chases, booms, crashes and extinctions emerge from nothing but local rules, as in the Cambrian seas.',
      look: 'Red arrows are hunters. Watch how the numbers of hunters and prey rise and fall together.' },
  ];

  const story = { on: false, i: 0 };
  function findFocus(s, focus) {
    if (s.kind === 'earth') {
      const e = s.w.earth;
      if (focus === 'vent' && e.vents.length) return { x: e.vents[0].x, y: e.vents[0].y };
      if (focus === 'pool' || focus === 'copiers') {
        const f = focus === 'copiers' ? s.w.f.copiers : null;
        let best = -1, bi = -1;
        for (let i = 0; i < e.n; i++) {
          let v;
          if (f) v = f[i];
          else v = !e.connected[i] && e.water[i] > 0.01 ? 2 : Math.abs(e.ground[i]) < e.p.tideRange ? 1 : 0;
          if (v > best) { best = v; bi = i; }
        }
        if (bi >= 0 && best > 0) return { x: bi % e.cols, y: Math.floor(bi / e.cols) };
      }
      if (focus === 'bubble') {
        let best = null;
        for (const b of s.w.bubbles) if (!best || b.copiers > best.copiers) best = b;
        return best ? { bubble: best } : null;
      }
      return null;
    }
    if (focus === 'creature' || focus === 'enter') {
      const c = s.w.creatures.find((x) => x.brain) || s.w.creatures[0];
      return c ? { creature: c } : null;
    }
    return null;
  }

  function showStep() {
    const st = STORY[story.i], box = $('#story');
    box.hidden = false;
    $('#story-count').textContent = `Story · ${story.i + 1} of ${STORY.length}`;
    $('#story-title').textContent = st.title;
    $('#story-text').textContent = st.text;
    $('#story-look').textContent = st.look;
    $('#story-prev').disabled = story.i === 0;
    $('#story-next').textContent = story.i === STORY.length - 1 ? 'Finish' : 'Next →';
    if (explorer.active && st.focus !== 'enter') explorer.close();
    goChapter(st.ch);
    const s = sim();
    if (!s) return;
    s.selected = null; s.follow = false; s.inspectCell = null; s.mark = null;
    if (s.kind === 'earth') { s.layer = st.layer || 'nature'; $('#layer').value = s.layer; }
    const z = st.zoom || 1;
    const t = findFocus(s, st.focus);
    if (!t && (st.focus === 'bubble' || st.focus === 'copiers')) {
      $('#story-look').textContent = st.look + ' Nothing like this has formed yet in this run: set the speed to Fast-forward for a while, then come back to this step.';
    }
    if (!t) { s.cam = { cx: s.size[0] / 2, cy: s.size[1] / 2, zoom: z }; }
    else if (t.bubble) { s.selected = t.bubble; s.follow = true; s.cam.zoom = z; }
    else if (t.creature) { s.selected = t.creature; s.follow = true; s.cam.zoom = Math.max(z, 4); }
    else { s.cam = { cx: t.x, cy: t.y, zoom: z }; s.mark = { x: t.x, y: t.y }; }
    clampCam(s);
    renderSide();
    if (st.focus === 'enter' && s.selected) setTimeout(() => enterCreature(s), reduce ? 0 : 500);
  }
  function startStory(i) { story.on = true; story.i = i || 0; showStep(); }
  function endStory() { story.on = false; $('#story').hidden = true; }
  $('#story-btn').onclick = () => (story.on ? endStory() : startStory(0));
  $('#story-next').onclick = () => { if (story.i < STORY.length - 1) { story.i++; showStep(); } else endStory(); };
  $('#story-prev').onclick = () => { if (story.i > 0) { story.i--; showStep(); } };
  $('#story-close').onclick = endStory;

  // Start at the beginning of the timeline, or at a chapter named in the URL.
  const start = CHAPTERS.findIndex((c) => c.key === (location.hash || '').slice(1));
  state.chapter = -1;
  goChapter(start >= 0 ? start : 0);
  if (location.hash === '#story') startStory(0);
  window.addEventListener('resize', () => { const s = sim(); if (s) clampCam(s); });
  requestAnimationFrame(loop);
})();
