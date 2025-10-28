# Drift Detector Algorithm

**Purpose:** Detect when user encounters unrelated issues during active work

**Used by:** plan.prompt.md, task.prompt.md (Drift detection)

---

## Algorithm

**Input:** current_key, user_message, active_files[]

**Output:** { is_drift: boolean, drift_type: string, severity: string }

---

## Drift Indicators

**High Confidence Drift:**
- User mentions different component/file
- New error unrelated to current work
- "By the way" or "Also" prefixes
- Different technical domain
- Blocking issue preventing current work

**Medium Confidence Drift:**
- Related but not in current plan
- Enhancement to adjacent feature
- Optimization opportunity found
- Documentation gap discovered

**Low Confidence Drift:**
- Clarification question
- Minor fix in current files
- Code style suggestion
- Related improvement idea

---

## Drift Types

**1. Blocking Drift (handle immediately)**
- Build error prevents continuation
- Runtime exception blocks testing
- Missing dependency stops work
- Configuration issue blocks execution

**2. Related Drift (consider adding to plan)**
- Enhancement to current feature
- Bug in adjacent component
- Related validation issue
- UX improvement in same area

**3. Unrelated Drift (defer to separate key)**
- Different feature/component
- New bug report
- Separate enhancement request
- Independent investigation

**4. Stack Corruption Drift (critical)**
- Multiple unrelated issues stacked
- Original work forgotten
- Context completely lost
- Multiple incomplete tasks

---

## Detection Patterns

**Keyword analysis:**
- "also", "by the way", "while we're at it"
- "different issue", "separate problem"
- "unrelated but", "on another note"
- "quick question about X" (X = different component)

**File divergence:**
- New files mentioned not in active plan
- Different directory path
- Unrelated component reference
- Different layer (UI vs API)

**Error context change:**
- New stack trace different component
- Different exception type
- Unrelated error message
- Different line numbers/files

---

## Severity Assessment

**Critical (P0):**
- Blocks all work
- Production incident
- Data loss risk
- Security vulnerability

**High (P1):**
- Blocks current work
- Affects multiple users
- Breaking change discovered
- Test failures blocking commit

**Medium (P2):**
- Related enhancement
- Non-blocking bug
- Code quality issue
- Documentation missing

**Low (P3):**
- Nice-to-have
- Future enhancement
- Minor improvement
- Cosmetic issue

---

## Response Strategy

**For Blocking Drift (Critical/High):**
```markdown
## 🚨 Drift Detected: Blocking Issue

**Current work:** {current-key}
**New issue:** {drift-description}
**Severity:** {critical|high}

**Options:**
**A.** Pause current work, handle blocker first
**B.** Quick fix blocker, resume current work
**C.** Log drift, continue current work (if workaround available)
**D.** Abandon current work, switch to drift

**Recommended:** A (blocker must be resolved)
```

**For Related Drift (Medium):**
```markdown
## 📌 Related Issue Found

**Current work:** {current-key}
**Related issue:** {drift-description}
**Severity:** {medium}

**Options:**
**A.** Add to current plan (Phase 2.5)
**B.** Log for separate work (new key)
**C.** Ignore for now
**D.** Quick fix now (< 5 min)

**Recommended:** B (separate concern)
```

**For Unrelated Drift (Low):**
```markdown
## 🔄 Unrelated Issue

**Current work:** {current-key}
**Unrelated issue:** {drift-description}

**Logged as:** {new-key-suggestion}

**Action:** Continue current work, handle drift later?
**Reply:** Y/n
```

---

## Drift Logging

**Create drift record:**
- Parent key (original work)
- Drift key (new work identifier)
- Relationship (blocking, related, unrelated)
- Severity
- Timestamp
- User request

**Save to:**
- `.github/key-data-streams/{parent-key}/drift-log.md`
- Update index with drift relationship

---

## Stack Management

**Prevent stack corruption:**
- Max drift depth: 2 levels
- Track work stack: [key1] → [key2] → [key3-drift]
- Warn at depth 2
- Block at depth 3
- Force completion or abandon

**Recovery from corruption:**
- Show work stack
- Identify original work
- Offer to complete or abandon each level
- Return to top of stack

---

## See Also

- `../plan.prompt.md` - Drift handling
- `../drift.prompt.md` - Drift management agent
- `loop-prevention.md` - Prevent endless drift
