// Early life: cells living in the Early Earth (lib/earth.js + lib/chemistry.js).
//
// One engine for four chapters of the timeline. Each chapter switches on one
// more ability; everything else stays the same world, the same coast, the
// same chemistry.
//
//   cells      Cells eat building blocks and energy from the water, swim by
//              run and tumble (keep going while food gets richer, turn at
//              random when it gets poorer, like E. coli), divide when they
//              have stored enough, and die when they run out. Daughters
//              inherit slightly mutated genes. Nothing chooses the genes but
//              who survives.
//   colonies   Daughters may stay stuck to their mother (the `stick` gene) and
//              pass energy to their neighbours (`share`). Predators engulf
//              anything small: a single cell or a tiny clump. Sticking costs
//              food (crowding) but protects. Inspired by experiments where
//              predators made single-celled algae evolve clumps (Boraas 1998).
//   bodies     Cells in a clump can specialise (`specialise`): cells on the
//              outside become movers that swim but never divide, cells inside
//              become germ cells that divide but cannot swim. Generalists must
//              stop swimming while they grow. Movers age and die: the first
//              bodies, and the first deaths of a body's own cells.
//   nerves     Some movers can become nerve cells (`nerve`). A cell that tastes
//              richer food than the body's average fires; nerve cells pass the
//              signal (and where it came from) to their neighbours, one step at
//              a time, so movers across the body push the same way. Without
//              nerves, each mover only knows what its direct neighbours taste.
//
// No DOM here; runs in the browser and in Node.
(function (root) {
  'use strict';

  const LIFE_DEFAULTS = {
    stage: 'cells',          // cells | colonies | bodies | nerves
    startCells: 120,
    maxCells: 900,
    radius: 0.28,            // cell radius, in map cells
    eatRate: 0.015,          // most food a cell takes per step, per kind
    foodValue: 0.6,          // energy gained per unit eaten
    baseCost: 0.008,         // energy spent per step just living
    moveCost: 0.05,          // extra cost per unit of speed²
    maxAge: 3000,
    moverAge: 1500,          // movers in a body wear out sooner
    mutation: 0.12,
    tumbleBase: 0.4,         // chance to tumble per step when food is not improving
    predators: 0,            // engulfers at the start
    predatorEats: 4,         // engulfers can only swallow clumps smaller than this
    predatorSpeed: 0.2, 
    predatorCost: 0.005,
    predatorGain: 0.6,
    predatorDigest: 80,      // steps a predator rests after a meal
    predatorSplit: 4,
    maxPredators: 35,
    preyPerPredator: 15,     // predators cannot outgrow their prey
    maxClump: 24,            // clumps bigger than this tend to break apart
    germEat: 1.6,            // germ cells take in food faster
    moverBoost: 1.8,         // movers swim faster than generalists
    bodySize: 16,            // germ cells release a free daughter beyond this size
    drift: 1,                // how much of the current carries a cell (cells near the floor feel less of it)
    lightGain: 0,            // energy a cell's pigment harvests from light per step (first cells only)
    lightBest: 0.6,          // eyespots steer toward light below this, away above it
    shadeAt: 3,              // more cells than this in one map cell share its light
    eyeCost: 0.002,          // upkeep of a full eyespot per step
    geneStart: null,         // optional overrides of GENE_START for this world, e.g. { speed: [0, 0] }
    fixed: null,             // optional list of genes that may not evolve in this world
    signalHops: 3,           // nerve signal speed: hops per step
  };

  const STAGE_DEFAULTS = {
    predators: 14, eatRate: 0.02, baseCost: 0.003, predatorDigest: 15, maxPredators: 80, preyPerPredator: 8, predatorCost: 0.008,
  };

  // First cells carry a simple pigment that harvests a little light, as early
  // phototrophs did; that is what makes sensing light worth having.
  // They also feel less of the current than drifting molecules do (they live
  // near the floor), so a motor can take them somewhere.
  const CELL_DEFAULTS = {
    lightGain: 0.03, shadeAt: 2, eyeCost: 0.0005, lightBest: 0.5, drift: 0.25, foodValue: 0.45, mutation: 0.2,
  };

  // Gene ranges: [min, max]. Starting values come from GENE_START per stage.
  const GENES = {
    speed: [0, 0.5],         // motor strength (a flagellum): how fast the cell can swim
    tumble: [0, 1],          // how strongly improving food suppresses tumbling
    divideAt: [1.2, 4],
    stick: [0, 1],
    share: [0, 1],
    specialise: [0, 1],
    nerve: [0, 1],
    eyespot: [0, 1],         // light sensing: how strongly the cell turns toward light
  };
  const GENE_START = {
    // First cells start without working motors or light sense: they drift.
    cells: { speed: [0, 0.02], tumble: [0, 0.2], divideAt: [1.8, 2.4], stick: [0, 0], share: [0, 0], specialise: [0, 0], nerve: [0, 0], eyespot: [0, 0.05] },
    colonies: { speed: [0.08, 0.14], tumble: [0.5, 0.7], divideAt: [1.8, 2.2], stick: [0, 0.15], share: [0, 0.2], specialise: [0, 0], nerve: [0, 0], eyespot: [0, 0] },
    bodies: { speed: [0.1, 0.14], tumble: [0.5, 0.7], divideAt: [1.8, 2.2], stick: [0.85, 0.95], share: [0.4, 0.6], specialise: [0, 0.15], nerve: [0, 0], eyespot: [0, 0] },
    nerves: { speed: [0.1, 0.14], tumble: [0.5, 0.7], divideAt: [1.8, 2.2], stick: [0.85, 0.95], share: [0.4, 0.6], specialise: [0.9, 1], nerve: [0, 0.15], eyespot: [0, 0] },
  };
  // Genes that do not evolve in a stage (held at their start value).
  const FIXED = {
    cells: ['stick', 'share', 'specialise', 'nerve'],
    colonies: ['specialise', 'nerve', 'eyespot'],
    bodies: ['nerve', 'eyespot'],
    nerves: ['eyespot'],
  };

  // Roles inside a clump.
  const SINGLE = 0, GENERALIST = 1, MOVER = 2, GERM = 3, NERVE = 4;

  class Life {
    constructor(chem, params) {
      this.chem = chem;
      this.earth = chem.earth;
      this.p = Object.assign({}, LIFE_DEFAULTS, params || {});
      // From colonies on, the water holds predators and is richer in food, so
      // being eaten, not starving, is the main way to die.
      if (this.p.stage !== 'cells') {
        this.p = Object.assign({}, LIFE_DEFAULTS, STAGE_DEFAULTS, params || {});
      } else {
        this.p = Object.assign({}, LIFE_DEFAULTS, CELL_DEFAULTS, params || {});
      }
      this.rng = this.earth.rng;
      this.cells = [];
      this.byId = new Map();
      this.predators = [];
      this.nextId = 1;
      this.journal = [];
      this._seen = {};
      this.history = [];
      this.stats = {};
      this.maxGen = 0;
      this.births = 0;
      this.deaths = 0;
      this.deathsBy = { starved: 0, cooked: 0, stranded: 0, old: 0 };
      this.signalsFired = 0;
      this._grid = new Map();
      this._seeded = false;
    }

    get t() { return this.earth.t; }

    // Find a wet spot with food, to place new cells.
    _spot(near) {
      const e = this.earth, f = this.chem.f;
      let best = null, bv = -1;
      for (let k = 0; k < 60; k++) {
        let x, y;
        if (near) { x = near.x + (this.rng() - 0.5) * 12; y = near.y + (this.rng() - 0.5) * 12; }
        else { x = this.rng() * e.cols; y = this.rng() * e.rows; }
        const i = e.cellAt(x, y);
        if (!e.connected[i] || e.temp[i] > 60) continue;
        const v = f.blocks[i] + f.energy[i] + this.rng() * 0.05;
        if (v > bv) { bv = v; best = { x, y }; }
      }
      return best;
    }

    _genes(stage) {
      const g = {}, st = Object.assign({}, GENE_START[stage], this.p.geneStart || {});
      for (const k of Object.keys(GENES)) { const [a, b] = st[k]; g[k] = a + (b - a) * this.rng(); }
      return g;
    }

    _newCell(x, y, g, energy, parent) {
      const c = {
        id: this.nextId++, x, y, px: x, py: y, heading: this.rng() * Math.PI * 2,
        energy, age: 0, gen: parent ? parent.gen + 1 : 0, g, bonds: [],
        role: SINGLE, lastFood: 0, light: 0, fire: 0, refractory: 0, signal: null, signalAge: 99,
        parent: parent ? parent.id : 0, clump: 0, clumpSize: 1, kids: 0,
      };
      this.cells.push(c);
      this.byId.set(c.id, c);
      return c;
    }

    seed() {
      const P = this.p, stage = P.stage;
      for (let k = 0; k < P.startCells; k++) {
        const s = this._spot();
        if (!s) continue;
        const c = this._newCell(s.x, s.y, this._genes(stage), 1, null);
        // Later chapters start from small clumps, as the earlier chapter left them.
        if (stage === 'bodies' || stage === 'nerves') {
          for (let j = 0; j < 5 && this.cells.length < P.maxCells; j++) {
            const a = this.rng() * Math.PI * 2;
            const d = this._newCell(c.x + Math.cos(a) * P.radius * 2, c.y + Math.sin(a) * P.radius * 2, Object.assign({}, c.g), 1, c);
            this._bond(c, d);
          }
        }
      }
      for (let k = 0; k < P.predators; k++) this._newPredator();
      this._seeded = true;
    }

    _newPredator(at) {
      const s = at || this._spot();
      if (!s) return;
      this.predators.push({ id: this.nextId++, x: s.x, y: s.y, heading: this.rng() * 6.28, energy: 3, age: 0 });
    }

    _bond(a, b) { a.bonds.push(b.id); b.bonds.push(a.id); }
    _unbond(a, b) {
      a.bonds = a.bonds.filter((id) => id !== b.id);
      b.bonds = b.bonds.filter((id) => id !== a.id);
    }

    _mutate(g) {
      const P = this.p, out = {}, fixed = P.fixed ? FIXED[P.stage].concat(P.fixed) : FIXED[P.stage];
      for (const k of Object.keys(GENES)) {
        let v = g[k];
        if (!fixed.includes(k)) {
          const [a, b] = GENES[k];
          v += (this.rng() + this.rng() - 1) * P.mutation * (b - a);
          v = Math.max(a, Math.min(b, v));
        }
        out[k] = v;
      }
      return out;
    }

    step() {
      if (!this._seeded) this.seed();
      this.chem.step();
      this._clumps();
      this._roles();
      if (this.p.stage === 'nerves') this._signals();
      this._live();
      this._physics();
      this._hunt();
      if (this.earth.t % 10 === 0) this._measure();
    }

    // Label connected clumps (flood fill over bonds).
    _clumps() {
      let label = 0;
      for (const c of this.cells) c.clump = 0;
      for (const c of this.cells) {
        if (c.clump) continue;
        label++;
        const stack = [c], members = [];
        c.clump = label;
        while (stack.length) {
          const x = stack.pop(); members.push(x);
          for (const id of x.bonds) { const y = this.byId.get(id); if (y && !y.clump) { y.clump = label; stack.push(y); } }
        }
        // The oldest member steers a clump of generalists (they swim as one).
        let lead = members[0];
        for (const m of members) if (m.id < lead.id) lead = m;
        for (const m of members) { m.clumpSize = members.length; m.lead = lead; }
      }
    }

    // Roles: in bodies, cells on the outside of a clump move and cells near
    // its middle are germ cells, if the cell's `specialise` gene says so.
    // Each cell decides once, when its clump first reaches four cells.
    _roles() {
      const stage = this.p.stage, mid = new Map();
      if (stage === 'bodies' || stage === 'nerves') {
        for (const c of this.cells) {
          if (c.clumpSize < 4) continue;
          const m = mid.get(c.clump) || { x: 0, y: 0, n: 0, far: 0 };
          m.x += c.x; m.y += c.y; m.n++;
          mid.set(c.clump, m);
        }
        for (const m of mid.values()) { m.x /= m.n; m.y /= m.n; }
        for (const c of this.cells) {
          const m = mid.get(c.clump);
          if (m) m.far = Math.max(m.far, Math.hypot(c.x - m.x, c.y - m.y));
        }
      }
      for (const c of this.cells) {
        if (c.clumpSize === 1) { c.role = SINGLE; c.roleFixed = false; continue; }
        if (stage === 'cells' || stage === 'colonies') { c.role = GENERALIST; continue; }
        if (c.roleFixed) continue;
        if (c.clumpSize < 4) { c.role = GENERALIST; continue; }
        c.roleFixed = true;
        if (this.rng() >= c.g.specialise) { c.role = GENERALIST; continue; }
        const m = mid.get(c.clump);
        const inside = c === c.lead || Math.hypot(c.x - m.x, c.y - m.y) < m.far * 0.55;
        if (inside) c.role = GERM;
        else c.role = stage === 'nerves' && this.rng() < c.g.nerve ? NERVE : MOVER;
      }
    }

    // Nerve signals: a cell that tastes more than its clump's average fires.
    // Nerve cells relay the signal to bonded neighbours; it carries where the
    // food was. Movers push toward the freshest signal they have received.
    _signals() {
      const f = this.chem.f, e = this.earth;
      const sum = new Map(), cnt = new Map();
      for (const c of this.cells) {
        const v = f.blocks[e.cellAt(c.x, c.y)];
        c.taste = v;
        sum.set(c.clump, (sum.get(c.clump) || 0) + v);
        cnt.set(c.clump, (cnt.get(c.clump) || 0) + 1);
      }
      const fired = [];
      for (const c of this.cells) {
        c.signalAge++;
        if (c.refractory > 0) { c.refractory--; c.fire = 0; continue; }
        if (c.clumpSize < 3) continue;
        const mean = sum.get(c.clump) / cnt.get(c.clump);
        if (c.taste > mean * 1.15 + 0.005 && (c.role === NERVE || c.role === MOVER)) {
          c.fire = 1; c.signal = { x: c.x, y: c.y }; c.signalAge = 0; c.refractory = 6;
          fired.push(c);
          this.signalsFired++;
        }
      }
      // Relay through nerve cells (and from any firing cell to its direct neighbours).
      let front = fired;
      for (let hop = 0; hop < this.p.signalHops; hop++) {
        const next = [];
        for (const c of front) {
          for (const id of c.bonds) {
            const n = this.byId.get(id);
            if (!n || n.refractory > 0 || n.signalAge === 0) continue;
            n.signal = c.signal; n.signalAge = 0;
            if (n.role === NERVE) { n.fire = 1; n.refractory = 6; next.push(n); }
          }
        }
        front = next;
      }
      this._relay = front;
    }

    _live() {
      const P = this.p, e = this.earth, f = this.chem.f, rng = this.rng, stage = P.stage;
      const alive = [];
      const born = [];
      // Relay nerve signals that are still travelling.
      if (this._relay && this._relay.length) {
        const next = [];
        for (const c of this._relay) for (const id of c.bonds) {
          const n = this.byId.get(id);
          if (!n || n.refractory > 0 || n.signalAge === 0) continue;
          n.signal = c.signal; n.signalAge = 0;
          if (n.role === NERVE) { n.fire = 1; n.refractory = 6; next.push(n); }
        }
        this._relay = next;
      }
      // Cells crowded into one spot shade each other: light is shared.
      const occ = this._occ || (this._occ = new Uint16Array(e.n));
      occ.fill(0);
      // Light in open water only (land is bright too, but no place to swim).
      const lw = this._lw || (this._lw = new Float32Array(e.n));
      for (let i = 0; i < e.n; i++) lw[i] = e.connected[i] ? e.light[i] : 0;
      for (const c of this.cells) occ[e.cellAt(c.x, c.y)]++;
      for (const c of this.cells) {
        c.age++;
        const i = e.cellAt(c.x, c.y);
        // Eat what is here: blocks and energy, shared with whoever else is here.
        const wet = e.water[i] > 0.01;
        let food = 0;
        if (wet) {
          const k = c.role === GERM ? P.germEat : 1;
          const a = Math.min(f.blocks[i], P.eatRate * k), b = Math.min(f.energy[i], P.eatRate * k);
          f.blocks[i] -= a; f.energy[i] -= b;
          food = a + b;
        }
        c.energy += food * P.foodValue;
        // Light: a little energy from pigment, and a light reading for the eyespot.
        const light = wet ? this.sample(e.light, c.x, c.y) : 0;
        c.energy += P.lightGain * light / Math.max(1, occ[i] / P.shadeAt);
        // Costs: living, and swimming.
        const swims = c.role === MOVER || c.role === NERVE || c.role === SINGLE ||
          (c.role === GENERALIST && c.energy < c.g.divideAt * 0.6);
        c.swimming = swims && c.role !== GERM;
        const sp = c.swimming ? c.g.speed * (c.role === MOVER || c.role === NERVE ? P.moverBoost : 1) : 0;
        c.energy -= P.baseCost + P.moveCost * sp * sp + P.eyeCost * c.g.eyespot;
        // Share energy with bonded neighbours.
        if (c.bonds.length && c.g.share > 0) {
          const give = c.energy * 0.02 * c.g.share;
          let given = 0;
          for (const id of c.bonds) {
            const n = this.byId.get(id);
            if (n && n.energy < c.energy) { n.energy += give / c.bonds.length; given += give / c.bonds.length; }
          }
          c.energy -= given;
        }
        // Run and tumble: compare food with a moment ago (sampled smoothly,
        // so small moves still register).
        const taste = wet ? this.sample(f.blocks, c.x, c.y) + this.sample(f.energy, c.x, c.y) : 0;
        const better = taste > c.lastFood;
        c.lastFood = taste;
        c.light = light;
        const pt = P.tumbleBase * (better ? 1 - c.g.tumble : 1);
        if (rng() < pt) c.heading = rng() * Math.PI * 2;
        // Eyespot: a pigment spot shades the light sensor from one side, so the
        // cell can tell where light comes from and turns toward it (as
        // Chlamydomonas does), more strongly the bigger its eyespot.
        if (c.g.eyespot > 0 && light > 0.01 && sp > 0) {
          const gx = this.sample(lw, c.x + 0.6, c.y) - this.sample(lw, c.x - 0.6, c.y);
          const gy = this.sample(lw, c.x, c.y + 0.6) - this.sample(lw, c.x, c.y - 0.6);
          if (Math.abs(gx) + Math.abs(gy) > 0.002) {
            // Toward light while it is dim, away from it when it is too bright
            // (as Chlamydomonas switches at high intensity): this keeps
            // cells off the shallowest rocks, where the tide strands them.
            const sign = light < P.lightBest ? 1 : -1;
            const turn = Math.sin(Math.atan2(gy * sign, gx * sign) - c.heading);
            c.heading += c.g.eyespot * 0.4 * turn;
          }
        }
        c.speedNow = sp;
        // Death: starved, cooked, stranded or old.
        const old = c.age > (c.role === MOVER || c.role === NERVE ? P.moverAge : P.maxAge);
        const stranded = !wet && e.ground[i] > e.seaLevel + 0.05;
        if (c.energy <= 0 || e.temp[i] > 65 || stranded || old) {
          const why = c.energy <= 0 ? 'starved' : e.temp[i] > 65 ? 'cooked' : stranded ? 'stranded' : 'old';
          this.deathsBy[why]++;
          this._die(c, i);
          if (old && (c.role === MOVER || c.role === NERVE)) this._note('soma-death', c.x, c.y, 'A body\'s own cells grow old and die', 'A mover cell in a body wore out and died, while the germ cells inside live on and make new cells. Bodies made of cells that cannot pass on their genes are a big step in the history of life.');
          continue;
        }
        alive.push(c);
        // Divide.
        if (c.energy >= c.g.divideAt && c.role !== MOVER && c.role !== NERVE && this.cells.length + born.length < P.maxCells) {
          born.push(c);
        }
      }
      this.cells = alive;
      for (const c of born) this._divide(c);
      if (this.cells.length === 0 && !this._seen.extinct) {
        this._seen.extinct = true;
        this._add('All cells died', 'Every cell starved or was eaten. Restart the chapter or change the speed to see another history.', null, null);
      }
    }

    _divide(c) {
      const P = this.p, rng = this.rng;
      c.energy /= 2;
      const a = rng() * Math.PI * 2, r = P.radius * 2;
      const d = this._newCell(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, this._mutate(c.g), c.energy, c);
      c.kids++;
      this.births++;
      if (d.gen > this.maxGen) this.maxGen = d.gen;
      // Stay stuck together?
      const limit = P.stage === 'bodies' || P.stage === 'nerves' ? P.bodySize : P.maxClump;
      if (rng() < c.g.stick && c.clumpSize < limit) {
        this._bond(c, d);
        // Bond to a second neighbour too, so clumps are not just chains.
        for (const id of c.bonds) {
          const n = this.byId.get(id);
          if (n && n !== d && n.bonds.length < 4 && (n.x - d.x) ** 2 + (n.y - d.y) ** 2 < (r * 1.6) ** 2) { this._bond(n, d); break; }
        }
      }
    }

    _die(c, i) {
      const f = this.chem.f;
      for (const id of c.bonds) { const n = this.byId.get(id); if (n) n.bonds = n.bonds.filter((x) => x !== c.id); }
      this.byId.delete(c.id);
      if (this.earth.water[i] > 0.01) f.blocks[i] = Math.min(20, f.blocks[i] + 0.1);
      this.deaths++;
      c.dead = true;
    }

    // Movement: each swimming cell pushes along its heading (or toward a
    // nerve signal); bonds hold clumps together; currents carry everything.
    _physics() {
      const P = this.p, e = this.earth, r2 = (P.radius * 2) ** 2;
      // Push.
      const sums = new Map();
      for (const c of this.cells) {
        const steer = c.clumpSize > 1 && c.role === GENERALIST && c.lead ? c.lead.heading : c.heading;
        let hx = Math.cos(steer), hy = Math.sin(steer);
        if ((c.role === MOVER || c.role === NERVE) && c.signal && c.signalAge < 25) {
          const dx = c.signal.x - c.x, dy = c.signal.y - c.y, d = Math.hypot(dx, dy) || 1;
          hx = dx / d; hy = dy / d;
        } else if ((c.role === MOVER || c.role === NERVE) && P.stage === 'nerves') {
          // No signal: drift with the body.
          hx *= 0.3; hy *= 0.3;
        }
        c.fx = hx * c.speedNow; c.fy = hy * c.speedNow;
        if (c.clumpSize > 1) {
          const s = sums.get(c.clump) || { x: 0, y: 0, n: 0 };
          s.x += c.fx; s.y += c.fy; s.n++;
          sums.set(c.clump, s);
        }
      }
      for (const c of this.cells) {
        let mx = c.fx, my = c.fy;
        // A clump moves together: every cell takes the clump's average push.
        if (c.clumpSize > 1) { const s = sums.get(c.clump); mx = s.x / s.n; my = s.y / s.n; }
        const i = e.cellAt(c.x, c.y);
        if (e.connected[i]) { mx += e.vx[i] * P.drift; my += e.vy[i] * P.drift; }
        mx += (this.rng() - 0.5) * 0.04; my += (this.rng() - 0.5) * 0.04;
        const nx = c.x + mx, ny = c.y + my;
        // Do not swim onto dry land.
        if (e.water[e.cellAt(nx, ny)] > 0.01) { c.x = nx; c.y = ny; }
        c.x = Math.max(0, Math.min(e.cols - 0.01, c.x));
        c.y = Math.max(0, Math.min(e.rows - 0.01, c.y));
      }
      // Bonds: keep bonded cells at touching distance; break when overstretched.
      const rest = P.radius * 2;
      for (let it = 0; it < 2; it++) {
        for (const c of this.cells) {
          for (const id of c.bonds) {
            if (id < c.id) continue;
            const n = this.byId.get(id);
            if (!n) continue;
            const dx = n.x - c.x, dy = n.y - c.y, d = Math.hypot(dx, dy) || 1e-6;
            if (d > rest * 6) { this._unbond(c, n); continue; }
            const k = (d - rest) / d * 0.5;
            c.x += dx * k; c.y += dy * k; n.x -= dx * k; n.y -= dy * k;
          }
        }
      }
      // Big clumps fragment now and then.
      const limit = P.stage === 'bodies' || P.stage === 'nerves' ? P.bodySize * 1.5 : P.maxClump;
      for (const c of this.cells) {
        if (c.clumpSize > limit && c.bonds.length && this.rng() < 0.002) {
          const n = this.byId.get(c.bonds[0]);
          if (n) this._unbond(c, n);
        }
      }
      // Germ cells in a full body bud off a free daughter: a new body begins.
      if (P.stage === 'bodies' || P.stage === 'nerves') {
        for (const c of this.cells) {
          if (c.role === GERM && c.clumpSize >= P.bodySize && c.energy > c.g.divideAt * 0.9 && this.rng() < 0.01) {
            c.energy /= 2;
            const d = this._newCell(c.x + P.radius * 3, c.y, this._mutate(c.g), c.energy, c);
            d.heading = this.rng() * 6.28;
            this.births++;
            this._note('propagule', c.x, c.y, 'A body released a seed cell', 'A germ cell inside a full body let go of a daughter. It will grow into a new body of its own: reproduction through a single cell, as in plants and animals.');
          }
        }
      }
      // Light push apart for crowded unbonded cells, using a coarse grid.
      const grid = this._grid; grid.clear();
      for (const c of this.cells) {
        const key = (c.x | 0) * 1000 + (c.y | 0);
        let a = grid.get(key); if (!a) { a = []; grid.set(key, a); } a.push(c);
      }
      for (const a of grid.values()) {
        if (a.length < 2) continue;
        for (let p = 0; p < a.length; p++) for (let q = p + 1; q < a.length; q++) {
          const c = a[p], n = a[q];
          const dx = n.x - c.x, dy = n.y - c.y, d2 = dx * dx + dy * dy;
          if (d2 < r2 && d2 > 1e-8) {
            const d = Math.sqrt(d2), k = (Math.sqrt(r2) - d) / d * 0.25;
            c.x -= dx * k; c.y -= dy * k; n.x += dx * k; n.y += dy * k;
          }
        }
      }
    }

    // Predators: big engulfing cells that can only swallow small clumps.
    _hunt() {
      const P = this.p, e = this.earth;
      // A few cells drift in from the open sea when the coast is nearly empty.
      if (this.cells.length < 15 && this.rng() < 0.02) {
        const s = this._spot(), src = this.cells[Math.floor(this.rng() * this.cells.length)];
        if (s) this._newCell(s.x, s.y, src ? this._mutate(src.g) : this._genes(this.p.stage), 1, null);
      }
      if (!this.predators.length) return;
      const alive = [];
      let count = this.predators.length;
      const cap = Math.min(P.maxPredators, 2 + this.cells.length / P.preyPerPredator);
      for (const h of this.predators) {
        h.age++;
        if (h.digest > 0) { h.digest--; h.energy -= P.predatorCost * 0.5; alive.push(h); continue; }
        let target = null, bd = 100;
        for (const c of this.cells) {
          if (c.clumpSize >= P.predatorEats) continue;
          const d = (c.x - h.x) ** 2 + (c.y - h.y) ** 2;
          if (d < bd) { bd = d; target = c; }
        }
        if (target) h.heading = Math.atan2(target.y - h.y, target.x - h.x);
        else if (this.rng() < 0.05) h.heading = this.rng() * 6.28;
        const i = e.cellAt(h.x, h.y);
        let mx = Math.cos(h.heading) * P.predatorSpeed, my = Math.sin(h.heading) * P.predatorSpeed;
        if (e.connected[i]) { mx += e.vx[i]; my += e.vy[i]; }
        const nx = h.x + mx, ny = h.y + my;
        if (e.water[e.cellAt(nx, ny)] > 0.01) { h.x = Math.max(0, Math.min(e.cols - 0.01, nx)); h.y = Math.max(0, Math.min(e.rows - 0.01, ny)); }
        else h.heading += Math.PI * (0.5 + this.rng());
        h.energy -= P.predatorCost;
        if (target && bd < 0.36) {
          // A single cell is swallowed whole. A small clump is harder to get
          // hold of: the predator often fails, and then only tears off one cell.
          if (target.clumpSize > 1 && this.rng() > 1 / (target.clumpSize * target.clumpSize)) { h.heading += Math.PI * (0.5 + this.rng()); h.digest = 10; alive.push(h); continue; }
          const victims = [target];
          for (const v of victims) { this._die(v, e.cellAt(v.x, v.y)); h.energy += P.predatorGain; }
          this.cells = this.cells.filter((c) => !c.dead);
          this.eaten = (this.eaten || 0) + victims.length;
          h.digest = P.predatorDigest * victims.length;
        }
        if (h.energy <= 0 || e.temp[e.cellAt(h.x, h.y)] > 65) { count--; continue; }
        alive.push(h);
        if (h.energy > P.predatorSplit && count < cap) {
          count++;
          h.energy /= 2;
          alive.push({ id: this.nextId++, x: h.x + 0.5, y: h.y, heading: this.rng() * 6.28, energy: h.energy, age: 0 });
        }
      }
      this.predators = alive;
      // Predators drift back in from the open sea if they all starve.
      if (!this.predators.length && this.p.stage !== 'cells' && this.rng() < 0.01) this._newPredator();
    }

    _measure() {
      const n = this.cells.length;
      const mean = {};
      for (const k of Object.keys(GENES)) mean[k] = 0;
      let inClumps = 0, bigClumps = new Set(), movers = 0, germs = 0, nerves = 0, specialised = new Set(), withNerves = new Set();
      let largest = 0;
      for (const c of this.cells) {
        for (const k of Object.keys(GENES)) mean[k] += c.g[k];
        if (c.clumpSize > 1) inClumps++;
        if (c.clumpSize >= 4) bigClumps.add(c.clump);
        if (c.clumpSize > largest) largest = c.clumpSize;
        if (c.role === MOVER) movers++;
        if (c.role === GERM) { germs++; }
        if (c.role === NERVE) { nerves++; withNerves.add(c.clump); }
        if (c.role === MOVER || c.role === NERVE) specialised.add(c.clump);
      }
      if (n) for (const k of Object.keys(GENES)) mean[k] /= n;
      const st = {
        t: this.earth.t, day: this.earth.day, cells: n, predators: this.predators.length,
        inClumps: n ? inClumps / n : 0, clumps: bigClumps.size, largest,
        movers, germs, nerves, bodies: specialised.size, nerveBodies: withNerves.size,
        maxGen: this.maxGen,
        speed: mean.speed, tumble: mean.tumble, stick: mean.stick, share: mean.share,
        specialise: mean.specialise, nerve: mean.nerve, divideAt: mean.divideAt, eyespot: mean.eyespot,
        lightAtCells: n ? this.cells.reduce((a, c) => a + c.light, 0) / n : 0, lightInWater: this._waterLight(),
      };
      this.stats = st;
      this.history.push(st);
      if (this.history.length > 1200) this.history.splice(0, this.history.length - 1200);
      this._detect(st);
    }

    _detect(st) {
      const P = this.p, first = this.history[0] || st;
      const where = () => {
        const c = this.cells[Math.floor(this.rng() * this.cells.length)];
        return c ? [c.x, c.y] : [null, null];
      };
      if (st.cells >= this.p.startCells * 2) { const [x, y] = where(); this._note('boom', x, y, 'The population doubled', 'Cells found the places where food is made (sunlit shallows and warm water near the vents) and multiplied there.'); }
      if (st.maxGen >= 20) { const [x, y] = where(); this._note('gen20', x, y, 'A family line reached 20 generations', 'Twenty divisions in a row. Each time the genes copy with small mistakes, so the population slowly changes.'); }
      if (P.stage === 'cells' && first.speed < 0.04 && st.speed > first.speed + 0.05) this._note('motors', null, null, 'Motors evolved', 'The average motor gene rose from ' + first.speed.toFixed(2) + ' to ' + st.speed.toFixed(2) + '. Cells that swim a little reach fresh food before it is eaten or carried off, and leave more daughters, even though swimming costs energy.');
      if (P.stage === 'cells' && st.tumble > first.tumble + 0.15) this._note('chemotaxis', null, null, 'Cells learned to follow food (by evolution)', 'The average "follows food" gene rose from ' + first.tumble.toFixed(2) + ' to ' + st.tumble.toFixed(2) + '. Cells now keep swimming while food gets richer and turn when it gets poorer: chemotaxis, the oldest way of finding food. Nobody designed it; cells that did it ate more and left more daughters.');
      if (P.stage === 'colonies') {
        if (st.clumps > 0) { const c = this.cells.find((x) => x.clumpSize >= 4); if (c) this._note('clump', c.x, c.y, 'First clump of four', 'Four cells stayed stuck together after dividing. A clump this size is too big for the predators to swallow.'); }
        if (st.stick > first.stick + 0.2) this._note('sticky', null, null, 'Sticking together spread', 'The average "stick" gene rose from ' + first.stick.toFixed(2) + ' to ' + st.stick.toFixed(2) + '. With predators around, cells that stay together survive; single cells get eaten.');
        if (st.inClumps > 0.6 && st.cells > 30) this._note('colonial', null, null, 'Most cells now live in colonies', Math.round(st.inClumps * 100) + '% of cells are in clumps. Remove the predators (switch to First cells) and sticking stops paying.');
      }
      if (P.stage === 'bodies' || P.stage === 'nerves') {
        if (st.bodies > 0) { const c = this.cells.find((x) => x.role === MOVER); if (c) this._note('labour', c.x, c.y, 'First division of labour', 'In one clump, outer cells became movers that never divide and inner cells became germ cells that divide but never swim. Each does one job.'); }
        if (st.specialise > first.specialise + 0.1) this._note('specialised', null, null, 'Specialising spread', 'The average "specialise" gene rose from ' + first.specialise.toFixed(2) + ' to ' + st.specialise.toFixed(2) + '. Bodies whose cells split the work move and grow at once, and leave more seed cells.');
      }
      if (P.stage === 'nerves') {
        if (st.nerves > 0) { const c = this.cells.find((x) => x.role === NERVE); if (c) this._note('nerve', c.x, c.y, 'First nerve cell', 'An outer cell became a nerve cell: it passes signals on to its neighbours. Alone it does little.'); }
        if (st.nerveBodies >= 5) this._note('nets', null, null, 'Bodies with nerve nets', st.nerveBodies + ' bodies now carry nerve cells. When one side tastes richer food, the signal spreads and movers on the other side push the same way, so the whole body swims toward food.');
        if (st.nerve > first.nerve + 0.12) this._note('nerves-spread', null, null, 'Nerve cells spread', 'The average "nerve" gene rose from ' + first.nerve.toFixed(2) + ' to ' + st.nerve.toFixed(2) + '. Coordinated bodies reach food first.');
      }
      if (st.cells === 0 && this.predators.length) this._note('eaten', null, null, 'The predators won', 'Every cell was eaten or starved. Try again: the history will be different.');
    }

    // Average light reaching wet ground: what a cell would get by drifting at random.
    _waterLight() {
      const e = this.earth;
      let s = 0, n = 0;
      for (let i = 0; i < e.n; i += 3) if (e.connected[i]) { s += e.light[i]; n++; }
      return n ? s / n : 0;
    }

    _note(key, x, y, title, text) {
      if (this._seen[key]) return;
      this._seen[key] = true;
      this._add(title, text, x, y);
    }
    _add(title, text, x, y) { this.journal.push({ t: this.earth.t, day: this.earth.day, title, text, x, y }); }

    sample(v, x, y) {
      const e = this.earth, cols = e.cols;
      const sx = Math.max(0, Math.min(cols - 1.001, x - 0.5)), sy = Math.max(0, Math.min(e.rows - 1.001, y - 0.5));
      const x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0, i = y0 * cols + x0;
      return v[i] * (1 - fx) * (1 - fy) + v[i + 1] * fx * (1 - fy) + v[i + cols] * (1 - fx) * fy + v[i + cols + 1] * fx * fy;
    }

    cellNear(x, y, r) {
      let best = null, bd = r * r;
      for (const c of this.cells) { const d = (c.x - x) ** 2 + (c.y - y) ** 2; if (d < bd) { bd = d; best = c; } }
      return best;
    }
    clumpOf(c) { return this.cells.filter((x) => x.clump === c.clump); }
  }

  const ROLE_NAMES = ['single cell', 'colony cell', 'mover', 'germ cell', 'nerve cell'];

  // A chapter world: same coast and chemistry as Early Earth (seed 3), with
  // bubbles switched off and cells in the water.
  function makeLife(stage, seed, params) {
    const chem = root.ChemSim || (typeof require !== 'undefined' ? require('./chemistry.js') : null);
    const w = chem.makeWorld('full', seed == null ? 3 : seed);
    w.p.maxBubbles = 0;
    // Let the chemistry run a little first, so there is food to eat.
    for (let i = 0; i < 300; i++) w.step();
    return new Life(w, Object.assign({ stage }, params || {}));
  }

  const api = { Life, LIFE_DEFAULTS, GENES, GENE_START, FIXED, ROLE_NAMES, SINGLE, GENERALIST, MOVER, GERM, NERVE, makeLife };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LifeSim = api;
})(typeof self !== 'undefined' ? self : this);
