// Guided lab for Colonies: sharers and cheats (engine: lib/learn.js, page hooks: window.LifePage).
(function () {
  'use strict';

  const page = window.LifePage;
  const SEED = 3;

  const n2 = (v) => (v == null ? '–' : v >= 10 ? v.toFixed(0) : v.toFixed(2));
  const pc = (v) => Math.round((v || 0) * 100) + '%';
  const two = () => page.worlds.length >= 2;
  const st = (W) => W.sim.stats;
  function pick(W, best) {
    let c = null;
    for (const x of W.sim.cells) if (!c || best(x) > best(c)) c = x;
    return c;
  }
  // A well-fed cell in a colony, or a single cell on a coast without colonies.
  const inColony = (c) => (c.energy > 0.5 ? c.clumpSize + Math.random() : -1);

  const sharing = {
    id: 'sharers-and-cheats',
    title: 'Why share when you could cheat?',
    question: 'Making the helper molecule costs energy and helps everyone nearby. Why doesn\'t cheating always win?',
    levels: ['Cell', 'Population', 'Coast', 'Population'],
    setup(api) {
      api.replaceWorlds([['together', SEED], ['apart', SEED]]);
      api.setSpeed('ff');
      api.setMetric('helper');
      api.play();
    },
    steps: [
      {
        level: 0,
        title: 'Two coasts, one difference',
        text: 'Both coasts start with the same cells: most make a **helper molecule** that turns raw molecules in the water into building blocks anyone nearby can eat. Making it costs energy. Daughters copy the helper gene with small mistakes, so **cheats** that make little or none keep appearing. Left: daughters **stay stuck** to their mother, so families live together. Right: daughters **drift apart** among strangers. Green cells share, purple cells cheat.',
        action: {
          label: 'Zoom into a cell on each coast',
          run(api) {
            if (!two()) return;
            for (const W of api.worlds) api.follow(W, pick(W, inColony), 14);
            api.reveal();
          },
        },
        result(api) {
          if (!two()) return 'This lab needs two worlds. Restart it from Guided labs.';
          const [A, B] = api.worlds;
          return `Helper made: **${n2(st(A).helper)}** left, **${n2(st(B).helper)}** right. Cells in clumps: ${pc(st(A).inClumps)} and ${pc(st(B).inClumps)}.`;
        },
      },
      {
        level: 1,
        title: 'Cheats take over among strangers',
        text: 'Watch the chart. On the right, a sharer\'s help lands on strangers just as much as on itself, and cheats get it without paying. On the left, the help lands mostly on the sharer\'s own family, which carries the same gene. Which line should fall?',
        wait: 'Waiting for the two lines to separate. This takes several days on Fast-forward.',
        check(api) {
          if (!two()) return false;
          const [A, B] = api.worlds;
          return st(A).helper > st(B).helper + 0.08;
        },
        result(api) {
          if (!two()) return '';
          const [A, B] = api.worlds;
          return `Helper made: **${n2(st(A).helper)}** left, **${n2(st(B).helper)}** right. Cheats: ${pc(st(A).cheats)} and ${pc(st(B).cheats)}. In our test runs, the right coast fell from about 0.55 to 0.3 to 0.4 while the left one held.`;
        },
      },
      {
        level: 2,
        title: 'Where the help goes',
        text: 'Both maps now show the helper molecule in the water. On the left it sits in patches where families live; on the right it is thinner and spread among everyone. Currents carry it too, so some help always drifts to strangers.',
        enter(api) { for (const W of api.worlds) { api.look(W, W.sim.earth.cols / 2, W.sim.earth.rows / 2, 1); api.setLayer(W, 'helper'); } },
        result(api) {
          if (!two()) return '';
          const [A, B] = api.worlds;
          return `Generations so far: ${st(A).maxGen} left, ${st(B).maxGen} right.`;
        },
      },
      {
        level: 3,
        title: 'Can sharing start from cheats?',
        text: 'A third coast keeps families together but starts with **almost everyone a cheat** (helper about 0.1). If helping your own family pays, the gene should creep up again.',
        action: {
          label: 'Add a coast that starts with cheats',
          run(api) {
            if (api.worlds.length < 3) api.addWorld('cheats', SEED);
            api.setMetric('helper');
            api.reveal();
          },
        },
        result(api) {
          const C = api.worlds[2];
          if (!C) return 'Press the button to add the third coast.';
          return `Helper made on the new coast: **${n2(st(C).helper)}** (it starts at about 0.1). Honest result: in our tests it rose slowly, to about 0.19 after many days, on both coasts we tried. Selection is real but weak here, because one map cell holds several families.`;
        },
      },
    ],
    think: {
      q: 'Why does the helper gene hold up when daughters stay with their mother?',
      opts: [
        { t: 'Stuck cells are kinder.', why: 'Cells have no intentions. The same gene does the same thing on both coasts; only who lives next to whom differs.' },
        { t: 'The help lands mostly on relatives who carry the same gene, so the gene helps copies of itself.', ok: true, why: 'This is kin selection: sharing spreads when relatedness × benefit is bigger than the cost (Hamilton\'s rule). Among strangers, cheats get the same benefit without the cost.' },
        { t: 'Cheats cannot stick.', why: 'Cheats stick just as well; on the left coast every cell has the same sticking gene.' },
      ],
    },
  };

  window.Learn.mount({ toolbar: document.querySelector('.toolbar'), labs: [sharing], api: page });
})();
