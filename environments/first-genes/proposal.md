# Proposal: First genes (a self-making protocell), and reproduction across Gaia

Status: **proposal, waiting for Rodrigo's confirmation** (AGENTS.md stage 5). No code yet.

Asked by Rodrigo on 2026-10-17: "include the genes milestone, how genes started their journey with the first organisms that developed them and what was the purpose. We haven't touched the reproduction mechanism either. It would be good to have an autopoiesis module."

## The short answer to "how did genes start, and what for?"

- Genes did not start as a blueprint. The leading view is that the first genes were **molecules that did two things at once: they got copied, and they did a job**, such as speeding up a reaction (RNA that acts as an enzyme, a ribozyme). This is the **RNA world** idea: **debated**, but the most widely used working hypothesis (Joyce and Szostak 2018; Robertson and Joyce 2012).
- A copier that does a job is useless floating in open water: anyone nearby benefits, and a "parasite" copy that skips the job and only copies wins (Eigen 1971; Maynard Smith 1979). **Inside a skin**, the job helps the copier's own bubble grow and split, so the job pays. Compartments keeping parasites down is **well supported** in models (Szathmáry and Demeter 1987, the stochastic corrector) and in RNA experiments (Bansho et al. 2016; Mizuuchi et al. 2022).
- So the first purpose of genes was **to keep remaking the protocell's own parts** (its skin and its building blocks) and to pass that ability to both daughters. That is the bridge to autopoiesis: a network that makes the parts that make it. Storage of information (DNA) and work (proteins) split apart later, a division of labour (Maynard Smith and Szathmáry 1995).
- By LUCA, the last common ancestor of all life, genes were already a full system: about 2,600 proteins, around 4.2 billion years ago (Moody et al. 2024; the date is **debated**).

## Where Gaia stands today

- **Early Earth** (`lib/chemistry.js`): copiers arise in tide pools and copy themselves; oily bubbles trap them, grow faster when full of copiers and split, sharing contents at random. All copiers are the same molecule. They only make a bubble swell; they do no job, and a bubble's skin always comes from oils made at the vents.
- **First cells** (`lib/life.js`): cells already have genes (motor, follows food, eyespot, divides at) and divide with small mutations.
- The gap between the two is exactly the genes milestone: how a copied molecule became a gene that does something for its own protocell.

## Stage 1. Foundation

**Real phenomenon.** The origin of genetic heredity in protocells: replicators that catalyse their protocell's own metabolism and membrane, grow, divide and pass on their contents.

**Best sources.** Review: Joyce and Szostak 2018 (protocells and RNA self-replication). Classic models: Gánti's **chemoton** (1971; metabolism + template + membrane, each autocatalytic and coupled) and the **stochastic corrector** (Szathmáry and Demeter 1987). Autopoiesis: Varela, Maturana and Uribe 1974, read through its successor, **organizational closure** (Moreno and Mossio 2015).

**Systems idea it teaches.** Closure: a system that produces the parts that keep it going, as a matter of degree; and multilevel selection, where what is good for the protocell beats what is good for the single molecule only when there is a boundary.

**Level and time.** Chemistry → first cells. Before LUCA, so before about 4.2 billion years ago (see stage 4).

**Against the state of the art** (`plans/systems-theory-today.md`):

| Claim | Label | Note |
|---|---|---|
| First genes were RNA that both copied and catalysed (RNA world) | **debated** | Leading hypothesis; rivals are metabolism-first (Lane 2022, vents) and co-evolution of RNA and peptides. The page shows it as an open question. |
| Compartments protect cooperative replicators from parasites | **well supported** | Models (Szathmáry and Demeter 1987; Takeuchi and Hogeweg 2009) and experiments (Bansho 2016; Mizuuchi 2022). |
| Fatty-acid vesicles grow and divide on their own and pass RNA to daughters | **well supported** (lab) | Zhu and Szostak 2009; Chen, Roberts and Szostak 2004 (already used). |
| Autopoiesis defines life (all or nothing) | **debated** | The page uses closure as a graded measure instead, per Moreno and Mossio 2015; critics say even a flame meets weak closure (Garson; Rider 2024). |
| Genes linked into one chromosome so daughters get full sets | **well supported** in theory (Maynard Smith and Szathmáry 1993), **speculative** as to when it happened | |
| LUCA about 4.2 billion years ago with about 2,600 proteins | **debated** | Moody et al. 2024; other studies give younger or older dates. |

