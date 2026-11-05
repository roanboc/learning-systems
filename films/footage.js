// Real footage for the films: the site's own engines, run with fixed seeds.
//
// A film never plays a recording. Each footage kind builds the same world the
// World Viewer and Gaia build (seed 3), warms it up a slice at a time so the
// page never freezes, and then steps it as film time passes. Played straight
// through, the same seed gives the same footage every time.
//
//   Footage.get('cells')             the world for a kind (built on first ask)
//   Footage.warm(ms)                 warm the queued worlds for up to ms
//   f.ready, f.advance(dt)           step it by dt seconds of film time
//   f.draw(ctx, w, h, cam, opts)     draw it through a camera
//
// Kinds: earth, cells, colonies, nerves, ecosystems. Cameras are in map cells
// ({ cx, cy, zoom }, zoom 1 shows the whole coast), for every kind.
(function (root) {
  'use strict';

  const SEED = 3;
  const DISH = '#0b100e';
  // Chemistry steps before anything lives (as LifeSim.makeLife and Gaia.make),
  // then steps of life so the footage opens on a lived-in coast.
  const PLAN = {
    earth: { chem: 260, life: 0, rate: 6 },   // opens in the morning: tide pools dry by day
    cells: { chem: 300, life: 250, rate: 20 },
    colonies: { chem: 300, life: 700, rate: 20 },
    nerves: { chem: 300, life: 700, rate: 18 },
    ecosystems: { chem: 300, life: 500, rate: 18 },
  };

  const worlds = {};
  const queue = [];

  function make(kind) {
    const plan = PLAN[kind];
    const chem = root.ChemSim.makeWorld('full', SEED);
    if (kind !== 'earth') chem.p.maxBubbles = 0;
    const painter = new root.EarthDraw.MapPainter(chem);
    const f = { kind, chem, painter, ready: false, steps: 0, acc: 0, life: null, world: null, chemSteps: 0, lifeSteps: 0 };

    f.warmSlice = function (until) {
      while (performance.now() < until) {
        if (f.chemSteps < plan.chem) { chem.step(); f.chemSteps++; painter.moveTracers(1, 300); continue; }
        if (!f.life && !f.world && kind !== 'earth') {
          if (kind === 'ecosystems') {
            const G = root.Gaia;
            f.world = new root.WorldSim.World(Object.assign({ seed: SEED }, G.ORGANISMS.ecosystems, { coast: chem }));
          } else {
            f.life = new root.LifeSim.Life(chem, { stage: kind });
          }
        }
        if (f.lifeSteps < plan.life) { f.stepOnce(); f.lifeSteps++; continue; }
        f.ready = true;
        return true;
      }
      return false;
    };

    f.stepOnce = function () {
      if (f.world) f.world.step();
      else if (f.life) f.life.step();
      else chem.step();
      painter.moveTracers(1, 300);
      f.steps++;
    };

    // Step by dt seconds of film time. A slow device catches up a few steps
    // at a time rather than freezing.
    f.advance = function (dt, maxSteps) {
      if (!f.ready) return;
      f.acc += dt * plan.rate;
      let n = 0;
      const cap = maxSteps || 4;
      while (f.acc >= 1 && n < cap) { f.stepOnce(); f.acc -= 1; n++; }
      if (f.acc > cap) f.acc = cap;
    };

    f.draw = function (ctx, w, h, cam, opts) {
      const o = opts || {};
      root.EarthDraw.drawWorld(ctx, painter, w, h, cam, { layer: o.layer || 'nature', background: DISH, tracers: o.tracers });
      if (f.life) root.LifeDraw.drawCells(ctx, f.life, w, h, cam, {});
      if (f.world) drawCreatures(ctx, f.world, w, h, cam, o);
    };

    f.earth = chem.earth;
    return f;
  }

  // Seaweed and creatures on the coast, through a camera in map cells.
  function drawCreatures(ctx, world, w, h, cam, o) {
    const e = world.earth || world.p.coast.earth, sx = world.sx;
    const k = Math.min(w / e.cols, h / e.rows) * cam.zoom / sx;
    ctx.save();
    ctx.translate(w / 2 - cam.cx * sx * k, h / 2 - cam.cy * sx * k);
    ctx.scale(k, k);
    const GREEN = root.WorldSim.GREEN;
    for (const pl of world.plants) {
      ctx.fillStyle = world.plantColour(pl) === GREEN ? '#5cc46d' : '#a97ff2';
      ctx.globalAlpha = pl.size < world.p.biteSize ? 0.4 : 1;
      ctx.beginPath(); ctx.arc(pl.x, pl.y, 1 + 2.6 * pl.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const c of world.creatures) {
      const sz = 4 + Math.min(4, c.energy / 40);
      root.CreatureDraw.draw(ctx, c, c.x, c.y, sz, c.meat ? '#e8553f' : '#e8efe9', { px: k });
    }
    const sel = o.selected;
    if (sel && world.creatures.includes(sel)) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2 / k;
      ctx.beginPath(); ctx.arc(sel.x, sel.y, 12, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function get(kind) {
    if (!worlds[kind]) { worlds[kind] = make(kind); queue.push(worlds[kind]); }
    return worlds[kind];
  }

  // Warm the queue in order for up to ms milliseconds.
  function warm(ms) {
    const until = performance.now() + ms;
    for (const f of queue) {
      if (f.ready) continue;
      if (!f.warmSlice(until)) return false;
    }
    return true;
  }

  function progress() {
    let done = 0, all = 0;
    for (const f of queue) {
      const p = PLAN[f.kind];
      all += p.chem + p.life;
      done += f.chemSteps + f.lifeSteps;
    }
    return all ? done / all : 1;
  }

  root.Footage = { get, warm, progress, PLAN, SEED, DISH, all: () => queue.slice() };
})(typeof self !== 'undefined' ? self : this);
