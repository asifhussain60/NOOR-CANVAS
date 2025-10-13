# Requirements: canvascleanup

## Objective
Clean up the complex ContentBroadcasts system and rebuild SessionCanvas from scratch using the proven User-CanvasExperience_Mock.razor as the foundation.

## Problem Analysis
Based on the SignalR Working Implementation documentation, the current system has:
- **Complex Database Layer**: ContentBroadcasts table with full CRUD operations
- **Multiple Failure Points**: Database, API, SignalR, and HTML transformation layers
- **appendChild Errors**: Complex DOM manipulation causing JavaScript runtime errors
- **Application Instability**: Connection refused errors during testing
- **Performance Issues**: 200-500ms processing vs <50ms in working version

## Phase 1: Database and API Cleanup
### Remove ContentBroadcasts System
- [x] Drop ContentBroadcasts table from KSESSIONS_DEV database
- [x] Remove ContentBroadcastService class
- [x] Remove ContentBroadcast API endpoints
- [x] Remove ContentBroadcast entity/model classes
- [x] Clean up any related migrations or database references

## Phase 2: SessionCanvas Rebuild
### Start Fresh with Mock Foundation
- [x] Use User-CanvasExperience_Mock.razor as the base template
- [x] Implement clean single-column layout with vertical div stacking
- [x] Remove complex SignalR content reception system
- [x] Remove RenderTranscriptSafely() and appendChild prevention layers
- [x] Implement simple state management for shared content

### Key Design Principles
1. **Simple Structure**: Single-column vertical layout matching the mock
2. **Clean State Management**: Direct property binding without complex transformations
3. **Minimal DOM Manipulation**: Avoid appendChild operations that cause errors
4. **Session-Only Persistence**: Content exists only during session lifetime
5. **Performance First**: Sub-50ms response times for content updates

## Phase 3: Testing and Validation
### Test Requirements
- [x] SessionCanvas loads without errors
- [x] Single-column vertical layout displays correctly
- [x] Q&A functionality works with clean DOM structure
- [x] Participants list displays properly
- [x] No appendChild JavaScript errors in browser console
- [x] Application remains stable during extended testing

## Success Criteria
- ✅ ContentBroadcasts system completely removed
- ✅ SessionCanvas rebuilt from mock foundation
- ✅ Clean single-column layout implementation
- ✅ Zero appendChild errors
- ✅ Stable application performance
- ✅ Simplified codebase ready for future enhancements

## Implementation Notes
- Follow SelfAwareness instructions for proper launch (nc.ps1/ncb.ps1)
- Place test specs in `Workspaces/copilot/Tests/Playwright/canvascleanup/`
- Use `[DEBUG-WORKITEM:canvascleanup:impl]` tags for temporary diagnostics
- Implement Iterative Accumulation Policy for testing

## Dependencies
- User-CanvasExperience_Mock.razor (reference implementation)
- Current SessionCanvas.razor (for comparison and selective migration)
- KSESSIONS_DEV database access for cleanup
- SignalR Working Implementation documentation for guidance