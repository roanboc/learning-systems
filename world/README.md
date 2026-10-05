# World Viewer

One stage for the timeline of life. Open `index.html` in a browser. No build step.

- **Timeline:** chapters from Early Earth to ecosystems. Lit chapters run live; the others are planned (first cells, colonies, bodies, nerve nets). Only the chapter you are in runs; the others wait where you left them.
- **Camera:** drag to move, scroll or pinch to zoom, arrow keys and `+`/`−`. Zoom decides the level: in Early Earth, zoom in until the water turns into molecules; click a bubble to follow it. In Brains and Ecosystems, click a creature to follow it, then keep zooming (or double-click) to go inside its body, brain and cells.
- **Story:** "Tell me the story" (or `#story` in the URL) walks through how this world was made: ground and sea, sun, vent heat, tides, currents, energy, building blocks, chains, copiers, bubbles, protocells, then creatures with brains and ecosystems. Each step moves the camera and says what to look for.

Each chapter reuses a product's engine: `lib/earth.js` and `lib/chemistry.js` for Early Earth, `environments/forager-worlds/` for Brains and Ecosystems. The full labs (side-by-side comparisons, charts, parameters) stay on their own pages.
