// Tissue Lab explorer: zoom from the bench into one tissue, then into one cell.
// Levels: tissue (the whole slice with field overlays and tools) and cell (a
// neuron, astrocyte or microglia with its neighbourhood, traces and links).
(function (root) {
  'use strict';

  const { FIELDS, drawTissue, drawChart } = root.TissueDraw;
  const FAST = 400;   // steps of membrane trace kept
  const SLOW = 600;   // samples of slow traces kept (one per 10 steps)

  const INTRO = {
    exc: 'An excitatory neuron. When it fires it pushes the cells it connects to toward firing. Like every neuron here it wants to fire at its own target rate: too quiet and it sprouts new connection points, too busy and it pulls them back. It needs growth factor to survive, and it gets more when its inputs help it fire.',
    inh: 'An inhibitory interneuron. When it fires it holds the cells it connects to back. Inhibition keeps the tissue from running away into bursts and decides when other cells can fire. It follows the same rules for growth and survival as excitatory cells.',
    newborn: 'A newborn neuron from the stem-cell niche. It first migrates along blood vessels toward injured or sparse tissue. For a window after it settles it is extra excitable and keeps sprouting connection points. When the window closes it must be part of active circuits, or it dies for lack of growth factor.',
    astro: 'An astrocyte. It owns a territory of tissue. Its end-feet touch blood vessels, where it draws glucose and hands it out as lactate to the neurons in its territory that work hardest. It also secretes a little growth factor and engulfs some tagged synapses.',
    micro: 'A microglial cell, the brain\'s resident immune cell. It wanders, drawn by eat-me signals: complement tags on synapses that have gone unused, and debris from dead cells. It engulfs tagged synapses unless recent use protects them, and clears debris so new connections can form there.',
  };
  const DEATH = { starved: 'ran out of energy', trophic: 'lost its growth factor support', lesion: 'was killed by the lesion' };

  class TissueExplorer {
    constructor(opts) {
      this.colours = opts.colours;
      this.font = opts.font;
      this.onClose = opts.onClose || (() => {});
      this.isPaused = () => false;
      this.active = false;
      this.entry = null;
      this.level = 'tissue';
      this.cell = null;       // {kind, id}
      this.field = FIELDS[0];
      this.tool = 'inspect';
      this.speed = 2;
      this.brush = null;
      this.frame = 0;
      this.build();
    }

    build() {
      const el = document.createElement('div');
      el.className = 'explorer';
      el.hidden = true;
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Tissue explorer');
      el.innerHTML = `
        <div class="ex-bar">
          <nav class="ex-crumbs" aria-label="Zoom level"></nav>
          <div class="ex-tools">
            <button type="button" class="ex-pause"></button>
            <label class="eyebrow" for="ex-speed">Speed</label>
            <select id="ex-speed">
              <option value="1">1 step/frame</option>
              <option value="2" selected>2 steps/frame</option>
              <option value="5">5 steps/frame</option>
              <option value="20">20 steps/frame</option>
              <option value="60">60 steps/frame</option>
            </select>
            <button type="button" class="ex-close">Back to the bench</button>
          </div>
        </div>
        <div class="ex-level"></div>`;
      document.body.appendChild(el);
      this.el = el;
      this.crumbs = el.querySelector('.ex-crumbs');
      this.body = el.querySelector('.ex-level');
      this.pauseBtn = el.querySelector('.ex-pause');
      el.querySelector('#ex-speed').addEventListener('change', (e) => { this.speed = parseInt(e.target.value, 10); });
      el.querySelector('.ex-close').addEventListener('click', () => this.close());
      document.addEventListener('keydown', (e) => {
        if (!this.active || e.key !== 'Escape') return;
        if (this.level === 'cell') this.showTissue(); else this.close();
      });
    }

    // ---------- navigation ----------

    open(entry, origin, cell) {
      this.entry = entry;
      this.active = true;
      this.el.hidden = false;
      document.body.classList.add('exploring');
      if (origin) {
        this.el.style.transformOrigin = `${origin.x}px ${origin.y}px`;
        this.el.classList.remove('ex-zoom'); void this.el.offsetWidth; this.el.classList.add('ex-zoom');
      }
      if (cell) this.showCell(cell.kind, cell.id); else this.showTissue();
    }

    close() {
      this.active = false;
      this.el.hidden = true;
      document.body.classList.remove('exploring');
      this.onClose();
    }

    get tissue() { return this.entry.tissue; }

    renderCrumbs() {
      const parts = [['bench', 'Bench'], ['tissue', this.entry.name]];
      if (this.level === 'cell') parts.push(['cell', this.cellLabel()]);
      this.crumbs.innerHTML = '';
      parts.forEach(([key, label], i) => {
        if (i) { const s = document.createElement('span'); s.className = 'sep'; s.textContent = '›'; this.crumbs.appendChild(s); }
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = label;
        if (i === parts.length - 1) b.setAttribute('aria-current', 'page');
        b.addEventListener('click', () => { if (key === 'bench') this.close(); else if (key === 'tissue') this.showTissue(); });
        this.crumbs.appendChild(b);
      });
    }

    cellLabel() {
      const c = this.cell;
      if (!c) return '';
      if (c.kind === 'astro') return `Astrocyte #${c.id}`;
      if (c.kind === 'micro') return `Microglia #${c.id}`;
      const n = this.findCell();
      const kind = n ? this.neuronKind(n) : c.lastKind || 'exc';
      return `${kind === 'inh' ? 'Inhibitory' : kind === 'newborn' ? 'Newborn' : 'Excitatory'} neuron #${c.id}`;
    }

    neuronKind(n) { return n.newborn || n.migrating ? 'newborn' : n.type === 2 ? 'inh' : 'exc'; }

    findCell() {
      const c = this.cell, T = this.tissue;
      if (!c) return null;
      if (c.kind === 'astro') return T.astros.find((a) => a.id === c.id) || null;
      if (c.kind === 'micro') return T.microglia.find((m) => m.id === c.id) || null;
      return T.neuronById(c.id);
    }

    // ---------- tissue level ----------

    showTissue() {
      this.level = 'tissue';
      this.cell = null;
      this.renderCrumbs();
      const fieldChips = FIELDS.map((f, i) => `<button type="button" class="chip" data-field="${i}" aria-pressed="${f === this.field}">${f.label}</button>`).join('');
      const toolChips = [['inspect', 'Inspect a cell'], ['lesion', 'Lesion'], ['stimulate', 'Stimulate']]
        .map(([k, l]) => `<button type="button" class="chip" data-tool="${k}" aria-pressed="${k === this.tool}">${l}</button>`).join('');
      this.body.innerHTML = `
        <div class="ex-grid ex-grid-tissue">
          <figure class="ex-fig">
            <canvas class="ex-tissue" width="900" height="900" aria-label="The tissue slice"></canvas>
            <figcaption class="ex-tool-note"></figcaption>
          </figure>
          <div class="ex-side">
            <div class="ex-row"><span class="eyebrow">Click does</span><div class="chips">${toolChips}</div></div>
            <div class="ex-row"><span class="eyebrow">Overlay</span><div class="chips">${fieldChips}</div></div>
            <p class="ex-note ex-field-note"></p>
            <div class="ex-facts"></div>
            <div class="ex-mini">
              <figure class="ex-fig"><figcaption><b>Neurons</b>, newborn ones in green</figcaption><canvas class="ex-chart" data-k="neurons"></canvas></figure>
              <figure class="ex-fig"><figcaption><b>Synapses</b> per neuron</figcaption><canvas class="ex-chart" data-k="perNeuron"></canvas></figure>
              <figure class="ex-fig"><figcaption><b>Firing</b> against the target rate (dashed)</figcaption><canvas class="ex-chart" data-k="rate"></canvas></figure>
            </div>
          </div>
        </div>`;
      const cv = this.body.querySelector('.ex-tissue');
      this.tissueCanvas = cv;
      this.body.querySelectorAll('[data-field]').forEach((b) => b.addEventListener('click', () => {
        this.field = FIELDS[+b.dataset.field];
        this.body.querySelectorAll('[data-field]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        this.draw();
      }));
      this.body.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => {
        this.tool = b.dataset.tool;
        this.body.querySelectorAll('[data-tool]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        this.draw();
      }));
      const toTissue = (e) => {
        const r = cv.getBoundingClientRect();
        return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
      };
      cv.addEventListener('pointermove', (e) => {
        const [x, y] = toTissue(e);
        this.brush = this.tool === 'inspect' ? null : { kind: this.tool, x, y, r: this.tool === 'lesion' ? 0.1 : 0.12 };
        if (this.isPaused()) this.draw();
      });
      cv.addEventListener('pointerleave', () => { this.brush = null; });
      cv.addEventListener('click', (e) => {
        const [x, y] = toTissue(e);
        if (this.tool === 'lesion') this.tissue.lesion(x, y, 0.1);
        else if (this.tool === 'stimulate') this.tissue.stimulate(x, y, 0.12, 1500);
        else {
          const hit = pickCell(this.tissue, x, y, 0.035);
          if (hit) { this.showCell(hit.kind, hit.id); return; }
        }
        this.draw();
      });
      this.draw();
    }

    drawTissueLevel() {
      const T = this.tissue, col = this.colours();
      const cv = this.tissueCanvas;
      drawTissue(cv.getContext('2d'), T, cv.width, cv.height, col, { field: this.field, detail: true, brush: this.brush });
      const note = {
        inspect: 'Click any neuron, astrocyte or microglia to zoom into it.',
        lesion: 'Click to kill every neuron in the circle. Neighbours lose input and rewire; microglia come to clear the debris; the niche makes more newborns.',
        stimulate: 'Click to drive a patch of tissue harder for 1,500 steps. Busy synapses release more growth factor there, and the niche makes more newborns.',
      }[this.tool];
      this.body.querySelector('.ex-tool-note').textContent = note;
      this.body.querySelector('.ex-field-note').textContent = this.field.note || 'Choose an overlay to see the chemistry the cells respond to.';
      if (this.frame % 6 === 0) {
        const h = T.history[T.history.length - 1], c = T.counts;
        const settled = T.neurons.filter((n) => !n.migrating).length;
        const facts = [
          ['Neurons', `${T.neurons.length}`],
          ['Newborn (in window)', `${h.newborn}`],
          ['Synapses', `${T.synapses.length}`],
          ['Tagged synapses', `${h.tagged}`],
          ['Firing / target', h.rate.toFixed(2)],
          ['Mean energy', h.energy.toFixed(2)],
          ['Died: energy', `${c.starved}`],
          ['Died: growth factor', `${c.trophic}`],
          ['Killed by lesions', `${c.lesioned}`],
          ['Pruned by microglia', `${c.eatenMicroglia}`],
          ['Pruned by astrocytes', `${c.eatenAstro}`],
          ['Debris waiting', `${T.debris.length}`],
        ];
        this.body.querySelector('.ex-facts').innerHTML = facts.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');
        void settled;
        const series = (key) => [{ colour: col.series[this.entry.slot], points: T.history.map((r) => [r.t, r[key]]) }];
        const charts = this.body.querySelectorAll('.ex-chart');
        const marks = T.events.map((e) => ({ t: e.t, colour: e.kind === 'lesion' ? col.inh : col.focus }));
        for (const ch of charts) {
          const k = ch.dataset.k;
          const s = series(k);
          if (k === 'neurons') s.push({ colour: col.newborn, points: T.history.map((r) => [r.t, r.newborn]), width: 1.2, noDot: true });
          drawChart(ch, s, { colours: col, font: this.font, fmt: (v) => (k === 'neurons' ? v.toFixed(0) : v.toFixed(1)), ref: k === 'rate' ? 1 : undefined, marks, ticks: 3, padLeft: 36 });
        }
      }
    }

    // ---------- cell level ----------

    showCell(kind, id) {
      this.level = 'cell';
      this.cell = { kind, id, fast: [], slow: [], lastKind: null, died: null };
      const n = this.findCell();
      if (kind === 'neuron' && n) this.cell.lastKind = this.neuronKind(n);
      this.renderCrumbs();
      const isNeuron = kind === 'neuron';
      this.body.innerHTML = `
        <div class="ex-grid">
          <figure class="ex-fig">
            <canvas class="ex-near" width="640" height="640" aria-label="The cell and its neighbourhood"></canvas>
            <figcaption>The neighbourhood, centred on this cell. Its own synapses are drawn bright. Click another cell to move to it.</figcaption>
          </figure>
          <div class="ex-cellinfo">
            <h2 class="ex-cell-title"></h2>
            <p class="ex-cell-intro"></p>
            <p class="ex-status"></p>
            <dl class="ex-dl"></dl>
            ${isNeuron ? `
            <figure class="ex-fig"><figcaption><b>Membrane voltage</b> against threshold (dashed); spikes as tall strokes</figcaption><canvas class="ex-trace" data-k="v"></canvas></figure>
            <figure class="ex-fig"><figcaption><b>Firing</b> against target (dashed at 1), <b style="color:var(--newborn)">growth factor</b> against need, and <b style="color:var(--astro)">energy</b></figcaption><canvas class="ex-trace" data-k="slow"></canvas></figure>` : ''}
          </div>
        </div>
        ${isNeuron ? `<div class="ex-grid">
          <div class="ex-syn"><h3>Inputs</h3><ul class="ex-in"></ul></div>
          <div class="ex-syn"><h3>Outputs</h3><ul class="ex-out"></ul></div>
        </div>` : ''}`;
      const cv = this.body.querySelector('.ex-near');
      this.nearCanvas = cv;
      cv.addEventListener('click', (e) => {
        const r = cv.getBoundingClientRect();
        const v = this.nearView;
        if (!v) return;
        const x = v.x0 + (e.clientX - r.left) / r.width * v.size, y = v.y0 + (e.clientY - r.top) / r.height * v.size;
        const hit = pickCell(this.tissue, x, y, v.size * 0.04);
        if (hit && hit.id !== this.cell.id) this.showCell(hit.kind, hit.id);
      });
      this.draw();
    }

    // Called once per simulation step of the watched tissue.
    record() {
      if (!this.active || this.level !== 'cell' || this.cell.kind !== 'neuron') return;
      const n = this.findCell(), c = this.cell, T = this.tissue;
      if (!n) {
        if (!c.died) {
          const g = T.graves.find((d) => d.id === c.id);
          c.died = g ? g.cause : 'gone';
        }
        return;
      }
      c.fast.push([T.t, n.spiked ? 1.35 : n.v]);
      if (c.fast.length > FAST) c.fast.shift();
      if (T.t % 10 === 0) {
        c.slow.push([T.t, n.rate / T.p.targetRate, n.trophic / T.p.trophicNeed, n.energy]);
        if (c.slow.length > SLOW) c.slow.shift();
      }
    }

    drawCellLevel() {
      const T = this.tissue, col = this.colours(), c = this.cell;
      const cell = this.findCell();
      const title = this.body.querySelector('.ex-cell-title');
      title.textContent = this.cellLabel();
      const status = this.body.querySelector('.ex-status');

      // Neighbourhood view follows the cell (or stays where it was last seen).
      if (cell) c.at = [cell.x, cell.y];
      const size = 0.34;
      const at = c.at || [0.5, 0.5];
      const view = { x0: clampV(at[0] - size / 2, 0, 1 - size), y0: clampV(at[1] - size / 2, 0, 1 - size), size };
      this.nearView = view;
      drawTissue(this.nearCanvas.getContext('2d'), T, this.nearCanvas.width, this.nearCanvas.height, col, { view, detail: true, focus: c.id });

      if (c.kind === 'neuron') {
        const kind = cell ? this.neuronKind(cell) : c.lastKind;
        if (cell) c.lastKind = kind;
        this.body.querySelector('.ex-cell-intro').textContent = INTRO[kind];
        if (!cell) {
          status.textContent = `This neuron is gone: it ${DEATH[c.died] || 'died'}. Its debris waits for a microglial cell.`;
        } else if (cell.migrating) {
          status.textContent = `Migrating from the niche: ${cell.migrating} structural steps to go before it settles and starts to wire.`;
        } else if (cell.newborn) {
          const left = Math.max(0, Math.ceil((T.p.newbornWindow * T.p.structuralEvery - (T.t - cell.bornAt)) / T.p.structuralEvery));
          status.textContent = `In its newborn window for about ${left} more structural steps: extra excitable, still sprouting.`;
        } else if (cell.lowTrophic > T.p.trophicAfter * 0.4 && cell.age > cell.matureAt) {
          status.textContent = `At risk: short of growth factor for a while (${cell.lowTrophic.toFixed(0)} of ${T.p.trophicAfter} structural steps).`;
        } else if (cell.lowEnergy > 2) {
          status.textContent = `At risk: low on energy (${cell.lowEnergy} of ${T.p.starveAfter} structural steps).`;
        } else status.textContent = '';
        if (cell && this.frame % 4 === 0) {
          const freeAx = Math.max(0, Math.floor(cell.axEl) - cell.out.length), freeDen = Math.max(0, Math.floor(cell.denEl) - cell.in.length);
          const facts = [
            ['Age', `${cell.age} structural steps`],
            ['Firing / target', (cell.rate / T.p.targetRate).toFixed(2)],
            ['Growth factor / need', (cell.trophic / T.p.trophicNeed).toFixed(2)],
            ['Energy', cell.energy.toFixed(2)],
            ['Axon contacts', `${cell.out.length} made, ${freeAx} free`],
            ['Dendrite contacts', `${cell.in.length} made, ${freeDen} free`],
          ];
          this.body.querySelector('.ex-dl').innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
        }
        const thr = cell && cell.newborn ? T.p.threshold * 0.9 : T.p.threshold;
        const tv = this.body.querySelector('[data-k="v"]');
        drawChart(tv, [{ colour: col.series[this.entry.slot], points: c.fast, width: 1.4, noDot: true }], { colours: col, font: this.font, fmt: (v) => v.toFixed(1), ref: thr, ticks: 3, padLeft: 36 });
        const ts = this.body.querySelector('[data-k="slow"]');
        drawChart(ts, [
          { colour: col.series[this.entry.slot], points: c.slow.map((r) => [r[0], r[1]]), width: 1.6 },
          { colour: col.newborn, points: c.slow.map((r) => [r[0], Math.min(4, r[2])]), width: 1.4 },
          { colour: col.astro, points: c.slow.map((r) => [r[0], r[3]]), width: 1.4 },
        ], { colours: col, font: this.font, fmt: (v) => v.toFixed(1), ref: 1, ticks: 3, padLeft: 36 });
        if (cell && this.frame % 15 === 0) {
          this.fillSynapses(this.body.querySelector('.ex-in'), cell.in, 'pre');
          this.fillSynapses(this.body.querySelector('.ex-out'), cell.out, 'post');
        }
      } else if (c.kind === 'astro') {
        this.body.querySelector('.ex-cell-intro').textContent = INTRO.astro;
        status.textContent = '';
        if (cell && this.frame % 6 === 0) {
          const r2 = T.p.astroRadius ** 2;
          const near = T.neurons.filter((n) => (n.x - cell.x) ** 2 + (n.y - cell.y) ** 2 < r2).length;
          const facts = [
            ['Neurons in territory', `${near}`],
            ['End-feet on vessels', cell.feet.length ? `${cell.feet.length} spots` : 'none, draws from the tissue'],
            ['Glucose in store', cell.store.toFixed(2)],
            ['Lactate handed out', `${(cell.given * 100).toFixed(1)} per 100 steps`],
            ['Synapses engulfed', `${cell.ate}`],
          ];
          this.body.querySelector('.ex-dl').innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
        }
      } else {
        this.body.querySelector('.ex-cell-intro').textContent = INTRO.micro;
        status.textContent = '';
        if (cell && this.frame % 6 === 0) {
          const facts = [
            ['Synapses engulfed', `${cell.ate}`],
            ['Debris cleared', `${cell.cleared}`],
            ['Eat-me signal here', T.tagField[T.cell(cell.x, cell.y)].toFixed(2)],
          ];
          this.body.querySelector('.ex-dl').innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
        }
      }
    }

    fillSynapses(ul, list, side) {
      const T = this.tissue;
      const sorted = list.slice().sort((a, b) => b.w - a.w).slice(0, 10);
      if (!sorted.length) { ul.innerHTML = '<li class="ex-small">None yet.</li>'; return; }
      ul.innerHTML = '';
      for (const s of sorted) {
        const other = s[side];
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        const kind = this.neuronKind(other);
        b.textContent = `#${other.id} ${kind === 'inh' ? 'inhibitory' : kind === 'newborn' ? 'newborn' : 'excitatory'}`;
        b.addEventListener('click', () => this.showCell('neuron', other.id));
        const bar = document.createElement('div');
        bar.className = 'ex-bar-w';
        bar.innerHTML = `<i style="width:${Math.round(100 * s.w / T.p.maxWeight)}%"></i>`;
        const note = document.createElement('span');
        note.className = 'ex-small';
        note.textContent = s.tag > T.p.eatTag ? 'tagged: unused' : s.use > 0.3 ? 'in use' : s.age < 5 ? 'new' : 'quiet';
        li.append(b, bar, note);
        ul.appendChild(li);
      }
    }

    draw() {
      if (!this.active) return;
      this.frame++;
      this.pauseBtn.textContent = this.isPaused() ? 'Play' : 'Pause';
      if (this.level === 'tissue') this.drawTissueLevel(); else this.drawCellLevel();
    }
  }

  function clampV(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }

  // Nearest neuron, astrocyte or microglia to (x, y) within r.
  function pickCell(T, x, y, r) {
    let best = null, bd = r * r;
    const test = (kind, o) => {
      const d = (o.x - x) ** 2 + (o.y - y) ** 2;
      if (d < bd) { bd = d; best = { kind, id: o.id }; }
    };
    for (const n of T.neurons) test('neuron', n);
    for (const m of T.microglia) test('micro', m);
    for (const a of T.astros) test('astro', a);
    return best;
  }

  root.TissueExplorer = TissueExplorer;
  root.TissueExplorer.pickCell = pickCell;
})(typeof self !== 'undefined' ? self : this);
