// Guided labs for First cells (engine: lib/learn.js, page hooks: window.FirstCellsPage).
(function () {
  'use strict';

  const page = window.FirstCellsPage;
  const SEED = 3;

  const n2 = (v) => (v == null ? '–' : v >= 10 ? v.toFixed(0) : v.toFixed(2));
  const three = () => page.worlds.length >= 3;
  const st = (W) => W.sim.stats;
  // Light where the cells are, compared with the water on average (by day).
  const lightRel = (W) => { const s = st(W); return s.lightInWater > 0.15 ? s.lightAtCells / s.lightInWater : null; };
  function pick(W, best) {
    let c = null;
    for (const x of W.sim.cells) if (!c || best(x) > best(c)) c = x;
    return c;
  }

  const moving = {
    id: 'learning-to-move',
    title: 'How did cells start to move?',
    question: 'Why would a drifting cell evolve a motor, and how strong should it be?',
    levels: ['Cell', 'Population', 'Coast', 'Cell again'],
    setup(api, s) {
      api.replaceWorlds([['evolve', SEED], ['fast', SEED], ['nomotor', SEED]]);
      api.setSpeed('ff');
      api.setMetric('speed');
      api.play();
      s.first = null;
    },
    steps: [
      {
        level: 0,
        title: 'Three coasts, three kinds of cell',
        text: 'Left: cells start with **almost no motor**; currents carry them. Middle: the same cells, but they start with **strong motors**. Right: **no motors at all**, ever. Same coast, sun and vents in all three. Every daughter copies its parent\'s genes with small mistakes, and nothing else decides the genes but who leaves daughters.',
        action: {
          label: 'Zoom into a cell on the left and in the middle',
          run(api) {
            if (!three()) return;
            const [A, B] = api.worlds;
            api.follow(A, pick(A, (c) => c.clumpSize === 1 ? 1 + Math.random() : 0), 14);
            api.follow(B, pick(B, (c) => c.clumpSize === 1 ? 1 + Math.random() : 0), 14);
            api.reveal();
          },
        },
        result(api) {
          if (!three()) return 'This lab needs three worlds. Restart it from Guided labs.';
          const [A, B, C] = api.worlds;
          return `Average motor now: **${n2(st(A).speed)}** left, **${n2(st(B).speed)}** middle, **${n2(st(C).speed)}** right. The wavy tail is the flagellum: longer for a stronger motor.`;
        },
      },
      {
        level: 1,
        title: 'Weak motors grow, strong motors shrink',
        text: 'Watch the chart. A motor lets a cell leave a spot it has eaten bare and reach fresh food before the current takes it away. But swimming costs energy, and the cost rises fast with speed. So the left world should climb and the middle world should fall.',
        wait: 'Waiting for the two lines to meet. This takes about five days on Fast-forward.',
        result(api) {
          if (!three()) return '';
          const [A, B] = api.worlds;
          return `Motor: **${n2(st(A).speed)}** left (started near 0), **${n2(st(B).speed)}** middle (started near 0.25). Generations so far: ${st(A).maxGen} and ${st(B).maxGen}.`;
        },
        check(api) {
          if (!three()) return false;
          const [A, B] = api.worlds;
          return st(A).speed > 0.06 && st(B).speed < 0.15 && Math.abs(st(A).speed - st(B).speed) < 0.06;
        },
      },
      {
        level: 1,
        title: 'A motor needs steering',
        text: 'A motor alone moves a cell at random. The **follows food** gene sets how long a cell keeps its course while food is getting richer (run and tumble, like E. coli). It can only help a cell that swims. On the right, where nobody swims, the gene does nothing, so it just wanders by chance.',
        enter(api) { api.setMetric('tumble'); },
        result(api) {
          if (!three()) return '';
          const [A, B, C] = api.worlds;
          return `Follows food: **${n2(st(A).tumble)}** left, **${n2(st(B).tumble)}** middle, **${n2(st(C).tumble)}** right. It tends to rise more where cells swim; in our test runs the gap was clear on some coasts and small on others.`;
        },
      },
      {
        level: 2,
        title: 'Light',
        text: 'These cells also gain a little energy from light. The **eyespot** gene lets a cell tell where light comes from and turn toward it, and away when light is too strong (so it does not get stranded on the shallowest rock). The map now shows light. The chart compares light where the cells are with light in the water on average: above 1 means cells are finding light.',
        action: {
          label: 'Show light on all three maps',
          run(api) {
            for (const W of api.worlds) { api.setLayer(W, 'light'); api.look(W, W.sim.earth.cols / 2, W.sim.earth.rows / 2, 1); }
            api.setMetric('light');
            api.reveal();
          },
        },
        result(api) {
          if (!three()) return '';
          const [A, , C] = api.worlds;
          return `Eyespot: **${n2(st(A).eyespot)}** left, ${n2(st(C).eyespot)} right. Light found (by day): **${n2(lightRel(A))}** left, **${n2(lightRel(C))}** right. Most food on this coast comes from the vents, in the dark, so light sense pays only a little here.`;
        },
      },
      {
        level: 3,
        title: 'Back to one cell',
        text: 'Here is one of the strongest swimmers on the left. Its tail beats while it swims; the red dot at its front is its eyespot. Its ancestors, a few days ago, had neither. Set Speed to Slow to watch it run and tumble.',
        action: {
          label: 'Follow the fastest swimmer on the left',
          run(api) {
            if (!three()) return;
            const A = api.worlds[0];
            api.setLayer(A, 'nature');
            // A strong swimmer that is also well fed, so it lives long enough to watch.
            api.follow(A, pick(A, (c) => (c.energy > 1 && c.age < 600 ? c.g.speed + 0.3 * c.g.eyespot : -1)), 14);
            api.setSpeed('1');
            api.reveal();
          },
        },
        result(api) {
          if (!three()) return '';
          const c = api.worlds[0].selected;
          if (!c) return 'Press the button to find a cell.';
          if (c.dead) return 'That cell has died. Press the button again for another.';
          return `Cell #${c.id}, generation ${c.gen}: motor **${n2(c.g.speed)}**, follows food **${n2(c.g.tumble)}**, eyespot **${n2(c.g.eyespot)}**.`;
        },
      },
    ],
    think: {
      q: 'Weak motors grew and strong motors shrank, until both coasts had about the same motor. What does that tell you?',
      opts: [
        { t: 'Cells try to swim at a comfortable speed.', why: 'Cells have no aims. A gene changes only because the cells carrying some versions of it leave more daughters than others.' },
        { t: 'There is a best strength for this coast: weaker motors miss food, stronger ones burn more energy than they win.', ok: true, why: 'Selection pushed from both sides toward the same value. Change the coast (more food, stronger currents) and the best motor would change too.' },
        { t: 'Mutations push every gene toward the middle.', why: 'Mutations here go up and down equally. The right world shows what chance alone does: the useless "follows food" gene wanders, it is not pulled anywhere in particular.' },
      ],
    },
  };

  window.Learn.mount({ toolbar: document.querySelector('.toolbar'), labs: [moving], api: page });
})();
