# Learning Systems

Small simulated worlds for learning how living systems organise themselves: behaviour emerges from local rules, with no global controller. Everything runs in the browser with no build step.

Open `index.html` for the catalogue.

## Products

| Shelf | Product | Status |
|---|---|---|
| Start here | [World Viewer](world/) | Timeline of life from chemistry to cells, colonies, bodies, nerve nets, brains and ecosystems; camera and levels; guided story |
| Environments | [Early Earth](environments/early-earth/) | Available (chapter 0, first version) |
| Environments | [First cells](environments/first-cells/) | Available (chapter 1: how cells came to move, with a guided lab) |
| Environments | [Bodies: the first muscles](environments/first-bodies/) | Available (chapter 3: contracting cells that beat together, with a guided lab) |
| Environments | [Forager Worlds](environments/forager-worlds/) | Available (W5, tissue brains, bodies of cells) |
| Nervous systems | [Tissue Lab](nervous-systems/tissue-lab/) | Available (first version) |

## Layout

- `index.html`: catalogue page linking every product.
- `world/`: the World Viewer, one stage for the timeline of life. Each chapter reuses a product's engine.
- `environments/`: worlds that pose the problem (resources, hazards, change).
- `nervous-systems/`: brains as living tissue.
- `labs/`: all guided labs on one page with progress, plus situations to decide ("Make the call").
- `lib/`: code shared across products: `lib/brain.js`, the self-wiring spiking brain; `lib/earth.js`, the shared Earth (land, sea, tides, sun, heat, currents) that every chapter of the timeline of life is meant to live in; `lib/chemistry.js`, the early Earth chemistry; `lib/life.js`, cells, colonies, bodies and nerve nets living in that same Earth; `lib/body.js`, a creature's body made of organs and cells in a body fluid (Forager Worlds `body: 'cells'`); `lib/learn.js`, the guided labs panel (each product keeps its own labs in `labs.js`), and `lib/lab-catalogue.js`, the list of every lab, so any page can link to labs elsewhere.

Each product folder is self-contained except for `lib/`, and its engine has no DOM code, so it also runs headless in Node.
