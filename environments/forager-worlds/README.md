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

## Results so far (headless runs, 15,000 steps, seeds 1 and 2)
"Picky eating" is how much more often creatures bite food than poison when it is at the mouth (0.5 = no preference, 1 = only food).

| World | Stable | Seasons every 3000 steps |
|---|---|---|
| Instincts | 0.98 to 1.00, thrives | 0.98, then 0.00 at the first swap; extinct by about step 4,600 |
| Brains, learning | about 0.62 rising to 0.70 | about 0.55 to 0.68, recovers after each swap, survives |
| Brains, learning off | 0.50 | 0.50, survives as indiscriminate eaters |

Evolved instincts beat learning when the world never changes. Learning keeps a population picky through changes that wipe instincts out. W3 lets evolution tune the brain's growth and inborn reflexes.

## Headless use
```js
const { World } = require('./engine.js');
const w = new World({ seed: 1, mind: 'brain', seasonLength: 3000 });
for (let i = 0; i < 15000; i++) w.step();
console.log(w.history.at(-1));
```
