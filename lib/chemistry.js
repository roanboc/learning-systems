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
// First genes (opt-in, `genes`, off by default): copiers inside a bubble come
// in kinds. Skin-makers turn raw molecules into oils for the bubble's own
// skin; block-makers turn raw molecules and energy into building blocks
// inside. Plain copiers do nothing but copy, and copy fastest. A copy can
// come out broken (a plain copier), so plain copiers act as parasites. At a
// split each kind is shared at random on its own, so some daughters get more
// working genes than others (the stochastic corrector, Szathmary and Demeter
// 1987). Each bubble keeps a closure score: the share of its skin and blocks
// it made itself rather than took from the water (Moreno and Mossio 2015).
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
    // First genes (opt-in). Off: Early Earth gives identical results.
    genes: false,
    skinMake: 1,            // oils made per step per unit of skin-makers and of raw outside
    blockMake: 0.5,         // blocks made per step per unit of block-makers, raw and energy
    makeCost: 0.1,          // energy spent per unit made
    geneCost: 0.1,          // working genes copy this much slower than plain copiers
    geneError: 0.005,       // share of new copies of a working gene that come out broken
    geneGain: 0.002,        // share of new plain copies that happen to work (each kind)
    geneUnit: 0.05,         // amount of copier that is one molecule, for sharing at a split
    linked: false,          // genes joined in one chain: copied together, and daughters get the same share of each
    linkCost: 0.2,          // a linked chain copies this much slower
    leaky: false,           // lab: what genes make leaks into the water instead of staying inside
    startProtocells: 0,     // protocells (bubbles with a mix of copiers) placed near the vents at the start
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
      if (this.p.genes) this._startGenes();
    }

    get t() { return this.earth.t; }

    // First genes: the chapter starts where Early Earth leaves off, with a few
    // protocells near the vents, each holding a random mix of copiers.
    _startGenes() {
      const e = this.earth, rng = e.rng, P = this.p, vents = e.vents;
      this.geneStats = { born: 0, empty: 0 };
      for (let k = 0; k < P.startProtocells && vents.length; k++) {
        const v = vents[k % vents.length];
        const x = Math.max(0, Math.min(e.cols - 0.01, v.x + (rng() - 0.5) * 8));
        const y = Math.max(0, Math.min(e.rows - 0.01, v.y + (rng() - 0.5) * 8));
        if (e.water[e.cellAt(x, y)] <= 0.05) continue;
        const b = {
          id: this.nextId++, parent: 0, gen: 0, born: 0, x, y,
          lipid: P.bubbleSize * (1 + rng() * 0.8), chains: 0, copiers: 0, blocks: 0.2, energy: 0.1, children: 0,
        };
        this._mixGenes(b, 0.2 + rng() * 0.2);
        this.bubbles.push(b);
      }
    }

    // Copiers trapped in a new bubble: mostly plain, a few that happen to work.
    _mixGenes(b, amount) {
      const rng = this.earth.rng;
      b.skin = amount * rng() * 0.3;
      b.meta = amount * rng() * 0.3;
      b.plain = amount - b.skin - b.meta;
      b.copiers = amount;
      b.selfMade = 0; b.taken = 0.002; b.closure = 0; // a newborn bubble has made nothing yet
    }

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
          if (P.genes) this._mixGenes(b, b.copiers);
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
        const blocksIn = d > 0 ? d : 0;
        d = (energy[j] - b.energy) * kp; b.energy += d; energy[j] -= d * 0.05;
        // Inside chemistry: copiers copy themselves from blocks; chains form and break.
        const copy = Math.min(P.copying * b.blocks * b.copiers * b.copiers, b.blocks * 0.5);
        let ownOil = 0;
        if (P.genes) ownOil = this._genes(b, j, copy, blocksIn);
        else b.copiers += copy - P.copierDecay * b.copiers * 0.5;
        b.blocks -= copy;
        const join = Math.min(P.joining * b.blocks * b.blocks * b.energy, b.blocks * 0.2);
        b.chains += join * 0.5 - P.hydrolysis * b.chains * 0.5;
        b.blocks -= join; b.energy -= join * 0.5;
        if (b.energy < 0) b.energy = 0;
        // Growth: take in oils, faster when full of chains and copiers.
        const pull = Math.min(oils[j], P.bubbleGrowth * oils[j] * (1 + P.osmotic * (b.chains + b.copiers)));
        oils[j] -= pull;
        const grown = b.lipid + pull + ownOil - P.bubbleLeak * b.lipid;
        const dilute = b.lipid / grown;
        b.chains *= dilute; b.copiers *= dilute;
        if (P.genes) {
          b.skin *= dilute; b.meta *= dilute; b.plain *= dilute;
          // Closure: what the bubble made itself, against what it took in.
          b.taken = b.taken * 0.98 + (pull + blocksIn) * 0.02;
          b.closure = b.selfMade + b.taken > 1e-9 ? b.selfMade / (b.selfMade + b.taken) : 0;
        }
        b.lipid = grown;
        oils[j] += P.bubbleLeak * b.lipid;
        if (b.lipid < P.bubbleSize * 0.4) { this._burst(b, j); continue; }
        // Split: two daughters share the contents at random.
        if (b.lipid > P.bubbleSize * 2 && (P.genes || this.bubbles.length + alive.length < P.maxBubbles * 1.5)) {
          const share = 0.5 + (rng() - 0.5) * 0.4;
          const kid = {
            id: this.nextId++, parent: b.id, gen: b.gen + 1, born: e.t,
            x: b.x + (rng() - 0.5), y: b.y + (rng() - 0.5),
            lipid: b.lipid / 2,
            chains: b.chains * (1 - share) * 2, copiers: b.copiers * (1 - share) * 2,
            blocks: b.blocks, energy: b.energy, children: 0,
          };
          b.chains *= share * 2; b.copiers *= share * 2;
          if (P.genes) this._shareGenes(b, kid, share);
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
      // First genes: a crowded sea has room for only so many protocells. When
      // it is full, random ones break up, so the ones that split fastest spread.
      if (P.genes) {
        while (alive.length > P.maxBubbles) {
          const k = Math.floor(rng() * alive.length), b = alive[k];
          this._burst(b, e.cellAt(b.x, b.y));
          alive[k] = alive[alive.length - 1]; alive.pop();
        }
      }
      this.bubbles = alive;
    }

    // First genes, one step inside a bubble. `copy` is how much copying its
    // blocks allow; the kinds compete for it. Returns the oils the bubble made
    // for its own skin.
    _genes(b, j, copy, blocksIn) {
      // Linked genes are copied as one chain, so no kind can copy faster than
      // the others inside a protocell; the whole chain copies a little slower.
      const P = this.p, f = this.f, w = P.linked ? 1 : 1 - P.geneCost;
      if (P.linked) copy *= 1 - P.linkCost;
      const ws = b.skin * w, wm = b.meta * w, wp = b.plain, W = ws + wm + wp;
      if (W > 1e-12) {
        const cs = copy * ws / W, cm = copy * wm / W, cp = copy * wp / W;
        const gain = cp * P.geneGain;
        b.skin += cs * (1 - P.geneError) + gain;
        b.meta += cm * (1 - P.geneError) + gain;
        b.plain += cp - 2 * gain + (cs + cm) * P.geneError;
      }
      const decay = 1 - P.copierDecay * 0.5;
      b.skin *= decay; b.meta *= decay; b.plain *= decay;
      // Working genes do their jobs, paid for with the bubble's energy.
      const raw = f.raw[j];
      let oil = Math.min(P.skinMake * b.skin * raw, raw * 0.2, b.energy / P.makeCost);
      b.energy -= oil * P.makeCost;
      let blk = Math.min(P.blockMake * b.meta * raw * (1 + b.energy * 4), raw * 0.2 - oil, b.energy / P.makeCost);
      if (blk < 0) blk = 0;
      b.energy -= blk * P.makeCost;
      f.raw[j] -= oil + blk;
      b.copiers = b.skin + b.meta + b.plain;
      if (P.leaky) {
        // Lab: the skin does not keep what genes make. It goes into the water,
        // for any bubble nearby.
        f.oils[j] += oil; f.blocks[j] += blk;
        b.selfMade *= 0.98;
        return 0;
      }
      b.blocks += blk;
      b.selfMade = b.selfMade * 0.98 + (oil + blk) * 0.02;
      return oil;
    }

    // At a split, each kind of gene is shared at random on its own: few
    // molecules mean big differences between daughters. Linked genes travel
    // together, so daughters get the same share of each.
    _shareGenes(b, kid, share) {
      const P = this.p, rng = this.earth.rng;
      const gauss = () => Math.sqrt(-2 * Math.log(rng() || 1e-9)) * Math.cos(2 * Math.PI * rng());
      for (const k of ['skin', 'meta', 'plain']) {
        let s = share;
        if (!P.linked) {
          const n = b[k] * b.lipid / P.geneUnit;
          s = n < 1 ? (rng() < 0.5 ? 0 : 1) : Math.max(0, Math.min(1, 0.5 + gauss() * 0.5 / Math.sqrt(n)));
        }
        // Amounts are per unit of skin, and each daughter has half the skin.
        const total = b[k];
        b[k] = total * s * 2; kid[k] = total * (1 - s) * 2;
      }
      b.copiers = b.skin + b.meta + b.plain;
      kid.copiers = kid.skin + kid.meta + kid.plain;
      kid.selfMade = b.selfMade / 2; kid.taken = b.taken / 2; kid.closure = b.closure;
      b.selfMade /= 2; b.taken /= 2;
      for (const c of [b, kid]) {
        this.geneStats.born++;
        if ((c.skin + c.meta) * kid.lipid < P.geneUnit) this.geneStats.empty++;
      }
      // Each daughter gets half the skin (the mother's is halved just after this).
      const works = (c) => (c.skin + c.meta) * kid.lipid >= P.geneUnit;
      if (works(b) && works(kid)) this._note('genes-kept', b.x, b.y, 'Genes passed to both daughters', 'A protocell split and both daughters kept working genes: copiers that make its skin and its building blocks. Each daughter can go on making itself. Genes began like this: as copied molecules with a job.');
      else if (works(b) !== works(kid)) this._note('empty-daughter', kid.x, kid.y, 'A daughter got no working genes', 'At the split, by chance, the working genes all went to one side. The empty daughter can still copy plain copiers, but it cannot make its own skin or blocks.');
      if (b.gen >= 30 && works(b)) this._note('genes-gen30', b.x, b.y, 'A lineage with genes reached 30 generations', 'Thirty splits in a row, each time passing on working genes. What is inherited is no longer just stuff: it is the ability to keep making the protocell.');
    }

    // Journal notes about genes, checked now and then.
    _geneNotes(b) {
      const e = this.earth;
      if (b.closure > 0.5 && (b.skin + b.meta) * b.lipid > this.p.geneUnit) this._note('self-made', b.x, b.y, 'A protocell that mostly makes itself', 'More than half of this protocell\'s skin and building blocks now come from its own genes, not from the water. A network that keeps making the parts that make it: this is closure, how researchers now describe autopoiesis.');
      if (b.closure > 0.4 && this.ventDistance(e.cellAt(b.x, b.y)) > 25) this._note('far', b.x, b.y, 'Living far from the vents', 'This protocell makes its own skin from raw molecules, so it no longer depends on the oils that only the vents make.');
    }

    _burst(b, j) {
      const f = this.f;
      if (this.p.genes && b.gen > 0 && b.lipid < this.p.bubbleSize * 0.4 && b.plain > 9 * (b.skin + b.meta)) this._note('parasites', b.x, b.y, 'Parasites ended a lineage', 'Plain copiers copy fastest and do no work. In this protocell they crowded out the working genes, so it could no longer make its skin. It shrank and broke up.');
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
      if (this.p.genes) Object.assign(st, this._geneMeasure());
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

    // How far each map cell is from the nearest vent, in map cells.
    ventDistance(i) {
      const e = this.earth;
      if (!this._ventDist || this._ventDistN !== e.vents.length) {
        this._ventDistN = e.vents.length;
        this._ventDist = new Float32Array(e.n);
        for (let k = 0; k < e.n; k++) {
          const x = k % e.cols, y = Math.floor(k / e.cols);
          let best = 1e9;
          for (const v of e.vents) best = Math.min(best, Math.hypot(v.x - x, v.y - y));
          this._ventDist[k] = best;
        }
      }
      return this._ventDist[i];
    }

    _geneMeasure() {
      const e = this.earth, P = this.p;
      let closure = 0, working = 0, all = 0, far = 0, near = 0, living = 0, parasite = 0;
      for (const b of this.bubbles) {
        const total = b.skin + b.meta + b.plain;
        if (total * b.lipid < P.geneUnit) continue;
        this._geneNotes(b);
        living++;
        closure += b.closure;
        working += (b.skin + b.meta) * b.lipid; all += total * b.lipid;
        parasite += b.plain / total;
        const dist = this.ventDistance(e.cellAt(b.x, b.y));
        if (dist > 10) far++;
        if (dist <= 5) near++;
      }
      const gs = this.geneStats;
      const st = {
        protocells: living,
        closure: living ? closure / living : 0,
        working: all ? working / all : 0,
        parasites: living ? parasite / living : 0,
        far, near,
        emptyBirths: gs.born ? gs.empty / gs.born : 0,
      };
      gs.born = 0; gs.empty = 0;
      return st;
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

  // First genes: the same coast, starting with protocells near the vents.
  const GENE_PRESETS = {
    genes: { label: 'First genes', earth: {}, chem: { genes: true, startProtocells: 60 } },
    leaky: { label: 'Leaky skin (genes help everyone)', earth: {}, chem: { genes: true, startProtocells: 60, leaky: true } },
    noskin: { label: 'No skin-makers', earth: {}, chem: { genes: true, startProtocells: 60, skinMake: 0 } },
    linked: { label: 'Linked genes (a first chromosome)', earth: {}, chem: { genes: true, startProtocells: 60, linked: true } },
  };

  function makeWorld(preset, seed) {
    const pr = PRESETS[preset] || GENE_PRESETS[preset] || PRESETS.full;
    const earth = new EarthSim.Earth(Object.assign({ seed }, pr.earth));
    return new Chemistry(earth, pr.chem);
  }

  const api = { Chemistry, SPECIES, CHEM_DEFAULTS, PRESETS, GENE_PRESETS, makeWorld };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChemSim = api;
})(typeof self !== 'undefined' ? self : this);
