// js/systems/combatSystem.js
import { clamp, distXY } from "../core/math.js";
import { triggerGameOver } from "../ui/screens.js";
import { spawnExplosion, spawnHitEffect } from "./particleSystem.js";
import { WEAPONS } from "../core/weaponConfig.js"; 
import { playSound } from "../core/audio.js";
import { camera } from "../render/camera.js";

export function updateCombatSystem(game, meta, actions, dt) {
  if (!game.runtime.running) return;
  if (!Array.isArray(game.events)) game.events = [];

  const p = game.player;

  // =========================
  // 0) MIRA CORRIGIDA (MOUSE + CÂMERA)
  // =========================
  const screenX = actions?.mouse?.x ?? 0;
  const screenY = actions?.mouse?.y ?? 0;
  
  // A mira no mundo = Mouse na Tela + Deslocamento da Câmera
  const aimX = screenX + camera.x;
  const aimY = screenY + camera.y;
  
  game.aim = { x: aimX, y: aimY };

  // Troca de Armas
  if (actions.equip1) tryEquip(meta, "BASIC");
  if (actions.equip2) tryEquip(meta, "SHOTGUN");
  if (actions.equip3) tryEquip(meta, "MACHINEGUN");
  if (actions.equip4) tryEquip(meta, "LASER");

  // =========================
  // 1) MOVIMENTO E TURBO
  // =========================
  let speed = p.speed;
  if (actions.turbo && p.turbo > 0) {
    p.turboOn = true;
    speed *= 1.8; 
    p.turbo -= 1.5; 
  } else {
    p.turboOn = false;
    if (p.turbo < p.turboMax) p.turbo += 0.3; 
  }
  p.turbo = clamp(p.turbo, 0, p.turboMax);

  // Define a velocidade para o movementSystem aplicar depois
  if (actions.moveX || actions.moveY) {
    const len = Math.hypot(actions.moveX, actions.moveY) || 1;
    p.vx = (actions.moveX / len) * speed;
    p.vy = (actions.moveY / len) * speed;
  } else {
    p.vx = 0;
    p.vy = 0;
  }

  // =========================
  // 2) SHIELD (ESCUDO)
  // =========================
  if (p.shieldActive) {
    p.shieldTime--;
    if (p.shieldTime <= 0) {
      p.shieldActive = false;
      p.shieldCharge = 0;
    }
  } else {
    if (actions.shielding && p.shieldCharge >= 100) {
      p.shieldActive = true;
      p.shieldTime = 60 * 20; // Duração do escudo
      playSound("POWERUP");
    }
  }

  // =========================
  // 3) SUPER ATAQUE (TECLA Q)
  // =========================
  if (actions.super && p.superCharge >= 100) {
    p.superCharge = 0;
    playSound("POWERUP"); // Som de poder
    
    // Explosão de balas em 360 graus
    const bulletCount = 30;
    for (let i = 0; i < bulletCount; i++) {
      const angle = (Math.PI * 2 / bulletCount) * i;
      game.bullets.push({
        x: p.x, 
        y: p.y,
        vx: Math.cos(angle) * 12, 
        vy: Math.sin(angle) * 12,
        r: 8, 
        dmg: 5, 
        life: 80, 
        color: "#ff00ff", 
        super: true
      });
    }
  }

  // =========================
  // 4) TIRO NORMAL
  // =========================
  if (p.fireCd > 0) p.fireCd--;

  const weaponId = meta.currentWeaponId || "BASIC";
  const wConfig = WEAPONS[weaponId] || WEAPONS.BASIC;
  const fireRateMult = 1 - ((meta.upgrades?.FIRE_RATE || 0) * 0.1); 
  const realCd = Math.max(2, wConfig.fireCd * fireRateMult);

  if (actions.shooting && p.fireCd <= 0) {
    p.fireCd = realCd;
    
    if (weaponId === "SHOTGUN") playSound("SHOOT_SHOTGUN");
    else if (weaponId === "MACHINEGUN") playSound("SHOOT_MACHINE");
    else playSound("SHOOT_BASIC");

    const baseAngle = Math.atan2(aimY - p.y, aimX - p.x);
    for (let i = 0; i < wConfig.count; i++) {
      const offset = wConfig.count > 1 
        ? (Math.random() - 0.5) * wConfig.spread 
        : (Math.random() - 0.5) * wConfig.spread; 

      const finalAngle = baseAngle + offset;

      game.bullets.push({
        x: p.x + Math.cos(baseAngle) * 20, 
        y: p.y + Math.sin(baseAngle) * 20,
        vx: Math.cos(finalAngle) * wConfig.speed,
        vy: Math.sin(finalAngle) * wConfig.speed,
        r: wConfig.size,
        dmg: wConfig.damage,
        life: wConfig.life,
        color: wConfig.color,
        super: false
      });
    }
  }

  updatePlayerBullets(game);
  handleEnemyShooting(game);

  // =========================
  // 5) COLISÕES E LIMPEZA
  // =========================
  
  // Remove inimigos mortos
  game.enemies = game.enemies.filter(e => {
    if (e.hp <= 0 && !e.dead) {
      killEnemy(game, meta, e);
      return false; // Remove da lista
    }
    return !e.dead;
  });

  // Remove caixas destruídas
  game.crates = game.crates.filter(c => {
    if (c.hp <= 0 && !c.dead) {
      breakCrate(game, meta, c);
      return false; // Remove da lista
    }
    return !c.dead;
  });

  handleCollisions(game, meta);         
  handleContactDamage(game, meta);      
  handleEnemyBulletCollisions(game, meta);

  if (p.lives <= 0) {
    game.runtime.running = false;
    game.runtime.screen = "gameover";
    triggerGameOver(game);
  }
}

