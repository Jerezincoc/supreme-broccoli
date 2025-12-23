// js/systems/spawnSystem.js
import { rand, randInt } from "../core/math.js";

/**
 * SpawnSystem
 * Responsável apenas por:
 * - spawn de inimigos (soldier / tank)
 * - spawn de crates
 *
 * NÃO:
 * - não aplica dano
 * - não dá drop
 * - não muda score
 */

export function updateSpawnSystem(game, meta, actions, dt) {
  if (!game.runtime.running) return;

  const prog = game.progression;
  const world = game.world;

  prog.frames++;

  // =========================
  // SPAWN DE INIMIGOS
  // =========================
  const baseRate = 90;                 // frames
  const rate = Math.max(35, baseRate - prog.wave * 4);

  if (prog.frames % rate === 0) {
    spawnEnemy(game);
  }

  // =========================
  // SPAWN DE CAIXAS
  // =========================
  // 1 caixa garantida por wave
  if (prog.frames === 1 && prog.wave === 1) {
    spawnCrate(game);
  }

  // chance extra de caixa conforme wave sobe
  if (prog.frames % 900 === 0) {
    if (Math.random() < 0.25) {
      spawnCrate(game);
    }
  }
}

/* =========================
   HELPERS
   ========================= */

function spawnEnemy(game) {
  const { w, h } = game.world;
  const m = 50;

  const side = randInt(0, 3);
  let x = m, y = m;

  if (side === 0) { x = rand(m, w - m); y = m; }
  if (side === 1) { x = w - m; y = rand(m, h - m); }
  if (side === 2) { x = rand(m, w - m); y = h - m; }
  if (side === 3) { x = m; y = rand(m, h - m); }

  // progressão: tank começa a aparecer depois da wave 3
  const tankChance = progTankChance(game.progression.wave);
  const type = Math.random() < tankChance ? "tank" : "soldier";

  game.enemies.push(createEnemy(x, y, type, game.progression.wave));
}

function spawnCrate(game) {
  const { w, h } = game.world;
  const x = rand(80, w - 80);
  const y = rand(80, h - 80);

  game.crates.push(createCrate(x, y));
}

/* =========================
   FACTORIES
   ========================= */

function createEnemy(x, y, type, wave) {
  if (type === "tank") {
    return {
      type: "tank",
      x, y,
      r: 22,

      maxHp: 3 + Math.floor(wave * 0.3),
      hp: 3 + Math.floor(wave * 0.3),

      speed: 1.15,
      scoreValue: 3,

      // ranged
      ranged: true,
      keepDistance: 320,
      range: 420,
      shootCdMax: 70,
      shootCd: randInt(0, 30),

      bulletSpeed: 5.8,
      bulletDmg: 1,
      bulletLife: 160,
      bulletRadius: 4.5,

      aimAngle: 0,

      color: "#ffaa00",
      accent: "#ffd37a",
    };
  }

  // soldier (melee)
  return {
    type: "soldier",
    x, y,
    r: 16,

    maxHp: 1,
    hp: 1,

    speed: 2.15,
    scoreValue: 1,

    ranged: false,
    aimAngle: 0,

    color: "#ff3355",
    accent: "#ff9ab0",
  };
}

function createCrate(x, y) {
  const variants = ["square", "diamond", "hex", "cross"];
  const sizes = [16, 18, 20, 22];

  return {
    x, y,
    r: 20,

    size: sizes[randInt(0, sizes.length - 1)],
    variant: variants[randInt(0, variants.length - 1)],

    maxHp: 2,
    hp: 2,

    color: "#00eaff",
  };
}

/* =========================
   PROGRESSION HELPERS
   ========================= */

function progTankChance(wave) {
  if (wave < 3) return 0;
  if (wave < 6) return 0.25;
  if (wave < 10) return 0.35;
  return 0.45;
}
