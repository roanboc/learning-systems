# Forager Worlds (W1)

Several independent worlds run side by side. Each world has its own random seed, plants and gene pool, so worlds never share creatures or genes and can be compared directly.

Open `index.html` in a browser. No build step. `engine.js` has no DOM code and also runs in Node.

## What is in W1
- Plants grow in patches (logistic regrowth, random withering). Each plant is green or violet. One colour is food, the other poison.
- In seasonal worlds the meaning of the colours swaps every `seasonLength` steps.
- Creatures have no brain yet. They steer with inherited reflexes: two "eyes" sum the green and violet plants seen on each side, and genes set how strongly each colour attracts or repels them.
- Creatures eat whatever they touch, pay energy to live, move and see, and split when their energy passes a genetic threshold. Children inherit mutated genes. There is no fitness function.

## Default comparison
Same seed, only the season length differs:
- **Stable:** instincts evolve toward the food colour and the population persists.
- **Fast seasons (1000 steps):** generalists that like both colours tend to survive.
- **Slow seasons (3000 steps):** the population specialises on one colour, then the swap wipes it out.

This is the baseline that learning brains (W2 onward) have to beat. See the project plan `brain-in-a-world-v4.md`.

## Headless use
```js
const { World } = require('./engine.js');
const w = new World({ seed: 1, seasonLength: 1000 });
for (let i = 0; i < 20000; i++) w.step();
console.log(w.history.at(-1));
```
