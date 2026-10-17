# Onto land: body plans

Chapter 7 of the timeline of life, about 430 to 375 million years ago. Open `index.html` in a browser. No build step. The plan and the evidence check are in [proposal.md](proposal.md).

Two Gaia coasts side by side (`lib/gaia.js`, era `shores`): the Ecosystems coast with grazers and hunters, where every body is now a row of segments with fins or legs. Left, mats grow on the damp ground the tide uncovers. Right, the twin: the same coast with nothing to eat on land. Grazers are coloured by limb (sand for legs, pale blue for fins).

## The rules

Two opt-in settings of the Forager engine (`environments/forager-worlds/engine.js`), both off by default:

- **`bodyPlan`** adds eight genes (`BODY_PLAN_GENES`): `segments` (3 to 12), `limbs` (0 none, 1 fins, 2 legs, for the whole trunk), `pairs`, `limbLength`, `sturdy`, `arms`, `tail` and `air`. `World.plan(c)` turns them into what the body does:
  - **swim** (speed factor in water): longer bodies and a tail fin are faster, fins add a little thrust, legs add drag (more for longer, sturdier legs).
  - **walk** (speed factor on dry ground): only legs step out of the water. Walking depends on how well the legs hold the body up: `hold = min(1, 1.5 × pairs × sturdy / (segments / 6))`. Fins can only flop back from a pool that dried around them.
  - **upkeep** per step for segments, limbs, arms, tail and air skin.
  - Out of water a grazer loses `strandDamage × (1 − 0.95 × air)` per step.
  - Hunters still need water a metre deep (`huntDepth`). Their shape sets their swimming speed but costs them nothing.
- **`shoreMats`** lets plants grow on dry ground below `shoreHeight` (1.2 m), from sunlight alone. Only legs reach them.

The `shores` era (`Gaia.ORGANISMS.shores`) is the Ecosystems setup with both settings, `shoreMats: 0.6`, `strandDamage: 0.25` (damp ground; 1 on the other coasts) and room for 1,800 plants. Grazers start with fins, no legs.

`lib/creature-draw.js` draws the plan when the genes are there: one line per segment, fins or jointed legs on the trunk (thicker when sturdier), grasping arms when `arms` is above 0.5, and a tail fin.

**Guided lab** ("Keep them in the sea", `labs.js` on `lib/learn.js`): the two coasts, the legs line, how much weight the legs hold on the shore and at sea, then one body up close.

**Identity check.** `node environments/onto-land/identity.js` runs Brains, Ecosystems and three arena worlds with fixed seeds and compares them with fingerprints taken on main before this change. Result: identical.

## What the test runs show (2026-10-17)

`node environments/onto-land/check.js <seed> <A|B|C> 10000` for seeds 1 to 6: A shore mats, B the twin, C mats with no hunters. Means over the last 2,000 steps, range across seeds in brackets.

| Measure | Shore mats | Kept in the sea | Mats, no hunters |
|---|---|---|---|
| Grazers with legs | 27% (2–50%) | 7% (0–18%) | 15% (0–45%) |
| Seeds where legs passed 25% | 4 of 6 | 0 of 6 | 1 of 6 |
| Grazers on the shore | 18% (7–32%) | 6% (5–9%) | 14% (7–31%) |
| How much of the weight legs hold | 20% (1–46%) | 3% (0–8%) | 12% (0–45%) |
| Sturdiness gene (starts near 0.10) | 0.39 | 0.41 | 0.36 |
| Air-skin gene (starts near 0.05) | 0.39 | 0.36 | 0.32 |
| Disparity (starts at 0.04) | 0.40 | 0.36 | 0.41 |
| Different body layouts | 46 | 33 | 37 |
| Seeds with hunters alive at the end | 2 of 6 | 2 of 6 | – |

Per seed:

