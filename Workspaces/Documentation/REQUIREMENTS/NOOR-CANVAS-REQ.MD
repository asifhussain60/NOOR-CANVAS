# NOOR CANVAS — Comprehensive Requirements (Standalone, No Auth0)

> **Status:** Draft v1 · **Owner:** Asif · **Last updated:** 2025‑09‑07 (America/New\_York)

This document specifies a production‑ready, modern, mobile‑responsive, and visually rich application called **NOOR CANVAS**. It removes all Auth0 dependencies and designs a secure, session‑scoped access model suitable for a single‑host teaching experience with real‑time audience participation.

---

## 1) Purpose & Vision

**NOOR CANVAS** is a dynamic teaching tool for religious education that replaces linear slide decks with a responsive, curated content library. A host runs an interactive session, instantly presenting assets—Qur’anic ayāt, narrations, etymologies, poetry, images—while participants follow along in sync and ask questions anonymously.

**Primary goals**

* Fast, fluid, **real‑time** broadcast from Host to all Participants.
* **Session‑scoped security** without third‑party auth (no Auth0), using signed capability tokens.
* **Modern, elegant UI** with strong visual hierarchy, icons, imagery, motion, and dark/light themes.
* **Mobile‑first** design; graceful on phones, tablets, and desktops.
* **Operational simplicity:** easy to deploy, monitor, and extend.

**Non‑goals**

* Full LMS features (grading, homework, user accounts, long‑term profiles).
* Social network features (DMs, reactions beyond simple upvotes).

---

## 2) Personas

* **Host** (Instructor): Prepares a session, curates assets, presents live, manages Q\&A.
* **Participant** (Audience): Joins via link, views the whiteboard, submits questions, upvotes.

---

## 3) Core Use Cases (User Stories)

**Host**

1. Create a session with name, start time (EST default), description, and background theme.
2. Curate a **Library** of assets (CRUD + sort + tags): images, ayah‑cards, etymology cards, hadith, poetry, quotes.
3. Start the session and broadcast selected assets on the **Whiteboard** to all connected users in real time.
4. Highlight words/phrases and apply **“Appear”** step‑by‑step reveals.
5. View **Questions** with askers (private to Host), mark answered, hide or pin.
6. End the session, pushing everyone to the **Conclusion** view.

**Participant**

1. Open a session link (GUID based) → **Registration**: name (text), country (dropdown), optionally city.
2. Enter a **Waiting Room** with session info, countdown, live join count, country breakdown, and rotating Islamic quotes.
3. View the **Whiteboard** (read‑only); submit questions; see a deduplicated list; upvote existing questions.
4. Remain anonymous to other participants; only the Host sees the asker’s identity.

---

## 4) System Overview & Architecture

**Recommended stack (default):**

* **Frontend:** Next.js 15 (App Router) + React 18 + TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Radix UI primitives, Lucide icons.
* **Real‑time:** Socket.IO (WebSocket + fallback) or SignalR (if .NET backend chosen). Default: **Socket.IO** for Node stack.
* **Backend (API/RT):** Node.js 22 + **NestJS** (or Express) with TypeScript **OR** .NET 8 Minimal APIs + SignalR. Choose one; both described below. Default: **NestJS**.
* **Database:** Microsoft **SQL Server** (KSESSIONS\_DEV read‑only integration). ORM: Prisma (Node) or EF Core (.NET).
* **Cache/Queue:** Redis for presence counters, rate limiting, and transient state.
* **Build/Deploy:** Docker, CI via GitHub Actions; target Azure App Service / Azure Container Apps (or AWS ECS/Fargate).
* **CDN & Static:** CloudFront/Azure CDN for images and static assets.

**High‑level modules**

* **Session Service**: create/manage sessions, token issuance, status, theming.
* **Library Service**: CRUD for assets; optional ingest from KSESSIONS\_DEV (read‑only).
* **Whiteboard Service**: live state & animations broadcast.
* **Q\&A Service**: question feed, moderation, upvotes, answer marking.
* **Registration Service**: guest registration + minimal PII storage.
* **Waiting Room Service**: presence, countdown, rotating quotes.

**Security (no Auth0)**

