# NOOR Canvas Implementation Design (v3.0 FINAL)

NOOR CANVA3. **Self‑Contained Styling.** All CSS required for Qur'an, Hadith, Etymology, Poetry, etc. is bundled in NOOR; **no runtime dependency** on KSESSIONS CSS. Images are *referenced* from Beautiful Islam + Quran.com (DEV/PROD paths), not copied.【35†source】
5. **Read‑Only Render.** Session transcript HTML is mounted into a **sandboxed, read-only container**. "Share" UI is layered **on top** via DOM overlays when assets are detected. **Asset direction (RTL/LTR) preserved as-is.**
5. **Realtime First.** SignalR transports session status, asset shares, Q&A, annotation state; late joiners reconcile via **authoritative snapshot**.
6. **Observability by Default.** The **Noor Observer** (diagnostics & telemetry) and **Issue Tracker** ship in Phase 1 skeleton and stay on from day one.

---

## 0) System Tenets (Canonical Rules)
1. **GUID = Gate.** Session access is exclusively by cryptographically strong GUID (UUID4 128-bit); no traditional auth. Expiry: absolute (3h default) **and** immediate on **Host End Session** or explicit **Expire** action.
2. **Host Token Security.** Host dashboard access protected by separate UNIQUEIDENTIFIER token per session. Two-token system: public GUID for users, private HostToken for host dashboard access.
3. **Registration Required by Default.** Name / City / Country collected for roster/analytics; **required by default** for better session management.
4. **Self‑Contained Styling.** All CSS required for Qur'an, Hadith, Etymology, Poetry, etc. is bundled in NOOR; **no runtime dependency** on KSESSIONS CSS. Images are *referenced* from Beautiful Islam (DEV/PROD paths), not copied.【35†source】
5. **Read‑Only Render.** Session transcript HTML is mounted into a **sandboxed, read-only container**. “Share” UI is layered **on top** via DOM overlays when assets are detected.
6. **Realtime First.** SignalR transports session status, asset shares, Q&A, annotation state; late joiners reconcile via **authoritative snapshot**.
7. **Performance Priority.** Asset sharing optimized for <200ms P95 latency with guaranteed delivery and consistency.
8. **Privacy-Conscious Q&A.** Questions appear anonymous to users but hosts can see questioner identity for moderation.
9. **Observability by Default.** The **Noor Observer** (diagnostics & telemetry) and **Issue Tracker** ship in Phase 1 skeleton and stay on from day one.【35†source】.

---

## 1) Configuration Notes
- **Frontend Framework**: Blazor Server for better ASP.NET Core integration and IIS hosting
- **Session Management**: 3h default expiry, one active GUID link per session, registration required by default
- **Performance**: Target 100 concurrent users per session, moderate rate limiting, standard audit logging
- **Browser Support**: Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Environment Strategy**: Simple Dev → Production (2-tier deployment)
- **Scaling**: Start simple, add Redis backplane in Phase 5 if performance testing shows need
- **Analytics**: Standard engagement metrics collection (session participation, Q&A usage)
- **Data Protection**: Session data treated as ephemeral, no backup needed
- **Internationalization**: English + Arabic interface support
- `appsettings.Development.json` enables all Observer features and SignalR diagnostics【35†source】.
- Production disables sensitive logs; PII scrub; retention policies.
- Environment mapping for image roots (DEV/PROD) via configuration.

---

## 2) Architecture Overview
**Stack**: ASP.NET Core 8 (API + SignalR) · EF Core · SQL Server · **Blazor Server** · McBeatch theme + NOOR CSS · Redis backplane (Phase 5 if needed) · Serilog + App Insights【35†source】.

### Logical Diagram
- **API**: Sessions, Links, Q&A, Assets, Snapshot, Health, Observer endpoints.
- **Hubs**: `/hub/session` (status, asset share, annotations) · `/hub/qa` (Q&A).
- **DB (canvas schema)**: Sessions, SessionLinks, Registrations, SharedAssets, Questions, Answers, Annotations, AuditLog【35†source】.
- **External read (dbo)**: Beautiful Islam metadata & image path resolution + **Quran.com integration**【35†source】.
- **Client Apps**: Host Console · User Canvas · Observer Dashboard.
- **Zoom Integration**: Embedded Zoom panel for host dashboard (via Zoom link)

---

## 3) Unified Use Cases (Authoritative)
### UC-H1 Generate Shareable URL (GUID)
- **Primary**: Host. **Pre**: Album/Category exist. **Trigger**: Create Session → “Generate GUID”.
- **Success**: URL `.../s/{GUID}` created; copy/QR; audit trail. (Security: 128‑bit+ entropy; rate‑limit resolution.)

### UC-U1 Register & Join
- **Primary**: User. **Trigger**: Click GUID URL. **Server**: validate link → Registration (Name/Country/City).
- **Clarification**: Registration is **metadata only**, not auth; can be optional/required per‑session. Users then enter **Waiting Room** until session begins.

