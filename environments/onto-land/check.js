// Headless check for Onto land (README): one coast, one seed, one JSON line.
//   node environments/onto-land/check.js <seed> <A|B|C> <steps>
// A: shore mats; B: the twin with nothing on land; C: mats with no hunters.
// Averages are over the last 2,000 steps.
const Gaia = require('../../lib/gaia.js');
const [seed, cond, steps] = [Number(process.argv[2]), process.argv[3], Number(process.argv[4])];
const world = { A: {}, B: { shoreMats: 0 }, C: { species: [{ name: 'Grazers', mind: 'brain', count: 50 }] } }[cond];
const g = Gaia.make({ era: 'shores', seed, world });
const w = g.world;
for (let i = 0; i < steps; i++) g.step();
const late = w.history.filter((h) => h.t > steps - 2000);
const avg = (k) => { const v = late.map((h) => h[k]).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const start = w.history[0];
// Correlation of segments and sturdiness among legged plant eaters, ashore vs at sea.
function corr(list) {
  if (list.length < 5) return null;
  const xs = list.map((c) => c.g.segments), ys = list.map((c) => c.g.sturdy);
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}
const legged = w.creatures.filter((c) => !c.meat && w.plan(c).type === 2);
const out = { seed, cond, steps, prey: w.creatures.filter((c) => !c.meat).length, hunters: w.creatures.filter((c) => c.meat).length,
  start: { legs: start.legs, sturdy: start.sturdy, air: start.air, disparity: start.disparity },
  stranded: w.coastDeaths.stranded };
for (const k of ['shoreShare', 'legs', 'fins', 'sturdy', 'air', 'hold', 'segments', 'disparity', 'seaDisparity', 'shoreDisparity', 'layouts', 'seaLayouts', 'shoreLayouts', 'seaLegs', 'shoreLegs', 'seaSturdy', 'shoreSturdy', 'seaAir', 'shoreAir']) out[k] = avg(k);
const first = w.history.find((h) => h.legs > 0.3); out.legsDay = first ? first.t / 720 : null;
out.huntersAt = [2000, 5000, 8000, 10000].map((t) => { const h = w.history.find((x) => x.t >= t); return h ? h.predators : null; });
out.corrShore = corr(legged.filter((c) => (c.dry || 0) > 0.1));
out.corrSea = corr(legged.filter((c) => (c.dry || 0) <= 0.1));
console.log(JSON.stringify(out));
