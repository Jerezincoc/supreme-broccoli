// js/render/drawEffects.js

export function clearBackground(ctx, w, h) {
  // fundo limpo (sem grade/paredes)
  ctx.clearRect(0, 0, w, h);
}

/* =========================
   COINS
   ========================= */
export function drawCoins(ctx, game) {
  const coins = game.coins || [];
  for (const c of coins) {
    ctx.save();
    ctx.translate(c.x, c.y);

    ctx.fillStyle = "#ffff00";
    ctx.shadowColor = "#ffff00";
    ctx.shadowBlur = 12;

    const r = c.r ?? 8;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/* =========================
   PARTICLES
   ========================= */
export function drawParticles(ctx, game) {
  const particles = game.particles || [];
  for (const p of particles) {
    ctx.save();
    const alpha = Math.max(0, (p.life ?? 0) / (p.maxLife ?? 40));
    ctx.globalAlpha = alpha;

    ctx.fillStyle = p.color || "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r ?? 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
