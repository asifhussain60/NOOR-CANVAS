### 🔑 FixIssue Command Checklist
1. **Startup Validation**
   - Ensure app is running on `https://localhost:9091` / `http://localhost:9090`.
   - Confirm health check passes.

2. **Add Debug Logging (All Layers)**
   - UI (Razor/JS) → API → Service → SQL.
   - Use correlation IDs; redact secrets.
   - Capture log snippets before/after each fix.

3. **Iterative Loop**
   - Diagnose → Fix → Log/Measure → Test.
   - Repeat until logs confirm **no errors/warnings** remain.

4. **Self-Test & Evidence**
   - Reproduce locally.
   - Record repro + results in iteration log.

5. **Playwright Tests**
   - Create/update `issue-{ID}-{slug}.spec.ts`.
   - Run in VS Code Test Explorer; save report/screenshots.

6. **Pre-Build Integrity Checks**
   - Scan for duplicate code in modified files.
   - Validate Razor/HTML syntax.
   - Lint JS/TS; check TypeScript compilation.
   - Block build if any fail.

7. **Data/Env Safety**
   - Use only `KSESSIONS_DEV`.
   - Validate DTOs ↔ API ↔ SQL entities.

8. **Concurrency & Resilience**
   - Verify async/await, cancellation tokens, duplicate-click protection.

9. **Cleanup**
   - Remove debug debris/temp code once fix is approved.
