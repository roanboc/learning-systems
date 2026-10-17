// Gaia: one world for every level of life.
//
// Every chapter of the timeline lives on the same Earth (lib/earth.js) with
// the same chemistry in its water (lib/chemistry.js):
//
//   earth        the young coast, no life (Early Earth)
//   genes        the same chemistry, with protocells whose copiers have jobs:
//                making the protocell's own skin and building blocks
//   cells, colonies, bodies, nerves
//                cells eating the chemistry (lib/life.js)
//   brains, ecosystems
//                plants and creatures with brains and bodies (the Forager
//                Worlds engine with its `coast` setting): seaweed grows from
//                sunlight and the water's building blocks, creatures swim in
//                the same currents, droppings and bodies go back into the
//                water as blocks.
//
// Gaia.make({ era, seed }) builds any of them and gives back the parts:
// { era, chem, earth, life, world, step() }. Each era is one level of
// complexity in the same world.
//
// Organisms pass from one era to the next. In the Brains era the first
// creatures descend from real Nerve nets bodies (graduate()): a body's
// contracting cells set how fast its creature swims, its nerve cells decide
// which line it founds (more nerve cells, larger brain), and its cells' genes
// set how far it senses and when it breeds.
//
// No DOM here; runs in the browser and in Node.
(function (root) {
  'use strict';

  const node = typeof module !== 'undefined' && module.exports;
  const ChemSim = () => (node ? require('./chemistry.js') : root.ChemSim);
  const LifeSim = () => (node ? require('./life.js') : root.LifeSim);
  const WorldSim = () => (node ? require('../environments/forager-worlds/engine.js') : root.WorldSim);

  const ERAS = ['earth', 'genes', 'cells', 'colonies', 'bodies', 'nerves', 'brains', 'ecosystems'];

  // Creatures for the organism eras, as the World Viewer chapters have them.
  // The coast is 900 units wide (5.6 units per map cell): at 600, too few
  // prey fit on it, and hunters boom, empty the sea and starve.
  const ORGANISMS = {
    brains: {
      size: 900,
      seasonLength: 0,
      species: [
        { name: 'Small brains', mind: 'brain', count: 30, geneInit: { hidden: [6, 10] } },
        { name: 'Large brains', mind: 'brain', count: 30, geneInit: { hidden: [28, 36] } },
      ],
    },
    ecosystems: {
      size: 900,
      // Hunters are bigger and need water at least a metre deep, so the
      // shallows are a refuge for prey. Without one, hunters die out.
      huntDepth: 1,
      seasonLength: 0,
      species: [
        { name: 'Prey', mind: 'brain', count: 50 },
        { name: 'Hunters', mind: 'brain', count: 10, diet: 'meat' },
      ],
    },
  };

  // The coast's water needs a head start before anything can live on it.
  const WARMUP = 300;

  // Steps a Nerve nets world runs before its bodies graduate, when Brains is
  // built without one.
  const GRADUATE_AFTER = 100;

  const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));

  // The bodies of a Nerve nets world (lib/life.js) that are ready to become
  // creatures: at least `minCells` cells, with contracting cells to swim and
  // germ cells to breed. Each one gives a founder { genes, origin } for the
  // Forager engine (its `founders` setting). Bodies with nerve cells first,
  // then bigger bodies.
  function graduate(life, opts) {
    const o = Object.assign({ minCells: 6 }, opts || {});
    const L = LifeSim();
    const bodies = new Map();
    for (const c of life.cells) {
      if (c.clumpSize < o.minCells) continue;
      let b = bodies.get(c.clump);
      if (!b) bodies.set(c.clump, (b = { lead: c.lead ? c.lead.id : c.id, cells: [], movers: 0, germ: 0, nerve: 0, generalist: 0 }));
      b.cells.push(c);
      if (c.role === L.MOVER) b.movers++;
      else if (c.role === L.GERM) b.germ++;
      else if (c.role === L.NERVE) b.nerve++;
      else b.generalist++;
    }
    const ready = [...bodies.values()].filter((b) => b.movers > 0 && b.germ > 0);
    ready.sort((a, b) => (b.nerve > 0) - (a.nerve > 0) || b.cells.length - a.cells.length || a.lead - b.lead);
    return ready.map((b) => {
      const n = b.cells.length, mean = (k) => b.cells.reduce((s, c) => s + c.g[k], 0) / n;
      const muscle = (b.movers + b.nerve) / n;
      return {
        genes: {
          // Contracting cells beating in step make a fast swimmer.
          speed: 0.6 + 1.4 * muscle * (0.5 + 0.5 * mean('sync')),
          // Cells that follow food well (tumble) make a creature that senses far.
          senseRange: lerp(40, 80, mean('tumble')),
          // Cells that divide late make a creature that breeds late.
          reproEnergy: lerp(100, 160, (mean('divideAt') - 1.8) / 0.6),
          // Nerve cells are the first neurons (used where a species sets no brain size).
          hidden: Math.min(48, 4 + 4 * b.nerve),
        },
        origin: { body: b.lead, cells: n, movers: b.movers, germ: b.germ, nerve: b.nerve, generalist: b.generalist, step: life.chem.t },
      };
    });
  }

  // Shares founders among species. A species with its own brain size range
  // takes bodies by nerve cells: the bodies with most nerve cells found the
  // species with the largest brains.
  function foundersFor(species, founders) {
    const byBrain = species.filter((sp) => sp.geneInit && sp.geneInit.hidden);
    if (byBrain.length < 2) return species.map((sp) => Object.assign({}, sp, { founders }));
    const order = [...byBrain].sort((a, b) => a.geneInit.hidden[0] - b.geneInit.hidden[0]);
    const sorted = [...founders].sort((a, b) => a.origin.nerve - b.origin.nerve || b.origin.cells - a.origin.cells);
    return species.map((sp) => {
      const r = order.indexOf(sp);
      if (r < 0) return Object.assign({}, sp, { founders });
      const lo = Math.floor(sorted.length * r / order.length), hi = Math.floor(sorted.length * (r + 1) / order.length);
      return Object.assign({}, sp, { founders: sorted.slice(lo, Math.max(hi, lo + 1)) });
    });
  }

  function make(opts) {
    const o = Object.assign({ era: 'earth', seed: 3 }, opts || {});
    if (!ERAS.includes(o.era)) throw new Error('Unknown era: ' + o.era);
    const g = { era: o.era, seed: o.seed, chem: null, earth: null, life: null, world: null };
    if (o.era === 'earth' || o.era === 'genes') {
      g.chem = ChemSim().makeWorld(o.era === 'genes' ? 'genes' : 'full', o.seed);
      g.step = () => g.chem.step();
    } else if (o.era === 'brains' || o.era === 'ecosystems') {
      const { World } = WorldSim();
      const p = Object.assign({ seed: o.seed }, ORGANISMS[o.era], o.world || {});
      if (o.era === 'brains' && o.from !== false) {
        // The first creatures graduate from a Nerve nets world: the one given
        // (a Gaia or a lib/life.js world), or one grown here. A world grown
        // here hands over its coast too, so time runs on; a given one keeps
        // its own, and Brains gets a fresh copy of the same coast.
        let life = o.from && (o.from.life || o.from);
        if (!life) {
          life = LifeSim().makeLife('nerves', o.seed, o.life);
          for (let i = 0; i < GRADUATE_AFTER; i++) life.step();
          g.chem = life.chem;
        }
        g.founders = graduate(life);
        if (g.founders.length) p.species = foundersFor(p.species, g.founders);
      }
      if (!g.chem) {
        g.chem = ChemSim().makeWorld('full', o.seed);
        g.chem.p.maxBubbles = 0;
        for (let i = 0; i < WARMUP; i++) g.chem.step();
      }
      g.world = new World(Object.assign(p, { coast: g.chem }));
      g.step = () => g.world.step();
    } else {
      // Same as LifeSim.makeLife: the cell chapters keep their results.
      g.life = LifeSim().makeLife(o.era, o.seed, o.life);
      g.chem = g.life.chem;
      g.step = () => g.life.step();
    }
    g.earth = g.chem.earth;
    return g;
  }

  const api = { ERAS, ORGANISMS, GRADUATE_AFTER, graduate, make };
  if (node) module.exports = api;
  else root.Gaia = api;
})(typeof self !== 'undefined' ? self : this);
