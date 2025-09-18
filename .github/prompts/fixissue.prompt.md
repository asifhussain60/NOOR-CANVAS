---
mode: agent
---
name: fixissue
description: Track and fix issues by reviewing IS10. **Te11. **Self12. **Mandatory Playwright Test Creation Protocol:**
    - **PREREQUISITE:** Ensure NoorCanvas application is running (see Applicati### Actions Based on Interpretation

**If multiple issues detected (contains "---"):**
- Split input on "---" delimiter and process each issue individually
- Apply Application Startup Validation Protocol once before processing any issues
- Process issues sequentially using rules below
- Maintain issue numbering sequence across all new issues
- Generate consolidated summary

**If numeric-leading (existing issue):**
- **FIRST:** Apply Application Startup Validation Protocol if any testing will be required
- Locate **Issue-<ID>**; append "Feedback / Additional Context" (no status change without permission).
- Cross-check Git history and any related `COMPLETED` entries.
- Apply the **Fixing Protocol** (including Self-Testing, Playwright Prerequisite Protocol, and Testing & Data Protocols).artup Validation Protocol)
    - **REQUIREMENT:** For every fix implemented, create or update corresponding Playwright test(s) in `Tests/UI/`esting Protocol:**  
    - Whenever possible, attempt to **reproduce the reported issue locally**.  
    - After applying a fix, create **self-test code or scenarios** to confirm the resolution.  
    - Place **all test scripts, harnesses, or artifacts** strictly under `Workspaces/TEMP/` (e.g., `Workspaces/TEMP/tests/`).  
    - Never commit these temporary test files to production code; remove or archive them once resolution is confirmed.
12. **Mandatory Playwright Test Creation Protocol:**y Hardcoding Protocol:**  
    - If the user requests a **temporary hardcoding of values** (for testing or isolation), insert the hardcoded value **only where required**.  
    - Add a `// TODO: Remove hardcoded value after confirmation` comment adjacent to each instance.  
    - During cleanup and before marking resolution as confirmed, ensure all temporary hardcoding is removed, except values explicitly required by design.
11. **Self-Testing Protocol:**RACKER, Git history, and COMPLETED files. Supports numeric**If ### Actions Based on I**I### Actions Based on Interpretation
**If numeric-leading (existing issue):**
- Locate **Issue-<ID>** in `ncIssueTracker.md`; append "Feedback / Additional Context" (no status change without permission).
- Cross-check Git history and any related `COMPLETED` entries.
- Apply the **Fixing Protocol** (including Self-Testing, Mandatory Playwright Test Creation Protocol, Issue Numbering Sequence Protocol, and Testing & Data Protocols).
- **CRITICAL:** Before marking any issue as resolved, create/update Playwright tests and provide execution evidence.

**If text-leading (new issue):**ic-leading (existing issue):**
- Locate **Issue-<ID>** in `ncIssueTracker.md`; append "Feedback / Additional Context" (no status change without permission).
- Cross-check Git history and any related `COMPLETED` entries.
- Apply the **Fixing Protocol** (including Self-Testing, Mandatory Playwright Test Creation Protocol, Issue Numbering Sequence Protocol, and Testing & Data Protocols).
- **CRITICAL:** Before marking any issue as resolved, create/update Playwright tests and provide execution evidence.pretation
**If numeric-leading (existing issue):**
- Locate **Issue-<ID>**; append "Feedback / Additional Context" (no status change without permission).
- Cross-check Git history and any related `COMPLETED` entries.
- Apply the **Fixing Protocol** (including Self-Testing, Mandatory Playwright Test Creation Protocol, and Testing & Data Protocols).
- **CRITICAL:** Before marking any issue as resolved, create/update Playwright tests and provide execution evidence.

