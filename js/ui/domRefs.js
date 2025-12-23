// js/ui/domRefs.js

export function getDomRefs() {
  return {
    // telas
    startScreen: document.getElementById("start-screen"),
    gameOverScreen: document.getElementById("game-over-screen"),
    hud: document.getElementById("hud"),

    // botões
    startBtn: document.getElementById("startBtn"),
    restartBtn: document.getElementById("restartBtn"),

    // HUD
    livesContainer: document.getElementById("lives-container"),
    scoreVal: document.getElementById("scoreVal"),
    levelVal: document.getElementById("levelVal"),
    coinVal: document.getElementById("coinVal"),
    weaponVal: document.getElementById("weaponVal"),

    shieldBarFill: document.getElementById("shieldBarFill"),
    superBarFill: document.getElementById("superBarFill"),
    turboBarFill: document.getElementById("turboBarFill"),

    // game over
    finalScore: document.getElementById("finalScore"),
    overCoinVal: document.getElementById("overCoinVal"),

    // loja (se existir no HTML)
    shopList: document.getElementById("shopList"),
    shopListOver: document.getElementById("shopListOver"),
    menuCoinVal: document.getElementById("menuCoinVal"),
  };
}
