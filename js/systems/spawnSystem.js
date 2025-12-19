import { WORLD, CRATE, ENEMY } from "../core/constants.js";

export function updateSpawnSystem(game, meta, actions, dt) {
  if (!game.runtime.running) return;

  // ==========================================
  // 1. SISTEMA DE CAIXAS (PREENCHIMENTO INSTANTÂNEO)
  // ==========================================
  const maxCrates = 45; 

  // Em vez de "se", usamos "enquanto". 
  // O jogo vai criar caixas num loop até atingir 45 no mesmo frame.
  while (game.crates.length < maxCrates) {
    spawnCrate(game);
  }

  // ==========================================
  // 2. SISTEMA DE INIMIGOS (MANTIDO COM SORTEIO)
  // ==========================================
  updateEnemySpawning(game);
}

function spawnCrate(game) {
  // Pega o tamanho diretamente do seu constants.js: [60, 78, 86]
  const sizeIndex = Math.floor(Math.random() * CRATE.SIZES.length);
  const selectedSize = CRATE.SIZES[sizeIndex];

  game.crates.push({
    // Espalha pelo mapa de 3000x3000px
    x: Math.random() * (WORLD.WIDTH - 200) + 100,
    y: Math.random() * (WORLD.HEIGHT - 200) + 100,
    size: selectedSize,
    hp: CRATE.BASE_HP,
    hpMax: CRATE.BASE_HP,
    dead: false
  });
}

function updateEnemySpawning(game) {
  const maxEnemies = 10 + (game.progression.wave * 2);
  const currentEnemies = game.enemies.filter(e => !e.dead).length;

  if (currentEnemies < maxEnemies) {
    // Inimigos continuam com sorteio para não aparecerem todos na sua cabeça de uma vez
    if (Math.random() < 0.05) {
      spawnEnemy(game);
    }
  }
}

function spawnEnemy(game) {
  const isTank = Math.random() < 0.3;
  const type = isTank ? "TANK" : "SOLDIER";
  const config = isTank ? ENEMY.TANK : ENEMY.SOLDIER;

  game.enemies.push({
    x: Math.random() * WORLD.WIDTH,
    y: Math.random() * WORLD.HEIGHT,
    type: type,
    hp: isTank ? config.BASE_HP : config.HP,
    r: config.RADIUS,
    dead: false,
    hitFlash: 0,
    vx: 0,
    vy: 0
  });
}
