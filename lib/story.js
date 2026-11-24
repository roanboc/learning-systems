// The story of systems and life: the nine acts of film 1, which are also the
// site's chapters. The site bar (lib/nav.js), the home page and the Films page
// read this list, so a chapter's number, title and simulations live in one place.
//
//   n       act number, the same in the film, the notebook and on the site
//   level   0 chemistry, 1 cells, 2 bodies, 3 nerves, 4 ecosystems (null: all)
//   clock   where the act stands if all of Earth's history were one day
//   when    plain words for when it happened (lib/i18n/es/common.js has the Spanish)
//   key     the still that stands for the act (films/story/img/<key>.jpg)
//   shots   the act's shots in the clip: [still, start in seconds, label]
//   sims    the simulations of the chapter: path from the repository root
//   dur     the act's clip in seconds
// Titles and lines are film 1's (notebook content.py), in English; Spanish
// is in lib/i18n/es/common.js like every other text.
(function (root) {
  'use strict';

  const LEVELS = [
    { key: 'chemistry', name: 'Chemistry', colour: '#f3ae3d' },
    { key: 'cells', name: 'Cells', colour: '#3597a2' },
    { key: 'bodies', name: 'Bodies', colour: '#e9634f' },
    { key: 'nerves', name: 'Nerves', colour: '#8b72d6' },
    { key: 'ecosystems', name: 'Ecosystems', colour: '#4fae63' },
  ];

  const ACTS = [
    { n: 0, title: 'What is a living system?', when: 'about 4.4 billion years ago', clock: '00:44', level: null, dur: 25.5,
      line: 'Life is not a kind of stuff. It is what the parts do together.', key: 'act-0-1-one-day',
      shots: [['act-0-1-one-day', 0, 'One day'], ['act-0-2-parts-flow-loops', 14, 'Parts, flows, loops']],
      sims: [{ name: 'Deep Dive', path: 'dive/index.html' }] },
    { n: 1, title: 'Energy makes order', when: 'about 4.2 billion years ago', clock: '01:48', level: 0, dur: 40.5,
      line: 'Where energy keeps flowing, order can build.', key: 'act-1-1-energy-flows',
      shots: [['act-1-1-energy-flows', 0, 'Energy flows'], ['act-1-2-spark-flask', 13, 'Lightning in a flask'], ['act-1-3-drying-pool', 23, 'A drying pool'], ['act-1-4-lost-city', 33.5, 'Warm vents']],
      sims: [{ name: 'Early Earth', path: 'environments/early-earth/index.html' }] },
    { n: 2, title: 'A skin makes a self', when: 'about 4 billion years ago', clock: '02:51', level: 0, dur: 47.5,
      line: 'A skin separates an inside from an outside, and that makes a self.', key: 'act-2-2-the-loop',
      shots: [['act-2-1-a-skin-closes', 0, 'A skin closes'], ['act-2-2-the-loop', 13.5, 'The loop'], ['act-2-3-thread-and-split', 26, 'Thread and split'], ['act-2-4-full-takes-from-empty', 37.5, 'Full takes from empty']],
      sims: [{ name: 'First genes', path: 'environments/first-genes/index.html' }] },
    { n: 3, title: 'Copying with mistakes', when: 'about 3.5 billion years ago', clock: '05:30', level: 1, dur: 44.5,
      line: 'No copy is perfect, and the mistakes that help get kept.', key: 'act-3-4-run-and-tumble',
      shots: [['act-3-1-a-family-of-cells', 0, 'A family of cells'], ['act-3-2-mounds', 13.5, 'Mounds'], ['act-3-3-twelve-flasks', 23.5, 'Twelve flasks'], ['act-3-4-run-and-tumble', 33, 'Run and tumble']],
      sims: [{ name: 'First cells', path: 'environments/first-cells/index.html' }] },
    { n: 4, title: 'Together, and the cheat problem', when: 'about 2 billion years ago', clock: '13:26', level: 1, dur: 46,
      line: 'Cells are safer together, but every group must deal with its cheats.', key: 'act-4-2-clumps-of-eight',
      shots: [['act-4-1-too-big-to-swallow', 0, 'Too big to swallow'], ['act-4-2-clumps-of-eight', 15, 'Clumps of eight'], ['act-4-3-a-helper-for-all', 27, 'A helper for all'], ['act-4-4-relatives-and-strangers', 37, 'Relatives and strangers']],
      sims: [{ name: 'Colonies', path: 'environments/colonies/index.html' }] },
    { n: 5, title: 'Bodies: many cells, one animal', when: 'about 575 million years ago', clock: '20:58', level: 2, dur: 47,
      line: 'In a body, cells split the work, and only a few make new bodies.', key: 'act-5-1-cells-split-the-work',
      shots: [['act-5-1-cells-split-the-work', 0, 'Cells split the work'], ['act-5-2-volvox', 16, 'Volvox'], ['act-5-3-animal-fat', 27, 'Animal fat'], ['act-5-4-fibres-like-muscle', 36.5, 'Fibres like muscle']],
      sims: [{ name: 'Bodies', path: 'environments/first-bodies/index.html' }] },
    { n: 6, title: 'Nerves and brains', when: 'about 540 million years ago', clock: '21:09', level: 3, dur: 48,
      line: 'A brain makes too much, then keeps what is used.', key: 'act-6-1-a-net-of-nerves',
      shots: [['act-6-1-a-net-of-nerves', 0, 'A net of nerves'], ['act-6-2-most-connections-at-two', 15, 'Most connections at two'], ['act-6-3-a-quiet-connection-is-eaten', 26, 'A quiet connection is eaten'], ['act-6-4-winning-support', 37.5, 'Winning support']],
      sims: [{ name: 'Nerve nets', path: 'world/index.html#nerves' }, { name: 'Tissue Lab', path: 'nervous-systems/tissue-lab/index.html' }, { name: 'Brains', path: 'environments/forager-worlds/index.html' }] },
    { n: 7, title: 'Hunters, prey and land', when: 'about 508 million years ago', clock: '21:19', level: 4, dur: 46,
      line: 'Eaters and eaten keep each other in check, or crash. And legs began as fins.', key: 'act-7-1-a-hunter-and-its-prey',
      shots: [['act-7-1-a-hunter-and-its-prey', 0, 'A hunter and its prey'], ['act-7-2-hunters-and-prey-rise-and-fall', 13.5, 'Rise and fall'], ['act-7-3-a-neck-and-a-wrist', 25.5, 'A neck and a wrist'], ['act-7-4-a-fish-that-walks', 36.5, 'A fish that walks']],
      sims: [{ name: 'Ecosystems', path: 'environments/forager-worlds/index.html' }, { name: 'Onto land', path: 'environments/onto-land/index.html' }] },
    { n: 8, title: 'One world, many levels', when: 'today', clock: '24:00', level: 4, dur: 31.5,
      line: 'It is one world, seen at many levels. Each level is made of the one below.', key: 'act-8-1-one-world',
      shots: [['act-8-1-one-world', 0, 'One world'], ['act-8-2-six-patterns', 18.5, 'Six patterns']],
      sims: [{ name: 'Deep Dive', path: 'dive/index.html' }, { name: 'World Viewer', path: 'world/index.html' }] },
  ];

  root.Story = { LEVELS, ACTS, IMG: 'films/story/img/', CLIPS: 'films/story/clips/' };
})(typeof self !== 'undefined' ? self : this);
