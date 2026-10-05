// A small Earth: the shared physical world for every chapter of the timeline.
//
// Seen from above, a stretch of coast: land, beaches, tide pools, shallow sea
// and deep sea with hot vents on the floor. Everything is a grid of cells.
//   Ground:  height of the ground in each cell (metres, sea level is 0).
//   Water:   the sea rises and falls with the tide. Cells above the sea keep
//            the water they had and slowly dry out, so tide pools appear.
//   Sun:     a day and night cycle. Light fades with water depth.
//   Heat:    the sun warms shallow water and land; vents heat the deep floor.
//            Heat spreads and is carried by currents.
//   Flow:    slow eddies and a tidal flow, both swirling without piling water
//            up anywhere (divergence-free), and still near the shore.
//
// Anything dissolved in the water (chemicals now, food or scent later) is a
// field registered with addField(). Earth moves every field with the water:
// currents carry it, it spreads by diffusion, it is concentrated when a pool
// dries and diluted when the tide comes back.
//
// No DOM here; runs in the browser and in Node.
(function (root) {
  'use strict';

  const EARTH_DEFAULTS = {
    seed: 1,
    cols: 160,
    rows: 100,
    dayLength: 720,       // steps per day
    tideLength: 470,      // steps per tide cycle (out of step with the day)
    tideRange: 0.6,       // metres between mean sea level and high tide
    landShare: 0.3,       // rough share of the map above sea level
    vents: 4,
    ventHeat: 5,          // heat added per step at a vent's centre
    lightDepth: 2.5,      // metres of water that cut light to about a third
    currentSpeed: 0.35,   // cells per step at the fastest eddy
    eddyScale: 22,        // cells across a typical eddy
    eddyChange: 4000,     // steps for the eddy pattern to change
    tidalFlow: 0.12,      // extra in-and-out flow along the coast
    evaporation: 0.004,   // share of a pool's water lost per step in full sun
    heatDiffusion: 0.12,
    dark: false,          // true: no sunlight at all (a dark ocean)
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Smooth value noise on a lattice, wrapped so it tiles.
  function makeNoise(rng, period) {
    const n = period * period, v = new Float32Array(n);
    for (let i = 0; i < n; i++) v[i] = rng() * 2 - 1;
    const s = (t) => t * t * (3 - 2 * t);
    return function (x, y) {
      const xi = Math.floor(x), yi = Math.floor(y), fx = s(x - xi), fy = s(y - yi);
      const x0 = ((xi % period) + period) % period, y0 = ((yi % period) + period) % period;
      const x1 = (x0 + 1) % period, y1 = (y0 + 1) % period;
      const a = v[y0 * period + x0], b = v[y0 * period + x1], c = v[y1 * period + x0], d = v[y1 * period + x1];
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
  }

  class Earth {
    constructor(params) {
      this.p = Object.assign({}, EARTH_DEFAULTS, params || {});
      const { cols, rows } = this.p;
      this.cols = cols; this.rows = rows; this.n = cols * rows;
      this.rng = mulberry32(this.p.seed >>> 0);
      this.t = 0;
      this.ground = new Float32Array(this.n);   // metres
      this.water = new Float32Array(this.n);    // metres of water standing in the cell
      this.light = new Float32Array(this.n);    // 0..1 reaching the bottom (or the ground)
      this.temp = new Float32Array(this.n);     // degrees C
      this.vx = new Float32Array(this.n);
      this.vy = new Float32Array(this.n);
      this.connected = new Uint8Array(this.n);  // 1 where the cell is open sea now
      this.surface = new Float32Array(this.n);  // water surface height in each cell
      this._queue = new Int32Array(this.n);
      this.ventHeat = new Float32Array(this.n);
      this.fields = [];
      this.fieldByName = {};
      this._tmp = new Float32Array(this.n);
      this._tmp2 = new Float32Array(this.n);
      this._ventCells = [];
      this._makeGround();
      this._makeVents();
      this._noiseA = makeNoise(this.rng, 16);
      this._noiseB = makeNoise(this.rng, 16);
      this.seaLevel = 0;
      this.sun = 0;
      this._updateSea();
      for (let i = 0; i < this.n; i++) {
        this.surface[i] = this.seaLevel;
        this.temp[i] = 15;
      }
      this._updateWater(true);
      this._updateFlow();
    }

    idx(x, y) { return y * this.cols + x; }

    // Coast along the top edge, deep sea toward the bottom, a few islands and
    // a ridge on the floor where the vents sit.
    _makeGround() {
      const { cols, rows, landShare } = this.p;
      const n1 = makeNoise(this.rng, 12), n2 = makeNoise(this.rng, 24);
      const ridgeY = 0.72 + (this.rng() - 0.5) * 0.1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const u = x / cols, v = y / rows;
          // Slope from land (top) into the deep (bottom).
          let h = (landShare - v) * 9;
          h += n1(u * 5, v * 5) * 2.2 + n2(u * 11, v * 11) * 0.8;
          // Bays and headlands along the coast.
          h += Math.sin(u * Math.PI * 3 + n1(u * 2, 7) * 2) * 0.9 * Math.max(0, 1 - Math.abs(v - landShare) * 4);
          // Rocky bumps and hollows near the waterline make tide pools.
          const nearShore = Math.exp(-h * h / 1.2);
          h += n2(u * 37 + 5, v * 37) * 0.9 * nearShore;
          // A mid-ocean ridge rising from the floor.
          const r = Math.exp(-Math.pow((v - ridgeY - n1(u * 3, 3) * 0.05) / 0.05, 2));
          h += r * 1.8;
          // Keep the deep sea deep and the land not too high.
          h = h < 0 ? Math.max(h, -9) : Math.min(h, 4);
          this.ground[this.idx(x, y)] = h;
        }
      }
      this.ridgeY = ridgeY;
    }

    _makeVents() {
      const { cols, rows, vents } = this.p;
      const cands = [];
      for (let y = 2; y < rows - 2; y++) {
        for (let x = 2; x < cols - 2; x++) {
          const g = this.ground[this.idx(x, y)];
          if (g < -3 && Math.abs(y / rows - this.ridgeY) < 0.08) cands.push([x, y]);
        }
      }
      for (let k = 0; k < vents && cands.length; k++) {
        // Spread vents along the ridge.
        let best = null, bestD = -1;
        for (let t = 0; t < 30; t++) {
          const c = cands[Math.floor(this.rng() * cands.length)];
          let d = Infinity;
          for (const v of this._ventCells) d = Math.min(d, Math.hypot(v.x - c[0], v.y - c[1]));
          if (d > bestD) { bestD = d; best = c; }
        }
        this.addVent(best[0], best[1]);
      }
    }

    // A vent heats a small disc of floor. Chemistry can read ventHeat too.
    addVent(x, y, strength) {
      const s = strength == null ? 1 : strength;
      this._ventCells.push({ x, y, s });
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= this.cols || yy >= this.rows) continue;
          const w = Math.exp(-(dx * dx + dy * dy) / 3) * s;
          this.ventHeat[this.idx(xx, yy)] += w;
        }
      }
    }
    get vents() { return this._ventCells; }

    // Fields: anything dissolved in the water. Values are concentrations.
    addField(name, opts) {
      const f = Object.assign({ name, diffusion: 0.1, max: 50 }, opts || {}, { v: new Float32Array(this.n) });
      this.fields.push(f);
      this.fieldByName[name] = f;
      return f.v;
    }
    field(name) { return this.fieldByName[name].v; }

    // Time of day, 0 at midnight, 0.5 at noon.
    get dayPhase() { return (this.t % this.p.dayLength) / this.p.dayLength; }
    get day() { return Math.floor(this.t / this.p.dayLength); }

    _updateSea() {
      const tp = (this.t % this.p.tideLength) / this.p.tideLength;
      this.seaLevel = Math.sin(tp * Math.PI * 2) * this.p.tideRange;
      this.tidePhase = tp;
      this.sun = this.p.dark ? 0 : Math.max(0, Math.sin((this.dayPhase - 0.25) * Math.PI * 2));
    }

    // Stream function from slowly morphing noise, damped near the shore, so
    // the flow swirls and never runs into land.
    _updateFlow() {
      const { cols, rows, eddyScale, currentSpeed, eddyChange, tidalFlow } = this.p;
      const psi = this._tmp;
      const blend = 0.5 - 0.5 * Math.cos((this.t / eddyChange) * Math.PI);
      const shift = this.t / eddyChange;
      const tide = Math.cos(this.tidePhase * Math.PI * 2);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = this.idx(x, y);
          const d = this.seaLevel - this.ground[i];
          const damp = d <= 0 ? 0 : Math.min(1, d / 1.5);
          const a = this._noiseA(x / eddyScale + shift * 0.3, y / eddyScale);
          const b = this._noiseB(x / eddyScale, y / eddyScale + shift * 0.3);
          // Tidal flow runs along the coast and reverses with the tide.
          const along = tidalFlow * tide * y;
          psi[i] = ((a * (1 - blend) + b * blend) * currentSpeed * eddyScale / Math.PI + along) * damp;
        }
      }
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = this.idx(x, y);
          if (!this.connected[i]) { this.vx[i] = 0; this.vy[i] = 0; continue; }
          const yu = Math.max(0, y - 1), yd = Math.min(rows - 1, y + 1);
          const xl = Math.max(0, x - 1), xr = Math.min(cols - 1, x + 1);
          // psi carries water (depth times speed), so the same push moves
          // shallow water faster and deep water slower, and no cell gains or
          // loses water overall.
          const h = 3 / Math.max(0.5, this.seaLevel - this.ground[i]);
          let u = (psi[this.idx(x, yd)] - psi[this.idx(x, yu)]) / (yd - yu) * h;
          let v = -(psi[this.idx(xr, y)] - psi[this.idx(xl, y)]) / (xr - xl) * h;
          const sp = Math.hypot(u, v);
          if (sp > 0.8) { u *= 0.8 / sp; v *= 0.8 / sp; }
          this.vx[i] = u; this.vy[i] = v;
        }
      }
    }

    step() {
      this.t++;
      this._updateSea();
      this._updateWater(false);
      if (this.t % 4 === 0) this._updateFlow();
      this._updateHeat();
      for (const f of this.fields) this.transport(f);
    }

    // Open sea is every cell below sea level that water can reach from the
    // deep edge. Everything else keeps its own water surface, which sinks as
    // the pool dries; dissolved fields get more concentrated as it shrinks.
    _updateWater(init) {
      const { n, cols, rows } = this;
      const con = this.connected, q = this._queue, sea = this.seaLevel - 0.012, g = this.ground;
      con.fill(0);
      let head = 0, tail = 0;
      for (let x = 0; x < cols; x++) {
        const i = (rows - 1) * cols + x;
        if (g[i] < sea) { con[i] = 1; q[tail++] = i; }
      }
      while (head < tail) {
        const i = q[head++], x = i % cols;
        const nb = [x > 0 ? i - 1 : -1, x < cols - 1 ? i + 1 : -1, i - cols, i + cols];
        for (const j of nb) {
          if (j < 0 || j >= n || con[j] || g[j] >= sea) continue;
          con[j] = 1; q[tail++] = j;
        }
      }
      const { evaporation, lightDepth } = this.p;
      for (let i = 0; i < n; i++) {
        const before = this.water[i];
        if (con[i]) this.surface[i] = this.seaLevel;
        else if (before > 0) {
          const dry = evaporation * (0.2 + this.sun) * (1 + Math.max(0, this.temp[i] - 20) / 20);
          this.surface[i] -= dry * Math.max(before, 0.05);
        }
        let after = this.surface[i] - g[i];
        if (after < 0.002) { after = 0; if (!con[i]) this.surface[i] = g[i]; }
        // Fields hold concentrations in water. A cell that dries out keeps
        // what was dissolved as a crust (stored as an amount); the next flood
        // dissolves it again.
        if (!init && after !== before) {
          const wb = before > 0.01, wa = after > 0.01;
          const k = wb && wa ? before / after : wb ? before : wa ? 1 / after : 1;
          if (k !== 1) {
            for (const f of this.fields) {
              const v = f.v[i] * k;
              f.v[i] = v > f.max ? f.max : v;
            }
          }
        }
        this.water[i] = after;
        this.light[i] = this.sun * Math.exp(-after / lightDepth);
      }
    }

    _updateHeat() {
      const T = this.temp, { n } = this;
      const { ventHeat: vh } = this.p;
      for (let i = 0; i < n; i++) {
        const w = this.water[i];
        // Ambient: cold deep water, sun-warmed shallows and land.
        const shallow = Math.exp(-w / 1.5);
        const target = 4 + 10 * Math.exp(-w / 4) + 18 * this.sun * shallow + (w <= 0 ? 6 * this.sun : 0);
        T[i] += (target - T[i]) * 0.01 + this.ventHeat[i] * vh * (w > 0 ? 1 : 0);
        if (T[i] > 99) T[i] = 99;
      }
      this._moveField(T, this.p.heatDiffusion, 0);
    }

    // Carry a field with the currents, then spread it, only through open
    // water. Cut-off pools keep their contents.
    transport(f) { this._moveField(f.v, f.diffusion, f.max); }

    _moveField(v, D, max) {
      const { cols, rows, n } = this;
      const out = this._tmp2, con = this.connected, vx = this.vx, vy = this.vy, wat = this.water;
      // Semi-Lagrangian advection.
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          if (!con[i]) { out[i] = v[i]; continue; }
          let sx = x - vx[i], sy = y - vy[i];
          sx = sx < 0 ? 0 : sx > cols - 1.001 ? cols - 1.001 : sx;
          sy = sy < 0 ? 0 : sy > rows - 1.001 ? rows - 1.001 : sy;
          const x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0;
          const i00 = y0 * cols + x0, i10 = i00 + 1, i01 = i00 + cols, i11 = i01 + 1;
          // Sample only from open water, so land never leaks into the sea.
          let s = 0, w = 0, ww;
          ww = (1 - fx) * (1 - fy); if (con[i00]) { s += v[i00] * ww; w += ww; }
          ww = fx * (1 - fy); if (con[i10]) { s += v[i10] * ww; w += ww; }
          ww = (1 - fx) * fy; if (con[i01]) { s += v[i01] * ww; w += ww; }
          ww = fx * fy; if (con[i11]) { s += v[i11] * ww; w += ww; }
          out[i] = w > 1e-6 ? s / w : v[i];
        }
      }
      // Diffusion with no flux into land or cut-off cells.
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const c = out[i];
          if (!con[i]) { v[i] = c; continue; }
          // Flux through each face scales with the shallower side's depth,
          // so what leaves one cell is exactly what enters the other.
          const wi = wat[i];
          let flux = 0, j;
          j = i - 1; if (x > 0 && con[j]) flux += (out[j] - c) * (wat[j] < wi ? wat[j] : wi);
          j = i + 1; if (x < cols - 1 && con[j]) flux += (out[j] - c) * (wat[j] < wi ? wat[j] : wi);
          j = i - cols; if (y > 0 && con[j]) flux += (out[j] - c) * (wat[j] < wi ? wat[j] : wi);
          j = i + cols; if (y < rows - 1 && con[j]) flux += (out[j] - c) * (wat[j] < wi ? wat[j] : wi);
          let r = c + D * flux / wi;
          if (r < 0) r = 0;
          if (max && r > max) r = max;
          v[i] = r;
        }
      }
    }

    // Read helpers for anything living in this world (continuous coordinates
    // in cells).
    cellAt(x, y) {
      const xi = Math.max(0, Math.min(this.cols - 1, x | 0));
      const yi = Math.max(0, Math.min(this.rows - 1, y | 0));
      return yi * this.cols + xi;
    }
    flowAt(x, y) { const i = this.cellAt(x, y); return [this.vx[i], this.vy[i]]; }
    isWet(x, y) { return this.water[this.cellAt(x, y)] > 0.01; }
    kind(i) {
      if (this.connected[i]) return this.water[i] > 2 ? 'deep sea' : 'shallow sea';
      if (this.water[i] > 0.01) return 'tide pool';
      return this.ground[i] < this.p.tideRange ? 'beach' : 'land';
    }
  }

  const api = { Earth, EARTH_DEFAULTS, mulberry32, makeNoise };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EarthSim = api;
})(typeof self !== 'undefined' ? self : this);
