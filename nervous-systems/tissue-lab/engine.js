// Tissue Lab engine: a 2D slice of brain tissue where neurons are a living
// population. They wire themselves, compete for growth factor and energy,
// get pruned by glia, die, and are replaced from a stem-cell niche.
//
// Every change comes from a cell reacting to what it senses locally:
// - Neurons are the same leaky integrate-and-fire cells as lib/brain.js and
//   follow the same homeostatic wiring rule (Butz & van Ooyen 2013): below
//   their target firing rate they grow free synaptic elements, above it they
//   retract them, and free elements nearby pair up at random.
// - Synapses that carry coincident activity (pre fires just before post) get
//   stronger and release growth factor (BDNF) at the receiving cell. Unused
//   synapses collect a complement "eat me" tag (Stevens 2007).
// - Neurons take up growth factor in proportion to their own activity. Supply
//   is limited, so neurons that are not part of active circuits starve of
//   trophic support and die (neurotrophic competition; Levi-Montalcini,
//   Oppenheim 1991).
// - Blood vessels supply glucose, more where tissue is active (neurovascular
//   coupling). Neurons pay energy for living and for each spike.
// - Astrocytes tile the tissue. They turn glucose into lactate for the active
//   neurons in their territory (Pellerin & Magistretti), secrete a little
//   trophic support, and engulf some tagged synapses (Chung 2013).
// - Microglia wander toward eat-me signals and engulf tagged synapses unless
//   recent use protects them, and clear dead cells (Schafer 2012).
// - A stem-cell niche releases newborn neurons, more after injury or strong
//   stimulation. Newborns migrate toward sparse tissue, are extra excitable
//   and extra plastic for a window, and must integrate or die.
//
// Two clocks: a fast clock for spikes (one step), a field clock for chemistry
// and glia (every fieldEvery steps) and a slow structural clock for growth,
// pruning and death (every structuralEvery steps).
//
// No DOM here, so it runs in the browser and in Node. Each Tissue owns its
// own random generator, so several tissues can run side by side.
(function (root) {
  'use strict';

  const BrainSim = typeof module !== 'undefined' && module.exports
    ? require('../../lib/brain.js')
    : root.BrainSim;
  const { EXC, INH, BRAIN_DEFAULTS } = BrainSim;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
  function poisson(rng, mean) {
    if (mean <= 0) return 0;
    const L = Math.exp(-mean);
    let k = 0, p = 1;
    do { k++; p *= rng(); } while (p > L);
    return k - 1;
  }

  const DEFAULTS = {
    seed: 1,
    grid: 64,                // chemical fields are grid x grid over the unit square
    startNeurons: 320,       // more than the tissue can feed, as in development
    inhibitoryShare: 0.2,

    // Neurons: same cell as lib/brain.js.
    tauMembrane: BRAIN_DEFAULTS.tauMembrane,
    threshold: BRAIN_DEFAULTS.threshold,
    refractory: BRAIN_DEFAULTS.refractory,
    tauRate: BRAIN_DEFAULTS.tauRate,
    noise: 0.18,             // spontaneous drive, mean noise/2 per step; alone fires well below target
    targetRate: 0.03,        // homeostatic set point, spikes per step
    inhGain: 2,              // inhibitory synapses count this much more

    // Homeostatic structural plasticity.
    structuralEvery: 100,
    growth: 0.3,             // element growth per structural step at zero activity
    maxElements: 14,
    reach: 0.06,             // width of the distance kernel
    cutoff: 0.15,            // no synapse longer than this (share of tissue width)
    newWeight: 0.12,
    maxWeight: 0.5,
    hebb: 0.04,              // weight gain per coincident event
    weightDecay: 0.03,       // share of weight an unused synapse loses per structural step

    // Energy.
    fieldEvery: 10,
    vessels: 3,
    vesselSupply: 0.05,      // glucose added per vessel cell per field step
    coupling: 3,             // extra supply where tissue is active
    glucoseDecay: 0.02,
    uptake: 0.25,            // share of local glucose a neuron can take per field step
    basalCost: 0.004,        // energy per field step
    spikeCost: 0.012,        // energy per spike
    starveAfter: 15,         // structural steps below starveLevel before death

    // Growth factor.
    bdnfRelease: 1,          // supply: BDNF per coincident event, x 0.05
    bdnfDecay: 0.05,
    trophicNeed: 0.003,      // trophic support a mature neuron needs
    trophicAfter: 25,        // structural steps below need before death
    matureAge: 20,           // structural steps before trophic death applies

    // Glia.
    astrocytes: true,
    astroCount: 24,
    astroRadius: 0.13,
    astroTrophic: 0.004,     // baseline growth factor secreted per field step
    astroLactate: 0.05,
    astroEat: 0.02,          // chance per structural step to engulf each tagged synapse
    microglia: true,
    microgliaPer: 40,        // one microglia per this many starting neurons
    microgliaRadius: 0.05,
    microgliaSpeed: 0.006,
    tagRate: 0.08,           // eat-me tag gained per structural step when unused
    eatTag: 1,               // tag level a glial cell responds to

    // Stem-cell niche.
    neurogenesis: true,
    birthRate: 0.25,         // newborns per structural step at rest
    injuryBoost: 6,          // extra births after injury or stimulation
    migrateSteps: 15,        // structural steps a newborn spends migrating
    newbornWindow: 60,       // structural steps of extra excitability and plasticity
    newbornSprout: 0.25,     // extra element growth per structural step during the window

    historyLimit: 4000,
  };

  let nextId = 1;

  class Tissue {
    constructor(params) {
      this.p = Object.assign({}, DEFAULTS, params || {});
      const p = this.p;
      this.rng = mulberry32(p.seed * 9301 + 49297);
      this.t = 0;
      this.G = p.grid;
      const N = this.G * this.G;
      this.glucose = new Float32Array(N);
      this.lactate = new Float32Array(N);
      this.bdnf = new Float32Array(N);
      this.act = new Float32Array(N);     // recent spiking, also glutamate spillover
      this.tagField = new Float32Array(N); // eat-me signals: tagged synapses and debris
      this.scratch = new Float32Array(N);
      this.vesselMask = new Uint8Array(N);
      this.vesselPaths = [];
      this.decay = Math.exp(-1 / p.tauMembrane);
      this.neurons = [];
      this.synapses = [];
      this.debris = [];
      this.astros = [];
      this.microglia = [];
      this.niche = { x: 0.5, y: 0.94, r: 0.06 };
      this.injury = 0;
      this.counts = { born: 0, formed: 0, retracted: 0, eatenMicroglia: 0, eatenAstro: 0, starved: 0, trophic: 0, lesioned: 0, newbornDied: 0, cleared: 0 };
      this.history = [];
      this.stim = null; // {x, y, r, until}
      this.events = []; // lesions and stimulations, for charts
      this.graves = []; // recent deaths: {id, t, cause}

      this.makeVessels();
      for (let i = 0; i < p.startNeurons; i++) {
        this.addNeuron(0.03 + 0.94 * this.rng(), 0.03 + 0.86 * this.rng(), false);
      }
      if (p.astrocytes) this.makeAstrocytes();
      if (p.microglia) {
        const m = Math.max(1, Math.round(p.startNeurons / p.microgliaPer));
        for (let i = 0; i < m; i++) this.microglia.push({ id: nextId++, x: this.rng(), y: this.rng() * 0.9, vx: 0, vy: 0, ate: 0, cleared: 0 });
      }
      // Pre-fill the glucose field so neurons do not all start starving.
      for (let i = 0; i < 200; i++) this.updateGlucose();
      for (const n of this.neurons) n.energy = 0.6 + 0.4 * this.rng();
      this.rebuildLists();
      this.recordStats();
    }

    // ---------- setup ----------

    makeVessels() {
      const { G, rng } = this;
      for (let v = 0; v < this.p.vessels; v++) {
        // Each vessel crosses the slice from left to right with a slow wander.
        let y = (v + 0.5) / this.p.vessels * 0.85 + (rng() - 0.5) * 0.12;
        let dy = 0;
        const path = [];
        for (let x = 0; x <= 1.0001; x += 1 / G) {
          dy = clamp(dy + (rng() - 0.5) * 0.012, -0.012, 0.012);
          y = clamp(y + dy, 0.04, 0.86);
          path.push([x, y]);
          const cx = Math.min(G - 1, Math.floor(x * G)), cy = Math.floor(y * G);
          for (let o = -1; o <= 1; o++) {
            const yy = cy + o;
            if (yy >= 0 && yy < G) this.vesselMask[yy * G + cx] = 1;
          }
        }
        this.vesselPaths.push(path);
      }
    }

    makeAstrocytes() {
      // Astrocytes keep their own territory: place them by rejection so they
      // stay roughly evenly spaced, leaving some gaps.
      const { rng, p } = this;
      let tries = 0;
      const minD = p.astroRadius * 0.9;
      while (this.astros.length < p.astroCount && tries < 4000) {
        tries++;
        const x = 0.04 + 0.92 * rng(), y = 0.04 + 0.86 * rng();
        if (this.astros.some((a) => (a.x - x) ** 2 + (a.y - y) ** 2 < minD * minD)) continue;
        this.astros.push({ id: nextId++, x, y, store: 0.5, given: 0, ate: 0, feet: this.vesselFeet(x, y) });
      }
    }

    // Cells of blood vessel inside an astrocyte's territory: its end-feet draw glucose there.
    vesselFeet(x, y) {
      const G = this.G, r = this.p.astroRadius, feet = [];
      for (let cy = Math.max(0, Math.floor((y - r) * G)); cy <= Math.min(G - 1, Math.floor((y + r) * G)); cy++) {
        for (let cx = Math.max(0, Math.floor((x - r) * G)); cx <= Math.min(G - 1, Math.floor((x + r) * G)); cx++) {
          const c = cy * G + cx;
          if (this.vesselMask[c] && ((cx + 0.5) / G - x) ** 2 + ((cy + 0.5) / G - y) ** 2 < r * r) feet.push(c);
        }
      }
      return feet;
    }

    addNeuron(x, y, newborn) {
      const p = this.p;
      const n = {
        id: nextId++,
        x, y,
        type: this.rng() < p.inhibitoryShare ? INH : EXC,
        v: 0, input: 0, refr: 0, spiked: 0, lastSpike: -1000, spikes: 0,
        rate: newborn ? 0 : p.targetRate * 0.3,
        axEl: newborn ? 0 : 1 + this.rng(), denEl: newborn ? 0 : 1 + this.rng(),
        energy: 0.8, trophic: p.trophicNeed * 1.5, lowTrophic: 0, lowEnergy: 0,
        bdnfOut: 0, age: 0,
        matureAt: Math.round(p.matureAge * (0.5 + 1.5 * this.rng())), // cells mature at different times
        newborn: !!newborn, migrating: newborn ? p.migrateSteps : 0,
        bornAt: this.t,
        out: [], in: [],
        dead: false,
      };
      this.neurons.push(n);
      return n;
    }

    // ---------- fast clock ----------

    step() {
      const p = this.p, rng = this.rng;
      this.t++;
      const neurons = this.neurons;

      // Spikes from the previous step arrive now.
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        if (!n.spiked) continue;
        const sign = n.type === INH ? -p.inhGain : 1;
        for (const s of n.out) s.post.input += sign * s.w;
      }

      const stim = this.stim && this.stim.until > this.t ? this.stim : null;
      const G = this.G;
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        let fired = 0;
        if (n.refr > 0) { n.refr--; n.v = 0; }
        else if (!n.migrating) {
          let drive = n.input + p.noise * rng();
          if (stim && (n.x - stim.x) ** 2 + (n.y - stim.y) ** 2 < stim.r * stim.r) drive += 0.35 * rng();
          n.v = n.v * this.decay + drive;
          const thr = n.newborn ? p.threshold * 0.9 : p.threshold;
          if (n.v >= thr) { fired = 1; n.v = 0; n.refr = p.refractory; }
        }
        n.input = 0;
        n.spiked = fired;
        n.rate += (fired - n.rate) / p.tauRate;
        if (fired) {
          n.spikes++;
          n.lastSpike = this.t;
          this.act[Math.min(G - 1, Math.floor(n.y * G)) * G + Math.min(G - 1, Math.floor(n.x * G))] += 1;
          // Coincidence: inputs that fired just before this spike.
          for (const s of n.in) {
            if (this.t - s.pre.lastSpike <= 6 && s.pre.lastSpike < this.t) {
              s.co++;
              n.bdnfOut++;
              if (s.w < p.maxWeight) s.w += p.hebb * (p.maxWeight - s.w) * (n.newborn ? 2 : 1);
            }
          }
        }
      }

      if (this.t % p.fieldEvery === 0) this.fieldStep();
      if (this.t % p.structuralEvery === 0) this.structuralStep();
    }

    // ---------- field clock: chemistry, energy, glia ----------

    cell(x, y) {
      const G = this.G;
      return Math.min(G - 1, Math.max(0, Math.floor(y * G))) * G + Math.min(G - 1, Math.max(0, Math.floor(x * G)));
    }

    diffuse(f, rate, iters) {
      const G = this.G, s = this.scratch;
      for (let it = 0; it < iters; it++) {
        for (let y = 0; y < G; y++) {
          const yu = y > 0 ? y - 1 : y, yd = y < G - 1 ? y + 1 : y;
          for (let x = 0; x < G; x++) {
            const xl = x > 0 ? x - 1 : x, xr = x < G - 1 ? x + 1 : x;
            const c = y * G + x;
            s[c] = f[c] + rate * (f[yu * G + x] + f[yd * G + x] + f[y * G + xl] + f[y * G + xr] - 4 * f[c]);
          }
        }
        f.set(s);
      }
    }

    updateGlucose() {
      const p = this.p, g = this.glucose, act = this.act, mask = this.vesselMask;
      for (let c = 0; c < g.length; c++) {
        if (mask[c]) g[c] += p.vesselSupply * (1 + p.coupling * Math.min(1, act[c] * 0.5));
        g[c] *= 1 - p.glucoseDecay;
      }
      this.diffuse(g, 0.2, 2);
    }

    fieldStep() {
      const p = this.p, rng = this.rng;
      const neurons = this.neurons;

      // Blur and fade the activity field (glutamate spillover).
      this.diffuse(this.act, 0.2, 1);
      for (let c = 0; c < this.act.length; c++) this.act[c] *= 0.8;

      this.updateGlucose();

      // Astrocytes: draw glucose where their end-feet touch a vessel (or around
      // themselves if none), hand it as lactate to the active neurons in their
      // territory, and secrete a little trophic support.
      if (this.astros.length) {
        const r2 = p.astroRadius * p.astroRadius;
        for (const a of this.astros) {
          const c = this.cell(a.x, a.y);
          // Draw only what the store has room for.
          let room = 1 - a.store;
          const src = a.feet.length ? a.feet : [c];
          for (const f of src) {
            if (room <= 0) break;
            const g = Math.min(room, this.glucose[f] * 0.2);
            this.glucose[f] -= g; room -= g; a.store += g;
          }
          let demand = 0;
          const near = [];
          for (const n of neurons) {
            if (n.migrating) continue;
            const d2 = (n.x - a.x) ** 2 + (n.y - a.y) ** 2;
            if (d2 < r2) { near.push(n); demand += n.rate; }
          }
          const give = Math.min(a.store, p.astroLactate);
          a.given = give;
          if (demand > 0 && give > 0) {
            a.store -= give;
            for (const n of near) this.lactate[this.cell(n.x, n.y)] += give * n.rate / demand;
          }
          this.bdnf[c] += p.astroTrophic;
        }
      }

      // Neurons: release BDNF from coincident inputs, take up growth factor in
      // proportion to their activity, and pay for living and spiking.
      const rel = p.bdnfRelease * 0.05;
      for (const n of neurons) {
        const c = this.cell(n.x, n.y);
        if (n.bdnfOut) { this.bdnf[c] += rel * n.bdnfOut; n.bdnfOut = 0; }
        const activity = Math.min(2, n.rate / p.targetRate);
        const takeB = this.bdnf[c] * Math.min(0.9, 0.15 * (0.2 + activity));
        this.bdnf[c] -= takeB;
        n.trophic += (takeB - n.trophic) * 0.05;

        const fuel = this.glucose[c] + this.lactate[c];
        const take = fuel * p.uptake;
        const fromLac = Math.min(this.lactate[c], take);
        this.lactate[c] -= fromLac;
        this.glucose[c] = Math.max(0, this.glucose[c] - (take - fromLac));
        const spikes = n.spikes; n.spikes = 0;
        n.energy = clamp(n.energy + take * 0.6 - p.basalCost - p.spikeCost * spikes, 0, 1);
      }
      for (let c = 0; c < this.lactate.length; c++) this.lactate[c] *= 0.97;
      this.diffuse(this.bdnf, 0.15, 1);
      for (let c = 0; c < this.bdnf.length; c++) this.bdnf[c] *= 1 - p.bdnfDecay;

      // Eat-me signals: tagged synapses at the receiving cell, plus debris.
      const tf = this.tagField;
      for (let c = 0; c < tf.length; c++) tf[c] *= 0.7;
      for (const s of this.synapses) if (s.tag > p.eatTag) tf[this.cell(s.post.x, s.post.y)] += 0.3;
      for (const d of this.debris) tf[this.cell(d.x, d.y)] += 1;
      this.diffuse(tf, 0.2, 2);

      // Newborn neurons migrate toward sparse tissue.
      for (const n of neurons) if (n.migrating) this.migrate(n);

      if (this.microglia.length) this.moveMicroglia();
    }

    migrate(n) {
      // Neuroblasts travel along blood vessels and toward injury signals
      // (Kojima 2010, Grade 2013), and avoid crowded tissue. Sample a few
      // directions up and away from the niche and take the best one.
      const rng = this.rng;
      let best = null, bestScore = Infinity;
      for (let k = 0; k < 5; k++) {
        const ang = -Math.PI / 2 + (rng() - 0.5) * Math.PI * 1.4;
        const x = clamp(n.x + Math.cos(ang) * 0.05, 0.02, 0.98), y = clamp(n.y + Math.sin(ang) * 0.05, 0.02, 0.92);
        let crowd = 0;
        for (const m of this.neurons) {
          if (m === n) continue;
          const d2 = (m.x - x) ** 2 + (m.y - y) ** 2;
          if (d2 < 0.006) crowd += 1;
        }
        const c = this.cell(x, y);
        const score = crowd - 8 * this.glucose[c] - 4 * this.tagField[c];
        if (score < bestScore) { bestScore = score; best = [x, y]; }
      }
      n.x += (best[0] - n.x) * 0.2;
      n.y += (best[1] - n.y) * 0.2;
    }

    moveMicroglia() {
      const p = this.p, rng = this.rng, G = this.G, tf = this.tagField;
      const r2 = p.microgliaRadius * p.microgliaRadius;
      for (const m of this.microglia) {
        // Random walk biased up the eat-me gradient.
        const c = this.cell(m.x, m.y), cx = c % G, cy = (c / G) | 0;
        const gx = tf[cy * G + Math.min(G - 1, cx + 1)] - tf[cy * G + Math.max(0, cx - 1)];
        const gy = tf[Math.min(G - 1, cy + 1) * G + cx] - tf[Math.max(0, cy - 1) * G + cx];
        const gl = Math.hypot(gx, gy);
        m.vx = m.vx * 0.6 + (rng() - 0.5) * 0.8 + (gl > 1e-4 ? gx / gl * 0.9 : 0);
        m.vy = m.vy * 0.6 + (rng() - 0.5) * 0.8 + (gl > 1e-4 ? gy / gl * 0.9 : 0);
        const vl = Math.hypot(m.vx, m.vy) || 1;
        m.x = clamp(m.x + m.vx / vl * p.microgliaSpeed, 0.01, 0.99);
        m.y = clamp(m.y + m.vy / vl * p.microgliaSpeed, 0.01, 0.95);

        // Engulf tagged synapses on nearby cells unless recent use protects them.
        for (const n of this.neurons) {
          if ((n.x - m.x) ** 2 + (n.y - m.y) ** 2 > r2) continue;
          for (const s of n.in) {
            if (s.tag > p.eatTag && s.use < 0.05 && !s.gone) { s.gone = 'microglia'; m.ate++; this.counts.eatenMicroglia++; }
          }
        }
        for (const d of this.debris) {
          if (!d.gone && (d.x - m.x) ** 2 + (d.y - m.y) ** 2 < r2 * 1.5) { d.gone = true; m.cleared++; this.counts.cleared++; }
        }
      }
      if (this.debris.some((d) => d.gone)) this.debris = this.debris.filter((d) => !d.gone);
      this.dropGone();
    }

    // ---------- slow clock: growth, pruning, death, birth ----------

    structuralStep() {
      const p = this.p, rng = this.rng;

      // Synapse bookkeeping: tags, weakening, astrocyte engulfment.
      for (const s of this.synapses) {
        if (s.co > 0) { s.tag = Math.max(0, s.tag - 0.5); s.use = s.use * 0.7 + 0.3 * Math.min(1, s.co / 3); }
        else { s.tag += p.tagRate; s.use *= 0.7; s.w *= 1 - p.weightDecay; }
        s.co = 0;
        s.age++;
        if (this.astros.length && s.tag > p.eatTag && rng() < p.astroEat && this.inAstroTerritory(s.post)) {
          s.gone = 'astrocyte'; this.counts.eatenAstro++;
          const a = this.nearestAstro(s.post); if (a) a.ate++;
        }
      }
      this.dropGone();

      // Deaths: starvation of energy or of trophic support.
      for (const n of this.neurons) {
        n.age++;
        if (n.migrating) { n.migrating--; continue; }
        if (n.newborn && this.t - n.bornAt > p.newbornWindow * p.structuralEvery) n.newborn = false;
        n.lowEnergy = n.energy < 0.1 ? n.lowEnergy + 1 : 0;
        // Newborns are spared trophic death during their window; then they must have integrated.
        // Support that comes and goes only slowly pays off the debt.
        if (n.newborn) n.lowTrophic = 0;
        else n.lowTrophic = n.trophic < p.trophicNeed ? n.lowTrophic + 1 : Math.max(0, n.lowTrophic - 0.5);
        if (n.lowEnergy > p.starveAfter) this.kill(n, 'starved');
        else if (n.age > n.matureAt && n.lowTrophic > p.trophicAfter) this.kill(n, 'trophic');
      }
      this.removeDead();

      // Homeostatic structural plasticity.
      for (const n of this.neurons) {
        if (n.migrating) continue;
        // Newborns keep sprouting during their window, whatever their activity.
        const dz = p.growth * (1 - n.rate / p.targetRate) + (n.newborn ? p.newbornSprout : 0);
        n.axEl = clamp(n.axEl + dz, 0, p.maxElements);
        n.denEl = clamp(n.denEl + dz, 0, p.maxElements);
      }
      // Retracted elements take their weakest synapses with them.
      for (const n of this.neurons) {
        this.trim(n.out, n.axEl);
        this.trim(n.in, n.denEl);
      }
      this.dropGone();
      this.pairFreeElements();

      // Births from the niche.
      if (p.neurogenesis) {
        const births = poisson(rng, p.birthRate * (1 + p.injuryBoost * Math.min(1, this.injury)));
        for (let i = 0; i < births; i++) {
          const a = rng() * Math.PI * 2, r = this.niche.r * Math.sqrt(rng());
          this.addNeuron(this.niche.x + Math.cos(a) * r, this.niche.y + Math.sin(a) * r * 0.5, true);
          this.counts.born++;
        }
      }
      this.injury *= 0.97;

      this.rebuildLists();
      this.recordStats();
    }

    trim(list, el) {
      const live = list.filter((s) => !s.gone);
      const excess = live.length - Math.floor(el);
      if (excess <= 0) return;
      live.sort((a, b) => a.w - b.w);
      for (let k = 0; k < excess; k++) { live[k].gone = 'retracted'; this.counts.retracted++; }
    }

    inAstroTerritory(n) { return !!this.nearestAstro(n); }
    nearestAstro(n) {
      const r2 = this.p.astroRadius * this.p.astroRadius;
      let best = null, bd = r2;
      for (const a of this.astros) {
        const d = (a.x - n.x) ** 2 + (a.y - n.y) ** 2;
        if (d < bd) { bd = d; best = a; }
      }
      return best;
    }

    pairFreeElements() {
      const p = this.p, rng = this.rng;
      const cs = p.cutoff, B = Math.ceil(1 / cs);
      const buckets = Array.from({ length: B * B }, () => []);
      const freeDen = [];
      const freeAx = [];
      // Uncleared debris crowds the space around a cell and gets in the way of new contacts.
      const dr2 = 0.04 * 0.04;
      for (const n of this.neurons) {
        n.blocked = 0;
        for (const d of this.debris) if ((d.x - n.x) ** 2 + (d.y - n.y) ** 2 < dr2) n.blocked++;
      }
      for (const n of this.neurons) {
        if (n.migrating) continue;
        const inC = n.in.filter((s) => !s.gone).length, outC = n.out.filter((s) => !s.gone).length;
        for (let k = inC; k < Math.floor(n.denEl); k++) {
          const idx = freeDen.length;
          freeDen.push(n);
          buckets[Math.min(B - 1, Math.floor(n.y / cs)) * B + Math.min(B - 1, Math.floor(n.x / cs))].push(idx);
        }
        for (let k = outC; k < Math.floor(n.axEl); k++) freeAx.push(n);
      }
      for (let i = freeAx.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = freeAx[i]; freeAx[i] = freeAx[j]; freeAx[j] = t;
      }
      const used = new Uint8Array(freeDen.length);
      const r2 = 2 * p.reach * p.reach, c2 = cs * cs;
      const cand = [], wt = [];
      for (const a of freeAx) {
        const bx = Math.min(B - 1, Math.floor(a.x / cs)), by = Math.min(B - 1, Math.floor(a.y / cs));
        cand.length = 0; wt.length = 0;
        let total = 0;
        for (let oy = -1; oy <= 1; oy++) {
          const yy = by + oy; if (yy < 0 || yy >= B) continue;
          for (let ox = -1; ox <= 1; ox++) {
            const xx = bx + ox; if (xx < 0 || xx >= B) continue;
            for (const d of buckets[yy * B + xx]) {
              if (used[d]) continue;
              const b = freeDen[d];
              if (b === a) continue;
              const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
              if (d2 > c2) continue;
              if (a.out.some((s) => s.post === b && !s.gone)) continue;
              const k = Math.exp(-d2 / r2) / (1 + a.blocked + b.blocked);
              cand.push(d); wt.push(k); total += k;
            }
          }
        }
        if (total <= 0) continue;
        let pick = rng() * total, d = cand[cand.length - 1];
        for (let c = 0; c < cand.length; c++) { pick -= wt[c]; if (pick <= 0) { d = cand[c]; break; } }
        used[d] = 1;
        const b = freeDen[d];
        const s = { id: nextId++, pre: a, post: b, w: p.newWeight, co: 0, use: 0, tag: 0, age: 0, gone: false };
        a.out.push(s); b.in.push(s);
        this.synapses.push(s);
        this.counts.formed++;
      }
    }

    kill(n, cause) {
      if (n.dead) return;
      n.dead = cause;
      for (const s of n.out) s.gone = s.gone || 'death';
      for (const s of n.in) s.gone = s.gone || 'death';
      this.debris.push({ id: n.id, x: n.x, y: n.y, at: this.t, cause, gone: false });
      this.graves.push({ id: n.id, t: this.t, cause });
      if (this.graves.length > 500) this.graves.shift();
      if (cause === 'lesion') this.counts.lesioned++;
      else this.counts[cause]++;
      if (n.newborn) this.counts.newbornDied++;
    }

    removeDead() {
      if (!this.neurons.some((n) => n.dead)) return;
      this.neurons = this.neurons.filter((n) => !n.dead);
      this.dropGone();
    }

    dropGone() {
      if (!this.synapses.some((s) => s.gone)) return;
      this.synapses = this.synapses.filter((s) => !s.gone);
      for (const n of this.neurons) {
        if (n.out.some((s) => s.gone)) n.out = n.out.filter((s) => !s.gone);
        if (n.in.some((s) => s.gone)) n.in = n.in.filter((s) => !s.gone);
      }
    }

    rebuildLists() {
      for (const n of this.neurons) { n.out = []; n.in = []; }
      for (const s of this.synapses) { s.pre.out.push(s); s.post.in.push(s); }
    }

    // ---------- interventions ----------

    // Kill every neuron within r of (x, y). Microglia will come to clear the debris.
    lesion(x, y, r) {
      let k = 0;
      for (const n of this.neurons) {
        if ((n.x - x) ** 2 + (n.y - y) ** 2 < r * r) { this.kill(n, 'lesion'); k++; }
      }
      this.removeDead();
      this.injury = Math.min(1.5, this.injury + k / 30);
      this.events.push({ t: this.t, kind: 'lesion', x, y, r, killed: k });
      return k;
    }

    // Extra drive to neurons within r for a while, as if the region were stimulated.
    stimulate(x, y, r, steps) {
      this.stim = { x, y, r, until: this.t + steps };
      this.injury = Math.min(1.5, this.injury + 0.15);
      this.events.push({ t: this.t, kind: 'stimulate', x, y, r });
    }

    // ---------- reading ----------

    recordStats() {
      const p = this.p;
      let rate = 0, energy = 0, trophic = 0, inh = 0, newborn = 0, settled = 0, w = 0, tagged = 0;
      for (const n of this.neurons) {
        if (n.migrating) { newborn++; continue; }
        settled++;
        rate += n.rate; energy += n.energy; trophic += n.trophic;
        if (n.type === INH) inh++;
        if (n.newborn) newborn++;
      }
      for (const s of this.synapses) { w += s.w; if (s.tag > p.eatTag) tagged++; }
      const k = settled || 1;
      const c = this.counts;
      this.history.push({
        t: this.t,
        neurons: this.neurons.length,
        inhibitory: inh,
        newborn,
        synapses: this.synapses.length,
        perNeuron: this.synapses.length / k,
        rate: rate / k / p.targetRate,
        energy: energy / k,
        trophic: trophic / k / p.trophicNeed,
        weight: this.synapses.length ? w / this.synapses.length : 0,
        tagged,
        debris: this.debris.length,
        born: c.born,
        died: c.starved + c.trophic + c.lesioned,
        starved: c.starved,
        trophicDeaths: c.trophic,
        eaten: c.eatenMicroglia + c.eatenAstro,
        formed: c.formed,
      });
      if (this.history.length > p.historyLimit) this.history.splice(0, this.history.length - p.historyLimit);
    }

    neuronById(id) { return this.neurons.find((n) => n.id === id) || null; }
  }

  const api = { Tissue, DEFAULTS, EXC, INH };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TissueSim = api;
})(typeof self !== 'undefined' ? self : this);
