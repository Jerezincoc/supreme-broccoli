// js/core/constants.js

export const ENGINE = {
  FPS: 60,
  FIXED_DT: 1 / 60,
};

export const WORLD = {
  WIDTH: 3000,   // <--- AUMENTADO PARA 3000 (Mais espaço)
  HEIGHT: 3000,
  MARGIN: 50,
};

export const PLAYER = {
  RADIUS: 18,
  BASE_SPEED: 4.5, // Levemente mais rápido para compensar o mapa maior
  LIVES: 5,

  FIRE_CD_BASE: 10,
  
  BULLET_SPEED: 12,
  BULLET_RADIUS: 4,
  BULLET_LIFE: 300,
  BULLET_DAMAGE: 1,

  // Super configurado para a tecla Q
  SUPER: {
    KEY: "q",
    SPEED: 13,
    RADIUS: 9,
    DAMAGE: 3,
    LIFE: 180,
    CD: 20,
    CHARGE_MAX: 100,
    CHARGE_PER_KILL: 12,
  },

  SHIELD: {
    CHARGE_MAX: 100,
    CHARGE_PER_KILL: 6,
    DURATION_FRAMES: 60 * 20,
  },

  TURBO: {
    MAX: 100,
    DRAIN: 1.5,
    REGEN: 0.3,
    MULT: 1.8
  }
};

export const ENEMY = {
  SOLDIER: {
    RADIUS: 16,
    HP: 2,         
    SPEED: 2.5,    
    SCORE: 10,
    DROP_CHANCE: 0.35,
  },

  TANK: {
    RADIUS: 28,
    BASE_HP: 5,    
    HP_PER_WAVE: 0.5, 
    SPEED: 1.3,
    SCORE: 50,
    
    RANGE: 800,         
    KEEP_DISTANCE: 650, 
    
    FIRE_CD: 90,        
    BULLET_SPEED: 4,
    BULLET_RADIUS: 6,
    BULLET_DAMAGE: 0.34,
    BULLET_LIFE: 300,
  },
};

export const CRATE = {
  BASE_HP: 8,    
  SIZES: [1060, 1078, 1086], 
  VARIANTS: ["square", "diamond", "hex", "cross"],
};

export const DROPS = {
  TANK_COINS_MIN: 5,
  TANK_COINS_MAX: 10,
  SOLDIER_COINS_MIN: 1,
  SOLDIER_COINS_MAX: 2,
  CRATE_COINS_MIN: 1,
  CRATE_COINS_MAX: 3,

};

