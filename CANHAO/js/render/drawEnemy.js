// js/render/drawEnemy.js

export function drawEnemies(ctx, game) {
  const p = game.player;

  for (const e of game.enemies) {
    if (e.dead) continue;

    ctx.save();
    ctx.translate(e.x, e.y);

    // Garante que o tipo seja lido corretamente (SOLDIER, soldier, Soldier -> SOLDIER)
    const type = (e.type || "SOLDIER").toUpperCase();
    
    // Verifica se tomou dano (Flash Branco)
    const isHit = e.hitFlash > 0;
    if (isHit) e.hitFlash--; 

    // ===========================
    // TIPO 1: SOLDIER (DRONE)
    // ===========================
    if (type === "SOLDIER") {
      // Rotaciona na direção do movimento
      const angle = Math.atan2(e.vy, e.vx);
      ctx.rotate(angle);

      const color = isHit ? "#ffffff" : "#ff0055"; // Vermelho Neon

      // Sombra
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;

      // Desenho: Nave Triangular
      ctx.fillStyle = isHit ? "#fff" : "#2a0011";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(e.r, 0); // Nariz
      ctx.lineTo(-e.r, e.r - 5);
      ctx.lineTo(-e.r + 5, 0);
      ctx.lineTo(-e.r, -e.r + 5);
      ctx.closePath();
      
      ctx.fill();
      ctx.stroke();

      // "Olho" do Drone
      ctx.fillStyle = "#ffaa00";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } 
    
    // ===========================
    // TIPO 2: TANK (HEAVY)
    // ===========================
    else if (type === "TANK") {
      const color = isHit ? "#ffffff" : "#bf00ff"; // Roxo Neon

      ctx.shadowBlur = 15;
      ctx.shadowColor = color;

      // 1. CHASSI (Hexágono)
      ctx.fillStyle = isHit ? "#fff" : "#1a0022";
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;

      ctx.beginPath();
      const r = e.r;
      for (let i = 0; i < 6; i++) {
        const theta = (Math.PI / 3) * i;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 2. TORRE (Gira para o player)
      const aimAngle = Math.atan2(p.y - e.y, p.x - e.x);
      ctx.rotate(aimAngle); 
      
      // Canhão
      ctx.fillStyle = color;
      ctx.fillRect(0, -5, r + 5, 10);

      // Base da Torre
      ctx.fillStyle = isHit ? "#ddd" : "#330044";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke(); 
      
      // Luz vermelha na torre
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ===========================
    // FALLBACK (SEGURANÇA CONTRA INVISIBILIDADE)
    // ===========================
    else {
      // Se o tipo não for reconhecido, desenha uma bola vermelha simples
      // Isso evita que o inimigo fique invisível se houver erro de digitação no nome
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(0, 0, e.r || 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Debug visual (escreve o tipo errado na tela pra você ver)
      ctx.fillStyle = "#fff";
      ctx.font = "10px Arial";
      ctx.fillText(e.type, -10, 0);
    }

    ctx.restore();
  }
}