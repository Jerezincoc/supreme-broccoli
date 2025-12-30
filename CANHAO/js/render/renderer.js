// js/render/renderer.js
import { drawPlayer } from "./drawPlayer.js";
import { drawEnemies } from "./drawEnemy.js";
import { drawCrates } from "./drawCrate.js";
import { drawProjectiles } from "./drawProjectiles.js";
import { drawCoins, clearBackground, drawParticles } from "./drawEffects.js";
import { camera } from "./camera.js";

export function createRenderer(ctx, canvas) {
  
  function draw(game, meta) {
    const w = canvas.width;
    const h = canvas.height;

    // 1. Atualiza a posição da Câmera
    camera.update(game.player, game.world);

    // 2. Limpa a tela
    clearBackground(ctx, w, h);

    // 3. Aplica a Câmera
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // 4. Desenha o Mundo
    // (A grade foi removida daqui para limpar o visual)

    drawCrates(ctx, game);
    drawCoins(ctx, game);
    drawEnemies(ctx, game);
    drawProjectiles(ctx, game);
    drawPlayer(ctx, game);
    drawParticles(ctx, game);

    // Fim da Câmera
    ctx.restore();
  }

  return { draw };
}