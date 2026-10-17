// Spanish: common.
// Shared by every page: lib/nav.js (site bar, chapter bar, start-here prompt),
// lib/learn.js (guided lab panel chrome), lib/lab-catalogue.js,
// lib/system-catalogue.js and lib/previews.js.
(function () {
  'use strict';

  // ---------- Years ago (SystemCatalogue.when and the home page's short form) ----------
  // "3.8 billion" → "3800 millones", for every value the strip can show.
  const years = {};
  for (let i = 100; i <= 460; i++) {
    const v = i / 100;
    const forms = new Set([
      v.toFixed(2).replace(/0$/, '').replace(/\.$/, ''),
      v.toFixed(1),
      v.toFixed(1).replace(/0$/, '').replace(/\.$/, ''),
    ]);
    for (const f of forms) {
      const m = Math.round(parseFloat(f) * 1000);
      years[f + ' billion'] = m + ' millones';
      years[f + ' billion years ago'] = 'Hace ' + m + ' millones de años';
    }
  }
  I18N.add(years);

  // ---------- Guided labs: joined level lists, with and without the "done" mark ----------
  const LEVELS = {
    'Coast': 'Costa', 'Pool': 'Poza', 'Molecules': 'Moléculas', 'Coast again': 'Costa otra vez',
    'Cell': 'Célula', 'Population': 'Población', 'Cell again': 'Célula otra vez',
    'Body': 'Cuerpo', 'Worlds': 'Mundos', 'Organism': 'Organismo',
    'Tissue': 'Tejido', 'Tissue again': 'Tejido otra vez', 'Protocell': 'Protocélula',
  };
  const CHAPTERS = {
    'Early Earth': 'Tierra primitiva', 'First genes': 'Primeros genes', 'First cells': 'Primeras células', 'Bodies': 'Cuerpos',
    'Brains': 'Cerebros', 'Brain tissue': 'Tejido cerebral',
  };
  const LAB_LEVELS = [
    ['Early Earth', ['Coast', 'Pool', 'Molecules', 'Coast again']],
    ['First genes', ['Protocell', 'Molecules', 'Population', 'Coast']],
    ['First cells', ['Cell', 'Population', 'Coast', 'Cell again']],
    ['Bodies', ['Body', 'Cell', 'Body', 'Population']],
    ['Brains', ['Worlds', 'Cell', 'Organism', 'Population']],
    ['Brain tissue', ['Tissue', 'Cell', 'Tissue again']],
  ];
  const joined = {};
  for (const [ch, lv] of LAB_LEVELS) {
    const en = lv.join(' → '), es = lv.map((l) => LEVELS[l]).join(' → ');
    joined[en] = es;
    joined[en + ' ·'] = es + ' ·';
    joined[ch + ' · ' + en] = CHAPTERS[ch] + ' · ' + es;
    joined[ch + ' · ' + en + ' ·'] = CHAPTERS[ch] + ' · ' + es + ' ·';
  }
  I18N.add(LEVELS);
  I18N.add(CHAPTERS);
  I18N.add(joined);

  // ---------- Site navigation (lib/nav.js) ----------
  const ROUTE = ['Early Earth', 'First genes', 'First cells', 'Colonies', 'Bodies', 'Brains and ecosystems', 'Tissue Lab'];
  const PAGE_ES = {
    'Early Earth': 'Tierra primitiva', 'First genes': 'Primeros genes', 'First cells': 'Primeras células', 'Colonies': 'Colonias', 'Bodies': 'Cuerpos',
    'Brains and ecosystems': 'Cerebros y ecosistemas', 'Tissue Lab': 'Laboratorio de tejido',
  };
  const arrows = {};
  for (const t of ROUTE) {
    arrows['← ' + t] = '← ' + PAGE_ES[t];
    arrows['Next: ' + t + ' →'] = 'Siguiente: ' + PAGE_ES[t] + ' →';
  }
  I18N.add(arrows);

  I18N.add({
    // Bar
    'Learning Systems': 'Learning Systems',
    'Site': 'Sitio',
    'World Viewer': 'Visor del mundo',
    'Guided labs': 'Labs guiados',
    'Guided labs · {d}': 'Labs guiados · {d}',
    'Start here': 'Empieza aquí',
    'Environments': 'Entornos',
    'Nervous systems': 'Sistemas nerviosos',
    'Brains and ecosystems': 'Cerebros y ecosistemas',
    'Tissue Lab': 'Laboratorio de tejido',
    'Train a creature': 'Entrena una criatura',
    // Chapter bar
    'Timeline of life': 'Línea de tiempo de la vida',
    'Timeline of life · {c}': 'Línea de tiempo de la vida · {c}',
    'Chapter 0': 'Capítulo 0',
    'Chapter 1': 'Capítulo 1',
    'Chapter 2': 'Capítulo 2',
    'Chapter 3': 'Capítulo 3',
    'Chapter 4': 'Capítulo 4',
    'Chapters 5 and 6': 'Capítulos 5 y 6',
    'Chapters 6 and 7': 'Capítulos 6 y 7',
    'Inside a brain': 'Dentro de un cerebro',
    'See this chapter in the World Viewer': 'Ve este capítulo en el Visor del mundo',
    // Start here
    '<b>New here?</b> The guided lab <b>{t}</b> walks you through this world level by level: {l}.':
      '<b>¿Primera vez aquí?</b> El lab guiado <b>{t}</b> te lleva por este mundo nivel a nivel: {l}.',
    'You finished the guided lab <b>{t}</b>. Explore freely, or test yourself on new situations.':
      'Terminaste el lab guiado <b>{t}</b>. Explora con libertad o ponte a prueba con situaciones nuevas.',
    'Make the call →': 'Tú decides →',
    'Start the guided lab': 'Empieza el lab guiado',

    // ---------- Guided lab panel (lib/learn.js) ----------
    'Guided lab': 'Lab guiado',
    'Minimise': 'Minimizar',
    'Expand': 'Expandir',
    'Close': 'Cerrar',
    'Take it apart': 'Desarma',
    'Each lab follows one mechanism across levels. It builds a twin world with one thing changed, so you can see what that thing does.':
      'Cada lab sigue un mecanismo a través de los niveles. Construye un mundo gemelo con una sola cosa cambiada, para que veas qué hace esa cosa.',
    'done': 'completado',
    'In other worlds': 'En otros mundos',
    'All labs, and situations to make the call →': 'Todos los labs, y situaciones para que tú decidas →',
    'Levels in this lab': 'Niveles de este lab',
    'Step {i} of {n} · {level}': 'Paso {i} de {n} · {level}',
    'Step {i} of {n}': 'Paso {i} de {n}',
    'Waiting for the world…': 'Esperando al mundo…',
    '← Back': '← Atrás',
    'Skip': 'Saltar',
    'Next →': 'Siguiente →',
    'There it is. Read the line above, then go on.': 'Ahí está. Lee la línea de arriba y sigue.',
    'Pause and think': 'Pausa para pensar',
    'All labs': 'Todos los labs',
    'Done': 'Listo',
    'Right.': '¡Correcto!',
    'Not quite.': 'No exactamente.',

    // ---------- Lab catalogue (lib/lab-catalogue.js) ----------
    'Why tide pools?': '¿Por qué las pozas de marea?',
    'Why do long chains, and then copiers, only appear where pools dry out?':
      '¿Por qué las cadenas largas, y después los copiadores, solo aparecen donde las pozas se secan?',
    'How did cells start to move?': '¿Cómo empezaron a moverse las células?',
    'Why would a drifting cell evolve a motor, and how strong should it be?':
      '¿Por qué una célula a la deriva evolucionaría un motor, y qué tan fuerte debería ser?',
    'Why do muscles beat together?': '¿Por qué los músculos laten juntos?',
    'Every contracting cell pushes just as hard on both coasts. Why does one kind of body move faster?':
      'Cada célula contráctil empuja con la misma fuerza en las dos costas. ¿Por qué un tipo de cuerpo se mueve más rápido?',
    'Learning a colour': 'Aprender un color',
    'How does one synapse, changed by dopamine, turn into a creature that knows what to eat?':
      '¿Cómo una sola sinapsis, cambiada por la dopamina, se convierte en una criatura que sabe qué comer?',
    'Who prunes, and who cleans up?': '¿Quién poda y quién limpia?',
    'Synapses overshoot and then get pruned. Are microglia the ones doing the pruning?':
      'Las sinapsis se pasan de número y luego se podan. ¿Es la microglía la que hace la poda?',

    // ---------- System catalogue (lib/system-catalogue.js) ----------
    // Kinds
    'Chemical systems': 'Sistemas químicos',
    'Chemistry': 'Química',
    'Molecules that build, copy and wrap themselves before anything is alive.':
      'Moléculas que se construyen, se copian y se envuelven antes de que haya algo vivo.',
    'Cells and colonies': 'Células y colonias',
    'Cells': 'Células',
    'Living cells that eat, divide and evolve, alone or stuck together.':
      'Células vivas que comen, se dividen y evolucionan, solas o pegadas entre sí.',
    'Many cells that take on roles and act as one.': 'Muchas células que asumen funciones y actúan como una sola.',
    'Nerves': 'Nervios',
    'Cells that pass signals on: nerve nets, brains and living brain tissue.':
      'Células que transmiten señales: redes nerviosas, cerebros y tejido cerebral vivo.',
    'Ecosystems': 'Ecosistemas',
    'Species that feed on, flee from and shape each other.': 'Especies que se comen, huyen y se moldean unas a otras.',
    // Layers
    'Tectonic plates': 'Placas tectónicas',
    'The planet’s shell is cracked into plates that drift a few centimetres a year, about as fast as fingernails grow. Where they pull apart, hot rock wells up and vents leak heat.':
      'La capa exterior del planeta está partida en placas que se desplazan unos pocos centímetros al año, más o menos lo que crecen las uñas. Donde se separan, sube roca caliente y las fuentes hidrotermales dejan escapar calor.',
    'Currents': 'Corrientes',
    'Winds and the spin of the planet drive the surface currents that mix the oceans.':
      'Los vientos y el giro del planeta impulsan las corrientes superficiales que mezclan los océanos.',
    // Systems
    'Early Earth': 'Tierra primitiva',
    'about 4 billion years ago': 'hace unos 4000 millones de años',
    'about 4.4 billion years ago': 'hace unos 4400 millones de años',
    'Zircon crystals from Jack Hills, Western Australia, show liquid oceans 4.4 billion years ago. Warm vents like Lost City, on the floor of the Atlantic, are one leading idea for where the chemistry of life began.':
      'Los cristales de circón de Jack Hills, en Australia Occidental, muestran océanos líquidos hace 4400 millones de años. Las fuentes hidrotermales tibias como Lost City, en el fondo del Atlántico, son una de las principales ideas sobre dónde empezó la química de la vida.',
    'First genes': 'Primeros genes',
    'before about 4.2 billion years ago': 'antes de hace unos 4200 millones de años',
    'Jack Hills, Western Australia': 'Jack Hills, Australia Occidental',
    'No gene has left a fossil. The last common ancestor of all life already had about 2,600 genes, and gene-tree dating puts it about 4.2 billion years ago (debated). Zircons from Jack Hills show liquid oceans by 4.4 billion years ago. Genes began in between.':
      'Ningún gen ha dejado un fósil. El último antepasado común de toda la vida ya tenía unos 2600 genes, y la datación con árboles de genes lo sitúa hace unos 4200 millones de años (debatido). Los circones de Jack Hills muestran océanos líquidos hace 4400 millones de años. Los genes empezaron entre una fecha y otra.',
    'Protocells whose copiers do a job: making the protocell\'s own skin and building blocks. Parasites copy faster inside, but protocells with working genes split sooner. Watch how much of each protocell makes itself.':
      'Protocélulas cuyos copiadores hacen un trabajo: fabricar la propia piel y los bloques de la protocélula. Dentro, los parásitos se copian más rápido, pero las protocélulas con genes que trabajan se dividen antes. Mira cuánto de cada protocélula se hace a sí misma.',
    'Why keep genes inside a skin?': '¿Por qué guardar los genes dentro de una piel?',
    'A gene that makes the skin works for the whole protocell. What happens when its work leaks out to everyone?':
      'Un gen que fabrica la piel trabaja para toda la protocélula. ¿Qué pasa cuando su trabajo se escapa y sirve a todos?',
    'Lost City vents, mid-Atlantic': 'Fuentes de Lost City, Atlántico central',
    'Warm vents like Lost City, on the floor of the Atlantic, are one leading idea for where the chemistry of life began.':
      'Las fuentes hidrotermales tibias como Lost City, en el fondo del Atlántico, son una de las principales ideas sobre dónde empezó la química de la vida.',
    'A young coast with no life. Sun, tides, hot vents and currents drive a made-up chemistry: chains form in drying tide pools, copiers arise, and oily bubbles trap them and split.':
      'Una costa joven sin vida. El sol, las mareas, las fuentes hidrotermales y las corrientes mueven una química inventada: se forman cadenas en las pozas de marea que se secan, surgen copiadores y burbujas de aceite los atrapan y se dividen.',
    'First cells': 'Primeras células',
    'about 3.8 billion years ago': 'hace unos 3800 millones de años',
    'Pilbara, Western Australia': 'Pilbara, Australia Occidental',
    'Stromatolites in the Pilbara, about 3.5 billion years old, are among the oldest widely accepted signs of life.':
      'Los estromatolitos de Pilbara, de unos 3500 millones de años, están entre los signos de vida más antiguos ampliamente aceptados.',
    'Cells start with no working motor and drift with the currents. Watch motors, steering toward food and an eyespot for light evolve, one gene at a time.':
      'Las células empiezan sin un motor que funcione y van a la deriva con las corrientes. Mira cómo evolucionan los motores, el rumbo hacia la comida y una mancha ocular para la luz, un gen a la vez.',
    'Colonies': 'Colonias',
    'about 3.5 billion years ago': 'hace unos 3500 millones de años',
    'Exuma Cays, Bahamas': 'Cayos Exuma, Bahamas',
    'Living stromatolites in the Bahamas are mats built by colonies of microbes, much like the oldest fossils.':
      'Los estromatolitos vivos de las Bahamas son tapetes construidos por colonias de microbios, muy parecidos a los fósiles más antiguos.',
    'Predators arrive: big cells that swallow anything small, and a clump of four is too big to swallow. Cells can make a helper molecule that feeds everyone nearby, and cheats that make none. Watch when sharing survives.':
      'Llegan los depredadores: células grandes que se tragan todo lo pequeño, y un grupo de cuatro es demasiado grande para tragarlo. Las células pueden fabricar una molécula ayudante que alimenta a todas las que están cerca, y aparecen tramposas que no fabrican nada. Mira cuándo sobrevive el compartir.',
    'Bodies: the first muscles': 'Cuerpos: los primeros músculos',
    'Bodies': 'Cuerpos',
    'about 1.5 billion to 600 million years ago': 'hace entre unos 1500 y 600 millones de años',
    'Newfoundland, Canada': 'Terranova, Canadá',
    'Haootia, a 560-million-year-old fossil from Newfoundland, shows the oldest known muscle fibres in an animal.':
      'Haootia, un fósil de 560 millones de años de Terranova, muestra las fibras musculares más antiguas conocidas en un animal.',
    'Cells that stick together take roles. Contracting cells squeeze to push their body along, but the body only moves when they squeeze together.':
      'Las células que se mantienen juntas asumen funciones. Las células contráctiles se aprietan para empujar su cuerpo, pero el cuerpo solo avanza cuando se aprietan al mismo tiempo.',
    'Nerve nets': 'Redes nerviosas',
    'about 600 million years ago': 'hace unos 600 millones de años',
    'Jellyfish Lake, Palau': 'Lago de las Medusas, Palaos',
    'Millions of jellyfish in this lake follow the sun across the water every day, steered by nerve nets with no brain.':
      'Millones de medusas de este lago siguen al sol a través del agua cada día, guiadas por redes nerviosas sin cerebro.',
    'Some outer cells become nerve cells. A cell that tastes richer food fires, the net passes the signal across the body, and contracting cells squeeze together toward the food.':
      'Algunas células externas se vuelven células nerviosas. Una célula que percibe comida más rica se dispara, la red pasa la señal por todo el cuerpo y las células contráctiles se aprietan juntas hacia la comida.',
    'Brains': 'Cerebros',
    'about 540 million years ago': 'hace unos 540 millones de años',
    'Chengjiang, Yunnan, China': 'Chengjiang, Yunnan, China',
    'Fuxianhuia, a 520-million-year-old fossil from Chengjiang, keeps one of the oldest known brains.':
      'Fuxianhuia, un fósil de 520 millones de años de Chengjiang, conserva uno de los cerebros más antiguos conocidos.',
    'Creatures with an eye and a small spiking brain that wires itself and learns which plants are food. Follow one, then zoom into its body, its brain and single cells.':
      'Criaturas con un ojo y un pequeño cerebro de impulsos que se conecta solo y aprende qué plantas son comida. Sigue a una y luego acércate a su cuerpo, su cerebro y sus células.',
    'the Cambrian, about 520 million years ago': 'el Cámbrico, hace unos 520 millones de años',
    'Burgess Shale, British Columbia': 'Lutitas de Burgess, Columbia Británica',
    'The Burgess Shale, about 508 million years old, keeps whole Cambrian communities: grazers, hunters and prey.':
      'Las lutitas de Burgess, de unos 508 millones de años, conservan comunidades cámbricas enteras: herbívoros, cazadores y presas.',
    'Hunters chase and bite plant eaters, which can see them and learn to flee. Cycles, chases and extinctions emerge from nothing but local rules.':
      'Los cazadores persiguen y muerden a los herbívoros, que pueden verlos y aprender a huir. Ciclos, persecuciones y extinciones surgen solo de reglas locales.',
    'today, inside a living brain': 'hoy, dentro de un cerebro vivo',
    'Madrid, Spain': 'Madrid, España',
    'In Madrid in 1919, Pío del Río Hortega identified microglia, the cells that clear weak synapses and debris in the Tissue Lab.':
      'En Madrid, en 1919, Pío del Río Hortega identificó la microglía, las células que eliminan las sinapsis débiles y los desechos en el Laboratorio de tejido.',
    'A slice of brain tissue where neurons are the organisms. They wire themselves, compete for growth factor and energy, are pruned by glia and replaced from a stem-cell niche.':
      'Una rebanada de tejido cerebral donde las neuronas son los organismos. Se conectan solas, compiten por factor de crecimiento y energía, la glía las poda y se reemplazan desde un nicho de células madre.',
    'Teach one small brain with Good and Bad, and watch dopamine move from the treat to the click.':
      'Enseña a un pequeño cerebro con Bien y Mal, y mira cómo la dopamina pasa del premio al clic.',
    // Events
    'Earth forms': 'Se forma la Tierra',
    'Rock and dust around the young Sun come together into a molten planet.':
      'La roca y el polvo alrededor del joven Sol se juntan en un planeta fundido.',
    'The first oceans': 'Los primeros océanos',
    'Tiny zircon crystals from Jack Hills, Western Australia, show there was liquid water 4.4 billion years ago.':
      'Diminutos cristales de circón de Jack Hills, Australia Occidental, muestran que había agua líquida hace 4400 millones de años.',
    'Oxygen fills the air': 'El oxígeno llena el aire',
    'Microbes that live on sunlight release oxygen. It rusts the seas, and the air and sky change for good.':
      'Microbios que viven de la luz solar liberan oxígeno. Oxida los mares, y el aire y el cielo cambian para siempre.',
    'Complex cells': 'Células complejas',
    'Cells with a nucleus have appeared, and some already live as small many-celled bodies.':
      'Han aparecido las células con núcleo, y algunas ya viven como pequeños cuerpos de muchas células.',
    'Snowball Earth': 'Tierra bola de nieve',
    'Twice, ice spreads from the poles almost to the equator, just before the first animals.':
      'Dos veces, el hielo se extiende desde los polos casi hasta el ecuador, justo antes de los primeros animales.',
    'Plants reach land': 'Las plantas llegan a tierra firme',
    'Bare rock starts to turn green. Soil follows the plants.': 'La roca desnuda empieza a volverse verde. El suelo sigue a las plantas.',
    'Animals step onto land': 'Los animales pisan tierra firme',
    'Tiktaalik, a fish with sturdy, limb-like fins found on Ellesmere Island in the Canadian Arctic, lived in shallow water about 375 million years ago.':
      'Tiktaalik, un pez con aletas robustas parecidas a patas hallado en la isla de Ellesmere, en el Ártico canadiense, vivió en aguas poco profundas hace unos 375 millones de años.',
    'An asteroid ends the dinosaurs': 'Un asteroide acaba con los dinosaurios',
    'An impact at Chicxulub, Mexico, wipes out about three quarters of all species.':
      'Un impacto en Chicxulub, México, extingue cerca de tres cuartas partes de todas las especies.',
    'Our species': 'Nuestra especie',
    'The oldest fossils of Homo sapiens, from Jebel Irhoud in Morocco, are about 300,000 years old.':
      'Los fósiles más antiguos de Homo sapiens, de Jebel Irhoud en Marruecos, tienen unos 300,000 años.',
    // Geologic time scale
    'Hadean': 'Hádico', 'Archean': 'Arcaico', 'Proterozoic': 'Proterozoico', 'Phanerozoic': 'Fanerozoico',
    'Eoarchean': 'Eoarcaico', 'Paleoarchean': 'Paleoarcaico', 'Mesoarchean': 'Mesoarcaico', 'Neoarchean': 'Neoarcaico',
    'Paleoproterozoic': 'Paleoproterozoico', 'Mesoproterozoic': 'Mesoproterozoico', 'Tonian': 'Tónico',
    'Cryogenian': 'Criogénico', 'Ediacaran': 'Ediacárico', 'Cambrian': 'Cámbrico', 'Ordovician': 'Ordovícico',
    'Silurian': 'Silúrico', 'Devonian': 'Devónico', 'Carboniferous': 'Carbonífero', 'Permian': 'Pérmico',
    'Triassic': 'Triásico', 'Jurassic': 'Jurásico', 'Cretaceous': 'Cretácico', 'Paleogene': 'Paleógeno',
    'Neogene': 'Neógeno', 'Quaternary': 'Cuaternario',
    // Links
    'Open the simulation': 'Abrir la simulación',
    'See it in the World Viewer': 'Verlo en el Visor del mundo',
    'Open it in the World Viewer': 'Abrirlo en el Visor del mundo',
    'Guided lab: {t}': 'Lab guiado: {t}',
    'Guided lab: {t} ✓': 'Lab guiado: {t} ✓',
    // when()
    'today': 'hoy',
    'Today': 'Hoy',
    '1 million years ago': 'Hace 1 millón de años',
    '{n} million years ago': 'Hace {n} millones de años',
    '{n},000 years ago': 'Hace {n} 000 años',
    '1 million': '1 millón',
    '{n} million': '{n} millones',
    '{n} thousand': '{n} mil',

    // ---------- Live previews (lib/previews.js) ----------
    'The sea is warming up': 'El mar se está calentando',
    'Food is building up before the cells arrive': 'La comida se acumula antes de que lleguen las células',
    'Creatures are learning the plants': 'Las criaturas están aprendiendo las plantas',
    'Neurons are wiring themselves': 'Las neuronas se están conectando',
    'No preview for this one yet': 'Todavía no hay vista previa para este',
    'Loading the simulation': 'Cargando la simulación',
    'Could not load {p}': 'No se pudo cargar {p}',
  });
})();
