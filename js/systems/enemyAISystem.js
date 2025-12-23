// js/systems/enemyAISystem.js
import { distXY, angleBetween } from "../core/math.js";

export function updateEnemyAISystem(game, meta, actions, dt) {
  if (!game.runtime.running) return;

  const p = game.player;
  const enemies = game.enemies;

  // Se o player estiver morto, os inimigos param
  if (p.lives <= 0) {
    for (const e of enemies) {
      e.vx = 0;
      e.vy = 0;
    }
    return;
  }

  for (const e of enemies) {
    if (e.dead) continue;

    // 1. Calcular vetor e ângulo para o player
    const dist = distXY(e.x, e.y, p.x, p.y);
    const angle = angleBetween(e, p); // retorna radianos

    // 2. Rotação (Sempre olha para o player)
    e.rotation = angle;
    e.aimAngle = angle; 

    // 3. Comportamento Específico
    if (e.type === "soldier") {
      // SOLDIER: Kamikaze (vai reto)
      // Usa e.speed definido no spawnSystem
      e.vx = Math.cos(angle) * e.speed;
      e.vy = Math.sin(angle) * e.speed;
    
    } else if (e.type === "tank") {
      // TANK: Kiting (Mantém distância)
      const desired = e.keepDistance || 250; 
      const buffer = 50; // Zona de conforto para não ficar vibrando

      if (dist < desired - buffer) {
        // Muito perto: RECUA
        e.vx = -Math.cos(angle) * e.speed;
        e.vy = -Math.sin(angle) * e.speed;
      } else if (dist > desired + buffer) {
        // Muito longe: APROXIMA
        e.vx = Math.cos(angle) * e.speed;
        e.vy = Math.sin(angle) * e.speed;
      } else {
        // Distância ideal: PARA
        e.vx = 0;
        e.vy = 0;
      }
    }
  }
}