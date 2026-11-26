// Entities: Kai (Player), Koko (Lizard Companion), Enemies, Projectiles, Collectibles & Hazards

class Particle {
  constructor(x, y, vx, vy, color, life = 24, size = 2, gravity = 0.08) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.gravity = gravity;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life--;
  }
  draw(ctx, camX, camY) {
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.round(this.x - camX), Math.round(this.y - camY), this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

class FloatingText {
  constructor(x, y, text, color = '#ffd147') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 45;
  }
  update() {
    this.y -= 0.35;
    this.life--;
  }
  draw(ctx, camX, camY) {
    ctx.globalAlpha = Math.min(1, this.life / 18);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#000';
    ctx.fillText(this.text, Math.round(this.x - camX) + 1, Math.round(this.y - camY) + 1);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, Math.round(this.x - camX), Math.round(this.y - camY));
    ctx.globalAlpha = 1;
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 12;
    this.h = 15;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1; // 1 right, -1 left
    this.onGround = false;
    this.inWater = false;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.hp = 5;
    this.maxHp = 5;
    this.oxygen = 100;
    this.invulnTimer = 0;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.waterCooldown = 0;
    this.attackAngle = 0;
    this.animTimer = 0;
    this.grappleState = null; // { targetX, targetY, timer }
    this.spawnX = x;
    this.spawnY = y;
    this.dead = false;
    this.dropThroughTimer = 0;
  }

  getAttackBox() {
    if (this.attackTimer <= 4) return null;
    const reach = 18;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    return {
      x: this.facing === 1 ? cx : cx - reach,
      y: cy - 10,
      w: reach,
      h: 20
    };
  }
}

class LizardCompanion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 12;
    this.h = 8;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.animTimer = 0;
    this.alertSecret = false;

    // Abilities & Cooldowns (frames)
    this.tongueTimer = 0;
    this.tongueCooldown = 0;
    this.tongueTarget = null; // { x, y, type, ref }

    this.burrowTimer = 0;
    this.burrowCooldown = 0;
    this.burrowTarget = null;

    this.glowTimer = 0;
    this.glowCooldown = 0;
  }

  update(game, player) {
    this.animTimer++;
    if (this.tongueCooldown > 0) this.tongueCooldown--;
    if (this.burrowCooldown > 0) this.burrowCooldown--;
    if (this.glowCooldown > 0) this.glowCooldown--;
    if (this.glowTimer > 0) this.glowTimer--;

    // Check if any secret (cracked wall, burrow, invisible platform, secret curtain) is nearby
    this.alertSecret = game.hasNearbySecret(player.x + player.w / 2, player.y + player.h / 2, 72);

    // Tongue active visual
    if (this.tongueTimer > 0) {
      this.tongueTimer--;
      if (this.tongueTimer === 0) this.tongueTarget = null;
    }

    // Burrow / Scout dash mode
    if (this.burrowTimer > 0 && this.burrowTarget) {
      this.burrowTimer--;
      const dx = this.burrowTarget.x - this.x;
      const dy = this.burrowTarget.y - this.y;
      this.x += dx * 0.22;
      this.y += dy * 0.22;
      if (this.burrowTimer === 10) {
        game.resolveBurrowAction(this.burrowTarget);
      }
      if (this.burrowTimer === 0) {
        this.burrowTarget = null;
      }
      return;
    }

    // Follow player smoothly (perch behind/beside Kai)
    const targetX = player.x - player.facing * 15;
    const targetY = player.inWater ? player.y - 2 : player.y + 6;
    const dx = targetX - this.x;
    const dy = targetY - this.y;

    this.vx = dx * 0.22;
    this.vy = dy * 0.24;
    this.x += this.vx;
    this.y += this.vy;

    if (Math.abs(dx) > 2) {
      this.facing = dx > 0 ? 1 : -1;
    } else {
      this.facing = player.facing;
    }
  }

  draw(ctx, camX, camY) {
    const px = Math.round(this.x - camX);
    const py = Math.round(this.y - camY);

    // Draw tongue beam if active
    if (this.tongueTimer > 0 && this.tongueTarget) {
      const sx = px + 6;
      const sy = py + 4;
      const tx = Math.round(this.tongueTarget.x - camX);
      const ty = Math.round(this.tongueTarget.y - camY);
      ctx.strokeStyle = '#ff6b8b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = '#ff9cb5';
      ctx.fillRect(tx - 2, ty - 2, 4, 4);
    }

    // Glow aura when Destello is active
    if (this.glowTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.28 + Math.sin(this.animTimer * 0.25) * 0.08;
      ctx.fillStyle = '#4df7ff';
      ctx.beginPath();
      ctx.arc(px + 7, py + 4, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const sprite =
      this.glowTimer > 0
        ? window.pixelSprites.sprites.kokoGlow
        : window.pixelSprites.sprites.koko[Math.floor(this.animTimer / 10) % 2];

    ctx.save();
    ctx.translate(px + 7, py + 5);
    ctx.scale(this.facing, 1);
    ctx.drawImage(sprite, -7, -5);
    ctx.restore();

    // Secret alert '!' bubble
    if (this.alertSecret && this.burrowTimer === 0) {
      const bob = Math.round(Math.sin(this.animTimer * 0.2) * 1.5);
      ctx.fillStyle = '#09131c';
      ctx.fillRect(px + 4, py - 11 + bob, 6, 8);
      ctx.fillStyle = '#ffd147';
      ctx.fillRect(px + 6, py - 10 + bob, 2, 4);
      ctx.fillRect(px + 6, py - 5 + bob, 2, 1);
    }
  }
}

class Projectile {
  constructor(x, y, vx, vy, color = '#ff594f', fromPlayer = false, radius = 3, style = 'normal') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.fromPlayer = fromPlayer;
    this.radius = radius;
    this.style = style;
    this.life = style === 'water' ? 95 : 150;
    this.dead = false;
  }
  update(game) {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if (this.style === 'water' && this.life % 3 === 0) {
      game.particles.push(new Particle(this.x, this.y, -this.vx * 0.15, (Math.random() - 0.5) * 0.6, '#7af5ff', 10, 2, 0.04));
    }
    if (this.life <= 0 || game.isSolidAt(this.x, this.y)) {
      this.dead = true;
      game.spawnParticles(this.x, this.y, this.style === 'water' ? '#5cf2ff' : this.color, this.style === 'water' ? 8 : 4);
    }
  }
  draw(ctx, camX, camY) {
    const px = Math.round(this.x - camX);
    const py = Math.round(this.y - camY);
    if (this.style === 'water') {
      const dir = Math.sign(this.vx) || 1;
      ctx.fillStyle = '#189fd6';
      ctx.fillRect(px - 4 * dir - 2, py - 3, 7, 6);
      ctx.fillStyle = '#5cf2ff';
      ctx.fillRect(px - 3, py - 3, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1, py - 1, 3, 3);
      return;
    }
    ctx.fillStyle = '#fff5c0';
    ctx.fillRect(px - this.radius, py - this.radius, this.radius * 2, this.radius * 2);
    ctx.fillStyle = this.color;
    ctx.fillRect(px - this.radius + 1, py - this.radius + 1, Math.max(2, this.radius * 2 - 2), Math.max(2, this.radius * 2 - 2));
  }
}

