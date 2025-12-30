// js/ui/screens.js
import { resetRunState } from "../core/state.js";
import { initAudio, resumeAudio } from "../core/audio.js";

let wired = false;

// Esta é a função que o combatSystem está procurando
export function triggerGameOver(game) {
  game.runtime.running = false;
  game.runtime.screen = "gameover";
  // O áudio de explosão ou derrota pode ser tocado aqui se desejar
}

export function updateScreens(ui, game, meta, actions) {
  if (actions?.mouse) {
    game.aim = { x: actions.mouse.x, y: actions.mouse.y };
  }

  if (!wired) {
    wired = true;
    if (ui.startBtn) {
      ui.startBtn.addEventListener("click", () => {
        initAudio();
        resumeAudio();
        game.world.w = game.world.w || 900;
        game.world.h = game.world.h || 600;
        resetRunState(game, meta);
        if (ui.startScreen) ui.startScreen.classList.add("hidden");
        if (ui.gameOverScreen) ui.gameOverScreen.classList.add("hidden");
        if (ui.hud) ui.hud.classList.remove("hidden");
      });
    }

    if (ui.restartBtn) {
      ui.restartBtn.addEventListener("click", () => {
        game.runtime.running = false;
        game.runtime.screen = "start";
        if (ui.startScreen) ui.startScreen.classList.remove("hidden");
        if (ui.gameOverScreen) ui.gameOverScreen.classList.add("hidden");
        if (ui.hud) ui.hud.classList.add("hidden");
      });
    }
  }

  if (game.runtime.screen === "gameover") {
    if (ui.hud) ui.hud.classList.add("hidden");
    if (ui.gameOverScreen) ui.gameOverScreen.classList.remove("hidden");
    if (ui.startScreen) ui.startScreen.classList.add("hidden");
    if (ui.finalScore) ui.finalScore.textContent = String(game.progression.score ?? 0);
    if (ui.overCoinVal) ui.overCoinVal.textContent = String(meta.money ?? 0);
  }

  if (game.runtime.screen === "start") {
    if (ui.startScreen) ui.startScreen.classList.remove("hidden");
    if (ui.gameOverScreen) ui.gameOverScreen.classList.add("hidden");
    if (ui.hud) ui.hud.classList.add("hidden");
  }
}