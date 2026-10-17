// Spanish: world (world/index.html and world/viewer.js).
(function () {
  const d = {
    // ---------- page ----------
    'World Viewer': 'Visor del mundo',
    '← Learning Systems': '← Learning Systems',
    'Guided labs': 'Labs guiados',
    'One world, seen across the history of life': 'Un mundo, visto a lo largo de la historia de la vida',
    'Tell me the story': 'Cuéntame la historia',
    'Drag to move · scroll or pinch to zoom · click to look closer': 'Arrastra para moverte · usa la rueda o pellizca para hacer zoom · haz clic para ver de cerca',
    'Timeline of life': 'Línea de tiempo de la vida',
    'Live view of the current chapter': 'Vista en vivo del capítulo actual',
    'Not built yet': 'Aún no construido',
    'not built yet': 'aún no construido',
    'Zoom level': 'Nivel de zoom',
    'Zoom in': 'Acercar',
    'Zoom out': 'Alejar',
    'Show everything': 'Ver todo',
    'Pause': 'Pausa',
    'Play': 'Reproducir',
    'Speed': 'Velocidad',
    'Slow': 'Lenta',
    'Normal': 'Normal',
    'Fast': 'Rápida',
    'Fast-forward': 'Avance rápido',
    'Close the story': 'Cerrar la historia',
    'Look for:': 'Busca:',
    '← Back': '← Atrás',
    'Next →': 'Siguiente →',
    'Finish': 'Terminar',
    "Open this chapter's page, to compare worlds →": 'Abre la página de este capítulo para comparar mundos →',
    'Levels': 'Niveles',
    'Show': 'Mostrar',
    'Looking at': 'Mirando',
    'Click something on the stage.': 'Haz clic en algo del escenario.',
    'Who is who': 'Quién es quién',
    'Field journal': 'Diario de campo',
    '<kbd>[</kbd> <kbd>]</kbd> earlier or later chapter': '<kbd>[</kbd> <kbd>]</kbd> capítulo anterior o siguiente',
    '<kbd>+</kbd> <kbd>−</kbd> zoom · arrow keys move': '<kbd>+</kbd> <kbd>−</kbd> zoom · las flechas mueven la vista',
    '<kbd>Esc</kbd> back up one level · <kbd>Space</kbd> pause': '<kbd>Esc</kbd> sube un nivel · <kbd>Espacio</kbd> pausa',

    // ---------- chapters ----------
    'Early Earth': 'Tierra primitiva',
    'First cells': 'Primeras células',
    'Colonies': 'Colonias',
    'Bodies': 'Cuerpos',
    'Nerve nets': 'Redes nerviosas',
    'Brains': 'Cerebros',
    'Ecosystems': 'Ecosistemas',
    'about 4 billion years ago': 'hace unos 4000 millones de años',
    'about 3.8 billion years ago': 'hace unos 3800 millones de años',
    'about 3.5 billion years ago': 'hace unos 3500 millones de años',
    'about 1.5 billion to 600 million years ago': 'hace entre unos 1500 y 600 millones de años',
    'about 600 million years ago': 'hace unos 600 millones de años',
    'about 540 million years ago': 'hace unos 540 millones de años',
    'the Cambrian, 520 million years ago': 'el Cámbrico, hace 520 millones de años',
    'Early Earth, about 4 billion years ago': 'Tierra primitiva, hace unos 4000 millones de años',
    'First cells, about 3.8 billion years ago': 'Primeras células, hace unos 3800 millones de años',
    'Colonies, about 3.5 billion years ago': 'Colonias, hace unos 3500 millones de años',
    'Bodies, about 1.5 billion to 600 million years ago': 'Cuerpos, hace entre unos 1500 y 600 millones de años',
    'Nerve nets, about 600 million years ago': 'Redes nerviosas, hace unos 600 millones de años',
    'Brains, about 540 million years ago': 'Cerebros, hace unos 540 millones de años',
    'Ecosystems, the Cambrian, 520 million years ago': 'Ecosistemas, el Cámbrico, hace 520 millones de años',
    'Chapter {i} · {era}': 'Capítulo {i} · {era}',
    // Exact keys, so no general "{n} million years ago" template from another dictionary wins.
    'Chapter 0 · about 4 billion years ago': 'Capítulo 0 · hace unos 4000 millones de años',
    'Chapter 1 · about 3.8 billion years ago': 'Capítulo 1 · hace unos 3800 millones de años',
    'Chapter 2 · about 3.5 billion years ago': 'Capítulo 2 · hace unos 3500 millones de años',
    'Chapter 3 · about 1.5 billion to 600 million years ago': 'Capítulo 3 · hace entre unos 1500 y 600 millones de años',
    'Chapter 4 · about 600 million years ago': 'Capítulo 4 · hace unos 600 millones de años',
    'Chapter 5 · about 540 million years ago': 'Capítulo 5 · hace unos 540 millones de años',
    'Chapter 6 · the Cambrian, 520 million years ago': 'Capítulo 6 · el Cámbrico, hace 520 millones de años',
    'A young coast with no life. Sunlight, hot vents and tides drive a made-up chemistry: chains form in drying tide pools, copiers arise and spread, and oily bubbles trap them and split. Zoom in until the water turns into molecules.':
      'Una costa joven y sin vida. La luz del sol, las fuentes hidrotermales y las mareas mueven una química inventada: se forman cadenas en las pozas de marea que se secan, aparecen copiadores que se extienden, y burbujas de aceite los atrapan y se dividen. Acércate hasta que el agua se convierta en moléculas.',
    'The same coast, now with cells. They eat building blocks and energy from the water, divide when full and die when they run out. At first they have no working motor and drift with the currents. Daughters copy their genes with small mistakes: watch motors, steering toward food and an eyespot for light evolve. Zoom right into a cell to see its flagellum and eyespot.':
      'La misma costa, ahora con células. Comen bloques y energía del agua, se dividen cuando están llenas y mueren cuando se les acaban. Al principio no tienen un motor que funcione y van a la deriva con las corrientes. Las hijas copian sus genes con pequeños errores: mira cómo evolucionan los motores, la capacidad de dirigirse hacia la comida y una mancha ocular para la luz. Acércate a una célula para ver su flagelo y su mancha ocular.',
    'Predators arrive: big cells that swallow anything small. Daughters may stay stuck to their mother. A clump of four is too big to swallow, but clumps compete for the same food. Watch whether sticking together spreads.':
      'Llegan los depredadores: células grandes que se tragan todo lo pequeño. Las hijas pueden quedarse pegadas a su madre. Un grupo de cuatro es demasiado grande para tragarlo, pero los grupos compiten por la misma comida. Mira si quedarse juntas se extiende.',
    'Cells in a clump take on roles. Outer cells become contracting cells, the first muscle-like cells: each squeezes on its own rhythm, and the body only moves when they squeeze together. Inner cells become germ cells that divide but never move. Contracting cells grow old and die; germ cells release seed cells that start new bodies.':
      'Las células de un grupo asumen roles. Las de afuera se vuelven células contráctiles, las primeras células parecidas a músculos: cada una se contrae a su propio ritmo, y el cuerpo solo se mueve cuando se contraen juntas. Las de adentro se vuelven células germinales que se dividen pero nunca se mueven. Las contráctiles envejecen y mueren; las germinales liberan células semilla que inician cuerpos nuevos.',
    'Some outer cells become nerve cells. A cell that tastes richer food fires, nerve cells pass the signal across the body, and contracting cells it reaches squeeze together toward the food. A net with no centre, like Hydra, whose muscle-like cells pull when nerves tell them to.':
      'Algunas células de afuera se vuelven células nerviosas. Una célula que percibe comida más rica se dispara, las células nerviosas pasan la señal por todo el cuerpo, y las contráctiles a las que llega se contraen juntas hacia la comida. Una red sin centro, como la de la hidra, cuyas células parecidas a músculos tiran cuando los nervios se lo indican.',
    'Creatures with an eye and a small spiking brain that wires itself and learns which plants are food. Species with small and large brains share living plants on drifting soil. Follow one, then zoom into its body, brain and single cells.':
      'Criaturas con un ojo y un pequeño cerebro de impulsos que se conecta solo y aprende qué plantas son comida. Especies con cerebros pequeños y grandes comparten plantas vivas sobre suelo que se desplaza. Sigue a una y luego acércate a su cuerpo, su cerebro y sus células.',
    'Hunters chase and bite plant eaters, which can see them and learn to flee. Cycles, chases and extinctions emerge from nothing but local rules.':
      'Los cazadores persiguen y muerden a los herbívoros, que pueden verlos y aprender a huir. Ciclos, persecuciones y extinciones surgen solo de reglas locales.',
    'The same coast, now with seaweed and swimming creatures. The first ones grew from Nerve nets bodies: contracting cells became muscle, and the bodies with the most nerve cells founded the large-brained line. Each has an eye and a small spiking brain that wires itself and learns which seaweed is food. Seaweed grows from sunlight and the building blocks in the water; currents carry the creatures, dry ground and hot vents harm them. Follow one, then zoom into its body, brain and single cells.':
      'La misma costa, ahora con algas y criaturas que nadan. Las primeras nacieron de cuerpos de Redes nerviosas: las células contráctiles se volvieron músculo, y los cuerpos con más células nerviosas fundaron el linaje de cerebros grandes. Cada una tiene un ojo y un pequeño cerebro de impulsos que se conecta solo y aprende qué algas son comida. Las algas crecen con la luz del sol y los bloques de construcción del agua; las corrientes arrastran a las criaturas, y el suelo seco y las fuentes termales las dañan. Sigue a una y luego acércate a su cuerpo, su cerebro y sus células.',
    'Hunters chase and bite plant eaters on the same coast, and the plant eaters can see them and learn to flee. Hunters are bigger and need deeper water, so the shallows are a refuge. What the creatures leave behind goes back into the water as building blocks for the seaweed. Cycles, chases and extinctions emerge from nothing but local rules.':
      'Los cazadores persiguen y muerden a los herbívoros en la misma costa, y los herbívoros pueden verlos y aprender a huir. Los cazadores son más grandes y necesitan agua más profunda, así que las aguas someras son un refugio. Lo que dejan las criaturas vuelve al agua como bloques de construcción para las algas. Ciclos, persecuciones y extinciones surgen solo de reglas locales.',
    // levels
    'Coast': 'Costa',
    'Water up close': 'Agua de cerca',
    'Bubble': 'Burbuja',
    'Cells up close': 'Células de cerca',
    'One cell': 'Una célula',
    'Colonies up close': 'Colonias de cerca',
    'One colony': 'Una colonia',
    'Bodies up close': 'Cuerpos de cerca',
    'One body': 'Un cuerpo',
    'One body and its nerves': 'Un cuerpo y sus nervios',
    'World': 'Mundo',
    'Creature': 'Criatura',
    'Body, brain and cells': 'Cuerpo, cerebro y células',
    'Coast › Water up close › Bubble': 'Costa › Agua de cerca › Burbuja',
    'Coast › Cells up close › One cell': 'Costa › Células de cerca › Una célula',
    'Coast › Colonies up close › One colony': 'Costa › Colonias de cerca › Una colonia',
    'Coast › Bodies up close › One body': 'Costa › Cuerpos de cerca › Un cuerpo',
    'Coast › Bodies up close › One body and its nerves': 'Costa › Cuerpos de cerca › Un cuerpo y sus nervios',
    'World › Creature › Body, brain and cells': 'Mundo › Criatura › Cuerpo, cerebro y células',
    'Guided lab: {t} →': 'Lab guiado: {t} →',
    // species in the forager chapters
    'Small brains': 'Cerebros pequeños',
    'Large brains': 'Cerebros grandes',
    'Prey': 'Presas',
    'Hunters': 'Cazadores',

    // ---------- HUD ----------
    'Life': 'Vida',
    'Bubble #{id}': 'Burbuja n.º {id}',
    'Cell #{id}': 'Célula n.º {id}',
    'Creature #{id}': 'Criatura #{id}',
    'Colony of {n}': 'Colonia de {n}',
    'Body of {n}': 'Cuerpo de {n}',

    // ---------- clock ----------
    'Day {d} · {t} · high tide': 'Día {d} · {t} · marea alta',
    'Day {d} · {t} · low tide': 'Día {d} · {t} · marea baja',
    'Day {d} · {t} · tide rising': 'Día {d} · {t} · marea subiendo',
    'Day {d} · {t} · tide falling': 'Día {d} · {t} · marea bajando',
    'Day {d} · {h}:00 · {n} cells · generation {g}': 'Día {d} · {h}:00 · {n} células · generación {g}',
    'Day {d} · {h}:00 · {n} cells · {p} predators · generation {g}': 'Día {d} · {h}:00 · {n} células · {p} depredadores · generación {g}',
    't {t} · {n} creatures · generation {g}': 't {t} · {n} criaturas · generación {g}',
    'Day {d} · {h}:00 · {n} creatures · {p} seaweed · generation {g}': 'Día {d} · {h}:00 · {n} criaturas · {p} algas · generación {g}',

    // ---------- journal ----------
    'Day {d} · {h}:00 · show me': 'Día {d} · {h}:00 · muéstramelo',
    'Day {d} · {h}:00': 'Día {d} · {h}:00',
    // ---------- looking at ----------
    'This chapter is not built yet. Travel to a lit chapter on the timeline.': 'Este capítulo aún no está construido. Viaja a un capítulo encendido de la línea de tiempo.',
    'Click a spot of water or a bubble. Bubbles are the small rings; pink ones hold copiers.': 'Haz clic en un punto de agua o en una burbuja. Las burbujas son los anillos pequeños; las rosadas contienen copiadores.',
    'Click a creature to follow it. Keep zooming in on it to go inside its body, brain and cells.': 'Haz clic en una criatura para seguirla. Sigue acercándote para entrar en su cuerpo, su cerebro y sus células.',
    'Cells are settling in…': 'Las células se están acomodando…',
    'Stop following': 'Dejar de seguir',
    'Follow it': 'Seguirla',
    'Zoom into its body →': 'Entra en su cuerpo →',
    // bubble
    '<b>Bubble #{id}</b><br>generation <b>{g}</b> · age {a} · size {s}<br>copiers <b>{c}</b> · chains {ch} · split {n}×':
      '<b>Burbuja n.º {id}</b><br>generación <b>{g}</b> · edad {a} · tamaño {s}<br>copiadores <b>{c}</b> · cadenas {ch} · divisiones {n}×',
    '<b>Bubble #{id}</b> (burst)<br>generation <b>{g}</b> · age {a} · size {s}<br>copiers <b>{c}</b> · chains {ch} · split {n}×':
      '<b>Burbuja n.º {id}</b> (reventó)<br>generación <b>{g}</b> · edad {a} · tamaño {s}<br>copiadores <b>{c}</b> · cadenas {ch} · divisiones {n}×',
    // a spot of water
    '<b>{k}</b> · water {w} m · {t} °C · light {l}<br>raw <b>{r}</b> · energy <b>{e}</b> · blocks <b>{b}</b> · chains <b>{c}</b> · copiers <b>{p}</b> · oils <b>{o}</b>':
      '<b>{k}</b> · agua {w} m · {t} °C · luz {l}<br>simples <b>{r}</b> · energía <b>{e}</b> · bloques <b>{b}</b> · cadenas <b>{c}</b> · copiadores <b>{p}</b> · aceites <b>{o}</b>',
    '<b>{k}</b> · water {w} m · {t} °C · light {l} · <b>vent</b><br>raw <b>{r}</b> · energy <b>{e}</b> · blocks <b>{b}</b> · chains <b>{c}</b> · copiers <b>{p}</b> · oils <b>{o}</b>':
      '<b>{k}</b> · agua {w} m · {t} °C · luz {l} · <b>fuente</b><br>simples <b>{r}</b> · energía <b>{e}</b> · bloques <b>{b}</b> · cadenas <b>{c}</b> · copiadores <b>{p}</b> · aceites <b>{o}</b>',
    'deep sea': 'mar profundo',
    'shallow sea': 'mar poco profundo',
    'tide pool': 'poza de marea',
    'beach': 'playa',
    'land': 'tierra',
    // a creature
    '<b>Creature #{id}</b> · {sp}<br>generation {g} · age {a} · energy {e}<br>ate {f} food, {p} poison':
      '<b>Criatura #{id}</b> · {sp}<br>generación {g} · edad {a} · energía {e}<br>comió {f} de comida, {p} de veneno',
    '<b>Creature #{id}</b> · {sp}<br>generation {g} · age {a} · energy {e}<br>ate {f} food, {p} poison · {s} synapses':
      '<b>Criatura #{id}</b> · {sp}<br>generación {g} · edad {a} · energía {e}<br>comió {f} de comida, {p} de veneno · {s} sinapsis',
    '<b>Creature #{id}</b> · {sp}<br>generation {g} · age {a} · energy {e}<br>ate {f} food, {p} poison<br>{origin}':
      '<b>Criatura #{id}</b> · {sp}<br>generación {g} · edad {a} · energía {e}<br>comió {f} de comida, {p} de veneno<br>{origin}',
    '<b>Creature #{id}</b> · {sp}<br>generation {g} · age {a} · energy {e}<br>ate {f} food, {p} poison · {s} synapses<br>{origin}':
      '<b>Criatura #{id}</b> · {sp}<br>generación {g} · edad {a} · energía {e}<br>comió {f} de comida, {p} de veneno · {s} sinapsis<br>{origin}',
    'Descends from Nerve nets body #{b}: {n} cells ({m} contracting, {k} germ, {v} nerve)':
      'Desciende del cuerpo n.º {b} de Redes nerviosas, de {n} células (contráctiles: {m}, germinales: {k}, nerviosas: {v})',
    // a cell
    '<b>Cell #{id}</b> · {role}<br>generation {g} · age {a} · energy {e} · {k} daughters<br>genes: {genes}':
      '<b>Célula n.º {id}</b> · {role}<br>generación {g} · edad {a} · energía {e} · hijas: {k}<br>genes: {genes}',
    '<b>Cell #{id}</b> · {role}<br>generation {g} · age {a} · energy {e} · {k} daughters<br>{group}<br>genes: {genes}':
      '<b>Célula n.º {id}</b> · {role}<br>generación {g} · edad {a} · energía {e} · hijas: {k}<br>{group}<br>genes: {genes}',
    'single cell': 'célula suelta',
    'colony cell': 'célula de colonia',
    'contracting cell': 'célula contráctil',
    'germ cell': 'célula germinal',
    'nerve cell': 'célula nerviosa',
    // the whole population
    '<b>{n}</b> cells<br>Average genes (at the start → now):<br>{genes}<br><small>Click a cell to follow it and its clump.</small>':
      '<b>{n}</b> células<br>Genes promedio (al inicio → ahora):<br>{genes}<br><small>Haz clic en una célula para seguirla a ella y a su grupo.</small>',
    '<b>{n}</b> cells{stats}<br>Average genes (at the start → now):<br>{genes}<br><small>Click a cell to follow it and its clump.</small>':
      '<b>{n}</b> células{stats}<br>Genes promedio (al inicio → ahora):<br>{genes}<br><small>Haz clic en una célula para seguirla a ella y a su grupo.</small>',
    ' · {p}% in clumps · largest {l}': ' · {p}% en grupos · el mayor: {l}',
    ' · {p}% in clumps · largest {l} · {b} bodies with roles · contracting cells in step {s}':
      ' · {p}% en grupos · el mayor: {l} · {b} cuerpos con roles · sincronía de las contráctiles {s}',
    ' · {p}% in clumps · largest {l} · {b} bodies with roles · contracting cells in step {s} · {nb} with nerve cells':
      ' · {p}% en grupos · el mayor: {l} · {b} cuerpos con roles · sincronía de las contráctiles {s} · {nb} con células nerviosas',

    // ---------- legend ----------
    'Single cell': 'Célula suelta',
    'Cell in a colony': 'Célula en una colonia',
    'Cell in a body, no role yet': 'Célula en un cuerpo, aún sin rol',
    'Contracting cell: squeezes, never divides': 'Célula contráctil: se contrae, nunca se divide',
    'Germ cell: divides, never moves': 'Célula germinal: se divide, nunca se mueve',
    'Nerve cell: passes signals on': 'Célula nerviosa: pasa señales',
    'Predator: swallows small things': 'Depredador: se traga cosas pequeñas',
    'Orange: squeezing right now': 'Naranja: contrayéndose ahora mismo',
    'Flash: a cell firing': 'Destello: una célula disparando',
    'Eyespot (zoom in close)': 'Mancha ocular (acércate mucho)',
    'Tail: flagellum, the motor': 'Cola: flagelo, el motor',

    // ---------- story ----------
    'Story · {i} of {n}': 'Historia · {i} de {n}',
    'Try it yourself: {t} →': 'Pruébalo tú: {t} →',
    '{look} Nothing like this has formed yet in this run: set the speed to Fast-forward for a while, then come back to this step.':
      '{look} En esta partida todavía no se ha formado nada así: pon la velocidad en Avance rápido un rato y luego vuelve a este paso.',
    'A young planet': 'Un planeta joven',
    'Four billion years ago Earth had land, sea and sky, but nothing alive. This coast is our stand-in: rock on top, a shallow shore in the middle, deep sea below.':
      'Hace 4000 millones de años la Tierra tenía tierra, mar y cielo, pero nada vivo. Esta costa la representa: roca arriba, una orilla poco profunda en medio y mar profundo abajo.',
    'Everything you see comes from a few simple rules for ground, water, sun and heat. There is no designer and no goal.':
      'Todo lo que ves sale de unas pocas reglas simples para el suelo, el agua, el sol y el calor. No hay diseñador ni objetivo.',
    'The sun': 'El sol',
    'The sun rises and sets. Light is strongest in shallow water and fades with depth. It is the first source of energy in this world.':
      'El sol sale y se pone. La luz es más fuerte en el agua poco profunda y se apaga con la profundidad. Es la primera fuente de energía de este mundo.',
    'Watch the bright band along the shore grow at noon and vanish at night.':
      'Mira cómo la franja brillante a lo largo de la orilla crece al mediodía y desaparece de noche.',
    'Heat from below': 'Calor desde abajo',
    'On the deep floor, hot vents leak heat and minerals from inside the planet. Many scientists think life may have started near vents like these, in the dark.':
      'En el fondo profundo, las fuentes hidrotermales dejan escapar calor y minerales del interior del planeta. Muchos científicos creen que la vida pudo empezar cerca de fuentes como estas, en la oscuridad.',
    'The vents are hot spots. Currents smear their heat into plumes.':
      'Las fuentes son puntos calientes. Las corrientes esparcen su calor en penachos.',
    'Tides and tide pools': 'Mareas y pozas de marea',
    'The sea rises and falls. When it falls, water is trapped in hollows of rock and starts to dry in the sun. Whatever is dissolved gets more concentrated.':
      'El mar sube y baja. Cuando baja, el agua queda atrapada en huecos de la roca y empieza a secarse al sol. Lo que está disuelto se concentra más.',
    'At low tide, look for small pools cut off from the sea along the shore. The next high tide floods them again.':
      'Con la marea baja, busca pozas pequeñas aisladas del mar a lo largo de la orilla. La siguiente marea alta las vuelve a inundar.',
    'Currents mix everything': 'Las corrientes lo mezclan todo',
    'Slow eddies and the tidal flow carry the water around. Nothing is pushed toward a goal; molecules just drift and spread.':
      'Remolinos lentos y el flujo de la marea mueven el agua de un lado a otro. Nada es empujado hacia un objetivo; las moléculas solo derivan y se dispersan.',
    'The pale streaks are currents. Follow one and see how far it carries things.':
      'Las estelas pálidas son corrientes. Sigue una y mira qué tan lejos lleva las cosas.',
    'Energy molecules': 'Moléculas de energía',
    'Sunlight in the shallows and heat at the vents turn simple dissolved molecules into energy-rich ones. They fall apart again if nothing uses them.':
      'La luz del sol en las aguas poco profundas y el calor de las fuentes convierten moléculas simples disueltas en moléculas ricas en energía. Se deshacen de nuevo si nada las usa.',
    'Energy appears in the sunlit shallows by day and near the vents all the time.':
      'La energía aparece en las aguas soleadas poco profundas de día y cerca de las fuentes todo el tiempo.',
    'Building blocks': 'Bloques',
    'Energy plus simple molecules make building blocks, a stand-in for amino acids and nucleotides. Warmth makes this faster.':
      'La energía más moléculas simples forman bloques, que representan a los aminoácidos y los nucleótidos. El calor lo acelera.',
    'Building blocks pile up where energy is made and the water is warm.':
      'Los bloques se acumulan donde se produce energía y el agua está tibia.',
    'Chains in drying pools': 'Cadenas en pozas que se secan',
    'Blocks join into chains, but water breaks chains apart. So chains build up where there is little water: in drying tide pools. Wet and dry cycles are one leading idea for how the first long molecules formed.':
      'Los bloques se unen en cadenas, pero el agua las rompe. Por eso las cadenas se acumulan donde hay poca agua: en las pozas de marea que se secan. Los ciclos de humedad y sequía son una de las ideas principales sobre cómo se formaron las primeras moléculas largas.',
    'Chains glow in pools at low tide and fade when the sea returns.':
      'Las cadenas brillan en las pozas con la marea baja y se desvanecen cuando el mar vuelve.',
    'Copiers: molecules that make more of themselves': 'Copiadores: moléculas que hacen más de sí mismas',
    'Very rarely, two chains make a copier: a molecule that helps build more of itself from blocks. Alone it dies out. With enough company, it spreads as self-copying patches.':
      'Muy de vez en cuando, dos cadenas forman un copiador: una molécula que ayuda a construir más de sí misma a partir de bloques. Solo, se extingue. Con suficiente compañía, se extiende en manchas que se copian a sí mismas.',
    'Copiers often appear and vanish many times before they take hold. Check the journal for "died out" and "arose again".':
      'Los copiadores suelen aparecer y desaparecer muchas veces antes de afianzarse. Busca en el diario "se extinguieron" y "surgieron de nuevo".',
    'Oils curl into bubbles': 'Los aceites se enroscan en burbujas',
    'Vents also make oily molecules. When oils crowd together they curl up into bubbles with a skin, the way soap does. A bubble traps whatever was dissolved around it.':
      'Las fuentes también producen moléculas aceitosas. Cuando los aceites se amontonan, se enroscan en burbujas con una piel, como hace el jabón. Una burbuja atrapa lo que estaba disuelto a su alrededor.',
    'Bubbles are the small rings near the vents.': 'Las burbujas son los anillos pequeños cerca de las fuentes.',
    'Protocells: bubbles that pass things on': 'Protocélulas: burbujas que heredan',
    'A bubble holding copiers pulls in oils faster, grows, and splits in two. Both halves share what was inside. Nothing tells bubbles to keep copiers, but those that do leave more daughters. That is heredity and selection, before life.':
      'Una burbuja con copiadores atrae aceites más rápido, crece y se divide en dos. Las dos mitades comparten lo que había adentro. Nada les dice a las burbujas que guarden copiadores, pero las que lo hacen dejan más hijas. Eso es herencia y selección, antes de la vida.',
    'Pink bubbles carry copiers. Watch the one you are following grow and split.':
      'Las burbujas rosadas llevan copiadores. Mira cómo la que sigues crece y se divide.',
    'Protocells became true cells: a skin, copiers that carry instructions, and machinery to eat and divide. Here they live on the same coast. Each green dot eats building blocks and energy, divides when it has stored enough and dies when it runs out.':
      'Las protocélulas se volvieron células verdaderas: una piel, copiadores que llevan instrucciones y maquinaria para comer y dividirse. Aquí viven en la misma costa. Cada punto verde come bloques y energía, se divide cuando ha guardado suficiente y muere cuando se le acaba.',
    'Within a day, cells crowd into the sunlit shallows and around the vents, where food is made. At night food runs short and many starve.':
      'En un día, las células se amontonan en las aguas soleadas poco profundas y alrededor de las fuentes, donde se produce la comida. De noche la comida escasea y muchas mueren de hambre.',
    'Motors: from drifting to swimming': 'Motores: de la deriva al nado',
    "The first cells were probably carried by the water. Bacteria later evolved the flagellum, a whip turned by a tiny protein motor. Here one gene sets how strong a cell's motor is. Swimming costs energy, but a cell that can leave a spot it has eaten bare reaches fresh food first.":
      'Las primeras células probablemente eran arrastradas por el agua. Más tarde las bacterias desarrollaron el flagelo, un látigo que gira gracias a un diminuto motor de proteínas. Aquí un gen define qué tan fuerte es el motor de una célula. Nadar cuesta energía, pero una célula que puede dejar un lugar que ya vació llega primero a comida fresca.',
    'Up close, the wavy tail is the flagellum, longer for a stronger motor. Watch the average "motor" gene rise from almost zero. The First cells lab shows that it settles at a best strength.':
      'De cerca, la cola ondulada es el flagelo, más larga cuanto más fuerte es el motor. Mira cómo el gen promedio "motor" sube desde casi cero. El lab de Primeras células muestra que se estabiliza en una fuerza óptima.',
    'Steering: following food, and light': 'Dirección: seguir la comida y la luz',
    'A motor alone moves a cell at random. Cells swim like bacteria: run straight while food gets richer, turn at random when it gets poorer. Cells here also gain a little energy from light, and an eyespot lets them turn toward light, and away when it is too strong, as the alga Chlamydomonas does. Each is a gene that can evolve.':
      'Un motor solo mueve a una célula al azar. Las células nadan como bacterias: avanzan en línea recta mientras la comida se vuelve más rica y giran al azar cuando se vuelve más pobre. Aquí las células también obtienen un poco de energía de la luz, y una mancha ocular les permite girar hacia la luz, y alejarse cuando es demasiado fuerte, como hace el alga Chlamydomonas. Cada una es un gen que puede evolucionar.',
    "The red dot at a cell's front is its eyespot. In \"Looking at\", compare the average genes at the start and now. Light sense pays only a little on this coast, where most food comes from the dark vents.":
      'El punto rojo al frente de una célula es su mancha ocular. En "Mirando", compara los genes promedio al inicio y ahora. Percibir la luz vale poco en esta costa, donde la mayor parte de la comida viene de las fuentes oscuras.',
    'Predators, and safety in numbers': 'Depredadores, y la seguridad del grupo',
    'Predators arrive: big red cells that swallow anything small. A daughter can stay stuck to its mother. A clump of four is too big to swallow, but clumped cells crowd each other for food. Experiments with real algae show predators can make single cells evolve clumps in a few hundred generations.':
      'Llegan los depredadores: grandes células rojas que se tragan todo lo pequeño. Una hija puede quedarse pegada a su madre. Un grupo de cuatro es demasiado grande para tragarlo, pero las células agrupadas compiten entre sí por la comida. Experimentos con algas reales muestran que los depredadores pueden hacer que células solas evolucionen grupos en unos pocos cientos de generaciones.',
    'Red cells hunting. Watch the share of cells in clumps, and the "sticks" gene, rise over a few days.':
      'Células rojas cazando. Mira cómo suben en unos días la proporción de células en grupos y el gen "se pega".',
    'A colony': 'Una colonia',
    'Cells in a colony stay bonded and can pass energy to hungry neighbours. They are still all the same: each one eats, swims and divides.':
      'Las células de una colonia permanecen unidas y pueden pasar energía a vecinas hambrientas. Todavía son todas iguales: cada una come, nada y se divide.',
    'Lines between cells are bonds. Big clumps sometimes break apart, and each piece lives on.':
      'Las líneas entre células son uniones. Los grupos grandes a veces se rompen, y cada pedazo sigue viviendo.',
    'Bodies: cells take on roles': 'Cuerpos: las células asumen roles',
    'In a body, inner cells become germ cells (pink) that feed and divide but never move. Outer cells become contracting cells (yellow) that never divide. Contracting cells grow old and die: the first cells that live only for the body.':
      'En un cuerpo, las células de adentro se vuelven células germinales (rosadas) que se alimentan y se dividen pero nunca se mueven. Las de afuera se vuelven células contráctiles (amarillas) que nunca se dividen. Las contráctiles envejecen y mueren: las primeras células que viven solo para el cuerpo.',
    'A full body lets a germ cell go. That seed cell grows into a new body, the way plants and animals start from one cell.':
      'Un cuerpo completo suelta una célula germinal. Esa célula semilla crece hasta formar un cuerpo nuevo, igual que las plantas y los animales empiezan a partir de una sola célula.',
    'The first muscles: squeezing together': 'Los primeros músculos: contraerse juntas',
    "Each contracting cell squeezes on its own rhythm, using the same kind of protein fibres (actin and myosin) that later fill our muscles. One cell squeezing alone just makes the water slosh. The body only moves when its contracting cells squeeze at the same moment. Cells linked through the body pull each other's rhythm into step, as the coupled skin cells of Hydra do.":
      'Cada célula contráctil se contrae a su propio ritmo, usando el mismo tipo de fibras de proteína (actina y miosina) que después llenan nuestros músculos. Una célula que se contrae sola solo agita el agua. El cuerpo solo se mueve cuando sus células contráctiles se contraen en el mismo momento. Las células conectadas a través del cuerpo arrastran el ritmo de las demás hasta sincronizarse, como hacen las células acopladas de la piel de la hidra.',
    'Orange means squeezing right now. Watch a body: do its contracting cells flash together, or one by one? "Looking at" shows how in step they are. The Bodies lab compares bodies with and without the link.':
      'Naranja significa que se está contrayendo ahora mismo. Mira un cuerpo: ¿sus células contráctiles destellan juntas o una por una? "Mirando" muestra qué tan sincronizadas están. El lab de Cuerpos compara cuerpos con y sin la conexión.',
    'Some outer cells become nerve cells (violet). When a cell tastes richer food than the rest of its body, it fires. Nerve cells pass the signal across the body, and each contracting cell it reaches starts a squeeze toward the food, so they squeeze together. There is no centre: a net, like in Hydra and jellyfish.':
      'Algunas células de afuera se vuelven células nerviosas (violetas). Cuando una célula percibe comida más rica que el resto de su cuerpo, se dispara. Las células nerviosas pasan la señal por todo el cuerpo, y cada célula contráctil a la que llega empieza a contraerse hacia la comida, así que se contraen juntas. No hay centro: es una red, como en la hidra y las medusas.',
    'White flashes are cells firing. Bodies with nerve cells turn toward food together; bodies without them drift.':
      'Los destellos blancos son células disparando. Los cuerpos con células nerviosas giran juntos hacia la comida; los que no las tienen van a la deriva.',
    'Bodies with an eye and a brain': 'Cuerpos con un ojo y un cerebro',
    'Hundreds of millions of years later, animals have bodies, eyes and brains. These creatures see green and violet plants. One colour is food, the other poison, and nobody tells them which.':
      'Cientos de millones de años después, los animales tienen cuerpos, ojos y cerebros. Estas criaturas ven plantas verdes y violetas. Un color es comida, el otro veneno, y nadie les dice cuál.',
    'Creatures are the arrows. Plants are green or violet dots on drifting fertile soil.':
      'Las criaturas son las flechas. Las plantas son puntos verdes o violetas sobre suelo fértil que se desplaza.',
    'Follow one creature': 'Sigue a una criatura',
    'Each creature carries a small spiking brain that wires itself while it lives and learns from what it eats. Its genes set how the brain is built, never what it knows.':
      'Cada criatura lleva un pequeño cerebro de impulsos que se conecta solo mientras vive y aprende de lo que come. Sus genes definen cómo se construye el cerebro, nunca lo que sabe.',
    'The fan in front of it is its eye. Watch whether it bites food and avoids poison.':
      'El abanico delante de ella es su ojo. Mira si muerde la comida y evita el veneno.',
    'Inside the body, brain and cells': 'Dentro del cuerpo, el cerebro y las células',
    'Zoom into the creature. Senses feed the brain and the brain drives the muscles. Click the brain to see neurons fire, then click any neuron to meet a single cell.':
      'Acércate a la criatura. Los sentidos alimentan al cerebro y el cerebro mueve los músculos. Haz clic en el cerebro para ver disparar a las neuronas, y luego haz clic en cualquier neurona para conocer una sola célula.',
    'Close the inside view to come back to the world.': 'Cierra la vista interior para volver al mundo.',
    'Add hunters, and plant eaters must see them and flee. Chases, booms, crashes and extinctions emerge from nothing but local rules, as in the Cambrian seas.':
      'Agrega cazadores, y los herbívoros tienen que verlos y huir. Persecuciones, auges, colapsos y extinciones surgen solo de reglas locales, como en los mares del Cámbrico.',
    'Red arrows are hunters. Watch how the numbers of hunters and prey rise and fall together.':
      'Las flechas rojas son cazadores. Mira cómo el número de cazadores y de presas sube y baja a la par.',
  };

  // Genes shown for each chapter, in the order viewer.js lists them.
  const GENE = {
    speed: ['motor', 'motor'], tumble: ['follows food', 'sigue comida'], eyespot: ['eyespot', 'mancha ocular'],
    stick: ['sticks', 'se pega'], share: ['shares food', 'comparte comida'], specialise: ['takes a role', 'asume un rol'],
    nerve: ['becomes nerve', 'se vuelve nervio'], sync: ['beats in step', 'late al compás'],
  };
  const STAGE_GENES = [
    ['speed', 'tumble', 'eyespot'], ['stick', 'share', 'tumble'],
    ['specialise', 'sync', 'stick'], ['nerve', 'specialise', 'speed'],
  ];
  for (const gs of STAGE_GENES) {
    // One cell: "motor <b>0.12</b> · ..."
    d[gs.map((g, i) => `${GENE[g][0]} <b>{v${i}}</b>`).join(' · ')] = gs.map((g, i) => `${GENE[g][1]} <b>{v${i}}</b>`).join(' · ');
    // Averages: "motor 0.01 → <b>0.12</b> · ..."
    d[gs.map((g, i) => `${GENE[g][0]} {a${i}} → <b>{b${i}}</b>`).join(' · ')] = gs.map((g, i) => `${GENE[g][1]} {a${i}} → <b>{b${i}}</b>`).join(' · ');
  }

  // The group line under a followed cell: "Body of <b>7</b> cells: 3 contracting, 4 germ · too big to swallow".
  // In Spanish the number goes after the word ("germinales: 1"), so it reads right for 1 too.
  const PARTS = [['contracting', 'contráctiles'], ['germ', 'germinales'], ['nerve', 'nerviosas'], ['without a role', 'sin rol']];
  const lists = [['', '']];
  for (let mask = 1; mask < 16; mask++) {
    const en = [], es = [];
    PARTS.forEach(([e, s], i) => { if (mask & (1 << i)) { en.push(`{n${i}} ${e}`); es.push(`${s} {n${i}}`); } });
    lists.push([': ' + en.join(', '), ': ' + es.join(', ')]);
  }
  for (const [g, gs] of [['Colony', 'Colonia'], ['Body', 'Cuerpo']]) {
    for (const [le, ls] of lists) {
      for (const [be, bs] of [['', ''], [' · too big to swallow', ' · demasiado grande para tragarla']]) {
        const big = g === 'Body' ? bs.replace('tragarla', 'tragarlo') : bs;
        d[`${g} of <b>{m}</b> cells${le}${be}`] = `${gs} de <b>{m}</b> células${ls}${big}`;
      }
    }
  }

  I18N.add(d);
})();
