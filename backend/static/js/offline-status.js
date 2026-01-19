// offline-status.js - Shows offline queue status in UI

function updateOfflineQueueBadge() {
  const queue = getOfflineQueue();
  const queueBadge = document.getElementById("offlineQueueBadge");
  
  if (!queueBadge) return;
  
  if (queue.length > 0) {
    queueBadge.style.display = "inline-block";
    queueBadge.textContent = queue.length;
  } else {
    queueBadge.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateOfflineQueueBadge();
  
  // Update badge whenever offline queue changes
  setInterval(updateOfflineQueueBadge, 1000);
});
