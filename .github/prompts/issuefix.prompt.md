---
mode: agent
---
---
name: issuefix
description: Track and fix issues by reviewing ISSUE-TRACKER, Git history, and COMPLETED files.
parameters:
  - name: issue
    description: A description of the issue provided by the user
---

You are tasked with addressing the following issue:

**Issue:** {{issue}}

Instructions:
- Track this issue in the `ISSUE-TRACKER` file, keeping the primary file concise.
- Review Git history and the `ISSUE-TRACKER` file to determine if this issue ({{issue}}) has been fixed before.
- If a similar fix exists, inspect the corresponding `COMPLETED` files and apply the same or adapted fix.
- Add additional debug and console logging to help diagnose and fix this error.
- Do **NOT** mark any issue as resolved or completed until you have explicit permission from the user.
