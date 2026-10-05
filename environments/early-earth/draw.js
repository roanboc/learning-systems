// Drawing for Early Earth: the map, its layers, currents and bubbles.
// Shared by the Early Earth page and the catalogue preview.
(function (root) {
  'use strict';

  // Colour of each chemical when it tints the water (RGB 0..255).
  const CHEM_RGB = {
    energy: [236, 200, 70],
    blocks: [80, 210, 160],
    chains: [240, 140, 80],
    copiers: [235, 80, 170],
    oils: [245, 235, 200],
    raw: [150, 170, 190],
  };
  // How much of each chemical gives a clearly visible tint.
  const CHEM_SCALE = { raw: 2, energy: 0.3, blocks: 0.6, chains: 0.3, copiers: 0.3, oils: 0.6 };

  const LAYERS = [
    { key: 'nature', label: 'Nature' },
    { key: 'mix', label: 'Chemicals' },
    { key: 'energy', label: 'Energy' },
    { key: 'blocks', label: 'Blocks' },
    { key: 'chains', label: 'Chains' },
    { key: 'copiers', label: 'Copiers' },
    { key: 'oils', label: 'Oils' },
    { key: 'light', label: 'Sunlight' },
    { key: 'temp', label: 'Heat' },
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }

  // A sequential ramp from near-black through teal to pale yellow.
  function ramp(t) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const stops = [[10, 16, 24], [30, 70, 110], [40, 140, 140], [150, 200, 110], [250, 240, 180]];
    const x = t * (stops.length - 1), i = Math.min(stops.length - 2, x | 0), f = x - i;
    const a = stops[i], b = stops[i + 1];
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
  }
  function heat(T) {
    const t = Math.max(0, Math.min(1, (T - 0) / 80));
    const stops = [[20, 40, 110], [40, 120, 180], [220, 210, 160], [230, 120, 50], [180, 30, 30]];
    const x = t * (stops.length - 1), i = Math.min(stops.length - 2, x | 0), f = x - i;
    const a = stops[i], b = stops[i + 1];
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
  }

  class MapPainter {
    constructor(world) {
      this.world = world;
      const e = world.earth;
      this.canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(e.cols, e.rows) : Object.assign(document.createElement('canvas'), { width: e.cols, height: e.rows });
      this.ctx = this.canvas.getContext('2d');
      this.img = this.ctx.createImageData(e.cols, e.rows);
      this.tracers = [];
      this._rng = 12345;
    }

    _rand() { this._rng = (this._rng * 16807) % 2147483647; return this._rng / 2147483647; }

    // Paint the grid into the small offscreen canvas.
    paint(layer) {
      const w = this.world, e = w.earth, d = this.img.data, n = e.n;
      const night = 0.38 + 0.62 * e.sun;
      for (let i = 0; i < n; i++) {
        const wat = e.water[i], wet = wat > 0.01;
        let r, g, b;
        if (layer === 'light') { const c = ramp(e.light[i]); r = c[0]; g = c[1]; b = c[2]; }
        else if (layer === 'temp') { const c = heat(e.temp[i]); r = c[0]; g = c[1]; b = c[2]; if (!wet) { r *= 0.6; g *= 0.6; b *= 0.6; } }
        else if (layer !== 'nature' && layer !== 'mix') {
          if (!wet) { const v = 40 + e.ground[i] * 6; r = v; g = v; b = v; }
          else { const v = w.f[layer][i]; const c = ramp(v / (v + CHEM_SCALE[layer])); r = c[0]; g = c[1]; b = c[2]; }
        } else {
          if (!wet) {
            // Bare young rock and wet sand; no plants yet.
            const h = e.ground[i];
            if (h < e.p.tideRange + 0.3) { r = 150; g = 135; b = 105; }
            else { const k = Math.min(1, h / 4); r = lerp(105, 70, k); g = lerp(95, 62, k); b = lerp(85, 58, k); }
            // Salt and chemical crust left by dried pools.
            const crust = w.f.chains[i] + w.f.blocks[i] + w.f.copiers[i];
            if (crust > 0.002) { const k = Math.min(0.6, crust * 40); r = lerp(r, 225, k); g = lerp(g, 215, k); b = lerp(b, 190, k); }
          } else {
            const deep = Math.min(1, wat / 7);
            const pool = !e.connected[i];
            r = lerp(pool ? 60 : 45, 8, deep); g = lerp(pool ? 140 : 125, 34, deep); b = lerp(pool ? 130 : 140, 62, deep);
            const strength = layer === 'mix' ? 1 : 0.75;
            if (layer === 'mix') { r *= 0.45; g *= 0.45; b *= 0.45; }
            for (const k of ['energy', 'blocks', 'chains', 'oils', 'copiers']) {
              const v = w.f[k][i];
              if (v < 1e-4) continue;
              const a = strength * v / (v + CHEM_SCALE[k]);
              const c = CHEM_RGB[k];
              r = lerp(r, c[0], a); g = lerp(g, c[1], a); b = lerp(b, c[2], a);
            }
          }
          if (layer === 'nature') { r *= night; g *= night; b *= lerp(1.15, 1, e.sun) * night; }
        }
        const o = i * 4;
        d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
      }
      this.ctx.putImageData(this.img, 0, 0);
    }

    // Small drifting specks that show the currents mixing the water.
    moveTracers(steps, count) {
      const e = this.world.earth;
      while (this.tracers.length < count) this.tracers.push(this._spawn());
      for (const p of this.tracers) {
        const i = e.cellAt(p.x, p.y);
        p.px = p.x; p.py = p.y;
        p.x += e.vx[i] * steps; p.y += e.vy[i] * steps;
        p.age += steps;
        const j = e.cellAt(p.x, p.y);
        if (!e.connected[j] || p.age > p.life || p.x < 0 || p.y < 0 || p.x >= e.cols || p.y >= e.rows) Object.assign(p, this._spawn());
      }
    }
    _spawn() {
      const e = this.world.earth;
      for (let k = 0; k < 30; k++) {
        const x = this._rand() * e.cols, y = this._rand() * e.rows;
        if (e.connected[e.cellAt(x, y)]) return { x, y, px: x, py: y, age: 0, life: 200 + this._rand() * 400 };
      }
      return { x: 0, y: e.rows - 1, px: 0, py: e.rows - 1, age: 0, life: 10 };
    }
  }

  // Draw the world into ctx (w × h pixels) through a camera:
  // { cx, cy } is the cell at the centre of the view, zoom 1 shows the whole map.
  function drawWorld(ctx, painter, w, h, cam, opts) {
    const world = painter.world, e = world.earth;
    const o = opts || {};
    const layer = o.layer || 'nature';
    painter.paint(layer);
    const base = Math.min(w / e.cols, h / e.rows);
    const s = base * cam.zoom;
    ctx.save();
    ctx.fillStyle = o.background || '#0b100e';
    ctx.fillRect(0, 0, w, h);
    ctx.translate(w / 2 - cam.cx * s, h / 2 - cam.cy * s);
    ctx.scale(s, s);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(painter.canvas, 0, 0);

    // Vents: a warm glow on the floor.
    for (const v of e.vents) {
      const g = ctx.createRadialGradient(v.x + 0.5, v.y + 0.5, 0, v.x + 0.5, v.y + 0.5, 4);
      g.addColorStop(0, 'rgba(255,150,60,0.55)');
      g.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(v.x + 0.5, v.y + 0.5, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Currents.
    if (o.tracers !== false && (layer === 'nature' || layer === 'mix')) {
      ctx.strokeStyle = 'rgba(220,240,255,0.35)';
      ctx.lineWidth = 1.2 / s;
      ctx.beginPath();
      for (const p of painter.tracers) {
        if (Math.abs(p.x - p.px) > 3 || Math.abs(p.y - p.py) > 3) continue;
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x + (p.x - p.px) * 2, p.y + (p.y - p.py) * 2);
      }
      ctx.stroke();
    }

    // Up close, the water dissolves into molecules jiggling in place.
    if (s > 22 && (layer === 'nature' || layer === 'mix')) drawMolecules(ctx, world, w, h, cam, s);

    // Bubbles.
    const sel = o.selected;
    for (const b of world.bubbles) {
      const r = Math.max(0.25 + Math.sqrt(b.lipid) * 0.3, 2.5 / s);
      const c = b.copiers > 0.05 ? Math.min(1, b.copiers / 0.6) : 0;
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fillStyle = c > 0 ? `rgba(235,80,170,${0.35 + 0.55 * c})` : 'rgba(245,235,200,0.18)';
      ctx.fill();
      ctx.lineWidth = Math.max(0.08, 1 / s);
      ctx.strokeStyle = 'rgba(250,240,210,0.9)';
      ctx.stroke();
    }
    if (sel) {
      ctx.beginPath(); ctx.arc(sel.x, sel.y, 1.6, 0, Math.PI * 2);
      ctx.lineWidth = 2 / s; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
    if (o.mark) {
      ctx.beginPath(); ctx.arc(o.mark.x + 0.5, o.mark.y + 0.5, 2.5, 0, Math.PI * 2);
      ctx.lineWidth = 1.5 / s; ctx.strokeStyle = '#ffffff'; ctx.setLineDash([3 / s, 3 / s]); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function hash(a, b) {
    let x = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
    x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d); x ^= x >>> 12;
    return (x >>> 0) / 4294967296;
  }
  const MOLECULES = [
    { key: 'energy', per: 0.08, max: 6, shape: 'dot' },
    { key: 'blocks', per: 0.1, max: 6, shape: 'dot' },
    { key: 'chains', per: 0.04, max: 4, shape: 'chain' },
    { key: 'copiers', per: 0.05, max: 4, shape: 'copier' },
    { key: 'oils', per: 0.1, max: 5, shape: 'oil' },
  ];
  function drawMolecules(ctx, world, w, h, cam, s) {
    const e = world.earth, t = e.t * 0.15;
    const x0 = Math.max(0, Math.floor(cam.cx - w / 2 / s)), x1 = Math.min(e.cols - 1, Math.ceil(cam.cx + w / 2 / s));
    const y0 = Math.max(0, Math.floor(cam.cy - h / 2 / s)), y1 = Math.min(e.rows - 1, Math.ceil(cam.cy + h / 2 / s));
    const lw = 1.2 / s;
    MOLECULES.forEach((m, mi) => {
      const c = CHEM_RGB[m.key], f = world.f[m.key];
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = lw * 1.5;
      ctx.beginPath();
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const i = y * e.cols + x;
          if (e.water[i] <= 0.01) continue;
          const k = Math.min(m.max, Math.floor(f[i] / m.per + hash(i, mi)));
          for (let q = 0; q < k; q++) {
            const hh = hash(i * 7 + q, mi * 31 + 1), hv = hash(i * 13 + q, mi * 17 + 5);
            const px = x + 0.1 + 0.8 * hh + 0.06 * Math.sin(t * (1 + hv) + hh * 40);
            const py = y + 0.1 + 0.8 * hv + 0.06 * Math.cos(t * (1 + hh) + hv * 40);
            const a = hh * Math.PI * 2 + t * 0.2;
            if (m.shape === 'dot') { ctx.moveTo(px + 0.035, py); ctx.arc(px, py, 0.035, 0, Math.PI * 2); }
            else if (m.shape === 'chain') {
              for (let z = 0; z < 4; z++) { const zx = px + Math.cos(a + z * 0.5) * 0.06 * z, zy = py + Math.sin(a + z * 0.5) * 0.06 * z; ctx.moveTo(zx + 0.03, zy); ctx.arc(zx, zy, 0.03, 0, Math.PI * 2); }
            } else if (m.shape === 'copier') {
              for (let z = 0; z < 2; z++) { const zx = px + Math.cos(a) * 0.07 * z, zy = py + Math.sin(a) * 0.07 * z; ctx.moveTo(zx + 0.045, zy); ctx.arc(zx, zy, 0.045, 0, Math.PI * 2); }
            } else { ctx.moveTo(px + 0.05, py); ctx.arc(px, py, 0.05, 0, Math.PI * 2); }
          }
        }
      }
      if (m.shape === 'oil') ctx.stroke(); else ctx.fill();
    });
  }

  // Screen point → map cell coordinates.
  function toCell(px, py, w, h, cam, e) {
    const s = Math.min(w / e.cols, h / e.rows) * cam.zoom;
    return { x: (px - w / 2) / s + cam.cx, y: (py - h / 2) / s + cam.cy };
  }

  root.EarthDraw = { MapPainter, drawWorld, toCell, LAYERS, CHEM_RGB };
})(typeof self !== 'undefined' ? self : this);
