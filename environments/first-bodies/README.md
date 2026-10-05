# Bodies: the first muscles

Chapter 3 of the timeline of life, as its own lab page. Open `index.html` in a browser. No build step.

It reuses the First cells page (`../first-cells/app.js` and `draw.js`) with `data-stage="bodies"`, so the engine is `lib/life.js` at stage `bodies`. Cells that stay stuck after dividing form bodies. Cells in a body can take a role (gene `specialise`): **contracting cells** squeeze in a rhythm, pull their neighbours closer (shorter bonds) and push the body along the lead cell's heading; germ cells make new bodies.

Each contracting cell has its own beat (a phase and a slightly different natural pace). The **linking gene** (`sync`) sets how strongly it falls into the body's common rhythm (a Kuramoto mean-field pull, standing in for gap junctions). A body's push is scaled by R², where R is how together its cells squeeze (1 = all at once), because pushes add only when they coincide.

Worlds side by side: free to evolve, linked rhythm (sync fixed at 1), each cell on its own rhythm (sync fixed at 0), no roles. Up close, a contracting cell turns orange and shrinks while it squeezes.

**Guided lab** ("Why do muscles beat together?", `labs.js` on `lib/learn.js`): linked vs unlinked bodies, one squeeze up close, body speed, then a coast where the linking gene evolves.

## What the test runs show (seeds 3, 4, 5)

- Linked bodies beat in step (about 1.0 against 0.5) and push about twice as fast (body speed about 0.10 against 0.05).
- Left free, the linking gene rises only slowly (from about 0.06 to 0.11–0.17). Started at 0.5, it went down on one coast and up on another. Beating together helps, but the help is small next to finding food.

## Simplified

Real early animal muscle (as in Hydra) is epitheliomuscular: skin cells with contractile fibres, coupled by gap junctions and later paced by nerves. Here a cell either contracts or not, the beat is a made-up oscillator, and genes are numbers.
