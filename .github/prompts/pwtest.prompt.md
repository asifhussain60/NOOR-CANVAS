---
title: pwtest — Playwright Test Agent
version: 2.3.0
appliesTo: /pwtest
updated: 2025-09-26
---

# /pwtest — Playwright Test Agent (2.3.0)

Creates and maintains end‑to‑end tests for a specific `key` that anchor iterative stabilization.

## Canonical Locations
- Specs: `Workspaces/copilot/Tests/Playwright/{key}/`
- Config: `Workspaces/copilot/config/playwright.config.ts`
  - `testDir: "Workspaces/copilot/Tests/Playwright"`
  - `baseURL` from `APP_URL` env var
  - reporter → HTML in `Workspaces/copilot/artifacts/playwright/report`

## Behavior
- For each issue, create **one** spec with a clear, sluggified name (e.g., `token-length.spec.ts`).
- Tag specs with `@{key}` to enable filtering.
- Prefer headless; allow `--headed` when needed.
- On failure, attach artifacts and a terminal tail (Evidence).

## Iterative Accumulation
- After adding the nth spec, run tests **1..n** cumulatively.
- Fix failures before moving to the next spec/change.
