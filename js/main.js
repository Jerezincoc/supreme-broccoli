// js/main.js
import { createGameState, createMetaState } from "./core/state.js";
import { createLoop } from "./core/loop.js";
import { createInput } from "./input/input.js";
import { getDomRefs } from "./ui/domRefs.js";
import { createRenderer } from "./render/renderer.js";

// === SISTEMAS ===
import { updateSpawnSystem } from "./systems/spawnSystem.js";
import { updateEnemyAISystem } from "./systems/enemyAISystem.js";
import { updateMovementSystem } from "./systems/movementSystem.js";
import { updateCombatSystem } from "./systems/combatSystem.js"; 
import { updateProgressionSystem } from "./systems/progressionSystem.js";
import { updateDropSystem } from "./systems/dropSystem.js";
import { updateMissionsSystem } from "./systems/missionsSystem.js";
import { updateShopSystem } from "./systems/shopSystem.js";
import { updateSaveSystem } from "./systems/saveSystem.js";
import { updateParticleSystem } from "./systems/particleSystem.js"; // Efeitos Visuais

// === UI ===
import { updateHud } from "./ui/hud.js";
import { updateScreens } from "./ui/screens.js";
import { renderShop } from "./ui/shopView.js"; // Visual da Loja

// Inicialização
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Referências de DOM e Input
const ui = getDomRefs();
const input = createInput(canvas);

// Estados
const meta = createMetaState();       // Dados Persistentes (Dinheiro, Upgrades)
const game = createGameState(canvas); // Dados da Partida (Player, Inimigos)

const renderer = createRenderer(ctx, canvas);

// --- UPDATE LOOP (Lógica) ---
function update(dt) {
  // 1. Inputs e Controle de Telas (Start/GameOver)
  const actions = input.sample();
  updateScreens(ui, game, meta, actions);

  // SE NÃO ESTIVER RODANDO (Menu ou GameOver)
  if (!game.runtime.running) {
    updateHud(ui, game, meta); // Atualiza moedas na tela de game over
    
    // Atualiza a Loja se ela estiver visível (na tela Start)
    if (game.runtime.screen === "start" && ui.shopList) {
       // Pequena otimização: renderiza apenas se necessário ou em intervalo, 
       // mas aqui chamamos direto para garantir resposta imediata aos cliques.
       renderShop(ui, meta);
    }
    return;
  }

  // 2. ORDEM DE EXECUÇÃO DOS SISTEMAS (CRÍTICO)
  
  // A) Criação (Inimigos, Caixas)
  updateSpawnSystem(game, meta, actions, dt);
  
  // B) Inteligência (Define para onde ir e mirar)
  updateEnemyAISystem(game, meta, actions, dt);
  
  // C) Física (Aplica movimento e colisão com paredes)
  updateMovementSystem(game, dt);
  
  // D) Combate (Tiros, Colisões, Dano, Super)
  updateCombatSystem(game, meta, actions, dt);
  
  // E) Partículas (Explosões e Efeitos)
  updateParticleSystem(game, dt);
  
  // F) Drops e Missões (Coleta moedas, verifica objetivos)
  updateDropSystem(game, meta, actions, dt);
  updateMissionsSystem(game, meta, actions, dt);
  
  // G) Progressão (Timer da Wave)
  updateProgressionSystem(game, meta, actions, dt);
  
  // H) Passivos (Sincroniza status da loja com player, Auto-save)
  updateShopSystem(game, meta, actions, dt);
  updateSaveSystem(game, meta, actions, dt);

  // 3. UI In-Game
  updateHud(ui, game, meta);
}

// --- DRAW LOOP (Visual) ---
function draw() {
  renderer.draw(game, meta);
}

// Inicia o Loop
const loop = createLoop({ update, draw });
loop.start();