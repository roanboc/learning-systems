// Guided lab for First genes (engine: lib/learn.js, page hooks: window.EarlyEarthPage).
(function () {
  'use strict';

  const page = window.EarlyEarthPage;
  const SEED = 3;

  const pc = (v) => Math.round((v || 0) * 100) + '%';
  const two = () => page.worlds.length >= 2;
  const st = (W) => W.sim.stats;
  // The protocell that makes most of itself, or the one with most copiers.
  function best(W) {
    let pick = null;
    for (const b of W.sim.bubbles) {
      if (b.skin === undefined || b.copiers < 0.05) continue;
      if (!pick || b.closure + b.copiers * 0.01 > pick.closure + pick.copiers * 0.01) pick = b;
    }
    return pick;
  }
  const parasites = (b) => (b && b.copiers > 0 ? b.plain / b.copiers : 0);

  const skin = {
    id: 'break-the-skin',
    title: 'Why keep genes inside a skin?',
    question: 'A gene that makes the skin works for the whole protocell. What happens when its work leaks out to everyone?',
    levels: ['Protocell', 'Molecules', 'Population', 'Coast'],
    setup(api, s) {
      api.replaceWorlds([['genes', SEED], ['leaky', SEED]]);
      api.setSpeed('8');
      api.setMetric('closure');
      api.play();
      s.picked = [null, null];
    },
    steps: [
      {
        level: 0,
        title: 'Two coasts, one difference',
        text: 'Both coasts start with the same protocells near the vents, each holding a random mix of copiers: **skin-makers**, **block-makers** and **plain copiers**. Left: what genes make stays inside their own protocell. Right: a **leaky skin**, so what genes make spills into the water and helps any bubble nearby. Green protocells are rich in working genes, pink ones in parasites; a golden skin means it makes itself.',
        action: {
          label: 'Follow a protocell on each coast',
          run(api, s) {
            if (!two()) return;
            api.worlds.forEach((W, k) => { s.picked[k] = best(W); api.follow(W, s.picked[k], 6); });
            api.reveal();
          },
        },
        wait: 'Give the protocells a day to start working.',
        check: (api) => two() && api.worlds[0].sim.t > 800,
        result(api) {
          if (!two()) return 'This lab needs two worlds. Restart it from Guided labs.';
          const [A, B] = api.worlds;
          return `Protocells make **${pc(st(A).closure)}** of themselves on the left and **${pc(st(B).closure)}** on the right.`;
        },
      },
      {
        level: 1,
        title: 'Inside, parasites always win',
        text: 'Look at the numbers under each map: skin-makers, block-makers and parasites. Plain copiers do no work, so they copy a little faster, and broken copies of working genes join them. Inside any one protocell their share only grows. If nothing else happened, every protocell would end up full of parasites, unable to make its skin.',
        action: {
          label: 'Follow the busiest protocell again',
          run(api, s) {
            if (!two()) return;
            api.worlds.forEach((W, k) => { s.picked[k] = best(W); api.follow(W, s.picked[k], 8); });
            api.reveal();
          },
        },
        wait: 'Waiting for protocells to split a few times.',
        check: (api) => two() && api.worlds[0].sim.maxGen >= 5,
        result(api, s) {
          if (!two()) return '';
          const [a, b] = s.picked;
          return `Parasites in the protocell you follow: **${pc(parasites(a))}** on the left, **${pc(parasites(b))}** on the right.`;
        },
      },
      {
        level: 2,
        title: 'Between protocells, working genes win',
        text: 'At each split the genes are shared by chance, so some daughters get more working genes than others. On the left, a daughter rich in skin-makers grows its own skin and splits sooner, and one full of parasites shrinks and breaks up. Selection between protocells pushes back against the parasites inside them. On the right, what a protocell makes helps its neighbours just as much, so having working genes gives it no edge. Which line should fall?',
        action: {
          label: 'Chart working genes',
          run(api) { api.setMetric('working'); api.reveal(); },
        },
        wait: 'Waiting for the two lines to separate. Fast-forward helps.',
        check(api) {
          if (!two()) return false;
          const [A, B] = api.worlds;
          return st(A).working > st(B).working + 0.15;
        },
        result(api) {
          if (!two()) return '';
          const [A, B] = api.worlds;
          return `Working genes: **${pc(st(A).working)}** of copiers on the left, **${pc(st(B).working)}** on the right.`;
        },
      },
      {
        level: 3,
        title: 'The whole coast',
        text: 'Zoom out. On the left, lineages of protocells that keep their working genes go on making their own skin, generation after generation. On the right, parasites take over one protocell after another; its bubbles live on whatever oils the vents and others leave in the water, and their lineages keep breaking off.',
        action: {
          label: 'Show both whole coasts',
          run(api) {
            for (const W of api.worlds) { W.follow = false; api.look(W, W.sim.earth.cols / 2, W.sim.earth.rows / 2, 1); W.mark = null; }
            api.setMetric('maxGen');
            api.reveal();
          },
        },
        wait: 'Keep it running on Fast-forward for a few more days.',
        check(api) {
          if (!two()) return false;
          const [A, B] = api.worlds;
          return A.sim.maxGen > B.sim.maxGen * 1.5 + 10;
        },
        result(api) {
          if (!two()) return '';
          const [A, B] = api.worlds;
          return `Longest lineage: **${A.sim.maxGen}** generations on the left, **${B.sim.maxGen}** on the right. Protocells make **${pc(st(A).closure)}** of themselves on the left and **${pc(st(B).closure)}** on the right.`;
        },
      },
    ],
    think: {
      q: 'Why do working genes last on the left coast but not on the right?',
      opts: [
        { t: 'Working genes copy faster on the left.', why: 'They copy just as slowly on both coasts. Inside every protocell, plain copiers still win.' },
        { t: 'The skin keeps a gene\'s work for its own protocell, so protocells with working genes leave more daughters.', ok: true, why: 'The skin ties a gene\'s fate to the work it does. Genes and the skin they make depend on each other: this mutual making is closure, the modern reading of autopoiesis.' },
        { t: 'There are fewer mutations on the left.', why: 'Copies come out broken just as often on both coasts. What differs is whether a protocell gains from its own genes.' },
      ],
    },
  };

  window.Learn.mount({ toolbar: document.querySelector('.toolbar'), labs: [skin], api: page });
})();
