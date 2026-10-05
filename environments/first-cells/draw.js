// Drawing cells from lib/life.js on top of an Early Earth map
// (environments/early-earth/draw.js). Shared by the First cells page and the
// World Viewer. Call after EarthDraw.drawWorld, with the same camera.
(function (root) {
  'use strict';

  const ROLE_RGB = ['#8fe3a8', '#6cc4ee', '#f2c14e', '#ee6fb0', '#b59cff'];
  const PREDATOR_RGB = '#e8553f';

  // cam: { cx, cy, zoom }; w, h: canvas size in CSS pixels.
  function drawCells(ctx, L, w, h, cam, opts) {
    const o = opts || {}, e = L.earth;
    const k = Math.min(w / e.cols, h / e.rows) * cam.zoom, R = L.p.radius;
    ctx.save();
    ctx.translate(w / 2 - cam.cx * k, h / 2 - cam.cy * k);
    ctx.scale(k, k);
    // Only draw what is on screen.
    const x0 = cam.cx - w / 2 / k - 1, x1 = cam.cx + w / 2 / k + 1, y0 = cam.cy - h / 2 / k - 1, y1 = cam.cy + h / 2 / k + 1;
    const vis = L.cells.filter((c) => c.x > x0 && c.x < x1 && c.y > y0 && c.y < y1);
    const r = Math.max(R, 2.6 / k);
    const close = k > 30, t = e.t;
    // Up close, a cell shows its motor (a beating flagellum, as long as its
    // motor gene is strong) and its eyespot (a red dot, as big as its gene).
    if (close) {
      ctx.strokeStyle = 'rgba(230,245,238,0.75)'; ctx.lineWidth = Math.max(0.02, 1.2 / k);
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
    // Bonds first, so cells sit on top of them.
    if (k > 6) {
      ctx.strokeStyle = 'rgba(240,250,245,0.5)'; ctx.lineWidth = Math.max(0.05, 1 / k);
      ctx.beginPath();
      for (const c of vis) for (const id of c.bonds) {
        if (id < c.id) continue;
        const n = L.byId.get(id); if (!n) continue;
        ctx.moveTo(c.x, c.y); ctx.lineTo(n.x, n.y);
      }
      ctx.stroke();
    }
    // Cells, one colour per role (batched).
    for (let role = 0; role < ROLE_RGB.length; role++) {
      ctx.fillStyle = ROLE_RGB[role];
      ctx.beginPath();
      for (const c of vis) if (c.role === role) { ctx.moveTo(c.x + r, c.y); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); }
      ctx.fill();
    }
    if (close) {
      ctx.fillStyle = '#d0302a';
      ctx.beginPath();
      for (const c of vis) {
        if (c.g.eyespot < 0.03) continue;
        const er = R * (0.12 + 0.3 * c.g.eyespot), ex = c.x + Math.cos(c.heading) * R * 0.55, ey = c.y + Math.sin(c.heading) * R * 0.55;
        ctx.moveTo(ex + er, ey); ctx.arc(ex, ey, er, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    // Nerve signals: a cell that just fired flashes.
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    for (const c of vis) if (c.refractory > 3) { ctx.moveTo(c.x + r * 0.6, c.y); ctx.arc(c.x, c.y, r * 0.6, 0, Math.PI * 2); }
    ctx.fill();
    // Predators: big engulfing cells.
    const pr = Math.max(R * 2.6, 3.6 / k);
    ctx.fillStyle = PREDATOR_RGB; ctx.strokeStyle = 'rgba(255,220,210,0.8)'; ctx.lineWidth = Math.max(0.05, 1 / k);
    for (const hu of L.predators) {
      ctx.globalAlpha = hu.digest > 0 ? 0.55 : 0.9;
      ctx.beginPath(); ctx.arc(hu.x, hu.y, pr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // The selected cell, and its clump.
    const sel = o.selected;
    if (sel && !sel.dead) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 / k;
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

  root.LifeDraw = { drawCells, ROLE_RGB, PREDATOR_RGB };
})(typeof self !== 'undefined' ? self : this);
