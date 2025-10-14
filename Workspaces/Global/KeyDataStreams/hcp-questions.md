# Key Data Stream: hcp-questions
**Status**: in-progress  
**Created**: 2025-10-14T00:00:00Z  
**Last Updated**: 2025-10-14T00:00:00Z

## Objective
Make questions in HostControlPanel Q&A panel clickable to broadcast them as formatted assets to SessionCanvas participants with full SignalR traceability.

## Requirements
- [x] Make question cards clickable with hover animation (industry standards)
- [ ] Remove action buttons (approve/delete) before broadcasting
- [ ] Broadcast clicked question as formatted asset to SessionCanvas
- [ ] Apply modern styling to question asset display
- [ ] Add trace-level SignalR logging for broadcast/reception
- [ ] Create Playwright visual regression tests

## File Mappings
### Primary Files
- `SPA/NoorCanvas/Components/Host/QuestionCard.razor` - Question card component with click handler
- `SPA/NoorCanvas/Pages/HostControlPanel.razor` - Host control panel with SignalR
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` - Participant canvas view
- `SPA/NoorCanvas/Hubs/SessionHub.cs` - SignalR hub with ShareAsset method

### Supporting Files
- `SPA/NoorCanvas/wwwroot/css/host-control-panel.css` - Styling
- `SPA/NoorCanvas/wwwroot/css/session-transcript.css` - Canvas styling

## Changes Made
### Phase 1: Initial Analysis (2025-10-14T00:00:00Z)
- Reviewed QuestionCard.razor structure
- Identified ShareAsset SignalR method in SessionHub
- Confirmed AssetShared broadcast pattern

## Work Log
See: `Workspaces/Global/WorkLogs/hcp-questions/work-log.md`

## Tests Created
- None yet

## Git Commits
- None yet
