// The journey of life: the words of the intro film, in English and Spanish.
//
// The film opens with a question, then walks the milestones of life. Each
// milestone has three beats: an animation of what happened on Earth, our
// simulation of it, and what the simulation found. Each ends with an open
// question to wonder about and a fact to hold on to. The last chapter is the
// big idea: only local rules, and everything else emerges.
//
// Each line is read by the narrator and shown as a caption;
// films/tools/narrate.py turns these lines into the soundtrack and writes
// timing.js (when each line starts) and the caption files. The picture for
// each chapter is in scenes.js and keys its moves to the line ids. In a
// chapter with footage, the line with id 'sim' is where the animation hands
// over to the live simulation.
//
//   breathe   seconds of picture with no words at the end of the chapter
//   think     the Pause and think card at the chapter's end: an open
//             question (q) and a fact (fact). There is no right answer.
//
// Plain data, no DOM; Node reads it too.
(function (root) {
  'use strict';

  const CHAPTERS = [
    {
      id: 'hook', title: { en: 'Have you ever wondered?', es: '¿Alguna vez te lo has preguntado?' }, breathe: 1.5,
      lines: [
        { id: 'wonder', en: 'Have you ever wondered how life has changed since the very beginning?', es: '¿Alguna vez te has preguntado cómo ha cambiado la vida desde el principio?' },
        { id: 'from', en: 'How a planet of rock and water became home to cells, animals and minds?', es: '¿Cómo un planeta de roca y agua llegó a albergar células, animales y mentes?' },
        { id: 'nobody', en: 'Nobody was there to watch. But we can build a small world, give it simple rules, and see what happens.', es: 'Nadie estaba allí para verlo. Pero podemos construir un mundo pequeño, darle reglas sencillas y ver qué pasa.' },
        { id: 'portal', en: 'This portal lets you explore every step of that journey, and shows what we know so far.', es: 'Este portal te deja explorar cada paso de ese viaje, y muestra lo que sabemos hasta ahora.' },
        { id: 'day', en: 'To keep the scale in mind, let’s squeeze the whole history of Earth into a single day.', es: 'Para no perder la escala, comprimamos toda la historia de la Tierra en un solo día.' },
        { id: 'midnight', en: 'At midnight, the planet forms from dust and fire. We humans arrive in the last six seconds.', es: 'A medianoche, el planeta se forma de polvo y fuego. Los humanos llegamos en los últimos seis segundos.' },
      ],
    },
    {
      id: 'sea', title: { en: 'A sea with no life', es: 'Un mar sin vida' }, footage: 'earth', breathe: 2.5,
      lines: [
        { id: 'oceans', en: 'Within the first hours, the planet cools and oceans fill.', es: 'En las primeras horas, el planeta se enfría y se llenan los océanos.' },
        { id: 'pools', en: 'Tides wash over the rocks and leave pools that dry in the sun. On the deep floor, hot vents leak heat and minerals.', es: 'Las mareas cubren las rocas y dejan pozas que se secan al sol. En el fondo, fuentes calientes dejan escapar calor y minerales.' },
        { id: 'crowd', en: 'In a drying pool, molecules crowd together, and some join into chains.', es: 'En una poza que se seca, las moléculas se amontonan y algunas se unen en cadenas.' },
        { id: 'sim', en: 'This is our simulation of that young coast. Every patch of water is calculated as it runs.', es: 'Esta es nuestra simulación de esa costa joven. Cada trozo de agua se calcula mientras corre.' },
        { id: 'heat', en: 'Here is the heat, glowing at the vents.', es: 'Aquí está el calor, brillando en las fuentes.' },
        { id: 'chains', en: 'And here are the chains. They appear in drying pools, and fade when the tide comes back.', es: 'Y aquí están las cadenas. Aparecen en las pozas que se secan y se desvanecen cuando vuelve la marea.' },
        { id: 'copiers', en: 'A few chains help copy themselves. Nothing is alive yet, but something has started to pass itself on.', es: 'Algunas cadenas ayudan a copiarse a sí mismas. Nada está vivo todavía, pero algo ha empezado a transmitirse.' },
      ],
      think: {
        q: { en: 'Did life begin in a sunlit pool, or at a dark vent on the sea floor?', es: '¿La vida empezó en una poza al sol, o en una fuente oscura del fondo del mar?' },
        fact: { en: 'Scientists still debate it. Both ideas have evidence, and some think it took both.', es: 'Los científicos todavía lo debaten. Las dos ideas tienen pruebas, y hay quien piensa que hicieron falta ambas.' },
      },
    },
    {
      id: 'cells', title: { en: 'First cells', es: 'Primeras células' }, footage: 'cells', breathe: 2.5,
      lines: [
        { id: 'four', en: 'By four or five in the morning, there are cells: a thin skin, with instructions inside.', es: 'Hacia las cuatro o las cinco de la mañana ya hay células: una piel fina, con instrucciones dentro.' },
        { id: 'divide', en: 'A cell eats, grows and splits in two. Each daughter copies the instructions, with small mistakes.', es: 'Una célula come, crece y se divide en dos. Cada hija copia las instrucciones, con pequeños errores.' },
        { id: 'sim', en: 'In our world, the first cells have no working motor. They drift with the currents.', es: 'En nuestro mundo, las primeras células no tienen un motor que funcione. Van a la deriva con las corrientes.' },
        { id: 'motor', en: 'But a cell with a slightly better motor reaches more food, and leaves more daughters.', es: 'Pero una célula con un motor algo mejor alcanza más comida y deja más hijas.' },
        { id: 'chart', en: 'In a few generations, the motor gene rises about eight times, then holds at a best strength. Nobody designed it.', es: 'En pocas generaciones, el gen del motor sube unas ocho veces y luego se mantiene en una fuerza óptima. Nadie lo diseñó.' },
      ],
      think: {
        q: { en: 'Every living thing today reads its genes with the same code. What if a different code had won?', es: 'Todos los seres vivos de hoy leen sus genes con el mismo código. ¿Y si hubiera ganado otro código?' },
        fact: { en: 'That shared code is one of the strongest signs that all life descends from one early population of cells.', es: 'Ese código compartido es una de las señales más fuertes de que toda la vida desciende de una misma población de células antiguas.' },
      },
    },
    {
      id: 'colonies', title: { en: 'Safety in numbers', es: 'La unión hace la fuerza' }, footage: 'colonies', breathe: 2.5,
      lines: [
        { id: 'mats', en: 'For hundreds of millions of years, microbes build mats and domes in the shallows, layer by layer.', es: 'Durante cientos de millones de años, los microbios construyen tapetes y cúpulas en las aguas poco profundas, capa a capa.' },
        { id: 'predators', en: 'Then some cells start eating others.', es: 'Entonces algunas células empiezan a comerse a otras.' },
        { id: 'sim', en: 'In our simulation, big red predators swallow anything small.', es: 'En nuestra simulación, grandes depredadores rojos se tragan todo lo pequeño.' },
        { id: 'stick', en: 'A daughter that stays stuck to its mother makes a clump too big to swallow.', es: 'Una hija que se queda pegada a su madre forma un grupo demasiado grande para tragarlo.' },
        { id: 'chart', en: 'So the gene for sticking spreads. It rises up to about five times in our run, even though clumped cells must share their food.', es: 'Así que el gen de pegarse se extiende. Llega a subir unas cinco veces en nuestra simulación, aunque las células agrupadas deban compartir la comida.' },
      ],
      think: {
        q: { en: 'Would life ever have become complex without predators?', es: '¿Se habría vuelto compleja la vida sin depredadores?' },
        fact: { en: 'Real algae, given a predator in the lab, evolved clumps of cells within a few hundred generations.', es: 'Algas reales, con un depredador en el laboratorio, formaron grupos de células en unos cientos de generaciones.' },
      },
    },
    {
      id: 'wait', title: { en: 'The long wait', es: 'La larga espera' }, breathe: 1.5,
      lines: [
        { id: 'microbes', en: 'Then, for most of the day, microbes rule the planet alone.', es: 'Después, durante la mayor parte del día, los microbios gobiernan solos el planeta.' },
        { id: 'oxygen', en: 'Before noon, some of them fill the air with oxygen. It poisons many others, and changes the sky and seas for ever.', es: 'Antes del mediodía, algunos llenan el aire de oxígeno. Envenena a muchos otros, y cambia el cielo y los mares para siempre.' },
        { id: 'snow', en: 'In the evening, ice spreads almost to the equator, then melts again.', es: 'Por la tarde, el hielo se extiende casi hasta el ecuador y luego se derrite.' },
        { id: 'bodies', en: 'Only after that do large bodies appear.', es: 'Solo después aparecen los cuerpos grandes.' },
      ],
      think: {
        q: { en: 'Life waited almost two billion years before building large bodies. What was it waiting for?', es: 'La vida esperó casi dos mil millones de años antes de construir cuerpos grandes. ¿Qué estaba esperando?' },
        fact: { en: 'More oxygen, the end of the ice ages and new genetic tools are all suspects. Nobody knows for sure yet.', es: 'Más oxígeno, el fin de las glaciaciones y nuevas herramientas genéticas son sospechosos. Nadie lo sabe con certeza todavía.' },
      },
    },
    {
      id: 'bodies', title: { en: 'Bodies and nerves', es: 'Cuerpos y nervios' }, footage: 'nerves', breathe: 2.5,
      lines: [
        { id: 'roles', en: 'Cells that stay together start to share the work.', es: 'Las células que se quedan juntas empiezan a repartirse el trabajo.' },
        { id: 'jelly', en: 'Some squeeze, like the first muscle cells. Some only make new cells. And some pass signals: a net of nerves, with no centre.', es: 'Unas se contraen, como las primeras células musculares. Otras solo fabrican células nuevas. Y otras pasan señales: una red de nervios, sin centro.' },
        { id: 'sim', en: 'In our world, a body moves only when its squeezing cells work in step. Out of step, it just sloshes in place.', es: 'En nuestro mundo, un cuerpo solo se mueve cuando sus células contráctiles trabajan a la vez. Descoordinado, solo se agita en su sitio.' },
        { id: 'nerves', en: 'Nerve cells carry one cell’s taste of food to the whole body, so it turns as one.', es: 'Las células nerviosas llevan el sabor de la comida de una célula a todo el cuerpo, para que gire como uno solo.' },
      ],
      think: {
        q: { en: 'A jellyfish has no brain, yet it swims, hunts and follows the light. How much can a body do without a brain?', es: 'Una medusa no tiene cerebro, y aun así nada, caza y sigue la luz. ¿Cuánto puede hacer un cuerpo sin cerebro?' },
        fact: { en: 'Jellyfish have been swimming like this for more than 500 million years.', es: 'Las medusas llevan más de 500 millones de años nadando así.' },
      },
    },
    {
      id: 'brains', title: { en: 'Brains and ecosystems', es: 'Cerebros y ecosistemas' }, footage: 'ecosystems', breathe: 2.5,
      lines: [
        { id: 'cambrian', en: 'Around nine in the evening, the sea fills with animals: eyes, shells, legs and jaws.', es: 'Hacia las nueve de la noche, el mar se llena de animales: ojos, conchas, patas y mandíbulas.' },
        { id: 'race', en: 'Hunters and hunted push each other to change, faster than ever before.', es: 'Cazadores y presas se empujan a cambiar, más rápido que nunca.' },
        { id: 'sim', en: 'Our creatures descend from those bodies. Each has a small brain of neurons that learns what is good to eat.', es: 'Nuestras criaturas descienden de esos cuerpos. Cada una tiene un pequeño cerebro de neuronas que aprende qué es bueno comer.' },
        { id: 'hunters', en: 'Prey that notice hunters in time survive. Hunters that chase well eat.', es: 'Las presas que ven a tiempo a los cazadores sobreviven. Los cazadores que persiguen bien comen.' },
        { id: 'balance', en: 'Too many hunters, and they empty the sea and starve. Balance is not given. It emerges, or it fails.', es: 'Si hay demasiados cazadores, vacían el mar y mueren de hambre. El equilibrio no viene dado. Surge, o fracasa.' },
      ],
      think: {
        q: { en: 'If you could give these creatures one thing, what would change their world the most: sharper eyes, faster bodies, or bigger brains?', es: 'Si pudieras darles una sola cosa a estas criaturas, ¿qué cambiaría más su mundo: mejores ojos, cuerpos más rápidos o cerebros más grandes?' },
        fact: { en: 'In about 20 million years, a blink on our clock, most of the animal body plans alive today appeared.', es: 'En unos 20 millones de años, un parpadeo en nuestro reloj, aparecieron la mayoría de los planes corporales animales que existen hoy.' },
      },
    },
    {
      id: 'emerge', title: { en: 'Only local rules', es: 'Solo reglas locales' }, breathe: 4,
      lines: [
        { id: 'idea', en: 'Here is the big idea behind everything you just saw.', es: 'Esta es la gran idea detrás de todo lo que acabas de ver.' },
        { id: 'nothing', en: 'Nothing in this world is told what to do. There is no plan, no designer, no one in control.', es: 'En este mundo nada recibe órdenes. No hay plan, ni diseñador, ni nadie al mando.' },
        { id: 'local', en: 'Each molecule, cell and creature follows a few local rules about what is right next to it: react, eat, copy with small mistakes, stick or let go.', es: 'Cada molécula, célula y criatura sigue unas pocas reglas locales sobre lo que tiene justo al lado: reaccionar, comer, copiarse con pequeños errores, pegarse o soltarse.' },
        { id: 'emerges', en: 'Swimming, colonies, bodies, brains and balance are not written anywhere. They emerge.', es: 'Nadar, las colonias, los cuerpos, los cerebros y el equilibrio no están escritos en ninguna parte. Surgen.' },
        { id: 'gaia', en: 'And it is all one world, Gaia, seen at different levels.', es: 'Y todo es un solo mundo, Gaia, visto a distintos niveles.' },
        { id: 'next', en: 'Now it’s your turn. Dive into the planet, change the rules in a lab, and see what emerges.', es: 'Ahora te toca a ti. Sumérgete en el planeta, cambia las reglas en un laboratorio y mira qué surge.' },
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
