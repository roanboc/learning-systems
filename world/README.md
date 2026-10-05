# World Viewer

One stage for the timeline of life. Open `index.html` in a browser. No build step.

- **Timeline:** seven chapters, all live: Early Earth, First cells, Colonies, Bodies, Nerve nets, Brains, Ecosystems. Only the chapter you are in runs; the others wait where you left them.
- **Camera:** drag to move, scroll or pinch to zoom, arrow keys and `+`/`−`. Zoom decides the level: in Early Earth, zoom in until the water turns into molecules; click a bubble to follow it. In the four cell chapters, click a cell to follow it and its clump; "Who is who" names the roles and counts them. In Brains and Ecosystems, click a creature to follow it, then keep zooming (or double-click) to go inside its body, brain and cells.
- **Story:** "Tell me the story" (or `#story` in the URL) walks through how this world was made: ground and sea, sun, vent heat, tides, currents, energy, building blocks, chains, copiers, bubbles, protocells, first cells and evolved food-following, predators and colonies, bodies with roles, nerve nets, then creatures with brains and ecosystems (21 steps). Each step moves the camera and says what to look for.

Each chapter reuses a product's engine: `lib/earth.js` and `lib/chemistry.js` for Early Earth, `lib/life.js` (cells living in that same coast and chemistry) for the four cell chapters, `environments/forager-worlds/` for Brains and Ecosystems. The full labs (side-by-side comparisons, charts, parameters) stay on their own pages.

## The cell chapters (`lib/life.js`)

One engine, four chapters; each switches on one more ability on the same coast:

- **First cells:** cells eat building blocks and energy, swim by run and tumble, divide with mutated genes. The "follows food" (chemotaxis) gene can evolve.
- **Colonies:** predators swallow anything smaller than four cells; daughters may stay stuck (`stick`) and share energy (`share`). In test runs the average `stick` gene rose from about 0.07 to 0.39 over 10,000 steps on two seeds.
- **Bodies:** cells in clumps of four or more may take a role (`specialise`): outer cells become movers (swim, never divide, age faster), inner cells germ cells (feed, divide, never swim). Full bodies release seed cells.
- **Nerve nets:** some movers become nerve cells (`nerve`); a cell tasting richer food than its body fires and nerve cells relay the signal, so movers push toward food together.

The `specialise` and `nerve` genes rise only modestly in test runs (about +0.1 to +0.25 over 10,000 steps); the population is food-capped much of the time, so selection is weak. Treat these as leans, not results.
