// Trainer engine: one creature with a Tissue Lab brain in a small arena, and
// a human (or an automatic teacher) who trains it with Good and Bad.
//
// Nothing in the brain is labelled "good". Good gives the creature a treat
// (energy in its gut), Bad a sting (damage). Dopamine cells fire when the gut
// does better or worse than they expected, the way midbrain dopamine neurons
// report reward prediction error (Schultz, Dayan & Montague 1997). The
// expectation is learned from what the creature hears: every Good comes with a
// click a moment before the treat, so with training the dopamine burst moves
// from the treat to the click, as in clicker training.
//
// Dopamine then gates learning in the tissue: synapses whose input fired just
// before their cell did keep an eligibility trace, and dopamine turns it into
// a lasting change (three-factor rule, the tissue's reward()).
//
// No DOM here, so it runs in the browser and in Node.
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const TissueBrainSim = isNode ? require('../../environments/forager-worlds/tissue-brain.js') : root.TissueBrainSim;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const TAU = Math.PI * 2;
  const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
  const wrap = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };

  // Senses, in order: smell stronger on the left, smell stronger on the right,
  // hearing the click. Muscles: turn left, turn right.
  const SENSES = ['smell left', 'smell right', 'hears click'];
  const MUSCLES = ['turn left', 'turn right'];
  const SMELL_L = 0, SMELL_R = 1, EAR = 2;

  const DEFAULTS = {
    seed: 1,
    speed: 0.0012,          // arena widths per step
    turnPerSpike: 0.2,     // radians per muscle spike
    noseOffset: 0.6,        // radians either side of the heading
    noseReach: 0.03,
    smellWidth: 0.35,       // how far the cue's smell spreads
    smellGain: 18,          // contrast sensors: left minus right, amplified
    cueRadius: 0.05,
    treatDelay: 40,         // steps from the click to the treat
    treatSize: 0.15,        // gut energy per treat
    stingSize: 0.15,
    hunger: 0.00004,        // gut energy used per step
    // Dopamine cells.
    gamma: 0.995,           // per-step discount of future reward
    valueRate: 0.15,        // how fast dopamine cells learn what predicts a treat
    bins: 12,               // memory of the click, in bins of binSteps
    binSteps: 5,
    dopamineGain: 1,        // dopamine to the tissue's reward signal
    innateWeight: 0.4,
    motorNoise: 0.2,        // spontaneous drive to the muscles (exploration)
    lambda: 0.9,
    inputBudget: 1.6,       // total input weight a muscle cell keeps (synaptic scaling)            // dopamine cells: how far back each surprise reaches      // smell to both muscles at birth, no preferred side
    // Brain (Tissue Lab slice; see tissue-brain.js).
    brain: {},
    // Automatic teacher.
    teacher: 'off',         // 'off', 'toward' (reward turning toward the cue) or 'away'
    teacherGap: 120,        // fewest steps between Goods
    teacherBad: true,       // also press Bad for turning the wrong way
    historyEvery: 100,
    historyLimit: 3000,
  };

  const BRAIN_DEFAULTS = {
    startNeurons: 40,
    reach: 0.3,             // a small slice: let contacts span it in two steps
    cutoff: 0.65,
    tauEligibility: 40,     // steps a synapse remembers it helped its cell fire
    rewardRate: 0.15,
    hebb: 0,                // no unsupervised strengthening: only dopamine teaches
    weightDecay: 0,         // learned weights stay until dopamine changes them
    tagRate: 0.03,          // unused synapses get tagged for glia more slowly
    birthRate: 0.1,
  };

  class Trainee {
    constructor(params) {
      this.p = Object.assign({}, DEFAULTS, params || {});
      const p = this.p;
      this.rng = mulberry32(p.seed * 7919 + 13);
      const rng = this.rng;
      this.t = 0;
      this.x = 0.5; this.y = 0.5; this.heading = rng() * TAU;
      this.energy = 0.6;
      this.cue = null;
      this.placeCue();
      const bp = Object.assign({}, BRAIN_DEFAULTS, p.brain);
      // Inborn reflex without a direction: smell on either side makes both
      // muscles twitch equally. Which way to turn is left for training.
      const innate = [];
      for (const sense of [SMELL_L, SMELL_R]) for (const m of [0, 1]) innate.push([sense, m, p.innateWeight]);
      this.brain = new TissueBrainSim.TissueBrain(rng, [0.25, 0.75, 0.5], [0.25, 0.75], bp, innate, [p.motorNoise, p.motorNoise]);
      this.drive = new Float32Array(SENSES.length);

      // Dopamine cells: value of what is heard, learned from treats.
      this.vw = new Float32Array(p.bins);   // value weight per "click heard k bins ago"
      this.ve = new Float32Array(p.bins);   // their eligibility
      this.sinceClick = Infinity;
      this.pendingTreats = [];               // steps at which a treat lands
      this.value = 0;
      this.dopamine = 0;                     // this step's prediction error
      this.daTrace = [];                     // [t, dopamine, event] for the trace view
      this.events = [];                      // {t, kind: 'good'|'bad'|'treat'|'sting'|'reached', by}
      this.counts = { good: 0, bad: 0, treats: 0, stings: 0, reached: 0 };
      this.lastTeach = -Infinity;
      this.aimSum = 0; this.aimN = 0;
      this.daAtClick = 0; this.daAtTreat = 0; // smoothed bursts, to show the shift
      this.history = [];
      this.recordStats();
    }

    placeCue(x, y) {
      const rng = this.rng;
      if (x === undefined) {
        do { x = 0.1 + 0.8 * rng(); y = 0.1 + 0.8 * rng(); } while (Math.hypot(x - this.x, y - this.y) < 0.3);
      }
      this.cue = { x: clamp(x, 0.03, 0.97), y: clamp(y, 0.03, 0.97) };
    }

    smellAt(x, y) {
      const d2 = (x - this.cue.x) ** 2 + (y - this.cue.y) ** 2;
      return Math.exp(-d2 / (2 * this.p.smellWidth ** 2));
    }

    // Angle from the heading to the cue, -pi..pi (positive = cue to the right on screen).
    cueAngle() {
      return wrap(Math.atan2(this.cue.y - this.y, this.cue.x - this.x) - this.heading);
    }

    // ---------- the human's (or teacher's) buttons ----------

    good(by) {
      // The click is heard now; the treat follows a moment later.
      this.clickNow = true;
      this.pendingTreats.push(this.t + this.p.treatDelay);
      this.counts.good++;
      this.events.push({ t: this.t, kind: 'good', by: by || 'you' });
    }

    bad(by) {
      this.pendingStings = (this.pendingStings || 0) + 1;
      this.counts.bad++;
      this.events.push({ t: this.t, kind: 'bad', by: by || 'you' });
    }

    // ---------- one step ----------

    step() {
      const p = this.p, b = this.brain;
      this.t++;

      // Senses. Two nostrils; contrast cells report which side smells stronger.
      const a = p.noseOffset, r = p.noseReach;
      const sl = this.smellAt(this.x + Math.cos(this.heading - a) * r, this.y + Math.sin(this.heading - a) * r);
      const sr = this.smellAt(this.x + Math.cos(this.heading + a) * r, this.y + Math.sin(this.heading + a) * r);
      // Screen coordinates: y grows downward, so heading - a is to the creature's left.
      const diff = (sl - sr) * p.smellGain;
      this.drive[SMELL_L] = clamp(diff, 0, 1);
      this.drive[SMELL_R] = clamp(-diff, 0, 1);
      // Dopamine cells' memory of the click: the state before this step, then
      // the state now (a new click restarts it).
      const prevBin = this.binOf(this.sinceClick);
      if (this.clickNow) { this.sinceClick = 0; this.clickNow = false; }
      else if (this.sinceClick !== Infinity) this.sinceClick++;
      this.drive[EAR] = this.sinceClick < 8 ? 1 : 0;
      b.step(this.drive);

      // Muscles.
      const turn = (b.motorSpiked(0) ? 1 : 0) - (b.motorSpiked(1) ? 1 : 0);
      this.heading = wrap(this.heading - turn * p.turnPerSpike);
      this.x += Math.cos(this.heading) * p.speed;
      this.y += Math.sin(this.heading) * p.speed;
      // Arena walls: slide along them.
      if (this.x < 0.02 || this.x > 0.98) { this.x = clamp(this.x, 0.02, 0.98); this.heading = wrap(Math.PI - this.heading); }
      if (this.y < 0.02 || this.y > 0.98) { this.y = clamp(this.y, 0.02, 0.98); this.heading = wrap(-this.heading); }

      // Gut.
      let reward = 0;
      this.energy = Math.max(0, this.energy - p.hunger);
      while (this.pendingTreats.length && this.pendingTreats[0] <= this.t) {
        this.pendingTreats.shift();
        reward += 1;
        if (!this.pendingTreats.length) this.sinceClick = Infinity;  // what the click promised has arrived
        this.energy = Math.min(1, this.energy + p.treatSize);
        this.counts.treats++;
        this.events.push({ t: this.t, kind: 'treat' });
      }
      if (this.pendingStings) {
        reward -= this.pendingStings;
        this.energy = Math.max(0, this.energy - p.stingSize * this.pendingStings);
        this.counts.stings += this.pendingStings;
        this.events.push({ t: this.t, kind: 'sting' });
        this.pendingStings = 0;
      }

      // Dopamine cells: prediction error between what the gut got and what
      // the click led them to expect (temporal-difference learning).
      const bin = this.binOf(this.sinceClick);
      const vPrev = prevBin < 0 ? 0 : this.vw[prevBin];
      const vNow = bin < 0 ? 0 : this.vw[bin];
      const delta = reward + p.gamma * vNow - vPrev;
      // TD(lambda): the surprise also updates the recent moments that led here.
      const e = this.ve;
      for (let k = 0; k < e.length; k++) e[k] *= p.gamma * p.lambda;
      if (prevBin >= 0) e[prevBin] += 1;
      for (let k = 0; k < e.length; k++) if (e[k] > 1e-3) this.vw[k] += p.valueRate * delta * e[k] / p.binSteps;
      this.value = vNow;
      this.dopamine = delta;
      if (Math.abs(delta) > 0.01) b.reward(delta * p.dopamineGain);
      // Smoothed burst size at the click and at the treat, to show the shift.
      if (this.sinceClick === 0) this.daAtClick += (delta - this.daAtClick) * 0.25;
      if (reward > 0) this.daAtTreat += (delta - this.daAtTreat) * 0.25;
      this.daTrace.push([this.t, delta]);
      if (this.daTrace.length > 800) this.daTrace.shift();

      // Reaching the cue: a free treat from the world, and the cue moves.
      if (Math.hypot(this.x - this.cue.x, this.y - this.cue.y) < p.cueRadius) {
        this.counts.reached++;
        this.events.push({ t: this.t, kind: 'reached' });
        if (p.teacher === 'toward') this.good('teacher');
        this.placeCue();
      }

      this.teach();
      const aim = Math.cos(this.cueAngle());
      this.aimSum += aim; this.aimN++;
      if (this.events.length > 400) this.events.splice(0, this.events.length - 400);
      if (this.t % p.historyEvery === 0) this.recordStats();
    }

    binOf(since) {
      if (since === Infinity) return -1;
      const k = Math.floor(since / this.p.binSteps);
      return k < this.p.bins ? k : -1;
    }

    // Automatic teacher: presses Good when the creature has just turned toward
    // the cue (or away from it, for 'away'), like a patient trainer.
    teach() {
      const p = this.p;
      if (p.teacher === 'off') return;
      const ang = Math.abs(this.cueAngle());
      if (this.prevAng === undefined) { this.prevAng = ang; this.angT = this.t; return; }
      if (this.t - this.angT < 20) return;
      const improved = this.prevAng - ang;   // > 0: now more toward the cue
      this.prevAng = ang; this.angT = this.t;
      if (this.t - this.lastTeach < p.teacherGap) return;
      const want = p.teacher === 'toward' ? improved : -improved;
      if (want > 0.25) { this.good('teacher'); this.lastTeach = this.t; }
      else if (p.teacherBad && want < -0.25) { this.bad('teacher'); this.lastTeach = this.t; }
    }

    recordStats() {
      const aim = this.aimN ? this.aimSum / this.aimN : 0;
      this.aimSum = 0; this.aimN = 0;
      const b = this.brain;
      // How strongly each smell cell drives each muscle, through any path of
      // up to two synapses (direct, or via one interneuron).
      const w = this.smellWiring();
      this.history.push({
        t: this.t,
        aim,
        reached: this.counts.reached,
        good: this.counts.good,
        energy: this.energy,
        daClick: this.daAtClick,
        daTreat: this.daAtTreat,
        neurons: b.hiddenCount(),
        synapses: b.synapseCount(),
        right: w.right, wrong: w.wrong,
      });
      if (this.history.length > this.p.historyLimit) this.history.shift();
    }

    // Net drive from smell cells to the muscles that turn toward the smell
    // ("right" wiring) and away from it ("wrong" wiring).
    smellWiring() {
      const T = this.brain.tissue, sens = this.brain.sensors, mus = this.brain.motors;
      const sign = (c) => (c.type === 2 ? -1 : 1);
      const reach = (from) => {
        const out = new Map();
        for (const s of from.out) {
          if (s.gone) continue;
          if (s.post.fixed) out.set(s.post, (out.get(s.post) || 0) + s.w);
          else for (const s2 of s.post.out) {
            if (s2.gone || !s2.post.fixed) continue;
            out.set(s2.post, (out.get(s2.post) || 0) + s.w * s2.w * sign(s.post));
          }
        }
        return out;
      };
      const l = reach(sens[SMELL_L]), r = reach(sens[SMELL_R]);
      const g = (m, c) => m.get(c) || 0;
      void T;
      return {
        right: g(l, mus[0]) + g(r, mus[1]),
        wrong: g(l, mus[1]) + g(r, mus[0]),
      };
    }
  }

  const api = { Trainee, DEFAULTS, BRAIN_DEFAULTS, SENSES, MUSCLES };
  if (isNode) module.exports = api;
  else root.TrainerSim = api;
})(typeof self !== 'undefined' ? self : this);
