---
mode: agent
---
name: fixissue
description: Track and fix issues by reviewing ISSUE-TRACKER, Git history, and COMPLETED files. Supports numeric-leading arguments for existing issues and text-leading for new issues.
parameters:
  - name: issue
    description: A description of the issue provided by the user (multi-line supported). If it begins with a number, treat that number as an existing Issue ID.
---

You are tasked with addressing the following input:

**User Input:**  
{{issue}}

---

### Input Interpretation Rules (Policy, not code conditionals)
- **Existing Issue Feedback (numeric-leading):** If the input begins with a number (e.g., `106 add default ...`), interpret the first integer as **Issue-<ID>** and the remainder as feedback/context. Do not change status without explicit permission.
- **New Issue (text-leading):** If the input starts with text, treat it as a **new issue**: propose a concise title + description for `ISSUE-TRACKER` with **NOT STARTED** status (await permission before creating/moving files or changing status).

---

### Core Instructions
- Record/track this work in `ISSUE-TRACKER` concisely.
- Review Git history and `ISSUE-TRACKER` for prior fixes; reuse/adapt from `COMPLETED/` where applicable.
- Do **NOT** mark any item as resolved or completed without **explicit user permission**.

---

### Fixing Protocol
1. Add **comprehensive debug information** across all layers to diagnose.
2. Clean up duplicate, obsolete, or irrelevant code to improve efficiency.
3. **Thread History Review Protocol:** Review conversation/commit history for prior attempts and regressions; adapt rather than repeat.
4. **Race-Condition & Concurrency Safety:**  
   - Identify async hotspots (UI events, API calls, SignalR, timers, shared state).  
   - Guard against duplicate triggering, ensure idempotency, use proper async/await, validate ordering, apply safe transactions.  
   - Detect races in logs with correlation IDs, timestamps, thread/task markers.
5. Implement fixes **incrementally**:  
   - After each stage, **pause** and request explicit user confirmation before proceeding.
6. After changes:  
   - Take a holistic view of modifications.  
   - Ensure **all modified code, views, and JavaScript** pass linting.  
   - Run a lint check on **all** modified files for syntax integrity.
7. **Debug Cleanup Protocol (as-you-go):**  
   - As each incremental fix is approved, remove temporary debug/console logs added for diagnosis.  
   - At resolution time, ensure **no test-only logs** remain; retain only explicitly requested long-term logs.
8. **Debug Evidence Logging Protocol:**  
   - Iteratively add log results, observations, and findings directly to the referenced **issue detail `.md` file**.  
   - Timestamp and prefix entries clearly for traceability.  
   - Keep refining hypotheses and debugging approach until root cause is isolated.
9. **Temporary Hardcoding Protocol:**  
   - If the user requests a **temporary hardcoding of values** (for testing or isolation), insert the hardcoded value **only where required**.  
   - Add a `// TODO: Remove hardcoded value after confirmation` comment adjacent to each instance.  
   - During cleanup and before marking resolution as confirmed, ensure all temporary hardcoding is removed, except values explicitly required by design.
10. **Self-Testing Protocol:**  
    - Whenever possible, attempt to **reproduce the reported issue locally**.  
    - After applying a fix, create **self-test code or scenarios** to confirm the resolution.  
    - Place **all test scripts, harnesses, or artifacts** strictly under `Workspaces/TEMP/` (e.g., `Workspaces/TEMP/tests/`).  
    - Never commit these temporary test files to production code; remove or archive them once resolution is confirmed.
