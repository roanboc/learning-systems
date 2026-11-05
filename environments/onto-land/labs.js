// Guided lab for Onto land: keep them in the sea (engine: lib/learn.js, page hooks: window.ShoresPage).
(function () {
  'use strict';

  const page = window.ShoresPage;
  const pc = (v) => (v == null ? '–' : Math.round(v * 100) + '%');
  const n2 = (v) => (v == null ? '–' : v.toFixed(2));
  const last = (i) => page.last(page.worlds[i]);
  // A grazer that spends time on land, else the one closest to it.
  const ashore = (c) => (c.dry || 0) + (c.energy > 30 ? 0.01 : 0);

  const lab = {
    id: 'keep-them-in-the-sea',
    title: 'Keep them in the sea',
    question: 'Both coasts start with the same finned grazers. Why do legs evolve on only one?',
    levels: ['Body', 'Population', 'Coast', 'Body again'],
    setup(api) {
      api.restart();
      api.setSpeed('ff');
      api.setMetric('legs');
      api.play();
    },
    steps: [
      {
        level: 0,
        title: 'Two coasts, one difference',
        text: 'Both coasts start with grazers whose trunks carry **fins**. Mutations can add or remove a segment, lengthen limbs, make them sturdier, or switch the whole trunk from fins to **legs**. Legs drag in water but are the only limbs that walk. Left: green mats grow on the damp ground the tide uncovers. Right: nothing grows on land.',
        action: { label: 'Show me a grazer on each coast', run(api) { for (const W of api.worlds) api.follow(W, api.pickGrazer(W, ashore), 6); } },
      },
      {
        level: 1,
        title: 'Watch the legs line',
        text: 'Leave it on Fast-forward and watch the chart. On the left, a grazer that can reach the mats eats food no fish can reach. On the right, legs only slow a swimmer down. Which line should rise?',
        check: () => last(0).legs != null && last(0).legs - (last(1).legs || 0) > 0.15,
        wait: 'Waiting for the two lines to separate. In our runs this took 4 to 12 days, and on two seeds in six it never happened.',
        result: () => `Grazers with legs: **${pc(last(0).legs)}** left, **${pc(last(1).legs)}** right. On the shore: ${pc(last(0).shoreShare)} and ${pc(last(1).shoreShare)}.`,
      },
      {
        level: 2,
        title: 'Weight shapes the legs',
        text: 'On land a body has to be held up. Here legs hold a body when pairs × sturdiness is enough for its weight (its segments). Compare the grazers that live on the shore with the ones at sea on the left coast.',
        result: () => `Legs hold their body: **${pc(last(0).shoreHold)}** of the weight for shore grazers, ${pc(last(0).seaHold)} for sea grazers. Air skin: ${n2(last(0).shoreAir)} on the shore, ${n2(last(0).seaAir)} at sea.`,
      },
      {
        level: 3,
        title: 'Back to one body',
        text: 'Follow a shore grazer and zoom in. Count its segments and legs, and compare it with a grazer on the right coast.',
        action: { label: 'Follow a shore grazer', run(api) { for (const W of api.worlds) api.follow(W, api.pickGrazer(W, ashore), 9); } },
        result: () => `Body plans on the left coast: ${last(0).layouts || '–'} different layouts; on the right: ${last(1).layouts || '–'}.`,
      },
    ],
    think: {
      q: 'Did the move onto land invent legs here?',
      opts: [
        { t: 'Yes, legs appeared because the creatures went on land.', ok: false, why: 'The fins-to-legs switch is a mutation that happens on both coasts. Land did not create it; land made it pay. In real history too, limbs with toes evolved in water first.' },
        { t: 'No. The same mutations happen on both coasts; the shore food made legs worth having.', ok: true, why: 'Right. The toolkit (segments, limb types) is the same everywhere. The place selects which shapes survive. That is the main idea of this chapter.' },
        { t: 'Legs spread because hunters cannot follow onto land.', ok: false, why: 'Hunters do keep to deep water, but on the coast with no mats legs do not spread even though the shore is just as safe. Food on land is what makes the difference here.' },
      ],
    },
  };

  window.Learn.mount({ toolbar: document.querySelector('.toolbar'), labs: [lab], api: page });
})();
