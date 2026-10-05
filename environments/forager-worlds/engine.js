// Forager Worlds engine: plants, creatures, asexual reproduction with mutation.
// Creatures steer either with inherited Braitenberg-style reflexes (W1) or with
// a spiking brain that wires itself and learns during life (W2, lib/brain.js).
// Several species with different minds can share a world, and plants can be
// living organisms on drifting soil.
// No DOM here, so it runs in the browser and in Node.
// Each World instance owns its own random generator, plants and gene pool, so
// several worlds can run side by side without sharing anything.
(function (root) {
  'use strict';

  const BrainSim = typeof module !== 'undefined' && module.exports
    ? require('../../lib/brain.js')
    : root.BrainSim;
  // Optional: brains made of living tissue (the Tissue Lab), loaded on demand.
  const TissueBrainSim = () => (typeof module !== 'undefined' && module.exports
    ? require('./tissue-brain.js')
    : root.TissueBrainSim);

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gauss(rng) {
    let u = 0;
    while (u === 0) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  }

  const TAU = Math.PI * 2;
  const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);

  // Colours a plant can have. What each colour means (food or poison) is set
  // by the world and can swap with the seasons; creatures only ever see colour.
  const GREEN = 0;
  const VIOLET = 1;

  const DEFAULTS = {
    seed: 1,
    size: 600,              // world is a size x size torus
    patches: 5,             // plant patches
    patchRadius: 70,
    plantCapacity: 110,     // carrying capacity per patch
    plantGrowth: 0.012,     // logistic growth rate per plant per step
    plantSeeding: 0.02,     // chance per step per patch of a seed landing from outside
    poisonFraction: 0.35,   // share of new plants that are poison
    plantLifespan: 1500,    // mean steps before a plant withers, so uneaten poison turns over
    foodEnergy: 35,
    poisonDamage: 45,
    seasonLength: 0,        // steps between food/poison colour swaps, 0 = never
    startCreatures: 40,
    maxCreatures: 400,
    startEnergy: 80,
    basalCost: 0.04,
    moveCost: 0.03,         // times speed squared
    senseCost: 0.0004,      // times sense range
    maxAge: 8000,
    mutation: 0.08,         // mutation size as a share of each gene's range
    brainMutation: 0.02,    // the same for brain genes (slower, so instincts are not rewritten every season)
    statsEvery: 25,
    mind: 'reflex',         // 'reflex' (inherited instincts), 'brain' (learns during life, lib/brain.js)
                            // or 'tissue' (a Tissue Lab slice: glia, growth factor, newborn neurons)
    rays: 7,                // brain mode: eye resolution
    turnGain: 0.12,         // brain mode: turn per unit of motor imbalance
    foodReward: 1,          // brain mode: dopamine on eating food
    poisonPunish: 3,        // brain mode: negative dopamine on eating poison
    eatNoise: 0.05,         // brain mode: spontaneous drive to the eat neuron
    eatTarget: 0.02,        // brain mode: set point of the eat neuron (bites are rare acts)
    neuronCost: 0.0003,     // brain mode: energy per interneuron per step
    learnCost: 0.2,         // brain mode: energy per step per unit of learning rate
    geneInit: null,         // optional starting ranges per gene, e.g. { learnRate: [0, 0.002] }
    fixed: null,            // optional genes held constant, e.g. { learnRate: 0 }
    // Several species in one world. Each entry: { name, mind, count, geneInit, fixed }.
    // null means one species built from mind and startCreatures.
    species: null,
    // Plants: 'patches' (fixed patches that regrow, W1 to W3) or 'living'
    // (plants grow on fertile soil, shade each other, make seeds, age and die).
    plantMode: 'patches',
    soilSpots: 8,           // living: fertile soil spots
    soilRadius: 60,         // living: width of a fertile spot
    soilDrift: 0.08,        // living: how fast fertile spots move, per step
    plantGrow: 0.03,        // living: growth per step on the best soil
    toxinCost: 0.5,         // living: growth and seed multiplier for poisonous plants (defence costs)
    toxinHeredity: 0,       // living: chance a seed inherits its parent's toxicity (1 = plants evolve defences)
    seedEvery: 30,          // living: mean steps between seeds of a full-grown plant
    seedRange: 25,          // living: typical seed distance
    crowdRadius: 12,        // living: plants closer than this compete for light
    maxPlants: 1200,
    biteSize: 0.3,          // living: plants smaller than this are too small to see or bite
    // Predators (W5): a species with diet 'meat' hunts the plant eaters.
    animalSight: null,      // eyes also see animals of the other diet; null = on when predators exist
    attackReach: 9,
    attackDamage: 30,       // energy a bite takes from the prey
    meatEfficiency: 0.7,    // share of that energy the predator gains
    // Creatures change their world (W5): droppings and carcasses fertilise the soil.
    dung: 0,                // 0 = off; fertility added per unit of eaten plant
    dungRate: 0.02,         // share of the gut released per step
    dungDecay: 0.998,       // per step, so old dung fades
    dungCell: 20,
    carcass: 0.2,           // fertility left where a creature dies (dung worlds only)
    mouth: 6,               // reach of the mouth
    brain: null,            // brain mode: overrides for lib/brain.js defaults
    tissue: null,           // tissue mode: overrides for the Tissue Lab slice (tissue-brain.js)
    rewardScale: 5,         // tissue mode: reward learning rate per unit of the learnRate gene
  };

  // Heritable genes. Ranges keep evolution inside a plausible body plan.
  const GENES = {
    speed:       { min: 0.2, max: 3,   init: [0.8, 1.6] },
    turnGain:    { min: 0,   max: 0.6, init: [0.1, 0.3] },
    senseRange:  { min: 20,  max: 150, init: [40, 80] },
    fov:         { min: 0.4, max: 3.0, init: [1.2, 2.0] },
    wGreen:      { min: -3,  max: 3,   init: [-1, 1] },   // attraction to green
    wViolet:     { min: -3,  max: 3,   init: [-1, 1] },   // attraction to violet
    wander:      { min: 0,   max: 0.5, init: [0.05, 0.25] },
    reproEnergy: { min: 60,  max: 300, init: [100, 160] },
  };

  // Brain genes (brain mode only). Evolution sets how the brain is built and how
  // fast it learns, never individual synapses. The four inborn weights are the
  // brain's instincts: how strongly each colour seen on one side turns the body
  // that way, and how strongly each colour at the mouth triggers a bite.
  const BRAIN_GENES = {
    learnRate:    { min: 0, max: 0.06, init: [0.015, 0.025] }, // plasticity
    hidden:       { min: 4, max: 48,   init: [20, 28] },       // interneurons
    orientGreen:  { min: 0, max: 0.8,  init: [0.25, 0.35] },
    orientViolet: { min: 0, max: 0.8,  init: [0.25, 0.35] },
    biteGreen:    { min: 0, max: 1.2,  init: [0.45, 0.55] },
    biteViolet:   { min: 0, max: 1.2,  init: [0.45, 0.55] },
  };
  // Tissue brains only: how many newborn neurons the stem-cell niche makes
  // (per 100 steps). 0 = no adult neurogenesis.
  const TISSUE_GENES = {
    birthRate:    { min: 0, max: 1.5,  init: [0.2, 0.3] },
  };

  // Animal genes, only in worlds where predators and prey can see each other.
  // Reflex minds get one attraction weight; brains get three inborn reflexes:
  // turn toward an animal, turn away from it, bite it.
  const REFLEX_ANIMAL_GENES = {
    wAnimal: { min: -3, max: 3, init: [-0.5, 0.5] },
  };
  const BRAIN_ANIMAL_GENES = {
    orientAnimal: { min: 0, max: 0.8, init: [0, 0.1] },
    fleeAnimal:   { min: 0, max: 0.8, init: [0, 0.1] },
    biteAnimal:   { min: 0, max: 1.2, init: [0, 0.1] },
  };
  // Starting instincts by diet: hunters chase and bite, prey keep away.
  const DIET_INIT = {
    meat: { wAnimal: [1, 2], orientAnimal: [0.3, 0.4], fleeAnimal: [0, 0.05], biteAnimal: [0.5, 0.6] },
    plants: { wAnimal: [-1, 0], orientAnimal: [0, 0.05], fleeAnimal: [0.1, 0.2], biteAnimal: [0, 0.05] },
  };
  const GENE_NAMES = Object.keys(GENES);
  const BRAIN_GENE_NAMES = Object.keys(BRAIN_GENES);
  const TISSUE_GENE_NAMES = Object.keys(TISSUE_GENES);

  const CELL = 40; // spatial grid cell size

  class World {
    constructor(params) {
      this.p = Object.assign({}, DEFAULTS, params || {});
      this.rng = mulberry32(this.p.seed >>> 0);
      this.t = 0;
      this.nextId = 1;
      this.foodColour = GREEN;          // the other colour is poison
      this.plants = [];
      this.creatures = [];
      this.history = [];
      this.births = 0;
      this.deaths = { starved: 0, old: 0 };
      this.intervalBirths = 0;
      this.intervalDeaths = 0;
      this.intervalFoodMeals = 0;
      this.intervalPoisonMeals = 0;
      this.lipFood = this.biteFood = this.lipPoison = this.bitePoison = 0;
      this.extinctAt = null;
      this.gridN = Math.ceil(this.p.size / CELL);
      this.grid = new Array(this.gridN * this.gridN);

      this.patchList = [];
      this.soil = [];
      if (this.p.plantMode === 'living') {
        // Fertile soil spots that drift, so the vegetation never stays put.
        for (let i = 0; i < this.p.soilSpots; i++) {
          this.soil.push({ x: this.rng() * this.p.size, y: this.rng() * this.p.size, dir: this.rng() * TAU });
        }
        for (const spot of this.soil) {
          for (let i = 0; i < this.p.plantCapacity * 0.5; i++) {
            const r = this.p.soilRadius * 0.6 * Math.sqrt(this.rng()), a = this.rng() * TAU;
            const pl = this.addPlant(spot.x + r * Math.cos(a), spot.y + r * Math.sin(a), this.rng() < this.p.poisonFraction);
            pl.size = 0.3 + 0.7 * this.rng();
          }
        }
      } else {
        for (let i = 0; i < this.p.patches; i++) {
          this.patchList.push({ x: this.rng() * this.p.size, y: this.rng() * this.p.size, n: 0 });
        }
        for (const patch of this.patchList) {
          for (let i = 0; i < this.p.plantCapacity * 0.5; i++) this.spawnPlant(patch);
        }
      }
      const defaultName = { brain: 'Brains', tissue: 'Tissue brains' }[this.p.mind] || 'Instincts';
      this.speciesList = (this.p.species || [{ name: defaultName, mind: this.p.mind, count: this.p.startCreatures }])
        .map((sp) => Object.assign({ geneInit: null, fixed: null, diet: 'plants' }, sp));
      this.animalSight = this.p.animalSight === null
        ? this.speciesList.some((sp) => sp.diet === 'meat') : !!this.p.animalSight;
      this.deaths.killed = 0;
      this.dungN = Math.ceil(this.p.size / this.p.dungCell);
      this.dungGrid = this.p.dung > 0 ? new Float32Array(this.dungN * this.dungN) : null;
      this.cgrid = new Array(this.gridN * this.gridN);
      this.speciesList.forEach((sp, i) => {
        for (let k = 0; k < sp.count; k++) this.spawnCreature(undefined, undefined, undefined, undefined, 0, i);
      });
      this.recordStats();
    }

    wrap(v) {
      const s = this.p.size;
      return ((v % s) + s) % s;
    }

    // Shortest signed difference on the torus.
    delta(a, b) {
      const s = this.p.size;
      let d = b - a;
      if (d > s / 2) d -= s; else if (d < -s / 2) d += s;
      return d;
    }

    spawnPlant(patch) {
      const r = this.p.patchRadius * Math.sqrt(this.rng());
      const a = this.rng() * TAU;
      const poison = this.rng() < this.p.poisonFraction;
      this.plants.push({
        x: this.wrap(patch.x + r * Math.cos(a)),
        y: this.wrap(patch.y + r * Math.sin(a)),
        poison,
        patch,
        dead: false,
      });
      patch.n++;
    }

    plantColour(plant) {
      return plant.poison ? 1 - this.foodColour : this.foodColour;
    }

    // Living plants: an organism with a size, an age and a heritable toxin.
    addPlant(x, y, poison, parent) {
      const plant = {
        x: this.wrap(x), y: this.wrap(y), poison, patch: null, dead: false,
        size: 0.1, age: 0, seeds: 0, lifespan: this.p.plantLifespan * (0.5 + this.rng()),
        id: this.nextPlantId = (this.nextPlantId || 0) + 1,
        parent: parent ? parent.id : null, gen: parent ? parent.gen + 1 : 0,
        // Last step's inner state, for the plant explorer.
        fert: 0, light: 1, growth: 0, seeded: false, death: null,
      };
      this.plants.push(plant);
      return plant;
    }

    // Soil fertility at a point, 0 to 1: the strongest nearby fertile spot.
    fertility(x, y) {
      let f = 0;
      const r2 = 2 * this.p.soilRadius * this.p.soilRadius;
      for (const s of this.soil) {
        const dx = this.delta(x, s.x), dy = this.delta(y, s.y);
        const v = Math.exp(-(dx * dx + dy * dy) / r2);
        if (v > f) f = v;
      }
      if (this.dungGrid) f += this.dungAt(this.wrap(x), this.wrap(y));
      return f > 1 ? 1 : f;
    }

    // Living plants grow with soil and light, make seeds when grown, age and die.
    stepLivingPlants() {
      const p = this.p;
      for (const s of this.soil) {
        s.dir += 0.02 * gauss(this.rng);
        s.x = this.wrap(s.x + Math.cos(s.dir) * p.soilDrift);
        s.y = this.wrap(s.y + Math.sin(s.dir) * p.soilDrift);
      }
      const seeds = [];
      const crowd2 = p.crowdRadius * p.crowdRadius;
      for (const plant of this.plants) {
        if (plant.dead) continue;
        plant.age++;
        const fert = this.fertility(plant.x, plant.y);
        // Shade: close neighbours take light.
        let shade = 0;
        this.forPlantsNear(plant.x, plant.y, p.crowdRadius, (o, dx, dy, d2) => { if (o !== plant) shade += o.size * (1 - d2 / crowd2); }, -1);
        const light = 1 / (1 + shade);
        const grow = p.plantGrow * (plant.poison ? p.toxinCost : 1);
        // On poor or shaded ground a plant starves and shrinks, so plants
        // compete for space and fast growers can crowd out slow ones.
        const before = plant.size;
        plant.size = Math.min(1, plant.size + grow * (fert * light - 0.15));
        plant.fert = fert; plant.light = light; plant.growth = plant.size - before; plant.seeded = false;
        if (plant.size <= 0) { plant.dead = true; plant.death = 'starved'; continue; }
        if (plant.age > plant.lifespan) { plant.dead = true; plant.death = 'old'; continue; }
        if (plant.size > 0.5 && this.rng() < (plant.poison ? p.toxinCost : 1) / p.seedEvery) {
          const a = this.rng() * TAU, r = p.seedRange * Math.abs(gauss(this.rng));
          // Toxicity is inherited with probability toxinHeredity, otherwise
          // set by the soil chemistry (poisonFraction).
          const poison = this.rng() < p.toxinHeredity ? plant.poison : this.rng() < p.poisonFraction;
          seeds.push([plant.x + r * Math.cos(a), plant.y + r * Math.sin(a), poison, plant]);
          plant.seeds++;
          plant.seeded = true;
        }
      }
      // Rare seeds from outside keep both kinds of plant in play.
      if (this.rng() < p.plantSeeding) {
        seeds.push([this.rng() * p.size, this.rng() * p.size, this.rng() < p.poisonFraction]);
      }
      // A seed only sprouts on fertile ground that is not already shaded.
      for (const [x, y, poison, parent] of seeds) {
        if (this.plants.length >= p.maxPlants) break;
        if (this.rng() > this.fertility(x, y)) continue;
        let shaded = false;
        this.forPlantsNear(this.wrap(x), this.wrap(y), p.crowdRadius * 0.8, () => { shaded = true; }, -1);
        if (!shaded) {
          this.addPlant(x, y, poison, parent);
          if (parent) parent.sprouted = (parent.sprouted || 0) + 1;
        }
      }
    }

    geneSpec(k) {
      return GENES[k] || BRAIN_GENES[k] || TISSUE_GENES[k] || REFLEX_ANIMAL_GENES[k] || BRAIN_ANIMAL_GENES[k];
    }

    geneNames(mind) {
      const brainy = mind === 'brain' || mind === 'tissue' || mind === 'any';
      let names = brainy ? GENE_NAMES.concat(BRAIN_GENE_NAMES) : GENE_NAMES;
      if (mind === 'tissue' || mind === 'any') names = names.concat(TISSUE_GENE_NAMES);
      if (!this.animalSight) return names;
      return names.concat(Object.keys(brainy ? BRAIN_ANIMAL_GENES : REFLEX_ANIMAL_GENES));
    }

    randomGenome(sp) {
      const init = Object.assign({}, this.animalSight ? DIET_INIT[sp.diet] : null, this.p.geneInit, sp.geneInit);
      const fixed = Object.assign({}, this.p.fixed, sp.fixed);
      const g = {};
      for (const k of this.geneNames(sp.mind)) {
        const [lo, hi] = init[k] || this.geneSpec(k).init;
        g[k] = k in fixed ? fixed[k] : lo + (hi - lo) * this.rng();
      }
      return g;
    }

    mutate(parent, sp) {
      const g = {}, fixed = Object.assign({}, this.p.fixed, sp.fixed);
      for (const k of this.geneNames(sp.mind)) {
        const spec = this.geneSpec(k);
        const size = GENES[k] || REFLEX_ANIMAL_GENES[k] ? this.p.mutation : this.p.brainMutation;
        g[k] = k in fixed ? fixed[k]
          : clamp(parent[k] + gauss(this.rng) * size * (spec.max - spec.min), spec.min, spec.max);
      }
      return g;
    }

    spawnCreature(genome, x, y, energy, gen, species) {
      const spIndex = species || 0, sp = this.speciesList[spIndex];
      const c = {
        id: this.nextId++,
        x: x === undefined ? this.rng() * this.p.size : x,
        y: y === undefined ? this.rng() * this.p.size : y,
        heading: this.rng() * TAU,
        energy: energy === undefined ? this.p.startEnergy : energy,
        age: 0,
        gen: gen || 0,
        g: genome || this.randomGenome(sp),
        sp: spIndex,
        eaten: 0,
        poisoned: 0,
        brain: null,
        motorL: 0,
        motorR: 0,
        pain: 0,
        brainCost: 0,
        meat: sp.diet === 'meat',
        gut: 0,
        bitten: 0,
        killedBy: null,
      };
      if (sp.mind === 'brain' || sp.mind === 'tissue') {
        // On screen (y points down) a positive angle is clockwise, i.e. the
        // creature's right. Sensors: one per ray and colour, right rays at the top,
        // then mouth contact per colour, hunger and pain.
        // Motors: turn right (top), turn left (bottom), eat (middle).
        const rows = [];
        const R = this.p.rays;
        for (let r = 0; r < R; r++) {
          const y = (r + 0.5) / R;  // r = 0 is the rightmost ray
          rows.push(y, y);           // green, violet
        }
        rows.push(0.5, 0.5);   // mouth: touching green, touching violet
        rows.push(0.5, 0.5);   // hunger, pain
        // Worlds with predators: one animal cell per ray (animals of the other
        // diet), then a mouth cell for touching one.
        if (this.animalSight) {
          for (let r = 0; r < R; r++) rows.push((r + 0.5) / R);
          rows.push(0.5);
        }
        // Inborn reflexes, with strengths from the genome: orient toward a colour
        // seen on one side, and bite a colour that touches the mouth. They start
        // equal for both colours; evolution can bias them, learning can retune them.
        const g = c.g, innate = [];
        for (let r = 0; r < R; r++) {
          const side = r < (R - 1) / 2 ? 0 : r > (R - 1) / 2 ? 1 : -1;
          if (side < 0) continue;
          innate.push([r * 2, side, g.orientGreen], [r * 2 + 1, side, g.orientViolet]);
        }
        innate.push([R * 2, 2, g.biteGreen], [R * 2 + 1, 2, g.biteViolet]);
        if (this.animalSight) {
          // Turn toward an animal (hunting), away from it (fleeing), bite it.
          const base = R * 2 + 4;
          for (let r = 0; r < R; r++) {
            const side = r < (R - 1) / 2 ? 0 : r > (R - 1) / 2 ? 1 : -1;
            if (side < 0) continue;
            if (g.orientAnimal > 0) innate.push([base + r, side, g.orientAnimal]);
            if (g.fleeAnimal > 0) innate.push([base + r, 1 - side, g.fleeAnimal]);
          }
          if (g.biteAnimal > 0) innate.push([base + R, 2, g.biteAnimal]);
        }
        if (sp.mind === 'tissue') {
          // A Tissue Lab slice: it starts with `hidden` neurons, then its own
          // population dynamics decide how many live. Costs follow the live count.
          const motorNoise = [0.35, 0.35, this.p.eatNoise];
          c.brain = new (TissueBrainSim().TissueBrain)(this.rng, rows, [0.25, 0.75, 0.5], Object.assign({}, this.p.tissue, {
            startNeurons: Math.round(g.hidden),
            birthRate: g.birthRate,
            neurogenesis: g.birthRate > 0,
            rewardRate: this.p.rewardScale * g.learnRate,
          }), innate, motorNoise);
          c.brain.layout = { R, animal: this.animalSight, animalBase: R * 2 + 4 };
          c.learnCost = this.p.learnCost * g.learnRate;
          c.brainCost = this.p.neuronCost * c.brain.hiddenCount() + c.learnCost;
          c.drive = new Float32Array(rows.length);
          this.creatures.push(c);
          return c;
        }
        const bp = Object.assign({
          motorNoiseOverride: [0.35, 0.35, this.p.eatNoise],
          motorTargetOverride: [0.12, 0.12, this.p.eatTarget],
        }, this.p.brain, {
          hidden: Math.round(g.hidden),
          learningRate: g.learnRate,
        });
        c.brain = new BrainSim.Brain(this.rng, rows, [0.25, 0.75, 0.5], bp, innate);
        // Where each kind of sensor sits, for the explorer and the page.
        c.brain.layout = { R, animal: this.animalSight, animalBase: R * 2 + 4 };
        // Neurons and plasticity are not free: tissue and synapse turnover cost energy.
        c.brainCost = this.p.neuronCost * bp.hidden + this.p.learnCost * bp.learningRate;
        c.drive = new Float32Array(rows.length);
      }
      this.creatures.push(c);
      return c;
    }

    buildGrid() {
      const grid = this.grid;
      for (let i = 0; i < grid.length; i++) grid[i] = null;
      const n = this.gridN;
      for (const plant of this.plants) {
        const idx = Math.floor(plant.y / CELL) % n * n + Math.floor(plant.x / CELL) % n;
        (grid[idx] || (grid[idx] = [])).push(plant);
      }
    }

    // Visits plants within radius r of (x, y), passing the torus offsets.
    // minSize hides seedlings from creatures in living mode.
    forPlantsNear(x, y, r, fn, minSize) {
      if (minSize === undefined) minSize = this.p.plantMode === 'living' ? this.p.biteSize : -1;
      const n = this.gridN;
      const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
      const span = Math.ceil(r / CELL);
      const r2 = r * r;
      for (let dy = -span; dy <= span; dy++) {
        for (let dx = -span; dx <= span; dx++) {
          const cell = this.grid[((cy + dy) % n + n) % n * n + ((cx + dx) % n + n) % n];
          if (!cell) continue;
          for (const plant of cell) {
            if (plant.dead || plant.size < minSize) continue;
            const ddx = this.delta(x, plant.x), ddy = this.delta(y, plant.y);
            const d2 = ddx * ddx + ddy * ddy;
            if (d2 <= r2) fn(plant, ddx, ddy, d2);
          }
        }
      }
    }

    buildCreatureGrid() {
      const grid = this.cgrid, n = this.gridN;
      for (let i = 0; i < grid.length; i++) grid[i] = null;
      for (const c of this.creatures) {
        const idx = Math.floor(c.y / CELL) % n * n + Math.floor(c.x / CELL) % n;
        (grid[idx] || (grid[idx] = [])).push(c);
      }
    }

    // Visits living creatures of the other diet within radius r of creature c.
    forPreyOrPredatorsNear(c, r, fn) {
      const n = this.gridN;
      const cx = Math.floor(c.x / CELL), cy = Math.floor(c.y / CELL);
      const span = Math.ceil(r / CELL), r2 = r * r;
      for (let dy = -span; dy <= span; dy++) {
        for (let dx = -span; dx <= span; dx++) {
          const cell = this.cgrid[((cy + dy) % n + n) % n * n + ((cx + dx) % n + n) % n];
          if (!cell) continue;
          for (const o of cell) {
            if (o.meat === c.meat || o.energy <= 0) continue;
            const ddx = this.delta(c.x, o.x), ddy = this.delta(c.y, o.y);
            const d2 = ddx * ddx + ddy * ddy;
            if (d2 <= r2) fn(o, ddx, ddy, d2);
          }
        }
      }
    }

    dungAt(x, y) {
      const n = this.dungN, k = this.p.dungCell;
      return this.dungGrid[(Math.floor(y / k) % n) * n + (Math.floor(x / k) % n)];
    }

    step() {
      const p = this.p;
      this.t++;

      if (p.seasonLength > 0 && this.t % p.seasonLength === 0) {
        this.foodColour = 1 - this.foodColour;
      }

      if (p.plantMode === 'living') {
        this.buildGrid();
        this.stepLivingPlants();
      } else {
        // Plants wither at random, then regrow logistically per patch,
        // plus rare seeds from outside.
        const wither = 1 / p.plantLifespan;
        for (const plant of this.plants) {
          if (this.rng() < wither) { plant.dead = true; plant.patch.n--; }
        }
        for (const patch of this.patchList) {
          const expected = p.plantGrowth * patch.n * (1 - patch.n / p.plantCapacity);
          let births = Math.floor(expected) + (this.rng() < expected % 1 ? 1 : 0);
          if (this.rng() < p.plantSeeding) births++;
          for (let i = 0; i < births && patch.n < p.plantCapacity; i++) this.spawnPlant(patch);
        }
      }

      this.buildGrid();
      if (this.animalSight) this.buildCreatureGrid();
      if (this.dungGrid) {
        const d = this.dungGrid, decay = p.dungDecay;
        for (let i = 0; i < d.length; i++) d[i] *= decay;
      }

      const newborns = [];
      for (const c of this.creatures) {
        const g = c.g;
        if (c.energy <= 0) continue;   // killed earlier this step
        if (c.brain) this.think(c);
        else {
        // Two eyes: plants in the left or right half of the field of view,
        // weighted by closeness, summed per colour.
        let lG = 0, rG = 0, lV = 0, rV = 0;
        const cosH = Math.cos(c.heading), sinH = Math.sin(c.heading);
        const half = g.fov / 2;
        this.forPlantsNear(c.x, c.y, g.senseRange, (plant, dx, dy, d2) => {
          const fwd = dx * cosH + dy * sinH;
          const side = -dx * sinH + dy * cosH;   // positive = clockwise, the creature's right on screen
          const ang = Math.atan2(side, fwd);
          if (Math.abs(ang) > half) return;
          const w = 1 / (1 + Math.sqrt(d2) / 20);
          if (this.plantColour(plant) === GREEN) { if (ang > 0) lG += w; else rG += w; }
          else { if (ang > 0) lV += w; else rV += w; }
        });

        // Reflex: turn toward colours with positive weight, away from negative.
        let drive = c.meat ? 0 : g.wGreen * (lG - rG) + g.wViolet * (lV - rV);
        if (this.animalSight) {
          let lA = 0, rA = 0;
          this.forPreyOrPredatorsNear(c, g.senseRange, (o, dx, dy, d2) => {
            const ang = Math.atan2(-dx * sinH + dy * cosH, dx * cosH + dy * sinH);
            if (Math.abs(ang) > half) return;
            const w = 1 / (1 + Math.sqrt(d2) / 20);
            if (ang > 0) lA += w; else rA += w;
          });
          drive += g.wAnimal * (lA - rA) * 2;
        }
        c.heading += g.turnGain * Math.tanh(drive) + g.wander * gauss(this.rng);
        }
        c.x = this.wrap(c.x + Math.cos(c.heading) * g.speed);
        c.y = this.wrap(c.y + Math.sin(c.heading) * g.speed);

        // Eating is a choice. Reflex creatures bite a touched plant if their
        // instinct likes its colour; brains bite when the eat neuron fires.
        let meal = null, lip = null, lipD = Infinity;
        if (c.meat) this.hunt(c);
        else this.forPlantsNear(c.x, c.y, p.mouth, (plant, dx, dy, d2) => { if (d2 < lipD) { lipD = d2; lip = plant; } });
        if (lip && (c.brain ? c.brain.motorSpiked(2) : true)) {
          let best = Infinity;
          this.forPlantsNear(c.x, c.y, p.mouth, (plant, dx, dy, d2) => {
            if (d2 >= best) return;
            if (!c.brain && (this.plantColour(plant) === GREEN ? g.wGreen : g.wViolet) <= 0) return;
            best = d2; meal = plant;
          });
        }
        if (lip) {
          // Picky-eating bookkeeping: bites per step with food or poison at the mouth.
          const bit = meal !== null && meal.poison === lip.poison ? 1 : 0;
          if (lip.poison) { this.lipPoison++; this.bitePoison += bit; }
          else { this.lipFood++; this.biteFood += bit; }
        }
        if (meal) {
          meal.dead = true;
          meal.death = 'eaten';
          meal.eatenBy = c.id;
          if (meal.patch) meal.patch.n--;
          // A living plant gives (or harms) in proportion to how grown it is.
          const amount = meal.size === undefined ? 1 : meal.size;
          c.gut += amount;
          if (meal.poison) {
            c.energy -= p.poisonDamage * amount; c.poisoned++; this.intervalPoisonMeals++;
            if (c.brain) { c.brain.reward(-p.poisonPunish * amount); c.pain = 15; }
          } else {
            c.energy += p.foodEnergy * amount; c.eaten++; this.intervalFoodMeals++;
            if (c.brain) c.brain.reward(p.foodReward * amount);
          }
        }

        c.energy -= p.basalCost + p.moveCost * g.speed * g.speed + p.senseCost * g.senseRange + c.brainCost;
        if (this.dungGrid && c.gut > 0) {
          // Droppings: digested plants return to the soil where the creature walks.
          const d = c.gut * p.dungRate;
          c.gut -= d;
          const n = this.dungN, k = p.dungCell;
          this.dungGrid[(Math.floor(c.y / k) % n) * n + (Math.floor(c.x / k) % n)] += d * p.dung;
        }
        c.age++;

        if (c.energy > g.reproEnergy && this.creatures.length + newborns.length < p.maxCreatures) {
          const share = c.energy / 2;
          c.energy -= share;
          newborns.push([this.mutate(g, this.speciesList[c.sp]), c.x, c.y, share - 5, c.gen + 1, c.sp]);
        }
      }

      // Remove the dead.
      let w = 0;
      for (const c of this.creatures) {
        if (c.energy <= 0 || c.age > p.maxAge) {
          if (this.dungGrid) {
            const n = this.dungN, k = p.dungCell;
            this.dungGrid[(Math.floor(c.y / k) % n) * n + (Math.floor(c.x / k) % n)] += p.carcass;
          }
        }
        if (c.energy <= 0 && c.killedBy !== null) { this.deaths.killed++; this.intervalDeaths++; continue; }
        if (c.energy <= 0) { this.deaths.starved++; this.intervalDeaths++; continue; }
        if (c.age > p.maxAge) { this.deaths.old++; this.intervalDeaths++; continue; }
        this.creatures[w++] = c;
      }
      this.creatures.length = w;
      for (const nb of newborns) this.spawnCreature(...nb);
      this.births += newborns.length;
      this.intervalBirths += newborns.length;

      if (this.plants.some((pl) => pl.dead)) this.plants = this.plants.filter((pl) => !pl.dead);

      if (this.creatures.length === 0 && this.extinctAt === null) this.extinctAt = this.t;
      if (this.t % p.statsEvery === 0) this.recordStats();
    }

    // Predators: bite the closest prey in reach, if the mind decides to.
    // Brains bite when the eat neuron fires; reflex hunters always try.
    hunt(c) {
      const p = this.p;
      let prey = null, best = Infinity;
      this.forPreyOrPredatorsNear(c, p.attackReach, (o, dx, dy, d2) => { if (d2 < best) { best = d2; prey = o; } });
      if (!prey) return;
      if (c.brain ? !c.brain.motorSpiked(2) : c.g.wAnimal <= 0) return;
      const taken = Math.min(p.attackDamage, Math.max(0, prey.energy));
      prey.energy -= p.attackDamage;
      prey.bitten++;
      prey.pain = 15;
      if (prey.brain) prey.brain.reward(-p.poisonPunish);
      if (prey.energy <= 0) prey.killedBy = c.id;
      c.energy += taken * p.meatEfficiency;
      c.eaten++;
      this.intervalFoodMeals++;
      if (c.brain) c.brain.reward(p.foodReward);
    }

    // Brain mode: the eye reports, per ray, the closest plant of each colour;
    // the brain spikes; motor imbalance turns the body.
    think(c) {
      const g = c.g, p = this.p, R = p.rays, drive = c.drive;
      drive.fill(0);
      const cosH = Math.cos(c.heading), sinH = Math.sin(c.heading);
      const half = g.fov / 2, range = g.senseRange;
      this.forPlantsNear(c.x, c.y, range, (plant, dx, dy, d2) => {
        const fwd = dx * cosH + dy * sinH;
        const side = -dx * sinH + dy * cosH;   // positive = clockwise, the creature's right on screen
        const ang = Math.atan2(side, fwd);
        if (Math.abs(ang) > half) return;
        const ray = Math.min(R - 1, Math.floor((half - ang) / g.fov * R)); // 0 = rightmost
        const strength = 1 - Math.sqrt(d2) / range;
        const idx = ray * 2 + this.plantColour(plant);
        if (strength > drive[idx]) drive[idx] = strength;
      });
      // Mouth: the colour of the plant that a bite would take (the closest one).
      let lip = null, lipD = Infinity;
      this.forPlantsNear(c.x, c.y, p.mouth, (plant, dx, dy, d2) => { if (d2 < lipD) { lipD = d2; lip = plant; } });
      if (lip && !c.meat) drive[R * 2 + this.plantColour(lip)] = 1;
      if (this.animalSight) {
        // Animal cells: the closest animal of the other diet per ray, and
        // whether one is within biting reach.
        const base = R * 2 + 4;
        let reach = false;
        const reach2 = p.attackReach * p.attackReach;
        this.forPreyOrPredatorsNear(c, range, (o, dx, dy, d2) => {
          if (d2 <= reach2) reach = true;
          const fwd = dx * cosH + dy * sinH;
          const ang = Math.atan2(-dx * sinH + dy * cosH, fwd);
          if (Math.abs(ang) > half) return;
          const ray = Math.min(R - 1, Math.floor((half - ang) / g.fov * R));
          const strength = 1 - Math.sqrt(d2) / range;
          if (strength > drive[base + ray]) drive[base + ray] = strength;
        });
        drive[base + R] = reach && c.meat ? 1 : 0;
      }
      drive[R * 2 + 2] = clamp(1 - c.energy / g.reproEnergy, 0, 1) * 0.3;  // hunger
      drive[R * 2 + 3] = c.pain > 0 ? 1 : 0;                               // pain
      if (c.pain > 0) c.pain--;

      const b = c.brain;
      b.step(drive);
      if (b.kind === 'tissue') c.brainCost = p.neuronCost * b.hiddenCount() + c.learnCost;
      c.motorL = c.motorL * 0.85 + b.motorSpiked(0);
      c.motorR = c.motorR * 0.85 + b.motorSpiked(1);
      c.heading += p.turnGain * (c.motorL - c.motorR);
    }

    // 0.5 = bites food and poison alike, 1 = bites only food, 0 = only poison.
    pickiness() {
      if (this.lipFood < 20 || this.lipPoison < 20) return null;
      const f = this.biteFood / this.lipFood, q = this.bitePoison / this.lipPoison;
      return f + q > 0 ? f / (f + q) : null;
    }

    recordStats() {
      const n = this.creatures.length;
      // Gene means over the creatures that carry each gene (brain genes only
      // exist in brain species).
      const mean = {}, count = {}, names = this.geneNames('any');
      for (const k of names) { mean[k] = 0; count[k] = 0; }
      const perSpecies = this.speciesList.map(() => 0);
      let energy = 0, maxGen = 0, synapses = 0, brains = 0, reflexes = 0, predators = 0;
      let tissues = 0, liveNeurons = 0, newborn = 0;
      for (const c of this.creatures) {
        if (c.brain) { synapses += c.brain.synapseCount(); brains++; } else reflexes++;
        if (c.brain && c.brain.kind === 'tissue') {
          tissues++;
          liveNeurons += c.brain.hiddenCount();
          newborn += c.brain.tissue.counts.born;
        }
        perSpecies[c.sp]++;
        if (c.meat) predators++;
        for (const k in c.g) { mean[k] += c.g[k]; count[k]++; }
        energy += c.energy;
        if (c.gen > maxGen) maxGen = c.gen;
      }
      for (const k of names) mean[k] = count[k] ? mean[k] / count[k] : null;
      if (n) energy /= n;
      const brainMode = brains > 0;
      let toxic = 0, sized = 0;
      for (const pl of this.plants) { if (pl.poison) toxic++; if (pl.size !== undefined) sized += pl.size; }
      // Inborn bias toward the colour that is food right now: how much stronger
      // the instincts for that colour are than for the poison colour.
      const g = this.foodColour === GREEN ? 1 : -1;
      const instinct = brainMode
        ? g * (mean.biteGreen - mean.biteViolet + mean.orientGreen - mean.orientViolet) : null;
      let food = 0, poison = 0;
      for (const pl of this.plants) { if (pl.poison) poison++; else food++; }
      // Preference for whichever colour is currently food, minus the poison colour.
      const foodPref = this.foodColour === GREEN ? mean.wGreen - mean.wViolet : mean.wViolet - mean.wGreen;
      this.history.push({
        t: this.t,
        population: n,
        food,
        poison,
        energy,
        maxGen,
        foodPref: reflexes ? foodPref : null,
        wGreen: n ? mean.wGreen : null,
        wViolet: n ? mean.wViolet : null,
        speed: n ? mean.speed : null,
        senseRange: n ? mean.senseRange : null,
        births: this.intervalBirths,
        deaths: this.intervalDeaths,
        foodColour: this.foodColour,
        meals: this.intervalFoodMeals + this.intervalPoisonMeals,
        diet: this.intervalFoodMeals + this.intervalPoisonMeals > 0
          ? this.intervalFoodMeals / (this.intervalFoodMeals + this.intervalPoisonMeals) : null,
        synapses: brains ? synapses / brains : null,
        picky: this.pickiness(),
        learnRate: brainMode ? mean.learnRate : null,
        hidden: brainMode ? mean.hidden : null,
        birthRate: tissues ? mean.birthRate : null,
        neurons: tissues ? liveNeurons / tissues : null,     // live interneurons per tissue brain
        newborn: tissues ? newborn / tissues : null,         // neurons born so far per tissue brain
        instinct,
        species: perSpecies,
        predators: this.animalSight ? predators : null,
        prey: this.animalSight ? n - predators : null,
        dung: this.dungGrid ? this.dungGrid.reduce((a, v) => a + v, 0) : null,
        toxicShare: this.plants.length ? toxic / this.plants.length : null,
        biomass: this.p.plantMode === 'living' ? sized : null,
      });
      this.intervalBirths = 0;
      this.intervalDeaths = 0;
      this.intervalFoodMeals = 0;
      this.intervalPoisonMeals = 0;
      this.lipFood = this.biteFood = this.lipPoison = this.bitePoison = 0;
      if (this.history.length > 4000) {
        // Keep memory bounded on long runs: thin the older half.
        this.history = this.history.filter((_, i) => i % 2 === 0 || i > 2000);
      }
    }
  }

  const api = { World, DEFAULTS, GENES, GENE_NAMES, BRAIN_GENES, BRAIN_GENE_NAMES, TISSUE_GENES, GREEN, VIOLET };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WorldSim = api;
})(typeof self !== 'undefined' ? self : this);