class Enemy {
  constructor(cfg) {
    this.type = cfg.type;
    this.x = cfg.x;
    this.y = cfg.y;
    this.spawnX = cfg.x;
    this.spawnY = cfg.y;
    this.minX = cfg.minX ?? cfg.x - 40;
    this.maxX = cfg.maxX ?? cfg.x + 40;
    this.baseY = cfg.baseY ?? cfg.y;
    this.rangeX = cfg.rangeX ?? 48;
    this.dir = cfg.dir ?? 1;
    this.anim = Math.floor(Math.random() * 60);
    this.hurtTimer = 0;
    this.stunTimer = 0;
    this.shootTimer = 60 + Math.floor(Math.random() * 50);
    this.dead = false;

    if (this.type === 'crab') {
      this.w = 14; this.h = 9; this.hp = 2; this.speed = 0.9;
    } else if (this.type === 'tiki') {
      this.w = 12; this.h = 12; this.hp = 3; this.speed = 0;
    } else if (this.type === 'bat') {
      this.w = 14; this.h = 8; this.hp = 2; this.speed = 1.25;
    } else if (this.type === 'piranha') {
      this.w = 12; this.h = 8; this.hp = 2; this.speed = 1.25;
    } else if (this.type === 'golem') {
      this.w = 16; this.h = 16; this.hp = 5; this.speed = 0.65;
    } else if (this.type === 'boss') {
      this.w = 30; this.h = 32; this.hp = 18; this.maxHp = 18; this.speed = 1.1;
      this.bossPhaseTimer = 0;
      this.vy = 0;
      this.active = false;
    }
  }

  hit(dmg, knockDir, game) {
    if (this.dead || this.hurtTimer > 0) return;
    this.hp -= dmg;
    this.hurtTimer = 12;
    if (this.type !== 'tiki' && this.type !== 'boss') {
      this.x += knockDir * 6;
    }
    game.spawnParticles(this.x + this.w / 2, this.y + this.h / 2, '#ffd147', 6);
    if (this.hp <= 0) {
      this.dead = true;
      window.retroAudio.sfx('hit');
      game.spawnParticles(this.x + this.w / 2, this.y + this.h / 2, '#ff6b6b', 14);
      game.addScore(this.type === 'boss' ? 500 : 25);
      if (this.type === 'boss') {
        game.onBossDefeated();
      }
    } else {
      window.retroAudio.sfx('hit');
    }
  }

