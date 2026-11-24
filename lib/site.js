// The site's look, shared by every page: the light "field notebook" of film 1.
// Load it in <head>, right after lib/i18n.js, so the page never flashes its
// old colours. It
//   - keeps every page light (the pages' dark colours stay in their CSS, unused),
//   - loads the film's fonts (Space Grotesk for headings and labels),
//   - adds lib/site.css, which repaints the pages' own colour tokens.
(function () {
  'use strict';
  const SELF = document.currentScript;
  const ROOT = SELF && SELF.src ? new URL('../', SELF.src).href : '';
  document.documentElement.dataset.theme = 'light';
  const add = (href) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); };
  add('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
  add(ROOT + 'lib/site.css');
})();
