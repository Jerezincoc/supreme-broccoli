// js/ui/hud.js
import { PLAYER } from "../core/constants.js"; // Importante para pegar a duração máxima

export function updateHud(ui, game, meta) {
  // Se não tiver as referências ou o jogo não começou, não faz nada
  if (!ui.hud || !game.player) return;

  const p = game.player;

  // 1. Atualização de Textos
  if (ui.scoreVal) ui.scoreVal.textContent = game.progression.score;
  if (ui.coinVal) ui.coinVal.textContent = meta.money;
  if (ui.levelVal) ui.levelVal.textContent = game.progression.wave;

  // Vidas (Corações)
  if (ui.livesContainer) {
    ui.livesContainer.textContent = "♥".repeat(Math.ceil(Math.max(0, p.lives)));
  }

  // Nome da Arma Atual
  if (ui.weaponVal) {
    const nameMap = {
      BASIC: "CANHÃO DE PLASMA",
      SHOTGUN: "CAÇADEIRA NEON",
      MACHINEGUN: "METRALHADORA",
      LASER: "RAILGUN"
    };
    ui.weaponVal.textContent = nameMap[meta.currentWeaponId] || meta.currentWeaponId;
  }

  // ===========================
  // 2. ATUALIZAÇÃO DAS BARRAS
  // ===========================

  // --- BARRA DE ESCUDO (AZUL) ---
  let shieldPercent = 0;
  
  if (p.shieldActive) {
    // MODO ATIVO: Mostra quanto tempo falta para acabar
    const maxTime = PLAYER.SHIELD.DURATION_FRAMES || 1200;
    shieldPercent = (p.shieldTime / maxTime) * 100;
  } else {
    // MODO RECARGA: Mostra quanto falta para poder usar
    shieldPercent = p.shieldCharge;
  }
  
  if (ui.shieldBarFill) {
    ui.shieldBarFill.style.width = `${Math.max(0, shieldPercent)}%`;
    
    // Feedback Visual: Branco Brilhante quando ativo (gastando), Azul Neon quando carregando
    if (p.shieldActive) {
      ui.shieldBarFill.style.backgroundColor = "#ffffff";
      ui.shieldBarFill.style.boxShadow = "0 0 15px #ffffff";
    } else {
      ui.shieldBarFill.style.backgroundColor = "#00eaff";
      ui.shieldBarFill.style.boxShadow = "0 0 8px #00eaff";
    }
  }

  // --- BARRA DE SUPER (ROSA/MAGENTA) ---
  if (ui.superBarFill) {
    // O super é instantâneo (gastou, zerou), então só mostramos a carga
    ui.superBarFill.style.width = `${Math.min(100, p.superCharge)}%`;
  }

  // --- BARRA DE TURBO (LARANJA/AMARELA) ---
  if (ui.turboBarFill) {
    const turboPercent = (p.turbo / p.turboMax) * 100;
    ui.turboBarFill.style.width = `${Math.min(100, turboPercent)}%`;
  }
}