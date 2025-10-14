# Key Data Stream: hcp-questions
**Status**: in-progress  
**Created**: 2025-10-14T00:00:00Z  
**Last Updated**: 2025-10-14T00:15:00Z

## Objective
Make questions in HostControlPanel Q&A panel clickable to broadcast them as formatted assets to SessionCanvas participants with full SignalR traceability.

## Requirements
- [x] Make question cards clickable with hover animation (industry standards)
- [x] Remove action buttons (approve/delete) before broadcasting
- [x] Broadcast clicked question as formatted asset to SessionCanvas
- [x] Apply modern styling to question asset display
- [x] Add trace-level SignalR logging for broadcast/reception
- [x] Create Playwright visual regression tests

## File Mappings
### Primary Files
- `SPA/NoorCanvas/Components/Host/QuestionCard.razor` - Question card component with click handler
- `SPA/NoorCanvas/Pages/HostControlPanel.razor` - Host control panel with SignalR
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` - Participant canvas view
- `SPA/NoorCanvas/Hubs/SessionHub.cs` - SignalR hub with ShareAsset method

### Supporting Files
- `SPA/NoorCanvas/Components/Host/HostControlPanelContent.razor` - Q&A panel wrapper
- `SPA/NoorCanvas/wwwroot/css/host-control-panel.css` - Hover animation styling
- `SPA/NoorCanvas/wwwroot/css/session-transcript.css` - Canvas styling

## Changes Made
### Phase 1: Clickable Question Implementation (2025-10-14T00:15:00Z)
**Commit**: b784c9c71ff2f234b5a0d54c5cfe7106910a8d95

#### QuestionCard.razor
- Added `@onclick` handler to entire card div
- Added `@onmouseover` and `@onmouseout` for hover state
- Added `OnQuestionClick` EventCallback parameter
- Implemented `HandleQuestionClick`, `HandleApproveClick`, `HandleDeleteClick` methods
- Added `stopPropagation` to button clicks to prevent card click

#### HostControlPanel.razor
- Added `ShareQuestionAsset` method with trace logging
- Formats question HTML with modern styling (green theme, icon, metadata)
- Removes action buttons before broadcasting
- Broadcasts via SignalR using `ShareAsset` hub method
- Logs broadcast flow with unique broadcastId for tracking

#### SessionCanvas.razor
- Added `AssetShared` SignalR event handler
- Extracts `htmlContent` from asset payload
- Displays question in `Model.SharedAssetContent`
- Logs reception with latency tracking

#### host-control-panel.css
- Added `.question-card-hover` class with scale and shadow animation

## Work Log
See: `Workspaces/Global/WorkLogs/hcp-questions/work-log.md`

## Tests Created
- `Workspaces/TEMP/hcp-questions-clickable-broadcast.spec.ts` - E2E visual regression test

### Test Coverage
- Question card hover animation CSS verification
- Click broadcast from HostControlPanel to SessionCanvas
- Green theme formatting validation
- Action button removal verification
- Metadata footer display (author, vote count)
- SignalR trace logging capture
- Event propagation stop on buttons

## Git Commits
- `b784c9c71ff2f234b5a0d54c5cfe7106910a8d95` - Clickable question implementation
- `c053a884cde4c6e42f538e48243cb538d20c9cbf` - Playwright E2E visual regression test
