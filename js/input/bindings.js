// js/input/bindings.js

export const DEFAULT_BINDINGS = {
  moveUp: ["w", "arrowup"],
  moveDown: ["s", "arrowdown"],
  moveLeft: ["a", "arrowleft"],
  moveRight: ["d", "arrowright"],

  shoot: ["mouse_left"],
  shield: ["space"],
  turbo: ["shift"],
  
  super: ["q"], // <--- NOVA TECLA (Super Ataque)

  pause: ["escape"],
  
  equip1: ["1"],
  equip2: ["2"],
  equip3: ["3"],
  equip4: ["4"],
};

export function createEmptyActions() {
  return {
    moveX: 0,
    moveY: 0,

    shooting: false,
    shielding: false,
    turbo: false,
    super: false, // <--- NOVO ESTADO

    pausePressed: false,
    
    // Armas
    equip1: false,
    equip2: false,
    equip3: false,
    equip4: false
  };
}