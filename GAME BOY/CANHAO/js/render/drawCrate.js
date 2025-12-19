// js/render/drawCrate.js

export function drawCrates(ctx, game) {
  for (const c of game.crates) {
    if (c.dead) continue;

    const size = c.size;
    const half = size / 2;
    
    // Cor muda levemente baseada na vida restante (opcional, mas visualmente rico)
    // Se c.hp não existir, assume cheio.
    const hpRatio = (c.hp || 1) / (c.hpMax || c.hp || 5); 
    
    // Cor Base: Ciano Escuro -> Azul Neon
    const mainColor = "#00eaff";
    
    ctx.save();
    ctx.translate(c.x, c.y);

    // Efeito de Dano: Se vida baixa, treme ou pisca (opcional visual)
    const alpha = 0.3 + (hpRatio * 0.7); // Fica mais transparente se estiver quebrando
    
    ctx.shadowBlur = 10 * hpRatio;
    ctx.shadowColor = mainColor;
    
    // Fundo da Caixa (Semi-transparente)
    ctx.fillStyle = `rgba(0, 20, 40, ${alpha})`;
    ctx.fillRect(-half, -half, size, size);

    // Borda Externa (Grossa nos cantos)
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(-half, -half, size, size);

    // Detalhe: Cantos Reforçados ("Tech Corners")
    const corner = size * 0.25;
    ctx.lineWidth = 4;
    ctx.beginPath();
    
    // Canto Superior Esquerdo
    ctx.moveTo(-half, -half + corner); ctx.lineTo(-half, -half); ctx.lineTo(-half + corner, -half);
    // Canto Superior Direito
    ctx.moveTo(half - corner, -half); ctx.lineTo(half, -half); ctx.lineTo(half, -half + corner);
    // Canto Inferior Direito
    ctx.moveTo(half, half - corner); ctx.lineTo(half, half); ctx.lineTo(half - corner, half);
    // Canto Inferior Esquerdo
    ctx.moveTo(-half + corner, half); ctx.lineTo(-half, half); ctx.lineTo(-half, half - corner);
    
    ctx.stroke();

    // Detalhe: Estrutura em X (Cross-brace)
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5 * alpha; // Mais sutil
    ctx.beginPath();
    ctx.moveTo(-half + 4, -half + 4);
    ctx.lineTo(half - 4, half - 4);
    ctx.moveTo(half - 4, -half + 4);
    ctx.lineTo(-half + 4, half - 4);
    ctx.stroke();

    // Núcleo Central (Indicador de "Tech")
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(0, 234, 255, ${hpRatio})`; // Brilho diminui com a vida
    ctx.beginPath();
    ctx.rect(-4, -4, 8, 8);
    ctx.fill();

    ctx.restore();
  }
}