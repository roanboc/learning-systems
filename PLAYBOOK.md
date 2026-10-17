# Playbook: lessons from the simulations so far

Short lessons, each with the product it came from. Add one when something surprises you. The stages and rules are in [AGENTS.md](AGENTS.md).

## Building on one world

- **Opt-in, never edit defaults.** New behaviour arrives as a setting that is off by default, and a fixed-seed script shows the old worlds are identical (Tissue Lab hooks, Forager `coast`, `founders`).
- **Hand organisms up, don't evolve everything in one run.** Going from chemistry to brains in one run would take far too long. Chapters hand real organisms to the next level instead: Nerve nets bodies graduate into the first Brains creatures (Gaia, PR #19).
- **Share a rule without changing results.** `lib/cell.js` multiplies each level's own amounts by shared knobs that default to 1; multiplying by 1 is exact, so every world stayed identical (Gaia G3).
- **Scale is part of the model.** Hunters died out on the coast at 600 units wide because too few prey fit: they boomed, emptied the sea and starved. A wider world plus a shallow-water refuge gave coexistence (PR #17). Check population sizes before tuning behaviour.

## Getting emergence to show

- **Always compare with a twin world.** Neutral genes drift upward from zero, so a rising gene proves nothing without a twin where it cannot help (First cells).
- **A behaviour can be useless until the world lets it pay.** Steering toward food did nothing while cells felt the full current; at 25% drift it evolved (First cells).
- **Selection is weak when food caps the population.** Specialisation and nerve genes rose only modestly; say so rather than over-tune (Colonies, Nerve nets).
- **Night crashes look like a bug.** Boom and bust at night came from food running out; low upkeep and a prey-scaled predator cap fixed it (cell chapters).
- **Seaweed starved until its light and nutrient thresholds matched the coast** (0.15, not 0.5 and 0.3; Gaia PR #16).

## Honesty

- **Report what failed.** README results list the variants that did not work, with seeds and steps.
- **Few seeds means an early sign.** Say "early sign" for results from three or four seeds.
- **Don't rebuild arbitrary rules.** Rodrigo's 2009 and 2016 neurogenesis models are inspiration only; rules come from current neurobiology.
- **Map layers need real data.** On the home planet, layers not based on real data (a guessed "Life today") were removed; a simplified map says so (PR #18).
- **Name things for what they are.** Single cells have motor proteins, not muscle; muscle-like cells belong to bodies.

## Pages

- Every page ends with its References section (AGENTS.md).
- Translated text matches whole elements: a creature panel with an extra line needs its own Spanish template (`lib/i18n.js`).
- A chapter that grows another world first (Brains grows Nerve nets bodies) costs seconds on load; reuse the world the visitor already opened.
