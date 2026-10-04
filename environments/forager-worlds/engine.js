// Forager Worlds engine: plants, creatures, asexual reproduction with mutation.
// Creatures steer either with inherited Braitenberg-style reflexes (W1) or with
// a spiking brain that wires itself and learns during life (W2, lib/brain.js).
// No DOM here, so it runs in the browser and in Node.
// Each World instance owns its own random generator, plants and gene pool, so
// several worlds can run side by side without sharing anything.
(function (root) {
  'use strict';

  const BrainSim = typeof module !== 'undefined' && module.exports
    ? require('../../lib/brain.js')
    : root.BrainSim;

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
    mind: 'reflex',         // 'reflex' (inherited instincts) or 'brain' (learns during life)
    rays: 7,                // brain mode: eye resolution
    turnGain: 0.12,         // brain mode: turn per unit of motor imbalance
    foodReward: 1,          // brain mode: dopamine on eating food
    poisonPunish: 3,        // brain mode: negative dopamine on eating poison
    eatNoise: 0.05,         // brain mode: spontaneous drive to the eat neuron
    eatTarget: 0.02,        // brain mode: set point of the eat neuron (bites are rare acts)
    innateOrient: 0.3,      // brain mode: inborn weight, eye -> same-side turn
    innateBite: 0.5,        // brain mode: inborn weight, mouth -> eat
    mouth: 6,               // reach of the mouth
    brain: null,            // brain mode: overrides for lib/brain.js defaults
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
      this.intervalFoodMeals = 0;
      this.intervalPoisonMeals = 0;
      this.lipFood = this.biteFood = this.lipPoison = this.bitePoison = 0;
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
        brain: null,
        motorL: 0,
        motorR: 0,
        pain: 0,
      };
      if (this.p.mind === 'brain') {
        // Sensors: one per ray and colour, left rays at the top of the tissue,
        // then mouth contact per colour, hunger and pain.
        // Motors: turn left (top), turn right (bottom), eat (middle).
        const rows = [];
        const R = this.p.rays;
        for (let r = 0; r < R; r++) {
          const y = (r + 0.5) / R;  // r = 0 is the leftmost ray
          rows.push(y, y);           // green, violet
        }
        rows.push(0.5, 0.5);   // mouth: touching green, touching violet
        rows.push(0.5, 0.5);   // hunger, pain
        // Inborn reflexes, the same for both colours: orient toward anything seen
        // on one side, and bite whatever touches the mouth. Learning has to
        // find out which colour is worth it.
        const innate = [];
        for (let r = 0; r < R; r++) {
          const side = r < (R - 1) / 2 ? 0 : r > (R - 1) / 2 ? 1 : -1;
          if (side < 0) continue;
          innate.push([r * 2, side, this.p.innateOrient], [r * 2 + 1, side, this.p.innateOrient]);
        }
        innate.push([R * 2, 2, this.p.innateBite], [R * 2 + 1, 2, this.p.innateBite]);
        const bp = Object.assign({
          motorNoiseOverride: [0.35, 0.35, this.p.eatNoise],
          motorTargetOverride: [0.12, 0.12, this.p.eatTarget],
        }, this.p.brain);
        c.brain = new BrainSim.Brain(this.rng, rows, [0.25, 0.75, 0.5], bp, innate);
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
        if (c.brain) this.think(c);
        else {
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
        }
        c.x = this.wrap(c.x + Math.cos(c.heading) * g.speed);
        c.y = this.wrap(c.y + Math.sin(c.heading) * g.speed);

        // Eating is a choice. Reflex creatures bite a touched plant if their
        // instinct likes its colour; brains bite when the eat neuron fires.
        let meal = null, lip = null, lipD = Infinity;
        this.forPlantsNear(c.x, c.y, p.mouth, (plant, dx, dy, d2) => { if (d2 < lipD) { lipD = d2; lip = plant; } });
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
          meal.patch.n--;
          if (meal.poison) {
            c.energy -= p.poisonDamage; c.poisoned++; this.intervalPoisonMeals++;
            if (c.brain) { c.brain.reward(-p.poisonPunish); c.pain = 15; }
          } else {
            c.energy += p.foodEnergy; c.eaten++; this.intervalFoodMeals++;
            if (c.brain) c.brain.reward(p.foodReward);
          }
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

    // Brain mode: the eye reports, per ray, the closest plant of each colour;
    // the brain spikes; motor imbalance turns the body.
    think(c) {
      const g = c.g, p = this.p, R = p.rays, drive = c.drive;
      drive.fill(0);
      const cosH = Math.cos(c.heading), sinH = Math.sin(c.heading);
      const half = g.fov / 2, range = g.senseRange;
      this.forPlantsNear(c.x, c.y, range, (plant, dx, dy, d2) => {
        const fwd = dx * cosH + dy * sinH;
        const side = -dx * sinH + dy * cosH;   // positive = left of heading
        const ang = Math.atan2(side, fwd);
        if (Math.abs(ang) > half) return;
        const ray = Math.min(R - 1, Math.floor((half - ang) / g.fov * R)); // 0 = leftmost
        const strength = 1 - Math.sqrt(d2) / range;
        const idx = ray * 2 + this.plantColour(plant);
        if (strength > drive[idx]) drive[idx] = strength;
      });
      // Mouth: the colour of the plant that a bite would take (the closest one).
      let lip = null, lipD = Infinity;
      this.forPlantsNear(c.x, c.y, p.mouth, (plant, dx, dy, d2) => { if (d2 < lipD) { lipD = d2; lip = plant; } });
      if (lip) drive[R * 2 + this.plantColour(lip)] = 1;
      drive[R * 2 + 2] = clamp(1 - c.energy / g.reproEnergy, 0, 1) * 0.3;  // hunger
      drive[R * 2 + 3] = c.pain > 0 ? 1 : 0;                               // pain
      if (c.pain > 0) c.pain--;

      const b = c.brain;
      b.step(drive);
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
      const mean = {};
      for (const k of GENE_NAMES) mean[k] = 0;
      let energy = 0, maxGen = 0, synapses = 0, brains = 0;
      for (const c of this.creatures) {
        if (c.brain) { synapses += c.brain.synapseCount(); brains++; }
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
        foodPref: n && this.p.mind !== 'brain' ? foodPref : null,
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

  const api = { World, DEFAULTS, GENES, GENE_NAMES, GREEN, VIOLET };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WorldSim = api;
})(typeof self !== 'undefined' ? self : this);