* **No accounts/passwords.** Use **capability tokens** (signed JWTs issued by our backend):

  * **Host Token** (scope: host:<sessionId>) for admin actions in that session only.
  * **Participant Token** (scope: attendee:<sessionId>) for read + Q\&A posting.
* Tokens are short‑lived (e.g., 2 hours) and **rotated** on reconnect.
* Join links contain the **Session GUID** only; token is obtained server‑side after registration via **same‑site HttpOnly cookie** or single‑use nonce.
* **Rate‑limiting** (Redis): per‑IP + per‑session.
* **CORS** locked to frontend origin; websockets with origin checks.
* **PII minimization:** store only what is needed (name, country, optional city).

---

## 5) Data Model (Application DB)

> If reading directly from KSESSIONS\_DEV is enabled, that is a **read‑only integration**. NOOR CANVAS keeps its own small operational DB for sessions, Q\&A, and local library.

**Tables (NOORCANVAS):**

* `Session` (id, guid, name, description, start\_at, timezone, theme, bg\_image\_url, status\[DRAFT|LIVE|ENDED], created\_by, created\_at)
* `Registration` (id, session\_id, name, country\_code, city, created\_at, client\_fingerprint\_hash)
* `Question` (id, session\_id, registration\_id, text, status\[OPEN|ANSWERED|HIDDEN], upvotes, created\_at)
* `Asset` (id, session\_id, kind\[IMAGE|AYAH|ETYMOLOGY|HADITH|POEM|QUOTE|HTML\_BLOCK], title, tags\[], content\_json, sort\_order, created\_at)
* `WhiteboardState` (id, session\_id, payload\_json, updated\_at) — current slide/asset + animation step
* `Quote` (id, source\[Kutub|Nahj|Ayah], text, reference, language, weight)
* `AuditLog` (id, actor\_kind\[HOST|SYS], action, session\_id, payload\_json, created\_at)

**Asset content\_json examples**

* IMAGE: `{ url, caption, attribution }`
* AYAH: `{ arabic, translation, surah, ayahNumber, tokens:[{text, lemma, gloss}] }`
* ETYMOLOGY: `{ root, forms:[...], notesHtml }`
* HADITH: `{ arabic, translation, source, grade }`
* POEM/QUOTE: `{ text, author, source }`
* HTML\_BLOCK: `{ html }` (sanitized)

---

## 6) KSESSIONS\_DEV Integration (Optional Read‑Only)

**Goal:** Allow the Host to import assets from KSESSIONS\_DEV without using the KSESSIONS API (thus, no Auth0).

**Approach:**

1. **Direct DB connection** (read‑only credentials; network‑restricted). Use Prisma (Node) or EF Core (.NET).
2. Provide a one‑time **Ingest Job** by `sessionId` that reads `SessionTranscripts.Transcript` (HTML), parses for known blocks (e.g., `div.ayah-card`, `div.etymology-card`, `img`, etc.), and converts them into `Asset` records.
3. Maintain a **parser registry**: CSS selectors + transformers → asset content\_json.
4. Log all ingest actions to `AuditLog`.

**Pros:** no dependency on external APIs/Auth0; fast bulk import.
**Cons/Risks:** tight coupling to KSESSIONS HTML structure; DB access must be locked down; parsing must sanitize HTML.

> **Note:** This document does **not** verify your network/database access. The team must provision read‑only credentials and a SQL view or schema‑bound function set as needed. Tests should run against a scrubbed dataset.

---

## 7) API Design (Standalone)

**Base URL:** `/api`

### 7.1 Auth & Tokens (capability-based)

* `POST /sessions/:guid/register` → { name, country, city? } → issues Participant token (HttpOnly cookie) + returns session status.
* `POST /sessions/:guid/host-token` → Protected by single‑use **Host Invite Code** created at session creation → returns Host token.

### 7.2 Sessions

* `POST /sessions` (Host) → create session (name, description, start\_at, timezone, bg\_image\_url, theme)
* `GET /sessions/:guid` → public session info (no PII)
* `POST /sessions/:guid/start` (Host)
* `POST /sessions/:guid/end` (Host)

### 7.3 Library / Assets

* `GET /sessions/:guid/assets` (Host)
* `POST /sessions/:guid/assets` (Host)
* `PUT /sessions/:guid/assets/:id` (Host)
* `DELETE /sessions/:guid/assets/:id` (Host)
* `POST /sessions/:guid/ingest/k‑sessions` (Host) { sourceSessionId } → kicks off ingest job (optional feature)

