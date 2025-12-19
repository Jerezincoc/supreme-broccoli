// js/systems/particleSystem.js
import { rand } from "../core/math.js";

export function updateParticleSystem(game, dt) {
  if (!game.runtime.running) return;

  // Garante que o array existe
  if (!game.particles) game.particles = [];

  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    
    // Movimento
    p.x += p.vx;
    p.y += p.vy;
    
    // Atrito (opcional, deixa a explosão mais "impactante" no começo e lenta no fim)
    p.vx *= 0.95;
    p.vy *= 0.95;

    // Vida
    p.life--;
    
    // Remove partículas mortas
    if (p.life <= 0) {
      game.particles.splice(i, 1);
    }
  }
}

// --- HELPERS PARA CRIAR EFEITOS ---

export function spawnExplosion(game, x, y, color, count = 15) {
  if (!game.particles) game.particles = [];
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = rand(1, 4);
    
    game.particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(20, 40),
      maxLife: 40,
      color: color,
      size: rand(1, 3)
    });
  }
}

export function spawnHitEffect(game, x, y, color) {
  spawnExplosion(game, x, y, color, 5); // Explosão menor
}