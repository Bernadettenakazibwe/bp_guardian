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
      const result = await apiRequest("/api/bp", { method: "POST", body: { systolic, diastolic } });
      
      if (result.offline) {
        showToast("📱 BP saved offline. Will sync when online.", "info");
      } else {
        showToast("✓ BP saved.", "success");
      }
      
      // Clear input fields
      document.getElementById("bpSys").value = "";
      document.getElementById("bpDia").value = "";
    } catch (e) {
      showToast(`BP save failed: ${e.message}`, "danger");
    }
  });

  btnSaveMood.addEventListener("click", async () => {
    const mood_level = parseInt(document.getElementById("moodLevel").value, 10);
    const note = document.getElementById("moodNote").value.trim() || null;

    try {
      const result = await apiRequest("/api/mood", { method: "POST", body: { mood_level, note } });
      
      if (result.offline) {
        showToast("📱 Mood saved offline. Will sync when online.", "info");
      } else {
        showToast("✓ Mood saved.", "success");
      }
      
      // Clear input fields
      document.getElementById("moodLevel").value = "";
      document.getElementById("moodNote").value = "";
    } catch (e) {
      showToast(`Mood save failed: ${e.message}`, "danger");
    }
  });

  
});


  