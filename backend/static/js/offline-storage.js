// offline-storage.js - Manages offline data storage in localStorage

const OFFLINE_QUEUE_KEY = "bp_guardian_offline_queue";
const OFFLINE_DATA_KEY = "bp_guardian_offline_data";

/**
 * Get the entire offline queue
 */
function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading offline queue:", e);
    return [];
  }
}

/**
 * Save the offline queue to localStorage
 */
function saveOfflineQueue(queue) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Error saving offline queue:", e);
  }
}

/**
 * Add a request to the offline queue
 */
function addToOfflineQueue(path, options) {
  const queue = getOfflineQueue();
  const item = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    path,
    method: options.method || "GET",
    body: options.body,
    authRequired: options.authRequired !== false
  };
  
  queue.push(item);
  saveOfflineQueue(queue);
  console.log("Added to offline queue:", item);
  return item;
}

/**
 * Remove a request from the offline queue by ID
 */
function removeFromOfflineQueue(itemId) {
  const queue = getOfflineQueue();
  const filtered = queue.filter(item => item.id !== itemId);
  saveOfflineQueue(filtered);
}

/**
 * Clear the entire offline queue
 */
function clearOfflineQueue() {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log("Offline queue cleared");
  } catch (e) {
    console.error("Error clearing offline queue:", e);
  }
}

/**
 * Get offline data (fallback data for display when offline)
 */
function getOfflineData() {
  try {
    const raw = localStorage.getItem(OFFLINE_DATA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Error reading offline data:", e);
    return {};
  }
}

/**
 * Save offline data (for cached API responses)
 */
function saveOfflineData(key, data) {
  try {
    const offlineData = getOfflineData();
    offlineData[key] = {
      data,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
    console.log("Saved offline data:", key);
  } catch (e) {
    console.error("Error saving offline data:", e);
  }
}

/**
 * Retrieve offline data by key
 */
function retrieveOfflineData(key) {
  const offlineData = getOfflineData();
  return offlineData[key]?.data || null;
}
