// js/input/input.js
import { DEFAULT_BINDINGS, createEmptyActions } from "./bindings.js";

export function createInput(canvas, bindings = DEFAULT_BINDINGS) {
  const keysDown = new Set();
  let mouseDown = false;
  let mouseX = 0;
  let mouseY = 0;

  // =====================
  // KEYBOARD
  // =====================
  window.addEventListener("keydown", (e) => {
    let k = e.key.toLowerCase();
    
    // CORREÇÃO DO ESCUDO:
    // O navegador retorna " " para barra de espaço, mas nossos bindings esperam "space"
    if (k === " ") k = "space";

    keysDown.add(k);
    
    // Evita scrollar a tela com espaço
    if (e.code === "Space") e.preventDefault();
  });

  window.addEventListener("keyup", (e) => {
    let k = e.key.toLowerCase();
    if (k === " ") k = "space";
    
    keysDown.delete(k);
  });

  // =====================
  // MOUSE
  // =====================
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    // Pega a posição na TELA (Screen Space)
    // O combatSystem vai somar a Câmera depois para achar a posição no MUNDO
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  window.addEventListener("mousedown", (e) => {
    if (e.button === 0) mouseDown = true;
  });

  window.addEventListener("mouseup", (e) => {
    if (e.button === 0) mouseDown = false;
  });

  // =====================
  // HELPERS
  // =====================
  function isAnyKeyPressed(keys) {
    for (const k of keys) {
      if (k === "mouse_left" && mouseDown) return true;
      if (keysDown.has(k)) return true;
    }
    return false;
  }

  // =====================
  // SAMPLE (Loop)
  // =====================
  function sample() {
    const actions = createEmptyActions();

    // Movimento
    if (isAnyKeyPressed(bindings.moveUp)) actions.moveY -= 1;
    if (isAnyKeyPressed(bindings.moveDown)) actions.moveY += 1;
    if (isAnyKeyPressed(bindings.moveLeft)) actions.moveX -= 1;
    if (isAnyKeyPressed(bindings.moveRight)) actions.moveX += 1;

    // Ações de Combate
    actions.shooting = isAnyKeyPressed(bindings.shoot);
    actions.shielding = isAnyKeyPressed(bindings.shield); // Agora funciona com "space"
    actions.turbo = isAnyKeyPressed(bindings.turbo);
    actions.super = isAnyKeyPressed(bindings.super);     // Tecla Q

    actions.pausePressed = isAnyKeyPressed(bindings.pause);
    
    // Mouse
    actions.mouse = { x: mouseX, y: mouseY };

    // Troca de Armas
    actions.equip1 = isAnyKeyPressed(bindings.equip1);
    actions.equip2 = isAnyKeyPressed(bindings.equip2);
    actions.equip3 = isAnyKeyPressed(bindings.equip3);
    actions.equip4 = isAnyKeyPressed(bindings.equip4);

    return actions;
  }

  return { sample };
}