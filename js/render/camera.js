// js/render/camera.js
import { clamp } from "../core/math.js";

export const camera = {
  x: 0,
  y: 0,
  width: 1280,  // <--- ATUALIZADO (Era 900)
  height: 720,  // <--- ATUALIZADO (Era 600)

  update(player, world) {
    if (!player) return;

    // Centraliza
    this.x = player.x - this.width / 2;
    this.y = player.y - this.height / 2;

    // Trava nas bordas
    this.x = clamp(this.x, 0, world.w - this.width);
    this.y = clamp(this.y, 0, world.h - this.height);
  }
};