let bpTrendChart = null;
let corrChart = null;

function getSeriesFromDashboard(dash) {
  // We accept multiple possible shapes (be forgiving).
  const bpSeries = dash.bp_series || dash.bp_daily || dash.bp_trend || [];
  const moodSeries = dash.mood_series || dash.mood_daily || [];
  const corrSeries = dash.correlation_points || dash.correlation || [];

  return { bpSeries, moodSeries, corrSeries };
}

function buildBpChartData(bpSeries) {
  // Expect entries like: {date, avg_systolic, avg_diastolic} OR {timestamp, systolic, diastolic}
  const labels = [];
  const sys = [];
  const dia = [];

  for (const row of bpSeries) {
    const label = row.date || row.day || row.timestamp || row.time || "";
    labels.push(label.slice(0, 10));
    sys.push(row.avg_systolic ?? row.systolic ?? row.sys ?? null);
    dia.push(row.avg_diastolic ?? row.diastolic ?? row.dia ?? null);
  }
  return { labels, sys, dia };
}

function buildCorrChartData(corrSeries) {
  // We'll plot avg_systolic and avg_mood on same chart with two Y axes.
  const labels = [];
  const sys = [];
  const mood = [];

  for (const row of corrSeries) {
    labels.push((row.date || "").slice(0, 10));
    sys.push(row.avg_systolic ?? row.systolic ?? null);
    mood.push(row.avg_mood ?? null);
  }
  return { labels, sys, mood };
}

async function loadRecommendation() {
  const recoSummary = document.getElementById("recoSummary");
  const recoList = document.getElementById("recoList");
  recoList.innerHTML = "";

  try {
    const data = await apiRequest("/api/recommendation/today", { method: "GET" });
    recoSummary.textContent = data.summary || "—";

    const recs = data.recommendations || [];
    if (!recs.length) {
      const li = document.createElement("li");
      li.textContent = "No recommendations available yet.";
      recoList.appendChild(li);
      return;
    }

    for (const r of recs) {
      const li = document.createElement("li");
      li.textContent = r;
      recoList.appendChild(li);
    }
  } catch (e) {
    recoSummary.textContent = `Error: ${e.message}`;
  }
}

async function loadDashboard() {
  const range = document.getElementById("rangeSelect").value;

  const lastReading = document.getElementById("lastReading");
  const lastReadingMeta = document.getElementById("lastReadingMeta");
  const highestReading = document.getElementById("highestReading");
  const highestReadingMeta = document.getElementById("highestReadingMeta");
  const lowestReading = document.getElementById("lowestReading");
  const lowestReadingMeta = document.getElementById("lowestReadingMeta");
  const moodStatus = document.getElementById("moodStatus");
  const corrHint = document.getElementById("corrHint");

  try {
    const dash = await apiRequest(`/api/dashboard?range=${encodeURIComponent(range)}`, { method: "GET" });

    // Cards
    const last = dash.last_bp || dash.last_reading || dash.last || null;
    const high = dash.highest_bp || dash.highest || null;
    const low = dash.lowest_bp || dash.lowest || null;

    lastReading.textContent = formatBP(last);
    lastReadingMeta.textContent = last?.timestamp ? formatDate(last.timestamp) : "—";

    highestReading.textContent = formatBP(high);
    highestReadingMeta.textContent = high?.timestamp ? formatDate(high.timestamp) : "—";

    lowestReading.textContent = formatBP(low);
    lowestReadingMeta.textContent = low?.timestamp ? formatDate(low.timestamp) : "—";

    // Mood status: use weekly avg category if available
    const moodCat = dash.mood_status || dash.week_mood_category || dash.mood_category || null;
    moodStatus.textContent = moodLabel(moodCat);

    // Charts
    const { bpSeries, corrSeries } = getSeriesFromDashboard(dash);

    // BP Trend chart
    const bpData = buildBpChartData(bpSeries);

    const ctx1 = document.getElementById("bpTrendChart");
    if (bpTrendChart) bpTrendChart.destroy();

    bpTrendChart = new Chart(ctx1, {
      type: "line",
      data: {
        labels: bpData.labels,
        datasets: [
          { label: "Systolic", data: bpData.sys, tension: 0.25 },
          { label: "Diastolic", data: bpData.dia, tension: 0.25 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } }
      }
    });

    // Correlation chart (dual axis)
    const corrData = buildCorrChartData(corrSeries);
    const ctx2 = document.getElementById("corrChart");
    if (corrChart) corrChart.destroy();

    corrChart = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: corrData.labels,
        datasets: [
          { label: "Avg Systolic", data: corrData.sys, yAxisID: "y1" },
          { label: "Avg Mood (1–3)", data: corrData.mood, yAxisID: "y2", type: "line", tension: 0.25 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y1: { position: "left", title: { display: true, text: "Systolic" } },
          y2: { position: "right", min: 1, max: 3, title: { display: true, text: "Mood (1–3)" }, grid: { drawOnChartArea: false } }
        }
      }
    });

    corrHint.textContent = corrSeries.length
      ? "Hint: if systolic rises when mood is low (stress), stress may affect BP."
      : "Not enough daily overlap between BP and mood yet.";

  } catch (e) {
    showToast(`Dashboard error: ${e.message}`, "danger");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();

  document.getElementById("btnRefresh").addEventListener("click", async () => {
    await loadDashboard();
    await loadRecommendation();
  });

  await loadDashboard();
  await loadRecommendation();
});
