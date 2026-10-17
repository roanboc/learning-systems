# How we build simulations here

Learning Systems is one world, Gaia, seen at different levels of complexity and at different moments in the history of life. Every new simulation is a new scenario in that world, not a separate product with its own rules. These stages and rules apply to any person or agent adding one. Lessons from earlier products are in [PLAYBOOK.md](PLAYBOOK.md).

## Rules that always apply

1. **Build on the same world.** Reuse `lib/earth.js`, `lib/chemistry.js`, `lib/life.js`, `lib/gaia.js` and the Forager engine. New behaviour is an opt-in setting or a new era, never a copy of an engine. Defaults stay unchanged, and a fixed-seed check proves existing worlds give identical results.
2. **Place it on the history timeline.** Every new scenario (a product, a World Viewer chapter, a preset or a lab world) says when in the history of life it happens, with the evidence for that date. See "Placing it on the timeline" below.
3. **End with references.** Every simulation page ends with a **References** section listing the studies, papers, books and web pages it draws on. See "The References section" below.
4. **Label every claim.** Each scientific claim is **well supported**, **debated** or **speculative**, with its source and the date it was checked. Check against current research (see "The state of the art" below), not one author.
5. **Keep populations apart.** Each world is its own population, so worlds can be compared side by side.
6. **Engines have no DOM.** They run headless in Node, so results can be checked with fixed seeds.
7. **Two languages.** Every visible English text gets its Spanish line in `lib/i18n/es/`.
8. **Plain JS and canvas, no build step.** Code shared between products lives in `lib/`.
9. **Rodrigo confirms before code.** A proposal comes first (stage 5); settings changes are proposed, not made.

## Stages

1. **Foundation.** Name the real phenomenon and its best sources: a review or textbook, plus the classic model if one exists. Say which systems idea it teaches and where it sits in level (chemistry, cells, bodies, nervous systems, ecosystems, planet, societies) and in time. If it is a field Rodrigo knows, ask for his framework or experience.
   - **Evaluate against the state of the art.** Check the idea against current research: autonomy and closure, basal cognition, active inference, complexity science, Earth system science, social systems (Ostrom, Flack). Search for newer work before relying on a claim. If the closest finding is debated, the simulation shows it as an open question.
   - **Look for similar public simulations.** Reference them and choose a different angle rather than copying (for example, Verdania covers macroeconomics; we focus on cooperation and competition).
2. **Mechanism table.** List the local rules and, for each, whether it is grounded in science or simplified on purpose. Write the emergent behaviour we expect as checkable claims, for example "temperature stays within 5 degrees while the sun brightens by 40%".
3. **The lab.** One mechanism to break in a twin world, and the effect to read at another level.
4. **Placement.** Its place on the timeline (rule 2), its shelf folder, and which existing engine and Gaia era it builds on.
5. **Proposal and confirmation.** A `proposal.md` in the product folder with stages 1 to 4, the draft References list and a *Decided* table with dates. Rodrigo confirms before code.
6. **Build and check.**
   - Run headless with fixed seeds and several seeds, showing that the expected behaviour really emerges and that the broken twin really differs.
   - Run the identity check for existing worlds.
   - Test the page in English and Spanish, on a phone, by keyboard and in dark mode.
   - Write the page's References section and the README's results, including what failed.
7. **Learn.** New lessons go into [PLAYBOOK.md](PLAYBOOK.md).

## Placing it on the timeline

Every scenario answers: when did this first happen on Earth, and how do we know?

- `t` (years ago) and `when` (plain words, such as "about 540 million years ago") come from the evidence. For something that arose slowly, give the start in `t` and when it was in place in `until`.
- `place` and `evidence` name where the oldest evidence was found and what it is (a fossil, a rock, a living example), with the reference.
- For a scenario about today's world, such as a commons or an organization, use when the phenomenon first appeared (for example the first farming villages, about 10,000 years ago) and say why.
- If the date is debated, give the range and say so.

Where it goes:

| What you add | Where the time goes |
|---|---|
| A product page | An entry in `SYSTEMS` (`lib/system-catalogue.js`) with `t`, `when`, `place`, `evidence`; a stop in `LADDER` (`home.js`); its chapter in `PAGES` (`lib/nav.js`) |
| A World Viewer chapter | A chapter in `world/viewer.js` with its `era`, in time order; a Gaia era in `lib/gaia.js` if it lives in the shared world |
| A preset or lab world | Its era in the preset's description and in its lab text (`labs.js`), and the matching chapter |

The timeline must stay in order: check that the new entry sits between its neighbours in `SYSTEMS`, the World Viewer and the Deep Dive.

## The References section

The last section of every simulation page, also kept in the product README. One list, grouped as needed (studies and papers, books, web pages and simulations, data):

- Each entry gives authors, year, title, where it was published, and a link (a DOI where there is one).
- Each entry says in a few words what it supports in this simulation, for example "the rule that cells stick together under predation".
- Entries carry the claim label (**well supported**, **debated**, **speculative**) when they back a scientific claim.
- Data sources give their licence and credit, for example "PB2002, Bird 2003, ODC-By".
- Simulations and pages we took inspiration from are listed too, with what we did differently.
- The heading and notes are translated; titles of works stay in their original language.

## The state of the art

When a claim matters, search for the newest review before relying on an older source. The project's notes on where current research stands (`plans/systems-theory-today.md` in the project files) are a starting point, not the last word.
