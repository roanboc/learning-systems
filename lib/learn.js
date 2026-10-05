// Guided labs: a small panel that walks someone through one mechanism, level
// by level, on a live simulation.
//
// Modelled on the labs of roanboc/learning-data ("take it apart"): one lab, one
// mechanism, and you break it. Here the break runs in a twin world beside the
// original (same seed, one thing changed), and every lab crosses levels: you
// change something at one level and read the effect at another.
//
// A lab is data. The page passes an `api` object that the lab's functions use
// to set up worlds, move cameras and read numbers. The panel never steps the
// simulation itself: it reads state a few times a second.
//
//   Learn.mount({ toolbar, labs, api })
//   lab = {
//     id, title, question, levels: ['Coast', 'Pool', ...],
//     setup(api, st),                  // build the worlds; st is this run's scratch state
//     steps: [{
//       level,                          // index into levels: where this step looks
//       title, text,                    // what to look at, in plain words
//       action: { label, run(api, st) },// optional button ("Take me there")
//       check(api, st) -> bool,         // optional: Next waits until this is true
//       wait,                           // what to do while waiting
//       result(api, st) -> string,      // live line saying what just happened (**bold** allowed)
//     }],
//     think: { q, opts: [{ t, ok, why }] },  // "Pause and think" at the end
//   }
//
// Progress stays in this browser (localStorage) and is never sent anywhere.
// Every action has a button, so the lab works with the keyboard alone.
(function (root) {
  'use strict';

  const STORE = 'learning-systems.labs';
  // The repository root, worked out from where this script was loaded, so a
  // page can link to labs on other pages (lib/lab-catalogue.js) at any depth.
  const SELF = typeof document !== 'undefined' && document.currentScript;
  const ROOT = SELF && SELF.src ? new URL('../', SELF.src).href : '';
  const TICK = 400; // ms between reads of the simulation

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function save(p) {
    try { localStorage.setItem(STORE, JSON.stringify(p)); } catch (e) { /* private mode: progress just isn't kept */ }
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  // Escape, then allow **bold**.
  function rich(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }

  const CSS = `
.learn-btn { font-weight: 600; }
.learn {
  position: fixed; z-index: 30; right: 16px; bottom: 16px; width: min(380px, calc(100vw - 32px));
  max-height: min(78vh, 640px); overflow: auto; overscroll-behavior: contain;
  background: var(--surface, #fbfcfa); color: var(--ink, #1b2420);
  border: 1px solid var(--line, #d3dad5); border-radius: 12px;
  box-shadow: 0 10px 34px rgba(0,0,0,.22); padding: 14px 16px 16px;
  font: 14px/1.5 var(--sans, system-ui, sans-serif); display: grid; gap: 10px;
}
.learn[hidden] { display: none; }
.learn.min { max-height: none; }
.learn.min .learn-body { display: none; }
.learn-head { display: flex; align-items: start; gap: 8px; }
.learn-head .k { font: 600 11px/1.2 var(--mono, monospace); letter-spacing: .06em; text-transform: uppercase; color: var(--accent, #2a6f73); }
.learn-head h2 { margin: 2px 0 0; font-size: 16px; line-height: 1.3; }
.learn-head .sp { flex: 1; min-width: 0; }
.learn button { font: inherit; color: inherit; background: transparent; border: 1px solid var(--line, #d3dad5);
  border-radius: 8px; padding: 6px 10px; cursor: pointer; }
.learn button:hover { border-color: var(--accent, #2a6f73); }
.learn button:focus-visible { outline: 2px solid var(--accent, #2a6f73); outline-offset: 2px; }
.learn button:disabled { opacity: .5; cursor: default; }
.learn button.primary { background: var(--accent, #2a6f73); border-color: var(--accent, #2a6f73); color: var(--surface, #fff); font-weight: 600; }
.learn .icon { padding: 2px 8px; }
.learn-body { display: grid; gap: 10px; }
.learn-ruler { display: flex; flex-wrap: wrap; gap: 4px; margin: 0; padding: 0; list-style: none; font-size: 12px; }
.learn-ruler li { padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line, #d3dad5); color: var(--muted, #5b6862); }
.learn-ruler li.on { border-color: var(--accent, #2a6f73); color: var(--ink, #1b2420); font-weight: 600; }
.learn-ruler li.past { color: var(--ink, #1b2420); }
.learn-count { font: 12px var(--mono, monospace); color: var(--muted, #5b6862); }
.learn h3 { margin: 0; font-size: 15px; }
.learn p { margin: 0; }
.learn .q { color: var(--muted, #5b6862); }
.learn-result { border-left: 3px solid var(--accent, #2a6f73); padding: 6px 10px; background: color-mix(in srgb, var(--accent, #2a6f73) 8%, transparent); border-radius: 0 6px 6px 0; min-height: 1.5em; }
.learn-wait { font-size: 13px; color: var(--muted, #5b6862); }
.learn-nav { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.learn-nav .grow { flex: 1; }
.learn-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.learn-list button, .learn-list .learn-link { width: 100%; text-align: left; display: grid; gap: 2px; padding: 10px 12px; }
.learn-list .learn-link { border: 1px solid var(--line, #d3dad5); border-radius: 8px; color: inherit; text-decoration: none; box-sizing: border-box; }
.learn-list .learn-link:hover { border-color: var(--accent, #2a6f73); }
.learn a { color: var(--accent, #2a6f73); }
.learn-list small { color: var(--muted, #5b6862); }
.learn-list .done { color: var(--accent, #2a6f73); font-weight: 600; }
.learn-opts { display: grid; gap: 6px; }
.learn-opts button { text-align: left; }
.learn-opts button.ok { border-color: var(--accent, #2a6f73); }
.learn-opts button.no { border-color: var(--danger, #b4412b); }
.learn-why { font-size: 13px; }
/* Wide screens: make room beside the panel so it never hides a world. */
@media (min-width: 1100px) { body.learn-open, body.learn-open .explorer { padding-right: 404px; } }
@media (max-width: 560px) {
  .learn { right: 8px; left: 8px; bottom: 8px; width: auto; max-height: 52vh; }
}
@media (prefers-reduced-motion: no-preference) { .learn { transition: max-height .2s; } }
`;

  function mount(opts) {
    const { labs, api } = opts;
    // Load the catalogue of every lab, for the "In other worlds" list.
    if (!root.LabCatalogue && ROOT && !document.getElementById('lab-catalogue')) {
      const sc = document.createElement('script');
      sc.id = 'lab-catalogue'; sc.src = ROOT + 'lib/lab-catalogue.js';
      document.head.appendChild(sc);
    }
    if (!document.getElementById('learn-css')) {
      const st = document.createElement('style');
      st.id = 'learn-css'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'learn-btn'; btn.textContent = 'Guided labs';
    opts.toolbar.appendChild(btn);

    const panel = document.createElement('aside');
    panel.className = 'learn'; panel.hidden = true;
    panel.setAttribute('aria-label', 'Guided lab');
    document.body.appendChild(panel);

    let lab = null, i = 0, st = null, timer = null, passed = false;
    const progress = load();

    function head(kicker, title) {
      return `<div class="learn-head"><div class="sp"><div class="k">${esc(kicker)}</div><h2>${esc(title)}</h2></div>` +
        (lab ? '<button type="button" class="icon min-btn" aria-label="Minimise">–</button>' : '') +
        '<button type="button" class="icon close-btn" aria-label="Close">×</button></div>';
    }
    function wireHead() {
      panel.querySelector('.close-btn').onclick = close;
      const m = panel.querySelector('.min-btn');
      if (m) m.onclick = () => {
        panel.classList.toggle('min');
        m.textContent = panel.classList.contains('min') ? '+' : '–';
        m.setAttribute('aria-label', panel.classList.contains('min') ? 'Expand' : 'Minimise');
      };
    }

    function showList() {
      stop(); lab = null;
      panel.classList.remove('min');
      panel.innerHTML = head('Guided labs', 'Take it apart') +
        '<div class="learn-body"><p class="q">Each lab follows one mechanism across levels. It builds a twin world with one thing changed, so you can see what that thing does.</p>' +
        '<ul class="learn-list">' + labs.map((l) =>
          `<li><button type="button" data-id="${esc(l.id)}"><b>${esc(l.title)}</b><small>${esc(l.question)}</small>` +
          `<small>${esc(l.levels.join(' → '))}${done(l.id)}</small></button></li>`).join('') +
        '</ul>' + elsewhere() + '</div>';
      wireHead();
      panel.querySelectorAll('[data-id]').forEach((b) => { b.onclick = () => start(b.dataset.id); });
    }

    function done(id) { return progress[id] && progress[id].done ? ' · <span class="done">done</span>' : ''; }

    // Labs that live on other pages, as links that open them there.
    function elsewhere() {
      const here = new Set(labs.map((l) => l.id));
      const other = (root.LabCatalogue || []).filter((l) => !here.has(l.id));
      if (!other.length) return '';
      return '<h3>In other worlds</h3><ul class="learn-list">' + other.map((l) =>
        `<li><a class="learn-link" href="${esc(ROOT + l.page + '#lab=' + l.id)}"><b>${esc(l.title)}</b>` +
        `<small>${esc(l.chapter)} · ${esc(l.levels.join(' → '))}${done(l.id)}</small></a></li>`).join('') +
        `</ul><p><a href="${esc(ROOT + 'labs/index.html')}">All labs, and situations to make the call →</a></p>`;
    }

    function start(id) {
      const l = labs.find((x) => x.id === id);
      if (!l) return;
      lab = l; i = 0; st = {};
      panel.hidden = false;
      document.body.classList.add('learn-open');
      lab.setup(api, st);
      try { history.replaceState(null, '', '#lab=' + lab.id); } catch (e) { /* file:// in some browsers */ }
      showStep();
      stop();
      timer = setInterval(tick, TICK);
    }

    function stop() { if (timer) clearInterval(timer); timer = null; }

    function close() {
      stop(); lab = null; panel.hidden = true;
      document.body.classList.remove('learn-open');
      try { if (location.hash.startsWith('#lab=')) history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
    }

    function ruler(level) {
      return '<ol class="learn-ruler" aria-label="Levels in this lab">' + lab.levels.map((n, k) =>
        `<li class="${k === level ? 'on' : ''}"${k === level ? ' aria-current="step"' : ''}>${esc(n)}</li>`).join('') + '</ol>';
    }

    function showStep() {
      if (i >= lab.steps.length) return showThink();
      const s = lab.steps[i];
      passed = !s.check;
      panel.innerHTML = head('Guided lab', lab.title) +
        '<div class="learn-body">' + ruler(s.level) +
        `<div class="learn-count">Step ${i + 1} of ${lab.steps.length + 1} · ${esc(lab.levels[s.level])}</div>` +
        `<h3>${esc(s.title)}</h3><p>${rich(s.text)}</p>` +
        (s.action ? `<div><button type="button" class="act">${esc(s.action.label)}</button></div>` : '') +
        '<div class="learn-result" role="status" aria-live="polite"></div>' +
        (s.check ? `<p class="learn-wait">${rich(s.wait || 'Waiting for the world…')}</p>` : '') +
        '<div class="learn-nav"><button type="button" class="back">← Back</button><span class="grow"></span>' +
        (s.check ? '<button type="button" class="skip">Skip</button>' : '') +
        `<button type="button" class="primary next">Next →</button></div></div>`;
      wireHead();
      const act = panel.querySelector('.act');
      if (act) act.onclick = () => { s.action.run(api, st); tick(); };
      panel.querySelector('.back').disabled = i === 0;
      panel.querySelector('.back').onclick = () => { i--; showStep(); };
      const skip = panel.querySelector('.skip');
      if (skip) skip.onclick = next;
      panel.querySelector('.next').onclick = next;
      if (s.enter) s.enter(api, st);
      tick();
    }

    function next() { i++; showStep(); }

    function tick() {
      if (!lab || i >= lab.steps.length) return;
      const s = lab.steps[i];
      const res = panel.querySelector('.learn-result');
      if (s.result && res) {
        let txt = '';
        try { txt = s.result(api, st) || ''; } catch (e) { txt = ''; }
        const html = rich(txt);
        if (res.innerHTML !== html) res.innerHTML = html;
      }
      if (s.check && !passed) {
        let ok = false;
        try { ok = !!s.check(api, st); } catch (e) { ok = false; }
        if (ok) {
          passed = true;
          const w = panel.querySelector('.learn-wait');
          if (w) w.textContent = 'There it is. Read the line above, then go on.';
          const sk = panel.querySelector('.skip');
          if (sk) sk.remove();
        }
      }
      const nx = panel.querySelector('.next');
      if (nx) nx.disabled = !passed;
    }

    function showThink() {
      const t = lab.think;
      panel.innerHTML = head('Pause and think', lab.title) +
        `<div class="learn-body"><div class="learn-count">Step ${lab.steps.length + 1} of ${lab.steps.length + 1}</div>` +
        `<h3>${esc(t.q)}</h3><div class="learn-opts">` +
        t.opts.map((o, k) => `<button type="button" data-k="${k}">${esc(o.t)}</button>`).join('') +
        '</div><p class="learn-why" role="status" aria-live="polite"></p>' +
        '<div class="learn-nav"><button type="button" class="back">← Back</button><span class="grow"></span>' +
        '<button type="button" class="list">All labs</button><button type="button" class="primary done" disabled>Done</button></div></div>';
      wireHead();
      const why = panel.querySelector('.learn-why'), done = panel.querySelector('.done');
      panel.querySelectorAll('[data-k]').forEach((b) => {
        b.onclick = () => {
          const o = t.opts[+b.dataset.k];
          panel.querySelectorAll('[data-k]').forEach((x) => x.classList.remove('ok', 'no'));
          b.classList.add(o.ok ? 'ok' : 'no');
          why.innerHTML = `<b>${o.ok ? 'Right.' : 'Not quite.'}</b> ${rich(o.why)}`;
          if (o.ok) {
            done.disabled = false;
            progress[lab.id] = { done: true, at: new Date().toISOString().slice(0, 10) };
            save(progress);
          }
        };
      });
      panel.querySelector('.back').onclick = () => { i = lab.steps.length - 1; showStep(); };
      panel.querySelector('.list').onclick = showList;
      done.onclick = close;
    }

    btn.onclick = () => {
      if (!panel.hidden && !lab) { close(); return; }
      panel.hidden = false;
      document.body.classList.add('learn-open');
      if (!lab) showList();
    };

    const fromHash = () => {
      const m = /#lab=([\w-]+)/.exec(location.hash);
      if (m && (!lab || lab.id !== m[1])) start(m[1]);
    };
    fromHash();
    // A link to #lab=id on this same page (the "start here" prompt) starts it too.
    addEventListener('hashchange', fromHash);
    return { start, close, showList };
  }

  root.Learn = { mount };
})(typeof self !== 'undefined' ? self : this);
