# SessionCanvas Implementation Guide

**Status:** Recreating from scratch based on User-CanvasExperience_Mock.razor  
**Date:** September 25, 2025  

## Overview

This file is being cleared to start fresh with the new SessionCanvas implementation based on the mock design.

The new implementation will include:
- Modern golden color scheme UI
- Q&A functionality with real-time updates
- Tabbed sidebar (Q&A and Participants) 
- Real API integration
- Inline styling
- SignalR integration for real-time features

---

*Implementation in progress...*

----

## Important conventions (project-wide)
- User token: friendly 8-character token (example: `PX8RBFK4`). Use this token for participant APIs and Q&A from participants.
- Host token: longer GUID/36-char token used by hosts for admin APIs and host group membership.
- SignalR group naming conventions (canonical):
	- session_{sessionId}  → session-level group (lowercase `session_` prefix). All session participants join this.
	- Host_{sessionId}     → host-specific group for host to receive admin alerts/toasts.
	- usertoken_{userToken}→ token-specific groups for participant sync and wait-room scoping.

Note: Historically some code used `Session_{id}` vs `session_{id}`. Use `session_{id}` for joining/broadcasting; the server hubs handle these names consistently in the codebase.

----

## SignalR Hubs / Methods / Events

Two hubs are relevant: `SessionHub` (primary) and `QAHub` (Q&A legacy/alternate). The client implements handlers for the events below.

SessionHub (server-side path): mapped to `/hub/session` (verify your Startup/Program mapping). Key methods and events:

- Client -> Hub methods to call (client will call these after connection):
	- JoinSession(long sessionId, string role = "user") — add connection to `session_{sessionId}` group; role can be `user` or `host`.
	- JoinHostGroup(string sessionId) — host must call this to join `Host_{sessionId}` group.
	- JoinGroup(string groupName) — generic group join (used for `usertoken_{token}` grouping).
	- LeaveGroup(string groupName) / LeaveSession(long sessionId) — leave groups.

- Hub -> Client events to register (server sends these):
	- UserJoined { connectionId, role, timestamp }
	- UserLeft { connectionId, timestamp }
	- AssetShared { sessionId, asset, sharedBy, timestamp } — contains `asset` object from host; used to render shared material in main canvas.
	- ParticipantJoined { sessionId, participantId, displayName, country, joinedAt, timestamp, userToken }
	- ParticipantLeft { sessionId, participantId, displayName, leftAt, timestamp }
	- SessionBegan { sessionId, sessionData, startedAt, timestamp }
	- SessionEnded { sessionId, reason, endedAt, timestamp }
	- QuestionReceived (questionData) — a new question broadcast to participants (QuestionController also uses this name).
	- HostQuestionAlert (questionData) — special alert for host clients (also used by QuestionController).
	- QuestionVoteUpdate / QuestionVoteUpdated / QuestionVoteUpdate (voteData) — vote updates (note slight name variants exist in code: client should register `QuestionVoteUpdate` and `QuestionVoteUpdated` as defensive approach).
	- QuestionAnswered { questionId, sessionId }
	- QuestionDeleted { QuestionId, SessionId }

QAHub (alternate hub used in some flows):
- Methods: JoinQASession(long sessionId), AskQuestion(long sessionId, string questionText, Guid userId), Vote(long questionId, Guid userId, int voteValue)
- Events broadcast: QuestionQueued, QuestionSubmitted, QuestionVoteUpdated, VoteSubmitted

Implementation note: prefer `SessionHub` for SessionCanvas (server code references `SessionHub` and `IHubContext<SessionHub>` in controllers). If you use QAHub, keep names mapped correctly.

----

## REST API endpoints used by SessionCanvas

These endpoints are implemented in `ParticipantController` and `QuestionController`.

1) Validate participant token (initial load)
	 - GET /api/participant/session/{token}/validate
	 - Use: participant (user) token (8 chars). Returns session metadata, StartTime, ParticipantCount and a `Session` object payload.
	 - Response (excerpt): { Valid:true, SessionId: 215, Token: "PX8RBFK4", Session: { SessionId, Title, StartTime, Duration, ... }, Participant: { JoinUrl, AccessCount }, RequestId }

