import { WORLD, CRATE, ENEMY } from "../core/constants.js";

export function updateSpawnSystem(game, meta, actions, dt) {
  if (!game.runtime.running) return;

  // ==========================================
  // 1. SISTEMA DE CAIXAS (CRATES)
  // ==========================================
  
  // Forçamos o limite para 45 (ajustado para o mapa 3000x3000)
  const maxCrates = 45; 

  if (game.crates.length < maxCrates) {
    // Aumentei a chance para 30% (0.3). 
    // Isso vai fazer as 45 caixas aparecerem em poucos segundos.
    if (Math.random() < 0.3) {
      spawnCrate(game);
    }
  }

  // ==========================================
  // 2. SISTEMA DE INIMIGOS
  // ==========================================
  updateEnemySpawning(game);
}

function spawnCrate(game) {
  // Sorteia um dos tamanhos que você definiu: [60, 78, 86]
  const sizeIndex = Math.floor(Math.random() * CRATE.SIZES.length);
  const selectedSize = CRATE.SIZES[sizeIndex];

  game.crates.push({
    x: Math.random() * (WORLD.WIDTH - 100) + 50,
    y: Math.random() * (WORLD.HEIGHT - 100) + 50,
    size: selectedSize,
    hp: CRATE.BASE_HP,
    hpMax: CRATE.BASE_HP,
    dead: false
  });

  // Log para você conferir no F12 se elas estão sendo criadas
  console.log(`Crate Spawnada! Total: ${game.crates.length}`);
}

function updateEnemySpawning(game) {
  // Limite de inimigos baseado na Wave
  const maxEnemies = 8 + (game.progression.wave * 3);

  if (game.enemies.filter(e => !e.dead).length < maxEnemies) {
    if (Math.random() < 0.03) {
      spawnEnemy(game);
    }
  }
}

function spawnEnemy(game) {
  // 30% de chance de ser Tanque, 70% de ser Soldier
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
    // Variáveis de movimento para o Renderer não quebrar
    vx: 0,
    vy: 0
  });
}
