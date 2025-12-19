// js/systems/saveSystem.js
import { snapshotForSave } from "../core/state.js";

/**
 * SaveSystem
 * - Load 1x ao iniciar (do localStorage)
 * - Auto-save periódico + save em eventos de saída
 *
 * Regra:
 * - Systems que mudarem dinheiro/upgrades/armas/missões devem fazer: meta.save.dirty = true
 */
let loadedOnce = false;
let wiredExit = false;

export function updateSaveSystem(game, meta, actions, dt) {
  // 1) load 1x
  if (!loadedOnce) {
    loadedOnce = true;
    safeLoad(meta);
    wireExitSaves(meta);
  }

  // 2) autosave
  const now = Date.now();
  const every = meta.save?.autoSaveEveryMs ?? 5000;

  if (meta.save?.dirty && (now - (meta.save.lastSaveTs || 0)) >= every) {
    safeSave(meta);
  }
}

function safeLoad(meta) {
  try {
    const key = meta.save?.key || "neon_tank_save_v2";
    const raw = localStorage.getItem(key);
    if (!raw) return;

    const data = JSON.parse(raw);

    // migração simples por versão
    const v = Number(data.v || data.version || 1);

    // v1/v2: tentamos ler os campos básicos
    if (v >= 1) {
      if (typeof data.money === "number") meta.money = data.money;
      if (typeof data.currentWeaponId === "string") meta.currentWeaponId = data.currentWeaponId;
      if (typeof data.weaponsUnlocked === "object" && data.weaponsUnlocked) meta.weaponsUnlocked = data.weaponsUnlocked;
      if (typeof data.upgrades === "object" && data.upgrades) meta.upgrades = { ...meta.upgrades, ...data.upgrades };
      if (Array.isArray(data.missions)) meta.missions = data.missions;
      if (typeof data.stats === "object" && data.stats) meta.stats = { ...meta.stats, ...data.stats };
    }

    // garante BASIC
    if (!meta.weaponsUnlocked) meta.weaponsUnlocked = { BASIC: true };
    if (!meta.weaponsUnlocked.BASIC) meta.weaponsUnlocked.BASIC = true;
    if (!meta.currentWeaponId) meta.currentWeaponId = "BASIC";

    // acabou de carregar: não marca dirty
    if (meta.save) {
      meta.save.dirty = false;
      meta.save.lastSaveTs = Date.now();
    }
  } catch (err) {
    console.warn("[SaveSystem] Falha ao carregar save:", err);
  }
}

function safeSave(meta) {
  try {
    const key = meta.save?.key || "neon_tank_save_v2";
    const payload = snapshotForSave(meta);
    localStorage.setItem(key, JSON.stringify(payload));

    if (meta.save) {
      meta.save.dirty = false;
      meta.save.lastSaveTs = Date.now();
    }
  } catch (err) {
    console.warn("[SaveSystem] Falha ao salvar:", err);
  }
}

function wireExitSaves(meta) {
  if (wiredExit) return;
  wiredExit = true;

  // salva quando trocar de aba / fechar
  window.addEventListener("beforeunload", () => {
    // salva sempre no exit (mesmo se dirty estiver false, não custa)
    try { safeSave(meta); } catch {}
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      try { safeSave(meta); } catch {}
    }
  });
}
