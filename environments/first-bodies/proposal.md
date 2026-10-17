# Proposal: cheating cells in bodies (cooperators and cheats, level 2)

Thread "cooperative and competitive traits" · 2026-10-17 · for Rodrigo · status: **waiting for confirmation**

Level 1 (Colonies, PR #20) showed cooperation between cells that are free to leave: a helper molecule survives when families stay together. Level 2 asks the same question *inside a body*. Once cells are stuck together for life and only some of them pass on genes, a cell that stops cooperating looks like **cancer**.

## 1. Foundation

**The phenomenon.** A multicellular body is a society of cells that cooperate: they limit their own division, die when told to, take on roles, share resources and keep their surroundings in order. A mutant cell that breaks those rules out-divides its neighbours *inside* the body, so selection between cells favours it. The same cell harms the body, so selection between bodies works against it. Cancer is that conflict (Aktipis et al. 2015, who name five "foundations of multicellularity" that cancer cheats on: proliferation control, cell death, division of labour, resource allocation and care of the surroundings).

**Systems idea.** This is **multilevel selection** and the **suppression of conflict**: a higher-level individual (the body) only holds together if it controls the lower level (its cells). The same idea comes back at every level of the ladder, from societies of cells to societies of people. Level 1 showed kin and spatial structure. Level 2 adds **policing** and the **single-cell bottleneck**.

**Level and time.** Bodies (level 3), chapter 3. It happens as soon as there are bodies.

**State of the art (checked 2026-10-17):**

| Claim | Label | Source |
|---|---|---|
| Cancer is cheating within a cooperative multicellular body, and it occurs across multicellular life, not only in vertebrates | **Well supported** as a framework | Aktipis et al. 2015 (searched for a newer review on 2026-10-17 and found none that replaces it) |
| Bodies that start from one cell have related cells, which reduces conflict between them | **Well supported** | Grosberg & Strathmann 2007; Michod & Roze 2001 |
| Bodies police cells (programmed cell death, limits on division), and that suppresses cheats | **Well supported** in animals; the oldest forms are **debated** | Aktipis et al. 2015; Hanahan & Weinberg 2011 for the mechanisms |
| Separating the germ line (only germ cells pass on genes) reduces cheating, because a cheating body cell dies with its body | **Well supported** as theory, with **debated** details | Buss 1987; Michod & Roze 2001 |
| Even the simplest animals get tumours | **Well supported** for Hydra | Domazet-Lošo et al. 2014 |
| The first bodies (about 600 million years ago and earlier) already had cancer-like cheats | **Speculative**: no fossil evidence; inferred from living relatives | Domazet-Lošo et al. 2014; Aktipis et al. 2015 |

**Similar public simulations.** Many cancer-evolution models study tumours inside one human tissue (agent-based tumour growth). We take a different angle: one rule across the history of life, in the same world where the bodies evolved, with the body's own fitness on the coast as the readout.

## 2. Mechanism table

All of this is opt-in (`cheats: true` in `lib/life.js`, Bodies stage). It is off by default, and a fixed-seed check proves existing worlds are identical. It is the same pattern as `goods` in PR #20.

| Local rule | Grounded or simplified |
|---|---|
| A new gene, **restraint** (0 to 1), drawn only when `cheats` is on, starting at 0.9 to 1. It is copied with mutation at every division, inside a body too (this somatic mutation already happens) | Grounded: somatic mutation. Simplified: one gene stands for many tumour-suppressor genes |
| **Overgrowth:** in a full body (at `bodySize`), a cell normally stops adding stuck daughters. With probability `1 − restraint`, it divides anyway and the daughter stays stuck | Grounded: loss of proliferation control |
| **Hoarding:** a cell gives energy to its neighbours in proportion to `share × restraint`, so a cheat takes and doesn't give | Grounded: resource monopolisation (Aktipis' "resource allocation") |
| **No role:** a cell with restraint below 0.5 refuses a role, stays undifferentiated and keeps dividing | Grounded: loss of differentiation |
| **Costs come from existing rules, not new penalties:** extra cells don't contract (the body slows), they drain shared energy, and a body that grows past 1.5 × `bodySize` breaks apart (rule already in `lib/life.js`) | Emergent, nothing added |
| **Policing** (switch, `police`): a cell whose restraint sits far below its body's average is killed by its neighbours with a small chance per step, and the neighbours pay a small energy cost | Grounded: programmed cell death and immune policing. Simplified: neighbours "know" restraint directly |
| **Bottleneck** (already there): new bodies start from one seed cell released by a germ cell | Grounded: single-cell bottleneck |

