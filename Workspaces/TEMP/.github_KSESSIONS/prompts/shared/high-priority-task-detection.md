# High-Priority Task Detection and Verification

Purpose: Capture ALL CAPS constraints from the user request, classify them, and ensure they’re explicitly verified before marking work complete.

Last Updated: 2025-10-18

---

## Detection

- Scan the incoming user request for ALL CAPS fragments and strong imperatives (e.g., MUST, EXACTLY, DO NOT, NEVER).
- Extract them into a concise list under “HIGH-PRIORITY Constraints”.

---

## Classification

1) Preservation — Do NOT remove/rename existing elements or flows
2) Exactness — EXACTLY match visuals, colors, strings, or formats
3) Mandatory Inclusion — MUST include specific fields, endpoints, components
4) Behavioral — MUST perform a behavior or forbid one (security, access, timing)

Each constraint gets: Category, Verification Method, and Status (PENDING → VERIFIED → FAILED).

---

## Verification Methods

- Preservation: DOM queries, regression checks, endpoint presence, file existence
- Exactness: Visual diffs, CSS inspection, string comparisons, sample payload checks
- Mandatory Inclusion: Code inspection, tests asserting presence
- Behavioral: Functional tests, manual acceptance, logs/telemetry

---

## Reporting

Record under “High-Priority Constraint Verification”:

```
- [PASS] Constraint: do NOT remove save button
  - Method: DOM query .session-save-button
  - Evidence: Test SaveButtonPresent passed
```

Violations must halt execution and require re-plan or rollback as defined in task.prompt.md.
