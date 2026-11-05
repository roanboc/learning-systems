// Headless check for First genes, in Node:
//   node environments/first-genes/check.js [world] [seed] [steps]
// world: genes, leaky, noskin or linked (lib/chemistry.js GENE_PRESETS).
// Prints the protocell readouts every 500 steps.
const C = require('../../lib/chemistry.js');
const [world, seed, steps] = [process.argv[2] || 'genes', +process.argv[3] || 3, +process.argv[4] || 12000];
const w = C.makeWorld(world, seed);
const f = (v) => (Number.isInteger(v) ? v : v.toFixed(2));
for (let t = 1; t <= steps; t++) {
  w.step();
  if (t % 500) continue;
  const s = w.stats;
  console.log([world, seed, t].concat(['protocells', 'closure', 'working', 'parasites', 'emptyBirths', 'maxGen'].map((k) => k + '=' + f(s[k]))).join(' '));
}
