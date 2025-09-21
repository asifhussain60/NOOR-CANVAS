# Overview

This folder contains the implementation test harness and policy artifacts for NOOR CANVAS.

IMPORTANT: This is a scaffold only. Per instructions we are not building or executing tests in this change.

## Structure

- `unit/` - Placeholder test descriptions and test stubs mapped to issues
- `integration/` - Integration test plans (placeholders)
- `scripts/` - Harness scripts (verification and test-runner placeholders)

## Strategy

- Each issue must include a test file under `Tests/NC-ImplementationTests/unit/Issue-<NN>-*.md` or a real test project (future)
- Completed issues must have passing tests. Tests for open issues may fail.
- Tests will later be wired into CI so that all completed-issue tests must pass before app launch.

## Next steps

1. Convert these placeholders into real xUnit projects and tests.
2. Add a CI pipeline job to run `dotnet test` and fail builds on failing tests for completed issues.
   NC Implementation Test Suite

Purpose

- Provide a comprehensive test harness for verifying issue fixes and application health.
- Completed issues must have passing tests. Open issues may have failing tests.

Policy

- Every new issue must include a corresponding test file under Tests/NC-ImplementationTests/tests/ in one of the categories: unit, integration, or e2e.
- Tests for issues marked as COMPLETED in `IssueTracker/NC-ISSUE-TRACKER.MD` must pass before launching the application.
- Test execution is mandatory in developer workflow: run the test harness in a terminal before starting the app.

Structure

- tests/
  - unit/
  - integration/
  - e2e/
- harness/
  - run-tests.ps1 # PowerShell harness to run tests and report failures
  - verify-completed-tests.ps1 # Confirms all COMPLETED issues' tests pass

What not to do

- Do not modify project build targets. This is a test scaffold only.

Notes

- This file is a living document; update with new test patterns and examples as the project evolves.
