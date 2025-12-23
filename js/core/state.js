// js/core/state.js

/**
 * MetaState = progresso persistente (salva no navegador)
 * GameState = estado da run atual (reseta ao começar)
 */

export function createMetaState() {
  return {
    // persistência
    save: {
      key: "neon_tank_save_v2",
      version: 2,
      dirty: false,     // marca quando precisa salvar
      lastSaveTs: 0,
      autoSaveEveryMs: 5000,
    },

    // economia / loja
    money: 0,
    currentWeaponId: "BASIC",
    weaponsUnlocked: { BASIC: true },

    upgrades: {
      MAX_LIFE: 0,
      FIRE_RATE: 0,
      BULLET_SPEED: 0,
      SHIELD_GAIN: 0,
      TURBO_MAX: 0,
      COIN_MAGNET: 0,
    },

    // missões (persistente)
    missions: [],

    // estatísticas (opcional, mas útil)
    stats: {
      totalKills: 0,
      totalRuns: 0,
      bestScore: 0,
    },
  };
}

export function createGameState(canvas) {
  return {
    runtime: {
      running: false,   // se false, update() não roda gameplay
      screen: "start",  // "start" | "playing" | "gameover"
      time: 0,
    },

    // --- A CORREÇÃO ESTÁ AQUI ---
    aim: { x: 0, y: 0 }, 
    // ----------------------------

    // dimensões (render usa isso)
    world: {
      w: canvas.clientWidth || 800,
      h: canvas.clientHeight || 600,
    },

    // player (run) - MANTIVE O SEU ORIGINAL
    player: createPlayer(),

    // entidades (run)
    enemies: [],
    bullets: [],
    enemyBullets: [],
    crates: [],
    coins: [],
    particles: [],

    // progressão (run)
    progression: {
      score: 0,
      wave: 1,
      frames: 0,
      killsThisWave: 0,
      waveTimer: 0,
      waveDurationFrames: 1800, 
    },
  };
}

export function resetRunState(game, meta) {
  // atualiza tamanho do mundo antes de resetar spawn
  game.world.w = game.world.w || 800;
  game.world.h = game.world.h || 600;

  game.runtime.running = true;
  game.runtime.screen = "playing";
  game.runtime.time = 0;

  game.player = createPlayer();
  applyMetaUpgradesToPlayer(game.player, meta);

  game.enemies = [];
  game.bullets = [];
  game.enemyBullets = [];
  game.crates = [];
  game.coins = [];
  game.particles = [];

  game.progression.score = 0;
  game.progression.wave = 1;
  game.progression.frames = 0;
  game.progression.killsThisWave = 0;
  game.progression.waveTimer = 0;
  game.progression.waveDurationFrames = 1800;

  // conta run
  meta.stats.totalRuns++;
  meta.save.dirty = true;
}

export function setGameOver(game, meta) {
  game.runtime.running = false;
  game.runtime.screen = "gameover";

  const score = game.progression.score;
  if (score > meta.stats.bestScore) meta.stats.bestScore = score;

  meta.save.dirty = true;
}

/* =========================
   PLAYER FACTORY + UPGRADES
   ========================= */

export function createPlayer() {
  return {
    x: 400,
    y: 300,
    r: 18,

    lives: 5,
    maxLives: 5,

    speed: 2.3,

    // turbo
    turboMax: 100,
    turbo: 100,
    turboOn: false,

    // shield
    shieldCharge: 0,      // 0..100
    shieldActive: false,
    shieldTime: 0,        // frames restantes

    // super
    superCharge: 0,       // 0..100

    // tiro
    fireCd: 0,

    // magnet
    coinMagnet: 110,
  };
}

export function applyMetaUpgradesToPlayer(player, meta) {
  const up = meta.upgrades || {};

  player.maxLives = 5 + (up.MAX_LIFE || 0);
  player.lives = Math.min(player.lives, player.maxLives);

  player.turboMax = 100 + (up.TURBO_MAX || 0) * 12;
  player.turbo = Math.min(player.turbo, player.turboMax);

  player.coinMagnet = 110 + (up.COIN_MAGNET || 0) * 28;
}

/* =========================
   SAFE CLONE (opcional)
   ========================= */

export function snapshotForSave(meta) {
  // só o que precisa persistir
  return {
    v: meta.save.version,
    ts: Date.now(),

    money: meta.money,
    currentWeaponId: meta.currentWeaponId,
    weaponsUnlocked: meta.weaponsUnlocked,
    upgrades: meta.upgrades,
    missions: meta.missions,
    stats: meta.stats,
  };
}



