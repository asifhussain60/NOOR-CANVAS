# Asset Share Task Plan

## Current Issues Analysis

### Task 1: Both Users Showing Same Name  
**Root Cause**: CurrentParticipantName assignment in SessionCanvas.razor:622 uses CurrentUserGuid to match ParticipantData.UserId, causing conflicts when multiple users share same session.

**Solution**: Fix user identification logic to use session-specific participant data properly.

### Task 2: Asset Broadcasting Wrong Event
**Root Cause**: HostControlPanel broadcasts via `PublishAssetContent` but SessionCanvas listens for `AssetContentReceived` - event name mismatch.

**Solution**: Align SignalR event handlers between sender and receiver.

## Execution Steps

1. Fix participant name display using proper user identification
2. Fix SignalR event handler mismatch for asset broadcasting  
3. Test both fixes with Playwright validation

## Files to Modify
- SessionCanvas.razor (participant name + SignalR handler)
- SessionHub.cs (verify SignalR method names)

## Expected Outcome
- Multiple SessionCanvas instances show different participant names
- Asset sharing broadcasts correctly from HostControlPanel to SessionCanvas