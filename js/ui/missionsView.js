// js/ui/missionsView.js

export function renderMissions(ui, meta) {
  const el = document.getElementById("missionsList");
  if (!el) return;

  const missions = meta.missions || [];
  el.innerHTML = "";

  for (const m of missions) {
    const row = document.createElement("div");
    row.className = "mission-row";

    const left = document.createElement("div");
    left.className = "mission-left";

    const title = document.createElement("div");
    title.className = "mission-title";
    title.textContent = m.desc || "Missão";

    const progress = document.createElement("div");
    progress.className = "mission-progress";
    progress.textContent = `${Math.min(m.progress || 0, m.target || 0)} / ${m.target || 0}`;

    left.appendChild(title);
    left.appendChild(progress);

    const right = document.createElement("div");
    right.className = "mission-right";
    right.textContent = `+${m.reward || 0} moedas`;

    row.appendChild(left);
    row.appendChild(right);

    el.appendChild(row);
  }
}
