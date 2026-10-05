// Early Earth chemistry: an artificial chemistry living in lib/earth.js.
//
// Not real atoms. Six made-up kinds of molecule with simple local rules, chosen
// to echo ideas about how life may have started:
//   raw       simple dissolved stuff (think CO2 and minerals). Vents add more.
//   energy    energy-rich molecules. Sunlight in shallow water and heat at the
//             vents make them from raw; they fall apart again over time.
//   blocks    building blocks (think amino acids, nucleotides), made from raw
//             plus energy, faster where it is warm.
//   chains    blocks joined into chains. Joining needs little water, so chains
//             build up in drying tide pools; water breaks them apart again.
//   copiers   rare chains that help make more of themselves from blocks
//             (autocatalysis, Gray-Scott-like kinetics). Too few and they die
//             out; enough together and they spread as self-copying patches.
//   oils      oily molecules made at the hot vents. Where they crowd they curl
//             up into bubbles.
//
// Bubbles (protocells) are individuals. A bubble traps the chains and copiers
// that were around when it formed; blocks and energy pass through its skin.
// It grows by taking in oils, faster the more chains and copiers it holds
// (osmotic competition, Chen, Roberts & Szostak 2004), and splits in two when
// big enough, sharing its contents at random. Nothing tells a bubble to keep
// copiers; bubbles that do simply grow and split faster.
//
// A journal records firsts and turning points as they happen.
//
// No DOM here; runs in the browser and in Node.
(function (root) {
  'use strict';

  const EarthSim = root.EarthSim || (typeof require !== 'undefined' ? require('./earth.js') : null);

  const SPECIES = [
    { key: 'raw', name: 'Raw molecules', diffusion: 0.2, max: 20 },
    { key: 'energy', name: 'Energy carriers', diffusion: 0.2, max: 20 },
    { key: 'blocks', name: 'Building blocks', diffusion: 0.15, max: 20 },
    { key: 'chains', name: 'Chains', diffusion: 0.05, max: 20 },
    { key: 'copiers', name: 'Copiers', diffusion: 0.04, max: 20 },
    { key: 'oils', name: 'Oils', diffusion: 0.04, max: 20 },
  ];

  const CHEM_DEFAULTS = {
    rawStart: 1,
    rawFromVents: 0.05,     // raw added per step at a vent's centre
    rawRecovery: 0.002,     // deep water slowly returns to rawStart
    photo: 0.03,            // raw → energy, per unit of light
    ventChem: 0.05,         // raw → energy, per unit of vent heat
    energyDecay: 0.01,
    blockMaking: 0.05,      // raw + energy → blocks, scaled by warmth
    blockDecay: 0.004,
    joining: 0.04,          // 2 blocks + energy → chain
    dryBoost: 6,            // joining is this much faster in a shallow drying pool
    hydrolysis: 0.01,       // chain → 2 blocks, in water, scaled by warmth
    uvDamage: 0.01,         // strong sunlight breaks chains and copiers
    origin: 0.00002,        // two chains happen to make a copier
    copying: 2,             // blocks + 2 copiers → 3 copiers
    copierDecay: 0.03,
    oilMaking: 0.02,        // raw → oils at vents, driven by their heat
    oilDecay: 0.002,
    // Bubbles
    bubbleThreshold: 0.6,   // oils needed in a cell for bubbles to form
    bubbleForming: 0.02,
    bubbleSize: 1,          // oils in a newborn bubble
    bubbleLeak: 0.0015,     // share of a bubble's oils lost per step
    bubbleGrowth: 0.01,     // oil uptake per step per unit of outside oil
    osmotic: 2,             // extra growth per unit of trapped chains and copiers
    permeability: 0.05,     // blocks and energy crossing the skin per step
    bubbleMelt: 70,         // degrees C at which bubbles fall apart
    maxBubbles: 700,
  };

  class Chemistry {
    constructor(earth, params) {
      this.earth = earth;
      this.p = Object.assign({}, CHEM_DEFAULTS, params || {});
      this.f = {};
      for (const s of SPECIES) this.f[s.key] = earth.addField(s.key, { diffusion: s.diffusion, max: s.max });
      for (let i = 0; i < earth.n; i++) if (earth.water[i] > 0.01) this.f.raw[i] = this.p.rawStart;
      this.bubbles = [];
      this.nextId = 1;
      this.journal = [];
      this._seen = {};
      this.history = [];
      this.stats = {};
      this.maxGen = 0;
      this.divisions = 0;
      this.extinctions = 0;
      this._present = false;
    }

    get t() { return this.earth.t; }

    step() {
      const e = this.earth;
      e.step();
      this._react();
      this._bubbles();
      if (e.t % 10 === 0) this._measure();
    }

    _react() {
      const e = this.earth, P = this.p, n = e.n;
      const { raw, energy, blocks, chains, copiers, oils } = this.f;
      for (let i = 0; i < n; i++) {
        const w = e.water[i];
        if (w <= 0.01) continue; // dry crust: nothing reacts until it is wet again
        const T = e.temp[i];
        const warm = Math.min(6, Math.exp((T - 20) / 15));
        const vent = e.ventHeat[i], light = e.light[i];
        let C = raw[i], E = energy[i], M = blocks[i], Pc = chains[i], R = copiers[i], L = oils[i];

        if (vent > 0) C += P.rawFromVents * vent;
        if (e.connected[i] && w > 3) C += (P.rawStart - C) * P.rawRecovery;

        const photo = P.photo * light * C;
        const ventE = P.ventChem * vent * C;
        const make = P.blockMaking * warm * C * E;
        const oil = P.oilMaking * vent * C;
        const dry = w < 0.3 && !e.connected[i] ? P.dryBoost : 1;
        const join = Math.min(P.joining * dry * M * M * E, M * 0.4);
        const hyd = P.hydrolysis * warm * Pc;
        const uv = P.uvDamage * light * light;
        const orig = P.origin * dry * Pc * Pc;
        const copy = Math.min(P.copying * M * R * R, M * 0.5);

        C += -photo - ventE - make - oil + P.energyDecay * E + P.blockDecay * M + P.oilDecay * L + (P.copierDecay + uv) * R + uv * Pc;
        E += photo + ventE - make - join * 0.5 - P.energyDecay * E;
        M += make - join + 2 * hyd - copy - P.blockDecay * M;
        Pc += join * 0.5 - hyd - uv * Pc - orig;
        R += copy + orig - (P.copierDecay + uv) * R;
        L += oil - P.oilDecay * L;

        raw[i] = C > 0 ? C : 0; energy[i] = E > 0 ? E : 0; blocks[i] = M > 0 ? M : 0;
        chains[i] = Pc > 0 ? Pc : 0; copiers[i] = R > 0 ? R : 0; oils[i] = L > 0 ? L : 0;
      }
    }

    _bubbles() {
      const e = this.earth, P = this.p, rng = e.rng;
      const { energy, blocks, chains, copiers, oils } = this.f;
      // Formation: crowded oils curl up into a bubble, trapping what is around.
      if (this.bubbles.length < P.maxBubbles) {
        for (let k = 0; k < 40; k++) {
          const i = Math.floor(rng() * e.n);
          const L = oils[i];
          if (L < P.bubbleThreshold || e.water[i] <= 0.05) continue;
          if (rng() > P.bubbleForming * (L - P.bubbleThreshold) * 25) continue;
          oils[i] -= P.bubbleSize * 0.5;
          const x = (i % e.cols) + rng(), y = Math.floor(i / e.cols) + rng();
          const take = 0.3;
          const b = {
            id: this.nextId++, parent: 0, gen: 0, born: e.t, x, y,
            lipid: P.bubbleSize, chains: chains[i] * take, copiers: copiers[i] * take,
            blocks: blocks[i], energy: energy[i], children: 0,
          };
          chains[i] *= 1 - take; copiers[i] *= 1 - take;
          this.bubbles.push(b);
          this._note('first-bubble', b.x, b.y, 'First bubble', 'Oily molecules crowded together near a vent and curled up into a bubble with a skin. It traps whatever was dissolved around it.');
          if (this.bubbles.length >= P.maxBubbles) break;
        }
      }
      const alive = [];
      for (const b of this.bubbles) {
        const i = e.cellAt(b.x, b.y);
        // Drift with the water, with a little jiggle.
        if (e.connected[i]) { b.x += e.vx[i] + (rng() - 0.5) * 0.3; b.y += e.vy[i] + (rng() - 0.5) * 0.3; }
        b.x = Math.max(0, Math.min(e.cols - 0.01, b.x));
        b.y = Math.max(0, Math.min(e.rows - 0.01, b.y));
        const j = e.cellAt(b.x, b.y);
        // A bubble pushed onto dry ground, or into very hot water, breaks.
        if ((e.water[j] <= 0.01 && e.ground[j] > e.seaLevel + 0.05) || e.temp[j] > P.bubbleMelt) { this._burst(b, j); continue; }
        // Small molecules pass through the skin both ways.
        const kp = P.permeability;
        let d = (blocks[j] - b.blocks) * kp; b.blocks += d; blocks[j] -= d * 0.05;
        d = (energy[j] - b.energy) * kp; b.energy += d; energy[j] -= d * 0.05;
        // Inside chemistry: copiers copy themselves from blocks; chains form and break.
        const copy = Math.min(P.copying * b.blocks * b.copiers * b.copiers, b.blocks * 0.5);
        b.copiers += copy - P.copierDecay * b.copiers * 0.5;
        b.blocks -= copy;
        const join = Math.min(P.joining * b.blocks * b.blocks * b.energy, b.blocks * 0.2);
        b.chains += join * 0.5 - P.hydrolysis * b.chains * 0.5;
        b.blocks -= join; b.energy -= join * 0.5;
        if (b.energy < 0) b.energy = 0;
        // Growth: take in oils, faster when full of chains and copiers.
        const pull = Math.min(oils[j], P.bubbleGrowth * oils[j] * (1 + P.osmotic * (b.chains + b.copiers)));
        oils[j] -= pull;
        const grown = b.lipid + pull - P.bubbleLeak * b.lipid;
        const dilute = b.lipid / grown;
        b.chains *= dilute; b.copiers *= dilute;
        b.lipid = grown;
        oils[j] += P.bubbleLeak * b.lipid;
        if (b.lipid < P.bubbleSize * 0.4) { this._burst(b, j); continue; }
        // Split: two daughters share the contents at random.
        if (b.lipid > P.bubbleSize * 2 && this.bubbles.length + alive.length < P.maxBubbles * 1.5) {
          const share = 0.5 + (rng() - 0.5) * 0.4;
          const kid = {
            id: this.nextId++, parent: b.id, gen: b.gen + 1, born: e.t,
            x: b.x + (rng() - 0.5), y: b.y + (rng() - 0.5),
            lipid: b.lipid / 2,
            chains: b.chains * (1 - share) * 2, copiers: b.copiers * (1 - share) * 2,
            blocks: b.blocks, energy: b.energy, children: 0,
          };
          b.chains *= share * 2; b.copiers *= share * 2;
          b.lipid /= 2; b.gen += 1; b.children++;
          alive.push(kid);
          this.divisions++;
          if (b.gen > this.maxGen) this.maxGen = b.gen;
          this._note('first-split', b.x, b.y, 'First split', 'A bubble grew big enough to split in two. Both halves share what was inside, by chance.');
          if (b.copiers > 0.05 && kid.copiers > 0.05) {
            this._note('heredity', b.x, b.y, 'Copiers passed to both daughters', 'A bubble holding copiers split, and both daughters kept copiers that keep copying inside them. This is the start of heredity: what is inside is passed on.');
          }
          if (b.gen >= 5 && b.copiers > 0.05) this._note('gen5', b.x, b.y, 'A lineage reached 5 generations', 'A family of bubbles with copiers inside has split five times in a row. Bubbles that carry copiers grow faster, so their lineages spread.');
          if (b.gen >= 15 && b.copiers > 0.05) this._note('gen15', b.x, b.y, 'A lineage reached 15 generations', 'Fifteen splits in a row with copiers inside. These protocells are the bridge to the first cells.');
        }
        alive.push(b);
      }
      this.bubbles = alive;
    }

    _burst(b, j) {
      const f = this.f;
      f.oils[j] += b.lipid * 0.5;
      f.chains[j] += b.chains * 0.2;
      f.copiers[j] += b.copiers * 0.2;
    }

    _measure() {
      const e = this.earth, n = e.n;
      const tot = {}, peak = {};
      for (const s of SPECIES) { tot[s.key] = 0; peak[s.key] = 0; }
      let copierCells = 0, seaCopiers = 0, poolChains = 0, copierWhere = null, chainWhere = null, wet = 0;
      for (let i = 0; i < n; i++) {
        if (e.water[i] <= 0.01) continue;
        wet++;
        for (const s of SPECIES) {
          const v = this.f[s.key][i];
          tot[s.key] += v;
          if (v > peak[s.key]) {
            peak[s.key] = v;
            if (s.key === 'copiers') copierWhere = i;
            if (s.key === 'chains') chainWhere = i;
          }
        }
        if (this.f.copiers[i] > 0.2) { copierCells++; if (e.connected[i]) seaCopiers++; }
        if (!e.connected[i]) poolChains += this.f.chains[i];
      }
      let withCopiers = 0;
      for (const b of this.bubbles) if (b.copiers > 0.05) withCopiers++;
      const st = {
        t: e.t, day: e.day,
        raw: tot.raw / wet, energy: tot.energy / wet, blocks: tot.blocks / wet,
        chains: tot.chains / wet, copiers: tot.copiers / wet, oils: tot.oils / wet,
        copierPatch: copierCells, bubbles: this.bubbles.length, withCopiers,
        maxGen: this.maxGen, divisions: this.divisions, extinctions: this.extinctions,
      };
      this.stats = st;
      this.history.push(st);
      if (this.history.length > 1200) this.history.splice(0, this.history.length - 1200);
      const place = (i) => i == null ? '' : ' (' + e.kind(i) + ')';
      if (peak.chains > 0.5 && chainWhere != null) {
        this._note('chains', chainWhere % e.cols, Math.floor(chainWhere / e.cols), 'First chains' + place(chainWhere),
          'Building blocks joined into chains. Joining needs little water, so chains pile up where pools dry out, and break apart again when the water returns.');
      }
      if (copierCells > 0 && copierWhere != null) {
        this._note('copiers', copierWhere % e.cols, Math.floor(copierWhere / e.cols), 'First copiers' + place(copierWhere),
          'Somewhere, two chains made a molecule that helps make more of itself. If enough of them stay together they spread; if they get diluted they die out.');
      }
      if (seaCopiers >= 300) this._note('spread', null, null, 'Copiers are spreading', 'Copiers now hold ' + seaCopiers + ' patches of open water. Each patch feeds on building blocks and buds off new patches: self-copying spots.');
      // Copiers come and go. Count each comeback, note only the first.
      if (this._present && copierCells === 0) {
        this._present = false; this.extinctions++;
        this._note('gone', null, null, 'Copiers died out', 'The copiers were diluted, starved of building blocks or broken by sunlight faster than they could copy themselves. They can arise again by chance in a drying pool.');
      } else if (!this._present && copierCells > 0) {
        this._present = true;
        if (this.extinctions > 0) this._note('back', copierWhere % e.cols, Math.floor(copierWhere / e.cols), 'Copiers arose again' + place(copierWhere), 'After dying out, copiers appeared again from scratch. Origins can happen many times; most of them fail.');
      }
    }

    _note(key, x, y, title, text) {
      if (this._seen[key]) return;
      this._seen[key] = true;
      this._add(title, text, x, y);
    }
    _add(title, text, x, y) {
      this.journal.push({ t: this.earth.t, day: this.earth.day, title, text, x, y });
    }

    // Interventions.
    pour(key, x, y, amount, radius) {
      const e = this.earth, r = radius || 3;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const xx = Math.round(x) + dx, yy = Math.round(y) + dy;
          if (xx < 0 || yy < 0 || xx >= e.cols || yy >= e.rows) continue;
          const i = e.idx(xx, yy);
          if (e.water[i] <= 0.01) continue;
          const w = Math.exp(-(dx * dx + dy * dy) / (r * r * 0.5));
          this.f[key][i] = Math.min(20, this.f[key][i] + amount * w);
        }
      }
    }
    addVent(x, y) { this.earth.addVent(Math.round(x), Math.round(y)); }

    at(i) {
      const o = {};
      for (const s of SPECIES) o[s.key] = this.f[s.key][i];
      return o;
    }
    bubbleNear(x, y, r) {
      let best = null, bd = r * r;
      for (const b of this.bubbles) {
        const d = (b.x - x) ** 2 + (b.y - y) ** 2;
        if (d < bd) { bd = d; best = b; }
      }
      return best;
    }
  }

  // Ready-made worlds that differ in one thing, to compare side by side.
  const PRESETS = {
    full: { label: 'Early Earth', earth: {}, chem: {} },
    dark: { label: 'Dark ocean (no sunlight)', earth: { dark: true }, chem: {} },
    calm: { label: 'No tides (no pools)', earth: { tideRange: 0.02 }, chem: {} },
    novents: { label: 'No vents', earth: { vents: 0 }, chem: {} },
    cool: { label: 'Cool vents', earth: { ventHeat: 2 }, chem: {} },
  };

  function makeWorld(preset, seed) {
    const pr = PRESETS[preset] || PRESETS.full;
    const earth = new EarthSim.Earth(Object.assign({ seed }, pr.earth));
    return new Chemistry(earth, pr.chem);
  }

  const api = { Chemistry, SPECIES, CHEM_DEFAULTS, PRESETS, makeWorld };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChemSim = api;
})(typeof self !== 'undefined' ? self : this);
