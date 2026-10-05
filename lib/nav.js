// Site navigation shared by every page: where you are, where to go next.
//
//   - A bar at the top: Learning Systems › shelf › this page, plus the two
//     ways in that every page should offer: the World Viewer and Guided labs.
//   - On timeline pages, the chapter you are in, with the previous and next
//     chapter and a link to the same chapter in the World Viewer.
//   - A "start here" prompt for the page's guided lab (lib/lab-catalogue.js),
//     which turns into "done" once you have finished it.
//
// A page opts in with <script src=".../lib/nav.js"></script>. Its old
// "← Learning Systems" link (a.back) is replaced by the bar. Plain JS, no DOM
// assumptions beyond that link and the page's <header>.
(function () {
  'use strict';

  const SELF = document.currentScript;
  const ROOT = SELF && SELF.src ? new URL('../', SELF.src).href : '';

  // Every page, and the order you walk the timeline in (route).
  const PAGES = [
    { path: 'index.html', title: 'Learning Systems' },
    { path: 'world/index.html', title: 'World Viewer', shelf: 'Start here' },
    { path: 'labs/index.html', title: 'Guided labs', shelf: 'Start here' },
    { path: 'environments/early-earth/index.html', title: 'Early Earth', shelf: 'Environments', world: 'earth', route: 0, chapter: 'Chapter 0' },
    { path: 'environments/first-cells/index.html', title: 'First cells', shelf: 'Environments', world: 'cells', route: 1, chapter: 'Chapter 1' },
    { path: 'environments/first-bodies/index.html', title: 'Bodies', shelf: 'Environments', world: 'bodies', route: 2, chapter: 'Chapter 3' },
    { path: 'environments/forager-worlds/index.html', title: 'Brains and ecosystems', shelf: 'Environments', world: 'brains', route: 3, chapter: 'Chapters 5 and 6' },
    { path: 'nervous-systems/tissue-lab/index.html', title: 'Tissue Lab', shelf: 'Nervous systems', world: 'brains', route: 4, chapter: 'Inside a brain' },
    { path: 'nervous-systems/tissue-lab/train.html', title: 'Train a creature', shelf: 'Nervous systems', parent: 'nervous-systems/tissue-lab/index.html' },
  ];
  const ROUTE = PAGES.filter((p) => p.route != null).sort((a, b) => a.route - b.route);
  const STORE = 'learning-systems.labs';

  const here = new URL(location.href);
  let path = ROOT && here.href.startsWith(ROOT) ? here.href.slice(ROOT.length) : here.pathname.replace(/^\//, '');
  path = path.split('#')[0].split('?')[0];
  if (path === '' || path.endsWith('/')) path += 'index.html';
  const page = PAGES.find((p) => p.path === path);
  if (!page) return;

  const url = (p) => ROOT + p;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function progress() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }

  const CSS = `
.site-nav { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; font-size: 13px; justify-self: stretch; }
.site-nav .crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; flex: 1 1 auto; min-width: 0; color: var(--muted, #5b6862); }
.site-nav .crumbs a { color: var(--accent, #2a6f73); text-decoration: none; }
.site-nav .crumbs a:hover { text-decoration: underline; }
.site-nav .crumbs [aria-current] { color: var(--ink, #1b2420); font-weight: 600; }
.site-nav .go { display: flex; gap: 6px; flex-wrap: wrap; }
.site-nav .go a { color: var(--ink, #1b2420); text-decoration: none; border: 1px solid var(--line, #d3dad5); border-radius: 999px; padding: 3px 10px; background: var(--surface, #fbfcfa); white-space: nowrap; }
.site-nav .go a:hover { border-color: var(--accent, #2a6f73); }
.site-nav a:focus-visible, .chapter-bar a:focus-visible, .start-here a:focus-visible { outline: 2px solid var(--accent, #2a6f73); outline-offset: 2px; }
.chapter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; font-size: 13px; color: var(--muted, #5b6862); }
.chapter-bar a { color: var(--accent, #2a6f73); text-decoration: none; }
.chapter-bar a:hover { text-decoration: underline; }
.chapter-bar .step { font: 500 11px var(--mono, monospace); letter-spacing: .06em; text-transform: uppercase; }
.chapter-bar .sp { flex: 1; }
.start-here { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; padding: 10px 14px; border: 1px solid var(--accent, #2a6f73);
  border-radius: 10px; background: color-mix(in srgb, var(--accent, #2a6f73) 7%, var(--surface, #fbfcfa)); font-size: 14px; max-width: 90ch; }
.start-here p { margin: 0; flex: 1 1 32ch; }
.start-here a.btn { font-weight: 600; text-decoration: none; color: var(--surface, #fff); background: var(--accent, #2a6f73); border-radius: 8px; padding: 6px 12px; white-space: nowrap; }
.start-here.done { border-color: var(--line, #d3dad5); background: var(--surface, #fbfcfa); }
.start-here.done a.btn { color: var(--accent, #2a6f73); background: transparent; border: 1px solid var(--accent, #2a6f73); }
`;
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  // ---------- the bar ----------
  function bar() {
    const crumbs = ['<a href="' + esc(url('index.html')) + '">Learning Systems</a>'];
    if (page.shelf && page.shelf !== 'Start here') crumbs.push('<span>' + esc(page.shelf) + '</span>');
    const parent = page.parent && PAGES.find((p) => p.path === page.parent);
    if (parent) crumbs.push('<a href="' + esc(url(parent.path)) + '">' + esc(parent.title) + '</a>');
    crumbs.push('<span aria-current="page">' + esc(page.title) + '</span>');
    const labs = window.LabCatalogue || [];
    const p = progress(), done = labs.filter((l) => p[l.id] && p[l.id].done).length;
    const go = [];
    if (page.path !== 'world/index.html') go.push(`<a href="${esc(url('world/index.html' + (page.world ? '#' + page.world : '')))}">World Viewer</a>`);
    if (page.path !== 'labs/index.html') go.push(`<a href="${esc(url('labs/index.html'))}">Guided labs${labs.length ? ` · ${done}/${labs.length}` : ''}</a>`);
    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Site');
    nav.innerHTML = '<div class="crumbs">' + crumbs.join('<span aria-hidden="true">›</span>') + '</div><div class="go">' + go.join('') + '</div>';
    return nav;
  }

  // ---------- chapter steps ----------
  function chapterBar() {
    if (page.route == null) return null;
    const k = ROUTE.indexOf(page), prev = ROUTE[k - 1], next = ROUTE[k + 1];
    const el = document.createElement('nav');
    el.className = 'chapter-bar';
    el.setAttribute('aria-label', 'Timeline of life');
    // Skip the label when the page's own header already says which chapter it is.
    const h = document.querySelector('header');
    const said = h && /timeline of life/i.test(h.textContent);
    el.innerHTML =
      (said ? '' : `<span class="step">Timeline of life · ${esc(page.chapter)}</span>`) +
      (prev ? `<a href="${esc(url(prev.path))}">← ${esc(prev.title)}</a>` : '') +
      (next ? `<a href="${esc(url(next.path))}">Next: ${esc(next.title)} →</a>` : '') +
      '<span class="sp"></span>' +
      `<a href="${esc(url('world/index.html#' + page.world))}">See this chapter in the World Viewer</a>`;
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

  function mount() {
    const back = document.querySelector('a.back');
    const header = document.querySelector('header');
    const nav = bar();
    if (back) back.replaceWith(nav);
    else if (header) header.before(nav);
    else return;
    const cb = chapterBar();
    if (cb && header) header.after(cb);
    const sh = startHere();
    if (sh && header) (cb || header).after(sh);
  }

  // The catalogue tells the bar how many labs there are; load it if needed.
  if (window.LabCatalogue || !ROOT) mount();
  else {
    const sc = document.createElement('script');
    sc.src = ROOT + 'lib/lab-catalogue.js';
    sc.onload = mount;
    sc.onerror = () => { window.LabCatalogue = []; mount(); };
    document.head.appendChild(sc);
  }
})();