**If text-leading (new issue):**
- **FIRST:** Check `ncIssueTracker.md` via grep search to determine next available issue number (currently Issue-108+)
- Draft a **proposed Issue title + short description** with minimal repro and acceptance criteria.
- Suggest a tracker entry under **NOT STARTED** with a link-ready detail filename using correct sequential number.
- Include **planned test scenarios** in the issue description for future validation.
- Await explicit approval before creating files or changing statuses.ding (existing issue):**
- Locate **Issue-<ID>**; append "Feedback / Additional Context" (no status change without permission).
- Cross-check Git history and any related `COMPLETED` entries.
- Apply the **Fixing Protocol** (including Self-Testing, Mandatory Playwright Test Creation Protocol, and Testing & Data Protocols).
- **CRITICAL:** Before marking any issue as resolved, create/update Playwright tests and provide execution evidence.ding arguments for existing issues and text-leading for new issues.
parameters:
  - name: issue
    description: A description of the issue provided by the user (multi-line supported). If it begins with a number, treat that number as an existing Issue ID. Supports multiple issues separated by "---" delimiter for batch processing.
---

You are tasked with addressing the following input:

**User Input:**  
{{issue}}

---

### Input Interpretation Rules (Policy, not code conditionals)
- **Multiple Issues Support:** If input contains "---" delimiter, split into separate issues and process each individually using the rules below
- **Existing Issue Feedback (numeric-leading):** If the input begins with a number (e.g., `106 add default ...`), interpret the first integer as **Issue-<ID>** and the remainder as feedback/context. Do not change status without explicit permission.
- **New Issue (text-leading):** If the input starts with text, treat it as a **new issue**: propose a concise title + description for `ISSUE-TRACKER` with **NOT STARTED** status (await permission before creating/moving files or changing status).

---

### Core Instructions
- Record/track this work in `ISSUE-TRACKER` concisely.
- Review Git history and `ISSUE-TRACKER` for prior fixes; reuse/adapt from `COMPLETED/` where applicable.
- Do **NOT** mark any item as resolved or completed without **explicit user permission**.
- **Issue Number Sequence Maintenance:** Always check `ncIssueTracker.md` to determine the next available issue number. Current sequence: Issue-107 is the highest existing number, so new issues start at Issue-108.

---

### Fixing Protocol
1. **Application Startup Validation Protocol (MANDATORY FIRST STEP):**
   - **BEFORE ANY TESTING:** Check if NoorCanvas application is running on https://localhost:9091 and http://localhost:9090
   - **Validation Method:** Use `run_task` with task ID `shell: run-with-iiskill` or check for running processes
   - **Auto-Start:** If application is not running, automatically start it using the appropriate task before proceeding
   - **Startup Verification:** Wait for application logs showing "Now listening on" messages for both ports
   - **Health Check:** Verify application responds to basic HTTP requests before running any tests
   - **Failure Handling:** If startup fails, diagnose and resolve startup issues before proceeding with issue fixes
2. Add **comprehensive debug information** across all layers to diagnose.
3. Clean up duplicate, obsolete, or irrelevant code to improve efficiency.
4. **Thread History Review Protocol:** Review conversation/commit history for prior attempts and regressions; adapt rather than repeat.
5. **Race-Condition & Concurrency Safety:**  
   - Identify async hotspots (UI events, API calls, SignalR, timers, shared state).  
   - Guard against duplicate triggering, ensure idempotency, use proper async/await, validate ordering, apply safe transactions.  
   - Detect races in logs with correlation IDs, timestamps, thread/task markers.
6. Implement fixes **incrementally**:  
   - After each stage, **pause** and request explicit user confirmation before proceeding.
   - For UI/UX fixes, validate changes in browser before proceeding to next stage.
7. After changes:  
   - Take a holistic view of modifications.  
   - Ensure **all modified code, views, and JavaScript** pass linting.  
   - Run a lint check on **all** modified files for syntax integrity.
8. **Debug Cleanup Protocol (as-you-go):**  
   - As each incremental fix is approved, remove temporary debug/console logs added for diagnosis.  
   - At resolution time, ensure **no test-only logs** remain; retain only explicitly requested long-term logs.
9. **Debug Evidence Logging Protocol:**  
   - Iteratively add log results, observations, and findings directly to the referenced **issue detail `.md` file**.  
   - Timestamp and prefix entries clearly for traceability.  
   - Keep refining hypotheses and debugging approach until root cause is isolated.
