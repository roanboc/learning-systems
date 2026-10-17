// Gaia: one world for every level of life.
//
// Every chapter of the timeline lives on the same Earth (lib/earth.js) with
// the same chemistry in its water (lib/chemistry.js):
//
//   earth        the young coast, no life (Early Earth)
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
// complexity in the same world; later steps let organisms pass from one era
// to the next (see the Gaia plan).
//
// No DOM here; runs in the browser and in Node.
(function (root) {
  'use strict';

  const node = typeof module !== 'undefined' && module.exports;
  const ChemSim = () => (node ? require('./chemistry.js') : root.ChemSim);
  const LifeSim = () => (node ? require('./life.js') : root.LifeSim);
  const WorldSim = () => (node ? require('../environments/forager-worlds/engine.js') : root.WorldSim);

  const ERAS = ['earth', 'cells', 'colonies', 'bodies', 'nerves', 'brains', 'ecosystems'];

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

  function make(opts) {
    const o = Object.assign({ era: 'earth', seed: 3 }, opts || {});
    if (!ERAS.includes(o.era)) throw new Error('Unknown era: ' + o.era);
    const g = { era: o.era, seed: o.seed, chem: null, earth: null, life: null, world: null };
    if (o.era === 'earth') {
      g.chem = ChemSim().makeWorld('full', o.seed);
      g.step = () => g.chem.step();
    } else if (o.era === 'brains' || o.era === 'ecosystems') {
      g.chem = ChemSim().makeWorld('full', o.seed);
      g.chem.p.maxBubbles = 0;
      for (let i = 0; i < WARMUP; i++) g.chem.step();
      const { World } = WorldSim();
      g.world = new World(Object.assign({ seed: o.seed }, ORGANISMS[o.era], o.world || {}, { coast: g.chem }));
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

  const api = { ERAS, ORGANISMS, make };
  if (node) module.exports = api;
  else root.Gaia = api;
})(typeof self !== 'undefined' ? self : this);
