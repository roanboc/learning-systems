# Learning Systems

Small simulated worlds for learning how living systems organise themselves: behaviour emerges from local rules, with no global controller. Everything runs in the browser with no build step.

Open `index.html` for the home page, or visit the live site at https://roanboc.github.io/learning-systems/ (deployed from `main` by `.github/workflows/pages.yml`).

## Products

| Shelf | Product | Status |
|---|---|---|
| Start here | [World Viewer](world/) | Timeline of life from chemistry to cells, colonies, bodies, nerve nets, brains and ecosystems; camera and levels; guided story |
| Environments | [Early Earth](environments/early-earth/) | Available (chapter 0, first version) |
| Environments | [First cells](environments/first-cells/) | Available (chapter 1: how cells came to move, with a guided lab) |
| Environments | [Colonies: sharers and cheats](environments/colonies/) | Available (chapter 2: a helper molecule that feeds everyone nearby, and cheats; with a guided lab) |
| Environments | [Bodies: the first muscles](environments/first-bodies/) | Available (chapter 3: contracting cells that beat together, with a guided lab) |
| Environments | [Forager Worlds](environments/forager-worlds/) | Available (W5, tissue brains, bodies of cells) |
| Nervous systems | [Tissue Lab](nervous-systems/tissue-lab/) | Available (first version) |

## Adding a simulation

Follow [AGENTS.md](AGENTS.md): every new scenario is built inside the same world, placed on the history timeline, and its page ends with a References section. Lessons so far are in [PLAYBOOK.md](PLAYBOOK.md). Agents can use the skills in `.claude/skills/` (`new-simulation`, `systems-idea-page`).

## Layout

- `index.html` and `home.js`: the home page. A glowing planet you dive into, level by level, from an ecosystem down to the chemistry life began with; every stop runs the real simulation. The List tab shows every system as a plain list with links to its pages, its guided lab and the history of life.
- `world/`: the World Viewer, one stage for the timeline of life. Each chapter reuses a product's engine.
- `environments/`: worlds that pose the problem (resources, hazards, change).
- `nervous-systems/`: brains as living tissue.
- `labs/`: all guided labs on one page with progress, plus situations to decide ("Make the call").
- `lib/`: code shared across products: `lib/brain.js`, the self-wiring spiking brain; `lib/earth.js`, the shared Earth (land, sea, tides, sun, heat, currents) that every chapter of the timeline of life is meant to live in; `lib/chemistry.js`, the early Earth chemistry; `lib/life.js`, cells, colonies, bodies and nerve nets living in that same Earth; `lib/gaia.js`, Gaia, the one world: it builds any chapter (earth, cells, colonies, bodies, nerves, brains) on the same coast and chemistry, and Nerve nets bodies graduate into the first Brains creatures; `lib/creature-draw.js`, creature shapes drawn from their genes (early-animal body plans: slender fast swimmers, big-headed big brains, flat ribbed bodies without a brain, hunters with grasping arms); `lib/body.js`, a creature's body made of organs and cells in a body fluid (Forager Worlds `body: 'cells'`); `lib/learn.js`, the guided labs panel (each product keeps its own labs in `labs.js`), and `lib/lab-catalogue.js`, the list of every lab, so any page can link to labs elsewhere; `lib/nav.js`, the site bar on every product page (where you are, the previous and next chapter, and a prompt to start that page's guided lab). For the home page: `lib/system-catalogue.js`, every system placed on the planet and in the history of life; `lib/plates.js`, today's tectonic plates (Peter Bird's PB2002 model, 2003, as prepared by Hugo Ahlenius at github.com/fraxen/tectonicplates under the Open Data Commons Attribution License): their edges and what each does, their names and how fast they drift; `lib/planet.js`, land, coasts, currents and heat from below as data; `lib/globe.js`, a globe you can turn and paint with WebGL; `lib/previews.js`, the real engines run small.

## Languages

Every page reads in English or Spanish, switched with EN | ES at the top; the choice is remembered, and `?lang=es` in a link opens a page in Spanish. Pages stay written in English. `lib/i18n.js` translates what they show (HTML, text that scripts add later, a few attributes and text drawn on canvases) from the dictionaries in `lib/i18n/es/`, one per product. When you add or change visible text, add its Spanish to that product's dictionary; open a page with `?lang=es&i18n=debug` and run `I18N.missing()` in the console to list anything left in English.

Each product folder is self-contained except for `lib/`, and its engine has no DOM code, so it also runs headless in Node.
