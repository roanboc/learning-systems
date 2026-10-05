// A creature brain made of living tissue: a small Tissue Lab slice
// (nervous-systems/tissue-lab/engine.js) with senses wired in on the left
// edge and muscles on the right edge.
//
// Inside, everything is the Tissue Lab's: neurons wire themselves to keep
// their firing near a set point, compete for growth factor and energy from
// blood vessels, astrocytes feed active cells, microglia eat unused synapses,
// and a stem-cell niche adds newborn neurons that must integrate or die.
// Reward learning uses the tissue's optional eligibility traces.
//
// This file only adapts it to a body: it drives the sensory cells, reads the
// motor cells, keeps sensory and motor cells alive (they belong to the body,
// not the brain's population), and offers the same interface as lib/brain.js
// so the world and the explorer can use either kind of brain.
(function (root) {
  'use strict';

  const TissueSim = typeof module !== 'undefined' && module.exports
    ? require('../../nervous-systems/tissue-lab/engine.js')
    : root.TissueSim;

  const SENSOR = 0, EXC = 1, INH = 2, MOTOR = 3, EMPTY = 9;

  // A slice small enough to run inside every creature.
  const TISSUE_DEFAULTS = {
    grid: 12,
    vessels: 2,
    astroCount: 4,
    astroRadius: 0.3,
    microgliaPer: 8,
    microgliaRadius: 0.12,
    microgliaSpeed: 0.02,
    reach: 0.2,
    cutoff: 0.45,
    targetRate: 0.05,
    newWeight: 0.15,
    maxWeight: 1.6,
    hebb: 0.01,
    tauEligibility: 150,
  };

  const BODY = {
    sensorMaxRate: 0.3,      // spike chance per step at full stimulus
    sensorAxons: 6,
    motorNoise: [0.35, 0.35, 0.05],
    learnedInputs: 6,        // dendrite room per muscle beyond its reflexes
    capacity: 64,            // interneuron slots shown in the explorer
    tauDopamine: 15,
  };

  class TissueBrain {
    // tissueParams: Tissue Lab settings (startNeurons, birthRate, rewardRate, ...).
    constructor(rng, sensorRows, motorRows, tissueParams, innate, motorNoise) {
      motorNoise = motorNoise || BODY.motorNoise;
      const tp = Object.assign({}, TISSUE_DEFAULTS, tissueParams, { seed: Math.floor(rng() * 1e9) + 1 });
      this.kind = 'tissue';
      this.rng = rng;
      this.tissue = new TissueSim.Tissue(tp);
      const T = this.tissue;
      this.nS = sensorRows.length;
      this.nM = motorRows.length;
      this.cap = BODY.capacity;
      this.n = this.nS + this.cap + this.nM;
      this.firstMotor = this.nS + this.cap;
      this.sensors = [];
      this.motors = [];
      // Body cells: placed on the edges, never migrate or die.
      for (let i = 0; i < this.nS; i++) {
        const c = T.addNeuron(0.02, 0.03 + 0.84 * sensorRows[i], false);
        // Senses fire from the stimulus only, not from the tissue's background noise.
        Object.assign(c, { fixed: true, type: EXC, axEl: BODY.sensorAxons, denEl: 0, slot: i, noise: 0 });
        this.sensors.push(c);
      }
      for (let k = 0; k < this.nM; k++) {
        const c = T.addNeuron(0.98, 0.03 + 0.84 * motorRows[k], false);
        // Muscles keep their own exploration noise (low for the bite).
        Object.assign(c, { fixed: true, type: EXC, axEl: 0, denEl: BODY.learnedInputs, slot: this.firstMotor + k, noise: motorNoise[k] });
        this.motors.push(c);
      }
      // Inborn reflexes: sensor -> motor synapses present at birth. Each muscle
      // keeps room for its reflexes plus a few learned inputs.
      let id = -1;
      for (const [a, k, weight] of innate || []) {
        const pre = this.sensors[a], post = this.motors[k];
        const s = { id: id--, pre, post, w: weight, co: 0, use: 0, tag: 0, age: 0, gone: false };
        T.synapses.push(s);
        post.denEl += 1;
      }
      this.motorDen = this.motors.map((c) => c.denEl);
      T.rebuildLists();

      this.slotOf = new Array(this.n).fill(null);
      for (const c of this.sensors) this.slotOf[c.slot] = c;
      for (const c of this.motors) this.slotOf[c.slot] = c;
      this.type = new Uint8Array(this.n).fill(EMPTY);
      this.x = new Float32Array(this.n);
      this.y = new Float32Array(this.n);
      this.v = new Float32Array(this.n);
      this.spiked = new Uint8Array(this.n);
      this.rate = new Float32Array(this.n);
      this.target = new Float32Array(this.n).fill(T.p.targetRate);
      this.axEl = new Float32Array(this.n);
      this.denEl = new Float32Array(this.n);
      this.alive = new Uint8Array(this.n);
      this.newborn = new Uint8Array(this.n);   // 1 = born in this creature's life, still maturing
      this.dopamine = 0;
      this.daDecay = Math.exp(-1 / BODY.tauDopamine);
      this.synT = -1;
      const self = this;
      this.p = {
        get hidden() { return self.hiddenCount(); },
        maxWeight: T.p.maxWeight,
        learningRate: T.p.rewardRate,
      };
      this.assignSlots();
      this.sync();
    }

    hiddenCount() { return this.tissue.neurons.length - this.nS - this.nM; }

    // Interneurons come and go; keep each in a stable slot while it lives.
    assignSlots() {
      for (let i = this.nS; i < this.firstMotor; i++) {
        const c = this.slotOf[i];
        if (c && c.dead) this.slotOf[i] = null;
      }
      let free = this.nS;
      for (const c of this.tissue.neurons) {
        if (c.fixed || c.slot !== undefined) continue;
        while (free < this.firstMotor && this.slotOf[free]) free++;
        if (free >= this.firstMotor) break;
        c.slot = free;
        this.slotOf[free] = c;
      }
    }

    sync() {
      this.alive.fill(0);
      this.newborn.fill(0);
      for (let i = 0; i < this.n; i++) {
        const c = this.slotOf[i];
        if (!c || c.dead) { this.type[i] = EMPTY; this.spiked[i] = 0; continue; }
        this.alive[i] = 1;
        if (c.newborn || c.migrating) this.newborn[i] = 1;
        this.type[i] = c.fixed ? (i < this.nS ? SENSOR : MOTOR) : c.type;
        this.x[i] = c.x; this.y[i] = c.y;
        this.v[i] = c.v; this.spiked[i] = c.spiked; this.rate[i] = c.rate;
        this.axEl[i] = c.axEl; this.denEl[i] = c.denEl;
      }
    }

    step(drive) {
      const T = this.tissue, rng = this.rng;
      for (let i = 0; i < this.nS; i++) {
        if (rng() < BODY.sensorMaxRate * drive[i]) this.sensors[i].input += 2 * this.tissue.p.threshold;
      }
      T.step();
      if (T.t % T.p.structuralEvery === 0) this.afterStructural();
      this.dopamine *= this.daDecay;
      this.sync();
    }

    // Body cells only send (senses) or only receive (muscles).
    afterStructural() {
      const T = this.tissue;
      let changed = false;
      for (const s of T.synapses) {
        if ((s.post.fixed && s.post.slot < this.nS) || (s.pre.fixed && s.pre.slot >= this.firstMotor)) {
          s.gone = 'body'; changed = true;
        }
      }
      if (changed) T.dropGone();
      for (const c of this.sensors) { c.axEl = BODY.sensorAxons; c.denEl = 0; c.energy = 1; c.trophic = T.p.trophicNeed * 2; }
      this.motors.forEach((c, k) => { c.axEl = 0; c.denEl = this.motorDen[k]; c.energy = 1; c.trophic = T.p.trophicNeed * 2; });
      this.assignSlots();
    }

    reward(amount) {
      this.tissue.reward(amount);
      this.dopamine += amount;
    }

    motorSpiked(k) { return this.motors[k].spiked; }
    motorRate(k) { return this.motors[k].rate; }
    synapseCount() { return this.tissue.synapses.length; }

    // Synapses as parallel arrays by slot, rebuilt only when read.
    buildSynapses() {
      const T = this.tissue;
      if (this.synT === T.t && this._pre) return;
      this.synT = T.t;
      const pre = [], post = [], w = [], elig = [];
      const inList = Array.from({ length: this.n }, () => []);
      const outList = Array.from({ length: this.n }, () => []);
      for (const s of T.synapses) {
        if (s.gone || s.pre.slot === undefined || s.post.slot === undefined) continue;
        const k = pre.length;
        pre.push(s.pre.slot); post.push(s.post.slot); w.push(s.w);
        elig.push(s.elig ? s.elig * Math.exp(-(T.t - s.eligT) / T.p.tauEligibility) : 0);
        outList[s.pre.slot].push(k); inList[s.post.slot].push(k);
      }
      Object.assign(this, { _pre: pre, _post: post, _w: w, _elig: elig, _in: inList, _out: outList });
    }
    get pre() { this.buildSynapses(); return this._pre; }
    get post() { this.buildSynapses(); return this._post; }
    get w() { this.buildSynapses(); return this._w; }
    get elig() { this.buildSynapses(); return this._elig; }
    get inList() { this.buildSynapses(); return this._in; }
    get outList() { this.buildSynapses(); return this._out; }

    // For the explorer: how the tissue population is doing.
    census() {
      const T = this.tissue;
      let newborn = 0;
      for (const c of T.neurons) if (c.newborn || c.migrating) newborn++;
      return {
        neurons: this.hiddenCount(), newborn, born: T.counts.born,
        died: T.counts.starved + T.counts.trophic, eaten: T.counts.eatenMicroglia + T.counts.eatenAstro,
        astrocytes: T.astros.length, microglia: T.microglia.length,
      };
    }
  }

  const api = { TissueBrain, TISSUE_DEFAULTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TissueBrainSim = api;
})(typeof self !== 'undefined' ? self : this);
