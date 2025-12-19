// js/ui/shopView.js
import { SHOP_CONFIG, WEAPON_PRICES, buyUpgrade, buyWeapon, getUpgradeCost } from "../systems/shopSystem.js";

/**
 * Renderiza a loja dentro do elemento ui.shopList (ou shopListOver)
 */
export function renderShop(ui, meta) {
  // Tenta pegar o container da loja (pode estar no menu ou no game over)
  // Se o seu HTML tiver IDs diferentes para loja do menu e do gameover, trate aqui.
  // Vou assumir que usamos 'shopList' definido em domRefs.js
  const container = ui.shopList; 
  if (!container) return;

  container.innerHTML = "";

  // =========================
  // 1. UPGRADES (Stats)
  // =========================
  const grid = document.createElement("div");
  grid.className = "shop-grid";

  // Criação dos Cards de Upgrade
  Object.keys(SHOP_CONFIG).forEach(key => {
    const cfg = SHOP_CONFIG[key];
    const currentLvl = meta.upgrades[key] || 0;
    const cost = getUpgradeCost(meta, key);
    const isMax = currentLvl >= cfg.max;
    const canBuy = !isMax && meta.money >= cost;

    const item = document.createElement("div");
    item.className = `shop-item ${isMax ? "maxed" : ""} ${canBuy ? "" : "locked"}`;
    
    // Nome amigável
    const nameMap = {
      MAX_LIFE: "Vida Máxima",
      FIRE_RATE: "Cadência de Tiro",
      BULLET_SPEED: "Velocidade Bala",
      SHIELD_GAIN: "Recarga Escudo",
      TURBO_MAX: "Tanque de Turbo",
      COIN_MAGNET: "Ímã de Moedas"
    };

    item.innerHTML = `
      <div class="shop-icon">${getIcon(key)}</div>
      <div class="shop-info">
        <div class="shop-name">${nameMap[key] || key}</div>
        <div class="shop-level">Lvl ${currentLvl} / ${cfg.max}</div>
        <button class="shop-btn" ${!canBuy ? "disabled" : ""}>
          ${isMax ? "MAX" : `$ ${cost}`}
        </button>
      </div>
    `;

    // Evento de Compra
    const btn = item.querySelector("button");
    if (!isMax) {
      btn.onclick = () => {
        const success = buyUpgrade(meta, key);
        if (success) {
          // Re-renderiza tudo para atualizar preços e botões
          renderShop(ui, meta);
          // Atualiza saldo na HUD
          if(ui.menuCoinVal) ui.menuCoinVal.textContent = meta.money;
          if(ui.overCoinVal) ui.overCoinVal.textContent = meta.money;
        }
      };
    }

    grid.appendChild(item);
  });

  container.appendChild(grid);

  // =========================
  // 2. ARMAS (Opcional - Separador)
  // =========================
  const title = document.createElement("div");
  title.className = "shop-title";
  title.innerText = "ARMAS";
  title.style.marginTop = "15px";
  container.appendChild(title);

  const weaponGrid = document.createElement("div");
  weaponGrid.className = "shop-grid";

  Object.keys(WEAPON_PRICES).forEach(wKey => {
    if (wKey === "BASIC") return; // Básica já vem desbloqueada

    const price = WEAPON_PRICES[wKey];
    const owned = meta.weaponsUnlocked[wKey];
    const canBuy = !owned && meta.money >= price;

    const item = document.createElement("div");
    item.className = `shop-item ${owned ? "owned" : ""} ${canBuy ? "" : "locked"}`;

    item.innerHTML = `
      <div class="shop-info" style="width:100%">
        <div class="shop-name">${wKey}</div>
        <button class="shop-btn" ${owned ? "disabled" : (!canBuy ? "disabled" : "")}>
          ${owned ? "COMPRADO" : `$ ${price}`}
        </button>
      </div>
    `;

    const btn = item.querySelector("button");
    if (!owned) {
      btn.onclick = () => {
        const success = buyWeapon(meta, wKey);
        if (success) {
          renderShop(ui, meta);
          if(ui.menuCoinVal) ui.menuCoinVal.textContent = meta.money;
          if(ui.overCoinVal) ui.overCoinVal.textContent = meta.money;
        }
      };
    }

    weaponGrid.appendChild(item);
  });

  container.appendChild(weaponGrid);
}

// Helper visual simples
function getIcon(key) {
  const icons = {
    MAX_LIFE: "♥",
    FIRE_RATE: "⚡",
    BULLET_SPEED: "➹",
    SHIELD_GAIN: "🛡",
    TURBO_MAX: "🔥",
    COIN_MAGNET: "🧲"
  };
  return icons[key] || "★";
}