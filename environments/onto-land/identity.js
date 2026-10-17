// Identity check: the bodyPlan and shoreMats settings are off by default, so
// existing worlds must give exactly the results they gave before this chapter.
// Fingerprints below were taken on main before the change (2026-10-17).
//   node environments/onto-land/identity.js
const R = __dirname + '/../../';
const Gaia = require(R + 'lib/gaia.js');
const BEFORE = [
  "brains 02f41165535a n=128",
  "ecosystems dd3dff7bfd5d n=92",
  "{\"seed\":1} 2171eb7c9aed n=183",
  "{\"seed\":2,\"mind\":\"brain\"} 8da482e1b546 n=85",
  "{\"seed\":4,\"plantMode\":\"living\",\"species\" 740ae44131c2 n=2",
];
const { World } = require(R + 'environments/forager-worlds/engine.js');
const crypto = require('crypto');
function fp(w) {
  const s = w.creatures.map((c) => [c.id, c.x.toFixed(6), c.y.toFixed(6), c.energy.toFixed(6), Object.values(c.g).map((v) => v.toFixed(6)).join(',')].join(':')).join('|')
    + '#' + w.plants.length + '#' + JSON.stringify(w.history[w.history.length - 1]);
  return crypto.createHash('md5').update(s).digest('hex').slice(0, 12) + ' n=' + w.creatures.length;
}
const out = [];
for (const era of ['brains', 'ecosystems']) {
  const g = Gaia.make({ era, seed: 3 });
  for (let i = 0; i < 800; i++) g.step();
  out.push(era + ' ' + fp(g.world));
}
for (const p of [{ seed: 1 }, { seed: 2, mind: 'brain' }, { seed: 4, plantMode: 'living', species: [{ name: 'P', mind: 'brain', count: 30 }, { name: 'H', mind: 'reflex', count: 6, diet: 'meat' }] }]) {
  const w = new World(p);
  for (let i = 0; i < 1500; i++) w.step();
  out.push(JSON.stringify(p).slice(0, 40) + ' ' + fp(w));
}
const same = out.every((l, i) => l === BEFORE[i]);
console.log(out.join('\n'));
console.log(same ? 'IDENTICAL to main' : 'DIFFERENT from main');
process.exitCode = same ? 0 : 1;
