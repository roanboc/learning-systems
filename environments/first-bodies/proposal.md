# Proposal: two parents in the Bodies chapter (sex)

Status: confirmed 2026-10-20 (option 2, show the paradox) and built. Results are in [README.md](README.md).

## 1. Foundation

- **Phenomenon.** Sexual reproduction: a new body starts from one cell that mixes genes from two parents. Oldest fossil evidence is *Bangiomorpha pubescens*, a red alga with separate spore-making and gamete-making stages, about 1.047 billion years ago (Gibson et al. 2018). Sex was already present in the last common ancestor of eukaryotes (Speijer, Lukeš and Eliáš 2015).
- **Systems idea.** Recombination as a population-level repair: clones can only pile up harmful mutations (Muller's ratchet), while two parents can produce offspring with fewer broken genes than either. Against that is the cost of sex: you need a partner, and only half your genes reach each seed. Why sex is so common is still **debated** (Otto 2009, "the evolutionary enigma of sex").
- **Level and time.** Bodies (multicellular), about 1.05 billion years ago, between First cells/Colonies and Nerve nets.
- **Similar simulations.** Classic Muller's-ratchet and Felsenstein-style models are abstract genomes with no space. Our angle: sex inside a spatial world where bodies must find each other's germ cells.

## 2. Mechanism table (prototype)

| Rule | Setting | Grounded or simplified |
|---|---|---|
| A seed takes each gene from its own germ cell or a partner's germ cell in another body nearby, at random | `sex`, `mateRange` | Free recombination: simplified (no chromosomes, no linkage) |
| No partner in reach, no seed | `sex` | Grounded: the cost of finding a mate |
| Each division can break one of 10 genes for good; each broken gene raises upkeep 15% | `harm`, `harmCost`, `loci` | Muller 1964; simplified to on/off genes |
| New bodies only from seeds (no loose daughters, no fragments) | `seedsOnly` | Simplified: makes the seed the only bottleneck |
| Bodies age and die; germ cells release seeds more often | `bodyLife`, `seedRate` | Simplified, to get more body generations |

## 3. What the prototype showed (seeds 1–3, Bodies stage)

| Variant | Two-parent seeds | Broken genes per cell, clones vs two parents | Verdict |
|---|---|---|---|
| As today, harm 0.05, 6,000 steps | 11–26 matings against about 6,000 births | 0.15–0.21 vs 0.23–0.38 | Sex barely runs: most new bodies come from loose daughters and fragments |
| Seeds only, harm 0.05 | 26–31 matings | 0.09–0.22 vs 0.13–0.22 | No difference |
| Seeds only, harm 0.2 | 20–58 matings | 0.52–0.87 vs 0.67–1.01 | No difference; only 13–20 cell generations |
| Bodies die at 1,200 steps, harm 0.2, 8,000 steps | 28–39 matings | ratchet clicks in clones (up to 3 broken genes), two parents just as bad; populations crash to 1–30 bodies and one sex world died out | Partners too rare |

With the prototype off, Early Earth, First cells, Colonies, Bodies, Nerve nets and Gaia Ecosystems give identical results (fixed-seed check).

**Why it fails:** two germ cells of different bodies are rarely within reach, so sex is mostly its cost. The benefit of sex needs many matings over many generations.

## 4. Options

1. **Gametes in the water (recommended).** Germ cells release small gametes that drift with the currents and fuse when two from different bodies meet, as many algae and corals still do (broadcast spawning). Matings become common without bodies having to touch. Then rerun the comparison. Risk: still no clear benefit, in which case we fall back to option 2.
2. **Show the paradox of sex.** Keep the prototype as is and build the page around the open question: in this world, clones do as well or better, which is the real puzzle biologists still argue about. Honest, but less satisfying.
3. **Leave sex out of Bodies** and move it to the Ecosystems creatures, which reproduce as whole animals with many generations. Breaks the timeline decision (sex in Bodies at about 1.05 billion years ago).

## 4b. The lab (any option)

Twin worlds: **Clones** and **Two parents**, both with harmful mutations. Read: broken genes per cell (cells), share of bodies with no broken genes (bodies), number of bodies (population).

## 5. Placement

- Timeline: within the Bodies chapter, `t` 1.047e9, "about 1.05 billion years ago", place: Hunting Formation, Somerset Island, Arctic Canada; evidence: *Bangiomorpha* fossils, dated by Re-Os (Gibson et al. 2018).
- Engine: `lib/life.js` opt-in settings; page and lab in `environments/first-bodies/`.

## Draft References (to verify before building)

- Gibson, T. M. et al. 2018. Precise age of *Bangiomorpha pubescens* dates the origin of eukaryotic photosynthesis. *Geology* 46(2): 135–138. doi:10.1130/G39829.1. Date of the oldest sexual fossil. **well supported**
- Butterfield, N. J. 2000. *Bangiomorpha pubescens* n. gen., n. sp. *Paleobiology* 26(3): 386–404. The fossil and its sexual life cycle. **well supported**
- Speijer, D., Lukeš, J. and Eliáš, M. 2015. Sex is a ubiquitous, ancient, and inherent attribute of eukaryotic life. *PNAS* 112(29): 8827–8834. Sex in the last common ancestor of eukaryotes. **well supported**
- Muller, H. J. 1964. The relation of recombination to mutational advance. *Mutation Research* 1: 2–9. Muller's ratchet. **well supported** (model)
- Felsenstein, J. 1974. The evolutionary advantage of recombination. *Genetics* 78: 737–756. **well supported** (model)
- Kondrashov, A. S. 1988. Deleterious mutations and the evolution of sexual reproduction. *Nature* 336: 435–440. **debated**
- Otto, S. P. 2009. The evolutionary enigma of sex. *American Naturalist* 174: S1–S14. Why sex persists is still open. **debated**
- McDonald, M. J., Rice, D. P. and Desai, M. M. 2016. Sex speeds adaptation by altering the dynamics of molecular evolution. *Nature* 531: 233–236. Experimental evidence in yeast. **well supported**
- Maynard Smith, J. 1978. *The Evolution of Sex*. Cambridge University Press. The cost of sex.

## Decided

| Date | Decision |
|---|---|
| 2026-10-17 | Rodrigo: add sex later, in the Bodies chapter (First genes thread) |
| 2026-10-20 | Rodrigo chose option 2: show the paradox of sex. Built with `sex`, `harm` and `seedsOnly`; `bodyLife` and `seedRate` were left out (they crashed populations) |
