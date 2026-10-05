// Every guided lab in Learning Systems, in timeline order, so any page can
// list them all and link to the ones that live on other pages. Each lab's
// steps stay in its product's labs.js; this file only says where to find it.
// page: path from the repository root. Keep in step when adding a lab.
(function (root) {
  'use strict';

  const LABS = [
    { id: 'tide-pools', chapter: 'Early Earth', page: 'environments/early-earth/index.html',
      title: 'Why tide pools?', question: 'Why do long chains, and then copiers, only appear where pools dry out?',
      levels: ['Coast', 'Pool', 'Molecules', 'Coast again'] },
    { id: 'learning-to-move', chapter: 'First cells', page: 'environments/first-cells/index.html',
      title: 'How did cells start to move?', question: 'Why would a drifting cell evolve a motor, and how strong should it be?',
      levels: ['Cell', 'Population', 'Coast', 'Cell again'] },
    { id: 'muscles-beat-together', chapter: 'Bodies', page: 'environments/first-bodies/index.html',
      title: 'Why do muscles beat together?', question: 'Every contracting cell pushes just as hard on both coasts. Why does one kind of body move faster?',
      levels: ['Body', 'Cell', 'Body', 'Population'] },
    { id: 'learning-colour', chapter: 'Brains', page: 'environments/forager-worlds/index.html',
      title: 'Learning a colour', question: 'How does one synapse, changed by dopamine, turn into a creature that knows what to eat?',
      levels: ['Worlds', 'Cell', 'Organism', 'Population'] },
    { id: 'who-cleans', chapter: 'Brain tissue', page: 'nervous-systems/tissue-lab/index.html',
      title: 'Who prunes, and who cleans up?', question: 'Synapses overshoot and then get pruned. Are microglia the ones doing the pruning?',
      levels: ['Tissue', 'Cell', 'Tissue again'] },
  ];

  root.LabCatalogue = LABS;
})(typeof self !== 'undefined' ? self : this);
