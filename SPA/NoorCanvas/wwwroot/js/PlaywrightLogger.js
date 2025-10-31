window.PlaywrightLogger = {
    enabled: true,
    logBuffer: [],
    maxBufferSize: 10,
    flushInterval: 5000,

    init: function () {
        if (!this.enabled) return;

        console.log('[PLAYWRIGHT-LOG] Logger initialized');

        // Global click listener
        document.addEventListener('click', (e) => {
            const target = e.target;
            const testId = target.getAttribute('data-testid') ||
                target.closest('[data-testid]')?.getAttribute('data-testid');
            const selector = testId ? `[data-testid="${testId}"]` : this.getSelector(target);
            const elementType = target.tagName.toLowerCase();
            const elementText = target.textContent?.trim().substring(0, 50) || '';

            const timestamp = new Date().toISOString();
            const logEntry = `${timestamp} | CLICK | ${selector} | ${elementType} | "${elementText}"`;
            console.log(`[PLAYWRIGHT-LOG] ${logEntry}`);
            this.addLog(logEntry);
        }, true);

        // Input changes
        document.addEventListener('input', (e) => {
            const target = e.target;
            const testId = target.getAttribute('data-testid') ||
                target.closest('[data-testid]')?.getAttribute('data-testid');
            const selector = testId ? `[data-testid="${testId}"]` : this.getSelector(target);
            const value = target.value?.substring(0, 50) || '';

            const timestamp = new Date().toISOString();
            const logEntry = `${timestamp} | INPUT | ${selector} | value="${value}"`;
            console.log(`[PLAYWRIGHT-LOG] ${logEntry}`);
            this.addLog(logEntry);
        }, true);

        // Navigation
        let lastUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== lastUrl) {
                const timestamp = new Date().toISOString();
                const logEntry = `${timestamp} | NAVIGATE | ${window.location.href}`;
                console.log(`[PLAYWRIGHT-LOG] ${logEntry}`);
                this.addLog(logEntry);
                lastUrl = window.location.href;
            }
        }, 100);

        // Auto-flush logs every 5 seconds
        setInterval(() => {
            this.flushLogs();
        }, this.flushInterval);

        // Flush logs before page unload
        window.addEventListener('beforeunload', () => {
            this.flushLogs(true); // Synchronous flush
        });
    },

    addLog: function (logEntry) {
        this.logBuffer.push(logEntry);

        // Auto-flush if buffer reaches max size
        if (this.logBuffer.length >= this.maxBufferSize) {
            this.flushLogs();
        }
    },

    flushLogs: function (synchronous = false) {
        if (this.logBuffer.length === 0) return;

        const logsToSend = [...this.logBuffer];
        this.logBuffer = [];

        if (synchronous) {
            // Synchronous flush using navigator.sendBeacon (for page unload)
            const blob = new Blob([JSON.stringify({ logs: logsToSend })], { type: 'application/json' });
            navigator.sendBeacon('/api/playwright-logs', blob);
            console.log(`[PLAYWRIGHT-LOG] Flushed ${logsToSend.length} logs (synchronous)`);
        } else {
            // Asynchronous flush using fetch
            this.saveLogs(logsToSend);
        }
    },

    saveLogs: function (logs) {
        // Send logs to backend endpoint
        fetch('/api/playwright-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs: logs })
        }).then(() => {
            console.log(`[PLAYWRIGHT-LOG] Saved ${logs.length} log entries to server`);
        }).catch(err => {
            console.error('[PLAYWRIGHT-LOG] Failed to save logs:', err);
            // Fallback: Keep in buffer for next flush attempt
            this.logBuffer.unshift(...logs);
        });
    },

    getSelector: function (element) {
        const path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.nodeName.toLowerCase();
            if (element.id) {
                selector += '#' + element.id;
                path.unshift(selector);
                break;
            } else {
                let sibling = element;
                let nth = 1;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.nodeName.toLowerCase() === selector) nth++;
                }
                if (nth !== 1) selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
            element = element.parentNode;
        }
        return path.join(' > ');
    }
};
