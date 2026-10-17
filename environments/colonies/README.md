# Colonies: sharers and cheats

Chapter 3 of the timeline of life, as its own lab page. Open `index.html` in a browser. No build step.

It reuses the First cells page (`../first-cells/app.js` and `draw.js`) with `data-stage="colonies"`, so the engine is `lib/life.js` at stage `colonies` with its opt-in `goods` setting switched on. Nothing changes for other pages or the World Viewer: with `goods` off, every world draws the same random numbers and gives the same results as before.

## The rule

- Each cell has a **helper** gene (0 to 1). Every step, in water, it releases `goodMake × helper` of a helper molecule into its map cell and pays `goodCost × helper` energy.
- The helper molecule is a field of the coast (`earth.addField('helper')`): currents carry it, it spreads by `goodSpread` (0 by default) and breaks down by `goodDecay` per step.
- Wherever it is, it turns raw molecules into building blocks (`goodUnlock × helper × raw` per step). Any cell there can eat them. Nothing is created: raw becomes blocks.
- Daughters copy the helper gene with the usual mutation, so cheats (helper below 0.1) keep arising.

This is a diffusible public good, like the siderophores bacteria release to grab iron or the invertase yeast releases to digest sugar.

Worlds side by side: kin stay together (sticking fixed at 0.95), daughters drift apart (sticking fixed at 0), together but starting as cheats, together with a helper that spreads far, nobody makes helper, free to evolve. Cells are coloured by their helper gene (green sharers, purple cheats); the map can show the helper molecule.

**Guided lab** ("Why share when you could cheat?", `labs.js` on `lib/learn.js`): together vs apart, the helper gene over time, where the helper lies on the map, then a coast that starts with cheats.

## What the test runs show (2026-10-17)

| Coast | Seeds | Helper gene (start → end) |
|---|---|---|
| Kin stay together | 3, 4, 5 | 0.55 → 0.52–0.57 over 6,000 to 12,000 steps (holds) |
| Daughters drift apart | 3, 4, 5 | 0.55 → 0.29–0.39 by 6,000 steps (seed 5: 0.32 by 12,000) |
| Together, starting as cheats | 3, 4 | 0.10 → 0.18–0.19 over 12,000 steps (rises slowly) |
| Together, helper spreads far | 3, 4 | 0.55 → 0.48–0.51 over 9,000 steps (slow fall) |
| Free to evolve (sticking evolves too) | 3 | 0.55 → 0.29–0.36 |
| First cells (no sticking), several helper settings | 3, 4 | 0.55 → 0.07–0.19 over 6,000 to 12,000 steps |

So sharing holds when families stay together and the help stays local, and cheats win among strangers. That matches kin selection and the spatial public-goods results (Hamilton 1964; Griffin, West and Buckling 2004; Gore, Youk and van Oudenaarden 2009; Allen, Gore and Nowak 2013). Selection is weak here: one map cell holds several families, and the coast is usually full (900 cells), so population size barely shows the benefit.

## Simplified

The helper molecule is made up, one map cell is far bigger than a real cell, and genes are numbers. Real microbes also regulate production (quorum sensing), police cheats and choose partners; none of that is here yet.
