// Real gene curves for the film's charts: runs the World Viewer worlds
// headless (seed 3, as the film's footage) and prints the average gene every
// 250 steps. Usage: node films/tools/gene-curves.js cells speed 12000
'use strict';
const LifeSim = require('../../lib/life.js');
const [stage, gene, steps] = [process.argv[2] || 'cells', process.argv[3] || 'speed', +(process.argv[4] || 12000)];
const L = LifeSim.makeLife(stage, 3);
const out = [];
const avg = () => { let s = 0; for (const c of L.cells) s += c.g[gene]; return L.cells.length ? s / L.cells.length : 0; };
out.push([L.earth.t, +avg().toFixed(4), L.cells.length, L.maxGen]);
for (let i = 1; i <= steps; i++) {
  L.step();
  if (i % 250 === 0) out.push([L.earth.t, +avg().toFixed(4), L.cells.length, L.maxGen]);
}
console.log(JSON.stringify({ stage, gene, seed: 3, steps, cols: ['t', gene, 'cells', 'generation'], rows: out }));
