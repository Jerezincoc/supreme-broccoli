// js/systems/movementSystem.js
import { distXY } from "../core/math.js";

export function updateMovementSystem(game, dt) {
  if (!game.runtime.running) return;

  const world = game.world;
  // Lista única para processar todos que se movem
  const entities = [...game.enemies, game.player];

  for (const e of entities) {
    if (e.dead || (e.lives <= 0)) continue;

    // 1. Aplica Movimento (baseado em velocidade definida pela IA ou Input)
    e.x += (e.vx || 0);
    e.y += (e.vy || 0);

    // 2. COLISÃO SÓLIDA COM CAIXAS (PAREDES)
    for (const c of game.crates) {
      if (c.dead) continue;
      
      const d = distXY(e.x, e.y, c.x, c.y);
      // Distância mínima = Raio da entidade + Raio aproximado da caixa (60% do tamanho)
      const minDist = e.r + (c.size * 0.6); 

      if (d < minDist) {
        // COLISÃO DETECTADA: Empurrar para fora
        const overlap = minDist - d;
        const angle = Math.atan2(e.y - c.y, e.x - c.x);
        
        // Ajusta posição para não atravessar
        e.x += Math.cos(angle) * overlap;
        e.y += Math.sin(angle) * overlap;
      }
    }

    // 3. Limites do Mundo (Mapa Gigante)
    if (e.x < e.r) e.x = e.r;
    if (e.x > world.w - e.r) e.x = world.w - e.r;
    if (e.y < e.r) e.y = e.r;
    if (e.y > world.h - e.r) e.y = world.h - e.r;
  }
  
  // 4. Mover Balas dos Inimigos
  if (game.enemyBullets) {
    for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
      const b = game.enemyBullets[i];
      b.x += b.vx;
      b.y += b.vy;
      
      // Remove se sair muito longe dos limites do mundo
      if (b.x < -100 || b.x > world.w + 100 || b.y < -100 || b.y > world.h + 100) {
        game.enemyBullets.splice(i, 1);
      }
    }
  }
}