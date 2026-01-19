// sync.js - Handles syncing offline data when back online

let isSyncing = false;

/**
 * Check if we're currently online
 */
function isOnline() {
  return navigator.onLine;
}

/**
 * Sync all offline queued requests to the server
 */
async function syncOfflineQueue() {
  if (isSyncing) {
    console.log("Sync already in progress");
    return;
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    console.log("No offline items to sync");
    return;
  }

  if (!isOnline()) {
    console.log("Still offline, cannot sync");
    return;
  }

  isSyncing = true;
  showToast(`Syncing ${queue.length} offline item(s)...`, "info");
  console.log("Starting offline sync with", queue.length, "items");

  let successCount = 0;
  let failureCount = 0;
  const failedItems = [];

  for (const item of queue) {
    try {
      const response = await fetch(item.path, {
        method: item.method,
        headers: {
          "Content-Type": "application/json",
          ...(item.authRequired ? { "X-User-Id": String(getAuth().user_id) } : {})
        },
        body: item.body ? JSON.stringify(item.body) : null
      });

      if (response.ok) {
        removeFromOfflineQueue(item.id);
        successCount++;
        console.log("Synced:", item.path, item.method);
      } else {
        failureCount++;
        failedItems.push(item);
        console.error("Sync failed for:", item.path, response.status);
      }
    } catch (e) {
      failureCount++;
      failedItems.push(item);
      console.error("Sync error:", e);
    }
  }

  isSyncing = false;

  if (successCount > 0) {
    showToast(`✓ Synced ${successCount} item(s) successfully`, "success");
  }
  if (failureCount > 0) {
    showToast(`⚠ Failed to sync ${failureCount} item(s), will retry later`, "warning");
  }

  console.log(`Sync complete: ${successCount} success, ${failureCount} failed`);
}

/**
 * Listen for online event and sync when connection restored
 */
window.addEventListener("online", () => {
  console.log("Back online! Syncing offline data...");
  showToast("Back online! Syncing your data...", "info");
  
  // Small delay to ensure connection is stable
  setTimeout(() => {
    syncOfflineQueue();
  }, 500);
});

/**
 * Listen for offline event
 */
window.addEventListener("offline", () => {
  console.log("You are now offline");
  showToast("You are offline. Data will be saved locally and synced when online.", "warning");
});

/**
 * Try to sync on page load if we have queued items
 */
document.addEventListener("DOMContentLoaded", () => {
  if (isOnline() && getOfflineQueue().length > 0) {
    console.log("Page loaded with offline items. Attempting sync...");
    syncOfflineQueue();
  }
});
