# Automated Browser Diagnostics System

**Date**: 2025-10-14  
**Purpose**: Eliminate user intervention in UI bug diagnosis  
**Approach**: Automated browser diagnostic capture using Playwright + diagnostic endpoints  

---

## 🎯 Core Concept

**Instead of asking user**: "Open DevTools, copy console logs, screenshot Network tab..."

**Agent automatically**:
1. Launches Playwright browser session
2. Navigates to problematic page
3. Captures console logs, network requests, DOM state, computed styles
4. Analyzes diagnostic data
5. Applies targeted fix
6. Validates fix automatically
7. Reports results to user

---

## 🛠️ Implementation Architecture

### Phase 1: Browser Automation Diagnostics (Playwright)

**File**: `Tests/UI/diagnostics/auto-browser-diagnostics.spec.ts`

```typescript
import { test, expect, Page } from '@playwright/test';
import fs from 'fs';

/**
 * Automated Browser Diagnostics
 * Captures comprehensive diagnostic data without user intervention
 */

interface DiagnosticReport {
  timestamp: string;
  url: string;
  consoleLogs: ConsoleLo[]g;
  networkRequests: NetworkRequest[];
  domState: DOMState;
  computedStyles: Record<string, any>;
  screenshots: {
    fullPage: string;
    element?: string;
  };
  errors: string[];
}

interface ConsoleLog {
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  type: string; // 'document', 'stylesheet', 'script', 'xhr', etc.
  failed: boolean;
}

interface DOMState {
  elementExists: Record<string, boolean>;
  elementVisible: Record<string, boolean>;
  elementCount: Record<string, number>;
}

/**
 * Auto-diagnose UI issue
 * @param page Playwright page instance
 * @param targetUrl URL to diagnose
 * @param selectors Critical element selectors to check
 */
async function autoDiagnose(
  page: Page, 
  targetUrl: string, 
  selectors: string[]
): Promise<DiagnosticReport> {
  
  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    url: targetUrl,
    consoleLogs: [],
    networkRequests: [],
    domState: {
      elementExists: {},
      elementVisible: {},
      elementCount: {}
    },
    computedStyles: {},
    screenshots: {
      fullPage: ''
    },
    errors: []
  };

  // 1. CAPTURE CONSOLE LOGS
  page.on('console', msg => {
    report.consoleLogs.push({
      type: msg.type() as any,
      message: msg.text(),
      timestamp: Date.now()
    });
  });

  // 2. CAPTURE NETWORK REQUESTS
  page.on('response', async response => {
    report.networkRequests.push({
      url: response.url(),
      method: response.request().method(),
      status: response.status(),
      type: response.request().resourceType(),
      failed: !response.ok()
    });
  });

  // 3. NAVIGATE TO PAGE
  try {
    await page.goto(targetUrl, { waitForLoadState: 'networkidle' });
  } catch (error) {
    report.errors.push(`Navigation failed: ${error.message}`);
  }

  // 4. CAPTURE DOM STATE
  for (const selector of selectors) {
    try {
      // Check if element exists
      const elementHandle = await page.$(selector);
      report.domState.elementExists[selector] = elementHandle !== null;

      if (elementHandle) {
        // Check visibility
        report.domState.elementVisible[selector] = await elementHandle.isVisible();

        // Get computed styles
        report.computedStyles[selector] = await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          if (!element) return null;
          
          const styles = window.getComputedStyle(element);
          return {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            zIndex: styles.zIndex,
            position: styles.position,
            width: styles.width,
            height: styles.height,
            overflow: styles.overflow,
            maxHeight: styles.maxHeight,
            maxWidth: styles.maxWidth
          };
        }, selector);
      }

      // Count elements matching selector
      report.domState.elementCount[selector] = await page.locator(selector).count();

    } catch (error) {
      report.errors.push(`Error checking ${selector}: ${error.message}`);
    }
  }

  // 5. CAPTURE SCREENSHOTS
  report.screenshots.fullPage = await page.screenshot({ 
    path: `Workspaces/TEMP/diagnostics/screenshot-${Date.now()}.png`,
    fullPage: true 
  }).then(buffer => buffer.toString('base64'));

  // 6. CHECK JAVASCRIPT LIBRARY AVAILABILITY
  const libraryCheck = await page.evaluate(() => {
    return {
      jQuery: typeof (window as any).$ !== 'undefined',
      toastr: typeof (window as any).toastr !== 'undefined',
      Blazor: typeof (window as any).Blazor !== 'undefined',
      signalR: typeof (window as any).signalR !== 'undefined'
    };
  });

  report.computedStyles['__libraries__'] = libraryCheck;

  // 7. ANALYZE AND RETURN
  return report;
}

/**
 * Automated diagnostic test for toast notifications
 */
test.describe('Auto-Diagnostics: Toast Notifications', () => {
  
  test('diagnose toast visibility issue', async ({ page }) => {
    
    // Define critical selectors
    const criticalSelectors = [
      '#toast-container',
      '.toast',
      '.canvas-area-container',
      '.canvas-sidebar',
      '.debug-panel'
    ];

    // Run auto-diagnosis
    const report = await autoDiagnose(
      page,
      'https://localhost:9091/Canvas/212/KJAHA99L',
      criticalSelectors
    );

    // Save diagnostic report
    const reportPath = `Workspaces/TEMP/diagnostics/diagnostic-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('📊 DIAGNOSTIC REPORT SAVED:', reportPath);

    // AUTOMATED ANALYSIS
    const analysis = analyzeReport(report);
    console.log('🔍 AUTOMATED ANALYSIS:', JSON.stringify(analysis, null, 2));

    // Fail test if critical issues detected (forces agent to review)
    if (analysis.criticalIssues.length > 0) {
      throw new Error(`Critical issues detected:\n${analysis.criticalIssues.join('\n')}`);
    }
  });

  test('diagnose and trigger toast automatically', async ({ page }) => {
    
    // Navigate to page
    await page.goto('https://localhost:9091/Canvas/212/KJAHA99L');
    await page.waitForLoadState('networkidle');

    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

    // Find and click "Test Toast" button
    const testButton = page.locator('button:has-text("Test Toast")');
    
    if (await testButton.count() > 0) {
      await testButton.click();
      
      // Wait for toast to appear
      await page.waitForTimeout(500);

      // Check if toast container exists and is visible
      const toastContainer = page.locator('#toast-container');
      const isVisible = await toastContainer.isVisible();

      // Capture screenshot
      await page.screenshot({ path: `Workspaces/TEMP/diagnostics/toast-test-${Date.now()}.png` });

      // Report findings
      console.log('🧪 AUTOMATED TOAST TEST:');
      console.log('  Toast container exists:', await toastContainer.count() > 0);
      console.log('  Toast container visible:', isVisible);
      console.log('  Console logs:', consoleLogs);

      // Get toast computed styles
      const toastStyles = await page.evaluate(() => {
        const container = document.querySelector('#toast-container');
        if (!container) return null;
        
        const styles = window.getComputedStyle(container);
        return {
          display: styles.display,
          zIndex: styles.zIndex,
          position: styles.position,
          top: styles.top,
          right: styles.right
        };
      });

      console.log('  Toast styles:', toastStyles);

      // Validate
      expect(isVisible).toBe(true);
    }
  });
});

