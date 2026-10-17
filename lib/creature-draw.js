// Creature shapes: soft early-animal bodies drawn from each creature's genes.
//
// The first animals that moved with a purpose were bilaterians: a front end
// that meets the world first (mouth, eyes, the start of a brain) and a body
// that bends in waves to swim. So every creature here is a soft body along a
// spine that waves from head to tail, and its genes shape it:
//
//   speed        fast swimmers are long and slender, slow ones broad and flat
//                (water resists a broad body more, so speed selects for streamlining)
//   hidden       brain size: a bigger brain makes a bigger head
//   fov          eyes sit further to the sides when the field of view is wide
//   no brain     instinct-only creatures are flat ribbed ovals, like the
//                Ediacaran Dickinsonia, with no head
//   meat         hunters carry two grasping arms at the front, like the
//                Cambrian Anomalocaris
//
// Body-plan genes (Onto land, the Forager `bodyPlan` setting) replace these
// guesses with the real plan: one segment line per segment, fins or legs on
// the trunk (legs thicker when sturdier), grasping arms when `arms` is above
// 0.5 and a tail fin as big as `tail`.
//
// Drawing only: nothing here touches a simulation or its random numbers.
// CreatureDraw.draw(ctx, c, x, y, size, fill, { px }) where px is screen
// pixels per world unit (details such as eyes and ribs appear when close).
(function (root) {
  'use strict';

  const TAU = Math.PI * 2, N = 16;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // Body plan from the genes (cached on the creature, genes never change).
  function form(c) {
    if (c._form && c._form.g === c.g) return c._form;
    const g = c.g || {}, brainy = !!c.brain || g.hidden !== undefined;
    const fast = clamp01(((g.speed === undefined ? 1.2 : g.speed) - 0.6) / 1.6);
    const f = {
      g: c.g,
      brainy,
      meat: !!c.meat,
      length: brainy ? 2.5 + 1.1 * fast : 2.2,
      width: brainy ? 1.15 - 0.4 * fast : 1.55,
      head: brainy ? clamp01(((g.hidden || 4) - 4) / 40) : 0,
      eyes: brainy ? clamp01(((g.fov || 1.6) - 0.4) / 2.6) : 0,
      wave: brainy ? 0.22 + 0.12 * fast : 0.08,
      beat: 0.18 + 0.22 * fast,
    };
    if (f.meat) { f.length += 0.5; f.width += 0.1; }
    if (g.segments !== undefined) {
      const segs = Math.round(g.segments), type = Math.floor(g.limbs);
      f.plan = {
        segs, type, pairs: type ? Math.min(Math.round(g.pairs), segs - 2) : 0,
        limb: g.limbLength, sturdy: g.sturdy, arms: g.arms > 0.5, tail: g.tail,
      };
      f.length = 1.5 + 0.22 * segs;
      f.meat = f.plan.arms;
    }
    c._form = f;
    return f;
  }

  // Half width along the body, t = 0 at the head and 1 at the tail: a round
  // head end, widest a quarter of the way back, tapering to the tail. A bigger
  // brain swells the head.
  function halfWidth(f, t) {
    if (!f.brainy) return 0.5 * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2));
    const front = t < 0.25 ? Math.sqrt(Math.max(0, 1 - ((0.25 - t) / 0.25) ** 2)) : 1 - 0.88 * Math.pow((t - 0.25) / 0.75, 1.2);
    const head = 1 + 0.4 * f.head * Math.exp(-(((t - 0.12) / 0.12) ** 2));
    return 0.5 * front * head;
  }

  // Spine and outline, in body units (head at +x).
  function outline(f, c, sz) {
    const L = f.length * sz, W = f.width * sz;
    const phase = (c.age || 0) * f.beat + (c.id || 0) * 1.7;
    const left = [], right = [], mid = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, x = L * (0.5 - t);
      const y = W * f.wave * Math.pow(t, 1.5) * Math.sin(phase - t * TAU * 0.85);
      const hw = W * halfWidth(f, t);
      left.push([x, y + hw]); right.push([x, y - hw]); mid.push([x, y, hw]);
    }
    return { left, right, mid, L, W, phase };
  }

  // A smooth closed curve through the points.
  function smooth(ctx, pts) {
    const n = pts.length;
    ctx.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.closePath();
  }

  function draw(ctx, c, x, y, sz, fill, opts) {
    const px = (opts && opts.px) || 1, f = form(c), heading = opts && opts.heading !== undefined ? opts.heading : c.heading;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(heading);
    ctx.fillStyle = fill;
    // Far away: a plain oval is all the eye can see.
    if (sz * px < 1.6) {
      ctx.beginPath(); ctx.ellipse(0, 0, f.length * sz / 2, f.width * sz / 2, 0, 0, TAU); ctx.fill();
      ctx.restore();
      return;
    }
    const o = outline(f, c, sz), tail = o.left[N];
    if (f.plan) drawLimbs(ctx, f, o, sz, px, fill);
    ctx.beginPath();
    smooth(ctx, [...o.left.slice(1, N), [tail[0] - sz * (f.brainy ? 0.2 : 0), tail[1]], ...o.right.slice(1, N).reverse(), [o.L * 0.5 + sz * 0.05, o.mid[0][1]]]);
    ctx.fill();
    const detail = sz * px >= 4;
    if (detail) {
      ctx.strokeStyle = 'rgba(10,20,16,0.35)'; ctx.lineWidth = Math.max(0.6 / px, sz * 0.06);
      if (f.plan) {
        // One line between each pair of segments.
        ctx.beginPath();
        for (let k = 1; k < f.plan.segs; k++) {
          const [mx, my, hw] = o.mid[Math.round(k / f.plan.segs * N)];
          ctx.moveTo(mx, my + hw * 0.85); ctx.lineTo(mx, my - hw * 0.85);
        }
        ctx.stroke();
      } else if (!f.brainy || f.meat) {
        // Ribs (Dickinsonia) or body segments (early arthropods).
        ctx.beginPath();
        for (let i = 2; i < N - 1; i += f.brainy ? 2 : 1) { const [mx, my, hw] = o.mid[i]; ctx.moveTo(mx, my + hw * 0.85); ctx.lineTo(mx, my - hw * 0.85); }
        ctx.stroke();
      }
      if (f.meat) {
        // Two grasping arms curling in front of the mouth.
        ctx.strokeStyle = fill; ctx.lineWidth = Math.max(0.7 / px, sz * 0.11); ctx.lineCap = 'round';
        const sway = 0.15 * Math.sin(o.phase * 1.3);
        for (const s of [1, -1]) {
          ctx.beginPath(); ctx.moveTo(o.L * 0.44, s * o.W * 0.15);
          ctx.quadraticCurveTo(o.L * 0.6, s * o.W * (0.65 + sway), o.L * 0.82, s * o.W * 0.22);
          ctx.stroke();
        }
      }
      if (f.brainy) {
        // Eyes on the head, further apart for a wide field of view.
        const h = o.mid[2], ex = h[0], ey = h[2] * (0.35 + 0.3 * f.eyes), r = Math.max(0.7 / px, sz * (0.1 + 0.05 * f.head));
        ctx.fillStyle = 'rgba(12,20,18,0.85)';
        for (const s of [1, -1]) { ctx.beginPath(); ctx.arc(ex, h[1] + s * ey, r, 0, TAU); ctx.fill(); }
      }
    }
    ctx.restore();
  }

  // Body plans: fins or legs on the trunk segments and a tail fin, drawn
  // under the body. Legs bend at a knee and swing in turn as the body waves.
  function drawLimbs(ctx, f, o, sz, px, fill) {
    const P = f.plan, W = o.W;
    ctx.save();
    ctx.fillStyle = fill; ctx.strokeStyle = fill; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let k = 0; k < P.pairs; k++) {
      // Pairs sit on the trunk, from just behind the head toward the tail.
      const t = P.pairs === 1 ? 0.35 : 0.22 + 0.5 * k / (P.pairs - 1);
      const [mx, my, hw] = o.mid[Math.round(t * N)];
      const reach = W * (0.35 + 0.6 * P.limb);
      for (const s of [1, -1]) {
        const swing = 0.5 * Math.sin(o.phase * 1.6 + k * 1.3 + (s > 0 ? 0 : Math.PI));
        if (P.type === 1) {
          // A fin: a paddle swept back.
          ctx.beginPath();
          ctx.ellipse(mx - reach * 0.3, my + s * (hw + reach * 0.3), reach * 0.55, reach * 0.22, s * (0.6 + 0.2 * swing), 0, TAU);
          ctx.fill();
        } else {
          // A leg: out to the knee, then down and back to the foot.
          ctx.lineWidth = Math.max(0.6 / px, sz * (0.08 + 0.14 * P.sturdy));
          const kx = mx + reach * 0.25 * swing, ky = my + s * (hw + reach * 0.55);
          ctx.beginPath(); ctx.moveTo(mx, my + s * hw * 0.6); ctx.lineTo(kx, ky);
          ctx.lineTo(kx - reach * 0.35 + reach * 0.3 * swing, ky + s * reach * 0.35);
          ctx.stroke();
        }
      }
    }
    if (P.tail > 0.15) {
      // Tail fin: a fan behind the last segment.
      const [tx, ty] = o.mid[N], r = W * 0.7 * P.tail;
      ctx.beginPath(); ctx.moveTo(tx + sz * 0.15, ty);
      ctx.lineTo(tx - r, ty + r * 0.8); ctx.quadraticCurveTo(tx - r * 0.6, ty, tx - r, ty - r * 0.8);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // A small picture of a species' typical body, as an <img> for legends.
  const icons = new Map();
  function icon(sp, fill) {
    const brainy = sp.mind === 'brain' || sp.mind === 'tissue';
    const hid = sp.geneInit && sp.geneInit.hidden ? (sp.geneInit.hidden[0] + sp.geneInit.hidden[1]) / 2 : 24;
    const key = [brainy, hid, sp.diet, fill].join('|');
    if (!icons.has(key)) {
      const cv = document.createElement('canvas'), d = 2;
      cv.width = cv.height = 16 * d;
      const ctx = cv.getContext('2d');
      ctx.scale(d, d);
      const c = { id: 0, age: 0, heading: 0, brain: brainy || null, meat: sp.diet === 'meat', g: brainy ? { speed: 1.2, hidden: hid, fov: 1.6 } : { speed: 1.2 } };
      draw(ctx, c, 8, 8, 4.2, fill, { px: 1 });
      icons.set(key, cv.toDataURL());
    }
    return `<img src="${icons.get(key)}" width="16" height="16" alt="" style="vertical-align:middle">`;
  }

  const api = { draw, form, icon };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CreatureDraw = api;
})(typeof self !== 'undefined' ? self : this);
