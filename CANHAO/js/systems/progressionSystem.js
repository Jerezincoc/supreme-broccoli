// js/systems/progressionSystem.js

/**
 * ProgressionSystem
 * Controla:
 * - avanço de wave
 * - aumento gradual de dificuldade
 *
 * Emite eventos em game.events:
 * - { type:"WAVE_UP", amount:1 }
 */

export function updateProgressionSystem(game, meta, actions, dt) {
  if (!game.runtime.running) return;

  if (!Array.isArray(game.events)) game.events = [];

  const prog = game.progression;

  // timer
  prog.waveTimer++;

  // wave sobe por tempo OU por kills
  const waveTimeDone = prog.waveTimer >= prog.waveDurationFrames;
  const killQuotaDone = prog.killsThisWave >= killsRequiredForWave(prog.wave);

  if (waveTimeDone || killQuotaDone) {
    advanceWave(game, meta);
  }
}

/* =========================
   HELPERS
   ========================= */

function advanceWave(game, meta) {
  const prog = game.progression;

  prog.wave++;
  prog.waveTimer = 0;
  prog.killsThisWave = 0;

  // bônus de score
  prog.score += prog.wave * 5;

  // evento de missão
  game.events.push({ type: "WAVE_UP", amount: 1 });

  // marca save
  meta.save.dirty = true;
}

function killsRequiredForWave(wave) {
  if (wave <= 2) return 6;
  if (wave <= 5) return 10;
  if (wave <= 10) return 14;
  return 18 + Math.floor(wave * 0.6);
}
