let bpTrendChart = null;
let corrChart = null;

function getSeriesFromDashboard(dash) {
  const bpDaily = dash.daily_summary?.bp_daily || [];
  const moodDaily = dash.daily_summary?.mood_daily || [];
  const corrSeries = dash.daily_summary?.correlation_points || [];

  // fallback to raw series if daily is missing
  const bpSeries = bpDaily.length ? bpDaily : (dash.bp_series || []);
  const moodSeries = moodDaily.length ? moodDaily : (dash.mood_series || []);

  return { bpSeries, moodSeries, corrSeries, bpDaily, moodDaily };
}

function buildBpChartData(bpSeries) {
  // Supports:
  //  - daily: {date, avg_systolic, avg_diastolic}
  //  - raw:  {timestamp, systolic, diastolic}
  const labels = [];
  const sys = [];
  const dia = [];

  for (const row of bpSeries) {
    const label = row.date || row.day || row.timestamp || row.time || "";
    labels.push(String(label).slice(0, 10));
    sys.push(row.avg_systolic ?? row.systolic ?? row.sys ?? null);
    dia.push(row.avg_diastolic ?? row.diastolic ?? row.dia ?? null);
  }

  return { labels, sys, dia };
}

function buildCorrChartData(corrSeries) {
  // corrSeries entries look like:
  // {date, avg_systolic, avg_diastolic, avg_mood, mood_category}
  const labels = [];
  const sys = [];
  const mood = [];

  for (const row of corrSeries) {
    labels.push(String(row.date || "").slice(0, 10));
    sys.push(row.avg_systolic ?? null);
    mood.push(row.avg_mood ?? null);
  }
  return { labels, sys, mood };
}

function computeMoodStatusFromDaily(moodDaily) {
  // moodDaily: [{date, avg_mood, mood_category}]
  if (!moodDaily || moodDaily.length === 0) return "no_data";

  const counts = {};
  for (const m of moodDaily) {
    const cat = m.mood_category || "no_data";
    counts[cat] = (counts[cat] || 0) + 1;
  }

  // pick most frequent
  let best = "no_data";
  let bestCount = -1;
  for (const [cat, c] of Object.entries(counts)) {
    if (c > bestCount) {
      best = cat;
      bestCount = c;
    }
  }
  return best;
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
    const last = dash.last_bp || null;
    const high = dash.highest_bp || null;
    const low = dash.lowest_bp || null;

    lastReading.textContent = formatBP(last);
    lastReadingMeta.textContent = last?.timestamp ? formatDate(last.timestamp) : "—";

    highestReading.textContent = formatBP(high);
    highestReadingMeta.textContent = high?.timestamp ? formatDate(high.timestamp) : "—";

    lowestReading.textContent = formatBP(low);
    lowestReadingMeta.textContent = low?.timestamp ? formatDate(low.timestamp) : "—";

    // Series
    const { bpSeries, moodDaily, corrSeries } = getSeriesFromDashboard(dash);

    // Mood Status computed from moodDaily
    const moodCat = computeMoodStatusFromDaily(moodDaily);
    moodStatus.textContent = moodLabel(moodCat);

    // BP Trend chart (prefer daily)
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

    // Correlation chart (needs at least 2 days to look meaningful)
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
          y2: { position: "right", min: 1, max: 5, title: { display: true, text: "Mood (1–3)" }, grid: { drawOnChartArea: false } }
        }
      }
    });

    if (corrSeries.length >= 2) {
      corrHint.textContent = "Hint: if systolic rises when mood is low (stress), stress may affect BP.";
    } else if (corrSeries.length === 1) {
      corrHint.textContent = "Only 1 day of overlap so far — add another day to see a trend.";
    } else {
      corrHint.textContent = "Not enough daily overlap between BP and mood yet.";
    }

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
