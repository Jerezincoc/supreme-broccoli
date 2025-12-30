// js/systems/dropSystem.js
import { rand, distXY } from "../core/math.js";

/**
 * DropSystem
 * - spawna moedas baseado em eventos (enemy morto / crate quebrada)
 * - move moedas (magnet)
 * - coleta moedas -> meta.money
 *
 * Emite eventos em game.events para missões:
 * - { type:"COIN", amount:n }
 */

export function updateDropSystem(game, meta, actions, dt) {
  if (!game.runtime.running) return;

  if (!Array.isArray(game.events)) game.events = [];

  spawnCoinsFromDeadEnemies(game);
  spawnCoinsFromBrokenCrates(game);

  updateCoins(game);
  collectCoins(game, meta);
}

/* =========================
   SPAWN COINS
   ========================= */

function spawnCoinsFromDeadEnemies(game) {
  for (const e of game.enemies) {
    if (!e.dead) continue;
    if (e._dropDone) continue;
    e._dropDone = true;

    if (e.type === "tank") {
      // tank: garantido 2~3 moedas
      spawnCoin(game, e.x + rand(-10, 10), e.y + rand(-10, 10), 1);
      spawnCoin(game, e.x + rand(-10, 10), e.y + rand(-10, 10), 1);
      if (Math.random() < 0.35) spawnCoin(game, e.x + rand(-10, 10), e.y + rand(-10, 10), 1);
    } else {
      // soldier: chance baixa
      if (Math.random() < 0.35) {
        spawnCoin(game, e.x + rand(-8, 8), e.y + rand(-8, 8), 1);
      }
    }
  }
}

function spawnCoinsFromBrokenCrates(game) {
  for (const c of game.crates) {
    if (!c.justBroken) continue;
    c.justBroken = false;

    // crate: garantido
    spawnCoin(game, c.x + rand(-10, 10), c.y + rand(-10, 10), 2);
    spawnCoin(game, c.x + rand(-10, 10), c.y + rand(-10, 10), 1);
  }
}

function spawnCoin(game, x, y, value) {
  game.coins.push({
    x, y,
    vx: rand(-0.35, 0.35),
    vy: rand(-0.35, 0.35),
    r: value >= 2 ? 11 : 8,
    value,
    dead: false,
  });
}

/* =========================
   COINS UPDATE
   ========================= */

function updateCoins(game) {
  const p = game.player;

  for (const c of game.coins) {
    if (c.dead) continue;

    // magnet
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const d = Math.hypot(dx, dy);

    if (d < p.coinMagnet) {
      const pull = 0.10 + (p.coinMagnet - d) * 0.0012;
      c.vx += (dx / (d || 1)) * pull;
      c.vy += (dy / (d || 1)) * pull;
    }

    c.x += c.vx;
    c.y += c.vy;

    c.vx *= 0.92;
    c.vy *= 0.92;
  }
}

/* =========================
   COLLECT
   ========================= */

function collectCoins(game, meta) {
  const p = game.player;

  for (const c of game.coins) {
    if (c.dead) continue;

    const d = distXY(c.x, c.y, p.x, p.y);
    if (d < (c.r + p.r)) {
      c.dead = true;

      const val = c.value || 1;
      meta.money = (meta.money || 0) + val;

      // ✅ evento pra missão
      if (Array.isArray(game.events)) {
        game.events.push({ type: "COIN", amount: val });
      }

      meta.save.dirty = true;
    }
  }

  game.coins = game.coins.filter(c => !c.dead);
}
