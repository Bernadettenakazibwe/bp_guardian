let insightsChart = null;

function buildInsights(corrSeries) {
  const labels = [];
  const sys = [];
  const dia = [];
  const mood = [];

  for (const r of corrSeries) {
    labels.push((r.date || "").slice(0, 10));
    sys.push(r.avg_systolic ?? null);
    dia.push(r.avg_diastolic ?? null);
    mood.push(r.avg_mood ?? null);
  }

  return { labels, sys, dia, mood };
}

async function loadInsights() {
  const insightsText = document.getElementById("insightsText");
  const insRecoSummary = document.getElementById("insRecoSummary");
  const insRecoList = document.getElementById("insRecoList");
  insRecoList.innerHTML = "";

  try {
    const dash = await apiRequest("/api/dashboard?range=week", { method: "GET" });
    const corrSeries = dash.correlation_points || [];

    const data = buildInsights(corrSeries);

    if (insightsChart) insightsChart.destroy();
    const ctx = document.getElementById("insightsChart");

    insightsChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          { label: "Avg Systolic", data: data.sys, tension: 0.25 },
          { label: "Avg Diastolic", data: data.dia, tension: 0.25 },
          { label: "Avg Mood (1–3)", data: data.mood, tension: 0.25 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    insightsText.textContent = corrSeries.length
      ? "We show daily BP averages with mood averages. Watch whether BP rises when mood is low (stress)."
      : "Not enough overlap yet. Log mood on the same days you log BP to see correlation.";

    // Recommendation summary
    const reco = await apiRequest("/api/recommendation/today", { method: "GET" });
    insRecoSummary.textContent = reco.summary || "—";
    (reco.recommendations || []).forEach(tip => {
      const li = document.createElement("li");
      li.textContent = tip;
      insRecoList.appendChild(li);
    });

  } catch (e) {
    showToast(`Insights error: ${e.message}`, "danger");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();
  document.getElementById("btnRefreshInsights").addEventListener("click", loadInsights);
  await loadInsights();
});
