// Level definitions for Isla del Lagarto
// Tile Legend:
// '.' = Air
// '#' = Biome Ground Deep (sandDeep / jungleDirt / caveRock / templeStone)
// '=' = Biome Ground Top (sandTop / jungleTop / crystalRock / templeStone)
// 'B' = Wooden Bridge / One-way platform
// 'W' = Water (swimmable zone)
// '^' = Spikes (hazard)
// 'M' = Bouncy Mushroom / Palm Pad
// 'C' = Cracked Secret Wall (solid until Koko breaks it with Q!)
// 'V' = Secret Vine / Waterfall Curtain (passable foreground hiding secrets!)
// 'G' = Locked Gate (opens when linked switch is activated)
// 'T' = Temple Gold Block (solid)
// 'I' = Invisible / Secret Light Platform (solid, revealed by Koko's Destello F!)

window.TILE_SIZE = 16;

function buildLevelGrid(cols, rows, builder) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill('.'));
  const set = (x, y, ch) => {
    if (x >= 0 && x < cols && y >= 0 && y < rows) grid[y][x] = ch;
  };
  const rect = (x, y, w, h, ch) => {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) set(xx, yy, ch);
    }
  };
  const ground = (x1, x2, topY, topCh = '=', deepCh = '#') => {
    for (let x = x1; x <= x2; x++) {
      set(x, topY, topCh);
      for (let y = topY + 1; y < rows; y++) set(x, y, deepCh);
    }
  };
  const waterPool = (x1, x2, topY, botY) => {
    for (let y = topY; y <= botY; y++) {
      for (let x = x1; x <= x2; x++) set(x, y, 'W');
    }
  };
  const plat = (x1, x2, y, ch = 'B') => {
    for (let x = x1; x <= x2; x++) set(x, y, ch);
  };

  builder({ set, rect, ground, waterPool, plat, cols, rows });
  return grid.map((r) => r.join(''));
}

