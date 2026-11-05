// One cell rule for every level of Gaia.
//
// A free cell in the sea (lib/life.js), a cell in a creature's organ
// (lib/body.js) and a neuron in brain tissue (nervous-systems/tissue-lab)
// follow the same rule:
//
//   take   draw food from the medium around it: the sea's blocks and energy,
//          the body fluid, or glucose and lactate from blood vessels
//   pay    spend energy on living, plus on what it does (swimming, firing)
//   die    when its store stays empty
//   renew  divide, regrow or be replaced when there is enough
//
// The medium and its units differ by level, so each level keeps its own tuned
// amounts. This file holds the shared knobs that scale all levels at once:
// make every cell's upkeep 20% dearer and free cells, organs and neurons all
// feel it. At 1 (the default) every level gives exactly the results it gave
// before the rule was shared.
//
// No DOM here; runs in the browser and in Node.
(function (root) {
  'use strict';

  const RULE = {
    uptake: 1,   // how much a cell can take from its medium in one go
    upkeep: 1,   // what living and acting cost
  };

  // The most a cell can take now, from a level's own rate.
  const uptake = (rate) => rate * RULE.uptake;
  // What a cell pays, from a level's own cost.
  const upkeep = (cost) => cost * RULE.upkeep;

  const api = { RULE, uptake, upkeep };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Cell = api;
})(typeof self !== 'undefined' ? self : this);
