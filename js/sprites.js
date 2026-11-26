// Procedural Retro Pixel-Art Sprite & Tile Generator
// Generates crisp offscreen canvases at native 16x16 / character pixel scale.

class PixelSprites {
  constructor() {
    this.tiles = {};
    this.sprites = {};
    this.init();
  }

  makeCanvas(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, w, h);
    return c;
  }

  // Draw pixel art from ASCII grid + palette map
  fromGrid(grid, palette) {
    const h = grid.length;
    const w = grid[0].length;
    return this.makeCanvas(w, h, (ctx) => {
      for (let y = 0; y < h; y++) {
        const row = grid[y];
        for (let x = 0; x < w; x++) {
          const ch = row[x];
          if (ch !== '.' && palette[ch]) {
            ctx.fillStyle = palette[ch];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
  }

  init() {
    this.buildTiles();
    this.buildCharacters();
    this.buildEnemies();
    this.buildProps();
  }

  buildTiles() {
    // 1: Sand Top (Coral Beach)
    this.tiles.sandTop = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#e8b95b';
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = '#ffe08a';
      c.fillRect(0, 0, 16, 3);
      c.fillStyle = '#fff3b8';
      c.fillRect(1, 0, 5, 1);
      c.fillRect(9, 1, 4, 1);
      c.fillStyle = '#c9933b';
      [[2,6],[7,9],[13,5],[5,13],[11,12]].forEach(([x,y]) => c.fillRect(x, y, 2, 1));
      c.fillStyle = '#f79cb5'; // tiny shell pixel
      c.fillRect(10, 4, 2, 1);
    });

    // 2: Sand Deep
    this.tiles.sandDeep = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#c9933b';
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = '#b07a28';
      [[1,3],[8,6],[4,11],[12,13],[14,2]].forEach(([x,y]) => c.fillRect(x, y, 2, 2));
      c.fillStyle = '#e0ac4c';
      [[5,4],[10,9],[2,14]].forEach(([x,y]) => c.fillRect(x, y, 2, 1));
    });

    // 3: Jungle Grass Top
    this.tiles.jungleTop = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#6b4226';
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = '#523019';
      [[2,8],[10,11],[6,13],[13,7]].forEach(([x,y]) => c.fillRect(x, y, 2, 2));
      c.fillStyle = '#2fa84f';
      c.fillRect(0, 0, 16, 4);
      c.fillStyle = '#5ce077';
      c.fillRect(0, 0, 16, 2);
      c.fillStyle = '#1f7a38';
      [1, 4, 7, 11, 14].forEach((x) => c.fillRect(x, 4, 2, 2));
    });

    // 4: Jungle Dirt
    this.tiles.jungleDirt = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#5e3820';
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = '#472814';
      [[1,2],[7,5],[12,3],[3,10],[9,12],[14,9]].forEach(([x,y]) => c.fillRect(x, y, 2, 2));
      c.fillStyle = '#784c2e';
      [[4,6],[11,14],[0,13]].forEach(([x,y]) => c.fillRect(x, y, 2, 1));
    });

    // 5: Wood Bridge / Dock (one-way platform)
    this.tiles.bridge = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#8f562b';
      c.fillRect(0, 0, 16, 6);
      c.fillStyle = '#b8763e';
      c.fillRect(0, 0, 7, 3);
      c.fillRect(8, 0, 7, 3);
      c.fillStyle = '#5c3416';
      c.fillRect(7, 0, 1, 6);
      c.fillRect(15, 0, 1, 6);
      c.fillRect(0, 5, 16, 1);
      c.fillStyle = '#3c220e';
      c.fillRect(2, 2, 1, 1);
      c.fillRect(10, 2, 1, 1);
    });

    // 6: Cave Rock
    this.tiles.caveRock = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#2d3247';
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = '#3f4763';
      c.fillRect(1, 1, 6, 5);
      c.fillRect(9, 2, 6, 6);
      c.fillRect(2, 9, 7, 5);
      c.fillStyle = '#1d2130';
      c.fillRect(0, 7, 16, 1);
      c.fillRect(8, 0, 1, 16);
      c.fillStyle = '#556185';
      c.fillRect(2, 1, 3, 1);
      c.fillRect(10, 2, 4, 1);
    });

    // 7: Crystal Rock (glowing cyan veins)
    this.tiles.crystalRock = this.makeCanvas(16, 16, (c) => {
      c.drawImage(this.tiles.caveRock, 0, 0);
      c.fillStyle = '#3ff2e3';
      c.fillRect(3, 3, 2, 4);
      c.fillRect(11, 9, 2, 4);
      c.fillStyle = '#b0fff8';
      c.fillRect(3, 3, 1, 2);
      c.fillRect(11, 9, 1, 2);
    });

    // 8: Ancient Temple Stone
    this.tiles.templeStone = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#4e5459';
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = '#687075';
      c.fillRect(1, 1, 14, 2);
      c.fillRect(1, 9, 6, 5);
      c.fillRect(9, 9, 6, 5);
      c.fillStyle = '#2f3438';
      c.fillRect(0, 7, 16, 1);
      c.fillRect(7, 8, 1, 8);
      c.fillStyle = '#449e58'; // moss pixel
      c.fillRect(0, 0, 5, 2);
      c.fillRect(12, 0, 4, 1);
    });

    // 9: Temple Gold Pillar / Block
    this.tiles.templeGold = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#755c29';
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = '#c99f3c';
      c.fillRect(1, 1, 14, 14);
      c.fillStyle = '#ffe066';
      c.fillRect(2, 2, 12, 2);
      c.fillRect(2, 2, 2, 12);
      c.fillStyle = '#5c441a';
      c.fillRect(5, 5, 6, 6);
      c.fillStyle = '#4de8e8';
      c.fillRect(7, 7, 2, 2);
    });

    // 10: Cracked Secret Wall (breakable by Lizard Burrow/Blast or hidden pass)
    this.tiles.crackedWall = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#4a4542';
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = '#665f5a';
      c.fillRect(1, 1, 14, 14);
      c.fillStyle = '#1c1816';
      // Jagged crack lines
      [[3,1],[4,2],[5,3],[5,4],[6,5],[7,6],[7,7],[8,8],[9,9],[10,10],[10,11],[11,12],[12,13],
       [8,5],[9,4],[10,3],[5,9],[4,10],[3,11]].forEach(([x,y]) => c.fillRect(x, y, 1, 1));
      c.fillStyle = '#ffd147'; // subtle golden glint clue
      c.fillRect(7, 6, 1, 1);
    });

    // 11: Illusion / Secret Vine Curtain (looks like wall/foliage, can walk through!)
    this.tiles.secretCurtain = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#1f5e36';
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = '#2fa84f';
      c.fillRect(1, 0, 4, 14);
      c.fillRect(7, 2, 4, 14);
      c.fillRect(12, 0, 3, 12);
      c.fillStyle = '#6bf288';
      c.fillRect(2, 2, 1, 3);
      c.fillRect(8, 5, 1, 4);
    });

    // 12: Waterfall Secret Curtain
    this.tiles.waterfallCurtain = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = 'rgba(54, 186, 235, 0.85)';
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = 'rgba(176, 244, 255, 0.9)';
      c.fillRect(2, 0, 2, 16);
      c.fillRect(8, 2, 2, 12);
      c.fillRect(13, 0, 2, 16);
    });

    // 13: Spikes
    this.tiles.spikes = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#8b9bb4';
      for (let i = 0; i < 4; i++) {
        const bx = i * 4;
        c.fillRect(bx, 13, 4, 3);
        c.fillRect(bx + 1, 9, 2, 4);
        c.fillStyle = '#ffffff';
        c.fillRect(bx + 1, 7, 1, 4);
        c.fillStyle = '#5a6988';
        c.fillRect(bx + 2, 9, 1, 6);
        c.fillStyle = '#8b9bb4';
      }
    });

    // 14: Bouncy Jungle Mushroom / Palm Pad
    this.tiles.bouncePad = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#e8c499';
      c.fillRect(6, 9, 4, 7);
      c.fillStyle = '#d6336c';
      c.fillRect(1, 4, 14, 6);
      c.fillStyle = '#ff6b9d';
      c.fillRect(2, 3, 12, 3);
      c.fillStyle = '#fff5c0';
      c.fillRect(3, 5, 2, 2);
      c.fillRect(10, 5, 2, 2);
      c.fillRect(7, 4, 2, 1);
    });

    // 15: Locked Ancient Gate
    this.tiles.lockedGate = this.makeCanvas(16, 16, (c) => {
      c.fillStyle = '#332820';
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = '#8a6b3e';
      c.fillRect(2, 0, 3, 16);
      c.fillRect(11, 0, 3, 16);
      c.fillRect(0, 6, 16, 3);
      c.fillStyle = '#ffd147';
      c.fillRect(6, 5, 4, 5);
    });
  }

  buildCharacters() {
    const kaiPal = {
      'H': '#d9483b', // red explorer bandana
      'h': '#ff775c', // bandana highlight
      'S': '#f2b885', // skin
      's': '#d4905d', // skin shadow
      'E': '#1b1d24', // eyes / outline
      'T': '#33a88a', // tropical teal tunic
      't': '#227560', // tunic shadow
      'B': '#6e4726', // belt / boots
      'P': '#e3cb8f', // khaki shorts/pants
      'W': '#ffffff'
    };

    // Kai Idle (16x20)
    const kaiIdle = [
      '.....HHHHHH.....',
      '....HhhhhhhH....',
      '....HHHHHHHHhh..',
      '....ESSSSSSE....',
      '....ESESESSE....',
      '....ESSSSSSE....',
      '.....ssssss.....',
      '....TTTTTTTT....',
      '...STTTTTTTTS...',
      '...STtBBBBtTS...',
      '....TTTTTTTT....',
      '....PPPPPPPP....',
      '....PPP..PPP....',
      '....PPP..PPP....',
      '....BBB..BBB....',
      '...BBBB..BBBB...'
    ];

    const kaiRun1 = [
      '.....HHHHHH.....',
      '....HhhhhhhH....',
      '....HHHHHHHHhh..',
      '....ESSSSSSE....',
      '....ESESESSE....',
      '....ESSSSSSE....',
      '.....ssssss.....',
      '....TTTTTTTT....',
      '..SSTTTTTTTTSS..',
      '..S.TtBBBBtT.S..',
      '....TTTTTTTT....',
      '....PPPPPPPP....',
      '...PPP....PPP...',
      '..PPP......PPP..',
      '..BBB......BBB..',
      '.BBBB......BBBB.'
    ];

    const kaiRun2 = [
      '................',
      '.....HHHHHH.....',
      '....HhhhhhhH....',
      '....HHHHHHHHhh..',
      '....ESSSSSSE....',
      '....ESESESSE....',
      '....ESSSSSSE....',
      '.....ssssss.....',
      '....TTTTTTTT....',
      '....STTTTTTS....',
      '....TtBBBBtT....',
      '....PPPPPPPP....',
      '.....PP..PP.....',
      '....BBB..BBB....',
      '....BBB..BBB....',
      '................'
    ];

    const kaiJump = [
      '.....HHHHHH.....',
      '....HhhhhhhH....',
      '....HHHHHHHHhh..',
      '....ESSSSSSE....',
      '....ESESESSE....',
      '....ESSSSSSE....',
      '..S..ssssss..S..',
      '..SSSTTTTTTSSS..',
      '....TTTTTTTT....',
      '....TtBBBBtT....',
      '....PPPPPPPP....',
      '...PPP....PPP...',
      '...BBB....BBB...',
      '................',
      '................',
      '................'
    ];

    this.sprites.kaiIdle = this.fromGrid(kaiIdle, kaiPal);
    this.sprites.kaiRun = [this.fromGrid(kaiRun1, kaiPal), this.fromGrid(kaiRun2, kaiPal)];
    this.sprites.kaiJump = this.fromGrid(kaiJump, kaiPal);

    // Koko the Tropical Lizard Companion (14x10)
    const kokoPal = {
      'G': '#39d96b', // emerald body
      'g': '#1f9948', // green shadow
      'Y': '#ffd147', // golden crest / belly
      'E': '#101820', // eye pupil
      'W': '#fff7d6', // eye white
      'C': '#4df7ff', // bioluminescent glow
      'P': '#ff6b8b'  // tongue pink
    };

    const koko1 = [
      '.....YY.......',
      '....GGGGGG....',
      '...GEWGGGGg...',
      '..GGGGGGGGGG..',
      'G.gYYYYGGGGGG.',
      '.GGg..GG..GG..',
      '..G...g....g..'
    ];

    const koko2 = [
      '.....YY.......',
      '....GGGGGG....',
      '...GEWGGGGg...',
      '..GGGGGGGGGG..',
      '.GgYYYYGGGGGG.',
      'GG....GG...GG.',
      '......g....g..'
    ];

    const kokoGlow = [
      '.....CC.......',
      '....GGGGGG....',
      '...GEWGGGGg...',
      '..GGCGGGGGCG..',
      'G.gYYYYGGGGGG.',
      '.GGg..GG..GG..',
      '..G...g....g..'
    ];

    this.sprites.koko = [this.fromGrid(koko1, kokoPal), this.fromGrid(koko2, kokoPal)];
    this.sprites.kokoGlow = this.fromGrid(kokoGlow, kokoPal);
  }

  buildEnemies() {
    // Beach Crab (16x12)
    const crabPal = {
      'R': '#e8483c',
      'r': '#a8261d',
      'O': '#ff8652',
      'E': '#121212',
      'W': '#ffffff'
    };
    const crab1 = [
      '.RR..........RR.',
      'R.RR........RR.R',
      'RR.R.WE..EW.R.RR',
      '.R..RRRRRRRR..R.',
      '..RRRRROORRRRR..',
      '..RRRRRRRRRRRR..',
      '...rrrrrrrrrr...',
      '..R..R....R..R..',
      '.R...R....R...R.'
    ];
    const crab2 = [
      'RR............RR',
      'R.R..........R.R',
      'RRRR.WE..EW.RRRR',
      '....RRRRRRRR....',
      '..RRRRROORRRRR..',
      '..RRRRRRRRRRRR..',
      '...rrrrrrrrrr...',
      '.R..R......R..R.',
      'R....R....R....R'
    ];
    this.sprites.crab = [this.fromGrid(crab1, crabPal), this.fromGrid(crab2, crabPal)];

    // Spitting Tiki Mask (14x16)
    const tikiPal = {
      'W': '#8f552b',
      'w': '#5e3315',
      'L': '#c47d41',
      'R': '#ff4d4d',
      'Y': '#ffd147',
      'E': '#1a0e07'
    };
    const tikiGrid = [
      '..WWWWWWWWWW..',
      '.WLLLLLLLLLLW.',
      '.WYYWWWWWWYYW.',
      '.WREWEEEEWERW.',
      '.WWWWWWWWWWWW.',
      '.WLWLLWWLLWLW.',
      '.WWWWEEEEWWWW.',
      '..WWEWWWWWEW..',
      '..WWEEEEEEWW..',
      '..WWWWWWWWWW..',
      '...wWWWWWWw...',
      '...wYYYYYYw...'
    ];
    this.sprites.tiki = this.fromGrid(tikiGrid, tikiPal);

    // Cave Bat (16x10)
    const batPal = {
      'P': '#6e45a8',
      'p': '#42246e',
      'R': '#ff4f79',
      'E': '#180d26'
    };
    const bat1 = [
      'PP............PP',
      'PPP...P..P...PPP',
      'PPPP.PPPPPP.PPPP',
      '.PPPPPPRRPPPPPP.',
      '..ppppPPPPpppp..',
      '......PPPP......',
      '......p..p......'
    ];
    const bat2 = [
      '................',
      '......P..P......',
      '....PPPPPPPP....',
      '..PPPPPRRPPPPP..',
      '.PPPP.PPPP.PPPP.',
      'PP....pppp....PP',
      '................'
    ];
    this.sprites.bat = [this.fromGrid(bat1, batPal), this.fromGrid(bat2, batPal)];

    // Reef Piranha (14x11)
    const piranhaPal = {
      'B': '#ff4f64',
      'b': '#b32438',
      'Y': '#ffe066',
      'W': '#ffffff',
      'E': '#141414'
    };
    const pir1 = [
      '....BBBBBB....',
      '..BBBBBBBBBB..',
      '.BBBEWBBBBBBB.',
      'BBBBBBBBBBBBbB',
      'WBBBBBBBBBBBBb',
      'WWBBBBBBBBBBb.',
      '.BBBBYYYYBBB..',
      '...bBBBBb.....'
    ];
    const pir2 = [
      '....BBBBBB....',
      '..BBBBBBBBBB..',
      '.BBBEWBBBBBBb.',
      'BBBBBBBBBBBB.B',
      'WBBBBBBBBBBBb.',
      'WWBBBBBBBBBB.B',
      '.BBBBYYYYBBB..',
      '...bBBBBb.....'
    ];
    this.sprites.piranha = [this.fromGrid(pir1, piranhaPal), this.fromGrid(pir2, piranhaPal)];

    // Stone Guardian (18x20)
    const golemPal = {
      'S': '#697580',
      's': '#414a52',
      'L': '#95a5b3',
      'C': '#4de8e8',
      'M': '#43a047',
      'E': '#1b2024'
    };
    const golemGrid = [
      '...MMMMMMMMMM...',
      '..LLLLLLLLLLLL..',
      '..LSSSSSSSSSSL..',
      '..LSCCSSSSCCSL..',
      '..LSSSSSSSSSSL..',
      '.SSSSSSSSSSSSSS.',
      'SSLLSSSSSSSSLLSS',
      'SSLLSSCCCCSSLLSS',
      'SSSSSSCCCCSSSSSS',
      'ssSSSSSSSSSSSSss',
      'ss..SSSSSSSS..ss',
      '....SSS..SSS....',
      '....SSS..SSS....',
      '...ssss..ssss...'
    ];
    this.sprites.golem = this.fromGrid(golemGrid, golemPal);

    // Boss: Obsidian Tiki Guardian (32x34)
    this.sprites.boss = this.makeCanvas(32, 34, (c) => {
      // Dark obsidian body
      c.fillStyle = '#241c2e';
      c.fillRect(4, 4, 24, 26);
      c.fillStyle = '#3b2e4d';
      c.fillRect(6, 6, 20, 22);
      // Golden crown spikes
      c.fillStyle = '#ffd147';
      [5, 11, 17, 23].forEach((x) => {
        c.fillRect(x, 0, 4, 4);
        c.fillRect(x + 1, 0, 2, 2);
      });
      c.fillRect(4, 4, 24, 3);
      // Glowing cyan/ruby eyes
      c.fillStyle = '#ff3b5c';
      c.fillRect(8, 10, 5, 4);
      c.fillRect(19, 10, 5, 4);
      c.fillStyle = '#fff59d';
      c.fillRect(10, 11, 2, 2);
      c.fillRect(21, 11, 2, 2);
      // Carved nose & roaring mouth
      c.fillStyle = '#5f4b78';
      c.fillRect(14, 14, 4, 5);
      c.fillStyle = '#120b1a';
      c.fillRect(8, 21, 16, 6);
      // Teeth
      c.fillStyle = '#fff7e0';
      [9, 13, 17, 21].forEach((x) => {
        c.fillRect(x, 21, 2, 2);
        c.fillRect(x, 25, 2, 2);
      });
      // Glowing core rune
      c.fillStyle = '#4de8e8';
      c.fillRect(14, 29, 4, 3);
    });
  }

  buildProps() {
    // Sea Gem / Shell Collectible (10x10)
    this.sprites.gem = this.makeCanvas(10, 10, (c) => {
      c.fillStyle = '#14a2b8';
      c.fillRect(3, 1, 4, 8);
      c.fillRect(1, 3, 8, 4);
      c.fillStyle = '#5cf2ff';
      c.fillRect(3, 2, 4, 6);
      c.fillRect(2, 3, 6, 4);
      c.fillStyle = '#ffffff';
      c.fillRect(3, 3, 2, 2);
    });

    // Secret Golden Relic Idol (14x14)
    this.sprites.relic = this.makeCanvas(14, 14, (c) => {
      c.fillStyle = '#c47b14';
      c.fillRect(3, 2, 8, 10);
      c.fillRect(2, 4, 10, 6);
      c.fillStyle = '#ffd147';
      c.fillRect(4, 3, 6, 8);
      c.fillRect(3, 5, 8, 4);
      c.fillStyle = '#fff7b2';
      c.fillRect(5, 4, 2, 2);
      c.fillStyle = '#4de8e8';
      c.fillRect(6, 6, 2, 2);
    });

    // Heart Fruit (10x10)
    this.sprites.heart = this.makeCanvas(10, 10, (c) => {
      c.fillStyle = '#3bd16f';
      c.fillRect(4, 0, 2, 2);
      c.fillStyle = '#ff385c';
      c.fillRect(1, 2, 3, 4);
      c.fillRect(6, 2, 3, 4);
      c.fillRect(2, 3, 6, 5);
      c.fillRect(4, 8, 2, 1);
      c.fillStyle = '#ff99ac';
      c.fillRect(2, 3, 2, 2);
    });

    // Tongue Grapple Ring (14x14)
    this.sprites.grappleRing = this.makeCanvas(14, 14, (c) => {
      c.fillStyle = '#8c611b';
      c.fillRect(6, 0, 2, 4);
      c.fillStyle = '#ffd147';
      c.fillRect(3, 4, 8, 2);
      c.fillRect(3, 11, 8, 2);
      c.fillRect(2, 5, 2, 7);
      c.fillRect(10, 5, 2, 7);
      c.fillStyle = '#4de8e8';
      c.fillRect(6, 2, 2, 2);
    });

    // Lizard Burrow / Crack Entrance (16x14)
    this.sprites.burrow = this.makeCanvas(16, 14, (c) => {
      c.fillStyle = '#5c4e44';
      c.fillRect(1, 2, 14, 12);
      c.fillStyle = '#120e0c';
      c.fillRect(3, 4, 10, 10);
      c.fillStyle = '#39d96b'; // subtle lizard rune clue
      c.fillRect(6, 1, 4, 1);
      c.fillStyle = '#ffd147';
      c.fillRect(7, 2, 2, 1);
    });

    // Switch Lever (for tongue grapple behind bars or distance)
    this.sprites.switchOff = this.makeCanvas(14, 14, (c) => {
      c.fillStyle = '#5a6978';
      c.fillRect(2, 10, 10, 4);
      c.fillStyle = '#d93b4b';
      c.fillRect(6, 3, 2, 7);
      c.fillRect(5, 2, 4, 3);
    });
    this.sprites.switchOn = this.makeCanvas(14, 14, (c) => {
      c.fillStyle = '#5a6978';
      c.fillRect(2, 10, 10, 4);
      c.fillStyle = '#39d96b';
      c.fillRect(8, 4, 4, 3);
      c.fillRect(6, 6, 3, 4);
    });

    // Checkpoint Totem (14x24)
    this.sprites.checkpointOff = this.makeCanvas(14, 24, (c) => {
      c.fillStyle = '#5e554d';
      c.fillRect(3, 4, 8, 20);
      c.fillStyle = '#7d7268';
      c.fillRect(4, 6, 6, 4);
      c.fillStyle = '#292420';
      c.fillRect(5, 7, 1, 2);
      c.fillRect(8, 7, 1, 2);
    });
    this.sprites.checkpointOn = this.makeCanvas(14, 24, (c) => {
      c.drawImage(this.sprites.checkpointOff, 0, 0);
      c.fillStyle = '#ff8826';
      c.fillRect(4, 0, 6, 4);
      c.fillStyle = '#ffe96b';
      c.fillRect(5, 1, 4, 3);
    });

    // Exit Portal / Boat Totem (24x30)
    this.sprites.exitGate = this.makeCanvas(24, 30, (c) => {
      c.fillStyle = '#5a4d3f';
      c.fillRect(0, 2, 4, 28);
      c.fillRect(20, 2, 4, 28);
      c.fillRect(0, 0, 24, 5);
      c.fillStyle = '#ffd147';
      c.fillRect(9, 1, 6, 3);
      c.fillStyle = '#29c7d9';
      c.fillRect(4, 5, 16, 25);
      c.fillStyle = '#99fbff';
      c.fillRect(7, 8, 10, 19);
    });

    // Palm Tree (40x64 prop)
    this.sprites.palmTree = this.makeCanvas(40, 64, (c) => {
      // Curved trunk
      for (let i = 0; i < 42; i++) {
        const x = 18 + Math.round(Math.sin(i * 0.08) * 3);
        const y = 20 + i;
        c.fillStyle = i % 4 === 0 ? '#694022' : '#8c5832';
        c.fillRect(x, y, 4, 1);
      }
      // Coconuts
      c.fillStyle = '#4a2b14';
      c.fillRect(17, 19, 3, 3);
      c.fillRect(21, 20, 3, 3);
      // Lush fronds
      const drawFrond = (dx, dy, len, color) => {
        c.fillStyle = color;
        for (let t = 0; t < len; t++) {
          const px = 20 + Math.round(dx * t);
          const py = 18 + Math.round(dy * t + (t * t) * 0.04);
          c.fillRect(px, py, 3, 2);
        }
      };
      drawFrond(-1.1, -0.35, 16, '#1f7a38');
      drawFrond(1.1, -0.35, 16, '#1f7a38');
      drawFrond(-0.9, -0.75, 14, '#2fa84f');
      drawFrond(0.9, -0.75, 14, '#2fa84f');
      drawFrond(-0.3, -1.0, 10, '#5ce077');
      drawFrond(0.3, -1.0, 10, '#5ce077');
    });
  }
}

window.pixelSprites = new PixelSprites();
