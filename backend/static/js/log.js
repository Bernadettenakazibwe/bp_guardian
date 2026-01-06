document.addEventListener("DOMContentLoaded", () => {
  requireAuth();

  const btnSaveBp = document.getElementById("btnSaveBp");
  const btnSaveMood = document.getElementById("btnSaveMood");
  const rawOut = document.getElementById("rawOut");

  btnSaveBp.addEventListener("click", async () => {
    const systolic = parseInt(document.getElementById("bpSys").value, 10);
    const diastolic = parseInt(document.getElementById("bpDia").value, 10);

    if (!systolic || !diastolic) {
      showToast("Please enter systolic and diastolic.", "warning");
      return;
    }

    try {
      await apiRequest("/api/bp", { method: "POST", body: { systolic, diastolic } });
      showToast("BP saved.", "success");
    } catch (e) {
      showToast(`BP save failed: ${e.message}`, "danger");
    }
  });

  btnSaveMood.addEventListener("click", async () => {
    const mood_level = parseInt(document.getElementById("moodLevel").value, 10);
    const note = document.getElementById("moodNote").value.trim() || null;

    try {
      await apiRequest("/api/mood", { method: "POST", body: { mood_level, note } });
      showToast("Mood saved.", "success");
    } catch (e) {
      showToast(`Mood save failed: ${e.message}`, "danger");
    }
  });

  document.getElementById("btnListBp").addEventListener("click", async () => {
    try {
      const data = await apiRequest("/api/bp?limit=10", { method: "GET" });
      rawOut.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      rawOut.textContent = `Error: ${e.message}`;
    }
  });

  document.getElementById("btnListMood").addEventListener("click", async () => {
    try {
      const data = await apiRequest("/api/mood?limit=10", { method: "GET" });
      rawOut.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      rawOut.textContent = `Error: ${e.message}`;
    }
  });
});
