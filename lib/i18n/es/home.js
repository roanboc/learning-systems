// Spanish: home.
// index.html and home.js: the Deep Dive home page and its List view.
// Shared names (systems, kinds, eras, years ago) are in common.js.
(function () {
  'use strict';

  // The stops, as the gauge, the beacons and the up/down buttons name them.
  const STOPS = {
    'Surface': 'Superficie', 'Ecosystems': 'Ecosistemas', 'Brains': 'Cerebros', 'Tissue Lab': 'Laboratorio de tejido',
    'Nerve nets': 'Redes nerviosas', 'Bodies': 'Cuerpos', 'Colonies': 'Colonias', 'First cells': 'Primeras células',
    'Early Earth': 'Tierra primitiva',
  };
  const steps = {};
  for (const [en, es] of Object.entries(STOPS)) {
    steps['↑ ' + en] = '↑ ' + es;
    steps['↓ ' + en] = '↓ ' + es;
    steps['Up to ' + en] = 'Subir a ' + es;
    steps['Deeper: ' + en] = 'Más profundo: ' + es;
  }
  I18N.add(STOPS);
  I18N.add(steps);

  // "When" facts: the whole <span> is matched first, so give it whole, or a
  // years-ago template would swallow the bold label.
  const WHEN = {
    'about 4 billion years ago': 'hace unos 4000 millones de años',
    'about 3.8 billion years ago': 'hace unos 3800 millones de años',
    'about 3.5 billion years ago': 'hace unos 3500 millones de años',
    'about 1.5 billion to 600 million years ago': 'hace entre unos 1500 y 600 millones de años',
    'about 600 million years ago': 'hace unos 600 millones de años',
    'about 540 million years ago': 'hace unos 540 millones de años',
    'the Cambrian, about 520 million years ago': 'el Cámbrico, hace unos 520 millones de años',
    'today, inside a living brain': 'hoy, dentro de un cerebro vivo',
  };
  const facts = {};
  for (const [en, es] of Object.entries(WHEN)) facts['<b>When</b> ' + en] = '<b>Cuándo</b> ' + es;
  I18N.add(facts);

  I18N.add({
    // ---------- Header ----------
    'View': 'Vista',
    'Dive': 'Inmersión',
    'List': 'Lista',
    'Ways in': 'Formas de entrar',
    'Watch the story': 'Mira la historia',

    // ---------- The dive ----------
    'The dive. Scroll, swipe or use the arrow keys to go deeper or back up. On the planet, drag to turn it and click a light to dive straight to that system.':
      'La inmersión. Desplázate, desliza o usa las flechas del teclado para bajar o volver a subir. En el planeta, arrastra para girarlo y haz clic en una luz para sumergirte directo en ese sistema.',
    'Scroll to dive': 'Desplázate para sumergirte',
    'The age of the planet': 'La edad del planeta',
    'Age of the planet': 'Edad del planeta',
    'Back to today': 'Volver a hoy',
    'Depth': 'Profundidad',

    // The surface stop
    'The whole planet, 12,742 km across': 'El planeta entero, de 12,742 km de diámetro',
    'Dive into a <em>living planet</em>': 'Sumérgete en un <em>planeta vivo</em>',
    'Small simulated worlds where life organises itself. Scroll down to sink from a whole ecosystem to the molecules life began with. Every stop is a live simulation.':
      'Pequeños mundos simulados donde la vida se organiza sola. Desplázate hacia abajo para descender desde un ecosistema entero hasta las moléculas con las que empezó la vida. Cada parada es una simulación en vivo.',
    'Light up on the planet': 'Iluminar en el planeta',
    'Light up': 'Iluminar',
    'Start the dive ↓': 'Empieza la inmersión ↓',

    // A system's stop
    'Level {l} · {k} <span>Stop {i} of {n}</span>': 'Nivel {l} · {k} <span>Parada {i} de {n}</span>',
    'Level {l} · {k}': 'Nivel {l} · {k}',
    'Stop {i} of {n}': 'Parada {i} de {n}',
    'Many creatures sharing one sea floor.': 'Muchas criaturas que comparten un mismo fondo marino.',
    'One of those creatures, and the small brain that steers it.': 'Una de esas criaturas, y el pequeño cerebro que la guía.',
    'Inside a brain: a slice of living tissue.': 'Dentro de un cerebro: una rebanada de tejido vivo.',
    'Simpler and older: nerves with no brain.': 'Más simple y más antiguo: nervios sin cerebro.',
    'Before nerves: cells that squeeze together.': 'Antes de los nervios: células que se aprietan juntas.',
    'Before bodies: cells that stick together.': 'Antes de los cuerpos: células que se mantienen juntas.',
    'Before colonies: single cells on their own.': 'Antes de las colonias: células solas, cada una por su cuenta.',
    'Before life: molecules in a young sea.': 'Antes de la vida: moléculas en un mar joven.',
    'When': 'Cuándo',
    'Where': 'Dónde',
    'Earth’s day': 'Día de la Tierra',
    'Guided lab ✓': 'Lab guiado ✓',

    // Gauge
    'The surface': 'La superficie',
    'the whole planet': 'todo el planeta',
    'surface': 'superficie',

    // Tooltips
    '{k}, {w}. Click to dive in.': '{k}, {w}. Haz clic para sumergirte.',
    // The age label: "3.27 billion years ago · Paleoarchean"
    '{w} years ago · {p}': 'Hace {w} de años · {p}',
    '{n},000 years ago · {p}': 'Hace {n} 000 años · {p}',

    // ---------- The list ----------
    'Every level of life': 'Todos los niveles de la vida',
    'Small simulated worlds where living systems organise themselves from local rules. Here they are as a plain list, from a whole ecosystem down to the chemistry life began with.':
      'Pequeños mundos simulados donde los sistemas vivos se organizan solos a partir de reglas locales. Aquí están en una lista sencilla, desde un ecosistema entero hasta la química con la que empezó la vida.',
    'no global controller': 'sin control central',
    'only local rules': 'solo reglas locales',
    'grounded in biology': 'basado en la biología',
    'compare, don\'t assume': 'compara, no supongas',
    'A guided tour of one world, chapter by chapter.': 'Un recorrido guiado por un mundo, capítulo a capítulo.',
    'Take a mechanism apart': 'Desarma un mecanismo',
    'Guided labs: change one thing and follow the effect. {d} of {n} done.':
      'Labs guiados: cambia una cosa y sigue el efecto. {d} de {n} completados.',
    'Explore freely': 'Explora con libertad',
    'The World Viewer: every chapter on one stage.': 'El Visor del mundo: todos los capítulos en un mismo escenario.',
    'The levels, from the top down': 'Los niveles, de arriba abajo',
    'In order of time <small>years ago</small>': 'En orden temporal <small>hace cuántos años</small>',
    // The whole head line is matched first: keep the link and its span together.
    '<a href="{h}">{t}</a><span>Level {l} · {k} · {w} years ago · {p}</span>':
      '<a href="{h}">{t}</a><span>Nivel {l} · {k} · hace {w} de años · {p}</span>',
    '<a href="{h}">{t}</a><span>Level {l} · {k} · {w} · {p}</span>':
      '<a href="{h}">{t}</a><span>Nivel {l} · {k} · {w} · {p}</span>',
    'Level {l} · {k} · {w} years ago · {p}': 'Nivel {l} · {k} · hace {w} de años · {p}',
    'Level {l} · {k} · {w} · {p}': 'Nivel {l} · {k} · {w} · {p}',
    'Dive here': 'Sumérgete aquí',
    'Places are where the oldest evidence was found, or a living example. Continents on the planet are today\'s, so places can be found.':
      'Los lugares son donde se encontró la evidencia más antigua, o un ejemplo vivo. Los continentes del planeta son los de hoy, para que puedas ubicar los lugares.',
  });

  // ---------- Tectonic plates (lib/plates.js) ----------
  const PLATES = {
    'African Plate': 'Placa Africana', 'Amur Plate': 'Placa del Amur', 'Antarctic Plate': 'Placa Antártica',
    'Altiplano Plate': 'Placa del Altiplano', 'Arabian Plate': 'Placa Arábiga', 'Aegean Sea Plate': 'Placa del Mar Egeo',
    'Anatolian Plate': 'Placa de Anatolia', 'Australian Plate': 'Placa Australiana', 'Bird’s Head Plate': 'Placa de Cabeza de Pájaro',
    'Balmoral Reef Plate': 'Placa del Arrecife Balmoral', 'Banda Sea Plate': 'Placa del Mar de Banda', 'Burma Plate': 'Placa de Birmania',
    'Caribbean Plate': 'Placa del Caribe', 'Caroline Plate': 'Placa de las Carolinas', 'Cocos Plate': 'Placa de Cocos',
    'Conway Reef Plate': 'Placa del Arrecife Conway', 'Easter Plate': 'Placa de Pascua', 'Eurasian Plate': 'Placa Euroasiática',
    'Futuna Plate': 'Placa de Futuna', 'Galápagos Plate': 'Placa de Galápagos', 'Indian Plate': 'Placa India',
    'Juan de Fuca Plate': 'Placa de Juan de Fuca', 'Juan Fernández Plate': 'Placa de Juan Fernández', 'Kermadec Plate': 'Placa de Kermadec',
    'Mariana Plate': 'Placa de las Marianas', 'Manus Plate': 'Placa de Manus', 'Maoke Plate': 'Placa de Maoke',
    'Molucca Sea Plate': 'Placa del Mar de las Molucas', 'North American Plate': 'Placa Norteamericana',
    'North Bismarck Plate': 'Placa de Bismarck del Norte', 'North Andes Plate': 'Placa Norandina',
    'New Hebrides Plate': 'Placa de las Nuevas Hébridas', 'Niuafo’ou Plate': 'Placa de Niuafo’ou', 'Nazca Plate': 'Placa de Nazca',
    'Okhotsk Plate': 'Placa de Ojotsk', 'Okinawa Plate': 'Placa de Okinawa', 'Pacific Plate': 'Placa del Pacífico',
    'Panama Plate': 'Placa de Panamá', 'Philippine Sea Plate': 'Placa Filipina', 'Rivera Plate': 'Placa de Rivera',
    'South American Plate': 'Placa Sudamericana', 'South Bismarck Plate': 'Placa de Bismarck del Sur', 'Scotia Plate': 'Placa Scotia',
    'Shetland Plate': 'Placa de las Shetland', 'Somali Plate': 'Placa Somalí', 'Solomon Sea Plate': 'Placa del Mar de Salomón',
    'Sunda Plate': 'Placa de la Sonda', 'South Sandwich Plate': 'Placa Sandwich del Sur', 'Timor Plate': 'Placa de Timor',
    'Tonga Plate': 'Placa de Tonga', 'Woodlark Plate': 'Placa de Woodlark', 'Yangtze Plate': 'Placa del Yangtsé',
  };
  I18N.add(PLATES);
  // The globe writes the big plates' names in capitals.
  const CAPS = {};
  for (const [en, es] of Object.entries(PLATES)) CAPS[en.toUpperCase()] = es.toUpperCase();
  I18N.add(CAPS);

  I18N.add({
    // The key
    'Plates today <small>PB2002 model, Peter Bird 2003</small>': 'Placas hoy <small>modelo PB2002, Peter Bird 2003</small>',
    'Pull apart': 'Se separan',
    'One sinks under': 'Una se hunde bajo otra',
    'Push together': 'Chocan',
    'Slide past': 'Se deslizan',
    'Drift: longer is faster': 'Deriva: cuanto más larga, más rápida',
    'Point at a plate or an edge to see what it does.': 'Señala una placa o un borde para ver qué hace.',
    // Tooltips. {r} is a speed such as "7 cm"; {a} and {b} are plates.
    'Drifts {d}, about {r} a year': 'Se desplaza hacia el {d}, alrededor de {r} al año',
    'north': 'norte', 'northeast': 'noreste', 'east': 'este', 'southeast': 'sureste',
    'south': 'sur', 'southwest': 'suroeste', 'west': 'oeste', 'northwest': 'noroeste',
    'The {a} and the {b} pull apart': 'La {a} y la {b} se separan',
    'The {a} sinks under the {b}': 'La {a} se hunde bajo la {b}',
    'The {a} and the {b} push together': 'La {a} y la {b} chocan',
    'The {a} and the {b} slide past each other': 'La {a} y la {b} se deslizan una junto a la otra',
    'About {r} a year. Hot rock wells up and makes new sea floor.': 'Alrededor de {r} al año. Sube roca caliente y forma nuevo fondo marino.',
    'About {r} a year. A continent is slowly splitting.': 'Alrededor de {r} al año. Un continente se está partiendo poco a poco.',
    'About {r} a year. Deep trenches, earthquakes and volcanoes.': 'Alrededor de {r} al año. Fosas profundas, terremotos y volcanes.',
    'About {r} a year. The crust crumples into mountains.': 'Alrededor de {r} al año. La corteza se pliega y levanta montañas.',
    'About {r} a year. The sea floor buckles, with earthquakes.': 'Alrededor de {r} al año. El fondo marino se deforma, con terremotos.',
    'About {r} a year. Earthquakes along the fault.': 'Alrededor de {r} al año. Terremotos a lo largo de la falla.',
    // The list
    'Tectonic plates: the <a href="https://doi.org/10.1029/2001GC000252">PB2002 model</a> by Peter Bird (2003), in the version prepared by <a href="https://github.com/fraxen/tectonicplates">Hugo Ahlenius</a> under the Open Data Commons Attribution License. Drift is measured against the planet as a whole, as GPS sees it.':
      'Placas tectónicas: el <a href="https://doi.org/10.1029/2001GC000252">modelo PB2002</a> de Peter Bird (2003), en la versión preparada por <a href="https://github.com/fraxen/tectonicplates">Hugo Ahlenius</a> bajo la licencia Open Data Commons Attribution. La deriva se mide respecto al planeta en su conjunto, tal como la ve el GPS.',
  });
})();
