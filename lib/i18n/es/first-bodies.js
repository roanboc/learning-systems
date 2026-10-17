// Spanish: first-bodies.
// environments/first-bodies/ (page and guided lab). The page runs
// environments/first-cells/app.js and lib/life.js: see first-cells.js.
I18N.add({
  // ---------- Page ----------
  'First Bodies': 'Primeros cuerpos',
  'Timeline of life · Chapter 3': 'Línea de tiempo de la vida · Capítulo 3',
  'Bodies: the first muscles': 'Cuerpos: los primeros músculos',
  'The same coast, with bodies of stuck-together cells. Outer cells can become contracting cells: each squeezes on its own rhythm, and a body only moves when they squeeze together. Watch the orange flashes fall into step, and compare bodies whose cells are linked with bodies whose cells each keep their own beat. Zoom right into a body to watch it squeeze.':
    'La misma costa, con cuerpos de células pegadas entre sí. Las células de afuera pueden volverse células contráctiles: cada una se contrae a su propio ritmo, y un cuerpo solo se mueve cuando se contraen juntas. Mira cómo los destellos naranjas se sincronizan, y compara cuerpos cuyas células están enlazadas con cuerpos cuyas células llevan cada una su propio compás. Acerca el zoom hasta un cuerpo para verlo contraerse.',
  '<b>Contraction.</b> Cells squeeze with fibres of two proteins, actin and myosin, that slide past each other. Single cells already had them, long before animals. Muscle cells are cells that do little else.':
    '<b>Contracción.</b> Las células se contraen con fibras de dos proteínas, actina y miosina, que se deslizan una sobre otra. Las células solitarias ya las tenían, mucho antes que los animales. Las células musculares son células que hacen poco más que eso.',
  '<b>The first muscle-like cells.</b> In sponges, cells on the surface can contract slowly. In Hydra and jellyfish, the skin cells themselves carry contractile fibres (epitheliomuscular cells), and they are linked by gap junctions, so electrical changes spread from cell to cell. Here, a contracting cell nudges its rhythm toward the rest of its body, as strongly as its "sync" gene says. That is the Kuramoto model of coupled rhythms, the same maths as fireflies flashing together.':
    '<b>Las primeras células parecidas a músculos.</b> En las esponjas, las células de la superficie pueden contraerse despacio. En la hidra y las medusas, las propias células de la piel llevan fibras contráctiles (células epiteliomusculares) y están enlazadas por uniones gap, así que los cambios eléctricos pasan de célula a célula. Aquí, una célula contráctil acerca su ritmo al del resto de su cuerpo, con la fuerza que indica su gen "sync". Es el modelo de Kuramoto de ritmos acoplados, las mismas matemáticas que las de las luciérnagas que destellan a la vez.',
  '<b>Why together.</b> A body pushes water to move. Squeezes that come one after another mostly slosh the water around inside; squeezes at the same moment push it out. Here, a body\'s push is scaled by how in step its contracting cells are (squared), so a body in step moves about twice as fast as one out of step.':
    '<b>Por qué juntas.</b> Un cuerpo empuja agua para moverse. Las contracciones que llegan una tras otra sobre todo agitan el agua por dentro; las contracciones en el mismo momento la expulsan. Aquí, el empuje de un cuerpo se escala según qué tan sincronizadas están sus células contráctiles (al cuadrado), así que un cuerpo sincronizado se mueve unas dos veces más rápido que uno desincronizado.',
  '<b>What we found.</b> Linked bodies fall into step within a few beats and move about twice as fast as unlinked ones. Whether the linking gene itself spreads by evolution is unclear: it rose on some coasts and fell on others in our test runs, because on this coast food is often plentiful and moving faster does not always pay.':
    '<b>Lo que encontramos.</b> Los cuerpos enlazados se sincronizan en pocos latidos y se mueven unas dos veces más rápido que los no enlazados. No está claro si el gen de enlace se extiende por evolución: en nuestras pruebas subió en algunas costas y bajó en otras, porque en esta costa la comida suele abundar y moverse más rápido no siempre compensa.',
  '<b>Simplified.</b> Contracting cells sit on the outside of a body and never divide. All of a body\'s contracting cells push the same way (the way its oldest cell is heading). Real early animals were bigger, softer and slower. The genes are numbers, not DNA.':
    '<b>Simplificado.</b> Las células contráctiles están en la parte de afuera de un cuerpo y nunca se dividen. Todas las células contráctiles de un cuerpo empujan en la misma dirección (hacia donde va su célula más vieja). Los primeros animales reales eran más grandes, más blandos y más lentos. Los genes son números, no ADN.',

  // ---------- Guided lab: Why do muscles beat together? ----------
  'Why do muscles beat together?': '¿Por qué los músculos laten juntos?',
  'Every contracting cell pushes just as hard on both coasts. Why does one kind of body move faster?':
    'Cada célula contráctil empuja con la misma fuerza en las dos costas. ¿Por qué un tipo de cuerpo se mueve más rápido?',
  'Body': 'Cuerpo',
  'Two coasts, one difference': 'Dos costas, una diferencia',
  'Both coasts hold the same small bodies: cells that stuck together after dividing. Some cells in a body take a role: <b>contracting cells</b> squeeze and pull their neighbours closer, and that pushes the body along. Left: each contracting cell <b>feels its neighbours</b> and falls into their rhythm (like the gap junctions that link real muscle cells). Right: each one keeps <b>its own rhythm</b>.':
    'Las dos costas tienen los mismos cuerpos pequeños: células que se quedaron pegadas después de dividirse. Algunas células de un cuerpo toman una función: las <b>células contráctiles</b> se contraen y acercan a sus vecinas, y eso impulsa al cuerpo. Izquierda: cada célula contráctil <b>siente a sus vecinas</b> y se une a su ritmo (como las uniones gap que enlazan las células musculares reales). Derecha: cada una mantiene <b>su propio ritmo</b>.',
  'Zoom into a body on each coast': 'Acércate a un cuerpo en cada costa',
  'This lab needs two worlds. Restart it from Guided labs.': 'Este lab necesita dos mundos. Reinícialo desde Labs guiados.',
  'Contracting cells: <b>{a}</b> left, <b>{b}</b> right. Bodies with roles: {c} and {d}.':
    'Células contráctiles: <b>{a}</b> a la izquierda, <b>{b}</b> a la derecha. Cuerpos con funciones: {c} y {d}.',
  'One squeeze': 'Una contracción',
  'Contracting cells are yellow. While one squeezes it turns <b>orange and shrinks</b>, then rests. Set Speed to Slow to see it. On the left the orange flashes come all at once, like a heartbeat. On the right they come one by one. The chart shows how together each body squeezes: 1 means all at once.':
    'Las células contráctiles son amarillas. Mientras una se contrae, se vuelve <b>naranja y se encoge</b>, y luego descansa. Pon la Velocidad en Lenta para verlo. A la izquierda, los destellos naranjas llegan todos a la vez, como un latido. A la derecha llegan uno por uno. La gráfica muestra qué tan sincronizadas se contraen las células de cada cuerpo: 1 significa todas a la vez.',
  'In step: <b>{a}</b> left, <b>{b}</b> right. Even cells on random rhythms score about 0.5, because a few cells line up by chance.':
    'En sincronía: <b>{a}</b> a la izquierda, <b>{b}</b> a la derecha. Incluso las células con ritmos al azar dan alrededor de 0.5, porque unas pocas se alinean por casualidad.',
  'Together means faster': 'Juntas es más rápido',
  'Now the chart shows how fast bodies push themselves along, not counting the current. Each contracting cell pushes just as hard on both coasts. Wait and see which bodies move faster.':
    'Ahora la gráfica muestra qué tan rápido se impulsan los cuerpos, sin contar la corriente. Cada célula contráctil empuja con la misma fuerza en las dos costas. Espera y mira qué cuerpos se mueven más rápido.',
  'Waiting for the two lines to separate.': 'Esperando a que las dos líneas se separen.',
  'Body speed: <b>{a}</b> left, <b>{b}</b> right. In our test runs, bodies that beat together moved 1.5 to 2 times as fast.':
    'Velocidad del cuerpo: <b>{a}</b> a la izquierda, <b>{b}</b> a la derecha. En nuestras pruebas, los cuerpos que laten juntos se movieron entre 1.5 y 2 veces más rápido.',
  'Does evolution find it?': '¿Lo encuentra la evolución?',
  'A third coast starts with a weak <b>linking gene</b> and lets it evolve. If beating together pays, bodies with a stronger link should leave more daughters, and the gene should rise. The chart now shows the gene.':
    'Una tercera costa empieza con un <b>gen de enlace</b> débil y lo deja evolucionar. Si latir juntas compensa, los cuerpos con un enlace más fuerte deberían dejar más hijas, y el gen debería subir. Ahora la gráfica muestra el gen.',
  'Add a coast where linking can evolve': 'Añade una costa donde el enlace pueda evolucionar',
  'Press the button to add the third coast.': 'Presiona el botón para añadir la tercera costa.',
  'Linking gene on the new coast: <b>{a}</b> (it starts between 0 and 0.1). Honest result: in our tests it rose only slowly, to about 0.15, and with a stronger start it went up on one coast and down on another. Beating together helps, but here the help is small next to finding food.':
    'Gen de enlace en la nueva costa: <b>{a}</b> (empieza entre 0 y 0.1). Resultado honesto: en nuestras pruebas subió solo despacio, hasta unos 0.15, y con un inicio más fuerte subió en una costa y bajó en otra. Latir juntas ayuda, pero aquí esa ayuda es pequeña comparada con encontrar comida.',
  'Each contracting cell pushes just as hard on both coasts. Why do linked bodies move faster?':
    'Cada célula contráctil empuja con la misma fuerza en las dos costas. ¿Por qué los cuerpos enlazados se mueven más rápido?',
  'Linked cells are stronger.': 'Las células enlazadas son más fuertes.',
  'They are not. Every squeeze has the same force on both coasts; only the timing differs.':
    'No lo son. Cada contracción tiene la misma fuerza en las dos costas; solo cambia el momento.',
  'Pushes add up only when they happen at the same time; out of step, one cell squeezes while another relaxes and they partly cancel.':
    'Los empujes solo se suman cuando ocurren al mismo tiempo; desincronizadas, una célula se contrae mientras otra se relaja y en parte se anulan.',
  'This is why real muscle cells are wired together by gap junctions, and why a heart beats as one. Out of step, a body mostly wobbles.':
    'Por eso las células musculares reales están conectadas por uniones gap, y por eso un corazón late como uno solo. Desincronizado, un cuerpo sobre todo se tambalea.',
  'The current helps linked bodies.': 'La corriente ayuda a los cuerpos enlazados.',
  'Body speed leaves out the current. Both coasts have the same current anyway.':
    'La velocidad del cuerpo no cuenta la corriente. Además, las dos costas tienen la misma corriente.',
});