  update(game, player) {
    if (this.dead) return;
    this.anim++;
    if (this.hurtTimer > 0) this.hurtTimer--;
    if (this.stunTimer > 0) {
      this.stunTimer--;
      return;
    }

    const dxP = player.x - this.x;
    const dyP = player.y - this.y;
    const distP = Math.hypot(dxP, dyP);

    if (this.type === 'crab' || this.type === 'golem') {
      this.x += this.dir * this.speed;
      if (this.x <= this.minX) { this.x = this.minX; this.dir = 1; }
      if (this.x >= this.maxX) { this.x = this.maxX; this.dir = -1; }
    } else if (this.type === 'piranha') {
      // Chase slightly if player is in water nearby, else patrol
      if (player.inWater && distP < 88) {
        this.dir = dxP > 0 ? 1 : -1;
        this.x += Math.sign(dxP) * 0.95;
        this.y += Math.sign(dyP) * 0.5;
      } else {
        this.x += this.dir * this.speed;
        this.y = this.spawnY + Math.sin(this.anim * 0.08) * 5;
        if (this.x <= this.minX) { this.x = this.minX; this.dir = 1; }
        if (this.x >= this.maxX) { this.x = this.maxX; this.dir = -1; }
      }
    } else if (this.type === 'bat') {
      this.x = this.spawnX + Math.sin(this.anim * 0.035) * this.rangeX;
      this.y = this.baseY + Math.sin(this.anim * 0.1) * 10;
      this.dir = Math.cos(this.anim * 0.035) >= 0 ? 1 : -1;
    } else if (this.type === 'tiki') {
      this.dir = player.x < this.x ? -1 : 1;
      if (distP < 170) {
        this.shootTimer--;
        if (this.shootTimer <= 0) {
          this.shootTimer = 95;
          game.projectiles.push(
            new Projectile(this.x + this.w / 2, this.y + 5, this.dir * 1.9, 0, '#ff683b', false, 3)
          );
        }
      }
    } else if (this.type === 'boss') {
      if (!this.active) {
        if (player.x > (game.level.bossAreaX || 1500)) {
          this.active = true;
          game.showToast('¡El Guardián Tiki de Obsidiana despierta!');
        } else {
          return;
        }
      }
      this.bossPhaseTimer++;
      this.dir = player.x < this.x + this.w / 2 ? -1 : 1;

      // Hover & sweep patrol across arena (x = 99*16 .. 122*16)
      const leftBound = 99 * 16;
      const rightBound = 121 * 16;
      if (this.bossPhaseTimer % 240 < 160) {
        // Track toward player horizontally
        const targetX = Math.max(leftBound, Math.min(rightBound, player.x - 8));
        this.x += Math.sign(targetX - this.x) * 0.75;
        this.y = 11 * 16 + Math.sin(this.anim * 0.06) * 16;
      } else {
        // Slam down toward ground
        if (this.y < 13 * 16) this.y += 1.8;
      }

      // Boss attacks: radial fire orbs & aimed shots
      this.shootTimer--;
      if (this.shootTimer <= 0) {
        this.shootTimer = this.hp <= 9 ? 55 : 80;
        const cx = this.x + this.w / 2;
        const cy = this.y + 16;
        const angle = Math.atan2(player.y - cy, player.x - cx);
        game.projectiles.push(new Projectile(cx, cy, Math.cos(angle) * 2.1, Math.sin(angle) * 2.1, '#ff3b5c', false, 4));
        if (this.hp <= 9) {
          game.projectiles.push(new Projectile(cx, cy, Math.cos(angle + 0.3) * 1.8, Math.sin(angle + 0.3) * 1.8, '#ffd147', false, 3));
          game.projectiles.push(new Projectile(cx, cy, Math.cos(angle - 0.3) * 1.8, Math.sin(angle - 0.3) * 1.8, '#ffd147', false, 3));
        }
      }
    }
  }

  draw(ctx, camX, camY) {
    if (this.dead) return;
    const px = Math.round(this.x - camX);
    const py = Math.round(this.y - camY);

    if (this.hurtTimer > 0 && this.hurtTimer % 4 < 2) {
      ctx.globalAlpha = 0.45;
    }

    const sp = window.pixelSprites.sprites;
    let img = sp.crab[0];
    if (this.type === 'crab') img = sp.crab[Math.floor(this.anim / 10) % 2];
    else if (this.type === 'tiki') img = sp.tiki;
    else if (this.type === 'bat') img = sp.bat[Math.floor(this.anim / 7) % 2];
    else if (this.type === 'piranha') img = sp.piranha[Math.floor(this.anim / 8) % 2];
    else if (this.type === 'golem') img = sp.golem;
    else if (this.type === 'boss') img = sp.boss;

    ctx.save();
    ctx.translate(px + this.w / 2, py + this.h / 2);
    if (this.type === 'piranha' || this.type === 'golem') {
      ctx.scale(this.dir, 1);
    }
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
    ctx.globalAlpha = 1;

    if (this.stunTimer > 0) {
      ctx.fillStyle = '#4df7ff';
      ctx.fillRect(px + 2, py - 5, 3, 3);
      ctx.fillRect(px + this.w - 5, py - 5, 3, 3);
    }

    // Boss HP bar
    if (this.type === 'boss' && this.active) {
      const bw = 36;
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(px - 3, py - 9, bw + 2, 5);
      ctx.fillStyle = '#ff3b5c';
      ctx.fillRect(px - 2, py - 8, Math.round((this.hp / this.maxHp) * bw), 3);
    }
  }
}

window.GameEntities = { Particle, FloatingText, Player, LizardCompanion, Projectile, Enemy };
