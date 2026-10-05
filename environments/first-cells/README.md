# First cells: learning to move

Chapter 1 of the timeline of life, as its own lab page. Open `index.html` in a browser. No build step.

Cells (`lib/life.js`, stage `cells`) live on the Early Earth coast (`lib/earth.js`, `lib/chemistry.js`). They start with almost no motor and drift with the currents. Three genes can evolve:

- **motor** (`speed`): a flagellum. Faster swimming costs more energy (cost grows with speed²).
- **follows food** (`tumble`): run and tumble chemotaxis, as in E. coli. Only useful to cells that swim.
- **eyespot**: the cell turns toward light, and away from it above a comfortable level (as Chlamydomonas switches sign at high light). Cells carry a pigment that harvests a little light energy (`lightGain`), and crowded cells shade each other.

Worlds side by side: free to evolve, start with strong motors, no motors, no eyespots, no food from light. Zoom in close to see each cell's flagellum (length = motor) and eyespot (size = gene).

**Guided lab** ("How did cells start to move?", `labs.js` on `lib/learn.js`): three coasts, weak motors vs strong motors vs none, then steering, light, and back to one cell.

## What the test runs show (seeds 3, 4, 5; 8,000 to 14,000 steps)

- Motors rise from about 0.01 to 0.07–0.10, and worlds that start with strong motors (0.25) fall to about the same value: a best motor strength, set by food gained against energy spent.
- "Follows food" rises more where cells can swim (0.32–0.43 against 0.19–0.29 without motors at 14,000 steps), but genes that do nothing also wander by chance, so the gap is modest on some coasts.
- Eyespots rise only a little (0.05 to about 0.22, against 0.12–0.20 without motors). Most food on this coast comes from the dark vents, so light sense pays little. Eyespots pulled cells onto shallow rock where the tide stranded them until light avoidance was added.

## Simplified

One map cell is far bigger than a real cell, the chemistry is made up, cells feel a quarter of the current (as if near the floor), and genes are numbers. Real eyespots belong to later single cells (algae); bacteria sense light with simpler pigments. Muscle came much later, in animals: see the Bodies and Nerve nets chapters of the World Viewer.
