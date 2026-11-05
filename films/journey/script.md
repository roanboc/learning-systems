# The journey of life · El viaje de la vida

Made by `films/tools/script-md.js` from `script.js`. Runtime 4:30 in English, 4:47 in Spanish. Voices: Kokoro `af_heart` and `ef_dora` (open source, Apache 2.0).

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

## Script

### 0 · Have you ever wondered? · 0:00–0:37

*¿Alguna vez te lo has preguntado?* · drawn scene

| English | Español |
|---|---|
| Have you ever wondered how life has changed since the very beginning? | ¿Alguna vez te has preguntado cómo ha cambiado la vida desde el principio? |
| How a planet of rock and water became home to cells, animals and minds? | ¿Cómo un planeta de roca y agua llegó a albergar células, animales y mentes? |
| Nobody was there to watch. But we can build a small world, give it simple rules, and see what happens. | Nadie estaba allí para verlo. Pero podemos construir un mundo pequeño, darle reglas sencillas y ver qué pasa. |
| This portal lets you explore every step of that journey, and shows what we know so far. | Este portal te deja explorar cada paso de ese viaje, y muestra lo que sabemos hasta ahora. |
| To keep the scale in mind, let’s squeeze the whole history of Earth into a single day. | Para no perder la escala, comprimamos toda la historia de la Tierra en un solo día. |
| At midnight, the planet forms from dust and fire. We humans arrive in the last six seconds. | A medianoche, el planeta se forma de polvo y fuego. Los humanos llegamos en los últimos seis segundos. |

### 1 · A sea with no life · 0:37–1:19

*Un mar sin vida* · footage: `earth` (live, seed 3)

| English | Español |
|---|---|
| Within the first hours, the planet cools and oceans fill. | En las primeras horas, el planeta se enfría y se llenan los océanos. |
| Tides wash over the rocks and leave pools that dry in the sun. On the deep floor, hot vents leak heat and minerals. | Las mareas cubren las rocas y dejan pozas que se secan al sol. En el fondo, fuentes calientes dejan escapar calor y minerales. |
| In a drying pool, molecules crowd together, and some join into chains. | En una poza que se seca, las moléculas se amontonan y algunas se unen en cadenas. |
| This is our simulation of that young coast. Every patch of water is calculated as it runs. | Esta es nuestra simulación de esa costa joven. Cada trozo de agua se calcula mientras corre. |
| Here is the heat, glowing at the vents. | Aquí está el calor, brillando en las fuentes. |
| And here are the chains. They appear in drying pools, and fade when the tide comes back. | Y aquí están las cadenas. Aparecen en las pozas que se secan y se desvanecen cuando vuelve la marea. |
| A few chains help copy themselves. Nothing is alive yet, but something has started to pass itself on. | Algunas cadenas ayudan a copiarse a sí mismas. Nada está vivo todavía, pero algo ha empezado a transmitirse. |

**Pause and think.** Did life begin in a sunlit pool, or at a dark vent on the sea floor? A fact: Scientists still debate it. Both ideas have evidence, and some think it took both.

**Pausa para pensar.** ¿La vida empezó en una poza al sol, o en una fuente oscura del fondo del mar? Un dato: Los científicos todavía lo debaten. Las dos ideas tienen pruebas, y hay quien piensa que hicieron falta ambas.

### 2 · First cells · 1:19–1:54

*Primeras células* · footage: `cells` (live, seed 3)

| English | Español |
|---|---|
| By four or five in the morning, there are cells: a thin skin, with instructions inside. | Hacia las cuatro o las cinco de la mañana ya hay células: una piel fina, con instrucciones dentro. |
| A cell eats, grows and splits in two. Each daughter copies the instructions, with small mistakes. | Una célula come, crece y se divide en dos. Cada hija copia las instrucciones, con pequeños errores. |
| In our world, the first cells have no working motor. They drift with the currents. | En nuestro mundo, las primeras células no tienen un motor que funcione. Van a la deriva con las corrientes. |
| But a cell with a slightly better motor reaches more food, and leaves more daughters. | Pero una célula con un motor algo mejor alcanza más comida y deja más hijas. |
| In a few generations, the motor gene rises about eight times, then holds at a best strength. Nobody designed it. | En pocas generaciones, el gen del motor sube unas ocho veces y luego se mantiene en una fuerza óptima. Nadie lo diseñó. |