2) Load participants for a token
	 - GET /api/participant/session/{token}/participants
	 - Use: user token (8 chars). Returns participant list filtered by `UserToken`.
	 - Response: { SessionId, Token, ParticipantCount, Participants: [ { UserId, DisplayName, Country, CountryFlag, JoinedAt } ], RequestId }

3) Get UserGuid for Q&A
	 - GET /api/participant/session/{token}/user-guid
	 - Use: user token (8 chars).
	 - Response: { UserGuid: "GUID-STRING", RequestId }

4) Register participant (waiting room)
	 - POST /api/participant/register-with-token
	 - Body: { token: "<8-char>", name, email, country }
	 - Response: { success:true, sessionId, waitingRoomUrl, requestId }

5) Submit question (participant)
	 - POST /api/question/submit
	 - Body: SubmitQuestionRequest { SessionToken (8 chars), QuestionText, UserGuid }
	 - Response: SubmitQuestionResponse { Success, QuestionId (GUID), Message, RequestId }

6) Get questions for a session
	 - GET /api/question/session/{sessionToken}
	 - Use: user token (8 chars). Response: { Success, Questions: [ { QuestionId, Text, UserName, CreatedBy, Votes, IsAnswered, CreatedAt } ], Count, RequestId }

7) Vote on a question
	 - POST /api/question/{questionId}/vote
	 - Body: VoteQuestionRequest { SessionToken (8 chars), Direction = "up"|"down", UserGuid }
	 - Response: { Success, NewVoteCount, RequestId }

8) Delete question (owner)
	 - POST /api/question/{questionId}/delete
	 - Body: DeleteQuestionRequest { SessionToken (8 chars), UserGuid }
	 - Response: DeleteQuestionResponse { Success, Message, RequestId }

9) (Host-only) Delete all participants for a user token
	 - DELETE /api/participant/session/{userToken}/participants
	 - Use: host flows when opening a session; userToken is 8-char friendly token

Important: token format validation is strict — user tokens must be 8 characters. Controllers call `SimplifiedTokenService.ValidateTokenAsync(token, isHostToken:false)` to validate user tokens.

----

## Token responsibilities (who uses which token)

- Participant / user flows: use the 8-character UserToken (`SessionToken` param in the client). This is used for:
	- Validating access: GET /api/participant/session/{token}/validate
	- Listing participants: GET /api/participant/session/{token}/participants
	- Q&A operations: POST /api/question/submit, GET /api/question/session/{token}, vote/delete endpoints
	- SignalR token group naming for syncing: `usertoken_{UserToken}`

- Host flows: use HostToken (GUID) for admin endpoints and to join `Host_{sessionId}` group (hosts call `JoinHostGroup`). Host-side code may use tokenService.ValidateTokenAsync(token, isHostToken:true).

Security note: never hardcode real tokens in code or tests. Use staging/dev tokens in test harness or mocks (Playwright tests use test fixtures). Keep `KSESSIONS_DEV` read-only in dev workflows per repo instructions.

----

## Client ViewModel (contracts to implement in `@code`)

Implement these classes (exact field names matter to match JSON in controllers):

SessionCanvasViewModel
- LogoText: string?
- CurrentState: SessionCanvasState (Loading | Loaded | SessionNotFound)
- SessionName: string?
- SessionDate: string?
- StartTime: string?
- ParticipantCount: int
- Participants: List<ParticipantData>
- Questions: List<QuestionData> (recommended)
- ErrorMessage: string?

ParticipantData
- Name: string
- Country: string
- Flag: string

QuestionData
- QuestionId: string (controllers return string/GUIDs)
- Text: string
- Votes: int
- CreatedAt: DateTime
- CreatedBy: string
- UserName: string
- IsAnswered: bool
- HasUserVoted: bool (client-side state)