| Seed | Legs: mats / twin / no hunters | On the shore | Legs hold | Hunters at the end (mats / twin) | Legs passed 30% on day |
|---|---|---|---|---|---|
| 1 | 44% / 3% / 9% | 25% / 5% / 10% | 39% / 1% / 4% | 27 / 33 | 8.5 |
| 2 | 2% / 0% / 4% | 10% / 5% / 10% | 1% / 0% / 3% | 33 / 8 | never |
| 3 | 26% / 6% / 13% | 20% / 6% / 13% | 12% / 3% / 12% | 0 / 0 | 12.2 |
| 4 | 10% / 18% / 0% | 7% / 6% / 7% | 4% / 4% / 0% | 0 / 0 | never |
| 5 | 31% / 11% / 18% | 15% / 9% / 13% | 20% / 8% / 11% | 0 / 0 | 3.5 |
| 6 | 50% / 0% / 45% | 32% / 5% / 31% | 46% / 0% / 45% | 0 / 0 | 3.5 |

Against the proposal's claims:

1. **Shape follows place: held for legs, not for every gene.** With mats, legs passed a quarter of the grazers in 4 of 6 seeds, and none on the twin. On the shore, 59 to 92% of grazers had legs on those seeds. But sturdiness and air skin rose on both coasts alike: they cost little, so they drift. Inside the mats coast, shore grazers had more air skin than sea grazers on 3 seeds (0.65 vs 0.38, 0.46 vs 0.34, 0.66 vs 0.35) and about the same on the others.
2. **Weight shapes legs: not seen.** Among legged shore grazers, segments and sturdiness were not correlated (r from −0.26 to 0.37 where there were enough).
3. **Hunters push prey ashore: early sign only.** Without hunters, legs passed 25% on 1 of 6 seeds instead of 4, but hunters died out on 4 of the 6 mats coasts anyway.
4. **The open question.** Disparity rose about tenfold on all three coasts and was not clearly higher with mats (0.40 vs 0.36; higher on 4 of 6 seeds). The mats coasts held more distinct layouts (46 vs 33), but they also held more grazers (141 vs 106). Land changed which shapes won more than how varied they were, much like Ruta and Wills (2016) for real fins and limbs.

The page and the World Viewer chapter run seed 1, where legs spread and hunters survive. Seed 3, used by the other chapters, loses its hunters.

## What failed on the way

- First version: hunters with full body plans (upkeep, arms that added drag and decided whether a bite landed) died out in 4 of 5 seeds, even with no mats. Hunters now pay nothing for their shape and every bite counts, as in Ecosystems.
- Then hunters kept a fixed body while grazers evolved faster, streamlined bodies (swim factor up to 1.7): hunters died out in 5 of 6 seeds. The swim range was narrowed (up to about 1.3) and hunters now swim by their own evolving shape. They still survive on only 2 of 6 seeds (Ecosystems: 3 of 4).
- With fins allowed to flop onto dry ground, many grazers stranded and died. Only legs may step out of the water now.
- With `strandDamage` 1 and walking that scaled with hold squared, no grazer could profit from the mats. Drying out is 0.25 per step here and walking is gentler (`0.9 × (0.5 + 0.5 × length) × (0.3 + 0.7 × hold)`).
- Mats filled the plant cap (1,200), crowding out seaweed; the cap is 1,800 here.

## Simplified

Three body regions instead of real Hox domains; one gene for a tougher skin and a first lung; mats that need only sunlight; costs and speeds chosen so the trade-offs show; genes are numbers, not DNA. Real early land animals were arthropods first (millipedes) and tetrapods later; here one kind of grazer stands in for both.

## References

