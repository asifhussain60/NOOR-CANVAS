/plan key=session-canvas-share-button
user_request="Replace kebab menu with animated Share button and broadcast logic"

/phase-outline
1. Review SYSTEM-REGISTRY.md and UI component references for kebab menu removal [hcp:registry-review].
2. Delete all kebab menu code and UI fragments from Razor components [hcp:remove-kebab-menu].
3. Implement a new small round “Share” button (2x icon) with subtle background, 1px dark border, and shadow [hcp:share-button-ui].
4. Add hover animation for subtle interactive feedback [hcp:share-button-animation].
5. Reconnect click logic to existing SignalR broadcast flow using the old “Share Asset” behavior as a reference [hcp:signalr-share-broadcast].
6. Consult recent Git history to recover and adapt the deleted broadcast logic [hcp:git-history-restore].
7. Add structured debug and diagnostic logs before and after each broadcast event [hcp:debug-logging-share].
8. Update-StateRequest(feature="shareButton", phase="Implementation").
9. Validate component integration and UI updates with compile-time checks [hcp:compile-validation].
10. Handoff to test-generation.prompt.md for automated test creation [hcp:test-share-broadcast].
11. Generate Playwright test in headed mode for UI animation verification [hcp:test-ui-animation].
12. Generate headless test for backend SignalR connection validation [hcp:test-signalr-headless].
13. Update-StateRequest(feature="shareButton", phase="Testing").
14. On successful tests, trigger refactor.prompt.md with scope=current [hcp:refactor-scope-current].
15. Confirm-State("shareButton feature implemented and verified").
