// ui.js - small UI helpers

function showToast(message, type = "info") {
  const toastArea = document.getElementById("toastArea");
  if (!toastArea) return;

  const colors = {
    info: "alert-primary",
    success: "alert-success",
    danger: "alert-danger",
    warning: "alert-warning"
  };

  const div = document.createElement("div");
  div.className = `alert ${colors[type] || "alert-primary"} shadow-sm`;
  div.textContent = message;

  toastArea.appendChild(div);

  setTimeout(() => div.remove(), 3000);
}

function formatBP(r) {
  if (!r) return "—";
  const s = r.systolic ?? r.avg_systolic ?? r.sys ?? null;
  const d = r.diastolic ?? r.avg_diastolic ?? r.dia ?? null;
  if (s == null || d == null) return "—";
  return `${Math.round(s)}/${Math.round(d)}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const dt = new Date(iso);
    return dt.toLocaleString();
  } catch {
    return iso;
  }
}

function moodLabel(cat) {
  if (!cat) return "—";
  if (cat === "high_stress") return "High stress";
  if (cat === "medium") return "Medium";
  if (cat === "calm") return "Calm";
  if (cat === "no_data") return "No data";
  return String(cat);
}

function setupNavAuth() {
  const label = document.getElementById("navUserLabel");
  const btn = document.getElementById("btnLogout");
  const auth = getAuth();

  if (label) {
    if (auth && auth.user_id) label.textContent = `${auth.email} (ID ${auth.user_id})`;
    else label.textContent = "Not logged in";
  }

  if (btn) {
    btn.addEventListener("click", () => {
      clearAuth();
      window.location.href = "/";
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavAuth();
});