### UC-L1 Live Canvas & Asset Broadcast
- Host clicks **BEGIN SESSION** → status `Live` → Waiting Room auto-navigates users to **Canvas View**.
- Asset Detector overlays **Share** buttons on recognized blocks in the read-only transcript.
- On **Share**, payload broadcast; users render asset; late joiners snapshot sync.

### UC-Q1 Submit Question (User)
- User opens Q&A panel → Ask → server validates/dedups → `Queued` → real‑time appears in host queue.

### UC-Q2 Manage & Answer (Host)
- Host triages queue → **Select** (broadcast on canvases) → answer verbally/text → **Mark Answered** → moves to history.

---

## 4) Data Model (canvas schema) — Copilot seeds
```sql
-- Sessions & Links (with Host Authentication)
CREATE TABLE canvas.Sessions(
  SessionId BIGINT IDENTITY PRIMARY KEY,
  StartedAt DATETIME2 NULL, EndedAt DATETIME2 NULL, ExpiresAt DATETIME2 NULL
);
CREATE TABLE canvas.SessionLinks(
  LinkId BIGINT IDENTITY PRIMARY KEY,
  LastUsedAt DATETIME2 NULL, UseCount INT NOT NULL DEFAULT 0
);

-- Host Authentication & Session Management
CREATE TABLE canvas.HostSessions(
  HostSessionId BIGINT IDENTITY PRIMARY KEY,
  IsActive BIT NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IX_HostSessions_SessionToken ON canvas.HostSessions(SessionId, HostToken);

-- Registration (metadata only)
CREATE TABLE canvas.Registrations(
  RegistrationId BIGINT IDENTITY PRIMARY KEY,
  JoinTime DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Assets & Annotations
CREATE TABLE canvas.SharedAssets(
  AssetId BIGINT IDENTITY PRIMARY KEY,
  SharedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE canvas.Annotations(
  AnnotationId BIGINT IDENTITY PRIMARY KEY,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Q&A (280 character limit, anonymous to users, visible to hosts)
CREATE TABLE canvas.Questions(
  QuestionId BIGINT IDENTITY PRIMARY KEY,
  AnsweredAt DATETIME2 NULL
);
CREATE TABLE canvas.QuestionAnswers(
  AnswerId BIGINT IDENTITY PRIMARY KEY,
  PostedBy NVARCHAR(64) NOT NULL, PostedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Audit
CREATE TABLE canvas.AuditLog(
  EventId BIGINT IDENTITY PRIMARY KEY,
  At DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), Actor NVARCHAR(64) NULL
);
```

Indexes & constraints: add IX on `(SessionId, Status)` for Questions; `(SessionId, SharedAt)` for assets; filtered IX for `SessionLinks(State=1)`.

---

## 5) Host Authentication Strategy (Security Implementation)

### Two-Token System Design
1. User GUID (Public): For participants to join sessions - `/s/{userGuid}`
2. Host Token (Private): For host dashboard access - `/host/dashboard/{sessionId}?token={hostToken}`

### Host Authentication Flow
Session Creation:
1. Host creates session via API or interface
2. System generates:
   - Public GUID link for users
   - Private HOST TOKEN (GUID) stored in Sessions.HostToken
3. Host receives both URLs and bookmarks the host dashboard URL with token

Host Access:
1. Host navigates to dashboard URL with token
2. System validates hostToken against Sessions.HostToken
3. Access granted only if tokens match
4. HostSessions table logs access for audit trail

---

## 6) API & Hub Contracts (TypeScript/C# friendly)

### REST (sketch)
POST   /api/sessions                       -> {sessionId, userAccessUrl, hostDashboardUrl}
POST   /api/sessions/{sessionId}/links     -> {linkId,guid,url}
PATCH  /api/links/{linkId}                 -> {state|expiresAt}

GET    /s/{guid}                           -> Registration or Redirect to /join/{sessionId}
POST   /api/join/{guid}                    -> {registrationId, sessionId, requiredFields?}

GET    /host/dashboard/{sessionId}?token={hostToken} -> Host Dashboard View
POST   /api/host/sessions/{id}/begin?token={hostToken} -> {status:"Live"}
POST   /api/host/sessions/{id}/end?token={hostToken}   -> {status:"Closed"}
GET    /api/host/sessions/{id}/state?token={hostToken} -> {status, currentAsset?, qna?}

GET    /api/sessions/{id}/state            -> {status, currentAsset?, qna?}
POST   /api/sessions/{id}/begin            -> {status:"Live"}
POST   /api/sessions/{id}/end              -> {status:"Closed"}

GET    /api/sessions/{id}/qa/questions?status=Queued|Selected|Answered
POST   /api/sessions/{id}/qa/questions     -> {questionId,status}
PATCH  /api/sessions/{id}/qa/questions/{qid}  (status, answerBody?, assetRefs?, hide?, defer?)
POST   /api/sessions/{id}/qa/questions/{qid}/vote

GET    /healthz
GET    /observer/stream (SSE/WebSocket)
POST   /issues

### SignalR Events
// SessionHub (group per sessionId)
server->client:
  SessionBegan(sessionId)
  SnapshotHash(hash)