**Pause and think.** Every living thing today reads its genes with the same code. What if a different code had won? A fact: That shared code is one of the strongest signs that all life descends from one early population of cells.

**Pausa para pensar.** Todos los seres vivos de hoy leen sus genes con el mismo código. ¿Y si hubiera ganado otro código? Un dato: Ese código compartido es una de las señales más fuertes de que toda la vida desciende de una misma población de células antiguas.

### 3 · Safety in numbers · 1:54–2:24

*La unión hace la fuerza* · footage: `colonies` (live, seed 3)

| English | Español |
|---|---|
| For hundreds of millions of years, microbes build mats and domes in the shallows, layer by layer. | Durante cientos de millones de años, los microbios construyen tapetes y cúpulas en las aguas poco profundas, capa a capa. |
| Then some cells start eating others. | Entonces algunas células empiezan a comerse a otras. |
| In our simulation, big red predators swallow anything small. | En nuestra simulación, grandes depredadores rojos se tragan todo lo pequeño. |
| A daughter that stays stuck to its mother makes a clump too big to swallow. | Una hija que se queda pegada a su madre forma un grupo demasiado grande para tragarlo. |
| So the gene for sticking spreads. It rises up to about five times in our run, even though clumped cells must share their food. | Así que el gen de pegarse se extiende. Llega a subir unas cinco veces en nuestra simulación, aunque las células agrupadas deban compartir la comida. |

**Pause and think.** Would life ever have become complex without predators? A fact: Real algae, given a predator in the lab, evolved clumps of cells within a few hundred generations.

**Pausa para pensar.** ¿Se habría vuelto compleja la vida sin depredadores? Un dato: Algas reales, con un depredador en el laboratorio, formaron grupos de células en unos cientos de generaciones.

### 4 · The long wait · 2:24–2:46

*La larga espera* · drawn scene

| English | Español |
|---|---|
| Then, for most of the day, microbes rule the planet alone. | Después, durante la mayor parte del día, los microbios gobiernan solos el planeta. |
| Before noon, some of them fill the air with oxygen. It poisons many others, and changes the sky and seas for ever. | Antes del mediodía, algunos llenan el aire de oxígeno. Envenena a muchos otros, y cambia el cielo y los mares para siempre. |
| In the evening, ice spreads almost to the equator, then melts again. | Por la tarde, el hielo se extiende casi hasta el ecuador y luego se derrite. |
| Only after that do large bodies appear. | Solo después aparecen los cuerpos grandes. |

**Pause and think.** Life waited almost two billion years before building large bodies. What was it waiting for? A fact: More oxygen, the end of the ice ages and new genetic tools are all suspects. Nobody knows for sure yet.

**Pausa para pensar.** La vida esperó casi dos mil millones de años antes de construir cuerpos grandes. ¿Qué estaba esperando? Un dato: Más oxígeno, el fin de las glaciaciones y nuevas herramientas genéticas son sospechosos. Nadie lo sabe con certeza todavía.

### 5 · Bodies and nerves · 2:46–3:14

*Cuerpos y nervios* · footage: `nerves` (live, seed 3)