/**
 * Analyze diagnostic report and identify issues
 */
function analyzeReport(report: DiagnosticReport): {
  criticalIssues: string[];
  warnings: string[];
  suggestions: string[];
} {
  
  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for failed network requests
  const failedCSS = report.networkRequests.filter(r => r.type === 'stylesheet' && r.failed);
  const failedJS = report.networkRequests.filter(r => r.type === 'script' && r.failed);

  if (failedCSS.length > 0) {
    issues.push(`CSS files failed to load: ${failedCSS.map(r => r.url).join(', ')}`);
  }

  if (failedJS.length > 0) {
    issues.push(`JavaScript files failed to load: ${failedJS.map(r => r.url).join(', ')}`);
  }

  // Check for JavaScript errors in console
  const errorLogs = report.consoleLogs.filter(log => log.type === 'error');
  if (errorLogs.length > 0) {
    issues.push(`JavaScript errors detected: ${errorLogs.map(l => l.message).join('; ')}`);
  }

  // Check for missing libraries
  const libs = report.computedStyles['__libraries__'];
  if (libs) {
    if (!libs.toastr) issues.push('toastr library not loaded');
    if (!libs.jQuery) warnings.push('jQuery not loaded');
    if (!libs.Blazor) warnings.push('Blazor not initialized');
  }

  // Check for hidden elements
  for (const [selector, styles] of Object.entries(report.computedStyles)) {
    if (selector === '__libraries__') continue;
    
    if (styles && typeof styles === 'object') {
      if (styles.display === 'none') {
        warnings.push(`${selector} has display:none`);
      }
      if (styles.zIndex === 'auto' || styles.zIndex === '0') {
        suggestions.push(`${selector} has low z-index (${styles.zIndex})`);
      }
      if (styles.visibility === 'hidden') {
        warnings.push(`${selector} has visibility:hidden`);
      }
    }
  }

  // Check for non-existent elements
  for (const [selector, exists] of Object.entries(report.domState.elementExists)) {
    if (!exists) {
      warnings.push(`Element not found: ${selector}`);
    }
  }

  return {
    criticalIssues: issues,
    warnings: warnings,
    suggestions: suggestions
  };
}