**Expected behaviour, as checkable claims** (3 seeds or more, Bodies stage, 12,000 steps):
1. **Within-body selection favours cheats.** Inside bodies, the cells' restraint is lower on average than in the seed cell each body started from.
2. **Between-body selection favours restraint.** Bodies with a low average restraint release fewer seed cells and move more slowly than bodies with a high one.
3. **Without policing, cheats spread.** Population-wide restraint falls, and body speed and seed release drop compared with a twin where restraint is fixed at 1 ("no cheats possible").
4. **Policing holds them back.** With policing on, restraint stays high, and body speed and seed release stay within about 20% of the no-cheats twin.

If claim 1 or 2 fails, the README says so and we tune nothing to force it (PLAYBOOK, Honesty).

## 3. The lab

"**Why don't bodies fall apart?**" Twin coasts: **policing off** versus **policing on**, plus a third coast where restraint is fixed at 1. The broken mechanism is policing. The effect is read at two other levels: the cell (cheat cells pile up inside a body, drawn dark magenta) and the population (number of bodies, seed cells released, body speed). The last step shows the single-cell bottleneck: each new body starts clean from one cell, which is why cancer is not inherited by the next body here.

## 4. Placement

- **Timeline:** Bodies chapter, between about 1.5 billion and 600 million years ago (already `t: 1.5e9, until: 6.0e8` in `SYSTEMS`). The preset and lab text will say that tumours are known in Hydra, a living animal close to the first animal bodies (Domazet-Lošo et al. 2014), and that cancer in the first bodies is inferred, not seen (speculative). No new stop, so the order stays the same.
- **Shelf:** `environments/first-bodies/` (presets in `CONFIGS.bodies` in `first-cells/app.js`, lab in `first-bodies/labs.js`). Engine: `lib/life.js` Bodies stage. Gaia era: `bodies`.
- **Also fixing:** the Colonies page from PR #20 has no References section yet (now required by `AGENTS.md`). I'll add one, and this proposal's page gets its own.

## 5. Decided

| Date | Decision | By |
|---|---|---|
| 2026-10-17 | Level 2 of cooperators and cheats is cheating cells in bodies (cancer), recommended in the thread | Claude, on Rodrigo's "continue" |
| | Confirm the mechanism table and lab, or change them | Rodrigo |

## References (draft)

**Studies and papers**
- Aktipis CA, Boddy AM, Jansen G, Hibner U, Hochberg ME, Maley CC, Wilkinson GS (2015). Cancer across the tree of life: cooperation and cheating in multicellularity. *Philosophical Transactions of the Royal Society B* 370: 20140219. https://doi.org/10.1098/rstb.2014.0219. Supports cancer as cheating, the five foundations, and the rules for overgrowth, hoarding and no role. **Well supported** (framework).
- Domazet-Lošo T, Klimovich A, Anokhin B, Anton-Erxleben F, Hamm MJ, Lange C, Bosch TCG (2014). Naturally occurring tumours in the basal metazoan Hydra. *Nature Communications* 5: 4222. https://doi.org/10.1038/ncomms5222. Supports tumours in a simple animal, which lower its fitness, and the timeline note. **Well supported** (for Hydra).
- Michod RE, Roze D (2001). Cooperation and conflict in the evolution of multicellularity. *Heredity* 86: 1–7. https://doi.org/10.1046/j.1365-2540.2001.00808.x. Supports within- versus between-body selection, the bottleneck and policing. **Well supported** (theory).
- Grosberg RK, Strathmann RR (2007). The evolution of multicellularity: a minor major transition? *Annual Review of Ecology, Evolution, and Systematics* 38: 621–654. https://doi.org/10.1146/annurev.ecolsys.36.102403.114735. Supports the single-cell bottleneck and relatedness. **Well supported**.
- Hanahan D, Weinberg RA (2011). Hallmarks of cancer: the next generation. *Cell* 144: 646–674. https://doi.org/10.1016/j.cell.2011.02.013. Supports which cell controls fail in cancer. **Well supported**.
- Nowak MA (2006). Five rules for the evolution of cooperation. *Science* 314: 1560–1563. https://doi.org/10.1126/science.1133755. Supports the link to level 1 and the multilevel (group) rule. **Well supported**.

**Books**
- Buss LW (1987). *The Evolution of Individuality*. Princeton University Press. Supports germ-line separation as conflict suppression. **Well supported** as theory, with **debated** details.

**Simulations**
- Level 1 of this project: Colonies, sharers and cheats (PR #20). The same helper and cheat idea, between free cells.