Other server-side shapes are available and can be deserialized dynamically, but these are sufficient for view rendering and actions.

----

## Client initialization sequence (recommended, safe order)

1. OnInitializedAsync -> seed Model with Loading state (logo text, placeholders).
2. Validate SessionToken (from route param)
	 - If no token, navigate home.
	 - Call GET /api/participant/session/{token}/validate using `NoorCanvasApi` HttpClient.
	 - On success: Update Model fields, set _sessionId = response.Session.SessionId, sessionStartTime = response.Session.StartTime.
3. LoadUserGuid (GET /api/participant/session/{token}/user-guid) — store as _userGuid for Q&A operations.
4. Load participants (GET /api/participant/session/{token}/participants) and map to ParticipantData; set Model.ParticipantCount.
5. Load questions (GET /api/question/session/{token}) into Model.Questions.
6. Connect to SignalR Hub:
	 - Build HubConnection:
		 HubConnection = new HubConnectionBuilder()
				 .WithUrl(Navigation.ToAbsoluteUri("/hub/session"))
				 .Build();
	 - Register handlers: QuestionReceived, HostQuestionAlert, QuestionDeleted, QuestionVoteUpdate, AssetShared, ParticipantJoined, ParticipantLeft, SessionBegan, SessionEnded, Pong, etc.
	 - StartAsync()
	 - If _sessionId present: `await HubConnection.SendAsync("JoinSession", _sessionId.Value, "user")`.
	 - Additionally: `await HubConnection.SendAsync("JoinGroup", "usertoken_{userToken}")` to sync participants already created for that token (server-side `JoinGroup` sends existing participants to caller for token sync).

7. Set Model.CurrentState = Loaded and StateHasChanged().

Notes: Call `StartAsync` after registering event handlers. If StartAsync fails, retry with an exponential backoff (3 attempts) and log failures.

----

## Client SignalR handlers (what to do when each event arrives)

- AssetShared
	- Parse assetData, set sharedAssetType and sharedAssetContent HTML string (display via MarkupString) and StateHasChanged.
	- No toast for participants (host shows toasts).

- QuestionReceived / QuestionQueued (questionData)
	- Parse questionData with fallbacks for `text`, `questionText` field names.
	- Avoid duplicates by checking QuestionId or identical text.
	- Insert at top of Model.Questions and StateHasChanged.
	- If toastNotificationsEnabled and question createdBy != _userGuid, show participant toast via JSRuntime (optional based on preference).

- HostQuestionAlert
	- Same parse flow as QuestionReceived. Hosts/host-panel show a toast.

- QuestionVoteUpdate / QuestionVoteUpdated
	- Update the matching question's Votes value in Model.Questions; mark HasUserVoted if needed.

- QuestionDeleted
	- Remove the question with the matching id from Model.Questions; StateHasChanged.

- ParticipantJoined / ParticipantLeft
	- Add or remove participant from Model.Participants. Respect `userToken` scoping if present.

- SessionBegan / SessionEnded
	- Update UI state and show persisted messages.

Defensive registration:
- Register multiple event-name variants used across the codebase (e.g., `QuestionVoteUpdate` and `QuestionVoteUpdated`) to avoid missing broadcasts.

----

## Client actions (HTTP + SignalR) and payload examples

1) Submit question (HTTP POST)
- Endpoint: POST /api/question/submit
- Body JSON example:
	{
		"SessionToken": "PX8RBFK4",
		"QuestionText": "Can you re-share the ayah card?",
		"UserGuid": "a1b2c3d4-..."
	}

2) Vote on a question (HTTP POST)
- Endpoint: POST /api/question/{questionId}/vote
- Body JSON example:
	{
		"SessionToken": "PX8RBFK4",
		"Direction": "up",
		"UserGuid": "a1b2c3d4-..."
	}

3) Delete question (HTTP POST)
- Endpoint: POST /api/question/{questionId}/delete
- Body JSON example:
	{
		"SessionToken": "PX8RBFK4",
		"UserGuid": "a1b2c3d4-..."
	}

