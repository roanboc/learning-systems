// Site navigation shared by every page: where you are, where to go next.
//
//   - The site bar, the same on every page: Learning Systems (home) ·
//     Chapters (the nine acts of film 1, lib/story.js) · Films · Guided labs ·
//     Explore (Deep Dive, World Viewer, the plain list) · EN | ES.
//   - On a chapter page, a strip in the act's colours: the film's five level
//     dots, the chapter, its day clock, the other simulations of the chapter,
//     and a link to watch the act. At the foot, previous and next.
//   - A "start here" prompt for the page's guided lab (lib/lab-catalogue.js),
//     which turns into "done" once you have finished it.
//
// A page opts in with <script src=".../lib/nav.js"></script>. Its old
// "← Learning Systems" link (a.back) is replaced by the bar. The look is in
// lib/site.css (loaded by lib/site.js).
(function () {
  'use strict';

  const SELF = document.currentScript;
  const ROOT = SELF && SELF.src ? new URL('../', SELF.src).href : '';

  // Every page that carries the bar. act: its chapter (film 1's act number).
  // route: the order of the simulation pages, for previous and next.
  const PAGES = [
    { path: 'index.html', title: 'Learning Systems', menu: 'home' },
    { path: 'labs/index.html', title: 'Guided labs', menu: 'labs' },
    { path: 'films/index.html', title: 'Films', menu: 'films' },
    { path: 'films/journey/index.html', title: 'The journey of life', menu: 'films' },
    { path: 'environments/early-earth/index.html', title: 'Early Earth', world: 'earth', act: 1, route: 0 },
    { path: 'environments/first-genes/index.html', title: 'First genes', world: 'genes', act: 2, route: 1 },
    { path: 'environments/first-cells/index.html', title: 'First cells', world: 'cells', act: 3, route: 2 },
    { path: 'environments/colonies/index.html', title: 'Colonies', world: 'colonies', act: 4, route: 3 },
    { path: 'environments/first-bodies/index.html', title: 'Bodies', world: 'bodies', act: 5, route: 4 },
    { path: 'nervous-systems/tissue-lab/index.html', title: 'Tissue Lab', world: 'brains', act: 6, route: 5 },
    { path: 'nervous-systems/tissue-lab/train.html', title: 'Train a creature', world: 'brains', act: 6, parent: 'nervous-systems/tissue-lab/index.html' },
    { path: 'environments/forager-worlds/index.html', title: 'Brains and ecosystems', world: 'brains', act: 6, also: 7, route: 6 },
    { path: 'environments/onto-land/index.html', title: 'Onto land', world: 'shores', act: 7, route: 7 },
  ];
  const ROUTE = PAGES.filter((p) => p.route != null).sort((a, b) => a.route - b.route);
  const STORE = 'learning-systems.labs';
  // The colour wash of each act, taken from its film stills.
  const WASH = [['#ece1f1', '#f4e6c6'], ['#f6dcd6', '#f5e7bb'], ['#e8efcf', '#d5ecd8'], ['#cdebe5', '#f1e3b8'], ['#e5dff3', '#d6e8ea'],
    ['#cfe9e6', '#d8e3f2'], ['#d8e2f4', '#e6dcf2'], ['#cdebe6', '#ece4c6'], ['#f1e0e6', '#d9e6f2']];

  const here = new URL(location.href);
  let path = ROOT && here.href.startsWith(ROOT) ? here.href.slice(ROOT.length) : here.pathname.replace(/^\//, '');
  path = path.split('#')[0].split('?')[0];
  if (path === '' || path.endsWith('/')) path += 'index.html';
  const page = PAGES.find((p) => p.path === path);
  if (!page) return;

  const url = (p) => ROOT + p;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function progress() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  const story = () => window.Story;

  // ---------- the film's furniture, also used by the home and Films pages ----------
  function dots(level) {
    const L = story().LEVELS;
    return '<span class="ls-dots" aria-hidden="true">' + L.map((l, i) => {
      const on = level != null && i <= level;
      return `<i class="${on ? 'on' : ''}${i === level ? ' here' : ''}"${on ? ` style="background:${l.colour}"` : ''}></i>`;
    }).join('') + '</span>';
  }
  function clock(t) {
    const [h, m] = t.split(':').map(Number), f = (h + m / 60) / 24, a = f * 2 * Math.PI - Math.PI / 2;
    const p = (r) => `${(10 + r * Math.cos(a)).toFixed(2)} ${(10 + r * Math.sin(a)).toFixed(2)}`;
    const arc = f >= 0.999 ? '<circle cx="10" cy="10" r="8.5" fill="none" stroke="#4fae63" stroke-width="2"/>'
      : `<path d="M10 1.5 A8.5 8.5 0 ${f > 0.5 ? 1 : 0} 1 ${p(8.5)}" fill="none" stroke="#3597a2" stroke-width="2"/>`;
    return `<span class="ls-clock" title="If all of Earth’s history were one day">${t}<svg viewBox="0 0 20 20" aria-hidden="true">` +
      `<circle cx="10" cy="10" r="8.5" fill="none" stroke="#e2d6ba" stroke-width="2"/>${arc}` +
      `<line x1="10" y1="10" x2="${(10 + 6.5 * Math.cos(a)).toFixed(2)}" y2="${(10 + 6.5 * Math.sin(a)).toFixed(2)}" stroke="#2c2723" stroke-width="1.6" stroke-linecap="round"/></svg></span>`;
  }
  function levelTag(level) {
    if (level == null) return '<span class="ls-tag"><i style="background:#2c2723"></i>All levels</span>';
    const l = story().LEVELS[level];
    return `<span class="ls-tag"><i style="background:${l.colour}"></i>${esc(l.name)}</span>`;
  }

  // ---------- the bar ----------
  function bar() {
    const S = story(), labs = window.LabCatalogue || [];
    const p = progress(), done = labs.filter((l) => p[l.id] && p[l.id].done).length;
    const acts = S.ACTS.map((a) => {
      const cur = page.act === a.n;
      return `<a href="${esc(url(a.n === 0 || a.n === 8 ? 'index.html#chapters' : a.sims[0].path))}"${cur ? ' aria-current="true"' : ''}>` +
        `<span class="ls-num">${a.n}</span><span><b>${esc(a.title)}</b><small>${a.sims.map((s) => esc(s.name)).join(' · ')}</small></span>${levelTag(a.level)}</a>`;
    }).join('');
    const explore = [
      ['dive/index.html', '◎', 'Deep Dive', 'Sink through the planet, level by level'],
      ['world/index.html' + (page.world ? '#' + page.world : ''), '▦', 'World Viewer', 'Every chapter on one stage'],
      ['dive/index.html#list', '≡', 'All simulations', 'A plain list, in order of time'],
    ].map(([h, icon, t, d]) => `<a href="${esc(url(h))}"><span class="ls-num" aria-hidden="true">${icon}</span><span><b>${t}</b><small>${d}</small></span></a>`).join('');
    const cur = (m) => (page.menu === m ? ' aria-current="page"' : '');
    const nav = document.createElement('nav');
    nav.className = 'ls-bar';
    nav.setAttribute('aria-label', 'Site');
    nav.innerHTML =
      `<a class="ls-logo" href="${esc(url('index.html'))}"><i aria-hidden="true"></i>Learning Systems</a>` +
      '<div class="ls-menu">' +
      `<span class="ls-drop"><button type="button" aria-expanded="false" aria-controls="ls-chapters">Chapters ▾</button><div class="ls-panel" id="ls-chapters" hidden>${acts}</div></span>` +
      `<a href="${esc(url('films/index.html'))}"${cur('films')}>Films</a>` +
      `<a href="${esc(url('labs/index.html'))}"${cur('labs')}>Guided labs${labs.length ? ` <small>${done}/${labs.length}</small>` : ''}</a>` +
      `<span class="ls-drop"><button type="button" aria-expanded="false" aria-controls="ls-explore">Explore ▾</button><div class="ls-panel" id="ls-explore" hidden style="width:min(360px,calc(100vw - 32px))">${explore}</div></span>` +
      '</div>';
    if (window.I18N) nav.appendChild(I18N.switcher());
    // Open one menu at a time; close on a click outside or Escape.
    const drops = [...nav.querySelectorAll('.ls-drop > button')];
    const close = (except) => drops.forEach((b) => { if (b !== except) { b.setAttribute('aria-expanded', 'false'); b.nextElementSibling.hidden = true; } });
    drops.forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = b.getAttribute('aria-expanded') !== 'true';
      close(b);
      b.setAttribute('aria-expanded', String(open));
      b.nextElementSibling.hidden = !open;
    }));
    document.addEventListener('click', (e) => { if (!nav.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    return nav;
  }

  // ---------- chapter strip ----------
  function chapterStrip() {
    if (page.act == null) return null;
    const a = story().ACTS[page.act], w = WASH[page.act];
    const el = document.createElement('nav');
    el.className = 'ls-chapter';
    el.setAttribute('aria-label', 'Chapter');
    el.style.setProperty('--w1', w[0]);
    el.style.setProperty('--w2', w[1]);
    const sims = a.sims.length > 1
      ? '<span class="sibs">' + a.sims.map((s) => {
        const on = s.path.split('#')[0] === (page.parent || page.path);
        return `<a href="${esc(url(s.path))}"${on ? ' aria-current="page"' : ''}>${esc(s.name)}</a>`;
      }).join('') + '</span>'
      : '';
    const chap = page.also != null ? `Chapters ${page.act} and ${page.also}` : `Chapter ${page.act}`;
    el.innerHTML = dots(a.level) +
      `<span class="ls-step">${esc(chap)} · ${esc(story().LEVELS[a.level].name)}</span>` +
      clock(a.clock) + sims + '<span class="sp"></span>' +
      `<a class="watch" href="${esc(url('films/index.html#act-' + a.n))}">▶ Watch act ${a.n}</a>` +
      `<a href="${esc(url('world/index.html#' + page.world))}">World Viewer</a>`;
    return el;
  }

  function pager() {
    if (page.route == null) return null;
    const k = ROUTE.indexOf(page), prev = ROUTE[k - 1], next = ROUTE[k + 1];
    if (!prev && !next) return null;
    const el = document.createElement('nav');
    el.className = 'ls-pager';
    el.setAttribute('aria-label', 'Previous and next chapter');
    const link = (p, cls, arrow) => `<a class="${cls}" href="${esc(url(p.path))}"><small>${arrow === '←' ? '← ' : ''}Chapter ${p.act}${arrow === '→' ? ' →' : ''}</small><b>${esc(p.title)}</b></a>`;
    el.innerHTML = (prev ? link(prev, 'prev', '←') : '') + (next ? link(next, 'next', '→') : '');
    return el;
  }

  // ---------- start here ----------
  function startHere() {
    const lab = (window.LabCatalogue || []).find((l) => l.page === page.path);
    if (!lab) return null;
    const done = progress()[lab.id] && progress()[lab.id].done;
    const el = document.createElement('div');
    el.className = 'start-here' + (done ? ' done' : '');
    el.innerHTML = done
      ? `<p>You finished the guided lab <b>${esc(lab.title)}</b>. Explore freely, or test yourself on new situations.</p>` +
        `<a class="btn" href="${esc(url('labs/index.html#make-the-call'))}">Make the call →</a>`
      : `<p><b>New here?</b> The guided lab <b>${esc(lab.title)}</b> walks you through this world level by level: ${esc(lab.levels.join(' → '))}.</p>` +
        `<a class="btn" href="#lab=${esc(lab.id)}">Start the guided lab</a>`;
    return el;
  }

  const CSS = `
.start-here { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; padding: 10px 14px; font-size: 14px; max-width: 90ch; }
.start-here p { margin: 0; flex: 1 1 32ch; }
.start-here a.btn { font-weight: 600; text-decoration: none; padding: 6px 12px; white-space: nowrap; }
`;

  function mount() {
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    const back = document.querySelector('a.back');
    const header = document.querySelector('header');
    const nav = bar();
    if (back) back.replaceWith(nav);
    else if (header) header.before(nav);
    else document.body.prepend(nav);
    if (page.menu === 'home' || page.menu === 'films') return;
    // The page's old chapter label is replaced by the strip.
    const old = header && [...header.querySelectorAll('.eyebrow')].find((e) => /timeline of life|l[ií]nea de tiempo de la vida/i.test(e.textContent));
    if (old) old.remove();
    const cs = chapterStrip();
    if (cs && header) header.before(cs);
    const sh = startHere();
    if (sh && header) header.after(sh);
    const pg = pager();
    const wrap = header && header.parentElement;
    if (pg && wrap) wrap.appendChild(pg);
  }

  window.SiteNav = { dots, clock, levelTag, wash: (n) => WASH[n], url };

  // The bar needs the story and the lab catalogue; load what is missing.
  const need = [];
  if (!window.Story) need.push('lib/story.js');
  if (!window.LabCatalogue) need.push('lib/lab-catalogue.js');
  let left = need.length;
  const ready = () => { if (window.SiteNavReady) window.SiteNavReady(); };
  if (!left || !ROOT) { if (window.Story) { mount(); ready(); } return; }
  for (const n of need) {
    const sc = document.createElement('script');
    sc.src = ROOT + n;
    sc.onload = sc.onerror = () => {
      if (n.endsWith('lab-catalogue.js') && !window.LabCatalogue) window.LabCatalogue = [];
      if (--left === 0 && window.Story) { mount(); ready(); }
    };
    document.head.appendChild(sc);
  }
})();
