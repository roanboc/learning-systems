# Tissue Lab

A slice of brain tissue where neurons are a living population. They wire themselves, compete for growth factor and energy, get pruned by glia, die, and are replaced from a stem-cell niche. Several dishes run side by side, each with its own random seed and settings, so you can change one condition and compare.

Open `index.html` in a browser. No build step. `engine.js` has no DOM code and also runs in Node.

The design follows the v3 plan ("Brain environment simulation"): every rule comes from a mechanism with experimental support, and no rule is global. A cell only reacts to its own activity, the chemicals around it, and its neighbours.

## What is in the tissue

| Part | What it does | Grounded in |
|---|---|---|
| Neurons (80% excitatory, 20% inhibitory) | Leaky integrate-and-fire, the same cell as `lib/brain.js`. Each keeps a calcium-like trace of its firing rate. | |
| Homeostatic wiring | Below its target rate a neuron grows free synaptic elements; above it, it retracts them and loses its weakest synapses. Free elements nearby pair up at random. Nothing is copied or placed from outside. | Butz & van Ooyen 2013 |
| Synapses | Strengthen when the input fires just before the cell does. Unused ones weaken and collect a complement "eat me" tag. | Bi & Poo 1998; Stevens 2007 |
| Growth factor (BDNF) | Released where an input helped a cell fire, taken up in proportion to the cell's own activity. Supply is limited, so cells outside active circuits lose support and die. | Levi-Montalcini; Oppenheim 1991; Lu, Pang & Woo 2005 |
| Energy | Blood vessels supply glucose, more where tissue is active. Living and spiking cost energy; cells that stay empty die. | Attwell & Laughlin 2001; neurovascular coupling |
| Astrocytes | Each owns a territory. End-feet on vessels draw glucose, which is handed as lactate to the busiest neurons in the territory. They secrete a little growth factor and engulf some tagged synapses. | Pellerin & Magistretti; Chung 2013 |
| Microglia | Wander up the eat-me gradient, engulf tagged synapses unless recent use protects them, and clear debris of dead cells. Uncleared debris gets in the way of new contacts. | Schafer 2012; Paolicelli 2011 |
| Stem-cell niche | Releases newborn neurons, more after injury or stimulation. Newborns migrate along vessels toward injury and away from crowding, are extra excitable and keep sprouting for a window, then must have integrated or they die. | Kempermann; Tashiro 2007; Kojima 2010 |

Three clocks: spikes every step, chemistry and glia every 10 steps, growth, pruning, death and birth every 100 steps (a structural step).

## The page
- **Bench:** one dish per condition, a comparison chart (neurons, synapses, firing against target, growth factor, energy, newborns, deaths, glial pruning, debris), and "Same lesion in every dish" to test repair side by side.
- **Tissue:** click a dish. Overlays show the chemistry cells respond to (glucose, lactate, growth factor, activity, eat-me signals). Click to inspect a cell, lesion a region, or stimulate it.
- **Cell:** click any neuron, astrocyte or microglia. A neuron shows its membrane voltage, firing against target, growth factor against need, energy, its contacts, and its strongest inputs and outputs; you can walk from cell to cell.

## Results so far (headless runs)

Synapse overshoot, survival and newborns: 4 seeds each, 40,000 steps, means. Repair: 8 seeds, a lesion of radius 0.12 at the centre at step 15,000, measuring the inputs of neurons just outside the hole; medians.

| Dish | Peak synapses (step ~2,500) | Synapses at step 10,000 | Neurons at 40,000 (of 320) | Repair to 90% of inputs |
|---|---|---|---|---|
| Full tissue | ~2,000 | ~540 | ~184 | 100 steps |
| No microglia | ~2,000 | ~490 | ~169 (266 debris left) | 600 steps |
| Scarce growth factor (0.4×) | ~2,000 | ~150 | ~43 | 200 steps |
| Rich growth factor (2.5×) | ~2,000 | ~730 | ~242 | |
| No astrocytes | ~2,000 | ~480 | ~185 | 200 steps |
| No neurogenesis | ~2,000 | ~500 | ~125 | 800 steps |

- **Self-wiring, then pruning:** synapses overshoot to 3 to 4 times their later number, and mean firing settles at the target.
- **Death by competition:** a third to a half of the starting neurons die. Survival scales with growth factor supply, not with a fixed number.
- **Repair:** neurons around a lesion lose about a quarter of their inputs and usually rebuild them within one or two structural steps. Without microglia the debris stays and recovery is slower, but seeds vary a lot.
- **Turnover:** newborns replace losses; about half of them integrate and survive. Without neurogenesis the population keeps shrinking slowly.
- **Not shown yet:** astrocytes make little measurable difference in these runs, because glucose is rarely the limit. "Poor blood supply" is the dish to explore that.

## Next
- Sensory input and three-factor learning (v3 milestone M5), so a tissue can learn and newborn neurons can be tested on telling similar patterns apart.
- Then carry the useful mechanisms (growth factor competition, glial pruning, newborn neurons) into `lib/brain.js` behind options, so Forager Worlds creatures can grow these brains.

## Headless use
```js
const { Tissue } = require('./engine.js');
const t = new Tissue({ seed: 1, microglia: false });
for (let i = 0; i < 20000; i++) t.step();
t.lesion(0.5, 0.45, 0.12);
for (let i = 0; i < 5000; i++) t.step();
console.log(t.history.at(-1));
```
