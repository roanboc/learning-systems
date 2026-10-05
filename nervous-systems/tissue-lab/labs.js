// Guided labs for the Tissue Lab (engine: lib/learn.js, page hooks: window.TissueLabPage).
(function () {
  'use strict';

  const page = window.TissueLabPage;
  const SEED = 1;

  const last = (T) => T.history[T.history.length - 1] || {};
  const both = () => page.slots.length >= 2;

  const whoCleans = {
    id: 'who-cleans',
    title: 'Who prunes, and who cleans up?',
    question: 'Synapses overshoot and then get pruned. Are microglia the ones doing the pruning?',
    levels: ['Tissue', 'Cell', 'Tissue again'],
    setup(api, st) {
      api.replaceDishes([
        { name: 'Full tissue', params: { seed: SEED } },
        { name: 'No microglia', params: { seed: SEED, microglia: false } },
      ]);
      api.setMetric('synapses');
      api.setSpeed(25);
      api.play();
      st.peak = [0, 0];
    },
    steps: [
      {
        level: 0,
        title: 'Synapses overshoot, then fall',
        text: 'Left: a full slice of tissue. Right: the same slice with **no microglia**, the brain\'s own immune cells, which engulf weak synapses and dead cells. Each young neuron fires too little, so it grows synapses until it fires too much, then trims them back. Watch the synapse count on the chart in both dishes.',
        wait: 'Waiting for the synapse count on the left to peak and fall back. This takes about 3,000 steps.',
        result(api, st) {
          if (!both()) return 'This lab needs both dishes. Restart it from Guided labs.';
          const [A, B] = api.slots.map((s) => s.tissue);
          st.peak[0] = Math.max(st.peak[0], A.synapses.length);
          st.peak[1] = Math.max(st.peak[1], B.synapses.length);
          return `Synapses now: **${A.synapses.length}** with microglia, **${B.synapses.length}** without. Highest so far: ${st.peak[0]} and ${st.peak[1]}.`;
        },
        check: (api, st) => both() && st.peak[0] > 0 && api.slots[0].tissue.synapses.length < 0.75 * st.peak[0],
      },
      {
        level: 1,
        title: 'Meet a microglia',
        text: 'A microglia wanders the tissue. It engulfs synapses that are tagged and barely used, and it clears away neurons that have died. Open the busiest one on the left and watch its tally.',
        action: {
          label: 'Open the busiest microglia',
          run(api, st) {
            if (!both()) return;
            const A = api.slots[0], ms = A.tissue.microglia;
            if (!ms.length) return;
            const m = ms.reduce((a, b) => (b.ate + b.cleared > a.ate + a.cleared ? b : a));
            st.micro = m.id;
            api.openCell(A, 'micro', m.id);
          },
        },
        result(api, st) {
          if (!both()) return '';
          const [A, B] = api.slots.map((s) => s.tissue);
          const m = st.micro != null ? A.microglia.find((x) => x.id === st.micro) : null;
          const pruned = (T) => T.counts.retracted + T.counts.eatenMicroglia + T.counts.eatenAstro;
          return (m ? `This microglia has engulfed **${m.ate}** synapses and cleared **${m.cleared}** dead cells. ` : '') +
            `In the whole left dish, glia engulfed **${A.counts.eatenMicroglia + A.counts.eatenAstro}** of **${pruned(A)}** synapses removed; neurons let go of the rest themselves. Right dish: ${B.counts.eatenAstro} of ${pruned(B)}, all by astrocytes.`;
        },
      },
      {
        level: 2,
        title: 'Who cleans up?',
        text: 'Back at the dishes, switch the chart to debris: dead neurons that nobody has cleared yet. Neurons die in both dishes, when they starve of energy or growth factor. Watch where the dead pile up.',
        action: { label: 'Back to the dishes, chart debris', run(api) { api.closeExplorer(); api.setMetric('debris'); api.reveal(); } },
        wait: 'Waiting for dead cells to pile up on one side. Raise the speed if nothing changes.',
        result(api) {
          if (!both()) return '';
          const [A, B] = api.slots.map((s) => s.tissue);
          return `Dead cells waiting to be cleared: **${A.debris.length}** with microglia, **${B.debris.length}** without. Neurons that died so far: ${last(A).died || 0} and ${last(B).died || 0}.`;
        },
        check(api) {
          if (!both()) return false;
          const [A, B] = api.slots.map((s) => s.tissue);
          return B.debris.length >= 20 && B.debris.length > 2 * A.debris.length;
        },
      },
    ],
    think: {
      q: 'Without microglia, the synapse count rose and fell almost exactly as with them. What do microglia mainly do in this tissue?',
      opts: [
        { t: 'They do most of the pruning.', why: 'The count fell just as far without them. Most synapses go because neurons that fire too much retract their own; glia take a smaller share.' },
        { t: 'They clear away dead cells.', ok: true, why: 'Without them, dead neurons pile up as debris. Pruning mostly comes from neurons balancing their own activity; cleaning up is what only microglia do here.' },
        { t: 'They make new synapses.', why: 'Synapses grow from the neurons\' own connection points. Microglia only remove things: weak tagged synapses and dead cells.' },
      ],
    },
  };

  window.Learn.mount({ toolbar: document.querySelector('.toolbar'), labs: [whoCleans], api: page });
})();
