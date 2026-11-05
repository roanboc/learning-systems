# The journey of life · El viaje de la vida

Made by `films/tools/script-md.js` from `script.js`. Runtime 3:35 in English, 3:49 in Spanish. Voices: Kokoro `af_heart` and `ef_dora` (open source, Apache 2.0).

## How the film is made

- **Live footage.** Chapters 1, 2, 3, 5 and 6 run the site's own engines in the page (`films/footage.js`), with seed 3 as in the World Viewer. Nothing is pre-recorded, so the film plays the same way every time and every picture can be checked on the simulation pages. A red dot and *Live simulation* mark it.
- **Real charts.** The motor and sticking gene charts are runs of the same worlds (`films/tools/gene-curves.js`, seed 3, 12,000 steps), stored in `data.js`.
- **Drawn scenes.** The planet, the clock and the levels are drawings that place each moment in time. The clock squeezes 4.54 billion years into 24 hours: one hour is about 189 million years.

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

### 0 · One day for the whole story · 0:00–0:23

*Un día para toda la historia* · drawn scene

| English | Español |
|---|---|
| Imagine the whole history of Earth squeezed into a single day. | Imagina toda la historia de la Tierra comprimida en un solo día. |
| At midnight, a young planet forms from dust and fire. | A medianoche, un planeta joven se forma a partir de polvo y fuego. |
| We humans arrive in the last six seconds before the next midnight. | Los humanos llegamos en los últimos seis segundos antes de la siguiente medianoche. |
| In between, life built itself, one level on top of another. | Entre medio, la vida se construyó a sí misma, un nivel sobre otro. |
| Let’s watch it happen, in a world we simulate. | Veámoslo ocurrir, en un mundo que simulamos. |

### 1 · A sea with no life · 0:23–1:01

*Un mar sin vida* · footage: `earth` (live, seed 3)

| English | Español |
|---|---|
| Within the first hours, there are oceans. Nothing lives in them yet. | En las primeras horas ya hay océanos. Todavía nada vive en ellos. |
| This is a real simulation, not a drawing. Every patch of water is calculated as it runs. | Esto es una simulación real, no un dibujo. Cada trozo de agua se calcula mientras corre. |
| The sun warms the shallows. Tides fill pools and leave them to dry. | El sol calienta las aguas poco profundas. Las mareas llenan pozas y las dejan secar. |
| On the deep floor, hot vents leak heat and minerals from below. | En el fondo profundo, fuentes calientes dejan escapar calor y minerales. |
| As a pool dries, small molecules crowd together and join into chains. | Cuando una poza se seca, las moléculas pequeñas se amontonan y se unen en cadenas. |
| A few chains help make copies of themselves. Nothing here is alive, but something has started to pass itself on. | Algunas cadenas ayudan a hacer copias de sí mismas. Nada aquí está vivo, pero algo ha empezado a transmitirse. |

**Pause and think.** What does a drying pool do that the open sea cannot? *(It concentrates. As water leaves, molecules get crowded enough to meet and join.)*

**Pausa para pensar.** ¿Qué hace una poza que se seca que el mar abierto no puede hacer? *(Concentra. Al irse el agua, las moléculas quedan tan juntas que se encuentran y se unen.)*

### 2 · First cells · 1:01–1:30

*Primeras células* · footage: `cells` (live, seed 3)

| English | Español |
|---|---|
| By four or five in the morning, there are cells. | Hacia las cuatro o las cinco de la mañana ya hay células. |
| Each one eats, divides when it is full, and dies when it runs out. | Cada una come, se divide cuando está llena y muere cuando se queda sin nada. |
| Daughters copy their genes with small mistakes. Nobody designs anything. | Las hijas copian sus genes con pequeños errores. Nadie diseña nada. |
| Yet cells that only drifted begin to swim, because the ones that swim leave more daughters. | Aun así, células que solo iban a la deriva empiezan a nadar, porque las que nadan dejan más hijas. |
| In our run, the motor gene rises about eight times, then holds steady at a best strength. | En nuestra simulación, el gen del motor sube unas ocho veces y luego se mantiene en una fuerza óptima. |

**Pause and think.** If nobody designs the motor, why does it stop growing at a certain strength? *(A stronger motor costs more energy. Past a point, swimming faster costs more food than it finds.)*

**Pausa para pensar.** Si nadie diseña el motor, ¿por qué deja de crecer a cierta fuerza? *(Un motor más fuerte gasta más energía. Pasado un punto, nadar más rápido cuesta más comida de la que encuentra.)*

### 3 · Safety in numbers · 1:30–1:53

*La unión hace la fuerza* · footage: `colonies` (live, seed 3)

