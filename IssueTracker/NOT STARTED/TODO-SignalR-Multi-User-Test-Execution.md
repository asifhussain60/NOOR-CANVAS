# TODO-104: SignalR Multi-User Test Execution

**Priority**: HIGH - Testing Infrastructure
**Category**: 🧪 TESTING
**Created**: September 17, 2025
**Estimated Time**: 2-3 hours

## Description
Complete the end-to-end SignalR multi-user testing that was initiated but not finished due to server connectivity issues.

## Background
- Created comprehensive SignalR test plan (6 phases, 12.5 hours total)
- Implemented SessionWaiting.razor with SignalR client wiring
- Created SignalRTestHarness.razor for visual testing
- Built console test client (Tools/SignalRTestClient) 
- Server intermittently shuts down, console client gets connection refused

## Tasks Required
1. **Stabilize Server Runtime**
   - Start server in foreground terminal and keep running
   - Verify listening on http://localhost:9090 and https://localhost:9091
   - Use netstat/Get-NetTCPConnection to confirm port binding

2. **Execute Console Test Client**
   - Run `dotnet run -- "https://localhost:9091/hub/session" "test-session" 3`
   - If HTTPS fails, try HTTP endpoint: `http://localhost:9090/hub/session`
   - Observe join/send/leave behavior across multiple connections

3. **Exercise Browser Harness**
   - Navigate to `/dev/signalr-harness` 
   - Spawn multiple simulated clients
   - Verify event logging and real-time updates

4. **Document Results**
   - Update SignalR-Multi-User-Test-Plan.MD with actual test results
   - Report any issues found during testing

## Files Involved
- `SPA/NoorCanvas/Pages/SessionWaiting.razor`
- `SPA/NoorCanvas/Pages/SignalRTestHarness.razor`
- `Tools/SignalRTestClient/Program.cs`
- `Workspaces/Documentation/TESTING/SignalR-Multi-User-Test-Plan.MD`

## Success Criteria
- Console test client successfully creates multiple HubConnections
- Browser harness shows real-time events across multiple clients
- No connection refused errors or server stability issues
- Test results documented and verified

## Notes
Previous attempts failed with "No connection could be made because the target machine actively refused it" - likely server timing or HTTPS certificate issues.