// api.js - minimal API client for BP Guardian

function getAuth() {
  const raw = localStorage.getItem("bp_auth");
  return raw ? JSON.parse(raw) : null;
}

function setAuth(auth) {
  localStorage.setItem("bp_auth", JSON.stringify(auth));
}

function clearAuth() {
  localStorage.removeItem("bp_auth");
}

function requireAuth() {
  const auth = getAuth();
  if (!auth || !auth.user_id) {
    window.location.href = "/";
    return null;
  }
  return auth;
}

async function apiRequest(path, { method = "GET", body = null, authRequired = true } = {}) {
  const headers = {};
  const auth = getAuth();

  if (method !== "GET") headers["Content-Type"] = "application/json";
  if (authRequired) {
    if (!auth || !auth.user_id) throw new Error("Not logged in");
    headers["X-User-Id"] = String(auth.user_id);
  }

  try {
    const res = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const msg = (data && (data.error || data.message)) ? (data.error || data.message) : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    // Cache successful GET responses for offline use
    if (method === "GET") {
      saveOfflineData(path, data);
    }

    return data;
  } catch (error) {
    // If we're offline or network error, try offline handling
    if (!navigator.onLine || error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      console.log("Network error, attempting offline handling for:", path);
      
      // For read operations (GET), try to return cached data
      if (method === "GET") {
        const cachedData = retrieveOfflineData(path);
        if (cachedData) {
          console.log("Returning cached data for:", path);
          return cachedData;
        }
        throw new Error("Offline: No cached data available for this request");
      }

      // For write operations (POST/PUT), queue the request
      if (method !== "GET") {
        addToOfflineQueue(path, { method, body, authRequired });
        console.log("Request queued for offline sync:", path);
        // Return success-like response for UI
        return { 
          offline: true,
          message: "Saved locally. Will sync when online.",
          queued: true
        };
      }
    }

    throw error;
  }
}
