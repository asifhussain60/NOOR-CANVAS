# Action 03: Add Prompt Linter Spec and CI Hook

Priority: Medium
Effort: 3 SP
Affected Areas:
- CI configuration
- .github/prompts/*
- .github/instructions/*

Implementation Steps:
1. Define linter rules:
   - Front matter keys present: mode, description
   - Version/Changelog section present
   - Links resolve (basic path existence check)
   - Step numbering unique (no duplicates like Step 2.4 twice)
   - No inline duplicates of shared protocols (flag long repeated sections)
2. Implement as a small Node/PowerShell script in Workspaces/CodeQuality.
3. Add CI job to run on PRs touching `.github/prompts/**` or `.github/instructions/**`.

Validation:
- Fails when rules violated; passes otherwise.
- Document suppression/override process if needed.
