// Spanish: first-cells.
// environments/first-cells/ (page, app, draw, guided lab; app.js also runs the
// Bodies page) and lib/life.js (also used by the World Viewer).
I18N.add({
  // ---------- Page ----------
  'First Cells': 'Primeras células',
  'First cells: learning to move': 'Primeras células: aprender a moverse',
  'Timeline of life · Chapter 1': 'Línea de tiempo de la vida · Capítulo 1',
  'The Early Earth coast, now with cells. They start with no working motor and no light sense: currents carry them. Each daughter copies its genes with small mistakes. Watch whether motors, steering toward food and an eyespot for light evolve, and compare worlds where one of them is switched off. Zoom in close to see each cell\'s flagellum and eyespot.':
    'La costa de la Tierra primitiva, ahora con células. Empiezan sin un motor que funcione y sin sentido de la luz: las corrientes las arrastran. Cada hija copia sus genes con pequeños errores. Mira si evolucionan los motores, la capacidad de dirigirse hacia la comida y una mancha ocular para la luz, y compara mundos donde una de esas cosas está apagada. Acerca mucho el zoom para ver el flagelo y la mancha ocular de cada célula.',
  'What is real here, and what is simplified': 'Qué es real aquí y qué está simplificado',
  '<b>Motors.</b> The first cells were probably carried by water, like the cells here at the start. Bacteria later evolved the flagellum, a rotating tail turned by a protein motor, and swim by "run and tumble": keep going while things improve, turn at random when they get worse (Berg, E. coli). Here one gene sets how strong a cell\'s motor is. Swimming costs energy, more the faster you go.':
    '<b>Motores.</b> Las primeras células probablemente eran arrastradas por el agua, como las de aquí al principio. Más tarde, las bacterias evolucionaron el flagelo, una cola giratoria movida por un motor de proteínas, y nadan con "avance y giro": siguen adelante mientras las cosas mejoran y giran al azar cuando empeoran (Berg, E. coli). Aquí un gen fija la fuerza del motor de una célula. Nadar cuesta energía, y más cuanto más rápido vas.',
  '<b>Steering.</b> A motor alone just moves a cell at random. The "follows food" gene sets how much a cell holds its course while food gets richer: chemotaxis. It only helps a cell that can swim, so compare a world without motors.':
    '<b>Dirección.</b> Un motor por sí solo mueve a una célula al azar. El gen "sigue la comida" fija cuánto mantiene una célula su rumbo mientras la comida se vuelve más abundante: quimiotaxis. Solo ayuda a una célula que puede nadar, así que compara con un mundo sin motores.',
  '<b>Light.</b> Cells here carry a simple pigment and gain a little energy from light, as early phototrophs did. The eyespot gene lets a cell tell where light comes from and turn toward it, and away again when light is too strong, as the alga Chlamydomonas does. Real eyespots belong to later single cells (algae, about 1.5 billion years ago); bacteria sense light with simpler pigments. Here they share one gene for simplicity.':
    '<b>Luz.</b> Aquí las células llevan un pigmento sencillo y obtienen un poco de energía de la luz, como los primeros fotótrofos. El gen de la mancha ocular le permite a una célula saber de dónde viene la luz y girar hacia ella, y alejarse cuando la luz es demasiado fuerte, como hace el alga Chlamydomonas. Las manchas oculares reales aparecieron en células solitarias posteriores (algas, hace unos 1500 millones de años); las bacterias detectan la luz con pigmentos más simples. Aquí comparten un solo gen para simplificar.',
  '<b>Muscles.</b> A single cell has no muscle, but it has the same kind of parts: protein motors and fibres that pull. Muscle cells came much later, in animals, by putting those parts into cells that pull together. In the World Viewer, the Bodies and Nerve nets chapters show cells with that job.':
    '<b>Músculos.</b> Una célula sola no tiene músculo, pero tiene el mismo tipo de piezas: motores de proteínas y fibras que tiran. Las células musculares llegaron mucho después, en los animales, al reunir esas piezas en células que tiran juntas. En el Visor del mundo, los capítulos Cuerpos y Redes nerviosas muestran células con ese trabajo.',
  '<b>Simplified.</b> One map cell is far bigger than a real cell, time runs much faster, the chemistry is made up (see Early Earth), and cells feel only a quarter of the current, as if they live near the floor. The genes are numbers, not DNA.':
    '<b>Simplificado.</b> Una casilla del mapa es mucho más grande que una célula real, el tiempo corre mucho más rápido, la química es inventada (ver Tierra primitiva) y las células sienten solo una cuarta parte de la corriente, como si vivieran cerca del fondo. Los genes son números, no ADN.',
  'Click a cell to follow it.': 'Haz clic en una célula para seguirla.',

  // ---------- Worlds (app.js, First cells) ----------
  'Free to evolve': 'Libre para evolucionar',
  'Start with strong motors': 'Empiezan con motores fuertes',
  'No motors': 'Sin motores',
  'No eyespots': 'Sin manchas oculares',
  'No food from light': 'Sin alimento de la luz',
  'Motor': 'Motor',
  'Follows food': 'Sigue la comida',
  'Eyespot': 'Mancha ocular',
  'Light found (by day)': 'Luz encontrada (de día)',
  'Cells': 'Células',
  'Average motor strength. Everyone starts near zero.': 'Fuerza media del motor. Todas empiezan cerca de cero.',
  'How much cells hold course while food improves. It only matters for cells that can swim.': 'Cuánto mantienen el rumbo las células mientras la comida mejora. Solo importa para las células que pueden nadar.',
  'Average eyespot gene. Genes that do nothing still wander, so compare with a world where they matter.': 'Valor medio del gen de la mancha ocular. Los genes que no hacen nada igual van a la deriva, así que compara con un mundo donde sí importan.',
  'Light where the cells are, compared with light in the water on average (1 = no better than drifting). Daytime only.': 'Luz donde están las células, comparada con la luz media del agua (1 = no mejor que ir a la deriva). Solo de día.',
  'Number of cells. The coast holds at most 900.': 'Número de células. La costa admite como máximo 900.',
  'Generations': 'Generaciones',
  'Starved': 'De hambre',
  'Stranded': 'Varadas',
  'Cooked': 'Cocidas',
  // Inspector, First cells
  'Cell #{id}': 'Célula n.º {id}',
  '<b>Cell #{id}</b> died. Click another cell.': '<b>Célula n.º {id}</b> murió. Haz clic en otra célula.',
  '· {role} · generation': '· {role} · generación',
  '· age {a} · energy {e} · {k} daughters': '· edad {a} · energía {e} · {k} hijas',
  'motor': 'motor',
  '· follows food': '· sigue la comida',
  '· eyespot': '· mancha ocular',
  '· divides at {d} · light here {l}': '· se divide en {d} · luz aquí {l}',
  '{t} · following cell #{id}': '{t} · siguiendo la célula n.º {id}',

  // ---------- Worlds (app.js, Bodies) ----------
  'Linked rhythm': 'Ritmo enlazado',
  'Each cell on its own rhythm': 'Cada célula con su propio ritmo',
  'No roles': 'Sin funciones',
  'In step': 'En sincronía',
  'Body speed': 'Velocidad del cuerpo',
  'Linking gene': 'Gen de enlace',
  'Takes a role': 'Toma una función',
  'How together the contracting cells of each body squeeze, on average (1 = all at once). A few cells on random rhythms still score about 0.5.':
    'Qué tan juntas se contraen, en promedio, las células contráctiles de cada cuerpo (1 = todas a la vez). Unas pocas células con ritmos al azar igual dan alrededor de 0.5.',
  'How fast bodies push themselves along, on average, not counting the current.': 'Qué tan rápido se impulsan los cuerpos, en promedio, sin contar la corriente.',
  'Average "sync" gene: how strongly a contracting cell falls into step with the rest of its body.': 'Valor medio del gen "sync": con cuánta fuerza una célula contráctil se sincroniza con el resto de su cuerpo.',
  'Average "specialise" gene: the chance that a cell in a body takes a role.': 'Valor medio del gen "specialise": la probabilidad de que una célula de un cuerpo tome una función.',
  'Bodies with roles': 'Cuerpos con funciones',
  'Contracting cells': 'Células contráctiles',
  'Germ cells': 'Células germinales',
  'Predators': 'Depredadores',
  // Inspector, Bodies
  'body of': 'cuerpo de',
  ': {a} contracting, {b} germ, {c} without a role': ': {a} contráctiles, {b} germinales, {c} sin función',
  ': {a} contracting, {b} germ, {c} without a role · in step': ': {a} contráctiles, {b} germinales, {c} sin función · sincronía',
  'contracting now': 'contrayéndose ahora',
  '· linking gene': '· gen de enlace',
  'resting · linking gene': 'en reposo · gen de enlace',
  'linking gene': 'gen de enlace',
  '· takes a role {r} · sticks {s}': '· toma una función {r} · adherencia {s}',

  // ---------- lib/life.js ----------
  'single cell': 'célula suelta',
  'colony cell': 'célula de colonia',
  'contracting cell': 'célula contráctil',
  'germ cell': 'célula germinal',
  'nerve cell': 'célula nerviosa',
  'A body\'s own cells grow old and die': 'Las células de un cuerpo envejecen y mueren',
  'A contracting cell in a body wore out and died, while the germ cells inside live on and make new cells. Bodies made of cells that cannot pass on their genes are a big step in the history of life.':
    'Una célula contráctil de un cuerpo se desgastó y murió, mientras las células germinales de adentro siguen vivas y hacen células nuevas. Los cuerpos hechos de células que no pueden transmitir sus genes son un gran paso en la historia de la vida.',
  'All cells died': 'Murieron todas las células',
  'Every cell starved or was eaten. Restart the chapter or change the speed to see another history.': 'Todas las células murieron de hambre o fueron devoradas. Reinicia el capítulo o cambia la velocidad para ver otra historia.',
  'A body released a seed cell': 'Un cuerpo soltó una célula semilla',
  'A germ cell inside a full body let go of a daughter. It will grow into a new body of its own: reproduction through a single cell, as in plants and animals.':
    'Una célula germinal dentro de un cuerpo completo soltó a una hija. Crecerá hasta formar un cuerpo nuevo propio: reproducción a partir de una sola célula, como en plantas y animales.',
  'The population doubled': 'La población se duplicó',
  'Cells found the places where food is made (sunlit shallows and warm water near the vents) and multiplied there.':
    'Las células encontraron los lugares donde se produce comida (aguas someras soleadas y agua tibia cerca de las fuentes hidrotermales) y se multiplicaron allí.',
  'A family line reached 20 generations': 'Un linaje llegó a 20 generaciones',
  'Twenty divisions in a row. Each time the genes copy with small mistakes, so the population slowly changes.':
    'Veinte divisiones seguidas. Cada vez los genes se copian con pequeños errores, así que la población cambia poco a poco.',
  'Motors evolved': 'Evolucionaron los motores',
  'The average motor gene rose from {a} to {b}. Cells that swim a little reach fresh food before it is eaten or carried off, and leave more daughters, even though swimming costs energy.':
    'El valor medio del gen del motor subió de {a} a {b}. Las células que nadan un poco llegan a la comida fresca antes de que se la coman o se la lleve la corriente, y dejan más hijas, aunque nadar cueste energía.',
  'Cells learned to follow food (by evolution)': 'Las células aprendieron a seguir la comida (por evolución)',
  'The average "follows food" gene rose from {a} to {b}. Cells now keep swimming while food gets richer and turn when it gets poorer: chemotaxis, the oldest way of finding food. Nobody designed it; cells that did it ate more and left more daughters.':
    'El valor medio del gen "sigue la comida" subió de {a} a {b}. Ahora las células siguen nadando mientras la comida se vuelve más abundante y giran cuando escasea: quimiotaxis, la forma más antigua de encontrar comida. Nadie la diseñó; las células que lo hacían comían más y dejaban más hijas.',
  'First clump of four': 'Primer grupo de cuatro',
  'Four cells stayed stuck together after dividing. A clump this size is too big for the predators to swallow.':
    'Cuatro células se quedaron pegadas después de dividirse. Un grupo de este tamaño es demasiado grande para que los depredadores se lo traguen.',
  'Sticking together spread': 'Se extendió el quedarse pegadas',
  'The average "stick" gene rose from {a} to {b}. With predators around, cells that stay together survive; single cells get eaten.':
    'El valor medio del gen "stick" subió de {a} a {b}. Con depredadores cerca, las células que se mantienen juntas sobreviven; las células sueltas son devoradas.',
  'Most cells now live in colonies': 'La mayoría de las células ya vive en colonias',
  '{p}% of cells are in clumps. Remove the predators (switch to First cells) and sticking stops paying.':
    'El {p}% de las células está en grupos. Quita los depredadores (cambia a Primeras células) y quedarse pegadas deja de compensar.',
  'First division of labour': 'Primera división del trabajo',
  'In one clump, outer cells became contracting cells that never divide and inner cells became germ cells that divide but never move. Each does one job.':
    'En un grupo, las células de afuera se volvieron células contráctiles que nunca se dividen, y las de adentro se volvieron células germinales que se dividen pero nunca se mueven. Cada una hace un solo trabajo.',
  'A body squeezes in step': 'Un cuerpo se contrae en sincronía',
  '{n} contracting cells in one body now squeeze at the same moment. Nobody sets the beat: each cell nudges its rhythm toward the rest of its body, and the body falls into step, like fireflies flashing together. In step, their pushes add up and the body moves.':
    '{n} células contráctiles de un cuerpo ahora se contraen en el mismo momento. Nadie marca el compás: cada célula acerca su ritmo al del resto de su cuerpo, y el cuerpo se sincroniza, como luciérnagas que destellan a la vez. En sincronía, sus empujes se suman y el cuerpo se mueve.',
  'Specialising spread': 'Se extendió la especialización',
  'The average "specialise" gene rose from {a} to {b}. Bodies whose cells split the work move and grow at once, and leave more seed cells.':
    'El valor medio del gen "specialise" subió de {a} a {b}. Los cuerpos cuyas células se reparten el trabajo se mueven y crecen a la vez, y dejan más células semilla.',
  'First nerve cell': 'Primera célula nerviosa',
  'An outer cell became a nerve cell: it passes signals on to its neighbours. Alone it does little.':
    'Una célula de afuera se volvió célula nerviosa: pasa señales a sus vecinas. Sola hace poco.',
  'Bodies with nerve nets': 'Cuerpos con redes nerviosas',
  '{n} bodies now carry nerve cells. When one side tastes richer food, the signal spreads and movers on the other side push the same way, so the whole body swims toward food.':
    '{n} cuerpos ya llevan células nerviosas. Cuando un lado detecta comida más abundante, la señal se propaga y las células motoras del otro lado empujan en la misma dirección, así que todo el cuerpo nada hacia la comida.',
  'Nerve cells spread': 'Se extendieron las células nerviosas',
  'The average "nerve" gene rose from {a} to {b}. Coordinated bodies reach food first.':
    'El valor medio del gen "nerve" subió de {a} a {b}. Los cuerpos coordinados llegan primero a la comida.',
  'The predators won': 'Ganaron los depredadores',
  'Every cell was eaten or starved. Try again: the history will be different.': 'Todas las células fueron devoradas o murieron de hambre. Inténtalo de nuevo: la historia será distinta.',

  // ---------- Guided lab: How did cells start to move? ----------
  'How did cells start to move?': '¿Cómo empezaron a moverse las células?',
  'Why would a drifting cell evolve a motor, and how strong should it be?': '¿Por qué una célula a la deriva evolucionaría un motor, y qué tan fuerte debería ser?',
  'Cell': 'Célula',
  'Population': 'Población',
  'Cell again': 'Célula otra vez',
  'Three coasts, three kinds of cell': 'Tres costas, tres tipos de célula',
  'Left: cells start with <b>almost no motor</b>; currents carry them. Middle: the same cells, but they start with <b>strong motors</b>. Right: <b>no motors at all</b>, ever. Same coast, sun and vents in all three. Every daughter copies its parent\'s genes with small mistakes, and nothing else decides the genes but who leaves daughters.':
    'Izquierda: las células empiezan <b>casi sin motor</b>; las corrientes las arrastran. Centro: las mismas células, pero empiezan con <b>motores fuertes</b>. Derecha: <b>sin ningún motor</b>, nunca. La misma costa, el mismo sol y las mismas fuentes hidrotermales en las tres. Cada hija copia los genes de su madre con pequeños errores, y lo único que decide los genes es quién deja hijas.',
  'Zoom into a cell on the left and in the middle': 'Acércate a una célula a la izquierda y en el centro',
  'This lab needs three worlds. Restart it from Guided labs.': 'Este lab necesita tres mundos. Reinícialo desde Labs guiados.',
  'Average motor now: <b>{a}</b> left, <b>{b}</b> middle, <b>{c}</b> right. The wavy tail is the flagellum: longer for a stronger motor.':
    'Motor medio ahora: <b>{a}</b> a la izquierda, <b>{b}</b> en el centro, <b>{c}</b> a la derecha. La cola ondulada es el flagelo: más larga cuanto más fuerte es el motor.',
  'Weak motors grow, strong motors shrink': 'Los motores débiles crecen, los fuertes se encogen',
  'Watch the chart. A motor lets a cell leave a spot it has eaten bare and reach fresh food before the current takes it away. But swimming costs energy, and the cost rises fast with speed. So the left world should climb and the middle world should fall.':
    'Mira la gráfica. Un motor le permite a una célula dejar un lugar donde ya se acabó la comida y llegar a comida fresca antes de que la corriente se la lleve. Pero nadar cuesta energía, y el costo sube rápido con la velocidad. Así que el mundo de la izquierda debería subir y el del centro debería bajar.',
  'Waiting for the two lines to meet. This takes about five days on Fast-forward.': 'Esperando a que las dos líneas se junten. Tarda unos cinco días en Avance rápido.',
  'Motor: <b>{a}</b> left (started near 0), <b>{b}</b> middle (started near 0.25). Generations so far: {c} and {d}.':
    'Motor: <b>{a}</b> a la izquierda (empezó cerca de 0), <b>{b}</b> en el centro (empezó cerca de 0.25). Generaciones hasta ahora: {c} y {d}.',
  'A motor needs steering': 'Un motor necesita dirección',
  'A motor alone moves a cell at random. The <b>follows food</b> gene sets how long a cell keeps its course while food is getting richer (run and tumble, like E. coli). It can only help a cell that swims. On the right, where nobody swims, the gene does nothing, so it just wanders by chance.':
    'Un motor por sí solo mueve a una célula al azar. El gen <b>sigue la comida</b> fija cuánto tiempo mantiene una célula su rumbo mientras la comida se vuelve más abundante (avance y giro, como E. coli). Solo puede ayudar a una célula que nada. A la derecha, donde nadie nada, el gen no hace nada, así que solo va a la deriva por azar.',
  'Follows food: <b>{a}</b> left, <b>{b}</b> middle, <b>{c}</b> right. It tends to rise more where cells swim; in our test runs the gap was clear on some coasts and small on others.':
    'Sigue la comida: <b>{a}</b> a la izquierda, <b>{b}</b> en el centro, <b>{c}</b> a la derecha. Tiende a subir más donde las células nadan; en nuestras pruebas la diferencia fue clara en algunas costas y pequeña en otras.',
  'Light': 'Luz',
  'These cells also gain a little energy from light. The <b>eyespot</b> gene lets a cell tell where light comes from and turn toward it, and away when light is too strong (so it does not get stranded on the shallowest rock). The map now shows light. The chart compares light where the cells are with light in the water on average: above 1 means cells are finding light.':
    'Estas células también obtienen un poco de energía de la luz. El gen de la <b>mancha ocular</b> le permite a una célula saber de dónde viene la luz y girar hacia ella, y alejarse cuando es demasiado fuerte (para no quedar varada en la roca menos profunda). Ahora el mapa muestra la luz. La gráfica compara la luz donde están las células con la luz media del agua: por encima de 1 significa que las células están encontrando luz.',
  'Show light on all three maps': 'Muestra la luz en los tres mapas',
  'Eyespot: <b>{a}</b> left, {b} right. Light found (by day): <b>{c}</b> left, <b>{d}</b> right. Most food on this coast comes from the vents, in the dark, so light sense pays only a little here.':
    'Mancha ocular: <b>{a}</b> a la izquierda, {b} a la derecha. Luz encontrada (de día): <b>{c}</b> a la izquierda, <b>{d}</b> a la derecha. La mayor parte de la comida de esta costa viene de las fuentes hidrotermales, en la oscuridad, así que aquí sentir la luz compensa solo un poco.',
  'Back to one cell': 'De vuelta a una célula',
  'Here is one of the strongest swimmers on the left. Its tail beats while it swims; the red dot at its front is its eyespot. Its ancestors, a few days ago, had neither. Set Speed to Slow to watch it run and tumble.':
    'Esta es una de las mejores nadadoras de la izquierda. Su cola se agita mientras nada; el punto rojo de su frente es su mancha ocular. Sus antepasadas, hace unos días, no tenían ninguna de las dos cosas. Pon la Velocidad en Lenta para verla avanzar y girar.',
  'Follow the fastest swimmer on the left': 'Sigue a la nadadora más rápida de la izquierda',
  'Press the button to find a cell.': 'Presiona el botón para encontrar una célula.',
  'That cell has died. Press the button again for another.': 'Esa célula murió. Presiona el botón otra vez para buscar otra.',
  'Cell #{id}, generation {g}: motor <b>{m}</b>, follows food <b>{f}</b>, eyespot <b>{e}</b>.':
    'Célula n.º {id}, generación {g}: motor <b>{m}</b>, sigue la comida <b>{f}</b>, mancha ocular <b>{e}</b>.',
  'Weak motors grew and strong motors shrank, until both coasts had about the same motor. What does that tell you?':
    'Los motores débiles crecieron y los fuertes se encogieron, hasta que las dos costas tuvieron más o menos el mismo motor. ¿Qué te dice eso?',
  'Cells try to swim at a comfortable speed.': 'Las células intentan nadar a una velocidad cómoda.',
  'Cells have no aims. A gene changes only because the cells carrying some versions of it leave more daughters than others.':
    'Las células no tienen metas. Un gen cambia solo porque las células que llevan algunas versiones de él dejan más hijas que otras.',
  'There is a best strength for this coast: weaker motors miss food, stronger ones burn more energy than they win.':
    'Hay una fuerza óptima para esta costa: los motores más débiles no alcanzan la comida y los más fuertes gastan más energía de la que ganan.',
  'Selection pushed from both sides toward the same value. Change the coast (more food, stronger currents) and the best motor would change too.':
    'La selección empujó desde los dos lados hacia el mismo valor. Cambia la costa (más comida, corrientes más fuertes) y el mejor motor también cambiaría.',
  'Mutations push every gene toward the middle.': 'Las mutaciones empujan cada gen hacia el medio.',
  'Mutations here go up and down equally. The right world shows what chance alone does: the useless "follows food" gene wanders, it is not pulled anywhere in particular.':
    'Aquí las mutaciones suben y bajan por igual. El mundo de la derecha muestra lo que hace el azar solo: el gen inútil "sigue la comida" va a la deriva, no lo empuja nada hacia ningún lugar en particular.',
});
