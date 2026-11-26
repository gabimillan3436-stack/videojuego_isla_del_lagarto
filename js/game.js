// Main Game Engine for Isla del Lagarto
(() => {
  const { Particle, FloatingText, Player, LizardCompanion, Projectile, Enemy } = window.GameEntities;
  const TS = window.TILE_SIZE;
  const VIEW_W = 400;
  const VIEW_H = 225;

  class Game {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;

      // Offscreen lighting canvas for dark caves
      this.lightCanvas = document.createElement('canvas');
      this.lightCanvas.width = VIEW_W;
      this.lightCanvas.height = VIEW_H;
      this.lightCtx = this.lightCanvas.getContext('2d');

      // DOM refs
      this.hudHearts = document.getElementById('hud-hearts');
      this.hudOxygenWrap = document.getElementById('hud-oxygen-wrap');
      this.hudOxygenFill = document.getElementById('hud-oxygen-fill');
      this.hudLevelName = document.getElementById('hud-level-name');
      this.hudGems = document.getElementById('hud-gems');
      this.hudRelics = document.getElementById('hud-relics');
      this.lizardDock = document.getElementById('lizard-dock');
      this.contextToast = document.getElementById('context-toast');

      this.screenTitle = document.getElementById('screen-title');
      this.screenLevels = document.getElementById('screen-levels');
      this.screenPause = document.getElementById('screen-pause');
      this.screenResult = document.getElementById('screen-result');

      this.cdWater = document.getElementById('cd-water');
      this.cdTongue = document.getElementById('cd-tongue');
      this.cdBurrow = document.getElementById('cd-burrow');
      this.cdGlow = document.getElementById('cd-glow');

      // Persistent progress
      this.progress = this.loadProgress();

      // State
      this.state = 'title'; // title | playing | paused | result
      this.levelIdx = 0;
      this.level = null;
      this.grid = [];
      this.player = null;
      this.koko = null;
      this.enemies = [];
      this.projectiles = [];
      this.particles = [];
      this.floatingTexts = [];
      this.gems = [];
      this.relics = [];
      this.hearts = [];
      this.switches = [];
      this.movingPlatforms = [];
      this.stalactites = [];
      this.checkpoints = [];
      this.activeCheckpoint = -1;

      this.score = 0;
      this.gemsCollected = 0;
      this.relicsCollected = 0;
      this.bossDefeated = false;
      this.camX = 0;
      this.camY = 0;
      this.shakeTimer = 0;
      this.tick = 0;
      this.toastTimer = 0;
      this.lastSignText = '';

      // Input
      this.keys = {};
      this.prevKeys = {};
      this.lastTime = 0;
      this.accumulator = 0;

      this.bindEvents();
      this.renderLevelSelectCards();
      requestAnimationFrame((ts) => this.loop(ts));
    }

    loadProgress() {
      try {
        const raw = localStorage.getItem('isla_lagarto_save_v1');
        if (raw) return JSON.parse(raw);
      } catch (_) {}
      return { unlocked: 0, relicsByLevel: [0, 0, 0, 0], bestScore: 0 };
    }

    saveProgress() {
      try {
        localStorage.setItem('isla_lagarto_save_v1', JSON.stringify(this.progress));
      } catch (_) {}
    }

    bindEvents() {
      const setKey = (e, pressed) => {
        if (e.code) this.keys[e.code] = pressed;
        if (e.key) this.keys['k:' + e.key.toLowerCase()] = pressed;
        if (e.keyCode) this.keys['kc:' + e.keyCode] = pressed;
      };

      const onKeyDown = (e) => {
        const k = e.key ? e.key.toLowerCase() : '';
        const kc = e.keyCode || 0;
        if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) ||
          k === ' ' || [32, 37, 38, 39, 40].includes(kc)
        ) {
          e.preventDefault();
        }
        setKey(e, true);

        if (e.code === 'KeyM' || k === 'm' || kc === 77) {
          const muted = window.retroAudio.toggleMute();
          document.getElementById('btn-sound').textContent = muted ? '🔇' : '🔊';
        }
        if ((e.code === 'Escape' || e.code === 'KeyP' || k === 'p' || kc === 27 || kc === 80) && (this.state === 'playing' || this.state === 'paused')) {
          this.togglePause();
        }
        if (this.state === 'playing') {
          if (e.code === 'KeyS' || k === 's' || kc === 83) this.triggerWaterPower();
          if (e.code === 'KeyE' || k === 'e' || kc === 69) this.triggerTongue();
          if (e.code === 'KeyQ' || k === 'q' || kc === 81) this.triggerBurrow();
          if (e.code === 'KeyF' || k === 'f' || kc === 70) this.triggerGlow();
        }
      };

      const onKeyUp = (e) => {
        setKey(e, false);
      };

      document.addEventListener('keydown', onKeyDown, true);
      document.addEventListener('keyup', onKeyUp, true);

      window.addEventListener('blur', () => {
        this.keys = {};
      });

      // Mouse Left Click = Attack, Right Click = Koko Tongue Grapple
      this.canvas.addEventListener('mousedown', (e) => {
        window.retroAudio.unlock();
        if (this.state !== 'playing') return;
        this.canvas.focus();

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = VIEW_W / rect.width;
        const clickWorldX = (e.clientX - rect.left) * scaleX + this.camX;

        if (e.button === 0) {
          this.triggerAttack(clickWorldX);
        } else if (e.button === 2) {
          this.triggerTongue();
        }
      });

      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      // Clickable Lizard Dock buttons
      document.querySelectorAll('.ability-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.state !== 'playing') return;
          const ab = btn.dataset.ability;
          if (ab === 'water') this.triggerWaterPower();
          else if (ab === 'tongue') this.triggerTongue();
          else if (ab === 'burrow') this.triggerBurrow();
          else if (ab === 'glow') this.triggerGlow();
          this.canvas.focus();
        });
      });

      // Menu buttons
      document.getElementById('btn-start').addEventListener('click', () => {
        window.retroAudio.unlock();
        this.startLevel(0);
      });
      document.getElementById('btn-level-select').addEventListener('click', () => {
        window.retroAudio.unlock();
        this.renderLevelSelectCards();
        this.screenTitle.classList.add('hidden');
        this.screenLevels.classList.remove('hidden');
      });
      document.getElementById('btn-back-title').addEventListener('click', () => {
        this.screenLevels.classList.add('hidden');
        this.screenTitle.classList.remove('hidden');
      });
      document.getElementById('btn-sound').addEventListener('click', () => {
        const muted = window.retroAudio.toggleMute();
        document.getElementById('btn-sound').textContent = muted ? '🔇' : '🔊';
      });
      document.getElementById('btn-pause').addEventListener('click', () => {
        if (this.state === 'playing' || this.state === 'paused') this.togglePause();
      });
      document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
      document.getElementById('btn-restart-level').addEventListener('click', () => this.startLevel(this.levelIdx));
      document.getElementById('btn-to-map').addEventListener('click', () => this.showLevelMap());
      document.getElementById('btn-next-level').addEventListener('click', () => {
        if (this.levelIdx + 1 < window.LEVELS.length) {
          this.startLevel(this.levelIdx + 1);
        } else {
          this.showLevelMap();
        }
      });
      document.getElementById('btn-retry-level').addEventListener('click', () => this.startLevel(this.levelIdx));
      document.getElementById('btn-result-map').addEventListener('click', () => this.showLevelMap());
    }

    showLevelMap() {
      this.state = 'title';
      window.retroAudio.stopBgm();
      this.lizardDock.classList.add('hidden');
      this.screenPause.classList.add('hidden');
      this.screenResult.classList.add('hidden');
      this.renderLevelSelectCards();
      this.screenLevels.classList.remove('hidden');
    }

    renderLevelSelectCards() {
      const container = document.getElementById('level-cards');
      container.innerHTML = '';
      window.LEVELS.forEach((lvl, idx) => {
        const unlocked = idx <= this.progress.unlocked;
        const card = document.createElement('div');
        card.className = 'level-card' + (unlocked ? '' : ' locked');
        const bestRelics = this.progress.relicsByLevel[idx] || 0;
        card.innerHTML = `
          <div class="lvl-tag">${unlocked ? 'DESBLOQUEADO' : '🔒 BLOQUEADO'}</div>
          <h3>${idx + 1}. ${lvl.shortName}</h3>
          <p>${lvl.desc}</p>
          <div class="lvl-meta">★ Reliquias: ${bestRelics}/3</div>
        `;
        if (unlocked) {
          card.addEventListener('click', () => this.startLevel(idx));
        }
        container.appendChild(card);
      });
    }

    startLevel(idx) {
      this.levelIdx = idx;
      const lvl = window.LEVELS[idx];
      this.level = lvl;
      this.grid = lvl.map.map((row) => row.split(''));

      this.player = new Player(lvl.spawn.x, lvl.spawn.y);
      this.koko = new LizardCompanion(lvl.spawn.x - 14, lvl.spawn.y + 4);
      this.enemies = lvl.enemies.map((e) => new Enemy(e));
      this.projectiles = [];
      this.particles = [];
      this.floatingTexts = [];

      this.gems = lvl.gems.map(([gx, gy]) => ({ x: gx * TS + 3, y: gy * TS + 3, collected: false }));
      this.relics = lvl.relics.map((r) => ({ ...r, collected: false }));
      this.hearts = (lvl.hearts || []).map((h) => ({ x: h.x, y: h.y, collected: false }));
      this.switches = (lvl.switches || []).map((s) => ({ ...s, active: false }));
      this.movingPlatforms = (lvl.movingPlatforms || []).map((m) => ({
        ...m,
        baseX: m.x,
        baseY: m.y,
        t: 0,
        vx: 0,
        vy: 0
      }));
      this.stalactites = (lvl.stalactites || []).map((st) => ({
        x: st.x,
        y: st.y,
        baseY: st.y,
        state: 'idle', // idle | shaking | falling | broken
        vy: 0,
        timer: 0
      }));
      this.checkpoints = (lvl.checkpoints || []).map((c, i) => ({ ...c, id: i, active: false }));
      this.activeCheckpoint = -1;

      this.gemsCollected = 0;
      this.relicsCollected = 0;
      this.bossDefeated = !lvl.hasBoss;
      this.shakeTimer = 0;
      this.lastSignText = '';

      this.camX = Math.max(0, this.player.x - VIEW_W / 2);
      this.camY = Math.max(0, this.player.y - VIEW_H / 2);

      this.state = 'playing';
      this.screenTitle.classList.add('hidden');
      this.screenLevels.classList.add('hidden');
      this.screenPause.classList.add('hidden');
      this.screenResult.classList.add('hidden');
      this.lizardDock.classList.remove('hidden');

      this.hudLevelName.textContent = lvl.name;
      this.updateHUD();
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
      this.canvas.focus();
      window.retroAudio.startBgm(lvl.biome);
      this.showToast(`¡Explora ${lvl.shortName} junto a Koko!`);
    }

    togglePause() {
      if (this.state === 'playing') {
        this.state = 'paused';
        document.getElementById('pause-stats').textContent =
          `Gemas: ${this.gemsCollected} · Reliquias: ${this.relicsCollected}/3 · Puntuación: ${this.score}`;
        this.screenPause.classList.remove('hidden');
      } else if (this.state === 'paused') {
        this.state = 'playing';
        this.screenPause.classList.add('hidden');
        this.canvas.focus();
      }
    }

    showToast(msg, duration = 170) {
      this.contextToast.textContent = msg;
      this.contextToast.classList.remove('hidden');
      this.toastTimer = duration;
    }

    addScore(pts) {
      this.score += pts;
    }

    // Tile helpers
    getTile(tx, ty) {
      if (ty < 0 || ty >= this.level.rows || tx < 0 || tx >= this.level.cols) return '#';
      return this.grid[ty][tx];
    }

    setTile(tx, ty, ch) {
      if (ty >= 0 && ty < this.level.rows && tx >= 0 && tx < this.level.cols) {
        this.grid[ty][tx] = ch;
      }
    }

    isSolidTile(ch) {
      return ch === '#' || ch === '=' || ch === 'C' || ch === 'G' || ch === 'T' || ch === 'I';
    }

    isOneWayTile(ch) {
      return ch === 'B';
    }

    isSolidAt(px, py) {
      const tx = Math.floor(px / TS);
      const ty = Math.floor(py / TS);
      return this.isSolidTile(this.getTile(tx, ty));
    }

    isWaterAt(px, py) {
      const tx = Math.floor(px / TS);
      const ty = Math.floor(py / TS);
      return this.getTile(tx, ty) === 'W';
    }

    spawnParticles(x, y, color, count = 8, gravity = 0.08) {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 0.5 + Math.random() * 1.8;
        this.particles.push(
          new Particle(x, y, Math.cos(ang) * spd, Math.sin(ang) * spd - 0.6, color, 18 + Math.random() * 14, 2, gravity)
        );
      }
    }

    // =========================================================
    // PLAYER ATTACK & LIZARD COMPANION ABILITIES
    // =========================================================
    triggerAttack(clickWorldX) {
      const p = this.player;
      if (p.attackCooldown > 0 || p.dead) return;
      if (clickWorldX !== undefined) {
        const pcx = p.x + p.w / 2;
        if (Math.abs(clickWorldX - pcx) > 4) {
          p.facing = clickWorldX >= pcx ? 1 : -1;
        }
      }
      p.attackTimer = 10;
      p.attackCooldown = 12;
      window.retroAudio.sfx('slash');
    }

    triggerWaterPower() {
      const p = this.player;
      if (!p || p.waterCooldown > 0 || p.dead) return;
      p.waterCooldown = 22;
      const sx = p.x + (p.facing === 1 ? p.w + 2 : -2);
      const sy = p.y + p.h / 2;
      const speed = p.inWater ? 4.4 : 4.9;
      this.projectiles.push(
        new Projectile(sx, sy, p.facing * speed, 0, '#5cf2ff', true, 4, 'water')
      );
      window.retroAudio.sfx('waterPower');
      this.spawnParticles(sx, sy, '#9be7ff', 6, 0.04);
    }

    triggerTongue() {
      const p = this.player;
      const k = this.koko;
      if (k.tongueCooldown > 0 || p.dead) return;
      const pcx = p.x + p.w / 2;
      const pcy = p.y + p.h / 2;

      // 1. Check grapple rings within 125px
      let bestRing = null;
      let bestDist = 125;
      for (const ring of (this.level.grappleRings || [])) {
        const rx = ring.x + 7;
        const ry = ring.y + 7;
        const d = Math.hypot(rx - pcx, ry - pcy);
        if (d < bestDist) {
          bestDist = d;
          bestRing = { x: rx, y: ry };
        }
      }
      if (bestRing) {
        k.tongueTarget = { x: bestRing.x, y: bestRing.y, type: 'ring' };
        k.tongueTimer = 16;
        k.tongueCooldown = 30;
        p.grappleState = { targetX: bestRing.x - p.w / 2, targetY: bestRing.y - 2, timer: 16 };
        window.retroAudio.sfx('tongue');
        this.spawnParticles(bestRing.x, bestRing.y, '#ffd147', 6);
        return;
      }

      // 2. Check switches within 115px
      for (const sw of this.switches) {
        if (sw.active) continue;
        const sx = sw.x + 7;
        const sy = sw.y + 7;
        if (Math.hypot(sx - pcx, sy - pcy) < 115) {
          sw.active = true;
          sw.gateTiles.forEach(([gx, gy]) => {
            this.setTile(gx, gy, '.');
            this.spawnParticles(gx * TS + 8, gy * TS + 8, '#ffd147', 8);
          });
          k.tongueTarget = { x: sx, y: sy, type: 'switch' };
          k.tongueTimer = 14;
          k.tongueCooldown = 28;
          window.retroAudio.sfx('secret');
          this.floatingTexts.push(new FloatingText(sx - 18, sy - 10, '¡ABIERTO!', '#4ae37b'));
          this.showToast('¡Koko activó el interruptor con su lengua!');
          return;
        }
      }

      // 3. Check distant gems or relics within 100px
      for (const r of this.relics) {
        if (!r.collected && Math.hypot(r.x + 7 - pcx, r.y + 7 - pcy) < 100) {
          k.tongueTarget = { x: r.x + 7, y: r.y + 7, type: 'loot' };
          k.tongueTimer = 12;
          k.tongueCooldown = 25;
          this.collectRelic(r);
          window.retroAudio.sfx('tongue');
          return;
        }
      }
      for (const g of this.gems) {
        if (!g.collected && Math.hypot(g.x + 5 - pcx, g.y + 5 - pcy) < 95) {
          k.tongueTarget = { x: g.x + 5, y: g.y + 5, type: 'loot' };
          k.tongueTimer = 10;
          k.tongueCooldown = 20;
          this.collectGem(g);
          window.retroAudio.sfx('tongue');
          return;
        }
      }

      // 4. Tongue slap enemy within 95px
      for (const en of this.enemies) {
        if (en.dead) continue;
        const ex = en.x + en.w / 2;
        const ey = en.y + en.h / 2;
        if (Math.hypot(ex - pcx, ey - pcy) < 95) {
          k.tongueTarget = { x: ex, y: ey, type: 'enemy' };
          k.tongueTimer = 12;
          k.tongueCooldown = 30;
          en.hit(1, Math.sign(ex - pcx) || 1, this);
          en.stunTimer = 45;
          window.retroAudio.sfx('tongue');
          return;
        }
      }

      // Empty tongue flick forward
      k.tongueTarget = { x: pcx + p.facing * 42, y: pcy, type: 'miss' };
      k.tongueTimer = 8;
      k.tongueCooldown = 22;
      window.retroAudio.sfx('tongue');
    }

    triggerBurrow() {
      const p = this.player;
      const k = this.koko;
      if (k.burrowCooldown > 0 || p.dead) return;
      const pcx = p.x + p.w / 2;
      const pcy = p.y + p.h / 2;

      // Check nearby burrows
      let chosenTarget = null;
      for (const b of (this.level.burrows || [])) {
        if (Math.hypot(b.x + 8 - pcx, b.y + 7 - pcy) < 62) {
          chosenTarget = { x: b.targetX, y: b.targetY, fromBurrow: true };
          break;
        }
      }

      // Or nearby cracked tiles 'C'
      if (!chosenTarget) {
        const ptx = Math.floor(pcx / TS);
        const pty = Math.floor(pcy / TS);
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (this.getTile(ptx + dx, pty + dy) === 'C') {
              chosenTarget = { x: (ptx + dx) * TS, y: (pty + dy) * TS, fromBurrow: false };
              break;
            }
          }
          if (chosenTarget) break;
        }
      }

      if (chosenTarget) {
        k.burrowTarget = chosenTarget;
        k.burrowTimer = 22;
        k.burrowCooldown = 45;
        window.retroAudio.sfx('burrow');
        this.spawnParticles(k.x + 6, k.y + 4, '#c9933b', 8);
      } else {
        k.burrowCooldown = 20;
        window.retroAudio.sfx('burrow');
        this.floatingTexts.push(new FloatingText(k.x - 10, k.y - 8, 'Sin grietas cerca', '#9bb8cc'));
      }
    }

    resolveBurrowAction(target) {
      // Break all 'C' cracked tiles near player AND near burrow destination
      const points = [
        { x: this.player.x + 6, y: this.player.y + 8 },
        { x: target.x + 6, y: target.y + 6 }
      ];
      let brokeAny = false;
      points.forEach((pt) => {
        const cx = Math.floor(pt.x / TS);
        const cy = Math.floor(pt.y / TS);
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (this.getTile(cx + dx, cy + dy) === 'C') {
              this.setTile(cx + dx, cy + dy, '.');
              this.spawnParticles((cx + dx) * TS + 8, (cy + dy) * TS + 8, '#a6988e', 10);
              brokeAny = true;
            }
          }
        }
      });

      // Collect any relic or gems right at the burrow destination
      let foundLoot = false;
      for (const r of this.relics) {
        if (!r.collected && Math.hypot(r.x - target.x, r.y - target.y) < 42) {
          this.collectRelic(r);
          foundLoot = true;
        }
      }
      for (const g of this.gems) {
        if (!g.collected && Math.hypot(g.x - target.x, g.y - target.y) < 36) {
          this.collectGem(g);
          foundLoot = true;
        }
      }

      if (brokeAny || foundLoot) {
        window.retroAudio.sfx('secret');
        this.shakeTimer = 8;
        this.showToast('¡Koko abrió el paso secreto!');
      }
    }

    triggerGlow() {
      const k = this.koko;
      if (k.glowCooldown > 0 || this.player.dead) return;
      k.glowTimer = 360; // 6 seconds of bioluminescence
      k.glowCooldown = 420;
      window.retroAudio.sfx('glow');
      this.spawnParticles(k.x + 6, k.y + 4, '#4df7ff', 14, -0.02);

      // Stun enemies within 80px
      const kx = k.x + 6;
      const ky = k.y + 4;
      let stunned = 0;
      for (const en of this.enemies) {
        if (!en.dead && Math.hypot(en.x + en.w / 2 - kx, en.y + en.h / 2 - ky) < 85) {
          en.stunTimer = 120;
          stunned++;
        }
      }
      if (stunned > 0) {
        this.floatingTexts.push(new FloatingText(kx - 16, ky - 12, '¡CEGADOS!', '#4df7ff'));
      }
    }

    hasNearbySecret(px, py, radius) {
      const tx0 = Math.floor((px - radius) / TS);
      const tx1 = Math.floor((px + radius) / TS);
      const ty0 = Math.floor((py - radius) / TS);
      const ty1 = Math.floor((py + radius) / TS);
      for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
          const ch = this.getTile(tx, ty);
          if (ch === 'C' || ch === 'V' || ch === 'I') return true;
        }
      }
      for (const b of (this.level.burrows || [])) {
        if (Math.hypot(b.x - px, b.y - py) < radius) return true;
      }
      return false;
    }

    // =========================================================
    // COLLECTIBLES & DAMAGE
    // =========================================================
    collectGem(g) {
      if (g.collected) return;
      g.collected = true;
      this.gemsCollected++;
      this.addScore(10);
      window.retroAudio.sfx('gem');
      this.spawnParticles(g.x + 5, g.y + 5, '#5cf2ff', 6);
      this.floatingTexts.push(new FloatingText(g.x, g.y - 4, '+10', '#5cf2ff'));
      this.updateHUD();
    }

    collectRelic(r) {
      if (r.collected) return;
      r.collected = true;
      this.relicsCollected++;
      this.addScore(150);
      window.retroAudio.sfx('relic');
      this.spawnParticles(r.x + 7, r.y + 7, '#ffd147', 16);
      this.floatingTexts.push(new FloatingText(r.x - 10, r.y - 8, '¡RELIQUIA!', '#ffd147'));
      this.showToast(`¡Reliquia secreta encontrada (${this.relicsCollected}/3)!`);
      this.updateHUD();
    }

    damagePlayer(amount, knockDir = 0) {
      const p = this.player;
      if (p.invulnTimer > 0 || p.dead) return;
      p.hp = Math.max(0, p.hp - amount);
      p.invulnTimer = 65;
      p.vy = -3.2;
      if (knockDir !== 0) p.vx = knockDir * 2.5;
      this.shakeTimer = 10;
      window.retroAudio.sfx('hurt');
      this.spawnParticles(p.x + 6, p.y + 8, '#ff4d6d', 10);
      this.updateHUD();

      if (p.hp <= 0) {
        this.handlePlayerDeath();
      }
    }

    handlePlayerDeath() {
      const p = this.player;
      p.dead = true;
      window.retroAudio.sfx('gameover');
      setTimeout(() => {
        if (this.state !== 'playing') return;
        // Respawn at last checkpoint with full health or show Game Over if preferred;
        // Respawning at checkpoint keeps retro adventure fun and forgiving!
        p.dead = false;
        p.hp = p.maxHp;
        p.oxygen = 100;
        p.x = p.spawnX;
        p.y = p.spawnY;
        p.vx = 0;
        p.vy = 0;
        p.invulnTimer = 75;
        this.updateHUD();
        this.showToast('¡Kai regresó al último tótem de control!');
      }, 650);
    }

    onBossDefeated() {
      this.bossDefeated = true;
      this.shakeTimer = 20;
      window.retroAudio.sfx('secret');
      this.showToast('¡Guardián de Obsidiana derrotado! ¡Corre hacia el portal de salida!');
    }

    completeLevel() {
      if (this.state !== 'playing') return;
      this.state = 'result';
      window.retroAudio.stopBgm();
      window.retroAudio.sfx('victory');
      this.lizardDock.classList.add('hidden');

      // Update save progress
      if (this.levelIdx + 1 > this.progress.unlocked && this.levelIdx + 1 < window.LEVELS.length) {
        this.progress.unlocked = this.levelIdx + 1;
      }
      if (this.relicsCollected > (this.progress.relicsByLevel[this.levelIdx] || 0)) {
        this.progress.relicsByLevel[this.levelIdx] = this.relicsCollected;
      }
      if (this.score > this.progress.bestScore) {
        this.progress.bestScore = this.score;
      }
      this.saveProgress();

      const isFinal = this.levelIdx === window.LEVELS.length - 1;
      document.getElementById('result-badge').textContent = isFinal ? '¡AVENTURA COMPLETADA!' : 'ZONA COMPLETADA';
      document.getElementById('result-title').textContent = isFinal ? '¡MAESTRO DE LA ISLA!' : '¡NIVEL SUPERADO!';
      document.getElementById('result-desc').textContent = isFinal
        ? 'Kai y Koko han superado todos los peligros de la isla y descubierto los secretos del templo.'
        : `Has atravesado ${this.level.shortName}. ¡Nuevos desafíos esperan más adelante!`;

      document.getElementById('result-stats').innerHTML = `
        <div>GEMAS<span class="stat-val">${this.gemsCollected}/${this.gems.length}</span></div>
        <div>RELIQUIAS<span class="stat-val">${this.relicsCollected}/3</span></div>
        <div>PUNTOS<span class="stat-val">${this.score}</span></div>
      `;

      const nextBtn = document.getElementById('btn-next-level');
      nextBtn.style.display = isFinal ? 'none' : 'inline-block';
      this.screenResult.classList.remove('hidden');
    }

    // =========================================================
    // MAIN UPDATE LOOP (60fps)
    // =========================================================
    update() {
      this.tick++;

      if (this.toastTimer > 0) {
        this.toastTimer--;
        if (this.toastTimer === 0) this.contextToast.classList.add('hidden');
      }
      if (this.shakeTimer > 0) this.shakeTimer--;

      if (this.state !== 'playing') {
        this.prevKeys = { ...this.keys };
        return;
      }

      this.updateMovingPlatforms();
      this.updatePlayer();
      this.koko.update(this, this.player);
      this.updateEnemiesAndCombat();
      this.updateStalactites();
      this.updateCollectiblesAndTriggers();

      this.particles = this.particles.filter((pt) => {
        pt.update();
        return pt.life > 0;
      });
      this.floatingTexts = this.floatingTexts.filter((ft) => {
        ft.update();
        return ft.life > 0;
      });

      this.updateCamera();
      this.updateAbilityUI();
      this.prevKeys = { ...this.keys };
    }

    updateMovingPlatforms() {
      for (const m of this.movingPlatforms) {
        const oldX = m.x;
        const oldY = m.y;
        m.t += 0.02 * m.speed;
        const factor = (Math.sin(m.t) + 1) / 2; // 0..1 smooth oscillation
        m.x = m.baseX + m.dx * factor;
        m.y = m.baseY + m.dy * factor;
        m.vx = m.x - oldX;
        m.vy = m.y - oldY;
      }
    }

    updatePlayer() {
      const p = this.player;
      if (p.dead) return;

      p.animTimer++;
      if (p.invulnTimer > 0) p.invulnTimer--;
      if (p.attackTimer > 0) p.attackTimer--;
      if (p.attackCooldown > 0) p.attackCooldown--;
      if (p.waterCooldown > 0) p.waterCooldown--;
      if (p.dropThroughTimer > 0) p.dropThroughTimer--;

      // Grapple zip movement overrides normal gravity
      if (p.grappleState) {
        p.grappleState.timer--;
        const dx = p.grappleState.targetX - p.x;
        const dy = p.grappleState.targetY - p.y;
        p.vx = dx * 0.38;
        p.vy = dy * 0.38;
        p.x += p.vx;
        p.y += p.vy;
        if (p.grappleState.timer <= 0 || Math.hypot(dx, dy) < 6) {
          p.vy = -4.0; // nice release arc
          p.grappleState = null;
        }
        return;
      }

      const left = this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['k:a'] || this.keys['kc:37'] || this.keys['kc:65'];
      const right = this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['k:d'] || this.keys['kc:39'] || this.keys['kc:68'];
      const up = this.keys['ArrowUp'] || this.keys['Space'] || this.keys['k: '] || this.keys['kc:38'] || this.keys['kc:32'];
      const down = this.keys['ArrowDown'] || this.keys['k:arrowdown'] || this.keys['kc:40'];
      const upJustPressed =
        ((this.keys['ArrowUp'] || this.keys['k:arrowup'] || this.keys['kc:38']) && !(this.prevKeys['ArrowUp'] || this.prevKeys['k:arrowup'] || this.prevKeys['kc:38'])) ||
        ((this.keys['Space'] || this.keys['k: '] || this.keys['kc:32']) && !(this.prevKeys['Space'] || this.prevKeys['k: '] || this.prevKeys['kc:32']));
      const downJustPressed = down && !(this.prevKeys['ArrowDown'] || this.prevKeys['k:arrowdown'] || this.prevKeys['kc:40']);

      // Check water immersion at center of player
      const wasInWater = p.inWater;
      p.inWater = this.isWaterAt(p.x + p.w / 2, p.y + p.h * 0.6);

      if (p.inWater && !wasInWater) {
        window.retroAudio.sfx('splash');
        this.spawnParticles(p.x + 6, p.y + 8, '#9be7ff', 10);
      }

      if (p.inWater) {
        // Swimming physics (snappy & responsive)
        const swimSpeed = 2.45;
        if (left) { p.vx = -swimSpeed; p.facing = -1; }
        else if (right) { p.vx = swimSpeed; p.facing = 1; }
        else { p.vx *= 0.8; }

        if (up) {
          const headInAir = !this.isWaterAt(p.x + p.w / 2, p.y - 2);
          p.vy = headInAir ? -5.0 : -2.9;
        } else if (down) {
          p.vy = 2.8;
        } else {
          p.vy = Math.min(0.85, p.vy + 0.08);
        }

        // Oxygen management when fully submerged
        const headSubmerged = this.isWaterAt(p.x + p.w / 2, p.y + 1);
        if (headSubmerged) {
          p.oxygen = Math.max(0, p.oxygen - 0.14);
          if (this.tick % 20 === 0) {
            this.particles.push(new Particle(p.x + 6, p.y, 0, -0.9, '#d4fbff', 20, 2, -0.02));
          }
          if (p.oxygen <= 0 && this.tick % 45 === 0) {
            this.damagePlayer(1);
          }
        } else {
          p.oxygen = Math.min(100, p.oxygen + 2.2);
        }
      } else {
        // Fast, agile platforming physics
        p.oxygen = Math.min(100, p.oxygen + 3.0);
        const moveSpeed = 3.6;
        if (left) {
          p.vx = -moveSpeed;
          p.facing = -1;
        } else if (right) {
          p.vx = moveSpeed;
          p.facing = 1;
        } else {
          p.vx *= 0.68;
          if (Math.abs(p.vx) < 0.1) p.vx = 0;
        }

        if (p.onGround) p.coyoteTimer = 7;
        else if (p.coyoteTimer > 0) p.coyoteTimer--;

        if (upJustPressed) p.jumpBuffer = 7;
        else if (p.jumpBuffer > 0) p.jumpBuffer--;

        if (p.jumpBuffer > 0 && p.coyoteTimer > 0) {
          p.vy = -6.35;
          p.onGround = false;
          p.coyoteTimer = 0;
          p.jumpBuffer = 0;
          window.retroAudio.sfx('jump');
          this.spawnParticles(p.x + 6, p.y + p.h, '#ffe08a', 4, 0.05);
        }

        // Variable jump height when releasing jump early
        if (!up && p.vy < -2.6) {
          p.vy *= 0.82;
        }

        // Drop through one-way bridge with ArrowDown
        if (downJustPressed && p.onGround) {
          const footTy = Math.floor((p.y + p.h + 2) / TS);
          const txL = Math.floor((p.x + 2) / TS);
          const txR = Math.floor((p.x + p.w - 2) / TS);
          if (this.isOneWayTile(this.getTile(txL, footTy)) || this.isOneWayTile(this.getTile(txR, footTy))) {
            p.dropThroughTimer = 12;
            p.y += 2;
            p.onGround = false;
          }
        }

        p.vy = Math.min(7.4, p.vy + 0.38);
      }

      this.movePlayerWithCollisions();
      this.checkTileHazards();
    }

    movePlayerWithCollisions() {
      const p = this.player;

      // Horizontal step
      p.x += p.vx;
      const topTy = Math.floor((p.y + 2) / TS);
      const botTy = Math.floor((p.y + p.h - 2) / TS);
      if (p.vx > 0) {
        const rightTx = Math.floor((p.x + p.w) / TS);
        for (let ty = topTy; ty <= botTy; ty++) {
          if (this.isSolidTile(this.getTile(rightTx, ty))) {
            p.x = rightTx * TS - p.w - 0.01;
            p.vx = 0;
            break;
          }
        }
      } else if (p.vx < 0) {
        const leftTx = Math.floor(p.x / TS);
        for (let ty = topTy; ty <= botTy; ty++) {
          if (this.isSolidTile(this.getTile(leftTx, ty))) {
            p.x = (leftTx + 1) * TS + 0.01;
            p.vx = 0;
            break;
          }
        }
      }

      // Vertical step
      const prevBottom = p.y + p.h;
      p.y += p.vy;
      p.onGround = false;

      const leftTx = Math.floor((p.x + 1.5) / TS);
      const rightTx = Math.floor((p.x + p.w - 1.5) / TS);

      if (p.vy >= 0) {
        const footTy = Math.floor((p.y + p.h) / TS);
        for (let tx = leftTx; tx <= rightTx; tx++) {
          const ch = this.getTile(tx, footTy);
          if (this.isSolidTile(ch)) {
            p.y = footTy * TS - p.h;
            p.vy = 0;
            p.onGround = true;
            break;
          }
          if (
            this.isOneWayTile(ch) &&
            p.dropThroughTimer === 0 &&
            prevBottom <= footTy * TS + 4
          ) {
            p.y = footTy * TS - p.h;
            p.vy = 0;
            p.onGround = true;
            break;
          }
        }

        // Moving platforms (one-way landing)
        for (const m of this.movingPlatforms) {
          if (
            p.x + p.w > m.x &&
            p.x < m.x + m.w &&
            prevBottom <= m.y + 4 &&
            p.y + p.h >= m.y
          ) {
            p.y = m.y - p.h;
            p.vy = 0;
            p.onGround = true;
            p.x += m.vx;
            p.y += m.vy;
            break;
          }
        }
      } else if (p.vy < 0) {
        const headTy = Math.floor(p.y / TS);
        for (let tx = leftTx; tx <= rightTx; tx++) {
          if (this.isSolidTile(this.getTile(tx, headTy))) {
            p.y = (headTy + 1) * TS;
            p.vy = 0;
            break;
          }
        }
      }

      // Clamp to level bounds
      p.x = Math.max(TS, Math.min(this.level.cols * TS - TS - p.w, p.x));
      if (p.y > this.level.rows * TS + 24) {
        this.damagePlayer(2);
        if (!p.dead) {
          p.x = p.spawnX;
          p.y = p.spawnY;
          p.vx = 0;
          p.vy = 0;
        }
      }
    }

    checkTileHazards() {
      const p = this.player;
      const cx = Math.floor((p.x + p.w / 2) / TS);
      const cy = Math.floor((p.y + p.h - 2) / TS);
      const ch = this.getTile(cx, cy);

      // Spikes
      if (ch === '^') {
        this.damagePlayer(1, -p.facing);
      }

      // Bounce Mushroom Pad
      const footTy = Math.floor((p.y + p.h + 1) / TS);
      if (this.getTile(cx, footTy) === 'M' || ch === 'M') {
        p.vy = -8.8;
        p.onGround = false;
        window.retroAudio.sfx('bounce');
        this.spawnParticles(p.x + 6, p.y + p.h, '#ff6b9d', 8);
      }
    }

    updateEnemiesAndCombat() {
      const p = this.player;
      const atkBox = p.getAttackBox();

      for (const en of this.enemies) {
        if (en.dead) continue;
        en.update(this, p);

        // Player melee slash hit check
        if (atkBox && this.rectsOverlap(atkBox, en)) {
          en.hit(1, p.facing, this);
        }

        // Contact damage to player
        if (!en.dead && en.stunTimer === 0 && this.rectsOverlap(p, en)) {
          const knock = p.x < en.x ? -1 : 1;
          this.damagePlayer(1, knock);
        }
      }

      // Projectiles
      for (const pr of this.projectiles) {
        pr.update(this);
        if (pr.dead) continue;

        // Player can slash-deflect incoming projectiles!
        if (!pr.fromPlayer && atkBox && this.pointInRect(pr.x, pr.y, atkBox)) {
          pr.fromPlayer = true;
          pr.vx = p.facing * 2.8;
          pr.vy = -0.3;
          pr.color = '#4de8e8';
          window.retroAudio.sfx('hit');
          this.spawnParticles(pr.x, pr.y, '#4de8e8', 5);
          continue;
        }

        if (pr.fromPlayer) {
          for (const en of this.enemies) {
            if (!en.dead && this.pointInRect(pr.x, pr.y, en)) {
              en.hit(2, Math.sign(pr.vx) || 1, this);
              pr.dead = true;
              break;
            }
          }
        } else if (this.pointInRect(pr.x, pr.y, p)) {
          this.damagePlayer(1, Math.sign(pr.vx) || 1);
          pr.dead = true;
        }
      }
      this.projectiles = this.projectiles.filter((pr) => !pr.dead);
    }

    updateStalactites() {
      const p = this.player;
      for (const st of this.stalactites) {
        if (st.state === 'idle') {
          if (Math.abs(p.x - st.x) < 28 && p.y > st.y) {
            st.state = 'shaking';
            st.timer = 18;
          }
        } else if (st.state === 'shaking') {
          st.timer--;
          if (st.timer <= 0) {
            st.state = 'falling';
            st.vy = 0;
          }
        } else if (st.state === 'falling') {
          st.vy = Math.min(5.5, st.vy + 0.25);
          st.y += st.vy;
          if (this.rectsOverlap(p, { x: st.x + 2, y: st.y, w: 10, h: 14 })) {
            this.damagePlayer(1);
            st.state = 'broken';
            this.spawnParticles(st.x + 7, st.y + 8, '#6a789e', 10);
          } else if (this.isSolidAt(st.x + 7, st.y + 14)) {
            st.state = 'broken';
            window.retroAudio.sfx('hit');
            this.spawnParticles(st.x + 7, st.y + 12, '#6a789e', 10);
          }
        } else if (st.state === 'broken') {
          st.timer++;
          if (st.timer > 240) {
            st.y = st.baseY;
            st.state = 'idle';
            st.timer = 0;
          }
        }
      }
    }

    updateCollectiblesAndTriggers() {
      const p = this.player;
      const pcx = p.x + p.w / 2;
      const pcy = p.y + p.h / 2;

      for (const g of this.gems) {
        if (!g.collected && Math.hypot(g.x + 5 - pcx, g.y + 5 - pcy) < 14) {
          this.collectGem(g);
        }
      }

      for (const r of this.relics) {
        if (!r.collected && Math.hypot(r.x + 7 - pcx, r.y + 7 - pcy) < 15) {
          this.collectRelic(r);
        }
      }

      for (const h of this.hearts) {
        if (!h.collected && Math.hypot(h.x + 5 - pcx, h.y + 5 - pcy) < 15) {
          h.collected = true;
          p.hp = Math.min(p.maxHp, p.hp + 2);
          window.retroAudio.sfx('heal');
          this.spawnParticles(h.x + 5, h.y + 5, '#ff4d6d', 8);
          this.floatingTexts.push(new FloatingText(h.x, h.y - 4, '+2 VIDA', '#ff6b8b'));
          this.updateHUD();
        }
      }

      for (const cp of this.checkpoints) {
        if (!cp.active && Math.hypot(cp.x + 7 - pcx, cp.y + 12 - pcy) < 22) {
          cp.active = true;
          this.activeCheckpoint = cp.id;
          p.spawnX = cp.x;
          p.spawnY = cp.y + 6;
          window.retroAudio.sfx('checkpoint');
          this.floatingTexts.push(new FloatingText(cp.x - 10, cp.y - 6, '¡GUARDADO!', '#ffd147'));
        }
      }

      // Tutorial signposts
      for (const sign of (this.level.signs || [])) {
        if (Math.hypot(sign.x + 8 - pcx, sign.y + 8 - pcy) < 24) {
          if (this.lastSignText !== sign.text) {
            this.lastSignText = sign.text;
            this.showToast(sign.text, 240);
          }
        }
      }

      // Exit portal
      const ex = this.level.exit;
      if (Math.hypot(ex.x + 12 - pcx, ex.y + 15 - pcy) < 20) {
        if (!this.bossDefeated) {
          if (this.toastTimer === 0) {
            this.showToast('¡Debes derrotar al Guardián de Obsidiana antes de cruzar el portal!');
          }
        } else {
          this.completeLevel();
        }
      }
    }

    updateCamera() {
      const targetX = this.player.x + this.player.w / 2 + this.player.facing * 26 - VIEW_W / 2;
      const targetY = this.player.y + this.player.h / 2 - VIEW_H / 2 - 8;
      const maxCamX = this.level.cols * TS - VIEW_W;
      const maxCamY = this.level.rows * TS - VIEW_H;

      this.camX += (Math.max(0, Math.min(maxCamX, targetX)) - this.camX) * 0.24;
      this.camY += (Math.max(0, Math.min(maxCamY, targetY)) - this.camY) * 0.24;
    }

    updateHUD() {
      this.hudHearts.innerHTML = '';
      for (let i = 0; i < this.player.maxHp; i++) {
        const span = document.createElement('span');
        span.className = 'heart' + (i < this.player.hp ? '' : ' empty');
        span.textContent = '♥';
        this.hudHearts.appendChild(span);
      }

      if (this.player.inWater || this.player.oxygen < 99) {
        this.hudOxygenWrap.style.display = 'flex';
        this.hudOxygenFill.style.width = `${Math.round(this.player.oxygen)}%`;
      } else {
        this.hudOxygenWrap.style.display = 'none';
      }

      this.hudGems.textContent = String(this.gemsCollected).padStart(3, '0');
      this.hudRelics.textContent = `${this.relicsCollected}/3`;
    }

    updateAbilityUI() {
      if (!this.koko) return;
      const setBar = (el, cd, maxCd) => {
        el.style.width = cd > 0 ? `${Math.round((cd / maxCd) * 100)}%` : '100%';
        el.parentElement.classList.toggle('on-cooldown', cd > 0);
      };
      if (this.player && this.cdWater) {
        setBar(this.cdWater, this.player.waterCooldown, 22);
      }
      setBar(this.cdTongue, this.koko.tongueCooldown, 30);
      setBar(this.cdBurrow, this.koko.burrowCooldown, 45);
      setBar(this.cdGlow, this.koko.glowCooldown, 420);
      this.cdGlow.parentElement.classList.toggle('active', this.koko.glowTimer > 0);

      // Update oxygen bar continuously in water
      if (this.player && (this.player.inWater || this.player.oxygen < 99)) {
        this.hudOxygenWrap.style.display = 'flex';
        this.hudOxygenFill.style.width = `${Math.round(this.player.oxygen)}%`;
      } else {
        this.hudOxygenWrap.style.display = 'none';
      }
    }

    rectsOverlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    pointInRect(px, py, r) {
      return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    }

    // =========================================================
    // RENDERING PIPELINE
    // =========================================================
    render() {
      const ctx = this.ctx;
      const lvl = this.level || window.LEVELS[0];
      const sp = window.pixelSprites;

      let sx = 0, sy = 0;
      if (this.shakeTimer > 0) {
        sx = Math.round((Math.random() - 0.5) * 4);
        sy = Math.round((Math.random() - 0.5) * 4);
      }
      const cx = Math.round(this.camX) + sx;
      const cy = Math.round(this.camY) + sy;

      // 1. Sky & Parallax Background
      const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      grad.addColorStop(0, lvl.skyTop);
      grad.addColorStop(1, lvl.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      this.drawParallax(ctx, lvl, cx);

      if (!this.level) return;

      // 2. Decorative Background Props (Palms, Crystals, Torches, Signs)
      for (const pxTile of (lvl.palms || [])) {
        const wx = pxTile * TS - cx;
        // Find ground surface at pxTile
        let groundY = (lvl.rows - 5) * TS;
        for (let ty = 0; ty < lvl.rows; ty++) {
          if (this.isSolidTile(this.getTile(pxTile, ty))) {
            groundY = ty * TS;
            break;
          }
        }
        ctx.drawImage(sp.sprites.palmTree, Math.round(wx - 12), Math.round(groundY - cy - 60));
      }

      for (const cTile of (lvl.crystals || [])) {
        const wx = cTile * TS - cx;
        let groundY = 14 * TS;
        for (let ty = 3; ty < lvl.rows; ty++) {
          if (this.isSolidTile(this.getTile(cTile, ty))) {
            groundY = ty * TS;
            break;
          }
        }
        const wy = groundY - cy;
        ctx.fillStyle = '#25b5bd';
        ctx.fillRect(wx + 2, wy - 12, 4, 12);
        ctx.fillStyle = '#73fff7';
        ctx.fillRect(wx + 7, wy - 16, 4, 16);
        ctx.fillStyle = '#d966ff';
        ctx.fillRect(wx + 11, wy - 9, 3, 9);
      }

      for (const tTile of (lvl.torches || [])) {
        const wx = tTile * TS - cx;
        let groundY = 14 * TS;
        for (let ty = 5; ty < lvl.rows; ty++) {
          if (this.isSolidTile(this.getTile(tTile, ty))) {
            groundY = ty * TS;
            break;
          }
        }
        const wy = groundY - cy;
        ctx.fillStyle = '#5c3416';
        ctx.fillRect(wx + 6, wy - 14, 3, 14);
        const flicker = (Math.floor(this.tick / 6) % 2) * 2;
        ctx.fillStyle = '#ff6d29';
        ctx.fillRect(wx + 4, wy - 20 - flicker, 7, 6 + flicker);
        ctx.fillStyle = '#ffe96b';
        ctx.fillRect(wx + 5, wy - 18, 5, 4);
      }

      for (const sign of (lvl.signs || [])) {
        const sxPos = Math.round(sign.x - cx);
        const syPos = Math.round(sign.y - cy);
        ctx.fillStyle = '#6b3e1d';
        ctx.fillRect(sxPos + 6, syPos + 6, 3, 10);
        ctx.fillStyle = '#a86b38';
        ctx.fillRect(sxPos + 1, syPos, 13, 8);
        ctx.fillStyle = '#ffd147';
        ctx.fillRect(sxPos + 3, syPos + 2, 9, 1);
        ctx.fillRect(sxPos + 3, syPos + 4, 7, 1);
      }

      // 3. Tilemap (excluding water & curtains, drawn cleanly in pass)
      const startCol = Math.max(0, Math.floor(cx / TS) - 1);
      const endCol = Math.min(lvl.cols - 1, Math.ceil((cx + VIEW_W) / TS) + 1);
      const startRow = Math.max(0, Math.floor(cy / TS) - 1);
      const endRow = Math.min(lvl.rows - 1, Math.ceil((cy + VIEW_H) / TS) + 1);

      const topTile =
        lvl.biome === 'beach' ? sp.tiles.sandTop :
        lvl.biome === 'jungle' ? sp.tiles.jungleTop :
        lvl.biome === 'cave' ? sp.tiles.crystalRock : sp.tiles.templeStone;
      const deepTile =
        lvl.biome === 'beach' ? sp.tiles.sandDeep :
        lvl.biome === 'jungle' ? sp.tiles.jungleDirt :
        lvl.biome === 'cave' ? sp.tiles.caveRock : sp.tiles.templeStone;

      for (let ty = startRow; ty <= endRow; ty++) {
        for (let tx = startCol; tx <= endCol; tx++) {
          const ch = this.getTile(tx, ty);
          const dx = tx * TS - cx;
          const dy = ty * TS - cy;

          if (ch === '#') ctx.drawImage(deepTile, dx, dy);
          else if (ch === '=') ctx.drawImage(topTile, dx, dy);
          else if (ch === 'B') ctx.drawImage(sp.tiles.bridge, dx, dy);
          else if (ch === 'T') ctx.drawImage(sp.tiles.templeGold, dx, dy);
          else if (ch === 'C') ctx.drawImage(sp.tiles.crackedWall, dx, dy);
          else if (ch === 'G') ctx.drawImage(sp.tiles.lockedGate, dx, dy);
          else if (ch === '^') ctx.drawImage(sp.tiles.spikes, dx, dy);
          else if (ch === 'M') ctx.drawImage(sp.tiles.bouncePad, dx, dy);
          else if (ch === 'I') {
            // Invisible Light Platform: faint shimmer normally, bright cyan when Koko's Destello is active!
            const glowActive = this.koko.glowTimer > 0;
            ctx.globalAlpha = glowActive ? 0.92 : 0.14 + Math.sin(this.tick * 0.08 + tx) * 0.06;
            ctx.fillStyle = glowActive ? '#4df7ff' : '#8ceeff';
            ctx.fillRect(dx, dy, TS, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(dx + 2, dy + 1, TS - 4, 2);
            ctx.globalAlpha = 1;
          }
        }
      }

      // 4. Moving platforms
      for (const m of this.movingPlatforms) {
        const mx = Math.round(m.x - cx);
        const my = Math.round(m.y - cy);
        ctx.fillStyle = lvl.biome === 'temple' ? '#c99f3c' : '#9c6030';
        ctx.fillRect(mx, my, m.w, m.h);
        ctx.fillStyle = lvl.biome === 'temple' ? '#ffe066' : '#cc894d';
        ctx.fillRect(mx, my, m.w, 2);
      }

      // 5. Interactive World Objects (Grapple Rings, Burrows, Switches, Checkpoints, Exit)
      for (const ring of (lvl.grappleRings || [])) {
        ctx.drawImage(sp.sprites.grappleRing, Math.round(ring.x - cx), Math.round(ring.y - cy));
      }
      for (const b of (lvl.burrows || [])) {
        ctx.drawImage(sp.sprites.burrow, Math.round(b.x - cx), Math.round(b.y - cy));
      }
      for (const sw of this.switches) {
        ctx.drawImage(sw.active ? sp.sprites.switchOn : sp.sprites.switchOff, Math.round(sw.x - cx), Math.round(sw.y - cy));
      }
      for (const cp of this.checkpoints) {
        ctx.drawImage(cp.active ? sp.sprites.checkpointOn : sp.sprites.checkpointOff, Math.round(cp.x - cx), Math.round(cp.y - cy));
      }
      // Exit gate
      ctx.drawImage(sp.sprites.exitGate, Math.round(lvl.exit.x - cx), Math.round(lvl.exit.y - cy));

      // Stalactites
      for (const st of this.stalactites) {
        if (st.state === 'broken') continue;
        const jx = st.state === 'shaking' ? (this.tick % 2 === 0 ? -1 : 1) : 0;
        const sxPos = Math.round(st.x - cx + jx);
        const syPos = Math.round(st.y - cy);
        ctx.fillStyle = '#4c5778';
        ctx.fillRect(sxPos + 2, syPos, 10, 5);
        ctx.fillRect(sxPos + 4, syPos + 5, 6, 5);
        ctx.fillRect(sxPos + 6, syPos + 10, 2, 4);
      }

      // 6. Collectibles (bobbing animation)
      const bob = Math.round(Math.sin(this.tick * 0.1) * 2);
      for (const g of this.gems) {
        if (!g.collected) ctx.drawImage(sp.sprites.gem, Math.round(g.x - cx), Math.round(g.y - cy + bob));
      }
      for (const r of this.relics) {
        if (!r.collected) ctx.drawImage(sp.sprites.relic, Math.round(r.x - cx), Math.round(r.y - cy + bob));
      }
      for (const h of this.hearts) {
        if (!h.collected) ctx.drawImage(sp.sprites.heart, Math.round(h.x - cx), Math.round(h.y - cy + bob));
      }

      // 7. Enemies & Projectiles
      for (const en of this.enemies) en.draw(ctx, cx, cy);
      for (const pr of this.projectiles) pr.draw(ctx, cx, cy);

      // 8. Kai (Player) & Koko (Lizard Companion)
      this.drawPlayer(ctx, cx, cy);
      this.koko.draw(ctx, cx, cy);

      // 9. Foreground Water & Secret Curtains (semi-transparent over Kai so diving & hiding behind waterfalls looks awesome!)
      for (let ty = startRow; ty <= endRow; ty++) {
        for (let tx = startCol; tx <= endCol; tx++) {
          const ch = this.getTile(tx, ty);
          const dx = tx * TS - cx;
          const dy = ty * TS - cy;
          if (ch === 'W') {
            const isSurface = this.getTile(tx, ty - 1) !== 'W';
            ctx.fillStyle = lvl.biome === 'cave' ? 'rgba(30, 140, 175, 0.45)' : 'rgba(26, 175, 214, 0.46)';
            ctx.fillRect(dx, dy, TS, TS);
            if (isSurface) {
              const wave = Math.round(Math.sin(this.tick * 0.12 + tx * 0.8) * 1.5);
              ctx.fillStyle = 'rgba(180, 250, 255, 0.8)';
              ctx.fillRect(dx, dy + wave, TS, 2);
            }
          } else if (ch === 'V') {
            const curSprite = lvl.biome === 'jungle' ? sp.tiles.waterfallCurtain : sp.tiles.secretCurtain;
            ctx.globalAlpha = this.koko.glowTimer > 0 ? 0.48 : 0.88;
            ctx.drawImage(curSprite, dx, dy);
            ctx.globalAlpha = 1;
          }
        }
      }

      // 10. Particles & Floating Text
      for (const pt of this.particles) pt.draw(ctx, cx, cy);
      for (const ft of this.floatingTexts) ft.draw(ctx, cx, cy);

      // 11. Cave Darkness & Dynamic Lighting Pass
      if (lvl.darkness > 0) {
        this.drawLighting(ctx, cx, cy, lvl);
      }
    }

    drawParallax(ctx, lvl, camX) {
      if (lvl.biome === 'beach') {
        // Sun & clouds & distant islands + ocean horizon
        ctx.fillStyle = '#fff59d';
        ctx.fillRect(320, 22, 26, 26);
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        for (let i = 0; i < 4; i++) {
          const bx = ((i * 120 - camX * 0.12) % (VIEW_W + 60) + (VIEW_W + 60)) % (VIEW_W + 60) - 40;
          ctx.fillRect(Math.round(bx), 26 + (i % 2) * 18, 36, 9);
          ctx.fillRect(Math.round(bx) + 8, 21 + (i % 2) * 18, 20, 5);
        }
        // Distant turquoise sea horizon
        ctx.fillStyle = '#1d93b8';
        ctx.fillRect(0, 148, VIEW_W, 80);
        ctx.fillStyle = '#4ad7e8';
        ctx.fillRect(0, 148, VIEW_W, 3);
      } else if (lvl.biome === 'jungle') {
        // Distant misty mountain ridges & giant jungle silhouettes
        ctx.fillStyle = '#1b6352';
        for (let i = 0; i < 6; i++) {
          const mx = ((i * 95 - camX * 0.15) % (VIEW_W + 100) + (VIEW_W + 100)) % (VIEW_W + 100) - 60;
          ctx.fillRect(Math.round(mx), 90 + (i % 2) * 15, 70, 140);
        }
      } else if (lvl.biome === 'cave') {
        // Distant glowing crystal stalagmites
        ctx.fillStyle = '#15192e';
        for (let i = 0; i < 8; i++) {
          const mx = ((i * 72 - camX * 0.2) % (VIEW_W + 80) + (VIEW_W + 80)) % (VIEW_W + 80) - 40;
          ctx.fillRect(Math.round(mx), 40, 24, 185);
        }
      } else if (lvl.biome === 'temple') {
        // Mystical twilight moon & temple silhouettes
        ctx.fillStyle = '#ffd180';
        ctx.fillRect(300, 26, 22, 22);
        ctx.fillStyle = '#331d47';
        for (let i = 0; i < 6; i++) {
          const mx = ((i * 90 - camX * 0.18) % (VIEW_W + 90) + (VIEW_W + 90)) % (VIEW_W + 90) - 50;
          ctx.fillRect(Math.round(mx), 85 + (i % 2) * 16, 48, 140);
        }
      }
    }

    drawPlayer(ctx, cx, cy) {
      const p = this.player;
      if (p.dead) return;
      if (p.invulnTimer > 0 && Math.floor(p.invulnTimer / 4) % 2 === 0) return;

      const sp = window.pixelSprites.sprites;
      let sprite = sp.kaiIdle;
      if (!p.onGround && !p.inWater) {
        sprite = sp.kaiJump;
      } else if (Math.abs(p.vx) > 0.25 || p.inWater) {
        sprite = sp.kaiRun[Math.floor(p.animTimer / 8) % 2];
      }

      const px = Math.round(p.x - cx);
      const py = Math.round(p.y - cy);

      ctx.save();
      ctx.translate(px + p.w / 2, py + p.h / 2);
      ctx.scale(p.facing, 1);
      ctx.drawImage(sprite, -8, -8);
      ctx.restore();

      // Draw Machete Slash Arc!
      if (p.attackTimer > 0) {
        const arcX = px + (p.facing === 1 ? p.w + 1 : -15);
        const arcY = py - 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(arcX + (p.facing === 1 ? 2 : 0), arcY + 2, 12, 3);
        ctx.fillStyle = '#5cf2ff';
        ctx.fillRect(arcX + (p.facing === 1 ? 4 : 2), arcY + 5, 11, 8);
        ctx.fillStyle = '#ffd147';
        ctx.fillRect(arcX + (p.facing === 1 ? 0 : 10), arcY + 7, 4, 3);
      }
    }

    drawLighting(ctx, cx, cy, lvl) {
      const lctx = this.lightCtx;
      const dimAlpha = this.koko.glowTimer > 0 ? Math.max(0.15, lvl.darkness - 0.4) : lvl.darkness;
      lctx.globalCompositeOperation = 'source-over';
      lctx.clearRect(0, 0, VIEW_W, VIEW_H);
      lctx.fillStyle = `rgba(4, 6, 16, ${dimAlpha})`;
      lctx.fillRect(0, 0, VIEW_W, VIEW_H);

      lctx.globalCompositeOperation = 'destination-out';
      const punchLight = (wx, wy, r) => {
        const sx = wx - cx;
        const sy = wy - cy;
        if (sx < -r || sx > VIEW_W + r || sy < -r || sy > VIEW_H + r) return;
        const g = lctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        lctx.fillStyle = g;
        lctx.beginPath();
        lctx.arc(sx, sy, r, 0, Math.PI * 2);
        lctx.fill();
      };

      punchLight(this.player.x + 6, this.player.y + 8, 52);
      punchLight(this.koko.x + 6, this.koko.y + 4, this.koko.glowTimer > 0 ? 135 : 38);

      for (const r of this.relics) {
        if (!r.collected) punchLight(r.x + 7, r.y + 7, 26);
      }
      for (const cTile of (lvl.crystals || [])) {
        punchLight(cTile * TS + 8, 12 * TS, 48);
      }
      for (const tTile of (lvl.torches || [])) {
        punchLight(tTile * TS + 8, 12 * TS, 62);
      }

      ctx.drawImage(this.lightCanvas, 0, 0);
    }

    loop(timestamp = 0) {
      if (!this.lastTime) this.lastTime = timestamp;
      const dt = Math.min(64, Math.max(0, timestamp - this.lastTime));
      this.lastTime = timestamp;
      this.accumulator += dt;

      const STEP = 1000 / 60;
      while (this.accumulator >= STEP) {
        this.update();
        this.accumulator -= STEP;
      }

      this.render();
      requestAnimationFrame((ts) => this.loop(ts));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
  });
})();
