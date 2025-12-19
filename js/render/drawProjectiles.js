// js/render/drawProjectiles.js

export function drawProjectiles(ctx, game) {
  // balas do inimigo (amarelo)
  const enemyBullets = game.enemyBullets || [];
  for (const b of enemyBullets) {
    ctx.save();
    ctx.translate(b.x, b.y);

    ctx.fillStyle = "#ffaa00";
    ctx.shadowColor = "#ffaa00";
    ctx.shadowBlur = 14;

    const r = b.r ?? 4.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // balas do player
  const bullets = game.bullets || [];
  for (const b of bullets) {
    ctx.save();
    ctx.translate(b.x, b.y);

    const isSuper = !!b.super;
    ctx.fillStyle = isSuper ? "#ffffff" : "#e6f7ff";
    ctx.shadowColor = isSuper ? "#ffffff" : "#00eaff";
    ctx.shadowBlur = isSuper ? 22 : 10;

    const r = b.r ?? (isSuper ? 8 : 4);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
