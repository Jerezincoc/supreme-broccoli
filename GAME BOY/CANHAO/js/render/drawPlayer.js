// js/render/drawPlayer.js

export function drawPlayer(ctx, game) {
  const p = game.player;
  if (p.lives <= 0) return;

  // Calcula o ângulo olhando para a mira (Mouse + Câmera)
  const angle = Math.atan2(game.aim.y - p.y, game.aim.x - p.x);

  // Define as cores baseadas no estado (Escudo, Turbo, Dano)
  let mainColor = "#003344"; // Azul escuro metálico
  let neonColor = "#00eaff"; // Ciano padrão

  if (p.hitFlash > 0) {
    mainColor = "#ffffff"; neonColor = "#ffffff"; // Flash de dano
  } else if (p.shieldActive) {
    mainColor = "#aaddff"; neonColor = "#ffffff"; // Escudo branco/azul claro
  } else if (p.turboOn) {
    neonColor = "#ffaa00"; // Turbo laranja
  }

  // ===========================================
  // 1. EFEITO DE RASTRO SUAVE (TURBO AFTERIMAGE)
  // ===========================================
  if (p.turboOn && (Math.abs(p.vx) > 0.1 || Math.abs(p.vy) > 0.1)) {
    const ghostCount = 10; // Mais fantasmas para suavizar
    
    for (let i = ghostCount; i > 0; i--) {
      ctx.save();
      
      // Calcula posição atrasada. Spacing menor (0.6) para ficarem mais juntos.
      const lag = i * 0.6; 
      const ghostX = p.x - (p.vx * lag);
      const ghostY = p.y - (p.vy * lag);
      
      ctx.translate(ghostX, ghostY);
      ctx.rotate(angle);

      // Transparência decrescente mais suave
      ctx.globalAlpha = (1 - i / ghostCount) * 0.3; // Max 0.3 de opacidade
      
      // Desenha o fantasma usando a mesma função do tanque, mas com cor única
      // Passamos recoil=0 para os fantasmas não terem o canhão recuado
      drawTankSprite(ctx, p.r, neonColor, neonColor, 0);
      
      ctx.restore();
    }
  }

  // ===========================================
  // 2. CÁLCULO DO RECUO DO CANHÃO (RECOIL)
  // ===========================================
  // Usamos o cooldown do tiro para simular o recuo.
  // Se fireCd está alto (acabou de atirar), o recuo é maior.
  let recoilOffset = 0;
  // Supõe que o CD base é 10. Ajusta se o CD for maior (armas lentas).
  const maxRecoilFrame = Math.min(p.fireCd, 8); 
  if (maxRecoilFrame > 0) {
    // O recuo é máximo logo após o tiro e diminui rapidamente
    recoilOffset = (maxRecoilFrame / 8) * 6; // Máximo de 6 pixels de recuo
  }

  // ===========================================
  // 3. DESENHO PRINCIPAL DO PLAYER
  // ===========================================
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(angle);

  // Sombra Neon Global
  ctx.shadowBlur = p.turboOn ? 20 : 15;
  ctx.shadowColor = neonColor;

  // Chama a função que desenha o sprite detalhado
  drawTankSprite(ctx, p.r, mainColor, neonColor, recoilOffset);

  ctx.restore();
}


// ===========================================
// FUNÇÃO AUXILIAR: SPRITE DETALHADO DO TANQUE
// ===========================================
function drawTankSprite(ctx, r, mainColor, neonColor, recoil) {
  const rBody = r * 0.9; // Corpo um pouco menor que o colisor

  // 1. Esteiras (Tracks) laterais
  ctx.fillStyle = "#0a0a1a";
  ctx.strokeStyle = neonColor;
  ctx.lineWidth = 1;
  
  // Esteira Esquerda
  ctx.fillRect(-rBody - 4, -rBody + 2, rBody * 2 + 6, 6);
  ctx.beginPath(); ctx.moveTo(-rBody, -rBody + 5); ctx.lineTo(rBody, -rBody + 5); ctx.stroke();
  
  // Esteira Direita
  ctx.fillRect(-rBody - 4, rBody - 8, rBody * 2 + 6, 6);
  ctx.beginPath(); ctx.moveTo(-rBody, rBody - 5); ctx.lineTo(rBody, rBody - 5); ctx.stroke();

  // 2. Chassi Principal (Corpo Chanfrado)
  ctx.fillStyle = mainColor;
  ctx.strokeStyle = neonColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rBody + 4, -rBody); 
  ctx.lineTo(rBody - 4, -rBody); ctx.lineTo(rBody, -rBody + 4); // Frente
  ctx.lineTo(rBody, rBody - 4); ctx.lineTo(rBody - 4, rBody); // Direita/Trás
  ctx.lineTo(-rBody + 4, rBody); ctx.lineTo(-rBody, rBody - 4); // Trás/Esquerda
  ctx.lineTo(-rBody, -rBody + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Detalhes Traseiros (Vents)
  ctx.fillStyle = neonColor;
  ctx.fillRect(-rBody + 2, -rBody + 4, 4, 3);
  ctx.fillRect(-rBody + 2, rBody - 7, 4, 3);

  // 4. Torre Central (Base do Canhão)
  ctx.fillStyle = "#002233";
  ctx.beginPath();
  ctx.arc(0, 0, rBody * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 5. Canhão com Efeito de Recuo
  ctx.save();
  // AQUI A MÁGICA: Move o canhão para trás no eixo X baseado no recoil
  ctx.translate(-recoil, 0); 
  
  // Base do cano
  ctx.fillStyle = neonColor;
  ctx.fillRect(0, -5, rBody + 8, 10);
  
  // Ponta do cano (Branca, mais brilhante)
  ctx.fillStyle = "#fff";
  ctx.shadowBlur = 25; ctx.shadowColor = "#fff"; // Brilho extra na ponta
  ctx.fillRect(rBody + 8, -3, 4, 6);
  ctx.restore();

  // 6. Núcleo de Energia Central
  ctx.fillStyle = "#fff";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
}