**Similar public simulations** (referenced, not copied):
- Tierra (Ray 1991) and Avida: digital self-copiers where parasites appear on their own. We use chemistry, a skin and a coast, not code that copies.
- Varela, Maturana and Uribe's 1974 autopoiesis automaton and McMullin's SCL re-implementation: a membrane that repairs itself. We add genes and evolution, which the original lacks.
- Squirm3 (Hutton 2002): an artificial chemistry where self-replicating cells with membranes appear. We tie the same idea to the timeline and hand protocells on to the First cells chapter.
- Takeuchi and Hogeweg's multilevel replicator models: the scientific model closest to ours; we make it visible and explorable.

## Stage 2. Mechanism table

All of this is an opt-in setting `genes` in `lib/chemistry.js`, off by default. With it off, Early Earth gives identical results (fixed-seed check).

| Local rule | Grounded or simplified |
|---|---|
| Copiers inside a bubble come in **kinds** (a bubble holds an amount of each): **skin-makers** turn raw molecules into oils inside the bubble; **block-makers** turn raw + energy into building blocks inside; **plain copiers** do nothing but copy. These are the first genes: copiers with a job. | Simplified on purpose (three jobs instead of real ribozyme chemistry). Grounded in the chemoton and RNA world idea. |
| Each copy is made from blocks inside the bubble; doing a job costs the copier copying speed (a skin-maker copies a little slower than a plain copier). | Grounded: the cost of catalysis vs replication is the core of the parasite problem. |
| A copy can come out wrong (mutation): it turns into another kind, most often a plain copier, which then behaves as a **parasite**: copies fastest, does nothing. | Grounded (error threshold, Eigen 1971). |
| A bubble grows from oils it takes from the water **and oils its own skin-makers make**; it splits when its skin has doubled, and **daughters get copiers at random** (each copy goes to one side or the other). | Grounded (Zhu and Szostak 2009; stochastic corrector). Already in Early Earth except the self-made oils. |
| **Closure meter** per bubble: share of its skin and blocks made inside (by its own genes) vs taken from the water, 0 to 1. | Grounded as a graded measure of organizational closure (Moreno and Mossio 2015); our numbers are a teaching proxy. |
| Option `linked`: copiers join into one chain (a first chromosome), so a split gives each daughter a full set. Costs slower copying. | Simplified; grounded in Maynard Smith and Szathmáry 1993. Used only in a lab. |

**Expected behaviour, as checkable claims** (several seeds, about 20,000 steps):
1. **Self-made skin frees protocells from the vents.** With genes on, bubbles that carry skin-makers are found more than 10 map cells from any vent; in the twin without skin-makers, nearly all bubbles stay within 5 map cells of a vent, where free oils are.
2. **Closure rises.** The average closure of living bubbles rises from about 0 to above 0.4.
3. **Skins keep parasites down.** Inside bubbles, parasites stay below 30% of copiers on average; lineages where parasites take over stop growing and burst.
4. **Reproduction becomes reliable.** The share of daughters born with no working gene falls over time; with `linked` on, it falls further.

If any claim fails, the README reports it with seeds and steps (PLAYBOOK, Honesty).

## Stage 3. The lab: "Break the skin"

Twin coasts, same seed. In the twin, copiers leak through the bubble's skin as freely as blocks do, so every gene's job helps any bubble nearby.

- **Read at the level of molecules:** parasites take over the water and the bubbles.
- **Read at the level of protocells:** without kept genes, self-made skins disappear, bubbles shrink back to the vents and closure falls toward 0.

The lesson: a gene's job pays only when a boundary keeps the benefit at home. Genes and skin make each other possible; that is closure.

A second, smaller lab option: **switch off skin-makers** in the twin (no self-made skin) and watch protocells stay tied to the vents.

## Stage 4. Placement

**On the history timeline.**
- `t`: 4.3e9, `until`: 4.2e9, `when`: "before about 4.2 billion years ago, before the last common ancestor of all life".
- `place` and `evidence`: no fossil of a gene exists. The date comes from LUCA, which already had a full genetic system (Moody et al. 2024, gene-tree dating, about 4.2 billion years ago, range 4.09 to 4.33, **debated**), and from liquid oceans by 4.4 billion years ago (zircons from Jack Hills, Western Australia; Wilde et al. 2001, **well supported**).
- **Timeline order needs one decision.** Early Earth is now at 4.0 billion years and First cells at 3.8. To keep the order, I propose moving Early Earth to **about 4.4 billion years ago** (first oceans, Wilde 2001), putting First genes at 4.3 to 4.2, and keeping First cells at 3.8 (oldest, debated traces of life, Isua, Greenland). The alternative is to keep Early Earth at 4.0 and put First genes at "about 4 billion years ago, range 4.4 to 3.8, debated".

