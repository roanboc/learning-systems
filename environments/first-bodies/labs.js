// Guided lab for Bodies (engine: lib/learn.js, page hooks: window.LifePage).
(function () {
  'use strict';

  const page = window.LifePage;
  const MOVER = window.LifeSim.MOVER;
  const SEED = 3;

  const n2 = (v) => (v == null ? '–' : v >= 10 ? v.toFixed(0) : v.toFixed(2));
  const n3 = (v) => (v == null ? '–' : v.toFixed(3));
  const two = () => page.worlds.length >= 2;
  const st = (W) => W.sim.stats;
  function pick(W, best) {
    let c = null;
    for (const x of W.sim.cells) if (!c || best(x) > best(c)) c = x;
    return c;
  }
  // A contracting cell in a big, well-fed body, so there is something to watch.
  const inBody = (c) => (c.role === MOVER && c.clumpSize >= 4 && c.energy > 0.5 ? c.clumpSize + Math.random() : -1);

  const beating = {
    id: 'muscles-beat-together',
    title: 'Why do muscles beat together?',
    question: 'Every contracting cell pushes just as hard on both coasts. Why does one kind of body move faster?',
    levels: ['Body', 'Cell', 'Body', 'Population'],
    setup(api) {
      api.replaceWorlds([['coupled', SEED], ['uncoupled', SEED]]);
      api.setSpeed('1');
      api.setMetric('inStep');
      api.play();
    },
    steps: [
      {
        level: 0,
        title: 'Two coasts, one difference',
        text: 'Both coasts hold the same small bodies: cells that stuck together after dividing. Some cells in a body take a role: **contracting cells** squeeze and pull their neighbours closer, and that pushes the body along. Left: each contracting cell **feels its neighbours** and falls into their rhythm (like the gap junctions that link real muscle cells). Right: each one keeps **its own rhythm**.',
        action: {
          label: 'Zoom into a body on each coast',
          run(api) {
            if (!two()) return;
            for (const W of api.worlds) api.follow(W, pick(W, inBody), 16);
            api.reveal();
          },
        },
        result(api) {
          if (!two()) return 'This lab needs two worlds. Restart it from Guided labs.';
          const [A, B] = api.worlds;
          return `Contracting cells: **${st(A).movers}** left, **${st(B).movers}** right. Bodies with roles: ${st(A).bodies} and ${st(B).bodies}.`;
        },
      },
      {
        level: 1,
        title: 'One squeeze',
        text: 'Contracting cells are yellow. While one squeezes it turns **orange and shrinks**, then rests. Set Speed to Slow to see it. On the left the orange flashes come all at once, like a heartbeat. On the right they come one by one. The chart shows how together each body squeezes: 1 means all at once.',
        result(api) {
          if (!two()) return '';
          const [A, B] = api.worlds;
          return `In step: **${n2(st(A).inStep)}** left, **${n2(st(B).inStep)}** right. Even cells on random rhythms score about 0.5, because a few cells line up by chance.`;
        },
      },
      {
        level: 2,
        title: 'Together means faster',
        text: 'Now the chart shows how fast bodies push themselves along, not counting the current. Each contracting cell pushes just as hard on both coasts. Wait and see which bodies move faster.',
        enter(api) { api.setMetric('bodySpeed'); api.setSpeed('ff'); },
        wait: 'Waiting for the two lines to separate.',
        check(api) {
          if (!two()) return false;
          const [A, B] = api.worlds;
          return st(A).bodySpeed > 0.03 && st(A).bodySpeed > 1.4 * st(B).bodySpeed;
        },
        result(api) {
          if (!two()) return '';
          const [A, B] = api.worlds;
          return `Body speed: **${n3(st(A).bodySpeed)}** left, **${n3(st(B).bodySpeed)}** right. In our test runs, bodies that beat together moved 1.5 to 2 times as fast.`;
        },
      },
      {
        level: 3,
        title: 'Does evolution find it?',
        text: 'A third coast starts with a weak **linking gene** and lets it evolve. If beating together pays, bodies with a stronger link should leave more daughters, and the gene should rise. The chart now shows the gene.',
        action: {
          label: 'Add a coast where linking can evolve',
          run(api) {
            if (api.worlds.length < 3) api.addWorld('free', SEED);
            api.setMetric('sync');
            api.reveal();
          },
        },
        result(api) {
          const C = api.worlds[2];
          if (!C) return 'Press the button to add the third coast.';
          return `Linking gene on the new coast: **${n2(st(C).sync)}** (it starts between 0 and 0.1). Honest result: in our tests it rose only slowly, to about 0.15, and with a stronger start it went up on one coast and down on another. Beating together helps, but here the help is small next to finding food.`;
        },
      },
    ],
    think: {
      q: 'Each contracting cell pushes just as hard on both coasts. Why do linked bodies move faster?',
      opts: [
        { t: 'Linked cells are stronger.', why: 'They are not. Every squeeze has the same force on both coasts; only the timing differs.' },
        { t: 'Pushes add up only when they happen at the same time; out of step, one cell squeezes while another relaxes and they partly cancel.', ok: true, why: 'This is why real muscle cells are wired together by gap junctions, and why a heart beats as one. Out of step, a body mostly wobbles.' },
        { t: 'The current helps linked bodies.', why: 'Body speed leaves out the current. Both coasts have the same current anyway.' },
      ],
    },
  };

  window.Learn.mount({ toolbar: document.querySelector('.toolbar'), labs: [beating], api: page });
})();
