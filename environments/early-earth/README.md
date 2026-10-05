# Early Earth

Chapter 0 of the timeline of life: a young coast before life. Open `index.html` in a browser. No build step.

## The Earth (`lib/earth.js`)
A shared world meant to host every later chapter (cells, plants, animals). Seen from above, as a grid of cells:
- **Ground:** land along the top, beaches and rock pools at the waterline, deep sea below with a ridge on the floor.
- **Tides:** the sea rises and falls. Water that gets cut off stays behind as tide pools, which dry in the sun.
- **Sun:** a day and night cycle. Light fades with depth.
- **Heat:** the sun warms shallows and land; hot vents on the ridge heat the deep floor.
- **Currents:** slow eddies plus a tidal flow along the coast. Faster in shallow water, still at the shore.
- **Fields:** anything dissolved in the water is a field. Earth carries it with the currents, spreads it, concentrates it when a pool dries and dilutes it when the tide returns. Mass is kept: a dried pool leaves a crust that dissolves again on the next flood.

## The chemistry (`lib/chemistry.js`)
Not real atoms: six made-up molecule kinds with local rules that echo ideas about the origin of life.
- **Raw** molecules fill the sea; vents add more.
- **Energy** carriers are made by sunlight in shallow water and by vent heat.
- **Building blocks** come from raw plus energy, faster when warm.
- **Chains** form when blocks join, mostly in drying pools (wet and dry cycles). Water and strong sunlight break them.
- **Copiers** arise very rarely from two chains and make more of themselves from blocks. They need company: thinly spread, they die out.
- **Oils** are made at the vents. Crowded oils form **bubbles** that trap chains and copiers. Bubbles holding more of them take in oil faster, grow, and split, sharing their contents at random. Bubble lineages that keep copiers spread.

The **field journal** notes firsts and turning points (first chains and where, copiers arising and dying out, first bubble, first split, heredity, long lineages). Click an entry to fly to the spot.

## Using it
- Scroll or pinch to zoom, drag to move. Zoom in far enough and the water turns into individual molecules.
- **Show:** nature, all chemicals, one chemical, sunlight or heat.
- **Click to:** look (a spot or a bubble; bubbles can be followed), pour building blocks or oils, seed copiers, open a vent.
- **Add a world** to compare presets side by side with the same seed: no sunlight, no tides, no vents, cooler vents.
- **Guided labs** (or `#lab=tide-pools` in the URL): *Why tide pools?* builds a twin coast with the tides off and walks from the coast to a pool, down to molecules and back up to copiers. Each step says what to look at, waits until the world shows it, and says in numbers what happened. Lab data in `labs.js`, engine in `lib/learn.js`.

## Known limits
- Bubble numbers are capped (`maxBubbles`) to keep the page fast.
- The simulation runs on the page's main thread. Fast-forward trades frame rate for speed.