export { autoDiagnose, analyzeReport, DiagnosticReport };
```

---

### Phase 2: Diagnostic API Endpoint

**File**: `SPA/NoorCanvas/Controllers/DiagnosticsController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;

namespace NoorCanvas.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiagnosticsController : ControllerBase
    {
        private readonly ILogger<DiagnosticsController> _logger;

        public DiagnosticsController(ILogger<DiagnosticsController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Client-side diagnostic reporting endpoint
        /// Receives automated diagnostic data from browser
        /// </summary>
        [HttpPost("report")]
        public IActionResult SubmitDiagnosticReport([FromBody] ClientDiagnosticReport report)
        {
            var requestId = Guid.NewGuid().ToString("N").Substring(0, 8);
            
            _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] ========== CLIENT DIAGNOSTIC REPORT ==========", requestId);
            _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] URL: {Url}", requestId, report.Url);
            _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] User Agent: {UserAgent}", requestId, report.UserAgent);
            
            // Log console errors
            if (report.ConsoleErrors?.Any() == true)
            {
                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] CONSOLE ERRORS ({Count}):", requestId, report.ConsoleErrors.Count);
                foreach (var error in report.ConsoleErrors)
                {
                    _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}]   - {Error}", requestId, error);
                }
            }
            
            // Log library availability
            if (report.LibrariesLoaded != null)
            {
                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] LIBRARIES:", requestId);
                foreach (var lib in report.LibrariesLoaded)
                {
                    _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}]   {Library}: {Status}", 
                        requestId, lib.Key, lib.Value ? "✅ LOADED" : "❌ NOT LOADED");
                }
            }
            
            // Log failed resources
            if (report.FailedResources?.Any() == true)
            {
                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] FAILED RESOURCES ({Count}):", requestId, report.FailedResources.Count);
                foreach (var resource in report.FailedResources)
                {
                    _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}]   - {Resource}", requestId, resource);
                }
            }
            
            // Log DOM issues
            if (report.MissingElements?.Any() == true)
            {
                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] MISSING ELEMENTS ({Count}):", requestId, report.MissingElements.Count);
                foreach (var element in report.MissingElements)
                {
                    _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}]   - {Element}", requestId, element);
                }
            }
            
            _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] ========== REPORT COMPLETE ==========", requestId);
            
            return Ok(new { requestId, message = "Diagnostic report received" });
        }
    }

    public class ClientDiagnosticReport
    {
        public string Url { get; set; }
        public string UserAgent { get; set; }
        public List<string> ConsoleErrors { get; set; }
        public Dictionary<string, bool> LibrariesLoaded { get; set; }
        public List<string> FailedResources { get; set; }
        public List<string> MissingElements { get; set; }
        public Dictionary<string, object> ComputedStyles { get; set; }
    }
}
```

---

### Phase 3: Auto-Reporting JavaScript Module

**File**: `SPA/NoorCanvas/wwwroot/js/auto-diagnostics.js`

```javascript
/**
 * Automatic Browser Diagnostics
 * Self-reporting diagnostic module that runs on page load
 */

