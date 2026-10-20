# First genes: a protocell that makes itself

Chapter 1 of the timeline of life, between Early Earth and First cells, as its own lab page. Open `index.html` in a browser. No build step. The plan and decisions are in [proposal.md](proposal.md).

It reuses the Early Earth page (`../early-earth/app.js` and `draw.js`) with `data-stage="genes"`, so the engine is `lib/chemistry.js` with its opt-in `genes` setting switched on. Gaia builds it as the `genes` era (`Gaia.make({ era: 'genes' })`), and the World Viewer has it as chapter 1. With `genes` off, every world draws the same random numbers and gives the same results as before (fixed-seed check below).

The page covers three things Rodrigo asked for on 2026-10-17: how genes began and what they were for, reproduction, and autopoiesis. It also links autopoiesis along the timeline (Early Earth, First genes, First cells, Colonies, Bodies, Brains) and lists how each chapter of Gaia reproduces.

## The rules

- **Copiers with a job.** The copiers inside a bubble come in three kinds. **Skin-makers** turn raw molecules from the water into oils for the bubble's own skin (`skinMake`). **Block-makers** turn raw molecules and energy into building blocks inside (`blockMake`). Both pay energy (`makeCost`). **Plain copiers** only copy.
- **Parasites.** Copying, limited by the blocks inside, is shared among the kinds. Working genes copy 10% slower (`geneCost`). A copy of a working gene comes out broken, as a plain copier, 0.5% of the time (`geneError`), and a few plain copies happen to work (`geneGain`).
- **Reproduction.** A bubble splits when its skin has doubled. Each kind is shared between the daughters by chance, molecule by molecule (`geneUnit`: one molecule is 0.05 units, so a protocell holds about 15 to 30): the stochastic corrector. When the sea is full (`maxBubbles`), random bubbles break up, so fast splitters spread.
- **Makes itself (closure).** Each bubble keeps a running share of its skin and blocks that its own genes made, against what it took from the water. It is a teaching proxy for organizational closure.
- **Worlds** (`GENE_PRESETS`): First genes; **Leaky skin** (`leaky`: what genes make goes into the water for everyone); **No skin-makers** (`skinMake: 0`); **Linked genes** (`linked`: genes copied as one chain and passed on together, copying 20% slower).
- The chapter starts with 60 protocells near the vents (`startProtocells`), each with a random mix of copiers, as if handed on from Early Earth.

**Guided lab** ("Why keep genes inside a skin?", `labs.js` on `lib/learn.js`): First genes against Leaky skin, from one protocell, to the copiers inside it, to working genes across the population, to lineages across the coast.

## What the test runs show (2026-10-17)

Seeds 1, 2 and 3, 12,000 steps each (`node environments/first-genes/check.js <world> <seed>`). Averages over steps 6,000 to 12,000 unless marked.

| World | Protocells | Working genes | Makes itself | Longest lineage at 12,000 |
|---|---|---|---|---|
| First genes | 430–512 | 52–63% | 39–46% | 110–159 generations |
| Leaky skin | 33–511 | 4–20% | 0% (by design) | 32–70 |
| No skin-makers | 301–325 (34–141 in steps 1,000–4,000) | 24–29% | 28–30% | 61–72 |
| Linked genes | 403–488 | 40–44% | 41–46% | 108–138 |

Against the claims in the proposal:

1. **Self-made skin frees protocells from the vents: failed as written.** Currents carry every bubble more than 10 map cells from a vent within a day, in every world, so distance from vents does not tell the worlds apart. What does: without skin-makers, protocells barely reproduce while free oils are scarce (34–141 protocells in steps 1,000 to 4,000, against 506–549). Later, oils left by broken protocells fill the water and protocells without skin-makers recover (about 300).
2. **Closure rises: partly.** "Makes itself" averages 39–46% in all three seeds, peaks above 60%, and swings with day and night (energy comes from sunlight). It does not keep rising: as oils build up in the water, protocells take more of their skin from outside.
3. **Skins keep parasites down: yes, 3 of 3 seeds.** Working genes 52–63% with skins against 4–20% with leaky skins. Parasites stay at 35–46% of copiers, not below 30% as hoped. Lineages last two to four times longer.
4. **Linked genes make reproduction more reliable: failed.** Daughters with no working genes are no rarer (8–49% against 12–50%), and working genes are lower (40–44% against 52–63%). Linking stops parasites from copying faster inside a protocell, but it also removes the chance differences between daughters that selection works on. Treat it as an open question for this model, not as a finding about real chromosomes.

**Fixed-seed check.** Early Earth (seed 3, 7,000 steps, 1,335 splits), First cells and Colonies (seed 2, 1,500 steps) and Gaia Ecosystems (seed 1, 300 steps) give identical results on `main` and on this branch.

## Tuning notes

- With `geneUnit` 0.005 (about 150 molecules per protocell) daughters were too alike and parasites won everywhere (working genes 3–5%). At 0.05 the stochastic corrector works.
- Bubbles could not split once the sea was full, which froze selection. Random break-ups at the cap fixed it (genes only; Early Earth keeps its old rule).
- With the first job rates (`skinMake` 0.05) protocells hardly grew: energy inside the bubble ran out. 1 and 0.5, with a lower `makeCost`, let jobs matter.

## Simplified

Three made-up jobs stand in for real ribozymes; one molecule is a fixed amount of a continuous number; a map cell is far bigger than a protocell. Copiers inside a protocell do not mutate into new jobs, and the split between DNA (storage) and proteins (work) is not modelled. Sex is in the Bodies chapter (the Two parents world and the lab "Why two parents?").

## References

The page's References section is the full list, with what each supports and its claim label. In short:

- Joyce and Szostak 2018, protocells and RNA self-replication (**debated**: RNA world).
- Szathmáry and Demeter 1987, the stochastic corrector (**well supported**, model).
- Eigen 1971, copying errors and parasites (**well supported**).
- Takeuchi and Hogeweg 2009, multilevel selection of replicators (**well supported**, model).
- Bansho et al. 2016 and Mizuuchi et al. 2022, RNA replicators and parasites in compartments (**well supported**).
- Zhu and Szostak 2009; Chen, Roberts and Szostak 2004, protocell growth, division and competition (**well supported**).
- Varela, Maturana and Uribe 1974, autopoiesis (**debated** as a definition of life); Moreno and Mossio 2015, closure as a matter of degree (**debated**); Gánti 1971/2003, the chemoton (**well supported** as a model).
- Maynard Smith and Szathmáry 1993 and 1995, chromosomes and major transitions (**well supported**).
- Moody et al. 2024, the last common ancestor about 4.2 billion years ago (**debated**); Wilde et al. 2001, oceans 4.4 billion years ago (**well supported**); Gibson et al. 2018, the oldest fossil evidence of sex (**well supported**).
- Di Paolo, Buhrmann and Barandiaran 2017, sensorimotor autonomy (**debated**); Lane 2022, the vent alternative (**debated**).
- Simulations: Tierra (Ray 1991), computational autopoiesis (McMullin 2004), Squirm3 (Hutton 2002).
