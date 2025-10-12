/**
 * NOOR Canvas Browser Logging Utility
 * Provides structured logging for browser-side events, errors, and diagnostics
 */
window.NoorLogger = (function () {
  "use strict";

  const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4,
  };

  const LOG_LEVEL_NAMES = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
  const LOG_LEVEL_COLORS = [
    "#6c757d",
    "#0d6efd",
    "#fd7e14",
    "#dc3545",
    "#6f42c1",
  ];

  let currentLogLevel = LOG_LEVELS.INFO;
  let sessionId = null;
  let userId = null;

  // Initialize with URL parameters or defaults
  function init() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("debug") === "1") {
      currentLogLevel = LOG_LEVELS.DEBUG;
    }

    // Extract session info if available
    sessionId =
      urlParams.get("sessionId") || localStorage.getItem("noor-sessionId");
    userId = localStorage.getItem("noor-userId");

    // Log initialization
    log(LOG_LEVELS.INFO, "NOOR-BROWSER", "Browser logger initialized", {
      logLevel: LOG_LEVEL_NAMES[currentLogLevel],
      sessionId: sessionId,
      userId: userId,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  function formatMessage(level, component, message, data) {
    const timestamp = new Date().toISOString().substr(11, 12); // HH:mm:ss.SSS
    const levelName = LOG_LEVEL_NAMES[level];
    const prefix = `[${timestamp} ${levelName}] ${component}:`;
    return { prefix, message, data };
  }

  function log(level, component, message, data = null) {
    if (level < currentLogLevel) return;

    const formatted = formatMessage(level, component, message, data);
    const color = LOG_LEVEL_COLORS[level];

    // Console output with styling
    if (data) {
      console.log(
        `%c${formatted.prefix}%c ${formatted.message}`,
        `color: ${color}; font-weight: bold;`,
        "color: inherit;",
        data,
      );
    } else {
      console.log(
        `%c${formatted.prefix}%c ${formatted.message}`,
        `color: ${color}; font-weight: bold;`,
        "color: inherit;",
      );
    }

    // Send to server if configured and level is WARN or higher
    if (level >= LOG_LEVELS.WARN && window.fetch) {
      sendToServer(level, component, message, data);
    }
  }

  function sendToServer(level, component, message, data) {
    const payload = {
      timestamp: new Date().toISOString(),
      level: LOG_LEVEL_NAMES[level],
      component: component,
      message: message,
      data: data,
      sessionId: sessionId,
      userId: userId,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error("Failed to send log to server:", err);
    });
  }

  // SignalR connection logging
  function logSignalREvent(event, connectionId, data) {
    log(LOG_LEVELS.DEBUG, "SIGNALR", event, {
      connectionId: connectionId,
      data: data,
    });
  }

  // Error boundary for unhandled errors
  function setupErrorHandling() {
    window.addEventListener("error", function (event) {
      log(LOG_LEVELS.ERROR, "UNHANDLED-ERROR", event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.toString() : null,
      });
    });

    window.addEventListener("unhandledrejection", function (event) {
      log(LOG_LEVELS.ERROR, "UNHANDLED-PROMISE", event.reason, {
        promise: event.promise,
        reason: event.reason ? event.reason.toString() : null,
      });
    });
  }

  // Public API
  return {
    init: init,
    setLogLevel: function (level) {
      currentLogLevel = level;
    },
    setSession: function (sId, uId) {
      sessionId = sId;
      userId = uId;
    },
    debug: function (component, message, data) {
      log(LOG_LEVELS.DEBUG, component, message, data);
    },
    info: function (component, message, data) {
      log(LOG_LEVELS.INFO, component, message, data);
    },
    warn: function (component, message, data) {
      log(LOG_LEVELS.WARN, component, message, data);
    },
    error: function (component, message, data) {
      log(LOG_LEVELS.ERROR, component, message, data);
    },
    fatal: function (component, message, data) {
      log(LOG_LEVELS.FATAL, component, message, data);
    },
    signalr: logSignalREvent,
    setupErrorHandling: setupErrorHandling,
    LOG_LEVELS: LOG_LEVELS,
  };
})();

// Auto-initialize when loaded
document.addEventListener("DOMContentLoaded", function () {
  NoorLogger.init();
  NoorLogger.setupErrorHandling();
});