(function() {
    'use strict';

    const diagnostics = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        consoleErrors: [],
        librariesLoaded: {},
        failedResources: [],
        missingElements: [],
        computedStyles: {}
    };

    // Capture console errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
        diagnostics.consoleErrors.push(args.join(' '));
        originalConsoleError.apply(console, args);
    };

    // Check library availability
    function checkLibraries() {
        diagnostics.librariesLoaded = {
            'jQuery': typeof $ !== 'undefined',
            'toastr': typeof toastr !== 'undefined',
            'Blazor': typeof Blazor !== 'undefined',
            'signalR': typeof signalR !== 'undefined'
        };
    }

    // Check for failed resources
    function checkFailedResources() {
        performance.getEntriesByType('resource').forEach(resource => {
            // If resource failed to load (0 duration + 0 transfer size = failed)
            if (resource.duration === 0 && resource.transferSize === 0) {
                diagnostics.failedResources.push(resource.name);
            }
        });
    }

    // Check for missing critical elements
    function checkMissingElements(selectors) {
        selectors.forEach(selector => {
            if (!document.querySelector(selector)) {
                diagnostics.missingElements.push(selector);
            }
        });
    }

    // Get computed styles for critical elements
    function getComputedStyles(selectors) {
        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                const styles = window.getComputedStyle(element);
                diagnostics.computedStyles[selector] = {
                    display: styles.display,
                    visibility: styles.visibility,
                    zIndex: styles.zIndex,
                    position: styles.position,
                    height: styles.height,
                    maxHeight: styles.maxHeight,
                    overflow: styles.overflow
                };
            }
        });
    }

    // Send diagnostic report to server
    async function sendDiagnosticReport() {
        try {
            const response = await fetch('/api/Diagnostics/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(diagnostics)
            });
            
            if (response.ok) {
                console.log('[AUTO-DIAGNOSTIC] Report sent successfully');
            }
        } catch (error) {
            console.error('[AUTO-DIAGNOSTIC] Failed to send report:', error);
        }
    }

    // Run diagnostics on page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            checkLibraries();
            checkFailedResources();
            
            // Critical elements to check
            const criticalSelectors = [
                '#toast-container',
                '.canvas-area-container',
                '.canvas-sidebar',
                '.debug-panel'
            ];
            
            checkMissingElements(criticalSelectors);
            getComputedStyles(criticalSelectors);
            
            // Send report (only in debug mode)
            if (window.location.search.includes('debug=auto')) {
                sendDiagnosticReport();
            }
            
            // Also expose for manual triggering
            window.noorDiagnostics = {
                getReport: () => diagnostics,
                sendReport: sendDiagnosticReport
            };
            
        }, 1000); // Wait 1 second for libraries to load
    });
})();
```

---

## 🔄 Updated Task Prompt Workflow (No User Intervention)

**Step 2.4: Automated Evidence Gathering (Replaces User Requests)**

```markdown
#### 2.4. Automated Evidence Gathering (UI/Browser bugs)

**When UI bug reported, agent SHALL:**

1. **Launch Automated Diagnostic Test**:
   ```bash
   npx playwright test Tests/UI/diagnostics/auto-browser-diagnostics.spec.ts
   ```

2. **Read Diagnostic Report**:
   - Location: `Workspaces/TEMP/diagnostics/diagnostic-report-{timestamp}.json`
   - Parse: consoleLogs, networkRequests, domState, computedStyles, errors

3. **Analyze Report Automatically**:
   - Check: Failed CSS/JS resources → Library not loaded
   - Check: JavaScript errors → toastr not defined
   - Check: DOM element missing → #toast-container not in page
   - Check: display:none or visibility:hidden → Element hidden
   - Check: z-index: auto/0 → Layering conflict

4. **Apply Targeted Fix** based on analysis:
   ```
   IF analysis shows "toastr not defined":
     → Add <script> tag for toastr.js
   
   ELSE IF analysis shows "CSS failed to load":
     → Fix CSS path or create missing file
   
   ELSE IF analysis shows "z-index: 0":
     → Set z-index: 999999 !important
   
   ELSE IF analysis shows "display: none":
     → Remove display:none or adjust visibility
   ```

5. **Validate Fix Automatically**:
   - Re-run diagnostic test
   - Compare before/after reports
   - Confirm issue resolved

**No user intervention required** - fully automated diagnostic → fix → validate cycle.
```

---

## 📊 Comparison: User Intervention vs Automated

| Step | User Intervention Approach | Automated Approach |
|------|---------------------------|-------------------|
| Evidence Gathering | Ask user to open DevTools, copy logs (2-5 min) | Run Playwright test (30 sec) |
| Network Analysis | Ask user for Network tab screenshot (1-2 min) | Capture all network requests automatically |
| DOM Inspection | Ask user to find element, copy styles (2-3 min) | Query DOM programmatically (instant) |
| Validation | Ask user to test and report (2-5 min) | Re-run diagnostic test (30 sec) |
| **Total Time** | **7-15 minutes + user delay** | **1-2 minutes, fully automated** |
| User Experience | Frustrating, requires technical knowledge | Seamless, no intervention needed |

---

## 🚀 Implementation Steps

1. **Create diagnostic test**: `auto-browser-diagnostics.spec.ts`
2. **Create diagnostic API**: `DiagnosticsController.cs`
3. **Create auto-reporting JS**: `auto-diagnostics.js`
4. **Update task.prompt.md**: Replace user intervention with automated tests
5. **Test with real bug**: Run automated diagnostics on toast issue

---

## ✅ Success Criteria

- ✅ Agent can diagnose UI bugs without asking user for logs
- ✅ Diagnostic test runs in < 1 minute
- ✅ Report includes console logs, network, DOM, styles
- ✅ Automated analysis identifies issue type
- ✅ Fix applied based on analysis
- ✅ Validation runs automatically

**Result**: 1-attempt fixes with ZERO user intervention!
