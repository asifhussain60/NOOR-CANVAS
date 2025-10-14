# hcp-question

**Key Type:** Feature Implementation
**Status:** Complete
**Created:** 2025-10-14
**Last Updated:** 2025-10-14

## Overview
Apply orange/sienna styling from ContextCopilot.txt to broadcasted question cards when host clicks questions in HostControlPanel. Includes Percy visual regression testing.

## Work Log

### 2025-10-14 - Initial Implementation
**Commit:** `1bcbc5c3b57cee8a34de49f4c31c1d8b46ddc7df`
**Agent:** task
**Status:** Complete

**Changes:**
1. Updated `ShareQuestionAsset` method in HostControlPanel.razor
   - Replaced green theme (#006400, #F0FDF4) with orange theme
   - Applied ContextCopilot.txt styling:
     - Background: `#fff7f5` (orange-50)
     - Border: `#fdba74` (orange-300) with 2px top/left, 4px right/bottom
     - Icon: `#f97316` (orange-500) in `#ffedd5` circle
     - Title: `#c2410c` (orange-700)
     - Subtitle: `#f97316` (orange-500)
     - Content box: white with `#7c2d12` text
   - Changed icon from `fa-clipboard-question` to `fa-question-circle`
   - Preserved vote badge and metadata footer
   - Added theme metadata to asset payload for debugging

2. Created Percy visual regression tests
   - File: `Workspaces/TEMP/hcp-question-orange-styling.spec.ts`
   - 3 test cases:
     - Standard question card rendering
     - Long question (>100 chars) rendering
     - Vote badge preservation
   - Percy snapshots at 1280px and 1920px widths
   - Hides dynamic elements (SignalR status, session description)

3. Created orchestration script
   - File: `Scripts/run-hcp-question-percy-tests.ps1`
   - Launches NoorCanvas app in separate PowerShell window
   - Waits for app initialization (15 seconds + verification)
   - Runs Percy tests with headed browser
   - Auto-cleanup or keep-alive mode
   - Comprehensive debug logging

4. Added NPM scripts
   - `test:hcp-question-percy`: Run tests and cleanup
   - `test:hcp-question-percy-keep`: Run tests, keep app running

**Debug Logging:** Trace level
- All log messages tagged with `[DEBUG-WORKITEM:hcp-question:orange-styling:TRACE]`
- Includes styling metadata, broadcast tracking, visual verification

**Files Modified:**
- `SPA/NoorCanvas/Pages/HostControlPanel.razor`
- `Workspaces/TEMP/hcp-question-orange-styling.spec.ts` (new)
- `Scripts/run-hcp-question-percy-tests.ps1` (new)
- `package.json`

**Validation:**
- Build: ✅ Clean (0 errors, 0 warnings)
- Tests: 3 Percy visual regression tests created
- Test Discovery: ✅ All tests discoverable via `npx playwright test --list`

## Styling Reference

**Source:** `Workspaces/Data/ContextCopilot.txt`

**Orange Theme Colors:**
- `#fff7f5` - Background (orange-50)
- `#fdba74` - Border (orange-300)
- `#ffedd5` - Icon circle background (orange-100)
- `#f97316` - Icon color, subtitle (orange-500)
- `#c2410c` - Title (orange-700)
- `#7c2d12` - Question text (orange-900)
- `#fed7aa` - Footer border (orange-200)

**Border Styling:**
- Top: 2px solid
- Left: 2px solid
- Right: 4px solid
- Bottom: 4px solid
- Radius: 1.5rem

**Layout:**
- Icon circle: 3rem × 3rem, rounded-full
- Padding: 2rem
- Margin: 1.5rem 0
- Icon size: 1.875rem

## Testing

**Run Percy Tests:**
```bash
npm run test:hcp-question-percy          # Run and auto-cleanup
npm run test:hcp-question-percy-keep     # Keep app running for manual verification
```

**Direct PowerShell:**
```powershell
.\Scripts\run-hcp-question-percy-tests.ps1
.\Scripts\run-hcp-question-percy-tests.ps1 -KeepAppRunning
```

**Test Configuration:**
- Session: 212 (KJAHA99L user / PQ9N5YWW host)
- Base URL: https://localhost:7101
- App startup wait: 15 seconds + health check
- SignalR connection wait: 2 seconds
- Question render wait: 1.5 seconds

**Percy Snapshots:**
- "HCP Question Orange Card - SessionCanvas View"
- "HCP Question Orange Card - Long Question"
- "HCP Question Orange Card - With Vote Badge"

## Architecture

**Data Flow:**
1. Host clicks question in HostControlPanel
2. `ShareQuestionAsset` formats HTML with orange theme
3. Asset broadcasted via SignalR to `session_{sessionId}` group
4. SessionCanvas receives via `ReceiveSharedAsset` handler
5. HTML rendered in `.canvas-asset-content` div

**SignalR Hub Methods:**
- `ShareAsset(sessionId, assetData)` - Broadcasts question
- `ReceiveSharedAsset(assetData)` - Receives in SessionCanvas

**Asset Payload:**
```json
{
  "shareId": "guid",
  "assetType": "question",
  "htmlContent": "<div style='background-color:#fff7f5'>...</div>",
  "metadata": {
    "questionId": "guid",
    "questionText": "string",
    "userName": "string",
    "voteCount": 0,
    "sharedAt": "datetime",
    "theme": "orange",
    "styleSource": "ContextCopilot.txt"
  }
}
```

## Related Keys
- `hcp-questions` - Original question broadcasting implementation
- `canvas-sharing` - Asset sharing infrastructure
- `hostcontrolpanel` - Host control panel features

## Next Steps
- [ ] Run Percy tests to generate baseline snapshots
- [ ] Review Percy dashboard for visual approval
- [ ] Update ContextCopilot.txt if additional styling variations needed
- [ ] Consider extracting orange theme to CSS class for reusability

## Notes
- Orange theme matches ContextCopilot.txt design specification exactly
- Vote badge preserved from original green theme implementation
- Percy tests use headed mode for accurate visual rendering
- Orchestration script ensures proper app initialization before testing
- All styling inline for self-contained HTML broadcasting
