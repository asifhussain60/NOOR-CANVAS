# CONCISE OUTPUT MANDATE (GLOBAL)

**ALL prompts MUST follow this for USER-FACING output. NO exceptions.**

## Hard Limits
- MAX 25 bullets total per response (increased from 15 for clarity)
- MAX 2 lines per bullet (allows brief explanations)
- **NO implementation code in chat** (C#, JavaScript, HTML, CSS, Razor, SQL, TypeScript)
- **ALLOWED: File paths, method names, architectural descriptions, step summaries**
- NO nested lists (keep flat structure)
- NO long paragraphs (use bullets)

## What Code Means

**❌ PROHIBITED (Implementation Code):**
```csharp
// DO NOT show in chat
public void ShareAsset(string shareId) {
    hubConnection.InvokeAsync("ShareAsset", shareId);
}
```

**✅ ALLOWED (Architectural Description):**
```
Step 3: Update SignalR Integration
- File: SessionHub.cs, method ShareAsset(string shareId)
- Change: Add assetType parameter to broadcast payload
- Flow: HostControlPanel → SessionHub.ShareAsset → Broadcast to session_{id} group
- Client: Participants receive AssetShared event in TranscriptCanvas.razor
```

**✅ ALLOWED (File References):**
```
Files Modified:
1. AssetProcessingService.cs (lines 361-394)
   - Added CreateShareButtonHtml method
   - Returns blue gradient bar HTML with Share Asset button
2. SessionHub.cs (line 142)
   - Modified ShareAsset method signature
```

**✅ ALLOWED (Configuration/JSON for settings):**
```json
{
  "key": "hcp-fab-button",
  "status": "in-progress"
}
```

## Where Code Details Go

**All implementation code → `{key}.plan.md` or `{key}/work-log.md`:**
- Complete method implementations
- HTML structure examples
- CSS styling details
- SQL queries
- JavaScript functions

**User-facing output → Architectural summaries:**
- What files changed
- What methods were added/modified
- Data flow descriptions
- High-level algorithm steps

## Response Structure

```
🧠 Analysis (≤8 bullets, 2 lines each)
- Key: {key}
- Routing: {prompts-used}
- Complexity: {simple|moderate|complex}
- Layers: {UI, API, Database, SignalR}
- Context: {visual|error|file} packages
- Assumptions: {1-2 brief assumptions}

📌 Summary (≤15 bullets, 2 lines each)
1. Key: {key} | Status: {status}
2. Work: {one-liner description}
3. Files: {count} modified ({file-list})
4. {architecture-description-bullets}
5. Testing: {manual|automated|percy} - {results}
6. Next: See options below

📋 Tasks (≤8 bullets when showing task breakdown)
- Task 1: {description}
- Task 2: {description}
- Dependencies: {task-relationships}

📊 Final (≤5 bullets)
- Status: {status}
- Key: {key}
- Documentation: {key}.plan.md updated
- Next: {primary-action}
- Options: See below
```

## Letter-Based Actions
Always provide 2-4 options:
- **A.** Execute / Proceed
- **B.** Review Plan / Details
- **C.** Modify Approach
- **D.** Cancel / Skip

User replies: "A", "A, C", or "all"

## File Locations
All output → `Workspaces/Copilot/_DOCS/` or `.github/key-data-streams/{key}/`
NEVER → Chat responses

## Step Descriptions (ALLOWED)

**When describing execution steps, use architectural descriptions:**
```
Step 4: Update Asset Processing Service
- File: AssetProcessingService.cs (line 384)
- Add: CreateShareButtonHtml method
- Purpose: Generate blue action bar with Share Asset button
- Returns: HTML string with ks-share-button class for SignalR
- Integration: Called by CreateAssetContainerHeaderHtml before wrapper
```

**NOT this (shows implementation code):**
```
Step 4: Update Asset Processing Service
private static string CreateShareButtonHtml(...) {
    return $@"<div class='action-wrapper'>...</div>";
}
```

## Enforcement
Before responding:
1. Count bullets → Must be ≤25
2. Check for ```csharp, ```javascript, ```html, ```css blocks → REMOVE
3. Verify architectural descriptions only → File paths, method names, flow diagrams
4. Ensure {key}.plan.md reference present → "See {key}.plan.md for implementation details"
5. If violations → Block response or auto-fix

## Special Cases

**Configuration files (appsettings.json, package.json):**
- ✅ ALLOWED to show JSON snippets for settings
- Keep brief (≤10 lines)
- Mark as configuration, not implementation

**Git commands, PowerShell scripts:**
- ✅ ALLOWED for operational commands
- Show exact commands to run
- Keep concise

**Error messages, stack traces:**
- ✅ ALLOWED for debugging context
- Truncate if >20 lines
- Focus on relevant portions