| English | Español |
|---|---|
| Cells that stay together start to share the work. | Las células que se quedan juntas empiezan a repartirse el trabajo. |
| Some squeeze, like the first muscle cells. Some only make new cells. And some pass signals: a net of nerves, with no centre. | Unas se contraen, como las primeras células musculares. Otras solo fabrican células nuevas. Y otras pasan señales: una red de nervios, sin centro. |
| In our world, a body moves only when its squeezing cells work in step. Out of step, it just sloshes in place. | En nuestro mundo, un cuerpo solo se mueve cuando sus células contráctiles trabajan a la vez. Descoordinado, solo se agita en su sitio. |
| Nerve cells carry one cell’s taste of food to the whole body, so it turns as one. | Las células nerviosas llevan el sabor de la comida de una célula a todo el cuerpo, para que gire como uno solo. |

**Pause and think.** A jellyfish has no brain, yet it swims, hunts and follows the light. How much can a body do without a brain? A fact: Jellyfish have been swimming like this for more than 500 million years.

**Pausa para pensar.** Una medusa no tiene cerebro, y aun así nada, caza y sigue la luz. ¿Cuánto puede hacer un cuerpo sin cerebro? Un dato: Las medusas llevan más de 500 millones de años nadando así.

### 6 · Brains and ecosystems · 3:14–3:48

*Cerebros y ecosistemas* · footage: `ecosystems` (live, seed 3)

| English | Español |
|---|---|
| Around nine in the evening, the sea fills with animals: eyes, shells, legs and jaws. | Hacia las nueve de la noche, el mar se llena de animales: ojos, conchas, patas y mandíbulas. |
| Hunters and hunted push each other to change, faster than ever before. | Cazadores y presas se empujan a cambiar, más rápido que nunca. |
| Our creatures descend from those bodies. Each has a small brain of neurons that learns what is good to eat. | Nuestras criaturas descienden de esos cuerpos. Cada una tiene un pequeño cerebro de neuronas que aprende qué es bueno comer. |
| Prey that notice hunters in time survive. Hunters that chase well eat. | Las presas que ven a tiempo a los cazadores sobreviven. Los cazadores que persiguen bien comen. |
| Too many hunters, and they empty the sea and starve. Balance is not given. It emerges, or it fails. | Si hay demasiados cazadores, vacían el mar y mueren de hambre. El equilibrio no viene dado. Surge, o fracasa. |

**Pause and think.** If you could give these creatures one thing, what would change their world the most: sharper eyes, faster bodies, or bigger brains? A fact: In about 20 million years, a blink on our clock, most of the animal body plans alive today appeared.

**Pausa para pensar.** Si pudieras darles una sola cosa a estas criaturas, ¿qué cambiaría más su mundo: mejores ojos, cuerpos más rápidos o cerebros más grandes? Un dato: En unos 20 millones de años, un parpadeo en nuestro reloj, aparecieron la mayoría de los planes corporales animales que existen hoy.

### 7 · Only local rules · 3:48–4:30

*Solo reglas locales* · drawn scene

| English | Español |
|---|---|
| Here is the big idea behind everything you just saw. | Esta es la gran idea detrás de todo lo que acabas de ver. |
| Nothing in this world is told what to do. There is no plan, no designer, no one in control. | En este mundo nada recibe órdenes. No hay plan, ni diseñador, ni nadie al mando. |
| Each molecule, cell and creature follows a few local rules about what is right next to it: react, eat, copy with small mistakes, stick or let go. | Cada molécula, célula y criatura sigue unas pocas reglas locales sobre lo que tiene justo al lado: reaccionar, comer, copiarse con pequeños errores, pegarse o soltarse. |
| Swimming, colonies, bodies, brains and balance are not written anywhere. They emerge. | Nadar, las colonias, los cuerpos, los cerebros y el equilibrio no están escritos en ninguna parte. Surgen. |
| And it is all one world, Gaia, seen at different levels. | Y todo es un solo mundo, Gaia, visto a distintos niveles. |
| Now it’s your turn. Dive into the planet, change the rules in a lab, and see what emerges. | Ahora te toca a ti. Sumérgete en el planeta, cambia las reglas en un laboratorio y mira qué surge. |
