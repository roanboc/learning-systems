// The journey of life: the words of the intro film, in English and Spanish.
//
// One entry per chapter. Each line is read by the narrator and shown as a
// caption; films/tools/narrate.py turns these lines into the soundtrack and
// writes timing.js (when each line starts) and the caption files. The picture
// for each chapter is in scenes.js and keys its moves to the line ids.
//
//   breathe   seconds of picture with no words at the end of the chapter
//   think     the Pause and think question asked when the chapter ends
//
// Plain data, no DOM; Node reads it too.
(function (root) {
  'use strict';

  const CHAPTERS = [
    {
      id: 'day', title: { en: 'One day for the whole story', es: 'Un día para toda la historia' }, breathe: 1.5,
      lines: [
        { id: 'imagine', en: 'Imagine the whole history of Earth squeezed into a single day.', es: 'Imagina toda la historia de la Tierra comprimida en un solo día.' },
        { id: 'midnight', en: 'At midnight, a young planet forms from dust and fire.', es: 'A medianoche, un planeta joven se forma a partir de polvo y fuego.' },
        { id: 'humans', en: 'We humans arrive in the last six seconds before the next midnight.', es: 'Los humanos llegamos en los últimos seis segundos antes de la siguiente medianoche.' },
        { id: 'between', en: 'In between, life built itself, one level on top of another.', es: 'Entre medio, la vida se construyó a sí misma, un nivel sobre otro.' },
        { id: 'watch', en: 'Let’s watch it happen, in a world we simulate.', es: 'Veámoslo ocurrir, en un mundo que simulamos.' },
      ],
    },
    {
      id: 'sea', title: { en: 'A sea with no life', es: 'Un mar sin vida' }, footage: 'earth', breathe: 3,
      lines: [
        { id: 'oceans', en: 'Within the first hours, there are oceans. Nothing lives in them yet.', es: 'En las primeras horas ya hay océanos. Todavía nada vive en ellos.' },
        { id: 'real', en: 'This is a real simulation, not a drawing. Every patch of water is calculated as it runs.', es: 'Esto es una simulación real, no un dibujo. Cada trozo de agua se calcula mientras corre.' },
        { id: 'sun', en: 'The sun warms the shallows. Tides fill pools and leave them to dry.', es: 'El sol calienta las aguas poco profundas. Las mareas llenan pozas y las dejan secar.' },
        { id: 'vents', en: 'On the deep floor, hot vents leak heat and minerals from below.', es: 'En el fondo profundo, fuentes calientes dejan escapar calor y minerales.' },
        { id: 'chains', en: 'As a pool dries, small molecules crowd together and join into chains.', es: 'Cuando una poza se seca, las moléculas pequeñas se amontonan y se unen en cadenas.' },
        { id: 'copiers', en: 'A few chains help make copies of themselves. Nothing here is alive, but something has started to pass itself on.', es: 'Algunas cadenas ayudan a hacer copias de sí mismas. Nada aquí está vivo, pero algo ha empezado a transmitirse.' },
      ],
      think: {
        q: { en: 'What does a drying pool do that the open sea cannot?', es: '¿Qué hace una poza que se seca que el mar abierto no puede hacer?' },
        a: { en: 'It concentrates. As water leaves, molecules get crowded enough to meet and join.', es: 'Concentra. Al irse el agua, las moléculas quedan tan juntas que se encuentran y se unen.' },
      },
    },
    {
      id: 'cells', title: { en: 'First cells', es: 'Primeras células' }, footage: 'cells', breathe: 3,
      lines: [
        { id: 'four', en: 'By four or five in the morning, there are cells.', es: 'Hacia las cuatro o las cinco de la mañana ya hay células.' },
        { id: 'eat', en: 'Each one eats, divides when it is full, and dies when it runs out.', es: 'Cada una come, se divide cuando está llena y muere cuando se queda sin nada.' },
        { id: 'copy', en: 'Daughters copy their genes with small mistakes. Nobody designs anything.', es: 'Las hijas copian sus genes con pequeños errores. Nadie diseña nada.' },
        { id: 'motor', en: 'Yet cells that only drifted begin to swim, because the ones that swim leave more daughters.', es: 'Aun así, células que solo iban a la deriva empiezan a nadar, porque las que nadan dejan más hijas.' },
        { id: 'chart', en: 'In our run, the motor gene rises about eight times, then holds steady at a best strength.', es: 'En nuestra simulación, el gen del motor sube unas ocho veces y luego se mantiene en una fuerza óptima.' },
      ],
      think: {
        q: { en: 'If nobody designs the motor, why does it stop growing at a certain strength?', es: 'Si nadie diseña el motor, ¿por qué deja de crecer a cierta fuerza?' },
        a: { en: 'A stronger motor costs more energy. Past a point, swimming faster costs more food than it finds.', es: 'Un motor más fuerte gasta más energía. Pasado un punto, nadar más rápido cuesta más comida de la que encuentra.' },
      },
    },
    {
      id: 'colonies', title: { en: 'Safety in numbers', es: 'La unión hace la fuerza' }, footage: 'colonies', breathe: 3,
      lines: [
        { id: 'predators', en: 'Then come predators: big red cells that swallow anything small.', es: 'Entonces llegan los depredadores: grandes células rojas que se tragan todo lo pequeño.' },
        { id: 'stick', en: 'A daughter that stays stuck to its mother makes a clump too big to swallow.', es: 'Una hija que se queda pegada a su madre forma un grupo demasiado grande para tragarlo.' },
        { id: 'rise', en: 'So the gene for sticking spreads, even though clumped cells must share their food.', es: 'Así que el gen de pegarse se extiende, aunque las células agrupadas deban compartir la comida.' },
        { id: 'algae', en: 'Real algae do the same in experiments, in a few hundred generations.', es: 'Algas reales hacen lo mismo en experimentos, en unos cientos de generaciones.' },
      ],
      think: {
        q: { en: 'How can a danger make life more complex?', es: '¿Cómo puede un peligro hacer la vida más compleja?' },
        a: { en: 'Predators reward cells that stay together. Staying together is the first step toward a body.', es: 'Los depredadores premian a las células que se quedan juntas. Estar juntas es el primer paso hacia un cuerpo.' },
      },
    },
    {
      id: 'wait', title: { en: 'The long wait', es: 'La larga espera' }, breathe: 1.5,
      lines: [
        { id: 'microbes', en: 'Then, for most of the day, microbes rule the planet alone.', es: 'Después, durante la mayor parte del día, los microbios gobiernan solos el planeta.' },
        { id: 'oxygen', en: 'Before noon, some of them fill the air with oxygen, and the sky and seas change for ever.', es: 'Antes del mediodía, algunos llenan el aire de oxígeno, y el cielo y los mares cambian para siempre.' },
        { id: 'snow', en: 'In the evening, ice spreads almost to the equator, then melts again.', es: 'Por la tarde, el hielo se extiende casi hasta el ecuador y luego se derrite.' },
        { id: 'bodies', en: 'Only now do cells team up into large bodies.', es: 'Solo ahora las células se unen en cuerpos grandes.' },
      ],
    },
    {
      id: 'bodies', title: { en: 'Bodies and nerves', es: 'Cuerpos y nervios' }, footage: 'nerves', breathe: 3,
      lines: [
        { id: 'roles', en: 'Cells that stay together take on roles.', es: 'Las células que se quedan juntas asumen funciones.' },
        { id: 'squeeze', en: 'Some squeeze, like the first muscle cells. Others only make new cells.', es: 'Unas se contraen, como las primeras células musculares. Otras solo fabrican células nuevas.' },
        { id: 'step', en: 'A body moves only when its squeezing cells work in step. Out of step, it just sloshes in place.', es: 'Un cuerpo solo se mueve cuando sus células contráctiles trabajan a la vez. Descoordinado, solo se agita en su sitio.' },
        { id: 'nerves', en: 'Then some cells start passing signals. A net of nerves, with no centre, tells the whole body where the food is.', es: 'Luego algunas células empiezan a pasarse señales. Una red de nervios, sin centro, le dice a todo el cuerpo dónde está la comida.' },
      ],
      think: {
        q: { en: 'Why would a body need nerves at all, if each cell can sense food?', es: '¿Para qué necesita nervios un cuerpo, si cada célula puede sentir la comida?' },
        a: { en: 'One cell can taste, but the whole body must move together. Nerves carry one cell’s news to all the others.', es: 'Una célula puede saborear, pero todo el cuerpo debe moverse a la vez. Los nervios llevan la noticia de una célula a todas las demás.' },
      },
    },
    {
      id: 'brains', title: { en: 'Brains and ecosystems', es: 'Cerebros y ecosistemas' }, footage: 'ecosystems', breathe: 3,
      lines: [
        { id: 'nine', en: 'Around nine in the evening, the sea fills with animals.', es: 'Hacia las nueve de la noche, el mar se llena de animales.' },
        { id: 'descend', en: 'Our creatures descend from those bodies. Each has a small brain of neurons that learns what is good to eat.', es: 'Nuestras criaturas descienden de esos cuerpos. Cada una tiene un pequeño cerebro de neuronas que aprende qué es bueno comer.' },
        { id: 'hunters', en: 'Then hunters appear. Prey that notice them in time survive, and hunters that chase well eat.', es: 'Luego aparecen los cazadores. Las presas que los notan a tiempo sobreviven, y los cazadores que persiguen bien comen.' },
        { id: 'balance', en: 'Too many hunters, and they empty the sea and starve. Balance is not given. It emerges, or it fails.', es: 'Si hay demasiados cazadores, vacían el mar y mueren de hambre. El equilibrio no viene dado. Surge, o fracasa.' },
      ],
      think: {
        q: { en: 'Why is it bad for hunters to be too good at hunting?', es: '¿Por qué es malo para los cazadores ser demasiado buenos cazando?' },
        a: { en: 'They eat their own future food. In our coast, hunters that empty the sea starve soon after.', es: 'Se comen su propia comida futura. En nuestra costa, los cazadores que vacían el mar mueren de hambre poco después.' },
      },
    },
    {
      id: 'gaia', title: { en: 'One world, many levels', es: 'Un mundo, muchos niveles' }, breathe: 4,
      lines: [
        { id: 'one', en: 'Everything you just saw is one world. We call it Gaia.', es: 'Todo lo que acabas de ver es un solo mundo. Lo llamamos Gaia.' },
        { id: 'same', en: 'The same coast and the same chemistry, seen at different levels, from molecules to brains.', es: 'La misma costa y la misma química, vistas a distintos niveles, de las moléculas a los cerebros.' },
        { id: 'built', en: 'Each level is built from the one below, and none of it is drawn by hand.', es: 'Cada nivel está hecho del nivel de abajo, y nada está dibujado a mano.' },
        { id: 'next', en: 'Now pick a moment and go deeper. Each one has its own film, and a lab where you change the rules yourself.', es: 'Ahora elige un momento y profundiza. Cada uno tiene su propia película y un laboratorio donde cambias tú las reglas.' },
      ],
    },
  ];

  const FILM = {
    id: 'journey',
    title: { en: 'The journey of life', es: 'El viaje de la vida' },
    voice: { en: 'af_heart', es: 'ef_dora' },
    chapters: CHAPTERS,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = FILM;
  else (root.Films = root.Films || {}).journey = FILM;
})(typeof self !== 'undefined' ? self : this);