### 7.4 Whiteboard (stateful)

* `GET /sessions/:guid/whiteboard` → current state (for late joiners)
* `POST /sessions/:guid/whiteboard/present` (Host) { assetId }
* `POST /sessions/:guid/whiteboard/step` (Host) { stepAction: "appear|highlight|clear", payload }

### 7.5 Q\&A

* `GET /sessions/:guid/questions` (Participant) → list (anonymized; hide asker)
* `POST /sessions/:guid/questions` (Participant) { text }
* `POST /sessions/:guid/questions/:id/upvote` (Participant)
* `POST /sessions/:guid/questions/:id/answer` (Host)
* `POST /sessions/:guid/questions/:id/hide` (Host)

### 7.6 Waiting Room

* `GET /sessions/:guid/waiting-room` → stats (live count, countries, countdown)
* `GET /sessions/:guid/quotes` → rotating quotes (preloaded)

---

## 8) Real‑Time Event Protocol (Socket.IO)

**Namespace:** `/rt/:guid`

**Events (server → clients)**

* `whiteboard:update` { assetId, state, stepIndex }
* `questions:update` { items: \[...] } (list diff or patch)
* `presence:update` { count, countries: \[{code, n}] }
* `session:status` { status: DRAFT|LIVE|ENDED }

**Events (clients → server)**

* `question:submit` { text }
* `question:upvote` { id }
* `host:present` { assetId } (Host only)
* `host:step` { action, payload } (Host only)
* `host:answer` { id } (Host only)
* `host:hide` { id } (Host only)

**Auth over WS**

* Connect with capability token (Bearer in `auth` payload). Server validates scope against `:guid`.

---

## 9) Frontend UX & Visual Design

**Design system**

* **Tailwind + shadcn/ui** for consistent components.
* **Lucide** icons; **Next/Image** for optimized images.
* **Framer Motion** for micro‑interactions (appear, emphasis, transitions).
* **Themes:** Light/Dark + session accent color (e.g., emerald, indigo, amber).
* **Typography:** Readable Arabic display for Qur’anic text (e.g., Amiri/Kitab, fallback Noto Naskh), Latin pairing with Inter.

**Global layout**

* App shell with responsive nav and status bar.
* **Host Dashboard** split‑pane: Whiteboard preview (left), Asset Library + Q\&A moderation (right). Drag‑to‑reorder assets.

**Key views**

* **Registration:** minimal form; country select with flags; validation; consent checkbox.
* **Waiting Room:** session title, description, countdown timer, live presence count, **country map** (mini choropleth), rotating quotes carousel.
* **Whiteboard (Shared):**

  * Presenting asset card centered; adaptive scaling; pinch‑to‑zoom on mobile (read‑only for Participants).
  * **Highlight** tool shows animated underline or glow around tokens/words.
  * **Appear** steps: staggered reveal with subtle motion.
  * **Q\&A Panel:** right dock on desktop, modal on mobile; submit, view list, search, upvote; dedupe similar questions.
* **Host Controls:** floating toolbar (start/end session, present asset, next step, highlight mode, pin/hide question, mark answered).
* **Conclusion:** thank‑you message, summary of answered themes, call‑to‑action (e.g., join mailing list/export notes—optional).

**Accessibility**

* WCAG 2.2 AA color contrast, focus states, keyboard navigation, ARIA live regions for real‑time updates, semantic HTML.

---

## 10) Mobile Responsiveness

* Mobile‑first CSS with responsive breakpoints (sm/md/lg/xl/2xl).
* Sticky bottom action bar for question submission on phones.
* Virtualized lists for Q\&A performance.
* Reduce motion setting respected (prefers‑reduced‑motion).

---

## 11) Content Handling & Safety

* All HTML (ingested or user‑submitted) is **sanitized** (DOMPurify server‑side).
* Qur’anic text rendered with proper ligatures; RTL support.
* Image optimization via Next/Image + CDN; lazy‑loading.
* Quote rotation preloads into memory for smooth Waiting Room cycling.

---

## 12) Performance & Scale Targets

