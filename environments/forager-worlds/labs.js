// Guided labs for Forager Worlds (engine: lib/learn.js, page hooks: window.ForagerPage).
(function () {
  'use strict';

  const page = window.ForagerPage;
  const GREEN = window.WorldSim.GREEN;

  // Instincts held equal for both colours, so evolution cannot tell creatures
  // which colour is food. Only learning during life can.
  const FIXED = { orientGreen: 0.3, orientViolet: 0.3, biteGreen: 0.5, biteViolet: 0.5, learnRate: 0.03 };
  const BASE = { seed: 1, seasonLength: 0, mind: 'brain', fixed: FIXED };

  // [food colour, poison colour] strength of the mouth → bite synapses.
  function bite(world, c) {
    const [g, v] = page.biteWeights(c);
    return world.foodColour === GREEN ? [g, v] : [v, g];
  }
  function meanLearned(world) {
    let s = 0, n = 0;
    for (const c of world.creatures) if (c.brain) { const [f, p] = bite(world, c); s += f - p; n++; }
    return n ? s / n : 0;
  }
  // Recent picky eating: bites when food is at the mouth, against bites when poison is.
  function picky(world, last) {
    const h = world.history.slice(-(last || 4)).map((x) => x.picky).filter((x) => x != null);
    return h.length ? h.reduce((a, b) => a + b, 0) / h.length : null;
  }
  const f2 = (v) => (v == null ? '–' : (Math.abs(v) < 0.005 ? 0 : v).toFixed(2));
  const both = () => page.slots.length >= 2;
  const find = (entry, id) => entry.world.creatures.find((c) => c.id === id);

  // The most experienced brain in the left world that still has its mouth →
  // bite synapses (wiring can prune them): the one that has eaten most.
  function pickEater(st) {
    const A = page.slots[0];
    let best = null;
    for (const c of A.world.creatures) {
      if (!c.brain) continue;
      const [f, q] = bite(A.world, c);
      if (f === 0 || q === 0) continue;
      if (!best || c.eaten + c.poisoned > best.eaten + best.poisoned) best = c;
    }
    st.id = best ? best.id : null;
    return st.id;
  }
  function meanBite(world) {
    let f = 0, q = 0, n = 0;
    for (const c of world.creatures) if (c.brain) { const [a, b] = bite(world, c); f += a; q += b; n++; }
    return n ? [f / n, q / n] : [0, 0];
  }

  const learningColour = {
    id: 'learning-colour',
    title: 'Learning a colour',
    question: 'How does one synapse, changed by dopamine, turn into a creature that knows what to eat?',
    levels: ['Worlds', 'Cell', 'Organism', 'Population'],
    setup(api, st) {
      api.replaceWorlds([
        { name: 'Dopamine works', params: Object.assign({}, BASE) },
        { name: 'Dopamine blocked', params: Object.assign({}, BASE, { foodReward: 0, poisonPunish: 0 }) },
      ]);
      api.setMetric('picky');
      api.setSpeed(10);
      api.play();
      st.id = null;
    },
    steps: [
      {
        level: 0,
        title: 'Two identical worlds',
        text: 'Both dishes start with the same creatures, plants and seed. Their instincts are **fixed equal for both colours**, so evolution cannot teach them which colour is food. Only learning can. In the right dish, dopamine is blocked: food still gives energy, but the brain gets no signal that it was good.',
        result(api) {
          if (!both()) return 'This lab needs both worlds. Restart it from Guided labs.';
          const [A, B] = api.slots;
          return `Creatures: **${A.world.creatures.length}** on the left, **${B.world.creatures.length}** on the right, at t = ${A.world.t}.`;
        },
      },
      {
        level: 1,
        title: 'One synapse decides a bite',
        text: 'Each brain has a mouth cell that fires when food-coloured plants touch the lips, and one for the poison colour. Both connect to the **bite neuron**, equally strong at birth. Every bite leaves a short trace on the synapse. Dopamine after food turns that trace into a stronger synapse; after poison, a weaker one. Single creatures are noisy: when both colours touched the lips just before a meal, both synapses get the credit. Compare one creature with the averages below.',
        action: {
          label: 'Open a creature’s mouth cell',
          run(api, st) {
            if (!both() || !pickEater(st)) return;
            const A = api.slots[0], c = find(A, st.id);
            const R = c.brain.layout.R;
            const cell = R * 2 + (A.world.foodColour === GREEN ? 0 : 1);
            api.explore(A, st.id, 'cell', cell);
          },
        },
        wait: 'Waiting for creatures to eat a few plants. In the zoomed view, raise Speed to 5 steps per frame, or close it to run faster.',
        result(api, st) {
          if (!both()) return '';
          const [A, B] = api.slots;
          const avg = `On average, the food synapse is **${f2(meanLearned(A.world))}** stronger than the poison one on the left, and **${f2(meanLearned(B.world))}** on the right.`;
          if (st.id == null) return avg;
          const c = find(A, st.id);
          if (!c) return `Creature #${st.id} has died. Press the button to open another. ${avg}`;
          const [f, q] = bite(A.world, c), [bf, bq] = meanBite(B.world);
          return `Creature #${st.id} (left), after ${c.eaten} food and ${c.poisoned} poison meals: bite synapse **${f2(f)}** for food, **${f2(q)}** for poison. ` +
            `Right world, on average: ${f2(bf)} and ${f2(bq)}. ${avg}`;
        },
        check: (api) => both() && meanLearned(api.slots[0].world) > 0.15,
      },
      {
        level: 2,
        title: 'The synapse shows in what it eats',
        text: 'Back at the dishes, a creature’s colour shows its bite synapses: greener or more violet means it bites that colour more readily. On the left, creatures take on the food colour. On the right most stay pale and bite whatever touches their lips; the few tinted ones lost a synapse to pruning, not to learning.',
        action: { label: 'Back to the dishes', run(api) { api.closeExplorer(); api.reveal(); } },
        wait: 'Waiting for enough meals on both sides to compare. Fast-forward helps.',
        result(api) {
          if (!both()) return '';
          const [A, B] = api.slots;
          return `Picky eating (0.5 = bites both colours alike, 1 = only food): **${f2(picky(A.world))}** on the left, **${f2(picky(B.world))}** on the right.`;
        },
        check(api) {
          if (!both()) return false;
          const a = picky(api.slots[0].world), b = picky(api.slots[1].world);
          return a != null && b != null && a - b > 0.1;
        },
      },
      {
        level: 3,
        title: 'Across the population',
        text: 'The chart above shows picky eating in both worlds over time. Nothing about the creatures differs except one signal at the synapse. Keep watching: in the blocked world, lucky creatures that happen to bite less poison live longer, but each newborn starts from equal synapses again.',
        result(api) {
          if (!both()) return '';
          const [A, B] = api.slots;
          return `Over the last stretch, picky eating is **${f2(picky(A.world, 10))}** with dopamine and **${f2(picky(B.world, 10))}** without. Generations so far: ${A.world.history.at(-1) ? A.world.history.at(-1).maxGen : 0} and ${B.world.history.at(-1) ? B.world.history.at(-1).maxGen : 0}.`;
        },
      },
    ],
    think: {
      q: 'In the blocked world, creatures still see colours, still eat and still get energy from food. Why don’t they become picky?',
      opts: [
        { t: 'Their eye and mouth cells can’t tell the colours apart.', why: 'The sensory cells are the same in both worlds and fire for each colour separately. The difference is downstream, in how strong the synapses become.' },
        { t: 'Without dopamine, the trace a bite leaves never becomes a lasting change.', ok: true, why: 'Learning here needs three things at one synapse: the cell before, the cell after, and a reward signal that comes later. Remove the third and the bite synapses stay as they were born.' },
        { t: 'Their brains grow fewer synapses.', why: 'Wiring grows and prunes the same way in both worlds; it follows each cell’s own activity. What doesn’t change is the strength of the bite synapses.' },
      ],
    },
  };

  window.Learn.mount({ toolbar: document.querySelector('.toolbar'), labs: [learningColour], api: page });
})();
