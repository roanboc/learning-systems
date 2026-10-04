// Plant explorer: World → Plant → Tissues → Cell, for living plants.
//
// Opens over the page and follows one plant while the world keeps running.
//   Plant:   its patch of ground (soil, neighbours that shade it, its offspring,
//            passing creatures) and its life so far.
//   Tissues: where light, water and sugar go inside the plant, as flows.
//   Cell:    one kind of plant cell with a plain-language introduction.
// The model works on the whole plant (light, soil, growth, seeds). Tissues and
// cells show where those numbers happen in a real plant; they are not
// simulated one by one, and the page says so.
(function (root) {
  'use strict';

  const HIST = 600;

  // Inside-the-plant parts. activity(s) maps the plant's state to 0..1.
  const PARTS = {
    leaf: {
      name: 'Leaf cell',
      intro: 'A mesophyll cell inside the leaf, packed with chloroplasts. Chloroplasts catch light and use it to turn water and carbon dioxide into sugar: photosynthesis. Almost all the energy in this world starts here.',
      model: (s) => `Light reaching the leaves is ${pct(s.light)} (neighbours shade the rest). Photosynthesis needs water and minerals too, so it runs at light × soil = ${pct(s.light * s.fert)}.`,
      activity: (s) => s.light * s.fert,
    },
    root: {
      name: 'Root hair cell',
      intro: 'A root cell with a long thin outgrowth that pushes between soil grains. It soaks up water and dissolved minerals such as nitrogen. Rich soil lets it take up more.',
      model: (s) => `Soil fertility under this plant is ${pct(s.fert)}. When the fertile spot drifts away, uptake falls and the plant starts to shrink.`,
      activity: (s) => s.fert,
    },
    xylem: {
      name: 'Xylem vessel',
      intro: 'A pipe made of dead, hollow cells joined end to end. Water and minerals rise through it from the roots to the leaves, pulled up as water evaporates from the leaves.',
      model: (s) => `Upward flow here follows root uptake and plant size: ${pct(s.fert * Math.max(0.1, s.size))}.`,
      activity: (s) => s.fert * Math.max(0.1, s.size),
    },
    phloem: {
      name: 'Phloem sieve tube',
      intro: 'A living pipe that carries sugar made in the leaves to wherever it is needed: growing tips, roots, seeds and defences.',
      model: (s) => `Sugar flow follows photosynthesis: ${pct(s.light * s.fert)}. Part of it pays the plant's upkeep before any growth happens.`,
      activity: (s) => s.light * s.fert,
    },
    meristem: {
      name: 'Meristem cell',
      intro: 'A stem cell at a growing tip. It keeps dividing, and its daughters become new leaf, stem or root. Growth only happens here.',
      model: (s) => s.growth > 0 ? `Growing: size went up ${(s.growth * 1000).toFixed(1)} thousandths this step.` : s.size >= 1 ? 'Full grown: sugar now goes to seeds instead of size.' : 'Not growing: upkeep costs more than the sugar coming in, so the plant shrinks.',
      activity: (s) => Math.max(0, s.growthRate),
    },
    defence: {
      name: 'Defence cell',
      intro: 'A cell that makes a bitter or toxic compound and stores it in its vacuole. Many real plants do this (nicotine, cyanide compounds, tannins). Eating it hurts.',
      model: (s) => s.poison ? `This plant is poisonous. Making toxin halves its growth and seed making, the price of defence.` : 'This plant makes no toxin, so it grows at full speed but is safe to eat.',
      activity: (s) => (s.poison ? 0.8 : 0),
    },
    seed: {
      name: 'Seed',
      intro: 'A baby plant (the embryo) packed with a food store and a tough coat. It falls near its parent and only sprouts if it lands on fertile ground that is not already shaded.',
      model: (s) => s.size > 0.5 ? `Making seeds now. ${s.seeds} dropped so far, ${s.sprouted} sprouted.` : `Too small to make seeds until it reaches half size. ${s.seeds} dropped so far.`,
      activity: (s) => (s.seededRecently ? 1 : s.size > 0.5 ? 0.3 : 0),
    },
  };

  function pct(v) { return `${Math.round(v * 100)}%`; }

  class PlantExplorer {
    constructor(opts) {
      this.colours = opts.colours;
      this.onClose = opts.onClose || (() => {});
      this.entry = null;
      this.level = 'plant';
      this.part = 'leaf';
      this.speed = 1;
      this.hits = [];
      this.frame = 0;
      this.buildDom();
    }

    get active() { return this.entry !== null; }

    buildDom() {
      const el = document.createElement('div');
      el.className = 'explorer';
      el.hidden = true;
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Plant explorer');
      el.innerHTML = `
        <div class="ex-bar">
          <nav class="ex-crumbs" aria-label="Zoom level"></nav>
          <div class="ex-tools">
            <label class="eyebrow" for="px-speed">Speed</label>
            <select id="px-speed">
              <option value="1" selected>1 step/frame</option>
              <option value="5">5 steps/frame</option>
              <option value="20">20 steps/frame</option>
            </select>
            <button type="button" class="ex-pause">Pause</button>
            <button type="button" class="ex-close" aria-label="Back to the worlds">Close</button>
          </div>
        </div>
        <div class="ex-status"></div>
        <section class="ex-level px-plant">
          <div class="ex-grid">
            <figure class="ex-fig">
              <figcaption><b>Its ground</b> · brown is fertile soil, which drifts. Faint rings are the shade of neighbours. Lines join it to its parent and the offspring that sprouted.</figcaption>
              <canvas class="ex-outside px-outside" aria-label="The plant's surroundings"></canvas>
            </figure>
            <figure class="ex-fig">
              <figcaption><b>Inside</b> · light and soil come in, sugar goes to growth, seeds and defence. Click a part to meet its cells.</figcaption>
              <canvas class="px-body" aria-label="Inside the plant"></canvas>
            </figure>
          </div>
          <figure class="ex-fig">
            <figcaption><b>Its life so far</b> · size, light and soil over time. Dots mark seeds dropped.</figcaption>
            <canvas class="px-life" aria-label="Plant life timeline"></canvas>
          </figure>
          <div class="ex-facts"></div>
        </section>
        <section class="ex-level px-tissue" hidden>
          <figure class="ex-fig">
            <figcaption><b>Tissues</b> · blue dots are water rising in the xylem, amber dots are sugar moving in the phloem. Brighter tissue is busier. Click a tissue to zoom into one of its cells.</figcaption>
            <canvas class="px-tissues" aria-label="Plant tissues and flows"></canvas>
          </figure>
          <p class="ex-note">The model works on the whole plant: how much light and soil it gets, how fast it grows, when it makes seeds. These tissues show where each of those happens in a real plant. Their activity comes from the plant's numbers; individual cells are not simulated.</p>
        </section>
        <section class="ex-level px-cell" hidden>
          <div class="ex-grid">
            <div class="ex-cellinfo"></div>
            <figure class="ex-fig">
              <figcaption><b>The cell</b> · and how busy it has been over time.</figcaption>
              <canvas class="px-celldraw" aria-label="Plant cell"></canvas>
            </figure>
          </div>
        </section>`;
      document.body.appendChild(el);
      this.el = el;
      this.q = (s) => el.querySelector(s);
      this.q('.ex-close').addEventListener('click', () => this.close());
      this.q('#px-speed').addEventListener('change', (e) => { this.speed = parseInt(e.target.value, 10); });
      this.pauseBtn = this.q('.ex-pause');
      document.addEventListener('keydown', (e) => {
        if (!this.active || e.key !== 'Escape') return;
        if (this.level === 'cell') this.go('tissue');
        else if (this.level === 'tissue') this.go('plant');
        else this.close();
      });
      for (const sel of ['.px-body', '.px-tissues']) {
        this.q(sel).addEventListener('click', (e) => this.click(sel, e));
      }
    }

    // ---------- lifecycle ----------

    open(entry, plantId, origin) {
      const pl = entry.world.plants.find((x) => x.id === plantId);
      if (!pl) return;
      this.entry = entry;
      this.plant = pl;
      this.goneAt = null;
      this.h = {
        len: 0, head: 0,
        size: new Float32Array(HIST), light: new Float32Array(HIST), fert: new Float32Array(HIST),
        seed: new Uint8Array(HIST), t0: entry.world.t,
      };
      this.lastSeedT = -1e9;
      this.el.hidden = false;
      document.body.classList.add('exploring');
      if (origin && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.el.style.transformOrigin = `${origin.x}px ${origin.y}px`;
        this.el.classList.remove('ex-zoom');
        void this.el.offsetWidth;
        this.el.classList.add('ex-zoom');
      }
      this.go('plant');
    }

    close() {
      this.entry = null;
      this.el.hidden = true;
      document.body.classList.remove('exploring');
      this.onClose();
    }

    go(level, part) {
      this.level = level;
      if (part) this.part = part;
      this.q('.px-plant').hidden = level !== 'plant';
      this.q('.px-tissue').hidden = level !== 'tissue';
      this.q('.px-cell').hidden = level !== 'cell';
      this.renderCrumbs();
      this.el.scrollTop = 0;
      this.draw();
    }

    renderCrumbs() {
      const pl = this.plant;
      const crumbs = [['world', this.entry.name], ['plant', `Plant #${pl.id}`]];
      if (this.level !== 'plant') crumbs.push(['tissue', 'Tissues']);
      if (this.level === 'cell') crumbs.push(['cell', PARTS[this.part].name]);
      const nav = this.q('.ex-crumbs');
      nav.innerHTML = '';
      crumbs.forEach(([lvl, label], i) => {
        if (i) { const s = document.createElement('span'); s.textContent = '›'; s.className = 'sep'; nav.appendChild(s); }
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        if (i === crumbs.length - 1) b.setAttribute('aria-current', 'page');
        b.addEventListener('click', () => (lvl === 'world' ? this.close() : this.go(lvl)));
        nav.appendChild(b);
      });
    }

    followNearest() {
      const w = this.entry.world, pl = this.plant;
      let best = null, bd = Infinity;
      for (const o of w.plants) {
        if (o.dead) continue;
        const d = w.delta(pl.x, o.x) ** 2 + w.delta(pl.y, o.y) ** 2;
        if (d < bd) { bd = d; best = o; }
      }
      if (best) { const level = this.level; this.open(this.entry, best.id, null); this.go(level); }
    }

    // Call after every step of the explored world.
    record() {
      if (!this.active || this.goneAt !== null) return;
      const pl = this.plant, h = this.h, i = h.head;
      if (pl.dead) { this.goneAt = this.entry.world.t; return; }
      h.size[i] = pl.size; h.light[i] = pl.light; h.fert[i] = pl.fert; h.seed[i] = pl.seeded ? 1 : 0;
      if (pl.seeded) this.lastSeedT = this.entry.world.t;
      h.head = (i + 1) % HIST;
      if (h.len < HIST) h.len++;
    }

    slot(k) { return (this.h.head - this.h.len + k + HIST) % HIST; }

    // The plant's state as the tissues and cells read it.
    state() {
      const pl = this.plant, p = this.entry.world.p;
      const full = p.plantGrow * (pl.poison ? p.toxinCost : 1);
      return {
        light: pl.light, fert: pl.fert, size: pl.size, growth: pl.growth, poison: pl.poison,
        growthRate: full > 0 ? pl.growth / (full * 0.85) : 0,
        seeds: pl.seeds, sprouted: pl.sprouted || 0,
        seededRecently: this.entry.world.t - this.lastSeedT < 15,
      };
    }

    // ---------- input ----------

    click(sel, e) {
      const cv = this.q(sel), r = cv.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      let best = null, bd = Infinity;
      for (const hit of this.hits) {
        if (hit.canvas !== sel) continue;
        const d = (hit.x - x) ** 2 + (hit.y - y) ** 2;
        if (d < bd && d < (hit.r + 8) ** 2) { bd = d; best = hit; }
      }
      if (best) this.go('cell', best.part);
      else if (sel === '.px-body') this.go('tissue');
    }

    // ---------- drawing ----------

    fit(cv, cssHeight) {
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth;
      const h = cssHeight === undefined ? w : cssHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
        cv.style.height = h + 'px';
      }
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx, w, h };
    }

    paused() { return this.isPaused ? this.isPaused() : false; }

    draw() {
      if (!this.active) return;
      this.frame++;
      const col = this.colours();
      this.pauseBtn.textContent = this.paused() ? 'Play' : 'Pause';
      const status = this.q('.ex-status');
      if (this.goneAt !== null) {
        if (status.dataset.for !== String(this.plant.id)) {
          status.dataset.for = String(this.plant.id);
          const why = { eaten: `it was eaten by creature #${this.plant.eatenBy}`, starved: 'it starved on poor or shaded ground', old: 'it died of old age' }[this.plant.death] || 'it died';
          status.innerHTML = `This plant is gone at t ${this.goneAt}: ${why}. <button type="button" class="ex-next">Follow the nearest living plant</button>`;
          status.querySelector('.ex-next').addEventListener('click', () => this.followNearest());
        }
        status.hidden = false;
      } else { status.hidden = true; status.dataset.for = ''; }
      this.hits = [];
      const s = this.state();
      if (this.level === 'plant') {
        this.drawGround(col);
        this.drawBody('.px-body', col, s, false);
        this.drawLife(col);
        this.renderFacts(s);
      } else if (this.level === 'tissue') {
        this.drawBody('.px-tissues', col, s, true);
      } else {
        this.drawCell(col, s);
      }
    }

    drawGround(col) {
      const cv = this.q('.px-outside');
      const { ctx, w, h } = this.fit(cv);
      const world = this.entry.world, pl = this.plant, p = world.p;
      const view = 80, k = (Math.min(w, h) / 2) / view;
      ctx.fillStyle = col.dish;
      ctx.fillRect(0, 0, w, h);
      // Soil fertility as a coarse heat map.
      const n = 24, cell = (view * 2) / n;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const wx = pl.x - view + (i + 0.5) * cell, wy = pl.y - view + (j + 0.5) * cell;
          const f = world.fertility(world.wrap(wx), world.wrap(wy));
          ctx.fillStyle = `rgba(176, 132, 82, ${(f * 0.45).toFixed(3)})`;
          const x0 = Math.round(i * cell * k), y0 = Math.round(j * cell * k);
          ctx.fillRect(x0, y0, Math.round((i + 1) * cell * k) - x0, Math.round((j + 1) * cell * k) - y0);
        }
      }
      ctx.save();
      ctx.translate(w / 2, h / 2);
      const rel = (o) => [world.delta(pl.x, o.x) * k, world.delta(pl.y, o.y) * k];
      // Family lines.
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      for (const o of world.plants) {
        if (o.dead || (o.parent !== pl.id && o.id !== pl.parent)) continue;
        const [x, y] = rel(o);
        if (Math.abs(x) > w || Math.abs(y) > h) continue;
        ctx.setLineDash(o.id === pl.parent ? [4, 4] : []);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(x, y); ctx.stroke();
      }
      ctx.setLineDash([]);
      // Neighbours with their shade.
      for (const o of world.plants) {
        if (o.dead) continue;
        const [x, y] = rel(o);
        if (Math.abs(x) > w / 2 + 20 || Math.abs(y) > h / 2 + 20) continue;
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath(); ctx.arc(x, y, p.crowdRadius * k * Math.max(0.3, o.size), 0, Math.PI * 2); ctx.fill();
      }
      for (const o of world.plants) {
        if (o.dead) continue;
        const [x, y] = rel(o);
        if (Math.abs(x) > w / 2 + 20 || Math.abs(y) > h / 2 + 20) continue;
        ctx.globalAlpha = o.size < p.biteSize ? 0.45 : 1;
        ctx.fillStyle = world.plantColour(o) === 0 ? col.green : col.violet;
        ctx.beginPath(); ctx.arc(x, y, (1 + 2.6 * o.size) * k * 0.9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Creatures passing by.
      for (const c of world.creatures) {
        const [x, y] = rel(c);
        if (Math.abs(x) > w / 2 + 10 || Math.abs(y) > h / 2 + 10) continue;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(c.heading);
        ctx.fillStyle = '#e8efe9';
        ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, 6); ctx.lineTo(-3, 0); ctx.lineTo(-6, -6); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // The plant itself.
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, (1 + 2.6 * pl.size) * k * 0.9 + 5, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // Side view of the plant: sun, leaves, stem, roots in the soil, seed head.
    // Shared by the plant level (small, click to go in) and the tissue level.
    drawBody(sel, col, s, detailed) {
      const cv = this.q(sel);
      const { ctx, w, h } = this.fit(cv, detailed ? Math.min(560, Math.max(380, cv.clientWidth * 0.62)) : undefined);
      const pl = this.plant;
      const groundY = h * 0.62;
      const scale = 0.45 + 0.55 * s.size;
      const cx = w / 2;
      const topY = groundY - (groundY - 40) * scale;
      // Sky and soil.
      ctx.fillStyle = col.dish;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = `rgba(176, 132, 82, ${(0.15 + 0.5 * s.fert).toFixed(3)})`;
      ctx.fillRect(0, groundY, w, h - groundY);
      // Sun, dimmed by shade.
      const sunX = w * 0.85, sunY = 34;
      ctx.fillStyle = `rgba(255, 210, 110, ${(0.25 + 0.75 * s.light).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(sunX, sunY, 14, 0, Math.PI * 2); ctx.fill();
      // Leaf positions first, so sunlight can be drawn reaching each leaf.
      const leaves = [];
      const nLeaves = 2 + Math.round(4 * s.size);
      for (let i = 0; i < nLeaves; i++) {
        const side = i % 2 ? 1 : -1;
        const ly = groundY - (groundY - topY) * (0.25 + 0.7 * (i / Math.max(1, nLeaves - 1)));
        const len = (30 + 26 * scale) * (1 - 0.3 * (i / nLeaves));
        leaves.push([cx + side * (len * 0.6 + 6), ly, len, side]);
      }
      ctx.strokeStyle = `rgba(255, 210, 110, ${(0.08 + 0.4 * s.light).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      for (const [lx, ly] of leaves) {
        ctx.beginPath(); ctx.moveTo(sunX, sunY); ctx.lineTo(lx, ly); ctx.stroke();
      }
      const plantCol = pl.poison ? col.violet : col.green;
      const colourNow = this.entry.world.plantColour(pl) === 0 ? col.green : col.violet;
      // Roots.
      ctx.strokeStyle = 'rgba(232, 220, 200, 0.8)';
      ctx.lineWidth = 2;
      const rootLen = (h - groundY - 16) * (0.4 + 0.6 * scale);
      const rootTips = [];
      for (let i = -2; i <= 2; i++) {
        const ex = cx + i * 26 * scale, ey = groundY + rootLen * (1 - Math.abs(i) * 0.15);
        ctx.beginPath(); ctx.moveTo(cx, groundY); ctx.quadraticCurveTo(cx + i * 8, groundY + rootLen * 0.4, ex, ey); ctx.stroke();
        rootTips.push([ex, ey]);
      }
      // Stem with xylem (left) and phloem (right).
      ctx.fillStyle = mixAlpha(plantCol, 0.55);
      ctx.fillRect(cx - 7, topY, 14, groundY - topY);
      // Leaves.
      for (const [lx, ly, len, side] of leaves) {
        ctx.fillStyle = colourNow;
        ctx.globalAlpha = 0.45 + 0.55 * s.light;
        ctx.beginPath(); ctx.ellipse(lx, ly, len * 0.6, len * 0.22, side * -0.35, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      // Seed head once grown.
      if (s.size > 0.5) {
        ctx.fillStyle = s.seededRecently ? '#ffe7a3' : 'rgba(255, 231, 163, 0.6)';
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + this.frame * 0.01;
          ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 8, topY - 6 + Math.sin(a) * 6, 3.2, 0, Math.PI * 2); ctx.fill();
        }
      }
      // Flows: water up the xylem, sugar in the phloem.
      const t = this.frame;
      const flowN = 7;
      for (let i = 0; i < flowN; i++) {
        const u = ((t * (0.004 + 0.012 * s.fert) + i / flowN) % 1);
        ctx.fillStyle = 'rgba(120, 190, 255, 0.95)';
        ctx.beginPath(); ctx.arc(cx - 3, groundY + rootLen * 0.5 - u * (groundY + rootLen * 0.5 - topY), 2.2, 0, Math.PI * 2); ctx.fill();
        const v = ((t * (0.003 + 0.012 * s.light * s.fert) + i / flowN) % 1);
        ctx.fillStyle = 'rgba(255, 190, 90, 0.95)';
        ctx.beginPath(); ctx.arc(cx + 3, topY + v * (groundY - topY), 2.2, 0, Math.PI * 2); ctx.fill();
      }
      // Defence cells in the leaves.
      if (s.poison) {
        ctx.fillStyle = '#d9c2ff';
        for (const [lx, ly] of leaves) { ctx.beginPath(); ctx.arc(lx, ly, 2.5, 0, Math.PI * 2); ctx.fill(); }
      }
      // Growing tips.
      ctx.fillStyle = s.growthRate > 0.05 ? '#fff6c2' : 'rgba(255,246,194,0.35)';
      ctx.beginPath(); ctx.arc(cx, topY, 4, 0, Math.PI * 2); ctx.fill();

      // Hit spots and labels for each tissue.
      // Label a right-hand leaf in the middle, away from the crowded top.
      const rightLeaves = leaves.filter((l) => l[3] > 0);
      const leaf = rightLeaves[Math.floor((rightLeaves.length - 1) / 2)] || leaves[0];
      const root = rootTips[3];
      const spots = [
        ['leaf', leaf[0], leaf[1], 'leaf'],
        ['xylem', cx - 3, groundY - (groundY - topY) * 0.15, 'xylem (water)'],
        ['phloem', cx + 3, groundY - (groundY - topY) * 0.45, 'phloem (sugar)'],
        ['meristem', cx, topY, 'growing tip'],
        ['root', root[0], root[1], 'root hairs'],
      ];
      if (s.size > 0.5) spots.push(['seed', cx + 12, topY - 14, 'seeds']);
      if (s.poison) spots.push(['defence', leaves[0][0], leaves[0][1], 'defence cells']);
      ctx.font = `${detailed ? 12 : 10}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textBaseline = 'middle';
      for (const [part, x, y, label] of spots) {
        this.hits.push({ canvas: sel, x, y, r: detailed ? 14 : 10, part });
        const a = PARTS[part].activity(s);
        ctx.strokeStyle = `rgba(255,255,255,${(0.35 + 0.6 * Math.min(1, a)).toFixed(2)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, detailed ? 10 : 7, 0, Math.PI * 2); ctx.stroke();
        if (detailed || part === 'leaf' || part === 'root') {
          const right = part === 'meristem' ? false : x >= cx;
          ctx.fillStyle = '#e8efe9';
          ctx.textAlign = right ? 'left' : 'right';
          ctx.fillText(detailed ? `${label} · ${pct(Math.min(1, a))}` : label, x + (right ? 14 : -14), y);
        }
      }
      ctx.textAlign = 'left';
      if (!detailed) {
        ctx.fillStyle = 'rgba(232,239,233,0.75)';
        ctx.fillText('click to go inside', 10, h - 12);
      }
    }

    drawLife(col) {
      const cv = this.q('.px-life');
      const { ctx, w, h } = this.fit(cv, 150);
      ctx.fillStyle = col.dish;
      ctx.fillRect(0, 0, w, h);
      const H = this.h, n = H.len;
      const pad = 8, plotH = h - 34;
      const series = [['size', '#e8efe9', 'size'], ['light', 'rgb(255,210,110)', 'light'], ['fert', 'rgb(196,150,98)', 'soil']];
      ctx.lineWidth = 1.5;
      for (const [key, c] of series) {
        ctx.strokeStyle = c;
        ctx.beginPath();
        for (let k = 0; k < n; k++) {
          const v = H[key][this.slot(k)];
          const x = pad + (k / (HIST - 1)) * (w - pad * 2), y = pad + (1 - v) * plotH;
          if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = '#ffe7a3';
      for (let k = 0; k < n; k++) {
        if (!H.seed[this.slot(k)]) continue;
        const x = pad + (k / (HIST - 1)) * (w - pad * 2);
        ctx.beginPath(); ctx.arc(x, h - 18, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.font = `11px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textBaseline = 'middle';
      let lx = pad;
      for (const [, c, label] of series.concat([[null, '#ffe7a3', 'seed dropped']])) {
        ctx.fillStyle = c; ctx.fillRect(lx, h - 7, 10, 3);
        ctx.fillStyle = 'rgba(232,239,233,0.8)'; ctx.fillText(label, lx + 14, h - 6);
        lx += ctx.measureText(label).width + 34;
      }
      if (!n) { ctx.fillStyle = 'rgba(232,239,233,0.7)'; ctx.fillText('Recording starts now; press Play if paused.', pad, h / 2); }
    }

    renderFacts(s) {
      const pl = this.plant, world = this.entry.world;
      const colour = world.plantColour(pl) === 0 ? 'green' : 'violet';
      const stage = pl.size < world.p.biteSize ? 'seedling' : pl.size > 0.5 ? 'grown, seeding' : 'growing';
      const facts = [
        ['Kind', `${colour}, ${pl.poison ? 'poisonous' : 'edible'}`],
        ['Stage', stage],
        ['Size', pl.size.toFixed(2)],
        ['Age', `${pl.age} of about ${pl.lifespan.toFixed(0)}`],
        ['Light', pct(s.light)],
        ['Soil fertility', pct(s.fert)],
        ['Seeds dropped', `${pl.seeds}, ${s.sprouted} sprouted`],
        ['Generation', pl.gen],
        ['Worth to an eater', pl.size < world.p.biteSize ? 'too small to bite' : `${pl.poison ? '−' : '+'}${((pl.poison ? world.p.poisonDamage : world.p.foodEnergy) * pl.size).toFixed(0)} energy`],
      ];
      this.q('.px-plant .ex-facts').innerHTML = facts.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');
    }

    drawCell(col, s) {
      const part = PARTS[this.part];
      const info = this.q('.px-cell .ex-cellinfo');
      const key = `${this.part}:${this.plant.id}:${Math.round(part.activity(s) * 50)}:${s.seeds}:${s.growth > 0}`;
      if (info.dataset.key !== key) {
        info.dataset.key = key;
        info.innerHTML = `<h2>${part.name}</h2><p>${part.intro}</p><p><b>In this plant now:</b> ${part.model(s)}</p>
          <p class="ex-small">The model computes this from the whole plant's light, soil and growth; the cell is not simulated on its own.</p>`;
      }
      const cv = this.q('.px-celldraw');
      const { ctx, w, h } = this.fit(cv, Math.min(420, Math.max(300, cv.clientWidth * 0.75)));
      ctx.fillStyle = col.dish;
      ctx.fillRect(0, 0, w, h);
      const a = Math.min(1, part.activity(s));
      const cw = w * 0.7, ch = (h - 70) * 0.85, x0 = (w - cw) / 2, y0 = 16;
      const rr = (x, y, ww, hh, r) => { ctx.beginPath(); ctx.roundRect(x, y, ww, hh, r); };
      const tm = this.frame;
      // Cell wall and membrane; the xylem is a dead, open-ended pipe.
      ctx.strokeStyle = '#b8c9a0'; ctx.lineWidth = 6;
      if (this.part === 'xylem') {
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + ch); ctx.moveTo(x0 + cw, y0); ctx.lineTo(x0 + cw, y0 + ch); ctx.stroke();
        ctx.strokeStyle = 'rgba(184,201,160,0.5)'; ctx.lineWidth = 3;
        for (let i = 1; i < 4; i++) { const yy = y0 + (ch * i) / 4; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + cw * 0.25, yy); ctx.moveTo(x0 + cw * 0.75, yy); ctx.lineTo(x0 + cw, yy); ctx.stroke(); }
        ctx.fillStyle = 'rgba(120,190,255,0.9)';
        for (let i = 0; i < 18; i++) {
          const u = ((tm * (0.002 + 0.02 * a) + i / 18) % 1);
          ctx.beginPath(); ctx.arc(x0 + cw * (0.3 + 0.4 * ((i * 37) % 10) / 10), y0 + ch - u * ch, 3, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        rr(x0, y0, cw, ch, 18); ctx.stroke();
        ctx.strokeStyle = 'rgba(232,239,233,0.5)'; ctx.lineWidth = 1.5;
        rr(x0 + 7, y0 + 7, cw - 14, ch - 14, 14); ctx.stroke();
        // Vacuole: violet when it stores toxin.
        ctx.fillStyle = this.part === 'defence' && s.poison ? 'rgba(169,127,242,0.45)' : 'rgba(150,190,230,0.18)';
        rr(x0 + cw * 0.18, y0 + ch * 0.2, cw * 0.5, ch * 0.55, 30); ctx.fill();
        // Nucleus (sieve tubes lose theirs).
        if (this.part !== 'phloem') {
          ctx.fillStyle = 'rgba(232,200,160,0.85)';
          ctx.beginPath(); ctx.arc(x0 + cw * 0.8, y0 + ch * 0.3, 14, 0, Math.PI * 2); ctx.fill();
          if (this.part === 'meristem' && a > 0.05 && Math.floor(tm / 40) % 2) {
            ctx.strokeStyle = '#fff6c2'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.moveTo(x0 + cw / 2, y0 + 10); ctx.lineTo(x0 + cw / 2, y0 + ch - 10); ctx.stroke(); ctx.setLineDash([]);
          }
        }
        if (this.part === 'leaf') {
          // Chloroplasts glow with photosynthesis.
          for (let i = 0; i < 16; i++) {
            const px = x0 + 20 + ((i * 53) % 100) / 100 * (cw - 40), py = y0 + 20 + ((i * 29) % 100) / 100 * (ch - 40);
            ctx.fillStyle = `rgba(92,196,109,${(0.35 + 0.65 * a).toFixed(2)})`;
            ctx.beginPath(); ctx.ellipse(px, py, 9, 5, i, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = 'rgba(255,190,90,0.9)';
          for (let i = 0; i < Math.round(10 * a); i++) {
            const u = ((tm * 0.01 + i / 10) % 1);
            ctx.beginPath(); ctx.arc(x0 + cw * 0.2 + u * cw * 0.7, y0 + ch * (0.3 + 0.4 * ((i * 7) % 10) / 10), 2.5, 0, Math.PI * 2); ctx.fill();
          }
        } else if (this.part === 'root') {
          ctx.strokeStyle = '#b8c9a0'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(x0 + cw, y0 + ch * 0.6); ctx.lineTo(w - 6, y0 + ch * 0.75); ctx.stroke();
          ctx.fillStyle = 'rgba(120,190,255,0.9)';
          for (let i = 0; i < Math.round(12 * a) + 1; i++) {
            const u = ((tm * 0.008 + i / 12) % 1);
            ctx.beginPath(); ctx.arc(w - 6 - u * (w - 6 - x0 - cw * 0.3), y0 + ch * (0.75 - 0.2 * u), 2.5, 0, Math.PI * 2); ctx.fill();
          }
        } else if (this.part === 'phloem') {
          ctx.fillStyle = 'rgba(255,190,90,0.9)';
          for (let i = 0; i < 18; i++) {
            const u = ((tm * (0.002 + 0.02 * a) + i / 18) % 1);
            ctx.beginPath(); ctx.arc(x0 + cw * (0.25 + 0.5 * ((i * 37) % 10) / 10), y0 + u * ch, 3, 0, Math.PI * 2); ctx.fill();
          }
        } else if (this.part === 'seed') {
          ctx.fillStyle = 'rgba(255,231,163,0.6)';
          ctx.beginPath(); ctx.ellipse(x0 + cw * 0.42, y0 + ch * 0.5, cw * 0.16, ch * 0.18, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      // Activity over time, from the recorded plant state.
      const H = this.h, n = H.len, ty = h - 40;
      ctx.strokeStyle = 'rgba(232,239,233,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(8, h - 8); ctx.lineTo(w - 8, h - 8); ctx.stroke();
      ctx.strokeStyle = '#e8efe9'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      const p = this.entry.world.p, full = p.plantGrow * (this.plant.poison ? p.toxinCost : 1);
      for (let k = 1; k < n; k++) {
        const i = this.slot(k), j = this.slot(k - 1);
        const st = {
          light: H.light[i], fert: H.fert[i], size: H.size[i], poison: this.plant.poison,
          growth: H.size[i] - H.size[j], growthRate: full > 0 ? (H.size[i] - H.size[j]) / (full * 0.85) : 0,
          seededRecently: H.seed[i] === 1, seeds: 0, sprouted: 0,
        };
        const v = Math.min(1, Math.max(0, part.activity(st)));
        const x = 8 + (k / (HIST - 1)) * (w - 16), y = h - 8 - v * (h - 8 - ty);
        if (k > 1) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(232,239,233,0.7)';
      ctx.font = `11px ${getComputedStyle(document.body).fontFamily}`;
      ctx.fillText(`activity now ${pct(a)}`, 8, ty - 6);
    }
  }

  function mixAlpha(colour, alpha) {
    if (!colour || colour[0] !== '#') return colour;
    const n = parseInt(colour.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  root.PlantExplorer = PlantExplorer;
})(typeof window !== 'undefined' ? window : this);