4) Join SignalR session group (client-side SignalR call)
- Hub call example: await _hubConnection.SendAsync("JoinSession", sessionId, "user");

5) Generic token-based join for participant sync
- Hub call example: await _hubConnection.SendAsync("JoinGroup", $"usertoken_{userToken}");

----

## Error handling & logging recommendations

- Validate token length client-side (8 characters) before calling token-based APIs to avoid unnecessary server logs.
- Wrap all HTTP calls in try/catch and treat non-success status codes explicitly (log the response content for debugging).
- For SignalR, register a closed handler and attempt reconnects with exponential backoff (3 attempts) and fallback to a retry UI state.
- Use request-level requestId GUIDs (8-characters short id) to correlate client logs with server logs.

----

## UI / UX details (from the mock / visual contract)

- Logo: insert exactly at `<!-- Logo -->` marker with:
	```html
	<div style="display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;">
			<img src="/images/branding/NC-Header.png?v=@DateTime.Now.Ticks" alt="@(Model?.LogoText ?? "NOOR Canvas")" style="max-width:150px;height:auto;" />
	</div>
	```

- Main canvas: centered card with dashed border when awaiting content. Show `sharedAssetContent` with MarkupString when host shares.

- Q&A panel (right column): tabs for Q&A and Participants. Q&A lists questions ordered by votes then timestamp. Participants list should be token-scoped and scrollable.

- All styling must be inline per `blazor-view-builder-strategy.md` (do not introduce external CSS files). Font links may remain in `<HeadContent>`.

----

## Web / Build / Test checklist (required — follow `blazor-view-builder-strategy.md`)

Pre-implementation:
- [ ] Read this `SessionCanvas.MD` and `blazor-view-builder-strategy.md` thoroughly.

Implementation checklist:
- [ ] Full file replacement approach taken: copy mock structure then convert to Blazor.
- [ ] Add required top-level directives exactly: `@page`, `@layout EmptyLayout`, `@using`, `@inject` (IHttpClientFactory, IJSRuntime, NavigationManager, ILogger<SessionCanvas>, TokenService)
- [ ] Implement `SessionCanvasViewModel` and supporting classes in `@code` block.
- [ ] Implement OnInitializedAsync seeding demo data and calling InitializeSessionAsync.
- [ ] Implement `LoadSessionDataAsync`, `LoadParticipantsAsync`, `LoadQuestionsAsync`, `LoadUserGuidAsync` with robust error handling.
- [ ] Implement SignalR wiring: HubConnection builder, handlers, JoinSession and JoinGroup calls.
- [ ] Implement Q&A actions: SubmitQuestion(), VoteQuestion(), DeleteQuestion(), with HTTP POSTs matching controller expectations.
- [ ] Implement UI handlers: Toggle Q&A, Tabs, leave modal.
- [ ] Insert logo block at `<!-- Logo -->` marker exactly as specified.

Quality gates (must all pass before merge):
- [ ] dotnet build (SPA/NoorCanvas) — zero errors (and aim for zero warnings per strategy).
- [ ] dotnet run and confirm application serves at https://localhost:9091/ (or configured ports).
- [ ] Playwright tests (recommended): `PlayWright/Tests/qa-flow-simple.spec.ts` and `qa-flow-end-to-end.spec.ts` pass locally (use test guard scripts if configured).

Smoke tests to run manually:
- Using PowerShell in workspace root:
	- dotnet build "SPA/NoorCanvas/NoorCanvas.csproj"
	- dotnet run --project "SPA/NoorCanvas/NoorCanvas.csproj"
	- In a browser, open https://localhost:9091/session/canvas/{testUserToken}
	- Verify header/logo, waiting content placeholder, right-side Q&A list from mock data (or API-driven data)

----

## Playwright / Automated test hooks (what to assert)