// --- SUB-ROTINAS ---

function tryEquip(meta, weaponId) {
  if (meta.weaponsUnlocked && meta.weaponsUnlocked[weaponId]) {
    meta.currentWeaponId = weaponId;
    playSound("POWERUP");
  }
}

function updatePlayerBullets(game) {
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    const b = game.bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.life--;
    if (b.life <= 0) game.bullets.splice(i, 1);
  }
}

function handleEnemyShooting(game) {
  const p = game.player;
  if (!game.enemyBullets) game.enemyBullets = [];
  for (const e of game.enemies) {
    if (e.dead || !e.ranged) continue;
    if (e.shootCd > 0) e.shootCd--;
    const dist = distXY(e.x, e.y, p.x, p.y);
    if (e.shootCd <= 0 && dist <= (e.range || 400) && p.lives > 0) {
      e.shootCd = e.shootCdMax || 70;
      playSound("ENEMY_SHOOT");
      
      const angle = e.aimAngle || 0;
      game.enemyBullets.push({
        x: e.x + Math.cos(angle) * (e.r + 5),
        y: e.y + Math.sin(angle) * (e.r + 5),
        vx: Math.cos(angle) * (e.bulletSpeed || 5),
        vy: Math.sin(angle) * (e.bulletSpeed || 5),
        r: e.bulletRadius || 4.5,
        dmg: e.bulletDmg || 1,
        life: e.bulletLife || 100
      });
    }
  }
}

function handleCollisions(game, meta) {
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    const b = game.bullets[i];
    let hit = false;
    
    // Inimigos
    for (const e of game.enemies) {
      const dist = distXY(b.x, b.y, e.x, e.y);
      if (dist < (b.r + e.r)) {
        e.hp -= b.dmg;
        hit = true;
        spawnHitEffect(game, e.x, e.y, e.color || "#fff");
        playSound("HIT");
        break; 
      }
    }

    // Caixas
    if (!hit) {
      for (const c of game.crates) {
        const dist = distXY(b.x, b.y, c.x, c.y); 
        if (dist < (b.r + c.size * 0.6)) {
          c.hp -= b.dmg;
          hit = true;
          playSound("HIT");
          break;
        }
      }
    }
    if (hit) game.bullets.splice(i, 1);
  }
}

function handleContactDamage(game, meta) {
  const p = game.player;
  for (const e of game.enemies) {
    const dist = distXY(p.x, p.y, e.x, e.y);
    if (dist < (p.r + e.r)) {
      if (p.shieldActive) {
        e.hp = 0; // Mata inimigo
        playSound("EXPLOSION");
        continue;
      }
      p.lives -= 1;
      e.hp = 0; // Inimigo explode ao bater
      playSound("EXPLOSION");
      meta.save.dirty = true;
    }
  }
}

function handleEnemyBulletCollisions(game, meta) {
  const p = game.player;
  if (!game.enemyBullets) return;
  for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
    const b = game.enemyBullets[i];
    const dist = distXY(b.x, b.y, p.x, p.y);
    if (dist < (b.r + p.r)) {
      game.enemyBullets.splice(i, 1);
      if (p.shieldActive) continue; 
      p.lives -= b.dmg;
      meta.save.dirty = true;
      spawnHitEffect(game, p.x, p.y, "#ff0000");
      playSound("HIT");
    }
  }
}

// Helpers
function killEnemy(game, meta, e) {
  e.dead = true; 
  spawnExplosion(game, e.x, e.y, e.color || "#ff0055", 20);
  playSound("EXPLOSION");

  game.progression.score += e.scoreValue || 10;
  game.events.push({ type: "KILL", enemyType: e.type, amount: 1 });
  
  // --- CORREÇÃO AQUI ---
  // Só recarrega o escudo se ele NÃO estiver ativo no momento
  if (!game.player.shieldActive) {
      game.player.shieldCharge = Math.min(100, game.player.shieldCharge + 6);
  }
  
  // Super continua carregando sempre
  game.player.superCharge = Math.min(100, game.player.superCharge + 10);
}

function breakCrate(game, meta, c) {
  c.dead = true;
  spawnExplosion(game, c.x, c.y, "#00eaff", 15);
  playSound("EXPLOSION");
  game.events.push({ type: "CRATE_BREAK", amount: 1 });
}