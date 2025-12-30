// js/systems/missionsSystem.js
import { randInt } from "../core/math.js";

/**
 * MissionsSystem
 * Usa game.events (fila) para atualizar progresso.
 *
 * Eventos esperados (exemplos):
 * - { type: "KILL", enemyType: "soldier" | "tank", amount: 1 }
 * - { type: "COIN", amount: 1 }
 * - { type: "CRATE_BREAK", amount: 1 }
 * - { type: "WAVE_UP", amount: 1 }
 *
 * Recompensa: moedas (meta.money)
 */

export function updateMissionsSystem(game, meta, actions, dt) {
  ensureMissions(meta);

  // garante queue
  if (!Array.isArray(game.events)) game.events = [];

  // processa todos os eventos do frame
  if (game.events.length > 0) {
    for (const ev of game.events) {
      applyEventToMissions(meta, ev);
    }
    // limpa
    game.events.length = 0;
  }

  // auto-claim: se completar, paga e troca
  for (let i = 0; i < meta.missions.length; i++) {
    const m = meta.missions[i];
    if (!m) continue;

    if (!m.done && m.progress >= m.target) {
      m.done = true;
    }

    // quando done, paga e substitui por outra missão
    if (m.done && !m.claimed) {
      meta.money += m.reward;
      m.claimed = true;

      meta.save.dirty = true;

      // substitui
      meta.missions[i] = makeRandomMission(meta);
      meta.save.dirty = true;
    }
  }
}

/* =========================
   MISSION CORE
   ========================= */

function ensureMissions(meta) {
  if (!Array.isArray(meta.missions)) meta.missions = [];

  // sempre 3 missões
  while (meta.missions.length < 3) {
    meta.missions.push(makeRandomMission(meta));
  }

  // limpa possíveis nulls
  meta.missions = meta.missions.filter(Boolean).slice(0, 3);
}

function applyEventToMissions(meta, ev) {
  for (const m of meta.missions) {
    if (!m || m.claimed) continue;

    if (matches(m, ev)) {
      const add = ev.amount ?? 1;
      m.progress = Math.min(m.target, m.progress + add);
      meta.save.dirty = true;
    }
  }
}

function matches(m, ev) {
  switch (m.kind) {
    case "KILL_SOLDIERS":
      return ev.type === "KILL" && ev.enemyType === "soldier";
    case "KILL_TANKS":
      return ev.type === "KILL" && ev.enemyType === "tank";
    case "BREAK_CRATES":
      return ev.type === "CRATE_BREAK";
    case "COLLECT_COINS":
      return ev.type === "COIN";
    case "SURVIVE_WAVES":
      return ev.type === "WAVE_UP";
    default:
      return false;
  }
}

/* =========================
   MISSION FACTORY
   ========================= */

function makeRandomMission(meta) {
  const pool = [
    () => missionKillSoldiers(),
    () => missionKillTanks(),
    () => missionBreakCrates(),
    () => missionCollectCoins(),
    () => missionSurviveWaves(),
  ];

  // evita 3 iguais do mesmo tipo
  const existingKinds = new Set((meta.missions || []).map(m => m?.kind).filter(Boolean));
  let pick = pool[randInt(0, pool.length - 1)]();

  let tries = 0;
  while (existingKinds.has(pick.kind) && tries < 8) {
    pick = pool[randInt(0, pool.length - 1)]();
    tries++;
  }

  return pick;
}

function baseMission({ kind, target, reward, desc }) {
  return {
    id: `${kind}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    kind,
    desc,

    progress: 0,
    target,

    reward,
    done: false,
    claimed: false,
  };
}

function missionKillSoldiers() {
  const target = randInt(12, 22);
  const reward = Math.max(8, Math.floor(target * 0.7));
  return baseMission({
    kind: "KILL_SOLDIERS",
    target,
    reward,
    desc: `Mate ${target} soldados`,
  });
}

function missionKillTanks() {
  const target = randInt(3, 7);
  const reward = 10 + target * 3;
  return baseMission({
    kind: "KILL_TANKS",
    target,
    reward,
    desc: `Destrua ${target} tanques`,
  });
}

function missionBreakCrates() {
  const target = randInt(3, 6);
  const reward = 8 + target * 3;
  return baseMission({
    kind: "BREAK_CRATES",
    target,
    reward,
    desc: `Quebre ${target} caixas`,
  });
}

function missionCollectCoins() {
  const target = randInt(15, 30);
  const reward = Math.max(10, Math.floor(target * 0.6));
  return baseMission({
    kind: "COLLECT_COINS",
    target,
    reward,
    desc: `Colete ${target} moedas`,
  });
}

function missionSurviveWaves() {
  const target = randInt(2, 4);
  const reward = 12 + target * 6;
  return baseMission({
    kind: "SURVIVE_WAVES",
    target,
    reward,
    desc: `Sobreviva ${target} waves`,
  });
}