10. **Temporary Hardcoding Protocol:**  
   - If the user requests a **temporary hardcoding of values** (for testing or isolation), insert the hardcoded value **only where required**.  
   - Add a `// TODO: Remove hardcoded value after confirmation` comment adjacent to each instance.  
   - During cleanup and before marking resolution as confirmed, ensure all temporary hardcoding is removed, except values explicitly required by design.
10. **Self-Testing Protocol:**  
    - Whenever possible, attempt to **reproduce the reported issue locally**.  
    - After applying a fix, create **self-test code or scenarios** to confirm the resolution.  
    - Place **all test scripts, harnesses, or artifacts** strictly under `Workspaces/TEMP/` (e.g., `Workspaces/TEMP/tests/`).  
    - Never commit these temporary test files to production code; remove or archive them once resolution is confirmed.
11. **Mandatory Playwright Test Creation Protocol:**
    - **REQUIREMENT:** For every fix implemented, create or update corresponding Playwright test(s) in `Tests/UI/`
    - **Naming Convention:** Use `issue-{ID}-{description}.spec.ts` for issue-specific tests
    - **Test Categories:**
      - **Regression Tests:** Validate the specific bug doesn't reoccur (test exact failure scenario)
      - **Feature Tests:** Confirm new functionality works as designed  
      - **Integration Tests:** Test complete user workflows end-to-end
      - **Session Flow Tests:** For authentication/session issues, test complete token generation → validation → user access flow
    - **Test Structure Requirements:**
      - Include detailed JSDoc comments explaining what's being tested
      - Reference the issue number and resolution approach
      - Add both positive and negative test scenarios
      - Include proper error handling validation
    - **Evidence Requirements:** 
      - Run tests via VSCode Test Explorer before marking issue complete
      - Provide test report output showing pass status
      - Include screenshots/videos of test execution when UI changes are involved
    - **Test Data Management:**
      - Use realistic test data that mirrors production scenarios
      - Include boundary condition testing (empty values, edge cases)
      - Test with both valid and invalid inputs
13. **UI Test Runner Protocol (VSCode Test Explorer - MANDATORY METHOD):**
    - **PREREQUISITE:** Ensure NoorCanvas application is running before executing any UI tests
    - **REQUIREMENT:** All UI testing must use VSCode Playwright extension's Test Explorer interface
    - **Primary Method:** VSCode Activity Bar → Testing (flask icon) → Playwright section
    - **Test Execution:** Click "Run All Tests" button or individual test play buttons
    - **Issue-106 Testing:** Navigate to `cascading-dropdowns.spec.js` in Test Explorer → Click Run
    - **Debug Mode:** Right-click test → "Debug Test" for breakpoint debugging
    - **Visual Testing:** Enable "Show Browser" option in Test Explorer for headed execution
    - **Test Discovery:** Automatic detection in `Tests/UI/` directory
    - **Real-time Results:** Live pass/fail status and execution feedback in UI
    - **Report Access:** Test Explorer provides direct links to generated reports
    - **All artifacts:** Screenshots, videos, traces automatically saved to `TEMP/` folders
    - **Test Management:** Visual interface eliminates need for command memorization
14. **Host Authentication Validation Protocol:**
    - **PREREQUISITE:** Ensure NoorCanvas application is running and accessible
    - **API Validation:** When claiming host authentication fixes, provide API response evidence
    - **Friendly Token Testing:** Use test token `JHINFLXN` for validation scenarios
    - **Expected Response Format:** JSON array with album objects containing id, name, image, description, speakerID, isActive, isCompleted fields
    - **Success Criteria:** API returns 200 status with properly formatted album data
    - **Example Valid Response:** `[{"id":18,"name":"Asaas Al-Taveel","image":"18.jpg","description":"<p>Taveel book</p>","speakerID":1,"isActive":true,"isCompleted":false},...]`
15. **Playwright Prerequisite Protocol:**  
    - **Application Dependency:** All Playwright tests require NoorCanvas application to be running first
    - As you run or set up Playwright tests, document all **prerequisites, environment variables, test data, and setup requirements** in the referenced issue detail file.  
    - Add them incrementally as they are discovered, preventing repetition of setup mistakes across different issues.  
    - Use a consistent format (e.g., `### Playwright Prerequisites` section with bullet points).  
    - Ensure that any teammate can re-run the same test by following the prerequisites recorded.