window.LEVELS = [
  // =========================================================
  // NIVEL 1: PLAYA DEL CORAL
  // =========================================================
  {
    id: 0,
    name: 'NIVEL 1: PLAYA DEL CORAL',
    shortName: 'Playa del Coral',
    biome: 'beach',
    darkness: 0,
    desc: 'Arenas doradas, lagunas turquesa y una gruta submarina oculta.',
    skyTop: '#2b9be6',
    skyBottom: '#9be7ff',
    cols: 112,
    rows: 18,
    spawn: { x: 3 * 16, y: 11 * 16 },
    exit: { x: 107 * 16, y: 11 * 16 },
    map: buildLevelGrid(112, 18, ({ set, rect, ground, waterPool, plat }) => {
      // Starting beach
      ground(0, 22, 13);
      // Raised sandy terrace & bridge
      plat(10, 14, 10, 'B');
      plat(16, 20, 8, 'B');

      // First shallow lagoon (swimming tutorial)
      ground(23, 35, 16);
      waterPool(23, 35, 13, 15);
      plat(26, 31, 11, 'B'); // dock over lagoon

      // Island mid-beach with secret underwater tunnel below!
      ground(36, 56, 12);
      // Carve underwater secret grotto beneath x=38..52, y=14..16
      waterPool(38, 52, 14, 16);
      // Entrance from left lagoon at x=36..37
      set(36, 14, 'W'); set(36, 15, 'W');
      set(37, 14, 'W'); set(37, 15, 'W');
      // Cracked wall guarding hidden relic inside grotto at x=49
      set(49, 14, 'C'); set(49, 15, 'C');
      set(50, 14, 'W'); set(50, 15, 'W');
      set(51, 14, 'W'); set(51, 15, 'W');

      // Elevated rock bluff + spikes + grapple gap
      rect(44, 9, 4, 3, '#');
      plat(44, 47, 9, '=');
      set(41, 11, '^'); set(42, 11, '^');

      // Wide ocean chasm crossed via Koko Tongue Grapple or lower stepping stones
      ground(57, 68, 17);
      waterPool(57, 68, 14, 16);
      // Stepping island in chasm
      rect(61, 13, 3, 4, '#');
      plat(61, 63, 13, '=');

      // Rocky cliff & Secret Vine Alcove
      ground(69, 92, 12);
      // Upper cliff with locked gate leading to Relic #2
      rect(76, 6, 12, 6, '#');
      plat(76, 87, 6, '=');
      // Hollow inside cliff (x=78..85, y=8..11) hidden behind gate / vine
      rect(78, 8, 8, 4, '.');
      set(77, 9, 'G'); set(77, 10, 'G'); set(77, 11, 'G'); // Locked Gate!
      // Cracked roof or vine secret at x=86..87
      set(86, 9, 'V'); set(86, 10, 'V'); set(86, 11, 'V');
      plat(71, 74, 9, 'B'); // platform to reach switch/cliff

      // High palm platforms above x=88..96 (Relic #3)
      plat(89, 93, 8, 'B');
      plat(94, 97, 5, 'B');

      // Final cove & beach pier
      ground(93, 99, 15);
      waterPool(93, 99, 13, 14);
      set(95, 14, '^'); set(96, 14, '^');
      ground(100, 111, 13);
      // Walls at boundaries
      rect(0, 0, 1, 18, '#');
      rect(111, 0, 1, 18, '#');
    }),
    palms: [4, 15, 39, 54, 70, 91, 104],
    checkpoints: [
      { x: 55 * 16, y: 12 * 16 - 24 },
      { x: 90 * 16, y: 12 * 16 - 24 }
    ],
    grappleRings: [
      { x: 60 * 16, y: 8 * 16 },
      { x: 65 * 16, y: 8 * 16 },
      { x: 96 * 16, y: 9 * 16 }
    ],
    switches: [
      { id: 's1', x: 73 * 16, y: 8 * 16 + 2, gateTiles: [[77, 9], [77, 10], [77, 11]] }
    ],
    burrows: [
      { x: 48 * 16, y: 15 * 16 + 2, targetX: 51 * 16, targetY: 15 * 16 }
    ],
    movingPlatforms: [
      { x: 25 * 16, y: 12 * 16, w: 32, h: 6, dx: 48, dy: 0, speed: 0.7 }
    ],
    gems: [
      [11, 9], [12, 9], [17, 7], [18, 7],
      [26, 14], [28, 14], [30, 14], [32, 14],
      [40, 15], [43, 15], [45, 8], [46, 8],
      [60, 7], [65, 7], [62, 12],
      [72, 8], [80, 10], [82, 10],
      [90, 7], [92, 7], [96, 12], [102, 12]
    ],
    relics: [
      { id: 0, x: 51 * 16, y: 15 * 16, hint: 'Gruta submarina tras la pared agrietada (Q)' },
      { id: 1, x: 82 * 16, y: 10 * 16, hint: 'Tras la reja o cortina secreta del acantilado' },
      { id: 2, x: 95 * 16 + 8, y: 4 * 16, hint: 'En lo alto de las palmeras finales' }
    ],
    hearts: [
      { x: 45 * 16, y: 8 * 16 },
      { x: 84 * 16, y: 10 * 16 }
    ],
    enemies: [
      { type: 'crab', x: 13 * 16, y: 12 * 16, minX: 9 * 16, maxX: 20 * 16 },
      { type: 'piranha', x: 28 * 16, y: 14 * 16, minX: 24 * 16, maxX: 34 * 16 },
      { type: 'crab', x: 46 * 16, y: 11 * 16, minX: 43 * 16, maxX: 54 * 16 },
      { type: 'piranha', x: 43 * 16, y: 15 * 16, minX: 39 * 16, maxX: 47 * 16 },
      { type: 'crab', x: 73 * 16, y: 11 * 16, minX: 70 * 16, maxX: 76 * 16 },
      { type: 'tiki', x: 88 * 16, y: 10 * 16 + 4, dir: -1 },
      { type: 'crab', x: 103 * 16, y: 12 * 16, minX: 100 * 16, maxX: 106 * 16 }
    ],
    signs: [
      { x: 6 * 16, y: 12 * 16, text: 'Flechas ← → ↑ para moverte y saltar. ¡Clic Izq. ataca con tu machete!' },
      { x: 21 * 16, y: 12 * 16, text: 'Usa ↓ para bucear en el agua. Pulsa Q cerca de grietas o muros rotos para enviar a Koko.' },
      { x: 56 * 16, y: 11 * 16, text: '¡Pulsa E o Clic Derecho cerca de los aros dorados para que Koko use su Lengua Gancho!' }
    ]
  },

  // =========================================================
  // NIVEL 2: SELVA DE LAS CASCADAS
  // =========================================================
  {
    id: 1,
    name: 'NIVEL 2: SELVA DE LAS CASCADAS',
    shortName: 'Selva de Cascadas',
    biome: 'jungle',
    darkness: 0,
    desc: 'Hongos elásticos, cascadas secretas y tótems en la copa de los árboles.',
    skyTop: '#165249',
    skyBottom: '#4fb886',
    cols: 120,
    rows: 20,
    spawn: { x: 3 * 16, y: 13 * 16 },
    exit: { x: 115 * 16, y: 11 * 16 },
    map: buildLevelGrid(120, 20, ({ set, rect, ground, waterPool, plat }) => {
      // Jungle floor entry
      ground(0, 20, 15);
      // Bouncy mushroom cliff ascent
      set(16, 14, 'M');
      rect(21, 10, 12, 10, '#');
      plat(21, 32, 10, '=');

      // Waterfall wall concealing secret chamber! (x=25..31, y=12..17)
      rect(25, 13, 6, 4, '.');
      // Waterfall curtain entrance at x=24, y=13..16
      for (let y = 13; y <= 16; y++) set(24, y, 'V');
      // Left pool leading to waterfall secret
      ground(19, 24, 18);
      waterPool(19, 24, 16, 17);
      // Cracked wall inside waterfall cave for Relic #1
      set(28, 15, 'C'); set(28, 16, 'C');

      // Canopy gap with bridges & bouncy pads
      ground(33, 45, 16);
      waterPool(33, 45, 14, 15);
      plat(35, 39, 11, 'B');
      set(37, 10, 'M');
      plat(41, 46, 7, 'B');

      // Tall jungle cliff & high branch route
      ground(46, 66, 13);
      set(51, 12, '^'); set(52, 12, '^');
      plat(50, 54, 9, 'B');
      // Secret invisible/illusion leaf bridge at y=6 (revealed with F, or solid!)
      plat(56, 61, 6, 'I');
      // Upper ledge with Relic #2
      rect(62, 5, 5, 8, '#');
      plat(62, 66, 5, '=');

      // River rapids & submerged spike/piranha zone
      ground(67, 86, 18);
      waterPool(67, 86, 14, 17);
      set(72, 17, '^'); set(73, 17, '^');
      set(80, 17, '^'); set(81, 17, '^');
      plat(70, 74, 11, 'B');
      plat(78, 82, 10, 'B');

      // Ancient jungle gate puzzle
      ground(87, 102, 14);
      rect(92, 8, 8, 6, '#');
      plat(92, 99, 8, '=');
      rect(94, 10, 5, 4, '.');
      set(93, 11, 'G'); set(93, 12, 'G'); set(93, 13, 'G');
      // Small lizard burrow at x=91 to sneak inside and grab Relic #3!
      set(99, 13, 'C');

      // Final canyon leap
      ground(103, 108, 17);
      waterPool(103, 108, 15, 16);
      set(105, 14, 'M');
      ground(109, 119, 13);

      rect(0, 0, 1, 20, '#');
      rect(119, 0, 1, 20, '#');
    }),
    palms: [5, 12, 29, 48, 64, 89, 112],
    checkpoints: [
      { x: 47 * 16, y: 13 * 16 - 24 },
      { x: 88 * 16, y: 14 * 16 - 24 }
    ],
    grappleRings: [
      { x: 39 * 16, y: 6 * 16 },
      { x: 76 * 16, y: 7 * 16 },
      { x: 106 * 16, y: 7 * 16 }
    ],
    switches: [
      { id: 's2', x: 89 * 16, y: 9 * 16, gateTiles: [[93, 11], [93, 12], [93, 13]] }
    ],
    burrows: [
      { x: 91 * 16, y: 13 * 16 + 2, targetX: 96 * 16, targetY: 13 * 16 }
    ],
    movingPlatforms: [
      { x: 68 * 16, y: 12 * 16, w: 32, h: 6, dx: 64, dy: 0, speed: 0.85 },
      { x: 88 * 16, y: 10 * 16, w: 28, h: 6, dx: 0, dy: -36, speed: 0.65 }
    ],
    gems: [
      [14, 14], [17, 11], [22, 9], [26, 15], [27, 15],
      [36, 10], [42, 6], [44, 6], [51, 8], [53, 8],
      [58, 5], [60, 5], [71, 10], [79, 9], [75, 15],
      [83, 15], [95, 7], [97, 7], [105, 10], [111, 12]
    ],
    relics: [
      { id: 0, x: 30 * 16, y: 15 * 16 + 2, hint: 'Detrás de la cascada secreta y el muro agrietado' },
      { id: 1, x: 64 * 16, y: 4 * 16, hint: 'Usa Destello (F) para ver el puente de luz oculto' },
      { id: 2, x: 97 * 16, y: 12 * 16 + 4, hint: 'Envía a Koko por la madriguera (Q) o abre la reja' }
    ],
    hearts: [
      { x: 38 * 16, y: 10 * 16 },
      { x: 79 * 16, y: 9 * 16 }
    ],
    enemies: [
      { type: 'crab', x: 10 * 16, y: 14 * 16, minX: 7 * 16, maxX: 15 * 16 },
      { type: 'tiki', x: 23 * 16, y: 9 * 16 + 4, dir: -1 },
      { type: 'piranha', x: 38 * 16, y: 14 * 16 + 8, minX: 34 * 16, maxX: 44 * 16 },
      { type: 'bat', x: 55 * 16, y: 8 * 16, baseY: 8 * 16, rangeX: 48 },
      { type: 'tiki', x: 65 * 16, y: 12 * 16 + 4, dir: -1 },
      { type: 'piranha', x: 75 * 16, y: 15 * 16, minX: 68 * 16, maxX: 84 * 16 },
      { type: 'golem', x: 96 * 16, y: 7 * 16, minX: 93 * 16, maxX: 99 * 16 },
      { type: 'tiki', x: 111 * 16, y: 12 * 16 + 4, dir: -1 }
    ],
    signs: [
      { x: 8 * 16, y: 14 * 16, text: 'Salta sobre los hongos rosas para alcanzar la copa de los árboles.' },
      { x: 54 * 16, y: 8 * 16, text: 'Pulsa F para el Destello de Koko: ¡revela puentes invisibles en el aire!' }
    ]
  },

  // =========================================================
  // NIVEL 3: CAVERNAS CRISTALINAS
  // =========================================================
  {
    id: 2,
    name: 'NIVEL 3: CAVERNAS CRISTALINAS',
    shortName: 'Cavernas Cristalinas',
    biome: 'cave',
    darkness: 0.72,
    desc: 'Grutas oscuras, cristales bioluminiscentes, estalactitas y lagos subterráneos.',
    skyTop: '#0b0e1a',
    skyBottom: '#1c2340',
    cols: 124,
    rows: 20,
    spawn: { x: 3 * 16, y: 12 * 16 },
    exit: { x: 118 * 16, y: 11 * 16 },
    map: buildLevelGrid(124, 20, ({ set, rect, ground, waterPool, plat }) => {
      // Cave ceiling
      rect(0, 0, 124, 2, '#');
      plat(0, 123, 2, '=');

      // Entrance ledge
      ground(0, 18, 14);
      set(12, 13, '^'); set(13, 13, '^');
      plat(11, 15, 10, 'B');

      // Deep chasm with crystal ledges & invisible bridge
      ground(19, 34, 18);
      waterPool(19, 34, 15, 17);
      plat(21, 25, 13, 'B');
      plat(27, 32, 10, 'I'); // secret glowing platform

      // Central crystal chamber with split upper/lower paths
      ground(35, 58, 14);
      // Upper crystal gallery (y=8)
      plat(38, 46, 9, '=');
      rect(38, 10, 9, 1, '#');
      set(42, 8, '^');
      // Secret cracked chamber at x=50..56, y=10..13
      rect(49, 9, 8, 5, '#');
      rect(51, 10, 5, 4, '.');
      set(50, 11, 'C'); set(50, 12, 'C'); set(50, 13, 'C');

      // Flooded subterranean river (x=59..84)
      ground(59, 84, 18);
      waterPool(59, 84, 12, 17);
      // Submerged crystal divider with secret tunnel below
      rect(68, 10, 4, 5, '#');
      // Underwater tunnel under divider y=15..17!
      set(76, 17, '^'); set(77, 17, '^');
      plat(62, 66, 10, 'B');
      plat(74, 79, 9, 'B');

      // Vertical grapple shaft & bounce climb
      ground(85, 104, 15);
      set(88, 14, 'M');
      plat(92, 96, 9, 'B');
      plat(98, 103, 6, 'I'); // hidden upper ledge to Relic #3

      // Exit cavern
      ground(105, 111, 17);
      waterPool(105, 111, 15, 16);
      ground(112, 123, 13);

      rect(0, 0, 1, 20, '#');
      rect(123, 0, 1, 20, '#');
    }),
    palms: [],
    crystals: [6, 17, 23, 37, 45, 54, 64, 77, 86, 95, 114],
    stalactites: [
      { x: 24 * 16, y: 3 * 16 },
      { x: 40 * 16, y: 3 * 16 },
      { x: 65 * 16, y: 3 * 16 },
      { x: 90 * 16, y: 3 * 16 },
      { x: 108 * 16, y: 3 * 16 }
    ],
    checkpoints: [
      { x: 58 * 16, y: 14 * 16 - 24 },
      { x: 86 * 16, y: 15 * 16 - 24 }
    ],
    grappleRings: [
      { x: 28 * 16, y: 6 * 16 },
      { x: 71 * 16, y: 6 * 16 },
      { x: 107 * 16, y: 8 * 16 }
    ],
    switches: [],
    burrows: [
      { x: 49 * 16, y: 13 * 16 + 2, targetX: 53 * 16, targetY: 13 * 16 }
    ],
    movingPlatforms: [
      { x: 60 * 16, y: 11 * 16, w: 32, h: 6, dx: 0, dy: -40, speed: 0.7 },
      { x: 105 * 16, y: 12 * 16, w: 32, h: 6, dx: 48, dy: 0, speed: 0.8 }
    ],
    gems: [
      [12, 9], [14, 9], [22, 12], [24, 12], [28, 9], [30, 9],
      [39, 8], [44, 8], [52, 12], [54, 12],
      [63, 9], [69, 16], [70, 16], [76, 8], [78, 8],
      [93, 8], [95, 8], [99, 5], [101, 5], [115, 12]
    ],
    relics: [
      { id: 0, x: 54 * 16, y: 12 * 16 + 4, hint: 'Muro agrietado en la cámara de cristal (Q)' },
      { id: 1, x: 70 * 16, y: 16 * 16, hint: 'Pasadizo submarino bajo el pilar central' },
      { id: 2, x: 102 * 16, y: 5 * 16, hint: 'Usa el Destello (F) tras el hongo elástico' }
    ],
    hearts: [
      { x: 41 * 16, y: 8 * 16 },
      { x: 75 * 16, y: 8 * 16 }
    ],
    enemies: [
      { type: 'bat', x: 16 * 16, y: 8 * 16, baseY: 8 * 16, rangeX: 56 },
      { type: 'piranha', x: 27 * 16, y: 16 * 16, minX: 20 * 16, maxX: 33 * 16 },
      { type: 'golem', x: 42 * 16, y: 13 * 16, minX: 36 * 16, maxX: 48 * 16 },
      { type: 'bat', x: 43 * 16, y: 6 * 16, baseY: 6 * 16, rangeX: 60 },
      { type: 'piranha', x: 64 * 16, y: 14 * 16, minX: 60 * 16, maxX: 67 * 16 },
      { type: 'piranha', x: 78 * 16, y: 14 * 16, minX: 73 * 16, maxX: 83 * 16 },
      { type: 'bat', x: 96 * 16, y: 7 * 16, baseY: 7 * 16, rangeX: 64 },
      { type: 'golem', x: 114 * 16, y: 12 * 16, minX: 112 * 16, maxX: 118 * 16 }
    ],
    signs: [
      { x: 5 * 16, y: 13 * 16, text: 'Las cuevas son oscuras: ¡el Destello de Koko (F) ilumina el camino y aturde murciélagos!' },
      { x: 20 * 16, y: 13 * 16, text: 'Cuidado con las estalactitas del techo: ¡caen cuando pasas debajo!' }
    ]
  },

  // =========================================================
  // NIVEL 4: RUINAS DEL TEMPLO ANTIGUO (+ JEFE FINAL)
  // =========================================================
  {
    id: 3,
    name: 'NIVEL 4: RUINAS DEL TEMPLO ANTIGUO',
    shortName: 'Templo Antiguo',
    biome: 'temple',
    darkness: 0.35,
    desc: 'Trampas ancestrales, guardianes de piedra y el Guardián Tiki de Obsidiana.',
    skyTop: '#231636',
    skyBottom: '#783b5c',
    cols: 128,
    rows: 20,
    spawn: { x: 3 * 16, y: 13 * 16 },
    exit: { x: 123 * 16, y: 13 * 16 },
    hasBoss: true,
    bossAreaX: 98 * 16,
    map: buildLevelGrid(128, 20, ({ set, rect, ground, waterPool, plat }) => {
      // Temple entrance courtyard
      ground(0, 18, 15, '=', '#');
      plat(10, 14, 11, 'T');

      // Moat with spikes & grapple rings
      ground(19, 34, 18);
      waterPool(19, 34, 15, 17);
      set(24, 17, '^'); set(25, 17, '^');
      plat(21, 24, 12, 'B');
      plat(28, 31, 11, 'B');

      // Temple Hall of Switches & Secret Vault
      ground(35, 60, 14);
      rect(35, 3, 26, 2, 'T'); // roof
      // Upper vault holding Relic #1
      plat(42, 54, 9, 'T');
      set(43, 8, 'G'); set(43, 7, 'G'); set(43, 6, 'G');
      set(54, 8, 'T'); set(54, 7, 'T'); set(54, 6, 'T');
      // Secret cracked floor below x=47 leading to Relic #2
      rect(46, 15, 7, 3, '.');
      set(45, 15, 'W'); set(45, 16, 'W');
      set(48, 14, 'C'); // cracked ceiling into vault

      // Vertical Temple Tower with Bounce Pads & Light Platforms
      ground(61, 78, 16);
      set(64, 15, 'M');
      plat(67, 71, 10, 'I');
      plat(73, 77, 7, 'T');
      set(75, 15, '^'); set(76, 15, '^');

      // Flooded Sanctum
      ground(79, 95, 18);
      waterPool(79, 95, 14, 17);
      plat(82, 85, 12, 'B');
      plat(89, 92, 11, 'B');

      // BOSS ARENA: Obsidian Guardian Chamber (x=96..127)
      ground(96, 127, 15);
      // Side platforms for dodging boss attacks
      plat(101, 105, 11, 'B');
      plat(114, 118, 11, 'B');
      plat(107, 112, 8, 'I');
      // Arena walls
      rect(0, 0, 1, 20, '#');
      rect(127, 0, 1, 20, '#');
    }),
    palms: [6, 16, 62],
    torches: [8, 37, 45, 56, 98, 120],
    stalactites: [
      { x: 40 * 16, y: 5 * 16 },
      { x: 52 * 16, y: 5 * 16 }
    ],
    checkpoints: [
      { x: 62 * 16, y: 16 * 16 - 24 },
      { x: 96 * 16, y: 15 * 16 - 24 }
    ],
    grappleRings: [
      { x: 26 * 16, y: 7 * 16 },
      { x: 87 * 16, y: 7 * 16 },
      { x: 109 * 16, y: 5 * 16 }
    ],
    switches: [
      { id: 's4', x: 57 * 16, y: 13 * 16, gateTiles: [[43, 6], [43, 7], [43, 8]] }
    ],
    burrows: [
      { x: 44 * 16, y: 13 * 16 + 2, targetX: 49 * 16, targetY: 16 * 16 }
    ],
    movingPlatforms: [
      { x: 64 * 16, y: 12 * 16, w: 32, h: 6, dx: 48, dy: 0, speed: 0.9 },
      { x: 80 * 16, y: 12 * 16, w: 32, h: 6, dx: 60, dy: 0, speed: 0.8 }
    ],
    gems: [
      [11, 10], [13, 10], [22, 11], [29, 10],
      [39, 13], [46, 8], [48, 8], [50, 8],
      [68, 9], [70, 9], [74, 6], [76, 6],
      [83, 11], [90, 10], [103, 10], [116, 10]
    ],
    relics: [
      { id: 0, x: 52 * 16, y: 8 * 16, hint: 'Activa el interruptor del salón para abrir la bóveda' },
      { id: 1, x: 51 * 16, y: 16 * 16 + 4, hint: 'Envía a Koko por la grieta bajo la bóveda (Q)' },
      { id: 2, x: 75 * 16, y: 6 * 16, hint: 'Revela el puente secreto con F sobre el hongo elástico' }
    ],
    hearts: [
      { x: 48 * 16, y: 8 * 16 },
      { x: 91 * 16, y: 10 * 16 },
      { x: 109 * 16, y: 7 * 16 }
    ],
    enemies: [
      { type: 'golem', x: 14 * 16, y: 14 * 16, minX: 9 * 16, maxX: 17 * 16 },
      { type: 'piranha', x: 27 * 16, y: 16 * 16, minX: 20 * 16, maxX: 33 * 16 },
      { type: 'tiki', x: 41 * 16, y: 13 * 16 + 4, dir: -1 },
      { type: 'golem', x: 55 * 16, y: 13 * 16, minX: 50 * 16, maxX: 59 * 16 },
      { type: 'bat', x: 69 * 16, y: 6 * 16, baseY: 6 * 16, rangeX: 60 },
      { type: 'piranha', x: 87 * 16, y: 15 * 16, minX: 80 * 16, maxX: 94 * 16 },
      { type: 'tiki', x: 92 * 16, y: 10 * 16 + 4, dir: -1 },
      { type: 'boss', x: 116 * 16, y: 12 * 16 }
    ],
    signs: [
      { x: 5 * 16, y: 14 * 16, text: '¡Has llegado al Templo Antiguo! Usa todas las habilidades de Koko para abrirte paso.' },
      { x: 97 * 16, y: 14 * 16, text: '¡Cuidado! El Guardián Tiki de Obsidiana protege la salida de la isla.' }
    ]
  }
];
