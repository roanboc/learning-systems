# Forager Worlds

Several independent worlds run side by side. Each world has its own random seed, plants and gene pool, so worlds never share creatures or genes and can be compared directly.

Open `index.html` in a browser. No build step. `engine.js` has no DOM code and also runs in Node.

## Guided lab

**Guided labs** in the toolbar (or `#lab=learning-colour` in the URL) opens *Learning a colour*: two worlds with instincts held equal for both colours, one with dopamine blocked. It goes from one synapse (the mouth cell → bite neuron, in the zoomed cell view) to what a creature bites, to picky eating across the population. In headless runs (seeds 1 to 3, 6,000 steps) picky eating reached about 0.65 to 0.85 with dopamine and stayed about 0.45 to 0.55 without (0.5 means no preference). Lab data in `labs.js`, engine in `lib/learn.js`.

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
- **Tissue brain (W4):** the same senses and muscles wired into a small slice of living tissue from the [Tissue Lab](../../nervous-systems/tissue-lab/) (`tissue-brain.js`).
  - Inside, the Tissue Lab's rules apply: blood vessels supply energy, astrocytes feed active neurons, neurons compete for growth factor and die without it, microglia eat unused synapses, and a stem-cell niche adds newborn neurons during life.
  - Sense and muscle cells belong to the body: they never die, sensors only send and muscles only receive.
  - Learning uses the tissue's optional reward rule: coincident spikes leave an eligibility trace, and food or poison turn it into a weight change.
  - Gene `hidden` sets the starting neuron count, new gene `birthRate` sets newborn neurons per 100 steps (0 = no adult neurogenesis). Brain cost follows the neurons alive right now.

## Evolution of brains (W3)
Brain genes set how the brain is built, never its synapses:
- `learnRate`: how fast reward changes synapses (plasticity).
- `hidden`: number of interneurons.
- `orientGreen`, `orientViolet`, `biteGreen`, `biteViolet`: strength of each inborn reflex per colour. They start equal, so a newborn has no built-in preference until evolution gives it one.

A brain is not free: each interneuron costs `neuronCost` energy per step, and learning costs `learnCost × learnRate` per step. Brain genes mutate more slowly than body genes (`brainMutation`). `fixed: { learnRate: 0 }` holds a gene constant, for control worlds; `geneInit` sets starting ranges.

Charts: "Learning rate (gene)", "Inborn food bias" and "Brain size (gene)". The explorer shows each creature's inborn bite drive next to its current one, so you can see what it learned. "Fast-forward" in the speed menu runs without drawing every frame, for many generations.

## Living ecosystem
Set with `plantMode: 'living'` and `species`.

**Living plants.** Each plant is an organism. It grows on fertile soil, and close neighbours shade it, so plants compete for space. Grown plants drop seeds nearby, and a seed only sprouts on fertile, unshaded ground. Plants age and die, and a plant on poor or shaded ground shrinks and dies. A bite is worth more the bigger the plant, and seedlings are too small to see or bite. Poisonous plants grow and seed at half speed (`toxinCost`). By default a seed's toxicity comes from the soil (`poisonFraction`). With `toxinHeredity` above 0 it is inherited, so plants can evolve defences.

**Drifting soil.** Fertile spots (`soilSpots`, `soilRadius`) wander slowly (`soilDrift`). Plants stay rooted, so the vegetation moves by dying where the soil gets poor and seeding where it gets rich. The dish shows soil as a brown glow. Click near a plant to see its life: stage, size, age, seeds dropped and soil fertility.

**Several species in one world.** `species` is a list of `{ name, mind, count, geneInit, fixed }`. Each species keeps its own kind of mind, and its genes evolve inside the species. The presets use three species, each drawn with its own body shape:
- Grazers: instincts only, no brain.
- Small brains: starting with 4 to 8 interneurons.
- Large brains: starting with 28 to 36 interneurons.

### First results (headless, few seeds, so treat as early signs)
- Brains alone live well on living plants (about 100 to 160 creatures over 10,000 steps).
- **Small vs large brains, stable world (seed 1):** small brains win, and large brains are gone by about step 15,000. They cost more and give nothing extra when nothing changes.
- **Small vs large brains, seasons every 3000 steps:** the two coexist for about 25,000 steps, and which one leads keeps switching (seed 1). On seed 2, large brains took over and the world died out at step 16,000.
- **Grazers with brains:** grazers drive the edible plants down and the brain species die out within 2,000 steps (3 of 3 seeds). With seasons, the grazers then starve at the first swap.
- **Heritable toxins** (`toxinHeredity: 0.9`): eaters remove the edible plants, so poisonous plants take over (about 95%) and few eaters remain.

