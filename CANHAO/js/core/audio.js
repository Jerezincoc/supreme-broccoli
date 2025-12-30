// js/core/audio.js

/**
 * Audio System - Sintetizador WebAudio API
 * Gera efeitos sonoros procedurais (sem arquivos mp3)
 */

let ctx = null;
let masterGain = null;
let enabled = false;

export function initAudio() {
  if (ctx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  ctx = new AudioContext();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.3; // Volume mestre (30%)
  masterGain.connect(ctx.destination);
  enabled = true;
}

// Chama isso no clique do botão "Start" para o navegador liberar o áudio
export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

// --- GERADORES DE SOM ---

export function playSound(type) {
  if (!enabled || !ctx) return;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(masterGain);

  switch (type) {
    case "SHOOT_BASIC":
      // Pew pew rápido
      osc.type = "square";
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
      break;

    case "SHOOT_SHOTGUN":
      // Grave e ruidoso
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
      break;
      
    case "SHOOT_MACHINE":
      // Agudo e curto
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
      break;

    case "ENEMY_SHOOT":
      // Som mais "digital"
      osc.type = "square";
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.1);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
      break;

    case "EXPLOSION":
      // Ruído fake (modulação rápida)
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(10, t + 0.3);
      
      // Tremolo para simular ruído
      const lfo = ctx.createOscillator();
      lfo.type = "square";
      lfo.frequency.value = 50;
      lfo.connect(gain.gain);
      lfo.start(t);
      lfo.stop(t + 0.3);

      gain.gain.setValueAtTime(1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      
      osc.start(t);
      osc.stop(t + 0.3);
      break;

    case "HIT":
      // Click curto
      osc.type = "triangle";
      osc.frequency.setValueAtTime(500, t);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
      break;

    case "POWERUP":
      // Subida mágica
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.linearRampToValueAtTime(1200, t + 0.3);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
      break;
      
    case "BUY":
      // Caixa registradora fake (dois tons)
      osc.type = "square";
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.setValueAtTime(1600, t + 0.1);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
      break;
  }
}