// Live previews for the home page: the real engines, run small. Scripts load
// only when a preview is first opened, and a world warms up a little at a
// time so the page never freezes.
//
//   const p = Previews.mount('cells', canvas, { onStatus(text) {}, maxDpr: 2 });
//   p.stop();
//
// Kinds: earth, cells, colonies, bodies, nerves, brains, ecosystems, tissue
// (SystemCatalogue's "preview" field).
(function (root) {
  'use strict';

  const SELF = document.currentScript;
  const ROOT = SELF && SELF.src ? new URL('../', SELF.src).href : '';
  const SCRIPTS = {
    earth: ['lib/earth.js', 'lib/chemistry.js', 'environments/early-earth/draw.js'],
    life: ['lib/earth.js', 'lib/chemistry.js', 'lib/life.js', 'environments/early-earth/draw.js', 'environments/first-cells/draw.js'],
    forager: ['lib/brain.js', 'environments/forager-worlds/engine.js'],
    tissue: ['lib/brain.js', 'nervous-systems/tissue-lab/engine.js', 'nervous-systems/tissue-lab/draw.js'],
  };
  const ENGINE = { earth: 'earth', cells: 'life', colonies: 'life', bodies: 'life', nerves: 'life', brains: 'forager', ecosystems: 'forager', tissue: 'tissue' };
  const DISH = '#0b100e';

  const loaded = {};
  function script(path) {
    if (!loaded[path]) {
      loaded[path] = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = ROOT + path;
        s.onload = resolve;
        s.onerror = () => reject(new Error('Could not load ' + path));
        document.head.appendChild(s);
      });
    }
    return loaded[path];
  }
  async function need(list) { for (const p of list) await script(p); }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Each world: build() returns { warm(), step(), draw(ctx, w, h), status() }.
  // warm() runs one slice of set-up work and returns true when it is done.
  const WORLDS = {
    earth() {
      const w = root.ChemSim.makeWorld('full', 3), painter = new root.EarthDraw.MapPainter(w);
      let n = 0;
      return {
        warm() { w.step(); painter.moveTracers(1, 300); return ++n >= 60; },
        step() { w.step(); painter.moveTracers(1, 300); },
        draw(ctx, cw, ch) { root.EarthDraw.drawWorld(ctx, painter, cw, ch, { cx: 80, cy: 52, zoom: 1.5 }, { background: DISH }); },
        status: () => (n < 60 ? 'The sea is warming up' : ''),
        perFrame: 1,
      };
    },
    life(stage) {
      // As LifeSim.makeLife, but the chemistry's head start runs a slice at a time.
      const chem = root.ChemSim.makeWorld('full', 3);
      chem.p.maxBubbles = 0;
      const painter = new root.EarthDraw.MapPainter(chem);
      let L = null, n = 0;
      const cam = { cx: 80, cy: 52, zoom: 1.5 };
      return {
        warm() {
          if (n < 300) { chem.step(); n++; painter.moveTracers(1, 300); return false; }
          L = new root.LifeSim.Life(chem, { stage });
          return true;
        },
        step() { L.step(); painter.moveTracers(1, 300); },
        draw(ctx, cw, ch) {
          root.EarthDraw.drawWorld(ctx, painter, cw, ch, cam, { background: DISH });
          if (L) root.LifeDraw.drawCells(ctx, L, cw, ch, cam, {});
        },
        status: () => (L ? '' : 'Food is building up before the cells arrive'),
        perFrame: 1,
      };
    },
    forager(kind) {
      const { World, DEFAULTS } = root.WorldSim;
      const species = kind === 'ecosystems'
        ? [{ name: 'Prey', mind: 'brain', count: 50 }, { name: 'Hunters', mind: 'brain', count: 10, diet: 'meat' }]
        : [{ name: 'Small brains', mind: 'brain', count: 30, geneInit: { hidden: [6, 10] } }, { name: 'Large brains', mind: 'brain', count: 30, geneInit: { hidden: [28, 36] } }];
      const world = new World(Object.assign({}, DEFAULTS, { seed: 1, seasonLength: 0, plantMode: 'living', species }));
      let n = 0;
      return {
        warm() { world.step(); return ++n >= 400; },
        step() { world.step(); },
        draw(ctx, cw, ch) { drawForager(ctx, world, cw, ch); },
        status: () => (n < 400 ? 'Creatures are learning the plants' : ''),
        perFrame: 2,
      };
    },
    tissue() {
      const tissue = new root.TissueSim.Tissue({ seed: 3 });
      const col = { dish: DISH, exc: '#d9eadc', inh: '#e0705a', newborn: '#5cc46d', astro: '#d4ad45', micro: '#8aa2e6',
        vessel: '#c0392b', tag: '#f0a050', debris: '#7d8a84', syn: '#9fb8b0', focus: '#ffffff' };
      let n = 0;
      return {
        warm() { for (let i = 0; i < 20; i++) tissue.step(); n += 20; return n >= 3000; },
        step() { tissue.step(); },
        draw(ctx, cw, ch) { root.TissueDraw.drawTissue(ctx, tissue, cw, ch, col, { view: { x0: 0, y0: 0.2, size: 1 } }); },
        status: () => (n < 3000 ? 'Neurons are wiring themselves' : ''),
        perFrame: 2,
      };
    },
  };

  function drawForager(ctx, world, w, h) {
    const size = world.p.size, k = Math.max(w, h) / size, off = (size * k - h) / 2;
    ctx.fillStyle = DISH;
    ctx.fillRect(0, 0, w, h);
    const living = world.p.plantMode === 'living';
    const GREEN = root.WorldSim.GREEN;
    for (const pl of world.plants) {
      ctx.fillStyle = world.plantColour(pl) === GREEN ? '#5cc46d' : '#a97ff2';
      ctx.globalAlpha = living && pl.size < world.p.biteSize ? 0.45 : 1;
      ctx.beginPath();
      ctx.arc(pl.x * k, pl.y * k - off, (living ? 1 + 2.6 * pl.size : 2.4) * k, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const c of world.creatures) {
      ctx.save();
      ctx.translate(c.x * k, c.y * k - off);
      ctx.rotate(c.heading);
      ctx.fillStyle = c.meat ? '#e07a62' : c.sp === 1 ? '#f0d58c' : '#e8efe9';
      const s = 1.3 * Math.max(1, k * 2);
      ctx.beginPath(); ctx.moveTo(5 * s, 0); ctx.lineTo(-3.5 * s, 3.4 * s); ctx.lineTo(-1.8 * s, 0); ctx.lineTo(-3.5 * s, -3.4 * s); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function mount(kind, canvas, opts) {
    const o = opts || {}, engine = ENGINE[kind];
    let stopped = false, raf = 0, sim = null, warming = true;
    const say = (t) => { if (o.onStatus) o.onStatus(t); };
    const ctx = canvas.getContext('2d');
    // Layout size, so a canvas being scaled by a CSS transform keeps its pixels.
    function size() {
      const w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(o.maxDpr || 2, devicePixelRatio || 1);
      const pw = Math.max(1, Math.round(w * dpr)), ph = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return [w, h];
    }
    function frame() {
      if (stopped) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden || !sim) return;
      const t0 = performance.now();
      if (warming) {
        while (performance.now() - t0 < 9) { if (sim.warm()) { warming = false; break; } }
        say(sim.status());
      } else if (!reduce) {
        for (let i = 0; i < sim.perFrame; i++) sim.step();
      }
      const [w, h] = size();
      sim.draw(ctx, w, h);
      if (reduce && !warming) { cancelAnimationFrame(raf); raf = 0; }
    }
    if (!engine) { say('No preview for this one yet'); return { stop() {} }; }
    say('Loading the simulation');
    need(SCRIPTS[engine]).then(() => {
      if (stopped) return;
      sim = WORLDS[engine](kind);
      raf = requestAnimationFrame(frame);
    }).catch((e) => say(e.message));
    return { stop() { stopped = true; cancelAnimationFrame(raf); sim = null; } };
  }

  root.Previews = { mount, ENGINE };
})(typeof self !== 'undefined' ? self : this);
