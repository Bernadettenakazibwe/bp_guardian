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

  return data;
}
