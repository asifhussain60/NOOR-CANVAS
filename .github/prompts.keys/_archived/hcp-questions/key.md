# Key: hcp-questions

**Status:** in-progress  
**Created:** 2025-01-14  
**Last Updated:** 2025-01-14

---

## Purpose
Improve Q&A panel functionality and styling on Host Control Panel:
1. Fix question duplication issues (SignalR broadcast)
2. Add checkbox functionality with participant notifications
3. Add delete button with participant notifications
4. Apply modern green theme styling from design mockup

---

## Work Summary

### Phase 1: Bug Fixes (Completed)
**Issue #1: Question Duplication**
- Removed `HostQuestionAlert` event handler from HostControlPanel
- Added duplicate check to `QuestionReceived` handler
- Result: Questions now appear only once

**Issue #2: Checkbox Not Removing Questions**
- Updated `MarkQuestionAnswered` to remove question and broadcast via SignalR
- Created `BroadcastQuestionAnswered` hub method
- Added toast notification for original asker
- Result: Checkbox now removes question from all participants

**Issue #3: Delete Button Not Broadcasting**
- Modified `QuestionDeleted` broadcast to include `originalAskerGuid`
- Updated SessionCanvas handler to show toast
- Result: Delete now notifies original asker with informative message

### Phase 2: Styling (Completed)
**Green Theme Application**
- Extracted styling from ContextCopilot.txt mockup
- Applied green theme to QuestionCard component:
  - Question text: dark green (#006400)
  - Card border: 2px gray with 6px right green accent (#006400)
  - Author badge: light gray background (#E5E7EB) with dark gray text (#4B5563)
  - Approve button: emerald green (#34D399) → hover (#10B981)
  - Delete button: red (#F87171) → hover (#EF4444)
  - Upvote badge: red circle (#DC2626) with white text
- Updated Q&A panel header to match theme

---

## Files Modified

| File | Changes | Commit |
|------|---------|--------|
| `HostControlPanel.razor` | Removed HostQuestionAlert handler, updated MarkQuestionAnswered | 33cff83d |
| `SessionHub.cs` | Added BroadcastQuestionAnswered method | 33cff83d |
| `SessionCanvas.razor` | Added QuestionAnswered handler, updated QuestionDeleted handler | 33cff83d |
| `QuestionController.cs` | Added OriginalAskerGuid to QuestionDeleted broadcast | 33cff83d |
| `QuestionCard.razor` | Applied green theme styling, added VoteCount support | f5e02609 |
| `HostControlPanelContent.razor` | Updated Q&A header styling, passed VoteCount to QuestionCard | f5e02609 |

---

## Changes Made

### Bug Fixes
1. **Question Duplication Fix**
   - File: `HostControlPanel.razor` (lines 210-350)
   - Change: Removed `HostQuestionAlert` handler, added duplicate check
   - Reason: Both handlers were adding same question to UI

2. **Checkbox Broadcast Fix**
   - Files: `HostControlPanel.razor`, `SessionHub.cs`, `SessionCanvas.razor`
   - Change: Added complete SignalR flow for question answered
   - Reason: Checkbox only updated local UI, didn't notify participants

3. **Delete Broadcast Fix**
   - Files: `QuestionController.cs`, `SessionCanvas.razor`
   - Change: Added `originalAskerGuid` to broadcast payload
   - Reason: Participants weren't notified of question deletion

### Styling Updates
4. **Green Theme Application**
   - Files: `QuestionCard.razor`, `HostControlPanelContent.razor`
   - Change: Applied green color scheme from ContextCopilot.txt
   - Reason: Match design mockup with modern green aesthetic

---

## Tests Required

- [ ] **Functional E2E Test**: Question submission and duplicate prevention
- [ ] **Functional E2E Test**: Checkbox removes question from all participants
- [ ] **Functional E2E Test**: Delete button notifies original asker
- [ ] **Visual Regression Test**: Green theme styling matches mockup

---

## Execution Tracking

### Commits
- `33cff83d` - checkpoint: pre-task hcp-questions
- `f5e02609` - feat(hcp-questions): Apply green theme styling from ContextCopilot.txt to Q&A panel

### Build Status
✅ Build succeeded (25.4s)
✅ No compilation errors
✅ No warnings

---

## File Mappings

- **UI Components**:
  - `SPA/NoorCanvas/Pages/HostControlPanel.razor` - Host control panel page
  - `SPA/NoorCanvas/Components/Host/HostControlPanelContent.razor` - Main content area
  - `SPA/NoorCanvas/Components/Host/QuestionCard.razor` - Individual question card component
  - `SPA/NoorCanvas/Pages/SessionCanvas.razor` - Participant view

- **Backend**:
  - `SPA/NoorCanvas/Hubs/SessionHub.cs` - SignalR hub for real-time broadcasts
  - `SPA/NoorCanvas/Controllers/QuestionController.cs` - Question API endpoints

- **ViewModels**:
  - `SPA/NoorCanvas/ViewModels/HostControlPanelViewModel.cs` - Question data models

- **Documentation**:
  - `.github/prompts.keys/hcp-questions/analysis.md` - Technical analysis
  - `.github/prompts.keys/hcp-questions/implementation-summary.md` - Complete implementation guide

- **Design Reference**:
  - `Workspaces/Data/ContextCopilot.txt` - Green theme mockup (HTML)

---

## Next Steps

1. ✅ Apply green theme styling (COMPLETED)
2. Generate Playwright tests for:
   - Question submission flow
   - Checkbox functionality with multi-browser sync
   - Delete button with toast notifications
3. Generate Percy visual regression test for green theme
4. Run tests and validate behavior
5. Clean up debug logging markers
6. Mark key complete

---

## Notes

- Debug logging uses `[DEBUG-WORKITEM:hcp-questions:*]` markers with `;CLEANUP_OK` suffix
- Toast notifications only shown to original question asker (UserGuid matching)
- VoteCount property added for future upvote feature (conditionally shown if > 0)
- Green theme colors match NOOR Canvas brand identity