client->server:
  JoinSession(sessionId, role:"host"|"user")
  Ping()

// QAHub
server->client:
  QuestionQueued(q)
  QuestionAnswered(qid, answer?)
client->server:
  AskQuestion(body, tags?, assetRef?)
  Vote(qid, +1|-1)

---

## 7) Frontend Implementation Map

### 7.0 UI/UX Design Principles
Design Philosophy: Clean, centralized layouts with balanced visual hierarchy and generous spacing for enhanced clarity.

#### Universal Design Standards
- Responsive Design: Desktop, iPad, mobile
- Centralized Layouts: Content centered with balanced margins
- Clean Aesthetics: Simple, uncluttered
- Spacing Strategy: Generous whitespace
- Typography: Readable fonts with suitable line-height
- Color Palette: Minimal, Islamic design sensibilities

### 7.1 Host Console (Unified Dashboard)
Target Devices: Desktop and iPad only - hosts do not run sessions from mobile phones.
Layout Strategy: Single-view dashboard with sticky canvas preview for continuous monitoring.

Components & Behavior (HOST EXCLUSIVE)
- TranscriptPanel: Read-only DIV mount with AssetDetector overlays
- Zoom Integration Panel: Embedded iframe for Zoom
- Sticky Canvas View: Always visible; not available to regular users
- Q&A Queue: Live updating list with keyboard shortcuts
- Session Controls: Begin/End/Expire Link controls
- Roster Panel: Collapsible sidebar
- Observer Dock: Toggleable diagnostic overlay

### 7.2 User Canvas (Participant View)
Layout Strategy: Immersive, distraction-free content consumption with optional interaction panels.

Components & Behavior
- WaitingRoom: Lobby with session preview and auto-navigation on SessionBegan
- CanvasView: Centralized asset display with transitions
- QAPanel: Slide-out panel for asking questions (280 char limit)
- LateJoinSync: Reconcile via /state then real-time subscribe

### 7.3 Responsive Design Strategy
- Desktop (1024px+): Host two-column layout; user centered content (max 800px)
- Tablet (768-1023px): Host iPad optimizations; touch-friendly
- Mobile (<768px): Users only; single column

### 7.4 Styling & Theming
- McBeatch base + /styles/noor/ modules (`noor-ayah.css`, `noor-hadith.css`, `noor-etymology.css`, `noor-poetry.css`, `noor-canvas.css`, `noor-annotations.css`).
- Bundle Arabic fonts (Amiri, Noto)
- Image paths: DEV and PROD mapping via config

### 7.5 Asset Detection Implementation
Supported content types (Verse, Ayah, Hadith, Etymology, Poetry, Images, Quotes) mapped to CSS selectors and processed accordingly. AssetDetector component overlays Share buttons and emits share payloads to the SessionHub.

Performance optimizations: virtual scrolling, asset caching, debounced updates, intersection observer, CSS containment.

---

## 8) Security Model
- Access: GUID-only; validate link state
- Expiry: TTL + host-triggered end
- Registration: metadata-only; privacy-preserving storage
- Rate limits: join/ask/vote
- Sanitization: server-side HTML sanitization; no inline scripts
- Hub Authorization: scoped to sessionId & role

---

## 9) Noor Observer & Issue Tracker (Phase 1 deliverable)

Noor Observer: Serilog, health checks, client diagnostics, `/observer/stream` for dev; Observer dock toggled with `?debug=1`.

Issue Tracker: `POST /issues` stores issues to `canvas.Issues`; simple admin triage view and create-from-log functionality.

---

## 10) Phased Implementation Plan (authoritative)

Phase 1 — Skeleton, Observer, Issue Tracker, DB (Weeks 1–3): repo init, core projects, /healthz, Serilog, Observer stream, DB migrations, McBeatch wiring, hubs, unit tests, IIS launch profile.

Phase 2 — Host & Participant Core (Weeks 4–8): Host Dashboard, Registration, Waiting Room, read-only transcript mount, Asset Detector & Share, User Canvas, Q&A.

Phase 3 — Annotations & Admin (Weeks 9–12): SVG overlay tools, sync throttling, roster admin, Redis backplane.

Phase 4 — Styling & Content Integration (Weeks 13–15): Full CSS replication, font bundling, image path resolution, share overlay polish.

Phase 5 — Performance & Accessibility (Weeks 16–18): Perf budgets, caching, WCAG 2.2 AA, telemetry.

Phase 6 — Testing & Deployment (Weeks 19–20): Automated tests, load testing, deployment.

---

## 11) Next Steps & Notes
- This `NOOR-CANVAS-DESIGN-FINAL.MD` consolidates the V3 and original design docs, deduplicates overlapping sections, and includes the requested configuration and tenets blocks.
- If you'd like, I can remove the original source files next (the user requested deletion of duplicates) — confirm and I'll delete `NOOR-CANVAS-DESIGN.MD` and `NOOR-CANVAS-DESIGN V3.MD` or keep one as an archive.

---

End of document.
