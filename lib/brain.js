// A small spiking brain that wires itself and learns from reward.
//
// Neurons are leaky integrate-and-fire units placed on a 2D sheet of tissue:
// sensory neurons on the left edge, motor neurons on the right edge, a pool of
// excitatory and inhibitory interneurons in between.
//
// Wiring follows homeostatic structural plasticity (Butz & van Ooyen 2013):
// each neuron tracks its own firing rate (a calcium-like trace). Below its
// target it grows free synaptic elements, above it retracts them. Free axonal
// and dendritic elements pair up at random, more likely when close. Nothing
// copies or places connections from outside.
//
// Learning is reward-modulated STDP (three-factor rule; Izhikevich 2007,
// Fremaux & Gerstner 2016): spike timing leaves an eligibility trace on each
// synapse, and a dopamine-like signal turns that trace into a weight change.
// Synapses that end up near zero weight are pruned.
//
// No DOM here; runs in the browser and in Node.
(function (root) {
  'use strict';

  const SENSOR = 0, EXC = 1, INH = 2, MOTOR = 3;

  const BRAIN_DEFAULTS = {
    hidden: 24,             // interneurons
    inhibitoryShare: 0.2,
    tauMembrane: 8,         // steps
    threshold: 1,
    refractory: 2,
    sensorMaxRate: 0.3,     // spike probability per step at full stimulus
    motorNoise: 0.35,       // mean random drive to motor neurons (exploration)
    motorNoiseOverride: null, // optional per-motor noise, e.g. [0.35, 0.35, 0.2]
    hiddenNoise: 0.08,
    targetRate: 0.05,       // homeostatic set point for interneurons, spikes per step
    motorTargetRate: 0.12,  // homeostatic set point for motor neurons
    motorTargetOverride: null, // optional per-motor set points
    tauRate: 300,           // window of the firing-rate (calcium) trace
    growth: 1.2,            // element growth per structural step at zero activity
    maxElements: 14,
    sensorAxons: 6,         // sensors keep this many axonal elements
    structuralEvery: 100,   // steps between rewiring rounds
    reach: 0.45,            // width of the distance kernel, in tissue units
    newWeight: 0.15,
    maxWeight: 1.6,
    pruneWeight: 0.03,
    tauPlus: 15, tauMinus: 15,
    aPlus: 0.6, aMinus: 0.65,
    tauEligibility: 150,
    tauDopamine: 15,
    learningRate: 0.02,
  };

  class Brain {
    // sensorRows: tissue y (0..1) for each sensory neuron, so related inputs sit
    // near each other. motorRows: y for each motor neuron. innate: optional list
    // of [sensor, motor, weight] synapses present at birth (inborn reflexes);
    // they are then subject to the same learning and pruning as any other.
    constructor(rng, sensorRows, motorRows, params, innate) {
      this.p = Object.assign({}, BRAIN_DEFAULTS, params || {});
      this.rng = rng;
      const p = this.p;
      const nS = sensorRows.length, nM = motorRows.length, nH = p.hidden;
      const n = nS + nH + nM;
      this.n = n;
      this.nS = nS; this.nM = nM;
      this.firstMotor = nS + nH;
      this.type = new Uint8Array(n);
      this.x = new Float32Array(n);
      this.y = new Float32Array(n);
      this.v = new Float32Array(n);
      this.input = new Float32Array(n);
      this.refr = new Uint8Array(n);
      this.spiked = new Uint8Array(n);
      this.rate = new Float32Array(n);      // calcium-like running firing rate
      this.preTrace = new Float32Array(n);
      this.postTrace = new Float32Array(n);
      this.axEl = new Float32Array(n);      // synaptic elements (real-valued)
      this.denEl = new Float32Array(n);
      this.outCount = new Uint16Array(n);
      this.inCount = new Uint16Array(n);
      this.decay = Math.exp(-1 / p.tauMembrane);
      this.preDecay = Math.exp(-1 / p.tauPlus);
      this.postDecay = Math.exp(-1 / p.tauMinus);
      this.eligDecay = Math.exp(-1 / p.tauEligibility);
      this.daDecay = Math.exp(-1 / p.tauDopamine);
      this.dopamine = 0;
      this.t = 0;
      this.formed = 0;
      this.pruned = 0;

      for (let i = 0; i < nS; i++) {
        this.type[i] = SENSOR; this.x[i] = 0; this.y[i] = sensorRows[i];
        this.axEl[i] = p.sensorAxons;
      }
      for (let i = nS; i < nS + nH; i++) {
        this.type[i] = rng() < p.inhibitoryShare ? INH : EXC;
        this.x[i] = 0.2 + 0.6 * rng(); this.y[i] = rng();
        this.axEl[i] = 2; this.denEl[i] = 2;
      }
      for (let k = 0; k < nM; k++) {
        const i = this.firstMotor + k;
        this.type[i] = MOTOR; this.x[i] = 1; this.y[i] = motorRows[k];
        this.denEl[i] = 3;
      }
      this.target = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        this.target[i] = this.type[i] !== MOTOR ? p.targetRate
          : p.motorTargetOverride ? p.motorTargetOverride[i - this.firstMotor] : p.motorTargetRate;
        this.rate[i] = this.target[i];
      }

      // Synapses as parallel arrays; out/in lists rebuilt after each rewiring.
      this.pre = []; this.post = []; this.w = []; this.elig = [];
      for (const [a, k, weight] of innate || []) {
        const b = this.firstMotor + k;
        this.pre.push(a); this.post.push(b); this.w.push(weight); this.elig.push(0);
        this.denEl[b] += 1;
      }
      for (let i = 0; i < nS; i++) {
        const own = (innate || []).filter((s) => s[0] === i).length;
        this.axEl[i] = Math.max(p.sensorAxons, own + 2);
      }
      this.outList = []; this.inList = [];
      this.rewire();
    }

    // One step. sensorDrive: array of stimulus strengths (0..1) per sensor.
    // Returns nothing; read motor activity with motorRate(k).
    step(sensorDrive) {
      const p = this.p, n = this.n, rng = this.rng;
      this.t++;
      const input = this.input;
      const firstMotor = this.firstMotor;

      // Spikes from the previous step arrive now.
      for (let i = 0; i < n; i++) {
        if (!this.spiked[i]) continue;
        const sign = this.type[i] === INH ? -1 : 1;
        for (const s of this.outList[i]) input[this.post[s]] += sign * this.w[s];
      }

      for (let i = 0; i < n; i++) {
        let fired = 0;
        const ty = this.type[i];
        if (ty === SENSOR) {
          fired = rng() < p.sensorMaxRate * sensorDrive[i] ? 1 : 0;
        } else if (this.refr[i] > 0) {
          this.refr[i]--;
          this.v[i] = 0;
        } else {
          const noise = ty === MOTOR
            ? (p.motorNoiseOverride ? p.motorNoiseOverride[i - firstMotor] : p.motorNoise)
            : p.hiddenNoise;
          this.v[i] = this.v[i] * this.decay + input[i] + noise * rng();
          if (this.v[i] >= p.threshold) {
            fired = 1; this.v[i] = 0; this.refr[i] = p.refractory;
          }
        }
        input[i] = 0;
        this.spiked[i] = fired;
        this.rate[i] += (fired - this.rate[i]) / p.tauRate;
      }

      // Spike-timing eligibility: pre before post strengthens, post before pre weakens.
      const elig = this.elig, pre = this.pre, post = this.post;
      for (let s = 0; s < elig.length; s++) elig[s] *= this.eligDecay;
      for (let i = 0; i < n; i++) {
        this.preTrace[i] *= this.preDecay;
        this.postTrace[i] *= this.postDecay;
      }
      for (let i = 0; i < n; i++) {
        if (!this.spiked[i]) continue;
        for (const s of this.outList[i]) elig[s] -= p.aMinus * this.postTrace[post[s]];
        for (const s of this.inList[i]) elig[s] += p.aPlus * this.preTrace[pre[s]];
      }
      for (let i = 0; i < n; i++) {
        if (this.spiked[i]) { this.preTrace[i] += 1; this.postTrace[i] += 1; }
      }

      // Dopamine turns eligibility into lasting change. Inhibitory synapses use
      // the mirrored rule, so punishment strengthens a brake that was active
      // just before a bad outcome and reward weakens it.
      this.dopamine *= this.daDecay;
      if (Math.abs(this.dopamine) > 1e-3) {
        const k = p.learningRate * this.dopamine, wMax = p.maxWeight, w = this.w, type = this.type;
        for (let s = 0; s < w.length; s++) {
          const ks = type[pre[s]] === INH ? -k : k;
          let nw = w[s] + ks * elig[s];
          w[s] = nw < 0 ? 0 : nw > wMax ? wMax : nw;
        }
      }

      if (this.t % p.structuralEvery === 0) this.rewire();
      return firstMotor;
    }

    reward(amount) { this.dopamine += amount; }

    // Smoothed firing rate of motor k (0..1).
    motorRate(k) { return this.rate[this.firstMotor + k]; }
    motorSpiked(k) { return this.spiked[this.firstMotor + k]; }

    // Homeostatic structural plasticity: grow or retract elements toward the
    // target rate, remove excess and near-silent synapses, then pair free elements.
    rewire() {
      const p = this.p, n = this.n, rng = this.rng;

      for (let i = 0; i < n; i++) {
        const ty = this.type[i];
        if (ty === SENSOR) continue;
        const dz = p.growth * (1 - this.rate[i] / this.target[i]);
        this.denEl[i] = clamp(this.denEl[i] + dz, 0, p.maxElements);
        if (ty !== MOTOR) this.axEl[i] = clamp(this.axEl[i] + dz, 0, p.maxElements);
      }

      // Decide which synapses to keep.
      const S = this.w.length;
      const keep = new Uint8Array(S).fill(1);
      for (let s = 0; s < S; s++) {
        if (this.w[s] < p.pruneWeight) { keep[s] = 0; this.pruned++; }
      }
      // Too many bound elements: drop the weakest synapses first.
      const outBy = Array.from({ length: n }, () => []);
      const inBy = Array.from({ length: n }, () => []);
      for (let s = 0; s < S; s++) {
        if (!keep[s]) continue;
        outBy[this.pre[s]].push(s); inBy[this.post[s]].push(s);
      }
      const trim = (lists, el) => {
        for (let i = 0; i < n; i++) {
          const list = lists[i].filter((s) => keep[s]);
          const excess = list.length - Math.floor(el[i]);
          if (excess <= 0) continue;
          list.sort((a, b) => this.w[a] - this.w[b]);
          for (let k = 0; k < excess; k++) { keep[list[k]] = 0; this.pruned++; }
        }
      };
      trim(outBy, this.axEl);
      trim(inBy, this.denEl);

      const pre = [], post = [], w = [], elig = [];
      const exists = new Set();
      for (let s = 0; s < S; s++) {
        if (!keep[s]) continue;
        pre.push(this.pre[s]); post.push(this.post[s]); w.push(this.w[s]); elig.push(this.elig[s]);
        exists.add(this.pre[s] * 4096 + this.post[s]);
      }

      // Count bound elements, then list free ones.
      const outC = new Uint16Array(n), inC = new Uint16Array(n);
      for (let s = 0; s < pre.length; s++) { outC[pre[s]]++; inC[post[s]]++; }
      const freeAx = [], freeDen = [];
      for (let i = 0; i < n; i++) {
        for (let k = outC[i]; k < Math.floor(this.axEl[i]); k++) freeAx.push(i);
        for (let k = inC[i]; k < Math.floor(this.denEl[i]); k++) freeDen.push(i);
      }
      shuffle(freeAx, rng);

      // Pair each free axonal element with a free dendritic element, weighted by closeness.
      const used = new Uint8Array(freeDen.length);
      const r2 = 2 * p.reach * p.reach;
      for (const a of freeAx) {
        let total = 0;
        const cand = [], wt = [];
        for (let d = 0; d < freeDen.length; d++) {
          if (used[d]) continue;
          const b = freeDen[d];
          if (b === a || this.type[b] === SENSOR) continue;
          if (exists.has(a * 4096 + b)) continue;
          const dx = this.x[a] - this.x[b], dy = this.y[a] - this.y[b];
          const k = Math.exp(-(dx * dx + dy * dy) / r2);
          cand.push(d); wt.push(k); total += k;
        }
        if (total <= 0) continue;
        let pick = rng() * total, d = cand[cand.length - 1];
        for (let c = 0; c < cand.length; c++) { pick -= wt[c]; if (pick <= 0) { d = cand[c]; break; } }
        used[d] = 1;
        const b = freeDen[d];
        exists.add(a * 4096 + b);
        pre.push(a); post.push(b); w.push(p.newWeight); elig.push(0);
        this.formed++;
      }

      this.pre = pre; this.post = post; this.w = w; this.elig = elig;
      this.outList = Array.from({ length: n }, () => []);
      this.inList = Array.from({ length: n }, () => []);
      for (let s = 0; s < pre.length; s++) { this.outList[pre[s]].push(s); this.inList[post[s]].push(s); }
      for (let i = 0; i < n; i++) { this.outCount[i] = this.outList[i].length; this.inCount[i] = this.inList[i].length; }
    }

    synapseCount() { return this.w.length; }
  }

  function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
  function shuffle(a, rng) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
  }

  const api = { Brain, BRAIN_DEFAULTS, SENSOR, EXC, INH, MOTOR };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BrainSim = api;
})(typeof self !== 'undefined' ? self : this);
