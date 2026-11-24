// Film paint: the life pages' coasts drawn in film 1's light notebook look
// (pale watercolour sea, sand and ochre rock, ink rims, the film's level colours).
// Opt-in per page (<body data-paint="film">, environments/first-cells/app.js) and
// swappable with the classic look at any time: it has the same calls as
// EarthDraw.drawWorld and LifeDraw.drawCells and only reads the world, so the
// simulation runs exactly the same in either paint.
(function (root) {
  'use strict';

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const P = {
    paper: '#f5eedc', ink: '#2c2723',
    sea1: hex('#d7efe6'), sea2: hex('#a9ddd3'), sea3: hex('#76c6c0'), sea4: hex('#3f9fa8'),
    pool: hex('#bfe6d6'), sand: hex('#efdcae'), ochre: hex('#e2bf7f'), rock: hex('#b59a86'),
    crust: hex('#f6ecd2'), night: hex('#4a5f7a'),
    gold: hex('#f3ae3d'), blocks: hex('#4fae63'), chains: hex('#e9634f'), copiers: hex('#c0368a'), oils: hex('#fbf7ea'),
    sharer: hex('#4fae63'), cheat: hex('#8b72d6'),
    hunter: '#e9634f', hunterRim: '#9c3a2f', contract: '#f3ae3d',
  };
  // Roles in Bodies, in the film's palette (teal cells, gold, coral, violet, green).
  const ROLE = ['#7cc6a0', '#5aa9c9', '#f3ae3d', '#e98a9a', '#a593e0'];
  const SCALE = { energy: 0.3, blocks: 0.6, chains: 0.3, copiers: 0.3, oils: 0.6 };
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

  // Same shape as EarthDraw.MapPainter, so the page can keep one painter per world.
  class MapPainter {
    constructor(world) {
      this.world = world;
      const e = world.earth;
      this.canvas = document.createElement('canvas');
      this.canvas.width = e.cols; this.canvas.height = e.rows;
      this.ctx = this.canvas.getContext('2d');
      this.img = this.ctx.createImageData(e.cols, e.rows);
      this.helper = e.fieldByName && e.fieldByName.helper ? e.fieldByName.helper.v : null;
    }
    // The nature view only: the science layers stay in the classic paint.
    paint() {
      const w = this.world, e = w.earth, f = w.f, d = this.img.data, help = this.helper;
      const dark = 0.22 * (1 - e.sun);
      for (let i = 0; i < e.n; i++) {
        const wat = e.water[i];
        let c;
        if (wat > 0.01) {
          const deep = Math.min(1, wat / 7);
          c = !e.connected[i] ? mix(P.pool, P.sea2, deep)
            : deep < 0.33 ? mix(P.sea1, P.sea2, deep / 0.33)
            : deep < 0.66 ? mix(P.sea2, P.sea3, (deep - 0.33) / 0.33) : mix(P.sea3, P.sea4, (deep - 0.66) / 0.34);
          // Food in the water, as light washes; the helper molecule as gold.
          for (const k of ['energy', 'blocks', 'chains', 'copiers', 'oils']) {
            const v = f[k][i];
            if (v > 1e-4) c = mix(c, k === 'energy' ? P.gold : P[k], 0.5 * v / (v + SCALE[k]));
          }
          if (help) { const v = help[i]; if (v > 1e-4) c = mix(c, P.gold, 0.85 * v / (v + 0.3)); }
        } else {
          const h = e.ground[i];
          c = h < e.p.tideRange + 0.3 ? P.sand : mix(P.ochre, P.rock, Math.min(1, h / 5));
          const crust = f.chains[i] + f.blocks[i] + f.copiers[i];
          if (crust > 0.002) c = mix(c, P.crust, Math.min(0.5, crust * 40));
        }
        // Night: a soft blue-grey wash, never black.
        if (dark > 0.01) c = mix(c, P.night, dark);
        const o = i * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
      this.ctx.putImageData(this.img, 0, 0);
    }
  }

  // A sheet of soft blotches and specks, laid over the map like watercolour paper.
  let grain = null;
  function paper() {
    if (grain) return grain;
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 512, 512);
    let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    // Each blotch is also drawn across the edges, so the sheet tiles without seams.
    for (let k = 0; k < 220; k++) {
      const x = r() * 512, y = r() * 512, rad = 20 + r() * 70, a = 0.02 + r() * 0.035;
      for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) {
        const cx = x + dx, cy = y + dy;
        if (cx + rad < 0 || cx - rad > 512 || cy + rad < 0 || cy - rad > 512) continue;
        const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
        gr.addColorStop(0, `rgba(150,120,90,${a})`);
        gr.addColorStop(1, 'rgba(150,120,90,0)');
        g.fillStyle = gr; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      }
    }
    for (let k = 0; k < 7000; k++) { g.fillStyle = `rgba(90,70,50,${0.03 + r() * 0.04})`; g.fillRect(r() * 512 | 0, r() * 512 | 0, 1, 1); }
    return (grain = c);
  }

  // Same call as EarthDraw.drawWorld. Other layers than nature are passed to it.
  function drawWorld(ctx, painter, w, h, cam, opts) {
    const o = opts || {}, layer = o.layer || 'nature';
    if (layer !== 'nature') {
      if (!painter.classic) painter.classic = new root.EarthDraw.MapPainter(painter.world);
      return root.EarthDraw.drawWorld(ctx, painter.classic, w, h, cam, o);
    }
    const world = painter.world, e = world.earth;
    painter.paint();
    const s = Math.min(w / e.cols, h / e.rows) * cam.zoom;
    ctx.save();
    ctx.fillStyle = P.paper; ctx.fillRect(0, 0, w, h);
    ctx.translate(w / 2 - cam.cx * s, h / 2 - cam.cy * s);
    ctx.scale(s, s);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    // Soften the grid into washes: a blur of about half a map cell, where the browser can.
    if ('filter' in ctx) ctx.filter = 'blur(' + Math.min(16, s * 0.9).toFixed(1) + 'px)';
    ctx.drawImage(painter.canvas, 0, 0);
    if ('filter' in ctx) ctx.filter = 'none';
    // Vents: a warm gold glow on the floor.
    for (const v of e.vents) {
      const g = ctx.createRadialGradient(v.x + 0.5, v.y + 0.5, 0, v.x + 0.5, v.y + 0.5, 4);
      g.addColorStop(0, 'rgba(243,174,61,0.6)'); g.addColorStop(1, 'rgba(243,174,61,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(v.x + 0.5, v.y + 0.5, 4, 0, Math.PI * 2); ctx.fill();
    }
    // Currents: short pale strokes.
    if (o.tracers !== false && painter.tracers) {
      ctx.strokeStyle = 'rgba(255,252,240,0.55)'; ctx.lineWidth = 1.2 / s; ctx.lineCap = 'round';
      ctx.beginPath();
      for (const p of painter.tracers) {
        if (Math.abs(p.x - p.px) > 3 || Math.abs(p.y - p.py) > 3) continue;
        ctx.moveTo(p.px, p.py); ctx.lineTo(p.x + (p.x - p.px) * 2, p.y + (p.y - p.py) * 2);
      }
      ctx.stroke();
    }
    // Bubbles: pale oil drops with an ink rim.
    ctx.lineWidth = 0.8 / s; ctx.strokeStyle = 'rgba(44,39,35,0.45)'; ctx.fillStyle = 'rgba(251,247,234,0.5)';
    for (const b of world.bubbles) {
      const r = Math.max(0.25 + Math.sqrt(b.lipid) * 0.3, 2.2 / s);
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (o.mark) {
      ctx.beginPath(); ctx.arc(o.mark.x + 0.5, o.mark.y + 0.5, 2.5, 0, Math.PI * 2);
      ctx.lineWidth = 1.5 / s; ctx.strokeStyle = P.ink; ctx.setLineDash([3 / s, 3 / s]); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
    // Paper over the map; the beings are drawn after, so they stay crisp.
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = ctx.createPattern(paper(), 'repeat');
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Same call as LifeDraw.drawCells.
  function drawCells(ctx, L, w, h, cam, opts) {
    const o = opts || {}, e = L.earth;
    const k = Math.min(w / e.cols, h / e.rows) * cam.zoom, R = L.p.radius;
    ctx.save();
    ctx.translate(w / 2 - cam.cx * k, h / 2 - cam.cy * k);
    ctx.scale(k, k);
    const x0 = cam.cx - w / 2 / k - 1, x1 = cam.cx + w / 2 / k + 1, y0 = cam.cy - h / 2 / k - 1, y1 = cam.cy + h / 2 / k + 1;
    const vis = L.cells.filter((c) => c.x > x0 && c.x < x1 && c.y > y0 && c.y < y1);
    const r = Math.max(R, 2.8 / k), close = k > 30, t = e.t;
    ctx.lineCap = 'round';
    // Up close: the motor as an ink flagellum.
    if (close) {
      ctx.strokeStyle = 'rgba(44,39,35,0.7)'; ctx.lineWidth = Math.max(0.02, 1.1 / k);
      ctx.beginPath();
      for (const c of vis) {
        if (c.clumpSize > 1 || c.g.speed < 0.01) continue;
        const len = R * (0.8 + c.g.speed * 9), hx = Math.cos(c.heading), hy = Math.sin(c.heading);
        const beat = c.speedNow > 0 ? Math.sin(t * 1.3 + c.id) : 0.2;
        const bx = c.x - hx * R, by = c.y - hy * R;
        const mx = bx - hx * len * 0.5 - hy * len * 0.25 * beat, my = by - hy * len * 0.5 + hx * len * 0.25 * beat;
        const ex = bx - hx * len + hy * len * 0.2 * beat, ey = by - hy * len - hx * len * 0.2 * beat;
        ctx.moveTo(bx, by); ctx.quadraticCurveTo(mx, my, ex, ey);
      }
      ctx.stroke();
    }
    // Bonds: thin ink threads.
    if (k > 6) {
      ctx.strokeStyle = 'rgba(44,39,35,0.55)'; ctx.lineWidth = Math.max(0.05, 1 / k);
      ctx.beginPath();
      for (const c of vis) for (const id of c.bonds) {
        if (id < c.id) continue;
        const n = L.byId.get(id); if (n) { ctx.moveTo(c.x, c.y); ctx.lineTo(n.x, n.y); }
      }
      ctx.stroke();
    }
    // Cells: with sharers and cheats, green for sharers and violet for cheats;
    // otherwise one colour per role. A fine ink rim and a paper highlight.
    const colour = L.p.goods
      ? (c) => rgb(mix(P.cheat, P.sharer, Math.max(0, Math.min(1, c.g.helper / 0.6))))
      : (c) => ROLE[c.role] || ROLE[0];
    ctx.lineWidth = Math.max(0.04, 0.9 / k); ctx.strokeStyle = 'rgba(44,39,35,0.8)';
    for (const c of vis) {
      const rc = c.contracting ? r * 0.82 : r;
      ctx.fillStyle = c.contracting ? P.contract : colour(c);
      ctx.beginPath(); ctx.arc(c.x, c.y, rc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,250,236,0.55)';
    ctx.beginPath();
    for (const c of vis) { const q = r * 0.3; ctx.moveTo(c.x - r * 0.32 + q, c.y - r * 0.32); ctx.arc(c.x - r * 0.32, c.y - r * 0.32, q, 0, Math.PI * 2); }
    ctx.fill();
    if (close) {
      ctx.fillStyle = '#c83a2e';
      ctx.beginPath();
      for (const c of vis) {
        if (c.g.eyespot < 0.03) continue;
        const er = R * (0.12 + 0.3 * c.g.eyespot), ex = c.x + Math.cos(c.heading) * R * 0.55, ey = c.y + Math.sin(c.heading) * R * 0.55;
        ctx.moveTo(ex + er, ey); ctx.arc(ex, ey, er, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    // Nerve signals: a cell that just fired shows a gold core.
    ctx.fillStyle = 'rgba(243,174,61,0.95)';
    ctx.beginPath();
    for (const c of vis) if (c.refractory > 3) { ctx.moveTo(c.x + r * 0.5, c.y); ctx.arc(c.x, c.y, r * 0.5, 0, Math.PI * 2); }
    ctx.fill();
    // Hunters: big coral cells with a wobbly darker rim.
    const pr = Math.max(R * 2.6, 3.8 / k);
    ctx.fillStyle = P.hunter; ctx.strokeStyle = P.hunterRim; ctx.lineWidth = Math.max(0.06, 1.4 / k);
    for (const hu of L.predators) {
      ctx.globalAlpha = hu.digest > 0 ? 0.6 : 0.95;
      ctx.beginPath();
      for (let a = 0; a <= 16; a++) {
        const th = (a / 16) * Math.PI * 2, rr = pr * (1 + 0.1 * Math.sin(th * 3 + (hu.id || 0) + t * 0.05));
        const x = hu.x + Math.cos(th) * rr, y = hu.y + Math.sin(th) * rr;
        if (a) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // The selected cell, and its clump, ringed in ink.
    const sel = o.selected;
    if (sel && !sel.dead) {
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6 / k;
      if (sel.clumpSize > 1) {
        let mx = 0, my = 0, far = 0;
        const members = L.clumpOf(sel);
        for (const m of members) { mx += m.x; my += m.y; }
        mx /= members.length; my /= members.length;
        for (const m of members) far = Math.max(far, Math.hypot(m.x - mx, m.y - my));
        ctx.setLineDash([4 / k, 3 / k]);
        ctx.beginPath(); ctx.arc(mx, my, far + R * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.beginPath(); ctx.arc(sel.x, sel.y, r * 1.8, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  root.FilmPaint = { MapPainter, drawWorld, drawCells, PALETTE: P };
})(window);
