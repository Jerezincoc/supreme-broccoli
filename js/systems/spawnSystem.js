import { WORLD, CRATE, ENEMY } from "../core/constants.js";

export function updateSpawnSystem(game, meta, actions, dt) {
  if (!game.runtime.running) return;

  // ==========================================
  // 1. SUA REGRA DE PROGRESSÃO
  // ==========================================
  
  // Fórmula: Começa com 5. Ganha +2 caixas a cada 70 pontos. Teto máximo de 30.
  // Exemplo: 0 pts = 5 caixas. 70 pts = 7 caixas. 140 pts = 9 caixas.
  let targetCrates = 5 + (Math.floor(game.score / 70) * 2);
  
  // Trava no limite de 30, mesmo que faça 1 milhão de pontos.
  const maxCrates = Math.min(targetCrates, 30); 

  // Loop WHILE: Garante que o número de caixas suba IMEDIATAMENTE para o alvo.
  // Se você tem 5 e a regra pede 7, ele cria 2 agora. Sem atraso.
  while (game.crates.length < maxCrates) {
    spawnCrate(game);
  }

  // Remove caixas mortas da memória para o contador funcionar
  game.crates = game.crates.filter(c => !c.dead);

  // ==========================================
  // 2. SISTEMA DE INIMIGOS
  // ==========================================
  updateEnemySpawning(game);
}

function spawnCrate(game) {
  // Sorteia tamanho baseado nas constantes
  const sizeIndex = Math.floor(Math.random() * CRATE.SIZES.length);
  const selectedSize = CRATE.SIZES[sizeIndex];

  game.crates.push({
    // Espalha no mapa de 3000x3000px, com margem de segurança nas bordas
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
