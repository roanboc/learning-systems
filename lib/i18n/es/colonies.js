// Spanish: colonies.
// environments/colonies/ (page and guided lab "sharers and cheats"). The page
// runs environments/first-cells/app.js and lib/life.js: see first-cells.js.
I18N.add({
  // ---------- Page ----------
  'Sharers and Cheats': 'Cooperadoras y tramposas',
  'Colonies: sharers and cheats': 'Colonias: cooperadoras y tramposas',
  'The same coast, with colonies of cells and predators that swallow anything small. Here cells can make a <b>helper molecule</b> that frees food from the water for everyone nearby. Making it costs energy. A cheat makes none and still eats what others freed. Compare a coast where daughters stay stuck to their family with one where they drift apart, and watch which way the helper gene goes. Green cells share, purple cells cheat.':
    'La misma costa, con colonias de células y depredadores que se tragan todo lo pequeño. Aquí las células pueden fabricar una <b>molécula ayudante</b> que libera comida del agua para todas las que están cerca. Fabricarla cuesta energía. Una tramposa no fabrica nada y aun así come lo que otras liberaron. Compara una costa donde las hijas se quedan pegadas a su familia con otra donde se separan, y mira hacia dónde va el gen ayudante. Las células verdes comparten, las moradas hacen trampa.',
  '<b>Public goods.</b> Many microbes release molecules that help every cell nearby: bacteria release siderophores to grab iron, yeast releases an enzyme that digests sugar outside the cell. The maker pays; any neighbour benefits. Cells that make none (cheats) arise by mutation and save the cost. Here the helper molecule turns raw molecules in the water into building blocks, which any cell at that spot can eat.':
    '<b>Bienes públicos.</b> Muchos microbios liberan moléculas que ayudan a todas las células cercanas: las bacterias liberan sideróforos para atrapar hierro, la levadura libera una enzima que digiere azúcar fuera de la célula. Quien la fabrica paga; cualquier vecina se beneficia. Las células que no fabrican nada (tramposas) aparecen por mutación y se ahorran el costo. Aquí la molécula ayudante convierte moléculas crudas del agua en bloques de construcción, que cualquier célula en ese lugar puede comer.',
  '<b>Why sharing survives.</b> A sharer\'s help lands where it is. If its neighbours are its own daughters, the help goes to copies of the same gene, and sharing spreads. If neighbours are strangers, cheats get the same help for free and win. This is kin selection (Hamilton\'s rule: share when relatedness × benefit &gt; cost) and spatial structure, two of Nowak\'s five rules for cooperation. Both are well supported by experiments with bacteria and yeast (Griffin, West and Buckling 2004; Gore and colleagues 2009; Allen, Gore and Nowak 2013).':
    '<b>Por qué sobrevive el compartir.</b> La ayuda de una cooperadora cae donde está. Si sus vecinas son sus propias hijas, la ayuda va a copias del mismo gen, y el compartir se extiende. Si las vecinas son extrañas, las tramposas reciben la misma ayuda gratis y ganan. Esto es selección de parentesco (regla de Hamilton: compartir cuando parentesco × beneficio &gt; costo) y estructura espacial, dos de las cinco reglas de Nowak para la cooperación. Ambas están bien respaldadas por experimentos con bacterias y levaduras (Griffin, West y Buckling 2004; Gore y colegas 2009; Allen, Gore y Nowak 2013).',
  '<b>Where the trait lives.</b> In microbes, only in genes: one gene here says how much helper a cell makes. Real bacteria also switch production on only when enough neighbours are around (quorum sensing), which is still a gene circuit, not a nervous system. Animals add brains that decide in the moment and learn whom to trust.':
    '<b>Dónde vive el rasgo.</b> En los microbios, solo en los genes: aquí un gen dice cuánta ayudante fabrica una célula. Las bacterias reales además solo encienden la producción cuando hay suficientes vecinas (percepción de quórum), que sigue siendo un circuito de genes, no un sistema nervioso. Los animales añaden cerebros que deciden en el momento y aprenden en quién confiar.',
  '<b>What we found.</b> See the guided lab and the README: with kin stuck together the helper gene holds and even rises from a cheating start; when daughters drift apart it falls. The change is slow, over many days.':
    '<b>Lo que encontramos.</b> Mira el lab guiado y el README: con la familia pegada, el gen ayudante se mantiene e incluso sube desde un inicio tramposo; cuando las hijas se separan, baja. El cambio es lento, a lo largo de muchos días.',
  '<b>Simplified.</b> The helper is a made-up molecule, freed blocks come from raw molecules (nothing is created), one map cell is far bigger than a real cell, and genes are numbers, not DNA. Real cooperation also uses policing and partner choice, which are not here yet.':
    '<b>Simplificado.</b> La ayudante es una molécula inventada, los bloques liberados salen de moléculas crudas (no se crea nada), una casilla del mapa es mucho más grande que una célula real, y los genes son números, no ADN. La cooperación real también usa vigilancia y elección de pareja, que aún no están aquí.',

  // ---------- Worlds (app.js, Colonies) ----------
  'Kin stay together': 'La familia se queda junta',
  'Daughters drift apart': 'Las hijas se separan',
  'Together, starting as cheats': 'Juntas, empezando como tramposas',
  'Together, helper spreads far': 'Juntas, la ayudante se esparce lejos',
  'Nobody makes helper': 'Nadie fabrica ayudante',
  'Helper molecule': 'Molécula ayudante',
  'Helper made': 'Ayudante fabricada',
  'Cheats': 'Tramposas',
  'Sticks': 'Adherencia',
  'In clumps': 'En grupos',
  'Average helper gene: how much helper molecule a cell makes (0 = a cheat). Most coasts start at about 0.55.':
    'Valor medio del gen ayudante: cuánta molécula ayudante fabrica una célula (0 = una tramposa). La mayoría de las costas empiezan en unos 0.55.',
  'Share of cells that make almost no helper (gene below 0.1).': 'Proporción de células que casi no fabrican ayudante (gen por debajo de 0.1).',
  'Average sticking gene: the chance that a daughter stays stuck to its mother. Fixed on most coasts here.':
    'Valor medio del gen de adherencia: la probabilidad de que una hija se quede pegada a su madre. Fijo en la mayoría de las costas de aquí.',
  // Inspector
  'colony of': 'colonia de',
  'helper': 'ayudante',
  '({kind}) · sticks {s} · shares energy {e}': '({kind}) · adherencia {s} · comparte energía {e}',
  'a cheat': 'una tramposa',
  'a sharer': 'una cooperadora',

  // ---------- Guided lab ----------
  'Why share when you could cheat?': '¿Por qué compartir si puedes hacer trampa?',
  'Making the helper molecule costs energy and helps everyone nearby. Why doesn\'t cheating always win?':
    'Fabricar la molécula ayudante cuesta energía y ayuda a todas las que están cerca. ¿Por qué no gana siempre la trampa?',
  'Two coasts, one difference': 'Dos costas, una diferencia',
  'Both coasts start with the same cells: most make a <b>helper molecule</b> that turns raw molecules in the water into building blocks anyone nearby can eat. Making it costs energy. Daughters copy the helper gene with small mistakes, so <b>cheats</b> that make little or none keep appearing. Left: daughters <b>stay stuck</b> to their mother, so families live together. Right: daughters <b>drift apart</b> among strangers. Green cells share, purple cells cheat.':
    'Las dos costas empiezan con las mismas células: la mayoría fabrica una <b>molécula ayudante</b> que convierte moléculas crudas del agua en bloques que cualquiera cerca puede comer. Fabricarla cuesta energía. Las hijas copian el gen ayudante con pequeños errores, así que siguen apareciendo <b>tramposas</b> que fabrican poco o nada. Izquierda: las hijas <b>se quedan pegadas</b> a su madre, así que las familias viven juntas. Derecha: las hijas <b>se separan</b> entre extrañas. Las células verdes comparten, las moradas hacen trampa.',
  'Zoom into a cell on each coast': 'Acércate a una célula en cada costa',
  'This lab needs two worlds. Restart it from Guided labs.': 'Este lab necesita dos mundos. Reinícialo desde Labs guiados.',
  'Helper made: <b>{a}</b> left, <b>{b}</b> right. Cells in clumps: {c} and {d}.':
    'Ayudante fabricada: <b>{a}</b> a la izquierda, <b>{b}</b> a la derecha. Células en grupos: {c} y {d}.',
  'Cheats take over among strangers': 'Entre extrañas, ganan las tramposas',
  'Watch the chart. On the right, a sharer\'s help lands on strangers just as much as on itself, and cheats get it without paying. On the left, the help lands mostly on the sharer\'s own family, which carries the same gene. Which line should fall?':
    'Mira la gráfica. A la derecha, la ayuda de una cooperadora cae sobre extrañas tanto como sobre ella misma, y las tramposas la reciben sin pagar. A la izquierda, la ayuda cae sobre todo en la propia familia de la cooperadora, que lleva el mismo gen. ¿Qué línea debería bajar?',
  'Waiting for the two lines to separate. This takes several days on Fast-forward.':
    'Esperando a que las dos líneas se separen. Esto tarda varios días en Avance rápido.',
  'Helper made: <b>{a}</b> left, <b>{b}</b> right. Cheats: {c} and {d}. In our test runs, the right coast fell from about 0.55 to 0.3 to 0.4 while the left one held.':
    'Ayudante fabricada: <b>{a}</b> a la izquierda, <b>{b}</b> a la derecha. Tramposas: {c} y {d}. En nuestras pruebas, la costa derecha bajó de unos 0.55 a entre 0.3 y 0.4 mientras la izquierda se mantuvo.',
  'Where the help goes': 'A dónde va la ayuda',
  'Both maps now show the helper molecule in the water. On the left it sits in patches where families live; on the right it is thinner and spread among everyone. Currents carry it too, so some help always drifts to strangers.':
    'Ahora los dos mapas muestran la molécula ayudante en el agua. A la izquierda se queda en manchas donde viven las familias; a la derecha está más diluida y repartida entre todas. Las corrientes también la llevan, así que algo de ayuda siempre llega a extrañas.',
  'Generations so far: {a} left, {b} right.': 'Generaciones hasta ahora: {a} a la izquierda, {b} a la derecha.',
  'Can sharing start from cheats?': '¿Puede el compartir surgir desde tramposas?',
  'A third coast keeps families together but starts with <b>almost everyone a cheat</b> (helper about 0.1). If helping your own family pays, the gene should creep up again.':
    'Una tercera costa mantiene a las familias juntas pero empieza con <b>casi todas tramposas</b> (ayudante cerca de 0.1). Si ayudar a la propia familia compensa, el gen debería volver a subir poco a poco.',
  'Add a coast that starts with cheats': 'Añade una costa que empieza con tramposas',
  'Press the button to add the third coast.': 'Presiona el botón para añadir la tercera costa.',
  'Helper made on the new coast: <b>{a}</b> (it starts at about 0.1). Honest result: in our tests it rose slowly, to about 0.19 after many days, on both coasts we tried. Selection is real but weak here, because one map cell holds several families.':
    'Ayudante fabricada en la nueva costa: <b>{a}</b> (empieza en unos 0.1). Resultado honesto: en nuestras pruebas subió despacio, hasta unos 0.19 después de muchos días, en las dos costas que probamos. La selección es real pero débil aquí, porque una casilla del mapa contiene varias familias.',
  'Why does the helper gene hold up when daughters stay with their mother?':
    '¿Por qué se mantiene el gen ayudante cuando las hijas se quedan con su madre?',
  'Stuck cells are kinder.': 'Las células pegadas son más amables.',
  'Cells have no intentions. The same gene does the same thing on both coasts; only who lives next to whom differs.':
    'Las células no tienen intenciones. El mismo gen hace lo mismo en las dos costas; solo cambia quién vive junto a quién.',
  'The help lands mostly on relatives who carry the same gene, so the gene helps copies of itself.':
    'La ayuda cae sobre todo en parientes que llevan el mismo gen, así que el gen ayuda a copias de sí mismo.',
  'This is kin selection: sharing spreads when relatedness × benefit is bigger than the cost (Hamilton\'s rule). Among strangers, cheats get the same benefit without the cost.':
    'Esto es selección de parentesco: el compartir se extiende cuando parentesco × beneficio es mayor que el costo (regla de Hamilton). Entre extrañas, las tramposas reciben el mismo beneficio sin el costo.',
  'Cheats cannot stick.': 'Las tramposas no pueden pegarse.',
  'Cheats stick just as well; on the left coast every cell has the same sticking gene.':
    'Las tramposas se pegan igual de bien; en la costa izquierda todas las células tienen el mismo gen de adherencia.',
});
