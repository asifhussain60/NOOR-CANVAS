# RESUME: Continue Work from Previous Chat

## Purpose
Resume work from a previous Copilot chat session. Reads session state and provides exact context to continue seamlessly.

## User Command
```
@workspace /resume
```

## How It Works
1. ✅ Reads `.github/sessions/current-session.json`
2. ✅ Shows session summary (feature, status, last task, next task)
3. ✅ Lists completed tasks with artifacts
4. ✅ Provides exact command to continue
5. ✅ Highlights blockers or open issues
6. ✅ Links to key context files

## Output Format

```
📊 Session Resume - {sessionId}

Feature: {feature name}
Branch: {git branch}
Status: {ACTIVE | PAUSED | BLOCKED}
Last Updated: {timestamp} ({relative time})

Phase: {currentPhase}

Completed Tasks:
✅ {taskId} - {description}
   Artifact: {file path}
✅ {taskId} - {description}
   Artifacts: {file paths}

Next Task:
🔄 {taskId} - {description}
   Duration: {estimatedDuration}
   Dependencies: {dependencies if any}
   Command: {suggestedCommand}

Context:
💡 Last Question: "{lastUserQuestion}"
🎯 Key Decisions:
   - {decision 1}
   - {decision 2}
⚠️ Open Issues: {count}
   - {issue 1}
🚫 Blockers: {count}
   - {blocker 1}

Context Files (Read These for Full Context):
📄 {contextFile1}
📄 {contextFile2}

Recent Commits:
- {commit 1}
- {commit 2}

═══════════════════════════════════════════════════════════

Ready to continue? Run:
{suggestedCommand}
```

## Example

```
User: @workspace /resume

Copilot:
📊 Session Resume - 2025-11-02-v4.3-guardrails

Feature: KDS v4.3 - Anti-Bloat Guardrails
Branch: features/fab-button
Status: ACTIVE
Last Updated: 2025-11-02T12:00:00Z (2 hours ago)

Phase: KDS Design Enhancement

Completed Tasks:
✅ v4.3-anti-patterns - Document anti-patterns from v2.1.0
   Artifact: .github/docs/KDS-ANTI-PATTERNS.md

✅ v4.3-guardrails - Implement publishing guardrails
   Artifacts:
   - .github/governance/rules.md (v4.3.0)
   - .github/prompts/shared/publish.md
   - .github/prompts/shared/mandatory-post-task.md
   - .github/KDS-DESIGN.md (v4.3.0)
   - .github/knowledge/README.md (v1.1)

Next Task:
🔄 v4.3-commit - Commit v4.3 changes to git
   Duration: 5 minutes
   Dependencies: Build validation passed
   Command: git add .github && git commit -m "feat(kds): v4.3 - Anti-bloat guardrails & health monitoring"

Context:
💡 Last Question: "Can you access these chat histories anytime? Is the KDS design architecture and infrastructure ready with tooling?"
🎯 Key Decisions:
   - Use git-based archival (.archived/) instead of status flags
   - Automated consolidation (Rule #16 Step 5)
   - Weekly + monthly health reports
   - Max 10 patterns per category, consolidation at 8
⚠️ Open Issues: 0
🚫 Blockers: 0

Context Files (Read These for Full Context):
📄 .github/KDS-DESIGN.md (v4.3.0 - SINGLE SOURCE OF TRUTH)
📄 .github/docs/KDS-ANTI-PATTERNS.md (8 anti-patterns documented)
📄 .github/docs/v4.3-implementation-summary.md (full implementation details)

Recent Commits:
- Updated KDS to v4.3.0 with anti-bloat guardrails

═══════════════════════════════════════════════════════════

Ready to continue? Run:
git add .github && git commit -m "feat(kds): v4.3 - Anti-bloat guardrails & health monitoring"
```

## When to Use

### ✅ Use /resume when:
- Starting a new chat session
- Returning to work after hours/days
- Multiple people working on same feature
- Lost context mid-task
- Want quick status update

### ❌ Don't use /resume when:
- Starting a completely new feature (use `/plan` instead)
- Just need to ask a question (use `@workspace I have a question about KDS:`)
- Current session is already loaded in chat

## Behind the Scenes

This prompt triggers:
1. **File Read**: `.github/sessions/current-session.json`
2. **Validation**: Check session status (ACTIVE vs PAUSED vs BLOCKED)
3. **Context Loading**: Read key files from `resumptionGuide.contextFiles`
4. **Git Check**: Verify branch matches session branch
5. **Format Output**: Generate user-friendly summary

## Error Handling

### No Current Session
```
❌ No Active Session Found

No work-in-progress session detected.

Start a new feature:
@workspace /plan "Your feature description"

Or check session history:
cat .github/sessions/session-history.json
```

### Session Blocked
```
⚠️ Session BLOCKED

Feature: {feature name}
Blocker: {blocker description}

Action Required:
1. Resolve blocker: {suggested resolution}
2. Update session status: {command}
3. Resume work: @workspace /resume
```

### Session Paused
```
⏸️ Session PAUSED

Feature: {feature name}
Paused: {reason}

Resume Options:
1. Continue work: @workspace /resume --force
2. Archive session: @workspace /govern key={sessionId} action=archive
3. Start new feature: @workspace /plan "New feature"
```

## Integration Points

- **Rule #16 Step 6**: Auto-updates session state after every task
- **ask-kds.md**: Can query session state via "What was I working on?"
- **plan.md**: Creates new session when planning feature
- **execute.md**: Updates session state after task execution
- **validate.md**: Checks if session matches current git branch

## Related Files

- **Sessions:** `.github/sessions/current-session.json` (auto-updated)
- **Schema:** `.github/schemas/sessions/session-state.json`
- **Archive:** `.github/sessions/session-history.json`
- **Guide:** `.github/sessions/resumption-guide.md` (human-readable)

---

**Last Updated**: 2025-11-02  
**Version**: 1.0  
**Depends On**: sessions/current-session.json, Rule #16 (auto-updates)

