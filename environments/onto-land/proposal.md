# Proposal: Body plans, from the Cambrian sea onto land

Status: **proposal, waiting for Rodrigo's confirmation** (AGENTS.md stage 5). No code yet.

Asked by Rodrigo on 2026-10-17: "another evolution milestone including more complex creatures, especially shaping as we see creatures with different extremities, extensions and other body parts. Shaping is an interesting development and I guess it was more creative when creatures moved from seas to land."

## The short answer to "was shaping more creative on land?"

Partly. It depends on what "creative" means.

- **New body plans: the sea, not land.** Almost every animal body plan, and the first legs, arms, antennae and fins, appeared in the sea during the Cambrian explosion, about 539 to 515 million years ago (Erwin and Valentine 2013, **well supported**). Groups reach their widest range of shapes early in their history, not late (Hughes, Gerber and Wills 2013, **well supported** as a general pattern). Every animal phylum has sea-living members; very few live only on land (Grosberg, Vermeij and Wainwright 2012, **well supported**).
- **The tools for shaping were ready before land.** The genes that lay out a body from head to tail (Hox genes) and the gene that marks where an outgrowth grows (Distal-less) are shared by fish fins, insect legs, worm paddles and sea-urchin tube feet. Their common ancestor lived in the sea before the Cambrian (Panganiban et al. 1997; Shubin, Tabin and Carroll 2009, **well supported**).
- **Legs began in water.** Tiktaalik (375 million years ago) was a fish with sturdy, wrist-like fins living in shallow water (Daeschler, Shubin and Jenkins 2006). Early four-limbed animals such as Acanthostega had toes but still lived in water (Coates and Clack 1990). Footprints in Poland show four-limbed animals on a tidal flat about 395 million years ago, before Tiktaalik (Niedźwiedzki et al. 2010, **well supported**, with some doubts about who made them). So fins became limbs in the shallows, and land then put them to new use.
- **Crossing to land did not burst the range of limb shapes.** Fish fins just before the transition and the first tetrapod limbs show a similar spread of shapes (Ruta and Wills 2016, **debated**, one study).
- **Where Rodrigo's idea holds: land made more species, and some new kinds of parts.** On land, bodies have to hold themselves up against gravity, breathe air and keep from drying out, so existing parts were rebuilt: fins into weight-bearing legs, gill supports into ear bones, and later, wings (insects about 325 million years ago, then pterosaurs, birds and bats). Land lineages also split into new species faster than sea lineages, which is why most species today live on land (Wiens 2015, **well supported**).

So the sea invented the body plans and the toolkit; land remodelled them and multiplied species. The simulation can show both, and can let the visitor test Rodrigo's idea as an open question.

## Where Gaia stands today

