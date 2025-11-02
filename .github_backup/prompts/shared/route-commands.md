# route.prompt.md - Commands Reference

This file contains all bash/PowerShell command examples extracted from `route.prompt.md` for Rule #1 compliance (no code blocks in user-facing sections).

---

## Command 1: Simple Invocation Examples (Bash)

**Source:** Quick Start section

**Purpose:** Simplest route invocation patterns with intelligent auto-routing

```bash
@workspace /route "your request here"
# Single task → routes to 'todo' (auto-approved)
# Multiple tasks → routes to 'plan' (requires approval)
```

**Usage Context:**
- Omit target parameter to enable intelligent routing
- Auto-detects: single task → todo, multiple → plan
- Auto-approves todo, requires approval for plan

**References:**
- Task Detection: `.github/prompts/shared/task-detector.md`
- Routing Logic: route.prompt.md Step 1.5

---

## Command 2: Explicit Target Routing (Bash)

**Source:** Quick Start section

**Purpose:** Route to specific target agent

```bash
@workspace /route plan "your request here"
@workspace /route task "your request here"
@workspace /route ask "your question here"
```

**Usage Context:**
- Use when you know the target agent
- Valid targets: plan, task, todo, test, ask, healthcheck, drift, cohesion, test-prep
- Bypasses intelligent routing logic

---

## Command 3: Auto-Execute Mode (Bash)

**Source:** Quick Start section

**Purpose:** Build prompt and immediately invoke target agent

```bash
@workspace /route plan auto-execute=true "your request here"
```

**Usage Context:**
- `auto-execute=true`: Immediate handoff after prompt construction
- `auto-execute=false` (default): Show built prompt for review first
- Plan prompt always pauses for approval (overrides auto-execute)

---

## Command 4: State Tracking Initialization (PowerShell)

**Source:** Step -2: Initialize State Tracking

**Purpose:** Load state-tracker utility and log original request

```powershell
# Source the state-tracker utility
. .github/prompts/shared/state-tracker.ps1

# Log the original user request
Update-StateRequest -Key $key -Type "original" -UserRequest $request -PromptChain @("route")
```

**Usage Context:**
- Execute FIRST before any routing analysis
- Type "original" indicates entry point (not routed from another agent)
- Key determined in Step 4, logged retroactively

**References:**
- State Tracker: `.github/prompts/shared/state-tracker.ps1`

---

## Command 5: Handoff Logging (PowerShell)

**Source:** Step 6.5: Automatic Handoff Mechanism

**Purpose:** Log handoff to state tracking before invoking target agent

```powershell
Update-StateHandoff -Key $key -From "route" -To $target -Parameters @{ key = $key; auto_execute = $autoExecute } -Reason "Routing based on work classification"
```

**Usage Context:**
- Execute before loading target agent prompt file
- Records handoff chain for timeline reconstruction
- Enables cross-prompt coordination tracking

**References:**
- Handoff Protocol: `.github/prompts/shared/handoff-protocol.md`
- State Tracker: `.github/prompts/shared/state-tracker.ps1`

---
