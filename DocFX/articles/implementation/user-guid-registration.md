# Implementation: User GUID Registration

This page documents the User GUID registration flow, storage mapping, API contracts, and implementation status for NOOR Canvas.

## Summary
- Purpose: Describe how participant GUID-based registration works, where data is stored in SQL, and the current implementation status.
- Scope: Client flow, server flow, DB schema mapping, API endpoints, verification notes, and recommended next steps.

## Client flow
1. Participant navigates to `/s/{guid}` (public session link).
2. Client checks `localStorage` for `UserId`.
   - If present: client sends `UserId` + `guid` to the server to validate and join.
   - If absent: client displays registration form (Name, City, Country).
3. On registration submit the client POSTs to `POST /api/join/{guid}` or `POST /api/auth/user/register`.
4. Server returns `{ userId, registrationId, sessionId }` on success.
5. Client stores `userId` in `localStorage` and navigates to Waiting Room.

## Server flow
- The server validates the `guid` against `canvas.SessionLinks` entries (checks `State`, `ExpiresAt`).
- If `UserId` was provided, the server locates the `canvas.Users` row and either returns an existing `Registration` or creates one.
- If no `UserId` exists the server:
  - Creates a new `UserId` (GUID) and stores user metadata in `canvas.Users`.
  - Inserts a `canvas.Registrations` row linking the `UserId` to the `SessionId`.
  - Returns identifiers and session metadata to the client.

## SQL storage mapping
- `canvas.Users` — persistent user profiles
  - `UserId` UNIQUEIDENTIFIER PK
  - `Name`, `City`, `Country`
  - `FirstJoinedAt`, `LastJoinedAt`

- `canvas.Registrations`
  - `RegistrationId` BIGINT PK
  - `SessionId` BIGINT FK -> `canvas.Sessions(SessionId)`
  - `UserId` UNIQUEIDENTIFIER FK -> `canvas.Users(UserId)`
  - `JoinTime` DATETIME2
  - Unique constraint on (`UserId`, `SessionId`) to ensure one registration per session

- `canvas.SessionLinks`
  - `LinkId`, `SessionId`, `Guid` (public user GUID), `State`, `LastUsedAt`, `UseCount`

- `canvas.HostSessions` (host GUIDs stored hashed in `HostGuidHash`) — separate private token store

## API contracts (sketch)
- GET  `/s/{guid}` → returns registration page or redirect to `/join/{sessionId}`
- POST `/api/join/{guid}` → { registrationId, sessionId }
- POST `/api/auth/user/register` → { userId, sessionId, requiredFields? }

## Implementation status (as of doc snapshot)
- Database schema: implemented (`canvas.Users`, `canvas.Registrations`, `canvas.SessionLinks`) — migrations applied.
- Server: `ParticipantController` and supporting endpoints present.
- Front-end: `ParticipantRegister.razor` is incomplete; `CreateSession.razor` has an HttpClient BaseAddress issue (Issue-53) blocking related flows.

## Verification notes
- To validate end-to-end:
  1. Ensure `SessionLinks` contains an active GUID for a dev session.
  2. Call `POST /api/join/{guid}` with a sample payload; assert `canvas.Users` and `canvas.Registrations` rows created.
  3. Confirm response includes `userId` which the client should persist in `localStorage`.

## Recommended next steps
1. Fix Issue-53 (HttpClient BaseAddress) to unblock session creation and related UI.
2. Complete `ParticipantRegister.razor` and wire it to `POST /api/join/{guid}`.
3. Add a small server-side smoke test that posts to the registration endpoint and asserts DB changes.
4. Add a short E2E test to simulate a new user registering and joining a waiting room.

## Related docs
- `Workspaces/Documentation/IMPLEMENTATIONS/NOOR-CANVAS-DESIGN.MD`
- `Workspaces/IMPLEMENTATION-TRACKER.MD`
- API reference: `DocFX/api` (generated from controller XML comments)

---

_Last updated: 2025-09-15_
