# Bodies: the first muscles

Chapter 4 of the timeline of life, as its own lab page. Open `index.html` in a browser. No build step.

It reuses the First cells page (`../first-cells/app.js` and `draw.js`) with `data-stage="bodies"`, so the engine is `lib/life.js` at stage `bodies`. Cells that stay stuck after dividing form bodies. Cells in a body can take a role (gene `specialise`): **contracting cells** squeeze in a rhythm, pull their neighbours closer (shorter bonds) and push the body along the lead cell's heading; germ cells make new bodies.

Each contracting cell has its own beat (a phase and a slightly different natural pace). The **linking gene** (`sync`) sets how strongly it falls into the body's common rhythm (a Kuramoto mean-field pull, standing in for gap junctions). A body's push is scaled by R², where R is how together its cells squeeze (1 = all at once), because pushes add only when they coincide.

Worlds side by side: free to evolve, linked rhythm (sync fixed at 1), each cell on its own rhythm (sync fixed at 0), no roles, **Clones** and **Two parents**. Up close, a contracting cell turns orange and shrinks while it squeezes.

**Guided lab** ("Why do muscles beat together?", `labs.js` on `lib/learn.js`): linked vs unlinked bodies, one squeeze up close, body speed, then a coast where the linking gene evolves.

**Two parents** (opt-in in `lib/life.js`, off by default; plan and decisions in [proposal.md](proposal.md)). `seedsOnly`: new bodies start only from germ-cell seeds (daughters stay in their body, no fragments). `harm`: each division can break one of 10 genes for good (`loci`), and each broken gene adds 15% to upkeep (`harmCost`), standing in for Muller's ratchet. `sex`: a seed needs a germ cell of another body within `mateRange` (6 map cells) and takes each gene from either parent at random; with no partner, no seed. The Clones world has `seedsOnly` and `harm` 0.05; Two parents adds `sex`.

**Guided lab** ("Why two parents?"): seeds made and partners missed, broken genes in one cell, broken genes across the population, then the paradox of sex.

## What the test runs show (seeds 3, 4, 5)

- Linked bodies beat in step (about 1.0 against 0.5) and push about twice as fast (body speed about 0.10 against 0.05).
- Left free, the linking gene rises only slowly (from about 0.06 to 0.11–0.17). Started at 0.5, it went down on one coast and up on another. Beating together helps, but the help is small next to finding food.

## Two parents: what the test runs show (2026-10-20)

Seeds 1 to 5, 8,000 steps (`Clones` against `Two parents`).

| | Clones | Two parents |
|---|---|---|
| Seeds released | 56–512 | 33–222 (a third to two thirds as many) |
| Germ cell ready, no partner in reach | 0 | 22–167 times (39–65% of tries) |
| Broken genes per cell at step 8,000 | 0.10–0.22 | 0.13–0.31 (lower on 2 of 5 seeds) |

Expected: two parents keep fewer broken genes than clones. **Failed**: no clear difference, and sex costs seeds. The page presents this as the paradox of sex (Otto 2009, debated), not as a finding about real species.

Prototype variants that also failed (not shipped): sex with loose daughters and fragments left on (only 11–26 matings against about 6,000 births, so sex barely ran); harm 0.2 (no difference over 13–20 cell generations); bodies that age and die after 1,200 steps (populations crashed to 1–30 bodies and one two-parent world died out).

**Fixed-seed check.** With the new settings off, Early Earth, First cells, Colonies, Bodies, Nerve nets and Gaia Ecosystems give identical results.

## References

The page's References section is the full list. Two parents: Butterfield 2000 and Gibson et al. 2018 (Bangiomorpha, 1.047 billion years ago, **well supported**); Speijer, Lukeš and Eliáš 2015 (sex in the last common ancestor of eukaryotes, **well supported**); Muller 1964 and Felsenstein 1974 (**well supported**, models); Kondrashov 1988 (**debated**); Otto 2009 (**debated**); McDonald, Rice and Desai 2016 (**well supported**); Maynard Smith 1978. Muscles: Liu et al. 2014 (Haootia), Brunet and Arendt 2016, Kuramoto 1984.

## Simplified

Real early animal muscle (as in Hydra) is epitheliomuscular: skin cells with contractile fibres, coupled by gap junctions and later paced by nerves. Here a cell either contracts or not, the beat is a made-up oscillator, and genes are numbers. Two parents: no sexes, no meiosis, unlinked genes, and a gene is either broken or not.
