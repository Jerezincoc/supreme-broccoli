// js/systems/shopSystem.js
import { applyMetaUpgradesToPlayer } from "../core/state.js";

/**
 * ShopSystem
 * Gerencia custos e compras.
 * A UI chama as funções exportadas helpers (buyUpgrade, buyWeapon).
 * O update() garante que o player atual (game.player) receba os stats novos.
 */

export function updateShopSystem(game, meta, actions, dt) {
  // Se estivermos rodando, garante que o player tenha os status dos upgrades
  if (game.runtime.running) {
    // Sincroniza periodicamente (ou frame a frame, é barato)
    applyMetaUpgradesToPlayer(game.player, meta);
  }
}

// --- LÓGICA DE COMPRA (Exportada para ser usada pela UI) ---

export const SHOP_CONFIG = {
  MAX_LIFE:     { base: 150, mult: 1.5, max: 5 },
  FIRE_RATE:    { base: 200, mult: 1.6, max: 5 }, // Reduz FireCD
  BULLET_SPEED: { base: 100, mult: 1.4, max: 5 },
  SHIELD_GAIN:  { base: 300, mult: 1.7, max: 5 },
  TURBO_MAX:    { base: 120, mult: 1.4, max: 5 },
  COIN_MAGNET:  { base: 80,  mult: 1.5, max: 5 },
};

export function getUpgradeCost(meta, type) {
  const cfg = SHOP_CONFIG[type];
  if (!cfg) return 999999;
  
  const currentLvl = meta.upgrades[type] || 0;
  if (currentLvl >= cfg.max) return "MAX";

  return Math.floor(cfg.base * Math.pow(cfg.mult, currentLvl));
}

export function buyUpgrade(meta, type) {
  const cost = getUpgradeCost(meta, type);
  if (cost === "MAX") return false;

  if (meta.money >= cost) {
    meta.money -= cost;
    meta.upgrades[type] = (meta.upgrades[type] || 0) + 1;
    meta.save.dirty = true;
    return true;
  }
  return false;
}

// Armas (Custo fixo por enquanto)
export const WEAPON_PRICES = {
  BASIC: 0,
  SHOTGUN: 1500,
  MACHINEGUN: 2500,
  LASER: 5000
};

export function buyWeapon(meta, weaponId) {
  if (meta.weaponsUnlocked[weaponId]) return true; // já tem

  const cost = WEAPON_PRICES[weaponId] || 999999;
  if (meta.money >= cost) {
    meta.money -= cost;
    meta.weaponsUnlocked[weaponId] = true;
    meta.save.dirty = true;
    return true;
  }
  return false;
}