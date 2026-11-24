// Spanish: the story of systems and life as the site's spine.
// lib/story.js (acts, levels, shots), the site bar and chapter strip
// (lib/nav.js), the home page (index.html), the Films page (films/index.html)
// and the film player (films/clip-player.js). Act titles and lines are film 1's,
// as in its notebook.
(function () {
  'use strict';

  const ACTS = {
    'What is a living system?': '¿Qué es un sistema vivo?',
    'Energy makes order': 'La energía crea orden',
    'A skin makes a self': 'Una piel crea un yo',
    'Copying with mistakes': 'Copiar con errores',
    'Together, and the cheat problem': 'Juntas, y el problema de las tramposas',
    'Bodies: many cells, one animal': 'Cuerpos: muchas células, un animal',
    'Nerves and brains': 'Nervios y cerebros',
    'Hunters, prey and land': 'Cazadores, presas y tierra',
    'One world, many levels': 'Un mundo, muchos niveles',
  };
  const LINES = {
    'Life is not a kind of stuff. It is what the parts do together.': 'La vida no es un tipo de material. Es lo que las partes hacen juntas.',
    'Where energy keeps flowing, order can build.': 'Donde la energía sigue fluyendo, el orden puede crecer.',
    'A skin separates an inside from an outside, and that makes a self.': 'Una piel separa un dentro de un fuera, y eso crea un yo.',
    'No copy is perfect, and the mistakes that help get kept.': 'Ninguna copia es perfecta, y los errores que ayudan se conservan.',
    'Cells are safer together, but every group must deal with its cheats.': 'Juntas están más seguras, pero todo grupo debe lidiar con sus tramposas.',
    'In a body, cells split the work, and only a few make new bodies.': 'En un cuerpo las células se reparten el trabajo, y solo unas pocas hacen cuerpos nuevos.',
    'A brain makes too much, then keeps what is used.': 'Un cerebro hace de más, y luego conserva lo que se usa.',
    'Eaters and eaten keep each other in check, or crash. And legs began as fins.': 'Cazadores y presas se frenan, o colapsan. Y las patas nacieron de aletas.',
    'It is one world, seen at many levels. Each level is made of the one below.': 'Un solo mundo, visto en muchos niveles. Cada nivel está hecho del anterior.',
  };
  const SHOTS = {
    'One day': 'Un día', 'Parts, flows, loops': 'Partes, flujos, ciclos',
    'Energy flows': 'Flujos de energía', 'Lightning in a flask': 'Un rayo en un frasco', 'A drying pool': 'Una poza que se seca', 'Warm vents': 'Fuentes tibias',
    'A skin closes': 'Una piel se cierra', 'The loop': 'El ciclo', 'Thread and split': 'Hilo y división', 'Full takes from empty': 'La llena le quita a la vacía',
    'A family of cells': 'Una familia de células', 'Mounds': 'Montículos', 'Twelve flasks': 'Doce frascos', 'Run and tumble': 'Avanzar y girar',
    'Too big to swallow': 'Demasiado grande para tragar', 'Clumps of eight': 'Grupos de ocho', 'A helper for all': 'Una ayuda para todas', 'Relatives and strangers': 'Parientes y extrañas',
    'Cells split the work': 'Las células se reparten el trabajo', 'Volvox': 'Volvox', 'Animal fat': 'Grasa animal', 'Fibres like muscle': 'Fibras como músculo',
    'A net of nerves': 'Una red de nervios', 'Most connections at two': 'Más conexiones a los dos años', 'A quiet connection is eaten': 'Una conexión callada es comida', 'Winning support': 'Ganar apoyo',
    'A hunter and its prey': 'Un cazador y su presa', 'Rise and fall': 'Suben y bajan', 'A neck and a wrist': 'Un cuello y una muñeca', 'A fish that walks': 'Un pez que camina',
    'One world': 'Un mundo', 'Six patterns': 'Seis patrones',
  };

  I18N.add(Object.assign({}, ACTS, LINES, SHOTS, {
    // ---------- names ----------
    'Deep Dive': 'Inmersión', 'Onto land': 'Hacia la tierra', 'All levels': 'Todos los niveles',
    'Nerve nets · Tissue Lab · Brains': 'Redes nerviosas · Laboratorio de tejido · Cerebros',
    'Nerve nets, Tissue Lab, Brains': 'Redes nerviosas, Laboratorio de tejido, Cerebros',
    'Ecosystems · Onto land': 'Ecosistemas · Hacia la tierra',
    'Ecosystems, Onto land': 'Ecosistemas, Hacia la tierra',
    'Deep Dive · World Viewer': 'Inmersión · Visor del mundo',
    'Deep Dive, World Viewer': 'Inmersión, Visor del mundo',

    // ---------- site bar and chapter strip (lib/nav.js) ----------
    'Chapters ▾': 'Capítulos ▾', 'Chapters': 'Capítulos', 'Films': 'Películas', 'Explore ▾': 'Explorar ▾',
    'Sink through the planet, level by level': 'Baja por el planeta, nivel a nivel',
    'Every chapter on one stage': 'Todos los capítulos en un escenario',
    'Every chapter on one stage.': 'Todos los capítulos en un escenario.',
    'All simulations': 'Todas las simulaciones',
    'A plain list, in order of time': 'Una lista simple, en orden de tiempo',
    'Site': 'Sitio', 'Chapter': 'Capítulo', 'Previous and next chapter': 'Capítulo anterior y siguiente',
    'If all of Earth’s history were one day': 'Si toda la historia de la Tierra fuera un día',
    'Chapter {n} · {l}': 'Capítulo {n} · {l}',
    'Chapters {a} and {b} · {l}': 'Capítulos {a} y {b} · {l}',
    '▶ Watch act {n}': '▶ Mira el acto {n}',
    '← Chapter {n}': '← Capítulo {n}',
    'Chapter {n} →': 'Capítulo {n} →',

    // ---------- home ----------
    'The story of systems and life': 'La historia de los sistemas y la vida',
    'Nine chapters, from a young planet with no life to a living world. Watch each one, read how we know, then play with a real simulation where you can change the rules.':
      'Nueve capítulos, desde un planeta joven sin vida hasta un mundo vivo. Mira cada uno, lee cómo lo sabemos y luego juega con una simulación real en la que puedes cambiar las reglas.',
    '▶ Watch film 1 · 6 min': '▶ Mira la película 1 · 6 min',
    'Start at chapter 1': 'Empieza en el capítulo 1',
    'The young Earth inside a ring marked like a clock: all of Earth’s history as one day.':
      'La Tierra joven dentro de un anillo marcado como un reloj: toda la historia de la Tierra como un día.',
    'Earth’s history as one day': 'La historia de la Tierra como un día',
    '00:00 Earth forms': '00:00 se forma la Tierra',
    '24:00 today': '24:00 hoy',
    'Life spent most of the day as chemistry and single cells. Bodies, nerves and hunters all arrive after 20:58. Each number is a chapter, where the film puts it on its clock.':
      'La vida pasó casi todo el día como química y células sueltas. Cuerpos, nervios y cazadores llegan todos después de las 20:58. Cada número es un capítulo, donde la película lo pone en su reloj.',
    '{t} · Chapter {n}: {a}': '{t} · Capítulo {n}: {a}',
    'Chapter {n}: {a}, {t}': 'Capítulo {n}: {a}, {t}',
    'The chapters': 'Los capítulos',
    'Each one: watch, play, read, try': 'Cada uno: mira, juega, lee, prueba',
    'Play <b>{s}</b>': 'Juega con <b>{s}</b>',
    'Watch <b>act 0</b>': 'Mira el <b>acto 0</b>',
    'Other ways in': 'Otras entradas',
    'Film 1 in nine acts, and the 4-minute journey of life.': 'La película 1 en nueve actos, y el viaje de la vida en 4 minutos.',
    'Dive into the planet': 'Sumérgete en el planeta',
    'Sink from a whole ecosystem down to molecules.': 'Baja desde un ecosistema entero hasta las moléculas.',
    'Change one thing and follow the effect.': 'Cambia una cosa y sigue el efecto.',
    'Small simulated worlds where living systems organise themselves from local rules: no global controller, grounded in biology. Film 1 shows what we think happened and how we know; the simulations let you test it.':
      'Pequeños mundos simulados donde los sistemas vivos se organizan a partir de reglas locales: sin control central, con base en la biología. La película 1 muestra lo que creemos que pasó y cómo lo sabemos; las simulaciones te dejan ponerlo a prueba.',

    // ---------- Films page ----------
    'Films · Learning Systems': 'Películas · Learning Systems',
    'Film 1 shows the ideas and the real evidence, in nine short acts. Each act also plays on its chapter page, beside the simulation.':
      'La película 1 muestra las ideas y la evidencia real, en nueve actos cortos. Cada acto también se ve en la página de su capítulo, junto a la simulación.',
    'This act’s clip is not on the site yet.': 'El video de este acto aún no está en el sitio.',
    'The nine acts': 'Los nueve actos',
    'Act {n} · {d} s': 'Acto {n} · {d} s',
    'from {s} s': 'desde {s} s',
    'Play {s} →': 'Juega con {s} →',
    'Open the Deep Dive →': 'Abre la inmersión →',
    'Play the next act when this one ends': 'Ver el siguiente acto cuando termine este',
    '{t} on the clock · {d} s': '{t} en el reloj · {d} s',
    'All films': 'Todas las películas',
    'Film 1': 'Película 1',
    'Nine acts, drawn: what we think happened and how we know. No simulation results here: those are for film 2.':
      'Nueve actos, dibujados: lo que creemos que pasó y cómo lo sabemos. Aquí no hay resultados de simulaciones: esos son para la película 2.',
    'Film 2 · coming': 'Película 2 · próximamente',
    'The simulations': 'Las simulaciones',
    'Parts of film 1, then the real simulations at work: the same patterns, emerging from local rules. Each part will also sit on its chapter page.':
      'Partes de la película 1 y luego las simulaciones reales en acción: los mismos patrones, surgiendo de reglas locales. Cada parte estará también en la página de su capítulo.',
    'Short · 4 minutes': 'Corto · 4 minutos',
    'Live footage from the simulations, with questions to pause and think.': 'Imágenes en vivo de las simulaciones, con preguntas para pausar y pensar.',

    // ---------- the Deep Dive's list (dive/home.js) ----------
    'Start here: watch film 1': 'Empieza aquí: mira la película 1',
    'The story of systems and life in nine short acts, from a young planet to a living world. Each act also plays on its chapter page.':
      'La historia de los sistemas y la vida en nueve actos cortos, desde un planeta joven hasta un mundo vivo. Cada acto también se ve en la página de su capítulo.',
    'The nine chapters of the story, each with its simulation.': 'Los nueve capítulos de la historia, cada uno con su simulación.',
    '▶ Watch film 1': '▶ Mira la película 1',

    // ---------- the film player (films/clip-player.js) ----------
    'Film player': 'Reproductor de película', 'Seek': 'Buscar', 'Volume': 'Volumen', 'Speed': 'Velocidad',
    'Play': 'Reproducir', 'Pause': 'Pausa', 'Mute': 'Silenciar', 'Unmute': 'Activar sonido',
    'Play (K)': 'Reproducir (K)', 'Mute (M)': 'Silenciar (M)', 'Full screen': 'Pantalla completa', 'Full screen (F)': 'Pantalla completa (F)',
    'Previous act': 'Acto anterior', 'Next act': 'Acto siguiente',
    'Previous act (Shift+P)': 'Acto anterior (Mayús+P)', 'Next act (Shift+N)': 'Acto siguiente (Mayús+N)',
  }));
})();
