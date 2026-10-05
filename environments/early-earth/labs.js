// Guided labs for Early Earth (engine: lib/learn.js, page hooks: window.EarlyEarthPage).
(function () {
  'use strict';

  const page = window.EarlyEarthPage;
  const SEED = 3; // a coast where copiers arise within about a week

  // Readouts, straight from the simulation.
  function pools(W) {
    const e = W.sim.earth;
    let n = 0;
    for (let i = 0; i < e.n; i++) if (e.water[i] > 0.01 && !e.connected[i]) n++;
    return n;
  }
  function peakChains(W) {
    const e = W.sim.earth, f = W.sim.f.chains;
    let best = 0, at = null;
    for (let i = 0; i < e.n; i++) if (e.water[i] > 0.01 && f[i] > best) { best = f[i]; at = i; }
    return { v: best, x: at == null ? null : at % e.cols, y: at == null ? null : Math.floor(at / e.cols) };
  }
  function chainsAt(W, x, y) {
    const e = W.sim.earth, i = e.cellAt(x, y);
    return e.water[i] > 0.01 ? W.sim.f.chains[i] : 0;
  }
  function origins(W) { return W.sim.extinctions + (W.sim._present ? 1 : 0); }
  const times = (n) => (n === 0 ? 'never' : n === 1 ? 'once' : n + ' times');
  const n2 = (v) => (v >= 10 ? v.toFixed(0) : v.toFixed(2));
  const both = () => page.worlds.length >= 2;

  const tidePools = {
    id: 'tide-pools',
    title: 'Why tide pools?',
    question: 'Why do long chains, and then copiers, only appear where pools dry out?',
    levels: ['Coast', 'Pool', 'Molecules', 'Coast again'],
    setup(api, st) {
      api.replaceWorlds([['full', SEED], ['calm', SEED]]);
      for (const W of api.worlds) api.setLayer(W, 'chains');
      api.setSpeed('8');
      api.setMetric('chains');
      api.play();
      st.maxPools = [0, 0];
      st.spot = null;
    },
    steps: [
      {
        level: 0,
        title: 'Two coasts, one difference',
        text: 'Left: Early Earth. Right: its twin with **the tides switched off**. Same seed, so the same rocks, sun and vents. Both maps show the Chains layer. Watch the tide go out on the left: water stays behind in hollows of rock.',
        wait: 'Waiting for a low tide on the left. Fast-forward helps.',
        result(api, st) {
          if (!both()) return 'This lab needs both worlds. Restart it from Guided labs.';
          api.worlds.forEach((W, k) => { st.maxPools[k] = Math.max(st.maxPools[k], pools(W)); });
          return `Tide pools right now: **${pools(api.worlds[0])}** cells on the left, **${pools(api.worlds[1])}** on the right.`;
        },
        check: (api, st) => st.maxPools[0] > 150,
      },
      {
        level: 1,
        title: 'Chains pile up where pools dry',
        text: 'Building blocks join into chains only when there is little water around, and water breaks chains apart again. In a drying pool, joining wins. The orange glow is chains. When the tide comes back, the water breaks them up again, and the next low tide builds a new batch. On the right the sea never leaves the rocks, so water keeps breaking them.',
        action: {
          label: 'Fly both maps to the busiest pool',
          run(api, st) {
            if (!both()) return;
            const p = peakChains(api.worlds[0]);
            if (p.x == null) return;
            st.spot = p;
            for (const W of api.worlds) { api.setLayer(W, 'chains'); api.look(W, p.x, p.y, 5); }
            api.reveal();
          },
        },
        wait: 'Chains need a few days of drying. Set Speed to Fast-forward if the maps stay dark.',
        result(api) {
          if (!both()) return '';
          const a = peakChains(api.worlds[0]).v, b = peakChains(api.worlds[1]).v;
          return `Most chains in any one spot: **${n2(a)}** on the left, **${n2(b)}** on the right.`;
        },
        check: (api) => both() && peakChains(api.worlds[0]).v > 1.5,
      },
      {
        level: 2,
        title: 'Down to the molecules',
        text: 'Zoom in until the water turns into molecules. Chains are the short strings of beads in the chain colour; single dots are building blocks. Look at the pool on the left, then at the same spot on the right. Set Speed to Slow, or Pause, to look closely.',
        action: {
          label: 'Zoom both maps to molecules',
          run(api, st) {
            if (!both()) return;
            const now = peakChains(api.worlds[0]);
            const p = now.v > 0.5 || !st.spot ? now : st.spot;
            if (p.x == null) return;
            st.spot = p;
            for (const W of api.worlds) {
              api.setLayer(W, 'nature');
              const base = api.scale(W) / W.cam.zoom;
              api.look(W, p.x, p.y, 28 / base);
            }
            api.reveal();
          },
        },
        wait: 'Zoom the left map in close, with Show set to Nature or Chemicals.',
        result(api, st) {
          if (!both() || !st.spot) return '';
          const a = chainsAt(api.worlds[0], st.spot.x, st.spot.y), b = chainsAt(api.worlds[1], st.spot.x, st.spot.y);
          const now = peakChains(api.worlds[0]).v;
          return `Chains at this spot: **${n2(a)}** on the left, **${n2(b)}** on the right.` +
            (now > a * 2 && now > 0.5 ? ` The busiest spot on the left now holds ${n2(now)}: press the button again to jump there.` : '');
        },
        check(api) {
          if (!both()) return false;
          const W = api.worlds[0];
          return api.scale(W) > 22 && (W.layer === 'nature' || W.layer === 'mix');
        },
      },
      {
        level: 3,
        title: 'No chains, no copiers',
        text: 'Copiers are rare chains that help make more of themselves. They can only arise where chains are plentiful. Zoom back out and watch the Copiers layer for pink patches.',
        action: {
          label: 'Show both whole coasts, Copiers layer',
          run(api) {
            for (const W of api.worlds) { api.setLayer(W, 'copiers'); api.look(W, W.sim.earth.cols / 2, W.sim.earth.rows / 2, 1); W.mark = null; }
            api.setMetric('copierPatch');
            api.reveal();
          },
        },
        wait: 'Copiers arise by chance, around day 6 to 8 on this coast. Fast-forward helps.',
        result(api) {
          if (!both()) return '';
          const [A, B] = api.worlds;
          return `Copiers have arisen **${times(origins(A))}** on the left and **${times(origins(B))}** on the right. Copier patches now: ${A.sim.stats.copierPatch || 0} and ${B.sim.stats.copierPatch || 0}.`;
        },
        check: (api) => both() && origins(api.worlds[0]) > 0,
      },
    ],
    think: {
      q: 'The right coast has sun, heat and building blocks, but no chains. Which change would most likely bring chains back?',
      opts: [
        { t: 'More vents, for more heat.', why: 'Heat makes more energy and blocks, but water still breaks every chain. Heat even speeds up the breaking. The missing step is drying.' },
        { t: 'Let some hollows of rock fall dry in the sun.', ok: true, why: 'Chains need little water. Any place that dries, with or without tides, lets blocks join faster than water breaks them apart. Tides are just one way to get wet and dry cycles.' },
        { t: 'Seed copiers into the open sea.', why: 'Copiers need plenty of blocks and company. In open water they get diluted and die out, as the field journal shows each time copiers vanish.' },
      ],
    },
  };

  window.Learn.mount({ toolbar: document.querySelector('.toolbar'), labs: [tidePools], api: page });
})();
