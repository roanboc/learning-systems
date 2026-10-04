// W1 world engine: plants, creatures with Braitenberg-style reflexes, asexual
// reproduction with mutation. No DOM here, so it runs in the browser and in Node.
// Each World instance owns its own random generator, plants and gene pool, so
// several worlds can run side by side without sharing anything.
(function (root) {
  'use strict';

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
    statsEvery: 25,
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
  const GENE_NAMES = Object.keys(GENES);

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
      this.extinctAt = null;
      this.gridN = Math.ceil(this.p.size / CELL);
      this.grid = new Array(this.gridN * this.gridN);

      this.patchList = [];
      for (let i = 0; i < this.p.patches; i++) {
        this.patchList.push({ x: this.rng() * this.p.size, y: this.rng() * this.p.size, n: 0 });
      }
      for (const patch of this.patchList) {
        for (let i = 0; i < this.p.plantCapacity * 0.5; i++) this.spawnPlant(patch);
      }
      for (let i = 0; i < this.p.startCreatures; i++) this.spawnCreature();
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

    randomGenome() {
      const g = {};
      for (const k of GENE_NAMES) {
        const [lo, hi] = GENES[k].init;
        g[k] = lo + (hi - lo) * this.rng();
      }
      return g;
    }

    mutate(parent) {
      const g = {};
      for (const k of GENE_NAMES) {
        const spec = GENES[k];
        g[k] = clamp(parent[k] + gauss(this.rng) * this.p.mutation * (spec.max - spec.min), spec.min, spec.max);
      }
      return g;
    }

    spawnCreature(genome, x, y, energy, gen) {
      const c = {
        id: this.nextId++,
        x: x === undefined ? this.rng() * this.p.size : x,
        y: y === undefined ? this.rng() * this.p.size : y,
        heading: this.rng() * TAU,
        energy: energy === undefined ? this.p.startEnergy : energy,
        age: 0,
        gen: gen || 0,
        g: genome || this.randomGenome(),
        eaten: 0,
        poisoned: 0,
      };
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
    forPlantsNear(x, y, r, fn) {
      const n = this.gridN;
      const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
      const span = Math.ceil(r / CELL);
      const r2 = r * r;
      for (let dy = -span; dy <= span; dy++) {
        for (let dx = -span; dx <= span; dx++) {
          const cell = this.grid[((cy + dy) % n + n) % n * n + ((cx + dx) % n + n) % n];
          if (!cell) continue;
          for (const plant of cell) {
            if (plant.dead) continue;
            const ddx = this.delta(x, plant.x), ddy = this.delta(y, plant.y);
            const d2 = ddx * ddx + ddy * ddy;
            if (d2 <= r2) fn(plant, ddx, ddy, d2);
          }
        }
      }
    }

    step() {
      const p = this.p;
      this.t++;

      if (p.seasonLength > 0 && this.t % p.seasonLength === 0) {
        this.foodColour = 1 - this.foodColour;
      }

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

      this.buildGrid();

      const newborns = [];
      for (const c of this.creatures) {
        const g = c.g;
        // Two eyes: plants in the left or right half of the field of view,
        // weighted by closeness, summed per colour.
        let lG = 0, rG = 0, lV = 0, rV = 0;
        const cosH = Math.cos(c.heading), sinH = Math.sin(c.heading);
        const half = g.fov / 2;
        this.forPlantsNear(c.x, c.y, g.senseRange, (plant, dx, dy, d2) => {
          const fwd = dx * cosH + dy * sinH;
          const side = -dx * sinH + dy * cosH;   // positive = left of heading
          const ang = Math.atan2(side, fwd);
          if (Math.abs(ang) > half) return;
          const w = 1 / (1 + Math.sqrt(d2) / 20);
          if (this.plantColour(plant) === GREEN) { if (ang > 0) lG += w; else rG += w; }
          else { if (ang > 0) lV += w; else rV += w; }
        });

        // Reflex: turn toward colours with positive weight, away from negative.
        const drive = g.wGreen * (lG - rG) + g.wViolet * (lV - rV);
        c.heading += g.turnGain * Math.tanh(drive) + g.wander * gauss(this.rng);
        c.x = this.wrap(c.x + Math.cos(c.heading) * g.speed);
        c.y = this.wrap(c.y + Math.sin(c.heading) * g.speed);

        // Eat the first plant touched. In W1 there is no choice: touching is eating.
        let meal = null;
        this.forPlantsNear(c.x, c.y, 5, (plant) => { if (!meal) meal = plant; });
        if (meal) {
          meal.dead = true;
          meal.patch.n--;
          if (meal.poison) { c.energy -= p.poisonDamage; c.poisoned++; }
          else { c.energy += p.foodEnergy; c.eaten++; }
        }

        c.energy -= p.basalCost + p.moveCost * g.speed * g.speed + p.senseCost * g.senseRange;
        c.age++;

        if (c.energy > g.reproEnergy && this.creatures.length + newborns.length < p.maxCreatures) {
          const share = c.energy / 2;
          c.energy -= share;
          newborns.push([this.mutate(g), c.x, c.y, share - 5, c.gen + 1]);
        }
      }

      // Remove the dead.
      let w = 0;
      for (const c of this.creatures) {
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

    recordStats() {
      const n = this.creatures.length;
      const mean = {};
      for (const k of GENE_NAMES) mean[k] = 0;
      let energy = 0, maxGen = 0;
      for (const c of this.creatures) {
        for (const k of GENE_NAMES) mean[k] += c.g[k];
        energy += c.energy;
        if (c.gen > maxGen) maxGen = c.gen;
      }
      if (n) { for (const k of GENE_NAMES) mean[k] /= n; energy /= n; }
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
        foodPref: n ? foodPref : null,
        wGreen: n ? mean.wGreen : null,
        wViolet: n ? mean.wViolet : null,
        speed: n ? mean.speed : null,
        senseRange: n ? mean.senseRange : null,
        births: this.intervalBirths,
        deaths: this.intervalDeaths,
        foodColour: this.foodColour,
      });
      this.intervalBirths = 0;
      this.intervalDeaths = 0;
      if (this.history.length > 4000) {
        // Keep memory bounded on long runs: thin the older half.
        this.history = this.history.filter((_, i) => i % 2 === 0 || i > 2000);
      }
    }
  }

  const api = { World, DEFAULTS, GENES, GENE_NAMES, GREEN, VIOLET };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WorldSim = api;
})(typeof self !== 'undefined' ? self : this);