11. **UI Test Runner Protocol (VSCode Test Explorer - MANDATORY METHOD):**
    - **REQUIREMENT:** All UI testing must use VSCode Playwright extension's Test Explorer interface
    - **Primary Method:** VSCode Activity Bar → Testing (flask icon) → Playwright section
    - **Test Execution:** Click "Run All Tests" button or individual test play buttons
    - **Issue-106 Testing:** Navigate to `cascading-dropdowns.spec.js` in Test Explorer → Click Run
    - **Debug Mode:** Right-click test → "Debug Test" for breakpoint debugging
    - **Visual Testing:** Enable "Show Browser" option in Test Explorer for headed execution
    - **Test Discovery:** Automatic detection in `Tests/UI/` directory
    - **Real-time Results:** Live pass/fail status and execution feedback in UI
    - **Report Access:** Test Explorer provides direct links to generated reports
    - **Forbidden Methods:** Terminal commands (`npm test`, `npx playwright test`) are prohibited
    - **Exception:** `playwright show-report` allowed only for report viewing
    - **All artifacts:** Screenshots, videos, traces automatically saved to `TEMP/` folders
    - **Test Management:** Visual interface eliminates need for command memorization
12. **Playwright Prerequisite Protocol:**  
    - As you run or set up Playwright tests, document all **prerequisites, environment variables, test data, and setup requirements** in the referenced issue detail file.  
    - Add them incrementally as they are discovered, preventing repetition of setup mistakes across different issues.  
    - Use a consistent format (e.g., `### Playwright Prerequisites` section with bullet points).  
    - Ensure that any teammate can re-run the same test by following the prerequisites recorded.

---

### Testing & Data Protocols
- **UI Testing:**  
  - **MANDATORY:** Use VSCode Playwright Test Explorer (not terminal commands) for all UI testing  
  - **Purpose:** Simulate end-user workflows when debugging Razor view/UI issues  
  - **Integration:** Built-in debugging, reporting, and artifact management  

- **Database Testing (KSESSIONS_DEV only):**  
  - For issues involving data, **connect directly to the development database environment** `KSESSIONS_DEV` to run tests and validate results.  
  - The **production database `KSESSIONS` must NEVER be touched** under any circumstances.  
  - In `KSESSIONS_DEV`, the `dbo` schema is **read-only**. Any feature work or modifications must use the **`canvas`** schema.  
  - Use environment-based (non-hardcoded) connection settings; do not log secrets.  
  - Wrap write operations in transactions where appropriate and verify row counts/side effects.

---

### Issue Tracker Compliance
- **Lifecycle:** Issues → NOT STARTED → IN PROGRESS → AWAITING CONFIRMATION → COMPLETED.  
  TODOs → ❌ → ⚡ → ⏳ → ✅.
- **File Sync & Formatting:** Keep entries in sync with their detail `.md` files; preserve exact icon/ID/link formatting.  
- **TEMP Policy:** Place temporary artifacts under `Workspaces/TEMP` (subfolders for tests/docs/data).  
- **Regressions:** Compare with `COMPLETED` fixes and reuse proven patterns.

---

### Razor View Protocol
- If working on a Razor view, follow protocol listed in `Workspaces/Documentation/IMPLEMENTATIONS/blazor-view-builder-strategy.md`
- Honor the Mock Implementation Guide:  
  - 95%+ visual accuracy vs. mocks.  
  - Consistent spacing (8/16/24/32px).  
  - Prefer specific classes over `!important`.  
  - Centralize styles in `noor-canvas.css` unless view-specific dictates otherwise.

---

### Optimization Guidance
- **Mock-First Validation:** Compare live output with design mocks (e.g., VS Code Simple Browser).  
- **CSS Conflict Prevention:** Remove legacy/duplicate styles; keep a clean base.  
- **SignalR/API Paths:** Validate real-time flows and API responses; prefix diagnostics with `[ISSUE-XXX-FIX]`.

---

### Actions Based on Interpretation
**If numeric-leading (existing issue):**
- Locate **Issue-<ID>**; append “Feedback / Additional Context” (no status change without permission).
- Cross-check Git history and any related `COMPLETED` entries.
- Apply the **Fixing Protocol** (including Self-Testing, Playwright Prerequisite Protocol, and Testing & Data Protocols).

**If text-leading (new issue):**
- Draft a **proposed Issue title + short description** with minimal repro and acceptance criteria.
- Suggest a tracker entry under **NOT STARTED** with a link-ready detail filename.
- Await explicit approval before creating files or changing statuses.