| English | Español |
|---|---|
| Then come predators: big red cells that swallow anything small. | Entonces llegan los depredadores: grandes células rojas que se tragan todo lo pequeño. |
| A daughter that stays stuck to its mother makes a clump too big to swallow. | Una hija que se queda pegada a su madre forma un grupo demasiado grande para tragarlo. |
| So the gene for sticking spreads, even though clumped cells must share their food. | Así que el gen de pegarse se extiende, aunque las células agrupadas deban compartir la comida. |
| Real algae do the same in experiments, in a few hundred generations. | Algas reales hacen lo mismo en experimentos, en unos cientos de generaciones. |

**Pause and think.** How can a danger make life more complex? *(Predators reward cells that stay together. Staying together is the first step toward a body.)*

**Pausa para pensar.** ¿Cómo puede un peligro hacer la vida más compleja? *(Los depredadores premian a las células que se quedan juntas. Estar juntas es el primer paso hacia un cuerpo.)*

### 4 · The long wait · 1:53–2:13

*La larga espera* · drawn scene

| English | Español |
|---|---|
| Then, for most of the day, microbes rule the planet alone. | Después, durante la mayor parte del día, los microbios gobiernan solos el planeta. |
| Before noon, some of them fill the air with oxygen, and the sky and seas change for ever. | Antes del mediodía, algunos llenan el aire de oxígeno, y el cielo y los mares cambian para siempre. |
| In the evening, ice spreads almost to the equator, then melts again. | Por la tarde, el hielo se extiende casi hasta el ecuador y luego se derrite. |
| Only now do cells team up into large bodies. | Solo ahora las células se unen en cuerpos grandes. |

### 5 · Bodies and nerves · 2:13–2:39

*Cuerpos y nervios* · footage: `nerves` (live, seed 3)

| English | Español |
|---|---|
| Cells that stay together take on roles. | Las células que se quedan juntas asumen funciones. |
| Some squeeze, like the first muscle cells. Others only make new cells. | Unas se contraen, como las primeras células musculares. Otras solo fabrican células nuevas. |
| A body moves only when its squeezing cells work in step. Out of step, it just sloshes in place. | Un cuerpo solo se mueve cuando sus células contráctiles trabajan a la vez. Descoordinado, solo se agita en su sitio. |
| Then some cells start passing signals. A net of nerves, with no centre, tells the whole body where the food is. | Luego algunas células empiezan a pasarse señales. Una red de nervios, sin centro, le dice a todo el cuerpo dónde está la comida. |

**Pause and think.** Why would a body need nerves at all, if each cell can sense food? *(One cell can taste, but the whole body must move together. Nerves carry one cell’s news to all the others.)*

**Pausa para pensar.** ¿Para qué necesita nervios un cuerpo, si cada célula puede sentir la comida? *(Una célula puede saborear, pero todo el cuerpo debe moverse a la vez. Los nervios llevan la noticia de una célula a todas las demás.)*

### 6 · Brains and ecosystems · 2:39–3:08

*Cerebros y ecosistemas* · footage: `ecosystems` (live, seed 3)

| English | Español |
|---|---|
| Around nine in the evening, the sea fills with animals. | Hacia las nueve de la noche, el mar se llena de animales. |
| Our creatures descend from those bodies. Each has a small brain of neurons that learns what is good to eat. | Nuestras criaturas descienden de esos cuerpos. Cada una tiene un pequeño cerebro de neuronas que aprende qué es bueno comer. |
| Then hunters appear. Prey that notice them in time survive, and hunters that chase well eat. | Luego aparecen los cazadores. Las presas que los notan a tiempo sobreviven, y los cazadores que persiguen bien comen. |
| Too many hunters, and they empty the sea and starve. Balance is not given. It emerges, or it fails. | Si hay demasiados cazadores, vacían el mar y mueren de hambre. El equilibrio no viene dado. Surge, o fracasa. |

**Pause and think.** Why is it bad for hunters to be too good at hunting? *(They eat their own future food. In our coast, hunters that empty the sea starve soon after.)*

**Pausa para pensar.** ¿Por qué es malo para los cazadores ser demasiado buenos cazando? *(Se comen su propia comida futura. En nuestra costa, los cazadores que vacían el mar mueren de hambre poco después.)*

### 7 · One world, many levels · 3:08–3:35

*Un mundo, muchos niveles* · drawn scene

| English | Español |
|---|---|
| Everything you just saw is one world. We call it Gaia. | Todo lo que acabas de ver es un solo mundo. Lo llamamos Gaia. |
| The same coast and the same chemistry, seen at different levels, from molecules to brains. | La misma costa y la misma química, vistas a distintos niveles, de las moléculas a los cerebros. |
| Each level is built from the one below, and none of it is drawn by hand. | Cada nivel está hecho del nivel de abajo, y nada está dibujado a mano. |
| Now pick a moment and go deeper. Each one has its own film, and a lab where you change the rules yourself. | Ahora elige un momento y profundiza. Cada uno tiene su propia película y un laboratorio donde cambias tú las reglas. |