## Hunters, prey and gardeners (W5)
**Hunters.** A species with `diet: 'meat'` eats other creatures instead of plants. When a world has hunters, every eye gains one animal cell per ray. It sees animals of the other diet: prey for a hunter, hunters for a plant eater. There is also a mouth cell that fires when prey is within reach. A hunter bites when its eat neuron fires (brains) or whenever prey is in reach (instincts). Each bite takes `attackDamage` energy from the prey, gives the hunter `meatEfficiency` of it, and gives the prey pain and negative dopamine. Inborn reflexes are genes: chase (`orientAnimal`), flee (`fleeAnimal`) and bite (`biteAnimal`). Instinct minds get one attraction weight, `wAnimal`. Hunters are drawn in red, and the explorer shows animal cells in a third eye column.

**Gardeners.** With `dung` above 0, digested plants return to the soil as droppings where creatures walk, and every death leaves a carcass. Both add fertility that fades over time (`dungDecay`), so plants grow back best along the creatures' paths. The dish shows droppings as darker soil.

### First results (30,000 steps)
- **Brain hunters and prey** coexisted for the whole run in 2 of 3 seeds. Numbers cycled, with hunters peaking after prey, then prey falling. In both, the prey's inborn flee reflex evolved from about 0.13 to about 0.3. On seed 3 the hunters died out by step 9,000.
- **Instinct hunters** over-hunted and died out within about 6,000 steps in 3 of 3 seeds. The prey then lived on alone.
- **Gardeners** (`dung: 0.005`) averaged about 159 creatures against 145 to 156 without droppings (2 seeds each), with higher peaks. The effect is real but modest.

## Tissue brains and newborn neurons (W4)
Question: does adult neurogenesis help in a changing world? Each test world holds two tissue-brain species that differ only in newborn neurons: "Newborn neurons" (`birthRate` starts at 0.5 to 1 and evolves) and "No new neurons" (`birthRate` fixed at 0). Seasons swap food and poison every 3,000 steps. 30,000 steps, seeds 1 to 7.

| World | Newborn neurons win | No new neurons win | Both die | Survive to the end |
|---|---|---|---|---|
| Stable | 5 of 7 | 2 of 7 | 0 | 7 of 7 |
| Seasons every 3000 steps | 4 of 7 | 2 of 7 | 1 of 7 | 4 of 7 |

A second test started one tissue species with almost no neurogenesis (`birthRate` 0 to 0.1) to see if evolution adds it. In stable worlds it rose to about 0.16 to 0.28 and stayed (2 of 2 seeds). In seasonal worlds both seeds died out (steps 6,900 and 12,800), one after rising to 0.36.

What this shows:
- **Newborn neurons win more often, about 2 to 1 (9 of 14 worlds against 4).** One species always takes the whole world, so each world is one vote; this is a lean, not proof.
- **The advantage is not specific to change.** It shows in stable worlds as much as in seasonal ones.
- **Evolution keeps some neurogenesis even from a near-zero start,** but settles well below the costly high rates.
- **Seasons are still hard for tissue brains.** 5 of 9 seasonal worlds lost every creature, as learning brains did in W3. Learning rate falls to about 0.003 in stable worlds and stays a little higher with seasons, as before.
- In the explorer, tissue brains show vessels, astrocytes, microglia, the stem-cell niche and gold rings on newborn neurons.

## Zoom-in explorer
Click a creature, then "Zoom into this creature" (or double-click it). The world keeps running at one step per frame while you explore. Esc steps back out.
- **Organism:** the world as the creature sees it (heading up, one slice per eye ray, lit by what the ray reports), its senses → brain → actions, and a spike timeline of senses and muscles with meals marked.
- **Brain:** the tissue with every neuron and synapse, spikes travelling, and a timeline of every cell plus dopamine.
- **Cell:** one neuron's membrane voltage against its threshold, its firing rate against its homeostatic target, its connection points, and its strongest inputs and outputs, with a plain-language introduction to that kind of cell.

The code is in `explorer.js`.

### Zooming into a plant
In living worlds, click near a plant and choose "Zoom into this plant" (or double-click it). Esc steps back out.
- **Plant:** its patch of ground (drifting soil, the shade of neighbours, lines to its parent and sprouted offspring, passing creatures), a side view of the plant, its life so far (size, light, soil, seeds dropped), and facts such as what it is worth to an eater. When it dies the page says how: eaten (and by which creature), starved, or old.
- **Tissues:** leaves, xylem (water rising), phloem (sugar moving), growing tip, root hairs, seeds and, for poisonous plants, defence cells. Each glows with how busy it is.
- **Cell:** one kind of plant cell with a plain-language introduction, what it is doing in this plant now, and its activity over time.

The model works on the whole plant (light, soil, growth, seeds). Tissues and cells show where those numbers happen in a real plant; they are not simulated one by one, and the page says so. The code is in `plant-explorer.js`.

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

So far learning has not paid off once evolution can tune instincts. Ideas to test next: faster, one-trial learning (like taste aversion), seasons within a lifetime but longer than a learning episode, and the W4 tissue brains (results above).

## Headless use
```js
const { World } = require('./engine.js');
const w = new World({ seed: 1, mind: 'brain', seasonLength: 3000 });
for (let i = 0; i < 30000; i++) w.step();
console.log(w.history.at(-1));
```