* ≤ 200ms P99 event fan‑out within a region for up to 2,000 concurrent participants/session.
* First contentful paint ≤ 2.5s on 3G for Waiting Room.
* Whiteboard update broadcast ≤ 100ms median.

**Tactics:** HTTP/2, compression, CDN, Redis fan‑out, minimal payload diffs, client memoization.

---

## 13) Observability & Admin

* Structured logging (pino/Serilog) with sessionId correlation.
* Metrics: QPS, WS connections, delivery latency, dropped events, error rates.
* Admin screen: active sessions, counts, slow consumers, ban IPs, export Q\&A CSV.

---

## 14) Privacy & Compliance

* PII minimized (name, country, optional city). No emails required unless enabled.
* Data retention policy configurable per session (e.g., purge Q\&A after 30 days).
* Consent checkbox for terms/privacy at registration.

---

## 15) DevOps & Deployment

* **Monorepo** (pnpm workspaces): `apps/web`, `apps/api`, `packages/ui`, `packages/proto`.
* **CI**: lint (ESLint), typecheck, test (Vitest/Jest), build, Docker image push.
* **CD**: staged deploy (staging → production) with health checks.
* **Secrets**: managed via Azure Key Vault/AWS Secrets Manager.

---

## 16) Testing Strategy

* Unit tests for parsers (ingest from `SessionTranscripts.Transcript`).
* Contract tests for WS events.
* E2E (Playwright) for Host and Participant flows.
* Load tests (k6/Artillery) for 2k concurrent users.

---

## 17) Technology Variants (choose one)

**A. Node/NestJS + Socket.IO (default)**

* Pros: unified TypeScript stack; fast developer productivity; Prisma.
* Cons: If team prefers .NET, skill ramp.

**B. .NET 8 Minimal APIs + SignalR**

* Pros: native to SQL Server, high performance, first‑class SignalR.
* Cons: mixed language stack if React front end kept in TS.

> Pick A or B during project kickoff and remove the other from scope.

---

## 18) Security Without Auth0 (Detailed)

* **Join flow**: link → registration → server creates Participant record → mints **Participant token** scoped to session.
* **Host invitation**: session creator receives a **one‑time Host code**; exchanging it returns a **Host token**.
* **Token format**: JWT signed with server key; claims: `sub`, `scope`, `sid`, `exp` (≤ 2h). No long‑lived refresh.
* **Storage**: HttpOnly, SameSite=Lax cookies for web; Bearer for WS handshake only.
* **Abuse controls**: per‑IP and per‑token rate limits; profanity filter for questions (configurable); server‑side dedupe.

---

## 19) Open File & Asset Formats

* Image: PNG/JPG/WebP; max 4K; CDN resized variants.
* Text assets stored as JSON; rich blocks sanitized HTML subset.
* Export: Q\&A CSV; Session JSON (assets + order).

---

## 20) Implementation Milestones

1. **Project Setup** (monorepo, CI/CD, theming, shadcn/ui).
2. **Session CRUD + Registration** (tokens, waiting room, quotes).
3. **Q\&A MVP** (submit, list, upvote; host moderation).
4. **Whiteboard MVP** (present asset; appear steps; highlight).
5. **Asset Library** (CRUD, tags, sort; image upload).
6. **KSESSIONS Ingest (optional)** (read‑only DB connector + parsers).
7. **Scale/Perf** (Redis presence; caching; load tests).
8. **Admin/Observability** & polish.

---

## 21) Acceptance Criteria (Samples)

* Participants see a new asset on Whiteboard ≤ 200ms median after Host presents it.
* Questions posted by Participants are visible to all within ≤ 300ms.
* Host can mark a question answered; it disappears from Participant list immediately.
* Waiting Room shows accurate live count and country breakdown (±1 user within 2s).
* Ingest job converts known HTML blocks into typed assets with 0 sanitizer violations.

---

## 22) Deployment & Configuration

**Environment variables** (examples):

* `DB_URL` (NOORCANVAS DB)
* `KSESSIONS_DB_URL` (read‑only; optional)
* `JWT_SIGNING_KEY`
* `REDIS_URL`
* `CDN_BASE`
* `APP_BASE_URL`

**Feature flags**

* `FEATURE_INGEST_KSESSIONS`
* `FEATURE_EMAIL_COLLECTION` (off by default)

---

## 23) Risks & Mitigations

