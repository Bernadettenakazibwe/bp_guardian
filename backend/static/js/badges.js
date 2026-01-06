function renderBadges(badges) {
  const grid = document.getElementById("badgesGrid");
  grid.innerHTML = "";

  for (const b of badges) {
    const tile = document.createElement("div");
    tile.className = "badge-tile";

    const icon = document.createElement("div");
    icon.className = "badge-icon " + (b.earned ? "earned" : "locked");
    icon.textContent = b.earned ? "✓" : "🔒";

    const box = document.createElement("div");
    const name = document.createElement("div");
    name.className = "badge-name";
    name.textContent = b.name;

    const desc = document.createElement("div");
    desc.className = "badge-desc";
    desc.textContent = b.description || "";

    const date = document.createElement("div");
    date.className = "badge-date";
    date.textContent = b.earned_at ? `Earned: ${new Date(b.earned_at).toLocaleString()}` : "Locked";

    box.appendChild(name);
    box.appendChild(desc);
    box.appendChild(date);

    tile.appendChild(icon);
    tile.appendChild(box);

    grid.appendChild(tile);
  }
}

async function loadBadges() {
  const line = document.getElementById("newBadgeLine");
  try {
    const data = await apiRequest("/api/badges", { method: "GET" });
    const newly = data.newly_awarded || [];
    line.textContent = newly.length ? `Newly unlocked: ${newly.join(", ")}` : "No new badges unlocked right now.";
    renderBadges(data.badges || []);
  } catch (e) {
    showToast(`Badges error: ${e.message}`, "danger");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();
  document.getElementById("btnRefreshBadges").addEventListener("click", loadBadges);
  await loadBadges();
});
