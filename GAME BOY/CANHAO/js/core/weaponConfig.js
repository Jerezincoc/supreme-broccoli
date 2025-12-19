import { PLAYER } from "./constants.js";

export const WEAPONS = {
  BASIC: {
    id: "BASIC",
    name: "Plasma Cannon",
    color: "#00eaff",
    damage: PLAYER.BULLET_DAMAGE,
    speed: PLAYER.BULLET_SPEED,
    count: 1,
    spread: 0,
    fireCd: PLAYER.FIRE_CD_BASE,
    life: 300, // <--- AQUI (Era 60 ou 100) - Agora vai longe
    size: PLAYER.BULLET_RADIUS
  },
  
  SHOTGUN: {
    id: "SHOTGUN",
    name: "Neon Shotgun",
    color: "#ff0055",
    damage: 0.8,
    speed: 10,
    count: 5,
    spread: 0.4,
    fireCd: 45,
    life: 250, // Shotgun vai um pouco menos longe, mas ainda cobre bem
    size: 3
  },
  
  MACHINEGUN: {
    id: "MACHINEGUN",
    name: "Rapid Fire",
    color: "#ffff00",
    damage: 0.5,
    speed: 14,
    count: 1,
    spread: 0.1,
    fireCd: 5,
    life: 300, // <--- Vai longe
    size: 3
  },
  
  LASER: {
    id: "LASER",
    name: "Railgun",
    color: "#ffffff",
    damage: 5,
    speed: 25,
    count: 1,
    spread: 0,
    fireCd: 70,
    life: 300, // <--- Vai longe
    size: 5
  }
};