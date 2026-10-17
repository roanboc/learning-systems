// Languages: English (the source) and Spanish, switched with EN | ES at the top
// of every page, the way roanboc/learning-data does it.
//
// The pages stay written in English. In Spanish, this file loads the
// dictionaries in lib/i18n/es/ and translates what the page shows: the HTML,
// everything scripts add or change later (watched with a MutationObserver),
// a few attributes (title, aria-label, aria-valuetext, placeholder, alt) and text drawn on
// canvases. Engines and page scripts need no changes.
//
// A dictionary is a plain object, English → Spanish:
//
//   I18N.add({
//     'Run': 'Ejecutar',
//     'The <b>sun</b> heats the water.': 'El <b>sol</b> calienta el agua.',
//     'Day {n} · {cells} cells': 'Día {n} · {cells} células',
//   });
//
// Keys are matched after collapsing whitespace. An element whose children are
// only inline markup (b, i, a, span, ...) is matched as a whole, by its HTML, so
// a sentence with bold words is translated as one sentence. {name} in a key
// matches any text; that text is itself translated when the dictionary has it.
//
// The choice is kept in localStorage; ?lang=es or ?lang=en in a link sets it.
// ?i18n=debug collects every text that has no translation: I18N.missing().
//
// A page opts in with <script src=".../lib/i18n.js"></script> in its <head>,
// before anything else. Put <span data-lang-switch></span> where the switch
// goes; lib/nav.js adds one to its bar.
(function () {
  'use strict';

  const KEY = 'learning-systems.lang';
  const LANGS = ['en', 'es'];
  const FILES = ['common', 'home', 'world', 'labs', 'early-earth', 'first-cells', 'colonies', 'first-bodies', 'forager-worlds', 'tissue-lab'];
  const SELF = document.currentScript;
  const ROOT = SELF && SELF.src ? new URL('../', SELF.src).href : '';
  const params = new URLSearchParams(location.search);
  const DEBUG = params.get('i18n') === 'debug';

  let lang = 'en';
  const asked = params.get('lang');
  if (LANGS.includes(asked)) {
    lang = asked;
    try { localStorage.setItem(KEY, asked); } catch (e) { /* private mode */ }
  } else {
    try { const s = localStorage.getItem(KEY); if (LANGS.includes(s)) lang = s; } catch (e) { /* private mode */ }
  }
  document.documentElement.lang = lang;

  // ---------- dictionary ----------
  const exact = new Map();
  const templates = [];
  let sorted = true;
  const cache = new Map();
  const missing = new Set();
  const outputs = new Set();
  const tpl = document.createElement('template');
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  const LETTER = /[A-Za-z]/;
  // The same text as the browser writes it back from innerHTML.
  function canon(s) {
    tpl.innerHTML = s;
    return norm(tpl.innerHTML);
  }
  function decode(s) {
    if (!/[<&]/.test(s)) return s;
    tpl.innerHTML = s;
    return tpl.content.textContent;
  }
  function compile(k, v) {
    const names = [];
    const src = k.split(/(\{\w+\})/).map((part) => {
      const m = /^\{(\w+)\}$/.exec(part);
      if (m) { names.push(m[1]); return '(.+?)'; }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('');
    templates.push({ re: new RegExp('^' + src + '$'), names, v, weight: k.replace(/\{\w+\}/g, '').length });
    sorted = false;
  }
  function add(dict) {
    for (const [k0, v] of Object.entries(dict)) {
      const forms = new Set([norm(k0)]);
      if (/[<&]/.test(k0)) forms.add(canon(k0));
      if (DEBUG) outputs.add(norm(decode(v))).add(norm(v));
      for (const k of forms) {
        if (/\{\w+\}/.test(k)) compile(k, v);
        else exact.set(k, v);
      }
    }
    cache.clear();
  }
  // Translation of one normalised text, or null when there is none.
  function lookup(s) {
    if (!s || !LETTER.test(s)) return null;
    const hit = exact.get(s);
    if (hit != null) return hit;
    if (cache.has(s)) return cache.get(s);
    if (!sorted) { templates.sort((a, b) => b.weight - a.weight); sorted = true; }
    let out = null;
    for (const t of templates) {
      const m = t.re.exec(s);
      if (!m) continue;
      out = t.v.replace(/\{(\w+)\}/g, (all, n) => {
        const c = m[t.names.indexOf(n) + 1];
        if (c == null) return all;
        const tc = lookup(norm(c));
        return tc == null ? c : tc;
      });
      break;
    }
    if (cache.size > 4000) cache.clear();
    cache.set(s, out);
    return out;
  }
  function t(s) {
    if (lang === 'en' || typeof s !== 'string') return s;
    const v = lookup(norm(s));
    return v == null ? s : decode(v);
  }

  // ---------- the page ----------
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'PRE', 'CANVAS', 'svg:style']);
  const INLINE = new Set(['B', 'I', 'EM', 'STRONG', 'A', 'SMALL', 'SUP', 'SUB', 'BR', 'KBD', 'ABBR', 'SPAN', 'CODE', 'U', 'S', 'MARK', 'Q', 'CITE', 'DFN', 'VAR', 'WBR']);
  const ATTRS = ['title', 'aria-label', 'aria-valuetext', 'placeholder', 'alt'];

  // Text that is already a translation is not missing.
  function note(k) { if (DEBUG && k && LETTER.test(k) && !outputs.has(k)) missing.add(k); }
  // Only inline markup inside, none of it with an id a script could hold on to.
  function phrasing(el) {
    for (const c of el.children) if (!INLINE.has(c.tagName) || c.id || !phrasing(c)) return false;
    return true;
  }
  function translateAttrs(el) {
    for (const a of ATTRS) {
      const raw = el.getAttribute(a);
      if (!raw || !LETTER.test(raw)) continue;
      const v = lookup(norm(raw));
      if (v == null) note(raw.trim());
      else el.setAttribute(a, decode(v));
    }
  }
  function translateText(n) {
    const raw = n.nodeValue;
    if (!raw || !LETTER.test(raw)) return;
    const p = n.parentNode;
    if (p && p.nodeType === 1 && (SKIP.has(p.tagName) || p.closest('[data-no-i18n]'))) return;
    const k = norm(raw);
    const v = lookup(k);
    if (v == null) { note(k); return; }
    const out = raw.match(/^\s*/)[0] + decode(v) + raw.match(/\s*$/)[0];
    if (out !== raw) n.nodeValue = out;
  }
  function translateEl(el) {
    if (el.hasAttribute('data-no-i18n')) return;
    translateAttrs(el);
    if (SKIP.has(el.tagName)) return;
    if (el.firstElementChild && phrasing(el)) {
      const k = norm(el.innerHTML);
      if (LETTER.test(k)) {
        const v = lookup(k);
        if (v != null) {
          el.innerHTML = v;
          for (const c of el.querySelectorAll('*')) translateAttrs(c);
          return;
        }
        // Report the whole sentence too, but only when its pieces fall short.
        const before = missing.size;
        translateChildren(el);
        if (missing.size > before) note(k);
        return;
      }
    }
    translateChildren(el);
  }
  function translateChildren(el) {
    for (let n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) translateText(n);
      else if (n.nodeType === 1) translateEl(n);
    }
  }
  function translateHead() {
    const tv = lookup(norm(document.title));
    if (tv != null) document.title = decode(tv);
    else note(document.title);
    const d = document.querySelector('meta[name="description"]');
    if (d) { const v = lookup(norm(d.content)); if (v != null) d.content = decode(v); }
  }

  let observer = null;
  function onMutations(recs) {
    const seen = new Set();
    for (const r of recs) {
      const tg = r.target;
      if (r.type === 'attributes') { if (tg.isConnected) translateAttrs(tg); continue; }
      if (r.type === 'characterData') { if (tg.isConnected) translateText(tg); continue; }
      if (!tg.isConnected || seen.has(tg)) continue;
      if (tg.nodeType === 1 && tg.firstElementChild && phrasing(tg) && tg.tagName !== 'BODY') {
        seen.add(tg);
        translateEl(tg);
        continue;
      }
      for (const n of r.addedNodes) {
        if (!n.isConnected) continue;
        if (n.nodeType === 3) translateText(n);
        else if (n.nodeType === 1) translateEl(n);
      }
    }
    // Everything still queued was written by the lines above.
    observer.takeRecords();
  }

  function translatePage() {
    translateHead();
    translateEl(document.body);
    observer = new MutationObserver(onMutations);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    const title = document.querySelector('title');
    if (title) new MutationObserver(translateHead).observe(title, { childList: true, characterData: true, subtree: true });
  }

  // Text drawn on canvases.
  function patchCanvas(proto) {
    if (!proto) return;
    for (const fn of ['fillText', 'strokeText', 'measureText']) {
      const orig = proto[fn];
      if (!orig) continue;
      proto[fn] = function (s, ...rest) {
        if (typeof s === 'string' && LETTER.test(s)) {
          const v = lookup(norm(s));
          if (v != null) s = decode(v);
          else if (fn !== 'measureText') note(norm(s));
        }
        return orig.call(this, s, ...rest);
      };
    }
  }

  // ---------- the switch ----------
  const SWITCH_CSS = `
.lang-switch { display: inline-flex; flex: none; border: 1px solid color-mix(in srgb, currentColor 35%, transparent); border-radius: 999px; overflow: hidden; vertical-align: middle; }
.lang-switch a { padding: 3px 9px; font: 700 11.5px/1.4 system-ui, sans-serif; letter-spacing: .04em; color: inherit; opacity: .75; text-decoration: none; }
.lang-switch a:hover { opacity: 1; text-decoration: none; }
.lang-switch a[aria-current] { opacity: 1; background: var(--accent, #2a6f73); color: var(--surface, #fff); }
.lang-switch a:focus-visible { outline: 2px solid var(--accent, #2a6f73); outline-offset: -2px; }
`;
  function hrefFor(l) {
    const u = new URL(location.href);
    u.searchParams.set('lang', l);
    u.searchParams.delete('i18n');
    return u.pathname + u.search + u.hash;
  }
  function switcher() {
    if (!document.getElementById('lang-switch-css')) {
      const st = document.createElement('style');
      st.id = 'lang-switch-css';
      st.textContent = SWITCH_CSS;
      document.head.appendChild(st);
    }
    const el = document.createElement('span');
    el.className = 'lang-switch';
    el.setAttribute('role', 'group');
    el.setAttribute('data-no-i18n', '');
    el.setAttribute('aria-label', lang === 'es' ? 'Idioma' : 'Language');
    for (const l of LANGS) {
      const a = document.createElement('a');
      a.textContent = l.toUpperCase();
      a.lang = l;
      a.hreflang = l;
      a.href = hrefFor(l);
      if (l === lang) a.setAttribute('aria-current', 'true');
      // The hash can change after the page loads (deep links), so build the link on click.
      a.addEventListener('click', (e) => {
        e.preventDefault();
        try { localStorage.setItem(KEY, l); } catch (err) { /* private mode */ }
        location.href = hrefFor(l);
      });
      el.appendChild(a);
    }
    return el;
  }
  function mountSwitches() {
    for (const slot of document.querySelectorAll('[data-lang-switch]')) {
      if (!slot.firstChild) slot.appendChild(switcher());
    }
  }

  window.I18N = { lang, add, t, switcher, missing: () => [...missing].sort() };

  document.addEventListener('DOMContentLoaded', mountSwitches);
  if (lang === 'en') return;

  // Spanish: load the dictionaries before the page body, translate once the
  // page is built, and keep the body hidden until then so English never flashes.
  const hide = document.createElement('style');
  hide.textContent = 'html.i18n-wait body { visibility: hidden; }';
  document.head.appendChild(hide);
  document.documentElement.classList.add('i18n-wait');
  const show = () => document.documentElement.classList.remove('i18n-wait');
  setTimeout(show, 4000);
  if (document.readyState === 'loading' && ROOT) {
    for (const f of FILES) document.write('<script src="' + ROOT + 'lib/i18n/es/' + f + '.js"><\/script>');
  }
  patchCanvas(window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype);
  patchCanvas(window.OffscreenCanvasRenderingContext2D && OffscreenCanvasRenderingContext2D.prototype);
  document.addEventListener('DOMContentLoaded', () => {
    try { translatePage(); } finally { show(); }
  });
})();