Studies and papers
- Hughes, M., Gerber, S. and Wills, M. A. (2013). Clades reach highest morphological disparity early in their evolution. *PNAS* 110: 13875–13879. https://doi.org/10.1073/pnas.1302642110. Shape range peaks early; the disparity measure. **well supported**.
- Grosberg, R. K., Vermeij, G. J. and Wainwright, P. C. (2012). Biodiversity in water and on land. *Current Biology* 22: R900–R903. https://doi.org/10.1016/j.cub.2012.09.050. The sea holds more body plans, land more species. **well supported**.
- Wiens, J. J. (2015). Faster diversification on land than sea helps explain global biodiversity patterns among habitats and animal phyla. *Ecology Letters* 18: 1234–1241. https://doi.org/10.1111/ele.12503. Land multiplies species. **well supported**.
- Panganiban, G. et al. (1997). The origin and evolution of animal appendages. *PNAS* 94: 5162–5166. https://doi.org/10.1073/pnas.94.10.5162. One gene marks all appendages; one limb type per region. **well supported**.
- Shubin, N., Tabin, C. and Carroll, S. (2009). Deep homology and the origins of evolutionary novelty. *Nature* 457: 818–823. https://doi.org/10.1038/nature07891. The shared toolkit predates land. **well supported**.
- Daeschler, E. B., Shubin, N. H. and Jenkins, F. A. (2006). A Devonian tetrapod-like fish and the evolution of the tetrapod body plan. *Nature* 440: 757–763. https://doi.org/10.1038/nature04639. Tiktaalik; the date and place of this chapter. **well supported**.
- Coates, M. I. and Clack, J. A. (1990). Polydactyly in the earliest known tetrapod limbs. *Nature* 347: 66–69. https://doi.org/10.1038/347066a0. Limbs with toes on animals that lived in water. **well supported**.
- Niedźwiedzki, G., Szrek, P., Narkiewicz, K., Narkiewicz, M. and Ahlberg, P. E. (2010). Tetrapod trackways from the early Middle Devonian period of Poland. *Nature* 463: 43–48. https://doi.org/10.1038/nature08623. Four-limbed animals on a tidal flat about 395 million years ago. **well supported**; who made the tracks is debated.
- Ruta, M. and Wills, M. A. (2016). Comparable disparity in the appendicular skeleton across the fish–tetrapod transition, and the morphological gap separating fins from limbs. *Palaeontology* 59: 249–267. https://doi.org/10.1111/pala.12227. No burst of limb shapes at the move to land. **debated** (one study).
- Wilson, H. M. and Anderson, L. I. (2004). Morphology and taxonomy of Paleozoic millipedes from Scotland. *Journal of Paleontology* 78: 169–184. https://doi.org/10.1666/0022-3360(2004)078<0169:MATOPM>2.0.CO;2. Pneumodesmus, among the oldest land animals, about 425 million years ago. **well supported**.
- Wagner, G. P. and Altenberg, L. (1996). Complex adaptations and the evolution of evolvability. *Evolution* 50: 967–976. https://doi.org/10.1111/j.1558-5646.1996.tb02339.x. Modularity and evolvability, the systems idea. **debated** in real animals.
- Clune, J., Mouret, J.-B. and Lipson, H. (2013). The evolutionary origins of modularity. *Proceedings of the Royal Society B* 280: 20122863. https://doi.org/10.1098/rspb.2012.2863. Why modular designs evolve. **debated**.

Books
- Erwin, D. H. and Valentine, J. W. (2013). *The Cambrian Explosion: The Construction of Animal Biodiversity*. Roberts and Company. Nearly all body plans arose in the Cambrian sea. **well supported**.
- Clack, J. A. (2012). *Gaining Ground: The Origin and Evolution of Tetrapods*, 2nd ed. Indiana University Press. Fins to limbs; holding the body up on land. **well supported**.
- Carroll, S. B., Grenier, J. K. and Weatherbee, S. D. (2005). *From DNA to Diversity*, 2nd ed. Blackwell. Hox genes and body regions. **well supported**.
- Shubin, N. (2008). *Your Inner Fish*. Pantheon. A readable account of Tiktaalik and deep homology.

Simulations we took inspiration from
- Sims, K. (1994). Evolving virtual creatures. *SIGGRAPH '94*, 15–22. https://doi.org/10.1145/192161.192167. Bodies built from repeated parts, evolved for swimming and walking. We put the shapes in an ecosystem on a coast with tides and food instead of a race.
- Dawkins, R. (1986). *The Blind Watchmaker* (Biomorphs). A few developmental genes shape what evolution can reach. Here the shapes matter for survival.
- Spore (Maxis, 2008). Creatures designed by the player. Here nobody designs; shapes evolve.

Checked on 2026-10-17.
