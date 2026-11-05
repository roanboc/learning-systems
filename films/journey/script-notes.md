## How the film is made

- **Structure.** After an opening question, each milestone starts with a drawn animation of what happened on Earth, then hands over to the live simulation and its result, and ends on an open question with a fact. The last chapter is about local rules and emergence.
- **Live footage.** Chapters 1, 2, 3, 5 and 6 run the site's own engines in the page (`films/footage.js`), with seed 3 as in the World Viewer. Nothing is pre-recorded, so the film plays the same way every time and every picture can be checked on the simulation pages. A red dot and *Live simulation* mark it.
- **Real charts.** The motor and sticking gene charts are runs of the same worlds (`films/tools/gene-curves.js`, seed 3, 12,000 steps), stored in `data.js`.
- **Drawn scenes.** The animations, the planet, the clock and the levels are drawings (marked *Drawing* with their date) that place each moment in time. The clock squeezes 4.54 billion years into 24 hours: one hour is about 189 million years.

## Dates on the clock

| Moment | Years ago | On the clock | Claim |
|---|---|---|---|
| Earth forms | 4.54 billion | 0:00 | well supported (Dalrymple 2001) |
| Oceans | about 4.4 billion | before 1:00 | debated (zircons, Wilde et al. 2001) |
| A sea with no life (chapter 1) | about 4.0 billion | 2:51 | as on the Early Earth page |
| First cells | 3.8 to 3.5 billion | 4:00 to 5:30 | debated for the oldest; 3.5 billion well supported (stromatolites, Pilbara) |
| Great Oxidation | 2.4 billion | 11:19 | well supported (Lyons et al. 2014) |
| Snowball Earth | 720 to 635 million | 20:12 to 20:38 | well supported that ice reached the tropics; how complete is debated (Hoffman et al. 2017) |
| First large bodies | about 575 million | 20:57 | well supported (Ediacaran biota) |
| Oldest muscle fibres | 560 million | 21:02 | well supported (Haootia, Liu et al. 2014) |
| Cambrian animals | 540 to 520 million | 21:09 to 21:15 | well supported |
| Humans | about 300,000 | last 6 seconds | well supported (Jebel Irhoud, Hublin et al. 2017) |

## Results quoted

- Motor gene: average 0.01 at the start, about 0.08 from generation 9 on (First cells README: 0.07 to 0.10 on seeds 3 to 5).
- Sticking gene with predators: 0.075 at the start, up to 0.35 by step 9,000, 0.25 at step 12,000 on seed 3 (the chart shows the whole run, dips included).
- Algae evolving clumps under predators: Boraas et al. 1998 (Chlorella), Herron et al. 2019 (Chlamydomonas). Well supported.
- Hunters emptying the sea and starving: the Gaia Ecosystems tuning (coast width 600); prey and hunters coexist on 3 of 4 seeds at width 900.