- **Brains** and **Ecosystems** (`environments/forager-worlds/engine.js` with the `coast` setting, eras in `lib/gaia.js`): creatures swim on the `lib/earth.js` coast. Out of water they lose energy (`strandDamage`); shallows are a refuge from hunters (`huntDepth`).
- **Shapes** (`lib/creature-draw.js`, PR #19) are drawing only: speed makes a slender body, brain size a bigger head, hunters get two grasping arms. Shape has no effect on how a creature lives.
- **The gap:** shape is not yet a gene that matters. This milestone makes it one.

## Stage 1. Foundation

**Real phenomenon.** How animal body plans are built from repeated parts (segments and appendages), how those parts diversified in the Cambrian sea, and how fins became legs as animals moved onto land.

**Best sources.** Reviews: Erwin and Valentine 2013 (Cambrian explosion); Carroll, Grenier and Weatherbee 2005 (developmental genes and body plans); Clack 2012 (fins to limbs). Classic model: Dawkins's Biomorphs (1986) for development shaping what evolution can reach, and Karl Sims's evolved virtual creatures (1994) for bodies built from repeated parts.

**Systems idea it teaches.** **Modularity and evolvability**: a body built from repeated modules (segments, limb pairs) can change by copying and varying a module, so evolution explores many shapes quickly (Wagner and Altenberg 1996). And **the environment as a selector of form**: water and land reward different shapes from the same toolkit.

**Level and time.** Bodies and ecosystems, between the Cambrian sea (about 539 million years ago) and the first land animals (about 430 to 375 million years ago).

**Against the state of the art.**

| Claim | Label | Note |
|---|---|---|
| Nearly all animal body plans appeared in the Cambrian sea | **well supported** | Erwin and Valentine 2013. |
| Clades reach high shape disparity early | **well supported** as a pattern | Hughes, Gerber and Wills 2013; exceptions exist. |
| One shared, pre-Cambrian toolkit (Hox, Distal-less) patterns all appendages | **well supported** | "Deep homology", Shubin, Tabin and Carroll 2009; a minority view sees appendages as copies of the main body axis (Minelli 2000). |
| Limbs with digits evolved in water, before animals walked on land | **well supported** | Coates and Clack 1990; Daeschler et al. 2006; Niedźwiedzki et al. 2010. |
| Fin and early limb shapes had similar disparity across the transition | **debated** | One study, Ruta and Wills 2016. |
| Lineages on land diversify faster than in the sea | **well supported** | Wiens 2015, across animal phyla. |
| Moving onto land made shaping "more creative" overall | **debated / speculative** | Holds for species numbers and some new parts (weight-bearing limbs, wings); not for new body plans. Shown on the page as an open question. |
| Modularity makes evolution faster at finding new shapes | **debated** | Strong in models (Wagner and Altenberg 1996; Clune, Mouret and Lipson 2013); hard to measure in real animals. |

**Similar public simulations** (referenced, not copied):
- Karl Sims, *Evolved Virtual Creatures* (1994): bodies from repeated blocks, evolved for swimming and walking. We put shapes in an ecosystem on a real coast with tides and food, instead of a race.
- Dawkins's *Biomorphs* (1986): shapes from a few developmental genes. We make shapes matter for survival.
- Spore (2008): a game where players design creatures. Here nobody designs; shapes evolve.
- Framsticks and "Evolution" by Keiwan Donyagard: walking creatures with evolved bodies. We focus on the sea-to-land story and on comparing worlds.

## Stage 2. Mechanism table

All of this is an opt-in Forager setting `bodyPlan`, off by default. With it off, Brains and Ecosystems give identical results (fixed-seed check). Drawing changes in `lib/creature-draw.js` only apply to creatures that carry the new genes.

| Local rule | Grounded or simplified |
|---|---|
| **A body is a row of segments** (gene `segments`, 3 to 12). Head, trunk and tail regions each have one **appendage type**: none, paddle (fin), leg, or grasping arm. Genes set the type per region, not per segment, and one size for all appendages in a region (`limbLength`, `limbSturdiness`). | Simplified on purpose (three regions instead of real Hox domains). Grounded in segmented body plans and regional identity (Carroll et al. 2005). |
| **Mutation copies modules**: besides small changes, a mutation can add or remove a segment, or switch a region's appendage type. | Grounded: segment duplication and homeotic changes (Hox mutations turn one appendage type into another). The rates are tuning choices. |
| **In water**: a long slender body with paddles swims fastest; legs and arms add drag. Grasping arms at the head make bites succeed more often (hunters, Anomalocaris-like). | Grounded in simple drag physics; numbers simplified. |
| **On the beach and land** (`lib/earth.js` already marks cells as sea, tide pool, beach or land): creatures move only by legs. Ground speed rises with leg length and number, but a body must be held up: if leg sturdiness times leg pairs is below its weight (segments), it drags and barely moves. | Grounded: weight support is the main mechanical problem on land (Clack 2012). Simplified to one support rule. |
| **Drying out**: out of water a creature still loses energy each step, less with a gene `skin` (a tougher, drier skin or a first lung), which costs upkeep in water. | Simplified (one gene for air breathing and water loss). |
| **Food on the shore**: an opt-in shore mat (algae and the first land plants) grows on wet beach cells left by the tide. Only creatures that can reach and walk there eat it. Hunters, needing deep water (`huntDepth`), cannot follow. | Simplified. Grounded in the timing: plants and microbial mats reached land before animals (about 470 million years ago), and early land animals were plant and detritus eaters (millipedes). |
| **Every appendage costs**: upkeep rises with the number and size of appendages. | Grounded (tissue is costly); numbers simplified. |
| **Disparity meter**: the spread of body plans in the population (variance across the shape genes, and the number of distinct region layouts), shown separately for sea and shore creatures. | Grounded as a teaching version of morphological disparity (Hughes et al. 2013). |

**Expected behaviour, as checkable claims** (several seeds, about 20,000 steps):
1. **Shape follows place.** With shore mats on, a shore group evolves with leg pairs, sturdy legs and `skin` above its starting range; sea creatures keep paddles and slender bodies. In the twin with no shore food, average leg sturdiness stays within 10% of its start.
2. **Weight shapes legs.** On the shore, longer bodies carry sturdier legs (positive correlation between `segments` and `limbSturdiness` among shore creatures, absent among sea creatures).
3. **Hunters push prey ashore.** With hunters present, the share of prey living on the shore is higher than without hunters.
4. **The open question, measured.** We report whether disparity rises after creatures reach the shore, compared with the sea-only twin. We do not tune for an answer; either result goes in the README.

If any claim fails, the README reports it with seeds and steps (PLAYBOOK, Honesty).

## Stage 3. The lab: "Keep them in the sea"

Twin coasts, same seed. In the twin, nothing grows on the shore, so there is no reason to leave the water.

- **Read at the level of bodies:** legs, sturdiness and `skin` do not evolve; paddles and slender bodies stay.
- **Read at the level of the ecosystem:** prey have no refuge on the shore, so hunter and prey cycles are sharper; the disparity meter shows whether land added shapes or only moved them.

The lesson: the toolkit was the same; the place selected which shapes paid.

## Stage 4. Placement

**On the history timeline.**
- `t`: 4.3e8, `until`: 3.75e8, `when`: "about 430 to 375 million years ago".
- `place`: Ellesmere Island, Nunavut, Canada (lat 77.0, lon -86.0), where Tiktaalik was found.
- `evidence`: "Tiktaalik, a 375-million-year-old fish with sturdy, wrist-like fins from Ellesmere Island, lived in shallow water. Millipedes had reached land by about 425 million years ago (Pneumodesmus, Scotland), and four-limbed animals left footprints on a tidal flat in Poland about 395 million years ago."
- The Cambrian start of body plans is told inside the chapter (its first scene is the Cambrian sea), not as its own timeline entry, since Brains and Ecosystems already sit at 540 and 520 million years ago.
- Order: after Ecosystems (520 million) and before Tissue Lab (today). The existing event "Animals step onto land" (`EVENTS`, 375 million) becomes this chapter's entry, so it is removed from `EVENTS` to avoid a double.
- The date of the first land animals is **debated** (trackways in Ordovician rocks may be older); the page gives the range.

**Shelf folder.** `environments/onto-land/`, a page that reuses the Forager Worlds page and engine with a preset (as Colonies reuses First cells), plus `lib/i18n/es/onto-land.js`.

**Engine and Gaia era.** Builds on the Forager engine with `coast` (opt-in `bodyPlan`, `shoreMats`) on the `lib/earth.js` coast. New Gaia era `shores` after `ecosystems` in `lib/gaia.js`, starting from Ecosystems creatures. A World Viewer chapter after Ecosystems, an entry in `SYSTEMS`, a stop in `LADDER` and a chapter in `PAGES`.

**Shared code.** Other threads are editing `lib/gaia.js`, `lib/system-catalogue.js` and `world/viewer.js` (First genes, PR #22, adds an era at the start). This chapter adds only at the end of those lists, so the two should merge cleanly.

## Draft References

Studies and papers
- Erwin, D. H. and Valentine, J. W. (2013). *The Cambrian Explosion: The Construction of Animal Biodiversity*. Roberts and Company. Nearly all body plans arose in the Cambrian sea. **well supported**.
- Hughes, M., Gerber, S. and Wills, M. A. (2013). Clades reach highest morphological disparity early in their evolution. *PNAS* 110: 13875–13879. https://doi.org/10.1073/pnas.1302642110. Shape range peaks early; the disparity meter. **well supported**.
- Grosberg, R. K., Vermeij, G. J. and Wainwright, P. C. (2012). Biodiversity in water and on land. *Current Biology* 22: R900–R903. https://doi.org/10.1016/j.cub.2012.09.050. The sea holds more phyla, land more species. **well supported**.
- Wiens, J. J. (2015). Faster diversification on land than sea helps explain global biodiversity patterns among habitats and animal phyla. *Ecology Letters* 18: 1234–1241. https://doi.org/10.1111/ele.12503. Land multiplies species. **well supported**.
- Panganiban, G. et al. (1997). The origin and evolution of animal appendages. *PNAS* 94: 5162–5166. https://doi.org/10.1073/pnas.94.10.5162. One shared gene marks all appendages; appendage types per region. **well supported**.
- Shubin, N., Tabin, C. and Carroll, S. (2009). Deep homology and the origins of evolutionary novelty. *Nature* 457: 818–823. https://doi.org/10.1038/nature07891. The shared toolkit predates land. **well supported**.
- Daeschler, E. B., Shubin, N. H. and Jenkins, F. A. (2006). A Devonian tetrapod-like fish and the evolution of the tetrapod body plan. *Nature* 440: 757–763. https://doi.org/10.1038/nature04639. Tiktaalik; the timeline place. **well supported**.
- Coates, M. I. and Clack, J. A. (1990). Polydactyly in the earliest known tetrapod limbs. *Nature* 347: 66–69. https://doi.org/10.1038/347066a0. Limbs with toes in water-living animals. **well supported**.
- Niedźwiedzki, G., Szrek, P., Narkiewicz, K., Narkiewicz, M. and Ahlberg, P. E. (2010). Tetrapod trackways from the early Middle Devonian period of Poland. *Nature* 463: 43–48. https://doi.org/10.1038/nature08623. Four-limbed animals on a tidal flat about 395 million years ago. **well supported**, trackmaker debated.
- Ruta, M. and Wills, M. A. (2016). Comparable disparity in the appendicular skeleton across the fish–tetrapod transition, and the morphological gap separating fins from limbs. *Palaeontology* 59: 249–267. https://doi.org/10.1111/pala.12227. No burst of limb shapes at the transition. **debated** (one study).
- Wilson, H. M. and Anderson, L. I. (2004). Morphology and taxonomy of Paleozoic millipedes from Scotland. *Journal of Paleontology* 78: 169–184. https://doi.org/10.1666/0022-3360(2004)078<0169:MATOPM>2.0.CO;2. Pneumodesmus, among the oldest land animals. **well supported**.
- Wagner, G. P. and Altenberg, L. (1996). Complex adaptations and the evolution of evolvability. *Evolution* 50: 967–976. https://doi.org/10.1111/j.1558-5646.1996.tb02339.x. Modularity and evolvability, the systems idea. **debated** in real animals.
- Clune, J., Mouret, J.-B. and Lipson, H. (2013). The evolutionary origins of modularity. *Proc. R. Soc. B* 280: 20122863. https://doi.org/10.1098/rspb.2012.2863. Why modular designs evolve. **debated**.

Books
- Clack, J. A. (2012). *Gaining Ground: The Origin and Evolution of Tetrapods*, 2nd ed. Indiana University Press. Fins to limbs, weight support on land. **well supported**.
- Carroll, S. B., Grenier, J. K. and Weatherbee, S. D. (2005). *From DNA to Diversity*, 2nd ed. Blackwell. Hox genes and body-plan regions. **well supported**.
- Shubin, N. (2008). *Your Inner Fish*. Pantheon. A readable account of Tiktaalik and deep homology.

Web pages and simulations we took inspiration from
- Sims, K. (1994). Evolving virtual creatures. *SIGGRAPH '94*, 15–22. https://doi.org/10.1145/192161.192167. Bodies from repeated parts; we add an ecosystem and a coast instead of a race.
- Dawkins, R. (1986). *The Blind Watchmaker* (Biomorphs). Development limits and opens shapes; we make shapes matter for survival.
- Spore (Maxis, 2008). Player-designed creatures; here shapes evolve with no designer.

All links and details to be re-checked on the date the page is written.

## Decided

| Date | Decision |
|---|---|
| 2026-10-17 | Rodrigo asked for a body-shaping milestone with limbs and other body parts, wondering whether shaping was more creative on land. |
| 2026-10-17 | Proposed: one chapter, Onto land, with shape genes that matter (segments, appendage type per region, legs that must hold the body up), shore food, and a "Keep them in the sea" lab. The land question is shown as an open question and measured, not assumed. |
| 2026-10-17 | Confirmed ("Continue all threads"): build it as one chapter, Onto land, chapter 7. |
| 2026-10-17 | Built with changes from this plan: hunters pay nothing for their shape and their arms do nothing (with full body plans they died out in 4 of 5 seeds); only legs may step onto dry ground; drying out is 0.25 per step on this coast. Results and what failed are in the [README](README.md). |
