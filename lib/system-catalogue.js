// Every system in Learning Systems, placed on the planet and in the history of
// life, so a page can show them on a globe, along a timeline or as a plain list.
//
//   t          years ago when the system arose (a chapter's start)
//   until      for a system that arose slowly, when it was in place
//   lat, lon   where the oldest evidence for it was found, or a living example
//   page       path from the repository root; viewer: World Viewer chapter key
//   lab        a lab id from lib/lab-catalogue.js
//   preview    which live preview lib/previews.js can run for it
//
// Plain data plus a few helpers; no DOM. Keep in step with lib/nav.js and
// lib/lab-catalogue.js when adding a product.
(function (root) {
  'use strict';

  // Kinds of system, from the simplest level of organisation to the most complex.
  const KINDS = [
    { id: 'chemistry', name: 'Chemical systems', short: 'Chemistry', level: 1,
      text: 'Molecules that build, copy and wrap themselves before anything is alive.' },
    { id: 'cells', name: 'Cells and colonies', short: 'Cells', level: 2,
      text: 'Living cells that eat, divide and evolve, alone or stuck together.' },
    { id: 'bodies', name: 'Bodies', short: 'Bodies', level: 3,
      text: 'Many cells that take on roles and act as one.' },
    { id: 'nervous', name: 'Nervous systems', short: 'Nerves', level: 4,
      text: 'Cells that pass signals on: nerve nets, brains and living brain tissue.' },
    { id: 'ecosystems', name: 'Ecosystems', short: 'Ecosystems', level: 5,
      text: 'Species that feed on, flee from and shape each other.' },
  ];

  // Earth systems a page can light up on the planet: the plates as they are
  // today (real data, lib/plates.js) and the surface currents (a simplified map).
  const LAYERS = [
    { id: 'plates', name: 'Tectonic plates', text: 'The planet’s shell is cracked into plates that drift a few centimetres a year, about as fast as fingernails grow. Where they pull apart, hot rock wells up and vents leak heat.' },
    { id: 'currents', name: 'Currents', text: 'Winds and the spin of the planet drive the surface currents that mix the oceans.' },
  ];

  const SYSTEMS = [
    {
      id: 'early-earth', title: 'Early Earth', kind: 'chemistry', chapter: 0,
      t: 4.4e9, when: 'about 4.4 billion years ago',
      place: 'Lost City vents, mid-Atlantic', lat: 30.1, lon: -42.1,
      evidence: 'Zircon crystals from Jack Hills, Western Australia, show liquid oceans 4.4 billion years ago. Warm vents like Lost City, on the floor of the Atlantic, are one leading idea for where the chemistry of life began.',
      text: 'A young coast with no life. Sun, tides, hot vents and currents drive a made-up chemistry: chains form in drying tide pools, copiers arise, and oily bubbles trap them and split.',
      page: 'environments/early-earth/index.html', viewer: 'earth', lab: 'tide-pools', preview: 'earth',
    },
    {
      id: 'first-genes', title: 'First genes', kind: 'chemistry', chapter: 1,
      t: 4.3e9, until: 4.2e9, when: 'before about 4.2 billion years ago',
      place: 'Jack Hills, Western Australia', lat: -26.1, lon: 117.3,
      evidence: 'No gene has left a fossil. The last common ancestor of all life already had about 2,600 genes, and gene-tree dating puts it about 4.2 billion years ago (debated). Zircons from Jack Hills show liquid oceans by 4.4 billion years ago. Genes began in between.',
      text: 'Protocells whose copiers do a job: making the protocell\'s own skin and building blocks. Parasites copy faster inside, but protocells with working genes split sooner. Watch how much of each protocell makes itself.',
      page: 'environments/first-genes/index.html', viewer: 'genes', lab: 'break-the-skin', preview: 'genes',
    },
    {
      id: 'first-cells', title: 'First cells', kind: 'cells', chapter: 2,
      t: 3.8e9, when: 'about 3.8 billion years ago',
      place: 'Pilbara, Western Australia', lat: -21.1, lon: 119.4,
      evidence: 'Stromatolites in the Pilbara, about 3.5 billion years old, are among the oldest widely accepted signs of life.',
      text: 'Cells start with no working motor and drift with the currents. Watch motors, steering toward food and an eyespot for light evolve, one gene at a time.',
      page: 'environments/first-cells/index.html', viewer: 'cells', lab: 'learning-to-move', preview: 'cells',
    },
    {
      id: 'colonies', title: 'Colonies', kind: 'cells', chapter: 3,
      t: 3.5e9, when: 'about 3.5 billion years ago',
      place: 'Exuma Cays, Bahamas', lat: 24.7, lon: -76.8,
      evidence: 'Living stromatolites in the Bahamas are mats built by colonies of microbes, much like the oldest fossils.',
      text: 'Predators arrive: big cells that swallow anything small, and a clump of four is too big to swallow. Cells can make a helper molecule that feeds everyone nearby, and cheats that make none. Watch when sharing survives.',
      page: 'environments/colonies/index.html', viewer: 'colonies', lab: 'sharers-and-cheats', preview: 'colonies',
    },
    {
      id: 'bodies', title: 'Bodies: the first muscles', kind: 'bodies', chapter: 4,
      t: 1.5e9, until: 6.0e8, when: 'about 1.5 billion to 600 million years ago',
      place: 'Newfoundland, Canada', lat: 48.5, lon: -53.5,
      evidence: 'Haootia, a 560-million-year-old fossil from Newfoundland, shows the oldest known muscle fibres in an animal.',
      text: 'Cells that stick together take roles. Contracting cells squeeze to push their body along, but the body only moves when they squeeze together.',
      page: 'environments/first-bodies/index.html', viewer: 'bodies', lab: 'muscles-beat-together', preview: 'bodies',
    },
    {
      id: 'nerve-nets', title: 'Nerve nets', kind: 'nervous', chapter: 5,
      t: 6.0e8, when: 'about 600 million years ago',
      place: 'Jellyfish Lake, Palau', lat: 7.16, lon: 134.38,
      evidence: 'Millions of jellyfish in this lake follow the sun across the water every day, steered by nerve nets with no brain.',
      text: 'Some outer cells become nerve cells. A cell that tastes richer food fires, the net passes the signal across the body, and contracting cells squeeze together toward the food.',
      page: null, viewer: 'nerves', preview: 'nerves',
    },
    {
      id: 'brains', title: 'Brains', kind: 'nervous', chapter: 6,
      t: 5.4e8, when: 'about 540 million years ago',
      place: 'Chengjiang, Yunnan, China', lat: 24.67, lon: 102.98,
      evidence: 'Fuxianhuia, a 520-million-year-old fossil from Chengjiang, keeps one of the oldest known brains.',
      text: 'Creatures with an eye and a small spiking brain that wires itself and learns which plants are food. Follow one, then zoom into its body, its brain and single cells.',
      page: 'environments/forager-worlds/index.html', viewer: 'brains', lab: 'learning-colour', preview: 'brains',
    },
    {
      id: 'ecosystems', title: 'Ecosystems', kind: 'ecosystems', chapter: 7,
      t: 5.2e8, when: 'the Cambrian, about 520 million years ago',
      place: 'Burgess Shale, British Columbia', lat: 51.43, lon: -116.47,
      evidence: 'The Burgess Shale, about 508 million years old, keeps whole Cambrian communities: grazers, hunters and prey.',
      text: 'Hunters chase and bite plant eaters, which can see them and learn to flee. Cycles, chases and extinctions emerge from nothing but local rules.',
      page: 'environments/forager-worlds/index.html', viewer: 'ecosystems', preview: 'ecosystems',
    },
    {
      id: 'tissue', title: 'Tissue Lab', kind: 'nervous',
      t: 0, when: 'today, inside a living brain',
      place: 'Madrid, Spain', lat: 40.42, lon: -3.7,
      evidence: 'In Madrid in 1919, Pío del Río Hortega identified microglia, the cells that clear weak synapses and debris in the Tissue Lab.',
      text: 'A slice of brain tissue where neurons are the organisms. They wire themselves, compete for growth factor and energy, are pruned by glia and replaced from a stem-cell niche.',
      page: 'nervous-systems/tissue-lab/index.html', lab: 'who-cleans', preview: 'tissue',
      more: [{ title: 'Train a creature', page: 'nervous-systems/tissue-lab/train.html', text: 'Teach one small brain with Good and Bad, and watch dopamine move from the treat to the click.' }],
    },
  ];

  // Moments in the history of the planet that have no simulation of their own.
  const EVENTS = [
    { t: 4.54e9, title: 'Earth forms', text: 'Rock and dust around the young Sun come together into a molten planet.' },
    { t: 4.4e9, title: 'The first oceans', text: 'Tiny zircon crystals from Jack Hills, Western Australia, show there was liquid water 4.4 billion years ago.', lat: -26.1, lon: 117.3 },
    { t: 2.4e9, title: 'Oxygen fills the air', text: 'Microbes that live on sunlight release oxygen. It rusts the seas, and the air and sky change for good.' },
    { t: 1.6e9, title: 'Complex cells', text: 'Cells with a nucleus have appeared, and some already live as small many-celled bodies.' },
    { t: 7.2e8, until: 6.35e8, title: 'Snowball Earth', text: 'Twice, ice spreads from the poles almost to the equator, just before the first animals.' },
    { t: 4.7e8, title: 'Plants reach land', text: 'Bare rock starts to turn green. Soil follows the plants.' },
    { t: 3.75e8, title: 'Animals step onto land', text: 'Tiktaalik, a fish with sturdy, limb-like fins found on Ellesmere Island in the Canadian Arctic, lived in shallow water about 375 million years ago.', lat: 77.0, lon: -86.0 },
    { t: 6.6e7, title: 'An asteroid ends the dinosaurs', text: 'An impact at Chicxulub, Mexico, wipes out about three quarters of all species.', lat: 21.3, lon: -89.5 },
    { t: 3.0e5, title: 'Our species', text: 'The oldest fossils of Homo sapiens, from Jebel Irhoud in Morocco, are about 300,000 years old.', lat: 31.86, lon: -8.87 },
  ];

  // The geologic time scale, with the colours of the International
  // Chronostratigraphic Chart (t0: start, t1: end, in years ago).
  const EONS = [
    { name: 'Hadean', t0: 4.567e9, t1: 4.031e9, color: '#AE027E' },
    { name: 'Archean', t0: 4.031e9, t1: 2.5e9, color: '#F0047F' },
    { name: 'Proterozoic', t0: 2.5e9, t1: 5.388e8, color: '#F73563' },
    { name: 'Phanerozoic', t0: 5.388e8, t1: 0, color: '#9AD9DD' },
  ];
  const PERIODS = [
    { name: 'Eoarchean', t0: 4.031e9, t1: 3.6e9, color: '#E61D8C' },
    { name: 'Paleoarchean', t0: 3.6e9, t1: 3.2e9, color: '#F4449F' },
    { name: 'Mesoarchean', t0: 3.2e9, t1: 2.8e9, color: '#F768A9' },
    { name: 'Neoarchean', t0: 2.8e9, t1: 2.5e9, color: '#F99BC1' },
    { name: 'Paleoproterozoic', t0: 2.5e9, t1: 1.6e9, color: '#F74370' },
    { name: 'Mesoproterozoic', t0: 1.6e9, t1: 1.0e9, color: '#FDB462' },
    { name: 'Tonian', t0: 1.0e9, t1: 7.2e8, color: '#FEBF4E' },
    { name: 'Cryogenian', t0: 7.2e8, t1: 6.35e8, color: '#FECC5C' },
    { name: 'Ediacaran', t0: 6.35e8, t1: 5.388e8, color: '#FED96A' },
    { name: 'Cambrian', t0: 5.388e8, t1: 4.854e8, color: '#7FA056' },
    { name: 'Ordovician', t0: 4.854e8, t1: 4.438e8, color: '#009270' },
    { name: 'Silurian', t0: 4.438e8, t1: 4.192e8, color: '#B3E1B6' },
    { name: 'Devonian', t0: 4.192e8, t1: 3.589e8, color: '#CB8C37' },
    { name: 'Carboniferous', t0: 3.589e8, t1: 2.989e8, color: '#67A599' },
    { name: 'Permian', t0: 2.989e8, t1: 2.519e8, color: '#F04028' },
    { name: 'Triassic', t0: 2.519e8, t1: 2.014e8, color: '#812B92' },
    { name: 'Jurassic', t0: 2.014e8, t1: 1.45e8, color: '#34B2C9' },
    { name: 'Cretaceous', t0: 1.45e8, t1: 6.6e7, color: '#7FC64E' },
    { name: 'Paleogene', t0: 6.6e7, t1: 2.303e7, color: '#FD9A52' },
    { name: 'Neogene', t0: 2.303e7, t1: 2.58e6, color: '#FFE619' },
    { name: 'Quaternary', t0: 2.58e6, t1: 0, color: '#F9F97F' },
  ];

  // How the planet looks over time, blended between keyframes. Continents are
  // always today's shapes so places can be found; "land" says how much of them
  // stands above the sea (young Earth was nearly all ocean).
  //   molten: glowing magma; land: 0 to 1; green: plants on land;
  //   ice: 0 none, about 0.35 polar caps, 1 Snowball Earth;
  //   sky: colour of the air seen edge-on.
  const LOOKS = [
    { t: 4.54e9, molten: 1, land: 0, green: 0, ice: 0, sky: [255, 130, 70] },
    { t: 4.4e9, molten: 0.2, land: 0.02, green: 0, ice: 0, sky: [236, 160, 104] },
    { t: 3.8e9, molten: 0, land: 0.07, green: 0, ice: 0, sky: [238, 158, 92] },
    { t: 2.5e9, molten: 0, land: 0.42, green: 0, ice: 0, sky: [214, 172, 132] },
    { t: 2.35e9, molten: 0, land: 0.5, green: 0, ice: 0.55, sky: [170, 190, 230] },
    { t: 2.1e9, molten: 0, land: 0.6, green: 0, ice: 0.05, sky: [156, 186, 240] },
    { t: 1.0e9, molten: 0, land: 0.86, green: 0, ice: 0.05, sky: [146, 184, 244] },
    { t: 7.3e8, molten: 0, land: 0.92, green: 0, ice: 0.06, sky: [136, 178, 248] },
    { t: 7.1e8, molten: 0, land: 0.92, green: 0, ice: 1, sky: [150, 190, 250] },
    { t: 6.4e8, molten: 0, land: 0.94, green: 0, ice: 1, sky: [150, 190, 250] },
    { t: 6.2e8, molten: 0, land: 0.95, green: 0, ice: 0.08, sky: [124, 172, 255] },
    { t: 4.8e8, molten: 0, land: 1, green: 0, ice: 0.06, sky: [120, 170, 255] },
    { t: 3.6e8, molten: 0, land: 1, green: 0.75, ice: 0.1, sky: [116, 168, 255] },
    { t: 0, molten: 0, land: 1, green: 1, ice: 0.35, sky: [110, 165, 255] },
  ];

  const T_START = 4.54e9;

  function mix(a, b, f) {
    if (Array.isArray(a)) return a.map((v, i) => v + (b[i] - v) * f);
    return a + (b - a) * f;
  }

  // The planet's look at time t (years ago).
  function look(t) {
    t = Math.max(0, Math.min(T_START, t));
    let i = 0;
    while (i < LOOKS.length - 2 && LOOKS[i + 1].t >= t) i++;
    const a = LOOKS[i], b = LOOKS[i + 1];
    const f = a.t === b.t ? 0 : Math.max(0, Math.min(1, (a.t - t) / (a.t - b.t)));
    const out = { t };
    for (const k in a) if (k !== 't') out[k] = mix(a[k], b[k], f);
    return out;
  }

  // "4.0 billion years ago", "520 million years ago", "300,000 years ago", "today".
  function when(t) {
    if (t < 1e4) return 'today';
    if (t >= 1e9) return (t / 1e9).toFixed(t >= 1e9 && t % 1e9 ? 2 : 1).replace(/0$/, '').replace(/\.$/, '') + ' billion years ago';
    if (t >= 1e6) return Math.round(t / 1e6).toLocaleString('en') + ' million years ago';
    return (Math.round(t / 1e4) * 1e4).toLocaleString('en') + ' years ago';
  }

  function periodAt(t) { return PERIODS.find((p) => t <= p.t0 && t > p.t1) || (t > 4.031e9 ? EONS[0] : PERIODS[PERIODS.length - 1]); }
  function kind(id) { return KINDS.find((k) => k.id === id); }
  function system(id) { return SYSTEMS.find((s) => s.id === id); }
  // Chapters, events and systems in time order, oldest first.
  function history() {
    const items = SYSTEMS.map((s) => ({ t: s.t, until: s.until, title: s.title, text: s.text, system: s }))
      .concat(EVENTS.map((e) => ({ t: e.t, until: e.until, title: e.title, text: e.text, event: e })));
    return items.sort((a, b) => b.t - a.t);
  }

  // Where a system can be opened, as paths from the repository root. The
  // first link is the main one.
  function links(s) {
    const out = [];
    if (s.page) out.push({ kind: 'open', label: 'Open the simulation', path: s.page });
    if (s.viewer) out.push({ kind: 'viewer', label: s.page ? 'See it in the World Viewer' : 'Open it in the World Viewer', path: 'world/index.html#' + s.viewer });
    const lab = s.lab && (root.LabCatalogue || []).find((l) => l.id === s.lab);
    if (lab) out.push({ kind: 'lab', label: 'Guided lab: ' + lab.title, path: lab.page + '#lab=' + lab.id, lab });
    for (const m of s.more || []) out.push({ kind: 'more', label: m.title, path: m.page, text: m.text });
    return out;
  }

  // Guided labs finished in this browser (lib/learn.js keeps them).
  function labsDone() {
    let p = {};
    try { p = JSON.parse(root.localStorage.getItem('learning-systems.labs')) || {}; } catch (e) { /* not kept */ }
    return (root.LabCatalogue || []).filter((l) => p[l.id] && p[l.id].done).map((l) => l.id);
  }

  // If the whole history of the Earth were one day: "21:10".
  function clock(t) {
    const h = 24 * (1 - Math.min(T_START, t) / T_START);
    const s = Math.round(h * 3600), hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    const two = (n) => String(n).padStart(2, '0');
    return two(hh) + ':' + two(mm) + (t < 2e7 ? ':' + two(ss) : '');
  }

  root.SystemCatalogue = {
    KINDS, LAYERS, SYSTEMS, EVENTS, EONS, PERIODS, LOOKS, T_START,
    look, when, periodAt, kind, system, history, clock, links, labsDone,
  };
})(typeof self !== 'undefined' ? self : this);
