// Drawing for the Tissue Lab: the tissue itself (with optional chemical field
// overlays), and a small line chart used on the bench and in the explorer.
// Colours come from the page's CSS tokens through a colours() function.
(function (root) {
  'use strict';

  const TAU = Math.PI * 2;

  // Field overlays: key on the Tissue, label, colour ramp end, scale.
  const FIELDS = [
    { key: null, label: 'None' },
    { key: 'glucose', label: 'Glucose', rgb: [224, 122, 98], scale: 0.6,
      note: 'Glucose from the blood vessels. Supply rises where tissue is active.' },
    { key: 'lactate', label: 'Lactate', rgb: [212, 173, 69], scale: 0.05,
      note: 'Lactate handed out by astrocytes to the active neurons in their territory.' },
    { key: 'bdnf', label: 'Growth factor', rgb: [92, 196, 109], scale: 0.05,
      note: 'BDNF, released where inputs fire just before a cell does, and taken up by active cells. Supply is limited.' },
    { key: 'act', label: 'Activity', rgb: [230, 236, 232], scale: 2,
      note: 'Recent spikes, blurred, like glutamate spilling out of busy synapses.' },
    { key: 'tagField', label: 'Eat-me signal', rgb: [232, 135, 92], scale: 2,
      note: 'Complement tags on unused synapses, and debris from dead cells. Microglia follow it.' },
  ];

  const fieldCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

  function drawField(ctx, tissue, field, W, H) {
    const G = tissue.G, f = tissue[field.key];
    if (fieldCanvas.width !== G) { fieldCanvas.width = G; fieldCanvas.height = G; }
    const fctx = fieldCanvas.getContext('2d');
    const img = fctx.createImageData(G, G);
    const [r, g, b] = field.rgb;
    for (let c = 0; c < G * G; c++) {
      const v = Math.min(1, Math.sqrt(Math.max(0, f[c]) / field.scale));
      img.data[c * 4] = r; img.data[c * 4 + 1] = g; img.data[c * 4 + 2] = b;
      img.data[c * 4 + 3] = Math.round(v * 200);
    }
    fctx.putImageData(img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(fieldCanvas, 0, 0, W, H);
    ctx.restore();
  }

  // Draw a tissue into ctx. view = {x0, y0, size} in tissue units (defaults to the
  // whole slice). opts: { field, focus (id), detail (bool), brush }.
  function drawTissue(ctx, tissue, W, H, col, opts) {
    opts = opts || {};
    const view = opts.view || { x0: 0, y0: 0, size: 1 };
    const k = W / view.size;
    const X = (x) => (x - view.x0) * k, Y = (y) => (y - view.y0) * k;
    const zoom = 1 / view.size;
    const detail = !!opts.detail;

    ctx.fillStyle = col.dish;
    ctx.fillRect(0, 0, W, H);

    // Blood vessels.
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const path of tissue.vesselPaths) {
      ctx.strokeStyle = col.vessel;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = Math.max(3, 2 / tissue.G * k);
      ctx.beginPath();
      path.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (opts.field && opts.field.key) {
      ctx.save();
      ctx.translate(-view.x0 * k, -view.y0 * k);
      drawField(ctx, tissue, opts.field, k, k);
      ctx.restore();
    }

    // Stem-cell niche.
    const ni = tissue.niche;
    if (tissue.p.neurogenesis) {
      ctx.strokeStyle = col.newborn;
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(X(ni.x), Y(ni.y), ni.r * k * 1.3, ni.r * k * 0.6, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Astrocyte territories and bodies.
    for (const a of tissue.astros) {
      ctx.fillStyle = col.astro;
      ctx.globalAlpha = 0.03 + 0.06 * Math.min(1, a.given / tissue.p.astroLactate);
      ctx.beginPath(); ctx.arc(X(a.x), Y(a.y), tissue.p.astroRadius * k, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const a of tissue.astros) {
      ctx.strokeStyle = col.astro;
      ctx.globalAlpha = opts.focus === a.id ? 1 : 0.75;
      ctx.lineWidth = 1.2;
      const r = Math.min(14, 3.5 * Math.sqrt(zoom));
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = i / 6 * TAU + a.id;
        ctx.moveTo(X(a.x), Y(a.y));
        ctx.lineTo(X(a.x) + Math.cos(ang) * r * 1.8, Y(a.y) + Math.sin(ang) * r * 1.8);
      }
      ctx.stroke();
      ctx.fillStyle = col.astro;
      ctx.beginPath(); ctx.arc(X(a.x), Y(a.y), r * 0.6, 0, TAU); ctx.fill();
      // End-feet on vessels.
      if (detail) {
        ctx.globalAlpha = 0.35;
        const G = tissue.G;
        for (let i = 0; i < a.feet.length; i += 3) {
          const c = a.feet[i];
          ctx.beginPath(); ctx.moveTo(X(a.x), Y(a.y)); ctx.lineTo(X((c % G + 0.5) / G), Y((Math.floor(c / G) + 0.5) / G)); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Synapses: excitatory pale, inhibitory red, tagged ones orange.
    const maxW = tissue.p.maxWeight;
    const focus = opts.focus;
    for (const s of tissue.synapses) {
      const tagged = s.tag > tissue.p.eatTag;
      const linked = focus && (s.pre.id === focus || s.post.id === focus);
      ctx.strokeStyle = tagged ? col.tag : s.pre.type === 2 ? col.inh : col.syn;
      ctx.globalAlpha = linked ? 0.95 : (focus ? 0.12 : 0.2) + 0.55 * (s.w / maxW);
      ctx.lineWidth = (linked ? 1.2 : 0.5) + 1.6 * (s.w / maxW) * Math.min(2, Math.sqrt(zoom));
      ctx.beginPath(); ctx.moveTo(X(s.pre.x), Y(s.pre.y)); ctx.lineTo(X(s.post.x), Y(s.post.y)); ctx.stroke();
      if (detail || linked) {
        // A dot near the receiving end marks direction.
        const tx = s.pre.x + (s.post.x - s.pre.x) * 0.82, ty = s.pre.y + (s.post.y - s.pre.y) * 0.82;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath(); ctx.arc(X(tx), Y(ty), 1.2 + Math.min(2, zoom * 0.5), 0, TAU); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Debris from dead cells.
    ctx.fillStyle = col.debris;
    for (const d of tissue.debris) {
      const r = Math.max(1.5, 0.008 * k);
      ctx.globalAlpha = 0.8;
      for (let i = 0; i < 3; i++) {
        const ang = i * 2.1 + d.at;
        ctx.beginPath(); ctx.arc(X(d.x) + Math.cos(ang) * r, Y(d.y) + Math.sin(ang) * r, r * 0.7, 0, TAU); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Neurons.
    const base = Math.max(2.2, Math.min(9, 0.009 * k));
    for (const n of tissue.neurons) {
      let fill = n.type === 2 ? col.inh : col.exc;
      if (n.newborn || n.migrating) fill = col.newborn;
      const r = n.migrating ? base * 0.7 : base;
      ctx.globalAlpha = n.spiked ? 1 : 0.35 + 0.5 * n.energy;
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.arc(X(n.x), Y(n.y), n.spiked ? r * 1.7 : r, 0, TAU); ctx.fill();
      if (n.spiked) {
        ctx.globalAlpha = 0.25;
        ctx.beginPath(); ctx.arc(X(n.x), Y(n.y), r * 3, 0, TAU); ctx.fill();
      }
      if (n.id === focus) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = col.focus;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X(n.x), Y(n.y), r + 5, 0, TAU); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Microglia: a body with a few moving processes.
    for (const m of tissue.microglia) {
      const r = Math.max(3, Math.min(12, 0.011 * k));
      ctx.strokeStyle = col.micro; ctx.fillStyle = col.micro;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const ang = i / 5 * TAU + tissue.t * 0.002 + m.id;
        const len = r * (1.6 + 0.6 * Math.sin(tissue.t * 0.01 + i * 1.7 + m.id));
        ctx.moveTo(X(m.x), Y(m.y));
        ctx.lineTo(X(m.x) + Math.cos(ang) * len, Y(m.y) + Math.sin(ang) * len);
      }
      ctx.stroke();
      ctx.beginPath(); ctx.arc(X(m.x), Y(m.y), r * 0.7, 0, TAU); ctx.fill();
      if (m.id === focus) {
        ctx.strokeStyle = col.focus; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X(m.x), Y(m.y), r + 6, 0, TAU); ctx.stroke();
      }
      if (detail) {
        ctx.globalAlpha = 0.2; ctx.strokeStyle = col.micro; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(X(m.x), Y(m.y), tissue.p.microgliaRadius * k, 0, TAU); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Stimulation in progress.
    if (tissue.stim && tissue.stim.until > tissue.t) {
      ctx.strokeStyle = col.focus; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.arc(X(tissue.stim.x), Y(tissue.stim.y), tissue.stim.r * k, 0, TAU); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    // Brush preview for lesion / stimulate tools.
    if (opts.brush) {
      const b = opts.brush;
      ctx.strokeStyle = b.kind === 'lesion' ? col.inh : col.focus;
      ctx.globalAlpha = 0.85; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), b.r * k, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // Line chart. series: [{colour, points: [[t, v], ...]}]; marks: [{t, colour}].
  function drawChart(cv, series, opts) {
    opts = opts || {};
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const cw = cv.clientWidth, ch = cv.clientHeight;
    if (!cw || !ch) return;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    const col = opts.colours;
    const fmt = opts.fmt || ((v) => String(v));
    const pad = { l: opts.padLeft || 44, r: 12, t: 10, b: 22 };
    const pw = cw - pad.l - pad.r, ph = ch - pad.t - pad.b;
    let tMin = Infinity, tMax = -Infinity, vMin = Infinity, vMax = -Infinity;
    for (const s of series) for (const [t, v] of s.points) {
      if (t < tMin) tMin = t; if (t > tMax) tMax = t;
      if (v < vMin) vMin = v; if (v > vMax) vMax = v;
    }
    if (!Number.isFinite(tMin)) { tMin = 0; tMax = 1; vMin = 0; vMax = 1; }
    if (tMax === tMin) tMax = tMin + 1;
    vMin = Math.min(0, vMin);
    if (opts.ref !== undefined) vMax = Math.max(vMax, opts.ref * 1.2);
    if (vMax === vMin) vMax = vMin + 1;
    const ticks = niceTicks(vMin, vMax, opts.ticks || 4);
    vMin = Math.min(vMin, ticks[0]); vMax = Math.max(vMax, ticks[ticks.length - 1]);
    const X = (t) => pad.l + ((t - tMin) / (tMax - tMin)) * pw;
    const Y = (v) => pad.t + ph - ((v - vMin) / (vMax - vMin)) * ph;
    ctx.font = '11px ' + opts.font;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    for (const v of ticks) {
      ctx.strokeStyle = col.line; ctx.lineWidth = v === 0 ? 1.2 : 0.6;
      ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(pad.l + pw, Y(v)); ctx.stroke();
      ctx.fillStyle = col.muted; ctx.fillText(fmt(v), pad.l - 6, Y(v));
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const t of niceTicks(tMin, tMax, 5)) {
      if (t < tMin || t > tMax) continue;
      ctx.fillStyle = col.muted;
      ctx.fillText(t >= 1000 ? (t / 1000) + 'k' : String(t), X(t), pad.t + ph + 6);
    }
    if (opts.ref !== undefined) {
      ctx.strokeStyle = col.muted; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, Y(opts.ref)); ctx.lineTo(pad.l + pw, Y(opts.ref)); ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const m of opts.marks || []) {
      if (m.t < tMin || m.t > tMax) continue;
      ctx.strokeStyle = m.colour; ctx.globalAlpha = 0.7; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(X(m.t), pad.t); ctx.lineTo(X(m.t), pad.t + ph); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    for (const s of series) {
      ctx.strokeStyle = s.colour; ctx.lineWidth = s.width || 1.8;
      ctx.beginPath();
      s.points.forEach(([t, v], i) => (i ? ctx.lineTo(X(t), Y(v)) : ctx.moveTo(X(t), Y(v))));
      ctx.stroke();
      const last = s.points[s.points.length - 1];
      if (last && !s.noDot) { ctx.fillStyle = s.colour; ctx.beginPath(); ctx.arc(X(last[0]), Y(last[1]), 3, 0, TAU); ctx.fill(); }
    }
  }

  function niceTicks(lo, hi, n) {
    const span = hi - lo || 1;
    const raw = span / n;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= raw);
    const out = [];
    for (let v = Math.floor(lo / step) * step; v <= hi + step * 0.001; v += step) out.push(Math.round(v / step) * step);
    if (out[out.length - 1] < hi) out.push(out[out.length - 1] + step);
    return out;
  }

  root.TissueDraw = { FIELDS, drawTissue, drawChart };
})(typeof self !== 'undefined' ? self : this);
