# Learning Systems

Small simulated worlds for learning how living systems organise themselves: behaviour emerges from local rules, with no global controller. Everything runs in the browser with no build step.

Open `index.html` for the catalogue.

## Products

| Shelf | Product | Status |
|---|---|---|
| Environments | [Early Earth](environments/early-earth/) | Available (chapter 0, first version) |
| Environments | [Forager Worlds](environments/forager-worlds/) | Available (W5, tissue brains) |
| Nervous systems | [Tissue Lab](nervous-systems/tissue-lab/) | Available (first version) |

## Layout

- `index.html`: catalogue page linking every product.
- `environments/`: worlds that pose the problem (resources, hazards, change).
- `nervous-systems/`: brains as living tissue.
- `lib/`: code shared across products: `lib/brain.js`, the self-wiring spiking brain; `lib/earth.js`, the shared Earth (land, sea, tides, sun, heat, currents) that every chapter of the timeline of life is meant to live in; `lib/chemistry.js`, the early Earth chemistry.

Each product folder is self-contained except for `lib/`, and its engine has no DOM code, so it also runs headless in Node.
