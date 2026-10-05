// A body made of cells: the inner world of a creature.
//
// A creature is not a point with an energy number. It is a set of organs
// (gut, muscle, eye, skin, germ cells), each made of cells, all living in a
// body fluid: a small sea inside the creature that carries energy from the
// gut to every cell, the way the water carries food to free cells on the
// coast (lib/life.js). The brain is one more organ that drinks from the
// same fluid.
//
// Each organ is kept as a census: how many cells it has and how much energy
// the average cell stores. Every step:
//   - the gut moves food from the stomach into the fluid, as fast as its
//     cells can,
//   - every cell burns a little energy to stay alive and refills from the
//     fluid,
//   - cells that stay starved die, muscle cells wear out,
//   - when the fluid runs dry the body breaks down its own cells (skin
//     first, germ cells last) and their flesh feeds the rest,
//   - organs regrow toward the body plan when the fluid can pay for it.
// What the creature can do comes from its live, fed cells: speed from
// muscle, sight from eyes, digestion from gut, armour from skin, offspring
// from germ cells. So a change at the level of cells shows up in the
// creature, and a change in the creature's life (hunger, poison, bites)
// shows up in its cells.
//
// Energy is conserved: every unit is in the stomach, the fluid or a cell (its
// flesh and its store), or is recorded as eaten in, burned, lost (poison,
// bites, dead cells) or given to a child. A cell's flesh is the energy built
// into it: it comes back to whoever eats the cell, so a bite takes flesh. ledger() reports the books; check() says how far they are off.
//
// Units are the creature's energy units (a meal is ~35). No DOM here; runs in
// the browser and in Node.
(function (root) {
  'use strict';

  const BODY_DEFAULTS = {
    cellMax: 0.3,          // energy a cell can store
    cellStart: 0.2,        // store of a newly made cell
    flesh: 1,              // energy built into each cell's matter; a hunter that eats the cell gets it
    buildWork: 0.2,        // energy burned making a cell, on top of its flesh and store
    cellUpkeep: 0.0016,    // energy a cell burns per step to stay alive
    refill: 0.05,          // share of a cell's missing store it can draw from the fluid per step
    starveAt: 0.05,        // cells with less stored than this start to die
    starveDeath: 0.01,     // share of fully starved cells that die per step
    reserve: 0.3,          // organs only regrow while the fluid holds more than this, per planned cell
    birthBuild: 0.5,       // share of a newborn's energy spent building its first cells
    hungerAt: 2,           // below this much fluid the body breaks down its own cells for energy
    breakdown: 0.01,       // share of an organ's cells broken down per step when starving
    musclePerSpeed: 10,    // muscle cells planned per unit of the speed gene
    eyePerRange: 0.15,     // eye cells planned per unit of sight range
    germCells: 4,
    muscleLife: 2500,      // muscle cells wear out after about this many steps
    muscleWork: 0.1,       // a muscle cell works fully only with at least this much stored
    digestPerCell: 0.6,    // energy one gut cell moves from stomach to fluid per step
    poisonKill: 0.02,      // cells poison kills per unit of damage, on top of the fluid it drains
    biteKill: 0.05,        // cells a bite tears per unit of damage, on top of the fluid it drains
    armourPerSkin: 0.02,   // share of a bite one skin cell stops (up to maxArmour)
    maxArmour: 0.6,
    failAt: 0.35,          // the creature dies when fewer than this share of its most cells ever live
    fluidRef: 40,          // fluid level at which the brain's blood supply is normal
  };

  const ORGANS = ['gut', 'muscle', 'eye', 'skin', 'germ'];
  // The order a starving body gives up its cells.
  const BREAKDOWN = ['skin', 'eye', 'muscle', 'gut', 'germ'];

  // Organ sizes from the genome. speed and senseRange are the creature's
  // existing genes: with a body, they say how much muscle and eye to build.
  function plan(g, p) {
    return {
      gut: g.gut,
      muscle: g.speed * p.musclePerSpeed,
      eye: g.senseRange * p.eyePerRange,
      skin: g.skin,
      germ: p.germCells,
    };
  }

  class Body {
    // g: the creature's genes (speed, senseRange, gut, skin, renew).
    // energy: everything the newborn gets; part of it builds its cells.
    // grown: the body arrives fully built and keeps all of energy as fluid
    // (the first creatures of a world); its cells are added to the books.
    constructor(g, energy, params, grown) {
      this.p = Object.assign({}, BODY_DEFAULTS, params || {});
      const p = this.p;
      this.g = g;
      this.plan = plan(g, p);
      this.organs = {};
      let cells = 0;
      for (const k of ORGANS) cells += this.plan[k];
      // A newborn builds what it can afford, keeping some energy as fluid.
      const perCell = p.flesh + p.cellStart + p.buildWork;
      if (grown) energy += cells * perCell;
      const afford = grown ? 1 : Math.min(1, Math.max(0, energy * p.birthBuild) / (cells * perCell || 1));
      let spent = 0;
      for (const k of ORGANS) {
        const n = this.plan[k] * afford;
        this.organs[k] = { n, e: p.cellStart, born: 0, died: 0 };
        spent += n * perCell;
      }
      this.stomach = 0;
      this.fluid = energy - spent;
      this.peak = this.cells();
      this.reserve = p.reserve * cells;
      this.brainStarved = 0;
      // The books, since birth. The work of building the first cells counts as burned.
      this.book = { start: energy, eaten: 0, burned: cells * afford * p.buildWork, lost: 0, given: 0 };
    }

    cells() { let n = 0; for (const k of ORGANS) n += this.organs[k].n; return n; }
    planned() { let n = 0; for (const k of ORGANS) n += this.plan[k]; return n; }
    total() {
      let e = this.stomach + this.fluid;
      for (const k of ORGANS) e += this.organs[k].n * (this.p.flesh + this.organs[k].e);
      return e;
    }
    failed() { return this.cells() < this.p.failAt * this.peak || this.total() <= 0; }

    // Working share of an organ: live cells times how well fed they are.
    working(k) {
      const o = this.organs[k], plan = this.plan[k];
      if (plan <= 0) return 0;
      const fed = k === 'muscle' ? Math.min(1, o.e / this.p.muscleWork) : Math.min(1, o.e / this.p.starveAt);
      return Math.min(1, o.n * fed / plan);
    }
    speedFactor() { return this.working('muscle'); }
    sightFactor() { return this.working('eye'); }
    armour() { return Math.min(this.p.maxArmour, this.organs.skin.n * this.working('skin') * this.p.armourPerSkin); }
    // Blood supply to the brain, relative to normal (0 = none).
    bloodLevel() { return Math.max(0, Math.min(1.5, this.fluid / this.p.fluidRef)); }

    eat(energy) { this.stomach += energy; this.book.eaten += energy; }

    // Muscles pay for movement from their own stores.
    move(cost) {
      const m = this.organs.muscle;
      const have = m.n * m.e, paid = Math.min(have, cost);
      if (m.n > 0) m.e -= paid / m.n;
      this.book.burned += paid;
    }

    // Kill cells: half from the organ hit first, the rest spread over the body.
    killCells(count, first) {
      let lost = 0;
      const all = this.cells();
      if (all <= 0) return 0;
      const hit = (k, n) => {
        const o = this.organs[k], d = Math.min(o.n, n);
        o.n -= d; o.died += d; lost += d * (this.p.flesh + o.e);
        return d;
      };
      // The organ hit first loses at most a third of its cells to one blow.
      let left = count - (first ? hit(first, Math.min(count / 2, this.organs[first].n / 3)) : 0);
      const rest = this.cells();
      if (rest > 0 && left > 0) for (const k of ORGANS) hit(k, left * this.organs[k].n / rest);
      return lost;
    }

    // Damage drains the fluid and kills cells, starting with one organ. What
    // the fluid cannot cover comes out of cells too, so harm to a starving
    // body is worse. Returns the energy removed.
    harm(damage, killPerDamage, first) {
      const p = this.p;
      const fromFluid = Math.min(this.fluid, damage);
      this.fluid -= fromFluid;
      const cellValue = p.flesh + p.cellStart;
      const removed = fromFluid + this.killCells(damage * killPerDamage + (damage - fromFluid) / cellValue, first);
      this.book.lost += removed;
      return removed;
    }

    // Poison: drains the fluid and kills cells, starting with the gut.
    poison(damage) { return this.harm(damage, this.p.poisonKill, 'gut'); }

    // A bite from a hunter: skin stops part of it, the rest drains the fluid
    // and tears cells, starting with skin. Returns the energy taken.
    bite(damage) { return this.harm(damage * (1 - this.armour()), this.p.biteKill, 'skin'); }

    // Energy for a child, taken from the fluid, and one germ cell to start it.
    canReproduce(share) { return this.fluid >= share && this.organs.germ.n >= 1; }
    give(share) {
      const germ = this.organs.germ;
      this.fluid -= share;
      germ.n -= 1;
      const out = share + this.p.flesh + germ.e;
      this.book.given += out;
      return out;
    }

    // One step of the body's inner life. brainCost: what the brain burns now.
    step(brainCost) {
      const p = this.p, b = this.book;
      // Digestion: as fast as the working gut cells allow.
      const d = Math.min(this.stomach, this.organs.gut.n * this.working('gut') * p.digestPerCell);
      this.stomach -= d; this.fluid += d;
      // The brain drinks first.
      const brain = Math.min(this.fluid, brainCost);
      this.fluid -= brain; b.burned += brain;
      this.brainStarved = brainCost > 0 ? 1 - brain / brainCost : 0;
      // Starving: break down cells, least needed first, to refill the fluid.
      if (this.fluid < p.hungerAt) {
        for (const k of BREAKDOWN) {
          const o = this.organs[k];
          if (o.n <= 0) continue;
          const d = Math.min(o.n, o.n * p.breakdown + 0.01);
          o.n -= d; o.died += d; this.fluid += d * (p.flesh + o.e);
          if (this.fluid >= p.hungerAt) break;
        }
      }
      for (const k of ORGANS) {
        const o = this.organs[k];
        if (o.n <= 0) continue;
        // Upkeep from each cell's own store, then a refill from the fluid.
        const burn = Math.min(o.e, p.cellUpkeep);
        o.e -= burn; b.burned += burn * o.n;
        const want = o.n * (p.cellMax - o.e) * p.refill;
        const take = Math.min(want, this.fluid);
        this.fluid -= take; o.e += take / o.n;
        // Starved cells die; muscle wears out.
        let die = 0;
        if (o.e < p.starveAt) die += o.n * p.starveDeath * (1 - o.e / p.starveAt);
        if (k === 'muscle') die += o.n / p.muscleLife;
        die = Math.min(o.n, die);
        o.n -= die; o.died += die; b.lost += die * (p.flesh + o.e);
        // Regrowth toward the plan, paid from the fluid; the renew gene sets the pace.
        // The gut regrows first, even from a low fluid: it is what refills the fluid.
        const missing = this.plan[k] - o.n, keep = k === 'gut' ? 0 : this.reserve;
        if (missing > 0 && this.fluid > keep) {
          const perCell = p.flesh + p.cellStart + p.buildWork;
          const make = Math.min(missing, this.g.renew * this.plan[k] * 0.01, (this.fluid - keep) / perCell);
          if (make > 0) {
            this.fluid -= make * perCell; b.burned += make * p.buildWork;
            o.e = (o.e * o.n + make * p.cellStart) / (o.n + make);
            o.n += make; o.born += make;
          }
          this.peak = Math.max(this.peak, this.cells());
        }
      }
    }

    // What came in minus what went out should equal what is held now.
    ledger() {
      const b = this.book, held = this.total();
      return { held, expected: b.start + b.eaten - b.burned - b.lost - b.given, ...b };
    }
    check() { const l = this.ledger(); return l.held - l.expected; }

    // For panels: one row per organ.
    census() {
      return ORGANS.map((k) => {
        const o = this.organs[k];
        return { organ: k, cells: o.n, planned: this.plan[k], store: o.e, working: this.working(k), born: o.born, died: o.died };
      });
    }
  }

  // Body genes, used by worlds whose creatures have bodies of cells.
  const BODY_GENES = {
    gut:   { min: 2, max: 24, init: [6, 10] },   // gut cells: faster digestion, more upkeep
    skin:  { min: 0, max: 30, init: [6, 12] },   // skin cells: armour against bites
    renew: { min: 0, max: 3,  init: [0.5, 1.5] }, // how fast organs regrow lost cells (% of plan per step)
  };

  const api = { Body, BODY_DEFAULTS, BODY_GENES, ORGANS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BodySim = api;
})(typeof self !== 'undefined' ? self : this);
