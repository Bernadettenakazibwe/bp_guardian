document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, go dashboard
  const auth = getAuth();
  if (auth && auth.user_id) {
    window.location.href = "/dashboard";
    return;
  }

  const btnRegister = document.getElementById("btnRegister");
  const btnLogin = document.getElementById("btnLogin");

  btnRegister.addEventListener("click", async () => {
    const name = document.getElementById("regName").value.trim() || null;
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;

    if (!email || !password) {
      showToast("Email and password are required.", "warning");
      return;
    }

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
        authRequired: false
      });
      showToast("Registered successfully. Please login.", "success");
    } catch (e) {
      showToast(`Registration failed: ${e.message}`, "danger");
    }
  });

  btnLogin.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      showToast("Email and password are required.", "warning");
      return;
    }

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password },
        authRequired: false
      });

      setAuth({ user_id: data.user_id, email: data.email, name: data.name });
      showToast("Login successful.", "success");
      window.location.href = "/dashboard";
    } catch (e) {
      showToast(`Login failed: ${e.message}`, "danger");
    }
  });
});