* **HTML shape drift** in KSESSIONS transcripts → parser plug‑in architecture + unit tests.
* **Real‑time scale** at peak → horizontal scaling with sticky WS, Redis pub/sub, regional routing.
* **Abuse/spam** → rate limit + moderation + throttle.

---

## 24) Out‑of‑Scope & Future Ideas

* Multiple simultaneous Hosts per session (co‑presenting) — future.
* Slides export to PDF with animations — future.
* Polling/quizzes — future.

---

## 25) How To Verify Bypass of Auth0 in KSESSIONS (Guidance)

> This project does **not** depend on Auth0. If you choose **direct DB ingest**, perform the following **outside** NOOR CANVAS:

1. **Network & Creds:** Confirm application network access to KSESSIONS\_DEV and obtain **read‑only** credentials.
2. **Schema check:** Verify presence of `SessionTranscripts` and the `Transcript` (HTML) column; capture a sample.
3. **Read test:** From a secure bastion, run a SELECT with the read‑only user to confirm access.
4. **Parser spike:** Run the parser against the sample HTML; validate extracted blocks (ayah‑card, etymology, hadith, poetry, images).
5. **Security review:** Ensure no write permissions; mask sensitive data; sanitize all HTML.

> **GitHub repository confirmation:** This document cannot access your private GitHub repo. To confirm whether Auth0 can be bypassed in the legacy KSESSIONS app, search the repo for `[Authorize]`, middleware, and DB contexts; verify API endpoints are not required when using **direct DB read‑only ingest** from NOOR CANVAS. If legacy services are intertwined, keep NOOR CANVAS fully separate and treat KSESSIONS as a data source only.

---

## 26) Open Questions (Please Confirm)

1. **Backend flavor:** Choose **NestJS + Socket.IO** (TS) or **.NET 8 + SignalR**.
2. **KSESSIONS ingest:** Proceed with direct **read‑only** DB ingest? If yes, provide a **sample transcript** and an allow‑listed SQL user.
3. **Quotes source:** Provide initial corpus and references (Qur’an, Nahj al‑Balāgha, hadith collections) for the Waiting Room.
4. **Branding assets:** Confirm logo, color palette, and imagery preferences.
5. **Hosting provider:** Azure vs AWS; region; CDN choice.

---

## 27) Quick Implementation Notes for GitHub Copilot

* Prefer composition over context providers; colocate WS hooks per view.
* Build a `useRealtimeSession(guid)` hook that returns `{ status, whiteboard, questions, presence }`.
* Normalize assets by `kind` with discriminated unions in TypeScript.
* Add Playwright tests for Host/Participant journeys.
* Gate optional KSESSIONS ingest behind a feature flag.

---

### Appendix A — Example TypeScript Types (excerpt)

```ts
type SessionStatus = 'DRAFT' | 'LIVE' | 'ENDED'

type Asset =
  | { id: string; kind: 'IMAGE'; title: string; content: { url: string; caption?: string; attribution?: string } }
  | { id: string; kind: 'AYAH'; title: string; content: { arabic: string; translation: string; surah: string; ayahNumber: number; tokens?: { text: string; lemma?: string; gloss?: string }[] } }
  | { id: string; kind: 'ETYMOLOGY'; title: string; content: { root: string; forms: string[]; notesHtml?: string } }
  | { id: string; kind: 'HADITH'; title: string; content: { arabic: string; translation: string; source?: string; grade?: string } }
  | { id: string; kind: 'POEM' | 'QUOTE'; title: string; content: { text: string; author?: string; source?: string } }
  | { id: string; kind: 'HTML_BLOCK'; title: string; content: { html: string } }
```

### Appendix B — Example SQL (read‑only probe)

```sql
SELECT TOP (5)
  st.SessionId,
  LEFT(CAST(st.Transcript AS NVARCHAR(MAX)), 500) AS TranscriptSample
FROM dbo.SessionTranscripts st
WHERE st.SessionId = @SessionId;
```

### Appendix C — Example WS Guard (NestJS)

```ts
@SubscribeMessage('host:present')
handlePresent(@ConnectedSocket() client: Socket, @MessageBody() dto: { assetId: string }) {
  this.authz.requireScope(client, `host:${client.data.sessionId}`)
  // ...
}
```