16. **Issue Numbering Sequence Protocol:**
    - **MANDATORY:** Before creating any new issue, query `ncIssueTracker.md` to identify the highest existing issue number
    - **Current Status:** Issue-107 is the highest number (as of Sept 18, 2025). Next new issue should be Issue-108
    - **Sequence Validation:** Use grep search `Issue-(\d+)` to find all existing numbers and increment from highest
    - **TODO Sequence:** Separate from issues. Current TODO-101 through TODO-107 exist. Next TODO should be TODO-108
    - **Gap Prevention:** Never reuse old issue numbers, even if they were deleted or moved
    - **Cross-Reference Check:** Verify issue number doesn't conflict with existing `NOT STARTED/`, `IN PROGRESS/`, `AWAITING CONFIRMATION/`, or `COMPLETED/` folders

---

### Multiple Issues Support Protocol
- **Batch Processing:** Support processing multiple issues in a single prompt using "---" as delimiter
- **Input Format:** 
  ```
  Issue 1 description here
  ---
  Issue 2 description here  
  ---
  New issue description here
  ```
- **Processing Rules:**
  1. Split input on "---" delimiter and trim whitespace
  2. Process each issue block individually using standard interpretation rules
  3. For each issue, apply appropriate handling (existing vs new issue logic)
  4. Create todo list tracking all issues being processed
  5. Process issues sequentially, not in parallel
  6. Maintain proper issue numbering sequence across all new issues
- **Batch Validation:**
  - Verify application is running before processing any issues that require testing
  - Use single application instance for all testing across multiple issues
  - Coordinate issue numbering to prevent conflicts
  - Generate comprehensive summary covering all processed issues
- **Output Format:**
  - Create separate tracking entries for each issue
  - Provide consolidated summary of all work performed
  - Include cross-references between related issues if applicable

---

### Testing & Data Protocols
- **UI Testing:**  
  - **MANDATORY:** Use VSCode Playwright Test Explorer (not terminal commands) for all UI testing  
  - **Purpose:** Simulate end-user workflows when debugging Razor view/UI issues  
  - **Integration:** Built-in debugging, reporting, and artifact management  
  - **Test Creation:** Every fix MUST include corresponding Playwright test creation/updates
  - **Test Evidence:** Provide test execution reports and pass/fail status before resolution

- **Database Testing (KSESSIONS_DEV only):**  
  - For issues involving data, **connect directly to the development database environment** `KSESSIONS_DEV` to run tests and validate results.  
  - The **production database `KSESSIONS` must NEVER be touched** under any circumstances.  
  - In `KSESSIONS_DEV`, the `dbo` schema is **read-only**. Any feature work or modifications must use the **`canvas`** schema.  
  - Use environment-based (non-hardcoded) connection settings; do not log secrets.  
  - Wrap write operations in transactions where appropriate and verify row counts/side effects.
  - When Copilot asserts that a Playwright test is fixed, it must provide the corresponding Playwright test report as evidence.

---

### Issue Tracker Compliance
- **Lifecycle:** Issues → NOT STARTED → IN PROGRESS → AWAITING CONFIRMATION → COMPLETED.  
  TODOs → ❌ → ⚡ → ⏳ → ✅.
- **File Sync & Formatting:** Keep entries in sync with their detail `.md` files; preserve exact icon/ID/link formatting.  
- **Number Sequence:** Maintain sequential issue numbering. Current: Issue-107 highest, next Issue-108. TODOs: TODO-107 highest, next TODO-108.
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
- **FIRST:** Apply Application Startup Validation Protocol if immediate testing/validation is needed
- **SECOND:** Check `ncIssueTracker.md` via grep search to determine next available issue number (currently Issue-108+)
- Draft a **proposed Issue title + short description** with minimal repro and acceptance criteria.
- Suggest a tracker entry under **NOT STARTED** with a link-ready detail filename using correct sequential number.
- Include **planned test scenarios** in the issue description for future validation.
- Await explicit approval before creating files or changing statuses.
