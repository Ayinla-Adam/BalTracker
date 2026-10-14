(function () {
  "use strict";

  function addConnectionNotice() {
    if (!document.body || document.getElementById("baltracker-connection-notice")) return;

    const style = document.createElement("style");
    style.textContent = [
      "#baltracker-connection-notice{position:fixed;z-index:99999;top:0;left:0;right:0;padding:10px 16px;text-align:center;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.12);}",
      "#baltracker-connection-notice[data-state=offline]{background:#7f1d1d;color:#fff;}",
      "#baltracker-connection-notice[data-state=online]{background:#166534;color:#fff;}",
      "@media(min-width:700px){#baltracker-connection-notice{left:50%;right:auto;transform:translateX(-50%);width:max-content;max-width:90vw;border-radius:0 0 10px 10px;}}"
    ].join("");
    document.head.appendChild(style);

    const notice = document.createElement("div");
    notice.id = "baltracker-connection-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    notice.hidden = true;
    document.body.appendChild(notice);

    function updateConnection() {
      if (!navigator.onLine) {
        notice.dataset.state = "offline";
        notice.textContent = "You're offline. BalTracker's cloud data may not load, and changes may not sync.";
        notice.hidden = false;
      } else if (notice.dataset.state === "offline") {
        notice.dataset.state = "online";
        notice.textContent = "Connection restored. Check that any recent changes were saved.";
        notice.hidden = false;
      } else {
        notice.hidden = true;
      }
    }

    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    updateConnection();
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost" &&
        location.hostname !== "127.0.0.1") return;

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
        .catch(function (error) {
          console.error("BalTracker offline shell could not be enabled:", error);
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addConnectionNotice, { once: true });
  } else {
    addConnectionNotice();
  }
  registerServiceWorker();
})();
