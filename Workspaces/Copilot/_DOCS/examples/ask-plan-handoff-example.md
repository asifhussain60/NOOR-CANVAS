# Ask → Plan Handoff Example

**Scenario**: User asks about missing functionality, decides to implement it

## Step 1: User Asks Question

```
User: @workspace /ask "Why is the share button missing from SessionCanvas?" 
      context="SPA/NoorCanvas/Pages/SessionCanvas.razor" 
      depth=diagnostic
```

## Step 2: Ask Agent Answers

```markdown
🧠 Copilot Analysis

- Question: Share button missing in SessionCanvas
- Context: SessionCanvas.razor
- Finding: ShareButton component not referenced in page
- Root Cause: Component exists in Components/ but not imported

📌 Summary for You

**Current State**:
1. ShareButton.razor exists at `SPA/NoorCanvas/Components/ShareButton.razor`
2. SessionCanvas.razor does NOT import or render ShareButton
3. Other pages (AssetCanvas.razor) DO use ShareButton successfully

**Why Missing**:
- No `@using` directive for Components namespace
- No `<ShareButton />` tag in SessionCanvas markup
- Likely removed during refactoring or never added

**Quick Fix**:
- Add: `@using NoorCanvas.Components`
- Add: `<ShareButton SessionId="@SessionId" />` in toolbar section

## What would you like to do next?

**A.** Turn this into a plan of action  
**B.** Ask a follow-up question  
**C.** Implement immediately (skip planning)  
**D.** Nothing, I'm all set
```

## Step 3: User Selects Plan Option

```
User: A
```

## Step 4: Ask Agent Hands Off to Plan

```markdown
✓ Extracting actionable work from answer...
✓ Generating suggested key: session-canvas-share-button
✓ Preparing handoff to plan agent...

Invoking: @workspace /plan key:session-canvas-share-button 
          user_request="Add share button to SessionCanvas component"
          context="SessionCanvas.razor - missing ShareButton component reference"
```

## Step 5: Plan Agent Takes Over

```markdown
🧠 Copilot Analysis

- Key: session-canvas-share-button (validated, no spelling errors)
- Routing: ask.prompt.md → plan.prompt.md
- Context: Answer provided by ask agent
- Phases: 2 planned

## Plan Draft v1.0

**Key**: `session-canvas-share-button`
**Branch**: `development`

### Assumptions Validated
- @workspace: ShareButton.razor exists in Components/
- @workspace: SessionCanvas.razor missing ShareButton reference
- @workspace: AssetCanvas.razor has working ShareButton implementation

### Phases

1. **Add ShareButton Component** - Import and render ShareButton in SessionCanvas
2. **Validate & Test** - E2E test for share button functionality

### Recommended Enhancements

**High Priority:**
- A. Add Percy visual test for share button states (Low effort)
- B. Add error handling for share failures (Medium effort)

**Medium Priority:**
- C. Add share analytics tracking (Low effort)

**Selection**: Which enhancements? (e.g., "A,B", "ALL", or "none")

### Open Questions

None - all information gathered from ask agent analysis

---

**CONCISE** - Ready to proceed
**COMPLETE DETAILS** - Will be written to plan files
```

## Step 6: User Approves Plan

```
User: A,B (select enhancements)
```

## Step 7: Plan Regenerated Holistically

```markdown
Plan updated with enhancements integrated into phases.

✓ Phase 1 now includes Percy visual tests
✓ Phase 2 now includes error handling
✓ Files written to .github/key-data-streams/session-canvas-share-button/

Ready to execute:
  .github/key-data-streams/session-canvas-share-button/execute-plan.ps1
```

## Benefits of This Workflow

✅ **Seamless Transition**: Question → Understanding → Planning → Execution
✅ **Context Preservation**: Answer insights flow into plan context
✅ **No Duplicate Work**: Ask agent findings inform plan assumptions
✅ **User Control**: Can ask questions without commitment, decide later
✅ **Intelligent Key Generation**: Automatic key extraction from question context

## Traditional Workflow (Before)

```
User: @workspace /ask "Why is share button missing?"
Agent: [Provides answer]
User: [Manually copies answer details]
User: @workspace /plan key:something user_request="Add share button..."
Agent: [Starts from scratch, re-discovers same information]
```

## New Workflow (After)

```
User: @workspace /ask "Why is share button missing?"
Agent: [Provides answer] "A) Turn into plan?"
User: A
Agent: [Auto-extracts work, generates key, hands off with context]
Plan Agent: [Loads ask agent findings, builds on existing knowledge]
```

**Time Saved**: ~5-10 minutes per question-to-implementation cycle
**Context Lost**: Zero (vs. manual copy-paste risk)
**User Friction**: Minimal (one letter response: "A")
