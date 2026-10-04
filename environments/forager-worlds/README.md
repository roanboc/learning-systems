# Forager Worlds

Several independent worlds run side by side. Each world has its own random seed, plants and gene pool, so worlds never share creatures or genes and can be compared directly.

Open `index.html` in a browser. No build step. `engine.js` has no DOM code and also runs in Node.

## The world
- Plants grow in patches (logistic regrowth, random withering). Each plant is green or violet. One colour is food, the other poison.
- In seasonal worlds the meaning of the colours swaps every `seasonLength` steps.
- Creatures pay energy to live, move and see, and split when their energy passes a genetic threshold. Children inherit mutated genes. There is no fitness function.
- Biting is a choice: a creature only eats a plant at its mouth if it decides to.

## Two kinds of mind (`mind` setting)
- **Instincts (W1):** two "eyes" sum the green and violet plants on each side; genes set how much each colour attracts or repels, and whether to bite it.
- **Brain (W2):** a spiking network from `lib/brain.js`.
  - Senses: a 7-ray eye with a green and a violet cell per ray, mouth contact per colour, hunger, pain.
  - Motors: turn left, turn right, eat.
  - Inborn reflexes, identical for both colours: orient toward what is seen on one side, bite what touches the mouth.
  - Wiring grows and retracts to keep each neuron near its target firing rate (homeostatic structural plasticity).
  - Learning is reward-modulated STDP: food releases a dopamine-like signal, poison a negative one and a pain signal.
  - Children are born with a fresh brain; nothing learned is inherited.

## Evolution of brains (W3)
Brain genes set how the brain is built, never its synapses:
- `learnRate`: how fast reward changes synapses (plasticity).
- `hidden`: number of interneurons.
- `orientGreen`, `orientViolet`, `biteGreen`, `biteViolet`: strength of each inborn reflex per colour. They start equal, so a newborn has no built-in preference until evolution gives it one.

A brain is not free: each interneuron costs `neuronCost` energy per step, and learning costs `learnCost × learnRate` per step. Brain genes mutate more slowly than body genes (`brainMutation`). `fixed: { learnRate: 0 }` holds a gene constant, for control worlds; `geneInit` sets starting ranges.

Charts: "Learning rate (gene)", "Inborn food bias" and "Brain size (gene)". The explorer shows each creature's inborn bite drive next to its current one, so you can see what it learned. "Fast-forward" in the speed menu runs without drawing every frame, for many generations.

## Zoom-in explorer
Click a creature, then "Zoom into this creature" (or double-click it). The world keeps running at one step per frame while you explore. Esc steps back out.
- **Organism:** the world as the creature sees it (heading up, one slice per eye ray, lit by what the ray reports), its senses → brain → actions, and a spike timeline of senses and muscles with meals marked.
- **Brain:** the tissue with every neuron and synapse, spikes travelling, and a timeline of every cell plus dopamine.
- **Cell:** one neuron's membrane voltage against its threshold, its firing rate against its homeostatic target, its connection points, and its strongest inputs and outputs, with a plain-language introduction to that kind of cell.

The code is in `explorer.js`.

## Results so far
"Picky eating" is how much more often creatures bite food than poison when it is at the mouth (0.5 = no preference, 1 = only food). About 4 generations pass per 1,000 steps.

### W2: fixed brains (15,000 steps, seeds 1 and 2)
| World | Stable | Seasons every 3000 steps |
|---|---|---|
| Instincts | 0.98 to 1.00, thrives | 0.98, then 0.00 at the first swap; extinct by about step 4,600 |
| Brains, learning | about 0.62 rising to 0.70 | about 0.55 to 0.68, recovers after each swap, survives |
| Brains, learning off | 0.50 | 0.50, survives as indiscriminate eaters |

### W3: evolving brains (30,000 steps, about 110 to 170 generations, seeds 1 to 4)
| World | Survived | Picky | Inborn food bias | Learning rate (starts 0.020) |
|---|---|---|---|---|
| Stable | 4 of 4 | 0.96 | 1.0 to 1.45 | 0.002 to 0.018, falls in every seed |
| Seasons every 3000 steps | 2 of 4 (others died near step 13,500) | about 0.58 | swings with the seasons | 0.017 to 0.042 |
| Same, learning off | 4 of 4 | 0.47 to 0.89 | swings with the seasons | 0 (fixed) |
| Seasons every 1000 steps | 4 of 4 | about 0.55 | about 0 | 0.009 to 0.017 |

What this shows:
- **In a stable world evolution builds the answer in.** Within about 100 generations the inborn reflexes favour the food colour and picky eating reaches 0.96, far above what learning alone reached in W2. Learning then loses value and its gene drifts down. This is genetic assimilation (the Baldwin effect's second step).
- **With seasons every 3000 steps (about 12 generations), evolution still wins.** It re-biases instincts within each season. Learning brains did no better: two of four learning worlds died out, all four non-learning worlds survived. Learning here is too slow and too costly to beat a fast-evolving instinct.
- **With seasons every 1000 steps, evolution cannot keep up.** Instinct bias stays near zero and creatures become indiscriminate eaters; learning stays but does not make them picky.

So far learning has not paid off once evolution can tune instincts. Ideas to test next: faster, one-trial learning (like taste aversion), seasons within a lifetime but longer than a learning episode, and the W4 additions (glia, competition, newborn neurons).

## Headless use
```js
const { World } = require('./engine.js');
const w = new World({ seed: 1, mind: 'brain', seasonLength: 3000 });
for (let i = 0; i < 30000; i++) w.step();
console.log(w.history.at(-1));
```
