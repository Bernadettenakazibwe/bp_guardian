let insightsChart = null;

function buildInsights(corrSeries) {
  const labels = [];
  const sys = [];
  const dia = [];
  const mood = [];

  for (const r of corrSeries) {
    labels.push(String(r.date || "").slice(0, 10));
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

    // ✅ FIX: correct path
    const corrSeries = dash.daily_summary?.correlation_points || [];

    const data = buildInsights(corrSeries);

    if (insightsChart) insightsChart.destroy();
    const ctx = document.getElementById("insightsChart");

    insightsChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Avg Systolic",
            data: data.sys,
            yAxisID: "y1",
            tension: 0.25
          },
          {
            label: "Avg Diastolic",
            data: data.dia,
            yAxisID: "y1",
            tension: 0.25
          },
          {
            label: "Avg Mood (1–3)",
            data: data.mood,
            yAxisID: "y2",
            tension: 0.25
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y1: {
            position: "left",
            title: { display: true, text: "Blood Pressure (mmHg)" }
          },
          y2: {
            position: "right",
            min: 1,
            max: 5,
            title: { display: true, text: "Mood (1–3)" },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });

    // Insight text
    if (corrSeries.length >= 2) {
      insightsText.textContent =
        "This chart compares daily blood pressure averages with mood levels. Notice whether BP increases on days with higher stress.";
    } else if (corrSeries.length === 1) {
      insightsText.textContent =
        "Only one day of overlapping data so far. Add another day to see a pattern.";
    } else {
      insightsText.textContent =
        "Not enough overlap yet. Log mood on the same days you log BP to see insights.";
    }

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
  document
    .getElementById("btnRefreshInsights")
    .addEventListener("click", loadInsights);

  await loadInsights();
});
