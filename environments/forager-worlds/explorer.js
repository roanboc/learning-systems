// Zoom-in explorer: World → Organism → Brain → Cell.
//
// Opens over the page and follows one creature while the world keeps running.
//   Organism: the world as this creature sees it, and its senses → brain → actions.
//   Brain:    the living tissue (neurons, synapses, spikes) and a spike timeline.
//   Cell:     one neuron: membrane voltage, its firing set point, its synapses,
//             and a plain-language introduction to what that kind of cell does.
(function (root) {
  'use strict';

  const HIST = 400; // steps of history kept for the timeline and traces
  const SENSOR = 0, EXC = 1, INH = 2, MOTOR = 3;

  const CELL_INTRO = {
    eye: 'A light-sensing cell for one direction and one colour, like a cone cell in a retina. It fires faster the closer a plant of its colour sits inside its ray. Seven rays times two colours make the whole eye.',
    mouth: 'A contact cell, like a taste receptor on the lips. It fires while a plant of its colour is close enough to bite.',
    hunger: 'An interoceptive cell: it senses the body, not the world. It fires more as energy runs low.',
    pain: 'A pain cell. It fires in a burst right after the creature eats poison.',
    exc: 'An excitatory interneuron. Each of its spikes pushes the cells it connects to toward firing, so it passes signals on and mixes them.',
    inh: 'An inhibitory interneuron, a brake. Each of its spikes pushes the cells it connects to away from firing. Punishment strengthens a brake that was active just before a bad outcome.',
    turnLeft: 'A motor neuron driving the left-turn muscle. The body turns by the difference between left and right motor firing.',
    turnRight: 'A motor neuron driving the right-turn muscle. The body turns by the difference between left and right motor firing.',
    eat: 'The bite motor neuron. A bite happens only if it fires while a plant is at the mouth, so whether to eat is a decision.',
  };
  const HOMEOSTASIS = 'Every cell tries to fire near its own target rate. When it is too quiet it grows new connection points (spines and boutons) and gets wired to neighbours; when it is too busy it retracts them.';
  const LEARNING = 'Each synapse keeps a short memory of recent spike timing (its eligibility). When dopamine arrives after food, that memory becomes a lasting change in strength; after poison the change is reversed.';

  class Explorer {
    constructor(opts) {
      this.colours = opts.colours;   // function returning the page's colour tokens
      this.font = opts.font;
      this.onClose = opts.onClose || (() => {});
      this.entry = null;
      this.id = null;
      this.level = 'organism';
      this.cell = null;
      this.hits = [];
      this.speed = 1;
      this.buildDom();
    }

    get active() { return this.entry !== null; }

    buildDom() {
      const el = document.createElement('div');
      el.className = 'explorer';
      el.hidden = true;
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Organism explorer');
      el.innerHTML = `
        <div class="ex-bar">
          <nav class="ex-crumbs" aria-label="Zoom level"></nav>
          <div class="ex-tools">
            <label class="eyebrow" for="ex-speed">Speed</label>
            <select id="ex-speed">
              <option value="1" selected>1 step/frame</option>
              <option value="2">2 steps/frame</option>
              <option value="5">5 steps/frame</option>
            </select>
            <button type="button" class="ex-pause">Pause</button>
            <button type="button" class="ex-close" aria-label="Back to the worlds">Close</button>
          </div>
        </div>
        <div class="ex-status"></div>
        <section class="ex-level ex-organism">
          <div class="ex-grid">
            <figure class="ex-fig">
              <figcaption><b>Outside</b> · the world as this creature sees it. Its heading points up; the fan is its eye, one slice per ray.</figcaption>
              <canvas class="ex-outside" aria-label="The creature's surroundings and field of view"></canvas>
            </figure>
            <figure class="ex-fig">
              <figcaption><b>Inside</b> · senses feed the brain, the brain drives the muscles. Click the brain to go in, or any cell to meet it.</figcaption>
              <canvas class="ex-pipeline" aria-label="Senses, brain and actions"></canvas>
            </figure>
          </div>
          <figure class="ex-fig">
            <figcaption><b>Perceiving and acting over time</b> · each row is a sense or a muscle, each tick a spike. Green and violet lines mark meals of food and poison.</figcaption>
            <canvas class="ex-timeline-small" aria-label="Spike timeline of senses and muscles"></canvas>
          </figure>
          <div class="ex-facts"></div>
        </section>
        <section class="ex-level ex-brain" hidden>
          <figure class="ex-fig">
            <figcaption><b>Brain tissue</b> · senses on the left, interneurons in the middle, muscles on the right. Line width is synapse strength; red lines come from inhibitory cells. Cells flash when they spike. Click a cell to zoom in.</figcaption>
            <canvas class="ex-tissue" aria-label="Brain tissue"></canvas>
          </figure>
          <figure class="ex-fig">
            <figcaption><b>Every cell over time</b> · rows grouped as eye, body, interneurons, muscles. The bottom trace is dopamine: up after food, down after poison.</figcaption>
            <canvas class="ex-timeline" aria-label="Spike timeline of every neuron"></canvas>
          </figure>
          <p class="ex-note"></p>
        </section>
        <section class="ex-level ex-cell" hidden>
          <div class="ex-grid">
            <div class="ex-cellinfo"></div>
            <figure class="ex-fig">
              <figcaption><b>Membrane voltage</b> · charge builds up from inputs and leaks away; at the dashed threshold the cell spikes and resets.</figcaption>
              <canvas class="ex-voltage" aria-label="Membrane voltage trace"></canvas>
            </figure>
          </div>
          <div class="ex-grid">
            <div class="ex-syn ex-in"></div>
            <div class="ex-syn ex-out"></div>
          </div>
        </section>`;
      document.body.appendChild(el);
      this.el = el;
      this.q = (s) => el.querySelector(s);
      this.q('.ex-close').addEventListener('click', () => this.close());
      this.q('#ex-speed').addEventListener('change', (e) => { this.speed = parseInt(e.target.value, 10); });
      this.pauseBtn = this.q('.ex-pause');
      document.addEventListener('keydown', (e) => {
        if (!this.active || e.key !== 'Escape') return;
        if (this.level === 'cell') this.go('brain');
        else if (this.level === 'brain') this.go('organism');
        else this.close();
      });
      for (const sel of ['.ex-pipeline', '.ex-tissue', '.ex-timeline']) {
        this.q(sel).addEventListener('click', (e) => this.click(sel, e));
      }
      this.q('.ex-in').addEventListener('click', (e) => this.synClick(e));
      this.q('.ex-out').addEventListener('click', (e) => this.synClick(e));
    }

    // ---------- lifecycle ----------

    open(entry, creatureId, origin) {
      const c = entry.world.creatures.find((x) => x.id === creatureId);
      if (!c) return;
      this.entry = entry;
      this.id = creatureId;
      this.creature = c;
      this.diedAt = null;
      this.cell = null;
      this.resetHistory();
      this.el.hidden = false;
      document.body.classList.add('exploring');
      if (origin && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.el.style.transformOrigin = `${origin.x}px ${origin.y}px`;
        this.el.classList.remove('ex-zoom');
        void this.el.offsetWidth;
        this.el.classList.add('ex-zoom');
      }
      this.go('organism');
    }

    followNearest() {
      const w = this.entry.world, c = this.creature;
      let best = null, bd = Infinity;
      for (const o of w.creatures) {
        if (!!o.brain !== !!c.brain) continue;
        const d = w.delta(c.x, o.x) ** 2 + w.delta(c.y, o.y) ** 2;
        if (d < bd) { bd = d; best = o; }
      }
      if (!best) return;
      const level = this.level, cell = this.cell;
      this.open(this.entry, best.id, null);
      if (level !== 'organism' && best.brain) this.go(level, cell);
    }

    close() {
      this.entry = null;
      this.el.hidden = true;
      document.body.classList.remove('exploring');
      this.onClose();
    }

    go(level, cell) {
      if (level === 'brain' && !this.creature.brain) return;
      this.level = level;
      if (cell !== undefined) this.cell = cell;
      this.q('.ex-organism').hidden = level !== 'organism';
      this.q('.ex-brain').hidden = level !== 'brain';
      this.q('.ex-cell').hidden = level !== 'cell';
      this.renderCrumbs();
      this.el.scrollTop = 0;
      this.draw();
    }

    renderCrumbs() {
      const c = this.creature;
      const crumbs = [['world', this.entry.name], ['organism', `Creature #${c.id}`]];
      if (c.brain && (this.level === 'brain' || this.level === 'cell')) crumbs.push(['brain', 'Brain']);
      if (this.level === 'cell') crumbs.push(['cell', this.cellName(this.cell)]);
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

    // ---------- recording ----------

    resetHistory() {
      const b = this.creature.brain;
      const n = b ? b.n : 0;
      this.h = {
        len: 0, head: 0,
        v: new Float32Array(HIST * n),
        spk: new Uint8Array(HIST * n),
        da: new Float32Array(HIST),
        ev: new Uint8Array(HIST),   // 1 food, 2 poison
        energy: new Float32Array(HIST),
        lastEaten: this.creature.eaten,
        lastPoisoned: this.creature.poisoned,
      };
    }

    // Call after every step of the explored world.
    record() {
      if (!this.active || this.diedAt !== null) return;
      const w = this.entry.world;
      const c = this.creature;
      if (!w.creatures.includes(c)) { this.diedAt = w.t; return; }
      const h = this.h, b = c.brain, slot = h.head;
      if (b) {
        const n = b.n;
        for (let i = 0; i < n; i++) { h.v[slot * n + i] = b.v[i]; h.spk[slot * n + i] = b.spiked[i]; }
        h.da[slot] = b.dopamine;
      }
      h.ev[slot] = c.eaten > h.lastEaten ? 1 : c.poisoned > h.lastPoisoned ? 2 : 0;
      h.lastEaten = c.eaten; h.lastPoisoned = c.poisoned;
      h.energy[slot] = c.energy;
      h.head = (slot + 1) % HIST;
      if (h.len < HIST) h.len++;
    }

    // Index of the k-th oldest recorded step.
    slot(k) { return (this.h.head - this.h.len + k + HIST) % HIST; }

    // ---------- naming ----------

    rays() { return (this.creature.brain.nS - 4) / 2; }

    cellKind(i) {
      const b = this.creature.brain, R = this.rays();
      if (i < R * 2) return 'eye';
      if (i < R * 2 + 2) return 'mouth';
      if (i === R * 2 + 2) return 'hunger';
      if (i === R * 2 + 3) return 'pain';
      if (b.type[i] === EXC) return 'exc';
      if (b.type[i] === INH) return 'inh';
      return ['turnRight', 'turnLeft', 'eat'][i - b.firstMotor];
    }

    cellName(i) {
      const b = this.creature.brain, R = this.rays(), kind = this.cellKind(i);
      const colour = (k) => (k % 2 === 0 ? 'green' : 'violet');
      switch (kind) {
        case 'eye': {
          const r = Math.floor(i / 2), mid = (R - 1) / 2;
          const where = r === mid ? 'centre' : r < mid ? `${mid - r} right` : `${r - mid} left`;
          return `Eye cell, ray ${where}, ${colour(i)}`;
        }
        case 'mouth': return `Mouth cell, ${colour(i - R * 2)}`;
        case 'hunger': return 'Hunger cell';
        case 'pain': return 'Pain cell';
        case 'exc': return `Excitatory interneuron ${i - b.nS + 1}`;
        case 'inh': return `Inhibitory interneuron ${i - b.nS + 1}`;
        case 'turnLeft': return 'Motor neuron, turn left';
        case 'turnRight': return 'Motor neuron, turn right';
        default: return 'Motor neuron, eat';
      }
    }

    // ---------- input ----------

    canvasPoint(cv, e) {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    click(sel, e) {
      const cv = this.q(sel), p = this.canvasPoint(cv, e);
      let best = null, bd = Infinity;
      for (const h of this.hits) {
        if (h.canvas !== sel) continue;
        if (h.rect) {
          if (p.x >= h.rect[0] && p.x <= h.rect[0] + h.rect[2] && p.y >= h.rect[1] && p.y <= h.rect[1] + h.rect[3]) { best = h; bd = 0; }
          continue;
        }
        const d = (h.x - p.x) ** 2 + (h.y - p.y) ** 2;
        if (d < bd && d < (h.r + 6) ** 2) { bd = d; best = h; }
      }
      if (!best) return;
      if (best.go === 'brain') this.go('brain');
      else if (best.cell !== undefined) this.go('cell', best.cell);
    }

    synClick(e) {
      const t = e.target.closest('[data-cell]');
      if (t) this.go('cell', parseInt(t.dataset.cell, 10));
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

    draw() {
      if (!this.active) return;
      const col = this.colours();
      this.pauseBtn.textContent = this.paused() ? 'Play' : 'Pause';
      const status = this.q('.ex-status');
      if (this.diedAt !== null) {
        if (status.dataset.for !== String(this.id)) {
          status.dataset.for = String(this.id);
          status.innerHTML = `This creature died at t ${this.diedAt}, age ${this.creature.age}. What you see is its last moment. <button type="button" class="ex-next">Follow the nearest living creature</button>`;
          status.querySelector('.ex-next').addEventListener('click', () => this.followNearest());
        }
        status.hidden = false;
      } else { status.hidden = true; status.dataset.for = ''; }
      this.hits = [];
      if (this.level === 'organism') {
        this.drawOutside(col);
        this.drawPipeline(col);
        this.drawTimeline('.ex-timeline-small', col, true);
        this.renderFacts();
      } else if (this.level === 'brain') {
        this.drawTissue(col);
        this.drawTimeline('.ex-timeline', col, false);
        this.q('.ex-note').textContent = HOMEOSTASIS + ' ' + LEARNING;
      } else {
        this.drawCell(col);
      }
    }

    paused() { return this.isPaused ? this.isPaused() : false; }

    drawOutside(col) {
      const cv = this.q('.ex-outside');
      const { ctx, w, h } = this.fit(cv);
      const c = this.creature, world = this.entry.world, g = c.g;
      const view = g.senseRange * 1.35;
      const k = (Math.min(w, h) / 2) / view;
      ctx.fillStyle = col.dish;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(k, k);
      ctx.rotate(-c.heading - Math.PI / 2);   // heading points up

      // Field of view, one slice per ray, filled by what that ray reports.
      const half = g.fov / 2;
      const R = c.brain ? this.rays() : 2;
      for (let r = 0; r < R; r++) {
        const a0 = c.heading - half + (g.fov * r) / R;   // canvas angle runs clockwise from the right
        const a1 = a0 + g.fov / R;
        // Brain ray 0 is the most clockwise (rightmost) slice, so count from the other end.
        const ray = R - 1 - r;
        let gStr = 0, vStr = 0;
        if (c.brain) { gStr = c.drive[ray * 2]; vStr = c.drive[ray * 2 + 1]; }
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, g.senseRange, a0, a1);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.04;
        ctx.fill();
        if (gStr > 0) { ctx.fillStyle = col.green; ctx.globalAlpha = 0.25 * gStr + 0.05; ctx.fill(); }
        if (vStr > 0) { ctx.fillStyle = col.violet; ctx.globalAlpha = 0.25 * vStr + 0.05; ctx.fill(); }
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#cfe0d6';
        ctx.lineWidth = 1 / k;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Plants and other creatures, placed relative to this one.
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-c.heading - Math.PI / 2);
      for (const pl of world.plants) {
        const dx = world.delta(c.x, pl.x), dy = world.delta(c.y, pl.y);
        if (Math.abs(dx) > view * 1.5 || Math.abs(dy) > view * 1.5) continue;
        ctx.fillStyle = world.plantColour(pl) === 0 ? col.green : col.violet;
        ctx.beginPath(); ctx.arc(dx * k, dy * k, Math.max(2.5, Math.min(8, 2.5 * k)), 0, Math.PI * 2); ctx.fill();
      }
      for (const o of world.creatures) {
        if (o === c) continue;
        const dx = world.delta(c.x, o.x), dy = world.delta(c.y, o.y);
        if (Math.abs(dx) > view * 1.5 || Math.abs(dy) > view * 1.5) continue;
        this.triangle(ctx, dx * k, dy * k, o.heading, 6, '#8a9a93');
      }
      // Mouth reach and the body itself.
      ctx.strokeStyle = '#e8efe9';
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(0, 0, world.p.mouth * k, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      this.triangle(ctx, 0, 0, c.heading, 11, '#f4f8f5');
      ctx.restore();

      ctx.fillStyle = '#b7c4be';
      ctx.font = '12px ' + this.font;
      ctx.textAlign = 'left';
      ctx.fillText(`energy ${c.energy.toFixed(0)} · sight ${g.senseRange.toFixed(0)} · field ${(g.fov * 180 / Math.PI).toFixed(0)}°`, 10, h - 10);
    }

    triangle(ctx, x, y, heading, sz, fill) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(heading);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(sz * 1.5, 0); ctx.lineTo(-sz, sz * 0.9); ctx.lineTo(-sz * 0.4, 0); ctx.lineTo(-sz, -sz * 0.9);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // Recent firing of neuron i over the last `win` recorded steps (0..1).
    recentRate(i, win) {
      const b = this.creature.brain, h = this.h, n = b.n;
      const m = Math.min(win, h.len);
      if (!m) return 0;
      let s = 0;
      for (let k = h.len - m; k < h.len; k++) s += h.spk[this.slot(k) * n + i];
      return s / m;
    }

    drawPipeline(col) {
      const cv = this.q('.ex-pipeline');
      const { ctx, w, h } = this.fit(cv);
      ctx.fillStyle = col.dish;
      ctx.fillRect(0, 0, w, h);
      const c = this.creature;
      ctx.font = '12px ' + this.font;
      ctx.textBaseline = 'middle';

      if (!c.brain) { this.drawReflexPipeline(ctx, w, h, col); return; }
      const b = c.brain, R = this.rays();
      const colX = [w * 0.16, w * 0.5, w * 0.84];
      const top = 36, bottom = h - 20;

      ctx.fillStyle = '#b7c4be';
      ctx.textAlign = 'center';
      ctx.fillText('SENSES', colX[0], 16);
      ctx.fillText('BRAIN', colX[1], 16);
      ctx.fillText('ACTIONS', colX[2], 16);

      // Sensor cells: eye as a 2-column grid, then mouth, hunger, pain.
      const pos = [];
      const eyeH = (bottom - top) * 0.62;
      for (let i = 0; i < R * 2; i++) {
        const r = Math.floor(i / 2);
        pos[i] = [colX[0] - 10 + (i % 2) * 20, top + (r + 0.5) * eyeH / R];
      }
      const bodyTop = top + eyeH + 14;
      for (let k = 0; k < 4; k++) pos[R * 2 + k] = [colX[0] + (k < 2 ? -10 + k * 20 : -10 + (k - 2) * 20), bodyTop + (k < 2 ? 0 : 26) + 10];
      for (let k = 0; k < 3; k++) pos[b.firstMotor + k] = [colX[2], top + (k + 0.5) * (bottom - top) / 3];

      // Brain blob with live interneuron dots.
      const bx = colX[1], by = (top + bottom) / 2, brx = Math.min(w * 0.17, 110), bry = (bottom - top) * 0.42;
      const recentAll = [];
      for (let i = 0; i < b.n; i++) recentAll[i] = this.recentRate(i, 30);

      // Flows: sensors → brain, brain → motors, brightness = recent activity.
      for (let i = 0; i < b.nS; i++) {
        ctx.strokeStyle = '#9fb8b0';
        ctx.globalAlpha = 0.08 + Math.min(0.7, recentAll[i] * 3);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pos[i][0] + 6, pos[i][1]); ctx.lineTo(bx - brx * 0.9, by + (pos[i][1] - by) * 0.4); ctx.stroke();
      }
      for (let k = 0; k < 3; k++) {
        const i = b.firstMotor + k;
        ctx.globalAlpha = 0.1 + Math.min(0.8, recentAll[i] * 3);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx + brx * 0.9, by + (pos[i][1] - by) * 0.4); ctx.lineTo(pos[i][0] - 10, pos[i][1]); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#1a2420';
      ctx.strokeStyle = '#3a4a44';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(bx, by, brx, bry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let i = b.nS; i < b.firstMotor; i++) {
        const x = bx + (b.x[i] - 0.5) * brx * 1.6, y = by + (b.y[i] - 0.5) * bry * 1.6;
        ctx.fillStyle = b.type[i] === INH ? col.danger : '#a7b8b1';
        ctx.globalAlpha = b.spiked[i] ? 1 : 0.35;
        ctx.beginPath(); ctx.arc(x, y, b.spiked[i] ? 4 : 2.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#d6e2dc';
      ctx.textAlign = 'center';
      ctx.fillText(`${b.p.hidden} interneurons · ${b.synapseCount()} synapses`, bx, by + bry + 12 > h - 8 ? h - 8 : by + bry + 12);
      ctx.fillStyle = '#9fb8b0';
      ctx.fillText('click to enter', bx, by);
      this.hits.push({ canvas: '.ex-pipeline', x: bx, y: by, r: Math.min(brx, bry), go: 'brain' });

      // Cells.
      for (let i = 0; i < b.nS; i++) {
        const kind = this.cellKind(i);
        let fill = '#d8c690';
        if (kind === 'eye' || kind === 'mouth') fill = (i - (kind === 'mouth' ? R * 2 : 0)) % 2 === 0 ? col.green : col.violet;
        this.cellDot(ctx, pos[i][0], pos[i][1], 6, fill, b.spiked[i], c.drive[i]);
        this.hits.push({ canvas: '.ex-pipeline', x: pos[i][0], y: pos[i][1], r: 7, cell: i });
      }
      ctx.fillStyle = '#b7c4be';
      ctx.textAlign = 'center';
      ctx.fillText('eye', colX[0], top - 8 + 0);
      ctx.textAlign = 'left';
      ctx.fillText('mouth', colX[0] + 20, bodyTop + 10);
      ctx.fillText('hunger, pain', colX[0] + 20, bodyTop + 36);
      const labels = ['turn right', 'turn left', 'eat'];
      const motorTrace = [c.motorL, c.motorR, null];
      for (let k = 0; k < 3; k++) {
        const i = b.firstMotor + k;
        this.cellDot(ctx, pos[i][0], pos[i][1], 10, '#e8efe9', b.spiked[i], null);
        this.hits.push({ canvas: '.ex-pipeline', x: pos[i][0], y: pos[i][1], r: 11, cell: i });
        ctx.fillStyle = '#d6e2dc';
        ctx.textAlign = 'center';
        ctx.fillText(labels[k], pos[i][0], pos[i][1] + 22);
        // Muscle bar: smoothed motor drive.
        const v = motorTrace[k] === null ? recentAll[i] * 6 : motorTrace[k] / 4;
        ctx.fillStyle = '#2b3732';
        ctx.fillRect(pos[i][0] - 30, pos[i][1] + 32, 60, 5);
        ctx.fillStyle = col.accentDark || '#6db6b8';
        ctx.fillRect(pos[i][0] - 30, pos[i][1] + 32, 60 * Math.min(1, v), 5);
      }
    }

    cellDot(ctx, x, y, r, fill, spiked, drive) {
      ctx.globalAlpha = spiked ? 1 : 0.3 + (drive ? 0.5 * drive : 0);
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.arc(x, y, spiked ? r + 2 : r, 0, Math.PI * 2); ctx.fill();
      if (spiked) {
        ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    drawReflexPipeline(ctx, w, h, col) {
      const c = this.creature, g = c.g;
      ctx.fillStyle = '#d6e2dc';
      ctx.textAlign = 'center';
      const lines = [
        'This creature has no brain. It runs on inherited instincts:',
        '',
        `its two eyes (left and right half of its view) add up the green and violet plants they see`,
        `green pull ${g.wGreen.toFixed(2)} · violet pull ${g.wViolet.toFixed(2)}  (positive = approach)`,
        `it turns toward the side with the stronger pull (gain ${g.turnGain.toFixed(2)})`,
        `bites a plant only if its colour's pull is positive`,
        '',
        'Nothing changes during its life; only its children can differ.',
        'Zoom into a creature from a Brain world to see neurons.',
      ];
      lines.forEach((t, k) => ctx.fillText(t, w / 2, h * 0.22 + k * 20));
    }

    drawTimeline(sel, col, sensesOnly) {
      const cv = this.q(sel);
      const c = this.creature, b = c.brain;
      if (!b) { const { ctx, w, h } = this.fit(cv, 60); ctx.fillStyle = col.dish; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#b7c4be'; ctx.font = '12px ' + this.font; ctx.textAlign = 'center'; ctx.fillText('Instinct creatures have no spikes to show.', w / 2, 32); return; }
      const R = this.rays();
      let rows = [];
      if (sensesOnly) {
        for (let i = 0; i < b.nS; i++) rows.push(i);
        for (let k = 0; k < 3; k++) rows.push(b.firstMotor + k);
      } else {
        for (let i = 0; i < b.n; i++) rows.push(i);
      }
      const rowH = sensesOnly ? 9 : 6;
      const daH = sensesOnly ? 0 : 40;
      const labelW = 86;
      const H = rows.length * rowH + daH + 26;
      const { ctx, w } = this.fit(cv, H);
      ctx.fillStyle = col.dish;
      ctx.fillRect(0, 0, w, H);
      const hst = this.h, n = b.n;
      const plotW = w - labelW - 8;
      const x = (k) => labelW + (k + HIST - hst.len) / HIST * plotW;

      // Group bands and labels.
      const groups = [];
      const groupOf = (i) => i < R * 2 ? 'eye' : i < b.nS ? 'body' : i < b.firstMotor ? 'interneurons' : 'muscles';
      rows.forEach((i, r) => {
        const gname = groupOf(i);
        if (!groups.length || groups[groups.length - 1].name !== gname) groups.push({ name: gname, from: r, to: r });
        else groups[groups.length - 1].to = r;
      });
      ctx.font = '11px ' + this.font;
      ctx.textBaseline = 'middle';
      groups.forEach((gr, k) => {
        const y0 = 8 + gr.from * rowH, y1 = 8 + (gr.to + 1) * rowH;
        if (k % 2 === 0) { ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.03; ctx.fillRect(labelW, y0, plotW, y1 - y0); ctx.globalAlpha = 1; }
        ctx.fillStyle = '#b7c4be';
        ctx.textAlign = 'right';
        ctx.fillText(gr.name, labelW - 8, (y0 + y1) / 2);
      });

      // Meals.
      for (let k = 0; k < hst.len; k++) {
        const ev = hst.ev[this.slot(k)];
        if (!ev) continue;
        ctx.fillStyle = ev === 1 ? col.green : col.violet;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x(k) - 1, 4, 2, H - 26);
      }
      ctx.globalAlpha = 1;

      // Spikes.
      rows.forEach((i, r) => {
        const y = 8 + r * rowH;
        const kind = this.cellKind(i);
        let fill = '#cfe0d6';
        if (kind === 'eye') fill = i % 2 === 0 ? col.green : col.violet;
        else if (kind === 'mouth') fill = (i - R * 2) === 0 ? col.green : col.violet;
        else if (kind === 'inh') fill = col.danger;
        else if (kind === 'hunger' || kind === 'pain') fill = '#d8c690';
        if (i === this.cell && this.level !== 'organism') { ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.08; ctx.fillRect(labelW, y, plotW, rowH); ctx.globalAlpha = 1; }
        ctx.fillStyle = fill;
        for (let k = 0; k < hst.len; k++) {
          if (hst.spk[this.slot(k) * n + i]) ctx.fillRect(x(k), y + 1, Math.max(1.2, plotW / HIST), rowH - 2);
        }
        this.hits.push({ canvas: sel, rect: [0, y, w, rowH], cell: i });
      });

      // Dopamine trace.
      if (daH) {
        const y0 = 8 + rows.length * rowH + daH / 2 + 4;
        ctx.strokeStyle = '#3a4a44';
        ctx.beginPath(); ctx.moveTo(labelW, y0); ctx.lineTo(labelW + plotW, y0); ctx.stroke();
        ctx.strokeStyle = '#f0d27a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let k = 0; k < hst.len; k++) {
          const v = Math.max(-1, Math.min(1, hst.da[this.slot(k)] / 3));
          const yy = y0 - v * (daH / 2 - 2);
          if (k === 0) ctx.moveTo(x(k), yy); else ctx.lineTo(x(k), yy);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = '#b7c4be';
        ctx.textAlign = 'right';
        ctx.fillText('dopamine', labelW - 8, y0);
      }
      ctx.fillStyle = '#7d8d86';
      ctx.textAlign = 'left';
      ctx.fillText(`last ${HIST} steps →  now`, labelW, H - 9);
    }

    renderFacts() {
      const c = this.creature, g = c.g, b = c.brain;
      const facts = [
        ['Age', `${c.age} steps`], ['Generation', c.gen], ['Energy', c.energy.toFixed(0)],
        ['Meals', `${c.eaten} food, ${c.poisoned} poison`],
        ['Speed', g.speed.toFixed(2)], ['Splits at energy', g.reproEnergy.toFixed(0)],
      ];
      if (b) {
        let gw = 0, vw = 0;
        const R = this.rays(), eat = b.firstMotor + 2;
        for (const s of b.inList[eat]) { if (b.pre[s] === R * 2) gw += b.w[s]; else if (b.pre[s] === R * 2 + 1) vw += b.w[s]; }
        facts.push(['Bite drive now', `green ${gw.toFixed(2)} · violet ${vw.toFixed(2)}`]);
        if (g.biteGreen !== undefined) {
          // Genes: what it was born with, so learned change is visible.
          facts.push(['Born with bite drive', `green ${g.biteGreen.toFixed(2)} · violet ${g.biteViolet.toFixed(2)}`]);
          facts.push(['Learning rate (gene)', g.learnRate.toFixed(3)]);
          facts.push(['Interneurons (gene)', Math.round(g.hidden)]);
        }
        facts.push(['Food is now', this.entry.world.foodColour === 0 ? 'green' : 'violet']);
      }
      this.q('.ex-facts').innerHTML = facts.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');
    }

    drawTissue(col) {
      const cv = this.q('.ex-tissue');
      const w0 = cv.clientWidth;
      const { ctx, w, h } = this.fit(cv, Math.max(320, Math.min(520, w0 * 0.55)));
      const b = this.creature.brain, R = this.rays();
      ctx.fillStyle = col.dish;
      ctx.fillRect(0, 0, w, h);
      const padX = Math.min(130, w * 0.18), padY = 26;
      const X = (i) => padX + b.x[i] * (w - padX * 2);
      const Y = (i) => padY + b.y[i] * (h - padY * 2);
      const body = (i) => i >= R * 2 && i < b.nS;
      const sx = (i) => body(i) ? X(i) - 50 : i < b.nS ? X(i) - (i % 2) * 16 : X(i);
      const sy = (i) => body(i) ? padY + (h - padY * 2) * (0.3 + 0.13 * (i - R * 2)) : Y(i);
      const sel = this.cell;
      for (let s = 0; s < b.w.length; s++) {
        const a = b.pre[s], d = b.post[s];
        const touches = sel !== null && (a === sel || d === sel);
        ctx.strokeStyle = b.type[a] === INH ? col.danger : '#9fb8b0';
        ctx.globalAlpha = Math.min(0.95, (touches ? 0.5 : 0.12) + b.w[s] / b.p.maxWeight * 0.8);
        ctx.lineWidth = 0.6 + 3 * b.w[s] / b.p.maxWeight;
        ctx.beginPath(); ctx.moveTo(sx(a), sy(a)); ctx.lineTo(sx(d), sy(d)); ctx.stroke();
        if (b.spiked[a]) {
          // A spike travelling: a bright dot along the synapse.
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc((sx(a) * 2 + sx(d)) / 3, (sy(a) * 2 + sy(d)) / 3, 1.8, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < b.n; i++) {
        const kind = this.cellKind(i);
        let fill = '#7f918a';
        if (kind === 'eye') fill = i % 2 === 0 ? col.green : col.violet;
        else if (kind === 'mouth') fill = i - R * 2 === 0 ? col.green : col.violet;
        else if (kind === 'hunger' || kind === 'pain') fill = '#d8c690';
        else if (kind === 'inh') fill = col.danger;
        else if (b.type[i] === MOTOR) fill = '#e8efe9';
        const r = b.type[i] === MOTOR ? 9 : 5.5;
        this.cellDot(ctx, sx(i), sy(i), r, fill, b.spiked[i], null);
        if (i === sel) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx(i), sy(i), r + 5, 0, Math.PI * 2); ctx.stroke(); }
        this.hits.push({ canvas: '.ex-tissue', x: sx(i), y: sy(i), r: r + 2, cell: i });
      }
      ctx.fillStyle = '#b7c4be';
      ctx.font = '12px ' + this.font;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ['turn right', 'turn left', 'eat'].forEach((label, k) => ctx.fillText(label, X(b.firstMotor + k) + 16, Y(b.firstMotor + k)));
      ctx.textAlign = 'center';
      ctx.fillText('eye', X(0) - 8, 12);
      ctx.textAlign = 'right';
      ['mouth', '', 'hunger', 'pain'].forEach((label, k) => label && ctx.fillText(label, sx(R * 2 + k) - 12, sy(R * 2 + k)));
    }

    drawCell(col) {
      const b = this.creature.brain, i = this.cell, kind = this.cellKind(i);
      const rate = b.rate[i], target = b.target[i];
      const outs = b.outList[i], ins = b.inList[i];
      const isSensor = b.type[i] === SENSOR;
      const homeo = isSensor
        ? 'Sensory cells are driven by the world, so they keep a fixed number of outgoing connection points.'
        : rate < target * 0.9 ? 'It is firing below its target, so it is growing new connection points.'
        : rate > target * 1.1 ? 'It is firing above its target, so it is retracting connection points.'
        : 'It is firing close to its target, so its wiring is stable.';
      const info = this.q('.ex-cellinfo');
      info.innerHTML = `
        <h2>${this.cellName(i)}</h2>
        <p>${CELL_INTRO[kind]}</p>
        <dl class="ex-dl">
          <div><dt>Firing now</dt><dd>${(rate * 100).toFixed(1)} spikes per 100 steps</dd></div>
          ${isSensor ? '' : `<div><dt>Target</dt><dd>${(target * 100).toFixed(1)} per 100 steps</dd></div>`}
          <div><dt>Outgoing synapses</dt><dd>${outs.length}${isSensor ? '' : ` of ${Math.floor(b.axEl[i])} connection points`}</dd></div>
          ${isSensor ? '' : `<div><dt>Incoming synapses</dt><dd>${ins.length} of ${Math.floor(b.denEl[i])} connection points</dd></div>`}
        </dl>
        <p class="ex-small">${homeo} ${HOMEOSTASIS}</p>`;

      const cv = this.q('.ex-voltage');
      const { ctx, w, h } = this.fit(cv, 220);
      ctx.fillStyle = col.dish;
      ctx.fillRect(0, 0, w, h);
      const hst = this.h, n = b.n;
      const pad = 12, plotW = w - pad * 2;
      const x = (k) => pad + (k + HIST - hst.len) / HIST * plotW;
      const top = 20, bot = h - 34;
      const Y = (v) => bot - Math.max(0, Math.min(1.25, v)) / 1.25 * (bot - top);
      for (let k = 0; k < hst.len; k++) {
        const ev = hst.ev[this.slot(k)];
        if (!ev) continue;
        ctx.fillStyle = ev === 1 ? col.green : col.violet;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x(k) - 1, top, 2, bot - top);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#e07a62';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(pad, Y(b.p.threshold)); ctx.lineTo(w - pad, Y(b.p.threshold)); ctx.stroke();
      ctx.setLineDash([]);
      if (isSensor) {
        ctx.fillStyle = '#cfe0d6';
        for (let k = 0; k < hst.len; k++) if (hst.spk[this.slot(k) * n + i]) ctx.fillRect(x(k), top + 10, 1.5, bot - top - 10);
        ctx.fillStyle = '#b7c4be';
        ctx.font = '12px ' + this.font;
        ctx.textAlign = 'left';
        ctx.fillText('Sensory cells fire straight from the stimulus; each line is a spike.', pad, h - 12);
      } else {
        ctx.strokeStyle = '#cfe0d6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let k = 0; k < hst.len; k++) {
          const s = this.slot(k);
          const v = hst.spk[s * n + i] ? 1.25 : hst.v[s * n + i];
          if (k === 0) ctx.moveTo(x(k), Y(v)); else ctx.lineTo(x(k), Y(v));
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = '#b7c4be';
        ctx.font = '12px ' + this.font;
        ctx.textAlign = 'left';
        ctx.fillText('threshold', pad + 4, Y(b.p.threshold) - 8);
        ctx.fillText(`last ${HIST} steps → now · green and violet lines are meals`, pad, h - 12);
      }

      const synList = (list, side) => {
        const rows = list.map((s) => ({ s, other: side === 'in' ? b.pre[s] : b.post[s], w: b.w[s], e: b.elig[s] }))
          .sort((a, z) => z.w - a.w).slice(0, 14);
        const head = side === 'in'
          ? `<h3>Inputs · ${list.length}</h3><p class="ex-small">Cells that talk to this one. ${LEARNING}</p>`
          : `<h3>Outputs · ${list.length}</h3><p class="ex-small">Cells this one talks to. Click any cell to zoom to it.</p>`;
        if (!rows.length) return head + '<p class="ex-small">None yet.</p>';
        return head + '<ul>' + rows.map((r) => {
          const inh = b.type[side === 'in' ? r.other : i] === INH;
          const pct = Math.round(r.w / b.p.maxWeight * 100);
          const trend = r.e > 0.05 ? 'primed to strengthen' : r.e < -0.05 ? 'primed to weaken' : '';
          return `<li><button type="button" data-cell="${r.other}">${this.cellName(r.other)}</button>
            <span class="ex-bar-w"><i style="width:${pct}%;${inh ? 'background:var(--danger)' : ''}"></i></span>
            <span class="ex-small">${r.w.toFixed(2)}${inh ? ' brake' : ''}${trend ? ' · ' + trend : ''}</span></li>`;
        }).join('') + '</ul>';
      };
      // Rebuild the lists only when they change, so buttons stay clickable.
      const sig = (list) => list.map((s) => `${s}:${b.w[s].toFixed(2)}:${b.elig[s] > 0.05 ? 1 : b.elig[s] < -0.05 ? -1 : 0}`).join(',');
      const inSig = sig(ins), outSig = sig(outs);
      if (this.inSig !== inSig || this.lastCell !== i) { this.q('.ex-in').innerHTML = synList(ins, 'in'); this.inSig = inSig; }
      if (this.outSig !== outSig || this.lastCell !== i) { this.q('.ex-out').innerHTML = synList(outs, 'out'); this.outSig = outSig; }
      this.lastCell = i;
    }
  }

  root.Explorer = Explorer;
})(typeof self !== 'undefined' ? self : this);
