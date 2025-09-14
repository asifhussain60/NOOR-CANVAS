Workspaces/Global: Restore and enhance `nc.ps1` — session-aware Host GUID extraction and display

Summary:
- Restored and improved the `nc` global command to reliably support session-specific workflows.
- Added capture of `nct.ps1` output and extraction of the Host Session GUID into a global variable `$global:GeneratedHostGuid`.
- Display the Host GUID clearly and prominently in both session-specific and standard launches.
- Kept existing port conflict resolution, launchSettings update, and orphaned process cleanup logic intact.

Files changed:
- Workspaces/Global/nc.ps1

Key changes and rationale:
- Token capture: `nc.ps1` now runs `nct.ps1` and stores output in `$nctOutput` (via `Out-String`). This avoids losing the GUID printed by `nct` and enables programmatic extraction.
- GUID extraction: A robust GUID regex matches `Host GUID: <guid>` in the `nct` output and assigns it to `$global:GeneratedHostGuid` for later display.
- UX improvements: When a session ID is provided (e.g., `nc 213`), `nc` now:
  * Automatically continues without prompting.
  * Starts the application in background mode and clears the terminal for a clean readout.
  * Prints Session ID, Application URL (HTTPS), and the Host Session GUID in a high-visibility color block.
  * Presents explicit next steps including the exact Host GUID for authentication and participant sharing.
- Non-session flow: If a GUID exists (from a previous generation), the standard launch will display the GUID and instructions before starting the app.
- Logging and safety: Existing port checks, orphaned process cleanup, and `launchSettings.json` update remain unchanged to preserve safe startup behavior.

Notes:
- The change is intentionally minimal and backward-compatible: if `nct` does not print a GUID in the expected format, `nc` still proceeds but will prompt the user to look at `nct` output.
- Recommended follow-up: run `nct 213` or `nc 213` locally to verify GUID extraction and confirm the application starts as expected.

Signed-off-by: NOOR Canvas Automation
