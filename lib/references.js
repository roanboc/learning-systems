// References: the studies, papers, books and data each simulation draws on.
//
// Every simulation page ends with a References section (AGENTS.md). A page
// adds an empty element where it goes and loads this file:
//
//   <section data-references="early-earth"></section>
//   <script src=".../lib/references.js"></script>
//
// WORKS holds each work once; PAGES lists which works a page cites. Each work
// says what it supports in the simulation and, for a scientific claim, how
// firm the claim is: 'well supported', 'debated' or 'speculative'. Titles stay
// in their original language; notes are translated (lib/i18n/es/references.js).
// DOIs were checked against Crossref on 2026-10-17.
(function (root) {
  'use strict';

  const WORKS = {
    // ----- Early Earth -----
    chen2004: { group: 'paper', cite: 'Chen, I. A., Roberts, R. W. & Szostak, J. W. (2004). The emergence of competition between model protocells. Science 305, 1474–1476.', doi: '10.1126/science.1100757',
      note: 'Bubbles full of chains pull in oils faster, so they grow and split faster.', label: 'well supported' },
    damer2020: { group: 'paper', cite: 'Damer, B. & Deamer, D. (2020). The hot spring hypothesis for an origin of life. Astrobiology 20, 429–452.', doi: '10.1089/ast.2019.2045',
      note: 'Chains form in pools that dry and wet again.', label: 'debated' },
    martin2008: { group: 'paper', cite: 'Martin, W., Baross, J., Kelley, D. & Russell, M. J. (2008). Hydrothermal vents and the origin of life. Nature Reviews Microbiology 6, 805–814.', doi: '10.1038/nrmicro1991',
      note: 'Warm vents as a source of energy and raw molecules.', label: 'debated' },
    kelley2005: { group: 'paper', cite: 'Kelley, D. S. et al. (2005). A serpentinite-hosted ecosystem: the Lost City hydrothermal field. Science 307, 1428–1434.', doi: '10.1126/science.1102556',
      note: 'Lost City, the vent field that places Early Earth on the map.', label: 'well supported' },
    gilbert1986: { group: 'paper', cite: 'Gilbert, W. (1986). Origin of life: the RNA world. Nature 319, 618.', doi: '10.1038/319618a0',
      note: 'Copiers: molecules that help make more of themselves before cells existed.', label: 'debated' },
    pearson1993: { group: 'paper', cite: 'Pearson, J. E. (1993). Complex patterns in a simple system. Science 261, 189–192.', doi: '10.1126/science.261.5118.189',
      note: 'Self-copying patches that need enough neighbours to spread (Gray-Scott kinetics).', label: 'well supported' },

    // ----- First cells -----
    berg1972: { group: 'paper', cite: 'Berg, H. C. & Brown, D. A. (1972). Chemotaxis in Escherichia coli analysed by three-dimensional tracking. Nature 239, 500–504.', doi: '10.1038/239500a0',
      note: 'Run and tumble: swim straight while food improves, tumble when it does not.', label: 'well supported' },
    purcell1977: { group: 'paper', cite: 'Purcell, E. M. (1977). Life at low Reynolds number. American Journal of Physics 45, 3–11.', doi: '10.1119/1.10903',
      note: 'For a cell, water is thick: it stops the moment its motor stops.', label: 'well supported' },
    jekely2009: { group: 'paper', cite: 'Jékely, G. (2009). Evolution of phototaxis. Philosophical Transactions of the Royal Society B 364, 2795–2808.', doi: '10.1098/rstb.2009.0072',
      note: 'Eyespots: steering toward or away from light.', label: 'well supported' },
    allwood2006: { group: 'paper', cite: 'Allwood, A. C. et al. (2006). Stromatolite reef from the Early Archaean era of Australia. Nature 441, 714–718.', doi: '10.1038/nature04764',
      note: 'Pilbara stromatolites, among the oldest signs of life: the date of the first cells.', label: 'well supported' },

    // ----- Colonies -----
    boraas1998: { group: 'paper', cite: 'Boraas, M. E., Seale, D. B. & Boxhorn, J. E. (1998). Phagotrophy by a flagellate selects for colonial prey: a possible origin of multicellularity. Evolutionary Ecology 12, 153–164.', doi: '10.1023/A:1006527528063',
      note: 'Predators that swallow small cells make clumps evolve.', label: 'well supported' },
    herron2019: { group: 'paper', cite: 'Herron, M. D. et al. (2019). De novo origins of multicellularity in response to predation. Scientific Reports 9, 2328.', doi: '10.1038/s41598-019-39558-8',
      note: 'The same result repeated: clumps evolve within months under predation.', label: 'well supported' },
    hamilton1964: { group: 'paper', cite: 'Hamilton, W. D. (1964). The genetical evolution of social behaviour. I. Journal of Theoretical Biology 7, 1–16.', doi: '10.1016/0022-5193(64)90038-4',
      note: 'Kin selection: sharing spreads when it helps relatives.', label: 'well supported' },
    griffin2004: { group: 'paper', cite: 'Griffin, A. S., West, S. A. & Buckling, A. (2004). Cooperation and competition in pathogenic bacteria. Nature 430, 1024–1027.', doi: '10.1038/nature02744',
      note: 'Sharers win when relatives stay together and lose among strangers.', label: 'well supported' },
    gore2009: { group: 'paper', cite: 'Gore, J., Youk, H. & van Oudenaarden, A. (2009). Snowdrift game dynamics and facultative cheating in yeast. Nature 459, 253–256.', doi: '10.1038/nature07921',
      note: 'Cheats that use shared food without making it.', label: 'well supported' },
    allen2013: { group: 'paper', cite: 'Allen, B., Gore, J. & Nowak, M. A. (2013). Spatial dilemmas of diffusible public goods. eLife 2, e01169.', doi: '10.7554/eLife.01169',
      note: 'Help that stays local keeps sharing alive.', label: 'well supported' },
    reid2000: { group: 'paper', cite: 'Reid, R. P. et al. (2000). The role of microbes in accretion, lamination and early lithification of modern marine stromatolites. Nature 406, 989–992.', doi: '10.1038/35023158',
      note: 'Living stromatolites in the Bahamas: colonies of microbes like the oldest fossils.', label: 'well supported' },

    // ----- Bodies and nerve nets -----
    kirk2005: { group: 'paper', cite: 'Kirk, D. L. (2005). A twelve-step program for evolving multicellularity and a division of labor. BioEssays 27, 299–310.', doi: '10.1002/bies.20197',
      note: 'Outer cells swim, inner germ cells divide (Volvox).', label: 'well supported' },
    michod2007: { group: 'paper', cite: 'Michod, R. E. (2007). Evolution of individuality during the transition from unicellular to multicellular life. PNAS 104, 8613–8618.', doi: '10.1073/pnas.0701489104',
      note: 'Why body cells give up dividing: the germ and body split.', label: 'well supported' },
    strogatz2000: { group: 'paper', cite: 'Strogatz, S. H. (2000). From Kuramoto to Crawford: exploring the onset of synchronization in populations of coupled oscillators. Physica D 143, 1–20.', doi: '10.1016/S0167-2789(00)00094-4',
      note: 'Contracting cells fall into step with their neighbours (Kuramoto model).', label: 'well supported' },
    brunet2017: { group: 'paper', cite: 'Brunet, T. & King, N. (2017). The origin of animal multicellularity and cell differentiation. Developmental Cell 43, 124–140.', doi: '10.1016/j.devcel.2017.09.016',
      note: 'How cells in early animals took on different roles, and when.', label: 'well supported' },
    jekely2015: { group: 'paper', cite: 'Jékely, G., Keijzer, F. & Godfrey-Smith, P. (2015). An option space for early neural evolution. Philosophical Transactions of the Royal Society B 370, 20150181.', doi: '10.1098/rstb.2015.0181',
      note: 'Why the first nerves arose: to coordinate a body\'s contractions.', label: 'debated' },
    bosch2017: { group: 'paper', cite: 'Bosch, T. C. G. et al. (2017). Back to the basics: cnidarians start to fire. Trends in Neurosciences 40, 92–105.', doi: '10.1016/j.tins.2016.11.005',
      note: 'Nerve nets without a centre, as in Hydra.', label: 'well supported' },

    // ----- Brains and ecosystems -----
    izhikevich2007: { group: 'paper', cite: 'Izhikevich, E. M. (2007). Solving the distal reward problem through linkage of STDP and dopamine signaling. Cerebral Cortex 17, 2443–2452.', doi: '10.1093/cercor/bhl152',
      note: 'Learning: spike timing leaves a trace, dopamine turns it into a change.', label: 'well supported' },
    fremaux2016: { group: 'paper', cite: 'Frémaux, N. & Gerstner, W. (2016). Neuromodulated spike-timing-dependent plasticity, and theory of three-factor learning rules. Frontiers in Neural Circuits 9, 85.', doi: '10.3389/fncir.2015.00085',
      note: 'The three-factor learning rule the brains use.', label: 'well supported' },
    butz2013: { group: 'paper', cite: 'Butz, M. & van Ooyen, A. (2013). A simple rule for dendritic spine and axonal bouton formation can account for cortical reorganization after focal retinal lesions. PLoS Computational Biology 9, e1003259.', doi: '10.1371/journal.pcbi.1003259',
      note: 'Neurons grow and remove connections to keep their firing near a target.', label: 'well supported' },
    niven2008: { group: 'paper', cite: 'Niven, J. E. & Laughlin, S. B. (2008). Energy limitation as a selective pressure on the evolution of sensory systems. Journal of Experimental Biology 211, 1792–1804.', doi: '10.1242/jeb.017574',
      note: 'Brains and eyes cost energy, so bigger is not always better.', label: 'well supported' },
    volterra1926: { group: 'paper', cite: 'Volterra, V. (1926). Fluctuations in the abundance of a species considered mathematically. Nature 118, 558–560.', doi: '10.1038/118558a0',
      note: 'Hunters and prey rise and fall in cycles.', label: 'well supported' },
    huffaker1958: { group: 'paper', cite: 'Huffaker, C. B. (1958). Experimental studies on predation: dispersion factors and predator-prey oscillations. Hilgardia 27, 343–383.', doi: '10.3733/hilg.v27n14p343',
      note: 'Hiding places keep prey, and so hunters, from dying out.', label: 'well supported' },
    gause1934: { group: 'book', cite: 'Gause, G. F. (1934). The Struggle for Existence. Williams & Wilkins, Baltimore.',
      note: 'Without a refuge, hunters wipe out their prey and then starve.', label: 'well supported' },
    bobrovskiy2018: { group: 'paper', cite: 'Bobrovskiy, I. et al. (2018). Ancient steroids establish the Ediacaran fossil Dickinsonia as one of the earliest animals. Science 361, 1246–1249.', doi: '10.1126/science.aat7228',
      note: 'Flat ribbed bodies without a brain, like Dickinsonia.', label: 'well supported' },
    evans2020: { group: 'paper', cite: 'Evans, S. D., Hughes, I. V., Gehling, J. G. & Droser, M. L. (2020). Discovery of the oldest bilaterian from the Ediacaran of South Australia. PNAS 117, 7845–7850.', doi: '10.1073/pnas.2001045117',
      note: 'The first animals with a head end, about 555 million years ago.', label: 'well supported' },
    whittington1985: { group: 'paper', cite: 'Whittington, H. B. & Briggs, D. E. G. (1985). The largest Cambrian animal, Anomalocaris, Burgess Shale, British Columbia. Philosophical Transactions of the Royal Society B 309, 569–609.', doi: '10.1098/rstb.1985.0096',
      note: 'Cambrian hunters with grasping arms.', label: 'well supported' },

    // ----- Tissue Lab -----
    bipoo1998: { group: 'paper', cite: 'Bi, G. & Poo, M. (1998). Synaptic modifications in cultured hippocampal neurons: dependence on spike timing, synaptic strength, and postsynaptic cell type. Journal of Neuroscience 18, 10464–10472.', doi: '10.1523/JNEUROSCI.18-24-10464.1998',
      note: 'A synapse strengthens when its input fires just before the cell.', label: 'well supported' },
    stevens2007: { group: 'paper', cite: 'Stevens, B. et al. (2007). The classical complement cascade mediates CNS synapse elimination. Cell 131, 1164–1178.', doi: '10.1016/j.cell.2007.10.036',
      note: 'Unused synapses collect an "eat me" tag.', label: 'well supported' },
    oppenheim1991: { group: 'paper', cite: 'Oppenheim, R. W. (1991). Cell death during development of the nervous system. Annual Review of Neuroscience 14, 453–501.', doi: '10.1146/annurev.ne.14.030191.002321',
      note: 'Many young neurons die when they get too little support.', label: 'well supported' },
    levimontalcini1987: { group: 'paper', cite: 'Levi-Montalcini, R. (1987). The nerve growth factor 35 years later. Science 237, 1154–1162.', doi: '10.1126/science.3306916',
      note: 'Neurons compete for a limited growth factor.', label: 'well supported' },
    lu2005: { group: 'paper', cite: 'Lu, B., Pang, P. T. & Woo, N. H. (2005). The yin and yang of neurotrophin action. Nature Reviews Neuroscience 6, 603–614.', doi: '10.1038/nrn1726',
      note: 'Growth factor released where activity helped a cell fire.', label: 'well supported' },
    attwell2001: { group: 'paper', cite: 'Attwell, D. & Laughlin, S. B. (2001). An energy budget for signaling in the grey matter of the brain. Journal of Cerebral Blood Flow & Metabolism 21, 1133–1145.', doi: '10.1097/00004647-200110000-00001',
      note: 'Living and spiking cost energy.', label: 'well supported' },
    pellerin1994: { group: 'paper', cite: 'Pellerin, L. & Magistretti, P. J. (1994). Glutamate uptake into astrocytes stimulates aerobic glycolysis: a mechanism coupling neuronal activity to glucose utilization. PNAS 91, 10625–10629.', doi: '10.1073/pnas.91.22.10625',
      note: 'Astrocytes pass fuel to busy neurons as lactate.', label: 'debated' },
    chung2013: { group: 'paper', cite: 'Chung, W.-S. et al. (2013). Astrocytes mediate synapse elimination through MEGF10 and MERTK pathways. Nature 504, 394–400.', doi: '10.1038/nature12776',
      note: 'Astrocytes engulf some synapses.', label: 'well supported' },
    schafer2012: { group: 'paper', cite: 'Schafer, D. P. et al. (2012). Microglia sculpt postnatal neural circuits in an activity and complement-dependent manner. Neuron 74, 691–705.', doi: '10.1016/j.neuron.2012.03.026',
      note: 'Microglia remove tagged synapses unless recent use protects them.', label: 'well supported' },
    paolicelli2011: { group: 'paper', cite: 'Paolicelli, R. C. et al. (2011). Synaptic pruning by microglia is necessary for normal brain development. Science 333, 1456–1458.', doi: '10.1126/science.1202529',
      note: 'Pruning by microglia shapes the wiring.', label: 'well supported' },
    tashiro2007: { group: 'paper', cite: 'Tashiro, A., Makino, H. & Gage, F. H. (2007). Experience-specific functional modification of the dentate gyrus through adult neurogenesis: a critical period during an immature stage. Journal of Neuroscience 27, 3252–3259.', doi: '10.1523/JNEUROSCI.4941-06.2007',
      note: 'Newborn neurons are extra excitable for a window, then must fit in.', label: 'well supported' },
    kojima2010: { group: 'paper', cite: 'Kojima, T. et al. (2010). Subventricular zone-derived neural progenitor cells migrate along a blood vessel scaffold toward the post-stroke striatum. Stem Cells 28, 545–554.', doi: '10.1002/stem.306',
      note: 'Newborn neurons travel along blood vessels toward an injury.', label: 'well supported' },
    grade2013: { group: 'paper', cite: 'Grade, S. et al. (2013). Brain-derived neurotrophic factor promotes vasculature-associated migration of neuronal precursors toward the ischemic striatum. PLoS ONE 8, e55039.', doi: '10.1371/journal.pone.0055039',
      note: 'Growth factor guides that journey.', label: 'well supported' },
    kempermann2011: { group: 'book', cite: 'Kempermann, G. (2011). Adult Neurogenesis 2. Oxford University Press.',
      note: 'New neurons in the adult brain; how much this happens in adult humans is still argued.', label: 'debated' },
    schultz1997: { group: 'paper', cite: 'Schultz, W., Dayan, P. & Montague, P. R. (1997). A neural substrate of prediction and reward. Science 275, 1593–1599.', doi: '10.1126/science.275.5306.1593',
      note: 'Dopamine signals surprise: better or worse than expected.', label: 'well supported' },
  };

  const PAGES = {
    'early-earth': ['chen2004', 'damer2020', 'martin2008', 'gilbert1986', 'pearson1993', 'kelley2005'],
    'first-cells': ['berg1972', 'purcell1977', 'jekely2009', 'allwood2006'],
    colonies: ['boraas1998', 'herron2019', 'hamilton1964', 'griffin2004', 'gore2009', 'allen2013', 'reid2000'],
    'first-bodies': ['kirk2005', 'michod2007', 'strogatz2000', 'brunet2017'],
    'forager-worlds': ['izhikevich2007', 'fremaux2016', 'butz2013', 'niven2008', 'volterra1926', 'huffaker1958', 'gause1934', 'bobrovskiy2018', 'evans2020', 'whittington1985'],
    'tissue-lab': ['butz2013', 'bipoo1998', 'stevens2007', 'oppenheim1991', 'levimontalcini1987', 'lu2005', 'attwell2001', 'pellerin1994', 'chung2013', 'schafer2012', 'paolicelli2011', 'tashiro2007', 'kojima2010', 'grade2013', 'kempermann2011'],
    train: ['schultz1997', 'izhikevich2007', 'fremaux2016', 'butz2013'],
    // The World Viewer runs every chapter, so it cites them all, in time order.
    world: ['kelley2005', 'damer2020', 'martin2008', 'chen2004', 'gilbert1986', 'allwood2006', 'berg1972', 'jekely2009', 'reid2000', 'boraas1998', 'hamilton1964', 'griffin2004',
      'kirk2005', 'brunet2017', 'strogatz2000', 'jekely2015', 'bosch2017', 'evans2020', 'bobrovskiy2018', 'izhikevich2007', 'butz2013', 'whittington1985', 'volterra1926', 'huffaker1958'],
  };

  const GROUPS = [['paper', 'Studies and papers'], ['book', 'Books'], ['web', 'Web pages and simulations'], ['data', 'Data']];

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function render(box) {
    const ids = PAGES[box.dataset.references] || [];
    box.classList.add('references');
    box.setAttribute('aria-labelledby', 'references-h');
    box.appendChild(el('h2', null, 'References')).id = 'references-h';
    box.appendChild(el('p', 'ref-intro', 'Each work and what it supports here. Well supported: most researchers agree. Debated: evidence on both sides. Speculative: an idea still to be tested.'));
    for (const [g, name] of GROUPS) {
      const list = ids.map((id) => WORKS[id]).filter((w) => w && w.group === g);
      if (!list.length) continue;
      box.appendChild(el('h3', null, name));
      const ol = box.appendChild(el('ol', 'ref-list'));
      for (const w of list) {
        const li = ol.appendChild(el('li'));
        const cite = li.appendChild(el('div', 'ref-cite', w.cite + ' '));
        if (w.doi || w.url) {
          const a = cite.appendChild(el('a', null, w.doi ? 'doi:' + w.doi : w.url));
          a.href = w.doi ? 'https://doi.org/' + w.doi : w.url;
          a.rel = 'noopener';
        }
        const meta = li.appendChild(el('div', 'ref-meta'));
        if (w.label) meta.appendChild(el('div', 'ref-tag ref-' + w.label.split(' ')[0], w.label));
        meta.appendChild(el('div', 'ref-note', w.note));
      }
    }
  }

  const CSS = `
.references { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 14px; display: grid; gap: 10px; min-width: 0; }
.references h2 { margin: 0; font-size: 18px; }
.references h3 { margin: 6px 0 0; font-size: 14px; }
.references .ref-intro { margin: 0; color: var(--muted); font-size: 13px; }
.references .ref-list { margin: 0; padding-left: 22px; display: grid; gap: 10px; font-size: 13px; line-height: 1.45; }
.references .ref-cite { overflow-wrap: anywhere; }
.references .ref-cite a { color: inherit; }
.references .ref-meta { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: baseline; color: var(--muted); }
.references .ref-tag { font: 500 11px/1.6 var(--mono, monospace); padding: 0 6px; border: 1px solid var(--line); border-radius: 4px; white-space: nowrap; }`;

  function start() {
    const boxes = document.querySelectorAll('[data-references]');
    if (!boxes.length) return;
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    boxes.forEach(render);
  }

  const api = { WORKS, PAGES };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
  root.References = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(typeof self !== 'undefined' ? self : this);
