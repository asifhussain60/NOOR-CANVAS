---
mode: agent
---
---
---
name: issuefix
description: Track and fix issues by reviewing ISSUE-TRACKER, Git history, and COMPLETED files.
parameters:
  - name: issue
    description: A description of the issue provided by the user (multi-line supported)
---

You are tasked with addressing the following issue:

**Issue:**  
{{issue}}

Instructions:
- Add this issue ({{issue}}) to the `ISSUE-TRACKER` file, keeping the primary file concise.
- Review Git history and the `ISSUE-TRACKER` file to determine if this issue has been fixed before.
- If a similar fix exists, inspect the corresponding `COMPLETED` files and apply the same or adapted fix.
- Add additional debug and console logging to help diagnose and fix this error.
- Do **NOT** mark any issue as resolved or completed until you have explicit permission from the user.
- After implementing changes, take a holistic view of all modifications. Verify that all views and JavaScript files successfully pass linting.
- Pause and request explicit user confirmation to validate the fix before proceeding further — do not update the Issue Status without this confirmation.
- Apply fixes incrementally, stopping at each stage to obtain user approval before continuing.