**Shelf folder.** `environments/first-genes/` (page reuses `environments/early-earth/app.js` with a stage setting, as Colonies reuses First cells), plus `lib/i18n/es/first-genes.js`.

**Engine and Gaia era.** Builds on `lib/chemistry.js` (opt-in `genes`) on the `lib/earth.js` coast. New Gaia era `genes` between `earth` and `cells` in `lib/gaia.js`, a World Viewer chapter between Early Earth and First cells, an entry in `SYSTEMS`, a stop in `LADDER` and a chapter in `PAGES`.

**Hand-up (later, not in this first version).** As with Graduation (PR #19), the protocells could hand their gene mix to the First cells chapter, so first cells start from what evolved here.

## Reproduction across Gaia

Rodrigo noted we have not looked at reproduction. Every chapter already reproduces, but each in its own way, and no page shows them together:

| Chapter | How it reproduces now | Real counterpart |
|---|---|---|
| Early Earth | Bubbles split when big, contents shared at random | Vesicle growth and division (Zhu and Szostak 2009) |
| **First genes (new)** | Same, now with genes that remake the skin, so heredity starts to matter | Protocells, stochastic corrector |
| First cells | Binary fission with mutated genes | Bacteria and archaea |
| Colonies | Daughters stay stuck to their mother | Snowflake yeast, algae under predation (Boraas 1998) |
| Bodies, Nerve nets | Germ cells release a single seed cell (a one-cell bottleneck) | Animals and plants start from one cell |
| Brains, Ecosystems | Creatures breed alone, copies with mutation | Clonal reproduction |

**Missing: sex** (two parents mixing genes). Its oldest clear fossil is the red alga *Bangiomorpha*, 1.047 billion years ago (Gibson et al. 2018, **well supported**), and meiosis genes trace back to the ancestor of all eukaryotes (**well supported**). Why sex is worth its cost is **debated** (clearing bad mutations, keeping up with parasites, the Red Queen).

Proposal: **in this first version**, the First genes page explains reproduction at its own level and adds a short "How Gaia reproduces" section (the table above). **As a second step**, after this one is confirmed and built, a separate proposal for an opt-in `sex` setting with a "clones vs sex" lab. My recommendation is the Bodies era (germ cells of two bodies fuse), because that is where it happened in time; the alternative is the Brains creatures, which is simpler to build.

## Draft References

Studies and papers
- Joyce, G. F. and Szostak, J. W. (2018). Protocells and RNA self-replication. *Cold Spring Harbor Perspectives in Biology* 10: a034801. https://doi.org/10.1101/cshperspect.a034801. The overall picture of first genes in protocells. **debated** (RNA world).
- Gánti, T. (1971; English ed. 2003). *The Principles of Life*. Oxford University Press. https://doi.org/10.1093/acprof:oso/9780198507260.001.0001. The chemoton: metabolism, template and membrane coupled. **well supported** as a model.
- Varela, F. J., Maturana, H. R. and Uribe, R. (1974). Autopoiesis: the organization of living systems, its characterization and a model. *BioSystems* 5: 187–196. https://doi.org/10.1016/0303-2647(74)90031-8. The original autopoiesis model. **debated** as a definition of life.
- Moreno, A. and Mossio, M. (2015). *Biological Autonomy: A Philosophical and Theoretical Enquiry*. Springer. https://doi.org/10.1007/978-94-017-9837-2. Closure as a graded measure (the closure meter). **debated**.
- Szathmáry, E. and Demeter, L. (1987). Group selection of early replicators and the origin of life. *Journal of Theoretical Biology* 128: 463–486. https://doi.org/10.1016/S0022-5193(87)80191-1. Random sharing at division keeps cooperative genes. **well supported** (model).
- Eigen, M. (1971). Selforganization of matter and the evolution of biological macromolecules. *Naturwissenschaften* 58: 465–523. https://doi.org/10.1007/BF00623322. Copying errors and the error threshold; parasites. **well supported**.
- Takeuchi, N. and Hogeweg, P. (2009). Multilevel selection in models of prebiotic evolution II. *PLoS Computational Biology* 5: e1000542. https://doi.org/10.1371/journal.pcbi.1000542. Compartments vs parasites; closest model to ours. **well supported** (model).
- Bansho, Y., Furubayashi, T., Ichihashi, N. and Yomo, T. (2016). Host–parasite oscillation dynamics and evolution in a compartmentalized RNA replication system. *PNAS* 113: 4045–4050. https://doi.org/10.1073/pnas.1524404113. Compartments keep RNA replicators alive against parasites. **well supported**.
- Mizuuchi, R., Furubayashi, T. and Ichihashi, N. (2022). Evolutionary transition from a single RNA replicator to a multiple replicator network. *Nature Communications* 13: 1460. https://doi.org/10.1038/s41467-022-29113-x. One replicator diversifies into hosts and parasites in compartments. **well supported**.
- Zhu, T. F. and Szostak, J. W. (2009). Coupled growth and division of model protocell membranes. *Journal of the American Chemical Society* 131: 5705–5713. https://doi.org/10.1021/ja900919c. Protocells grow, divide and pass RNA to daughters. **well supported**.
- Chen, I. A., Roberts, R. W. and Szostak, J. W. (2004). The emergence of competition between model protocells. *Science* 305: 1474–1476. https://doi.org/10.1126/science.1100757. Bubbles with more RNA grow faster (already used in Early Earth). **well supported**.
- Maynard Smith, J. and Szathmáry, E. (1993). The origin of chromosomes I. Selection for linkage. *Journal of Theoretical Biology* 164: 437–446. https://doi.org/10.1006/jtbi.1993.1165. The `linked` lab option. **well supported** (theory).
- Moody, E. R. R. et al. (2024). The nature of the last universal common ancestor and its impact on the early Earth system. *Nature Ecology & Evolution* 8: 1654–1666. https://doi.org/10.1038/s41559-024-02461-1. LUCA's age and genome size, used for the date. **debated**.
- Wilde, S. A., Valley, J. W., Peck, W. H. and Graham, C. M. (2001). Evidence from detrital zircons for the existence of continental crust and oceans on the Earth 4.4 Gyr ago. *Nature* 409: 175–178. https://doi.org/10.1038/35051550. Oceans by 4.4 billion years ago (Early Earth date). **well supported**.
- Gibson, T. M. et al. (2018). Precise age of *Bangiomorpha pubescens* dates the origin of eukaryotic photosynthesis. *Geology* 46: 135–138. https://doi.org/10.1130/G39829.1. Oldest fossil evidence of sex, for the reproduction section. **well supported**.
- Rider (2024), on organizational closure, Cambridge University Press: https://www.cambridge.org/core/product/66F5B26F146D1DF12CB1B3019B50734A (author and title to be checked; found via `plans/systems-theory-today.md`). Critique and defence of closure. **debated**.

Books
- Maynard Smith, J. and Szathmáry, E. (1995). *The Major Transitions in Evolution*. Oxford University Press. Genes in compartments and the DNA–protein division of labour as major transitions. **well supported**.
- Lane, N. (2022). *Transformer: The Deep Chemistry of Life and Death*. Profile Books. The vent, metabolism-first alternative. **debated**.

Simulations we took inspiration from
- Ray, T. (1991). Tierra. https://tomray.me/tierra/. Parasites appear among digital self-copiers; we use chemistry and skins instead of code.
- McMullin, B. (2004). Thirty years of computational autopoiesis: a review. *Artificial Life* 10: 277–295. https://doi.org/10.1162/1064546041255548. The self-repairing membrane model; we add genes and evolution.
- Hutton, T. J. (2002). Evolvable self-replicating molecules in an artificial chemistry. *Artificial Life* 8: 341–356. https://doi.org/10.1162/106454602321202417. Squirm3; we place the idea on the timeline and hand protocells to the next chapter.

All links and details to be re-checked on the date the page is written.

## Decided

| Date | Decision |
|---|---|
| 2026-10-17 | Rodrigo asked for a genes milestone, reproduction and an autopoiesis module, built inside Gaia. |
| 2026-10-17 | Proposed: one chapter, First genes, that carries all three (genes as copiers with a job, protocell reproduction, closure meter). Sex as a separate second step. **Waiting for confirmation.** |
| pending | Move Early Earth to about 4.4 billion years ago, or keep it at 4.0 and give First genes a debated range. |
| pending | Sex later in Bodies (recommended) or in Brains creatures. |