Test cases to include or reuse from existing tests:
- SessionCanvas loads without JS errors — verify console logs are clean.
- Participant can submit a question — assert API returns success and new question appears in the UI.
- Host receives HostQuestionAlert — assert host panel receives toast (separate HostControlPanel tests).
- Vote flow: user upvotes a question and vote count increments for all clients.

Test selectors (useful hints):
- `text=NOOR Canvas` — header title
- `button:has-text("I have a question")` — Q&A toggle
- `#questions-list` — questions container
- `text=Awaiting content from the instructor...` — canvas waiting state

----

## Implementation pitfalls & gotchas (lessons learned)

- Register multiple SignalR event name variants to remain compatible with server broadcasts (e.g., `QuestionVoteUpdate` vs `QuestionVoteUpdated`).
- Always call StartAsync after handlers are registered to avoid missing events at connection time.
- Use token-based group (`usertoken_{token}`) joins to sync participants already stored in the DB — server `JoinGroup` sends `ParticipantJoined` events to caller with existing participants.
- Controllers enforce strict token length (8) and participant ownership for delete/vote operations; validate client-side first to present friendly errors.

----

## Example client-side pseudo-flow (concise)

1. OnInitializedAsync
	 - seed Loading model
	 - InitializeSessionAsync(requestId)

2. InitializeSessionAsync
	 - GET /api/participant/session/{token}/validate
	 - if valid: _sessionId <- response.Session.SessionId
	 - await LoadUserGuidAsync(requestId)
	 - await LoadParticipantsAsync(requestId)
	 - await LoadQuestionsAsync()
	 - await InitializeSignalRAsync()

3. InitializeSignalRAsync
	 - build HubConnection with `/hub/session`
	 - register handlers (QuestionReceived, HostQuestionAlert, AssetShared, ParticipantJoined, QuestionDeleted, QuestionVoteUpdate, SessionBegan/Ended)
	 - await StartAsync()
	 - await SendAsync("JoinSession", _sessionId.Value, "user")
	 - await SendAsync("JoinGroup", $"usertoken_{userToken}")

----

## Files & code references (where to look in repo)
- Server hubs: `SPA/NoorCanvas/Hubs/SessionHub.cs`, `SPA/NoorCanvas/Hubs/QAHub.cs`
- Controllers: `SPA/NoorCanvas/Controllers/ParticipantController.cs`, `SPA/NoorCanvas/Controllers/QuestionController.cs`
- Mocks (visual contract): `Workspaces/Documentation/IMPLEMENTATIONS/Mocks/RAZOR/User-CanvasExperience_Mock.razor`
- Existing SessionCanvas: `SPA/NoorCanvas/Pages/SessionCanvas.razor` (use as starting reference; consider replacing fully from the mock per strategy)
- Playwright tests: `PlayWright/Tests/qa-flow-simple.spec.ts`, `PlayWright/Tests/qa-flow-end-to-end.spec.ts`

----

## Acceptance checklist (copy into PR description)
- [ ] `SessionCanvas.razor` matches the HTML mock visually (logo, gold accents, Q&A right panel)
- [ ] Inline styles only — no new external CSS or Tailwind classes added
- [ ] All `@using`/`@inject` directives present and used
- [ ] HTTP and SignalR integration implemented and tested with local dev API
- [ ] Token rules enforced client-side (8-char UserToken check)
- [ ] Build: `dotnet build` (SPA/NoorCanvas) returns zero errors
- [ ] Runtime: app runs at https://localhost:9091 and the page loads with mocked/test data
- [ ] Tests: Playwright QA tests pass locally (or in CI)

----

If anything in this guide is unclear, or if you want me to implement `SessionCanvas.razor` now (fully replace file with a production-ready Blazor conversion of the mock and wire it to the APIs/hubs), say "Implement SessionCanvas now" and I will proceed, following this guide and the `blazor-view-builder-strategy.md` protocol.

----

Revision history:
- 2025-09-25: Created (implementation guide pulled from codebase: SessionHub, QAHub, ParticipantController, QuestionController, and Mock file)

