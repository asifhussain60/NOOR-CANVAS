NOOR CANVAS — Final Journeys + Canonical Asset & Self-Contained Styles
HOST Journey (Host = Admin, single operator)
1) Select & Begin

Open NOOR-CANVAS → pick Album → Category → Session (loads the full HTML transcript from KSESSIONS_DEV.SessionTranscripts.Transcript).

Click BEGIN SESSION:

System mints a session GUID (valid ≤ 3 hours or until you end).

A Host capability token is issued and scoped to this session.

Participants land in Waiting; you go directly to the Host Console (Transcript + Toolbar). You can still see waiting stats in a small panel.

2) Share from the Transcript (no pre-parsing)

The original HTML does not contain Share controls; the app injects a “Share” overlay button (centered at the top) on each recognizable asset block (.ayah-card, hadith, etymology, poetry, image, etc.).

On Share:

We capture that block’s outerHTML.

Sanitize server-side.

Broadcast to all participants via SignalR.

Participants see the exact styled block (our local, bundled CSS reproduces the Beautiful Islam look — no runtime dependency).

3) Share Timer (host-only)

A per-share timer starts (default 3 minutes).

You can override on the fly (No timer / 30s / 1m / 3m / 5m).

Timer is not shown to participants.

On expiry, participants switch to Waiting (minimal, unobtrusive).

4) Live Annotations (how it works on the web)

Overlay architecture: render the shared HTML; mount an SVG overlay above it (Canvas as fallback).

Tools: Laser pointer (transient dots), Underline, Box, Arrow, Pen, Text Highlight (RTL-aware via DOM Range serialization: XPath + offsets).

UX details: Shift = straight lines; Ctrl+Z / Ctrl+Y undo/redo; Eraser/clear; theme-aware colors (2–3) and two weights.

Sync: Vector ops are throttled/coalesced and sent via SignalR (~45 Hz while drawing); round-trip target ≤100ms median.

Lifecycle: Annotations exist only while that asset is shared; they clear on Next/Waiting.

5) Q&A moderation (with reorder)

Q&A panel (host view): pin, hide, mark answered, and drag-to-reorder questions.

Asker identity visible to Host; anonymized for participants.

All questions (text + who asked) are saved in the DB.

6) Roster & Join Control

Host-only roster shows name, country, join time.

Kick (can rejoin) or Ban (cannot rejoin during this session, even with the valid GUID). Logged to AuditLog.

Ban keys off registration_id + fingerprint/IP hashes to prevent trivial rejoin.

7) End Session → Conclusion

Click End Session (confirm).

Participants transition to a Conclusion screen: “Thank you for attending” + a short, reflective Islamic text (calm, minimal), with optional next steps.

The session GUID becomes invalid; late joiners see the error page.

USER Journey (Participant)
1) Registration → Waiting

Follows the session link → Registration (name, country, optional city) → Waiting.

Waiting is subtle and calm (soft background; minimal text). No quotes/rotators here to avoid distraction.

2) Canvas (Live Session)

When the Host begins, the user exits Waiting into the Canvas screen:

A header with session metadata (title, short description, status).

A whiteboard/canvas area — visually styled like a gentle whiteboard/card where shared assets appear.

When the Host shares, the asset fades into this area, styled exactly as intended (via our local bundle).

Host highlights/marks appear in real time.

3) Between Shares

If the Host clears or timer expires, the whiteboard shows a small, unobtrusive “Waiting…” card (respecting prefers-reduced-motion). No quotes here.

4) Q&A (persisted with asker)

Participant can submit and upvote.

DB persistence: store question + registration_id (asker).

Anonymized in the participant list; identity visible only to Host.

5) Conclusion

Smooth transition to “Thank you for attending” with a short, reflective line; optional link(s) as configured.

Canonical Asset HTML (what the Host shares)

We sanitize and broadcast this as-is; styling is provided by NOOR CANVAS’s local CSS bundle, extracted from your legacy styles and packaged in this app.

<div class="ayah-card" id="ayah-card-4-30">
  <div class="golden-surah-header clickable-ayah-header" data-ayats="30" data-original-token="Q|4:30" data-surah="4" id="ayah-header-4-30"><span>Women (4:30)</span></div>
  <p class="ayah-arabic">&rlm; &rlm;وَمَن يَفْعَلْ ذَلكَ عُدْوَنًۭا وَظُلْمًۭا فَسَوْفَ نُصْليه نَارًۭا وَكَانَ ذَلكَ عَلَى ٱللَّه يَسيرًا &lrm; <img class="ayah-number-img fr-fic fr-dii" src="https://myislam.sfo3.digitaloceanspaces.com/assets/2024/03/ayat/ayah-30.png" alt="30">&nbsp;&lrm;</p>
  <div class="translation-header">Translation:.</div>
  <p class="ayah-translation">And whoever does that in aggression and injustice-then we will drive him into a fire. And that, for Allah, is [always] easy.</p>
</div>
<div class="ayah-card" id="ayah-card-5-30-32">
  <div class="golden-surah-header clickable-ayah-header" data-ayats="30-32" data-original-token="Q|5:30-32" data-surah="5" id="ayah-header-5-30-32"><span>The Table Spread (5:30-32).</span></div>
  <p class="ayah-arabic">…</p>
  <div class="translation-header">Translation:.</div>
  <p class="ayah-translation">…</p>
</div>

<div class="inserted-hadees ks-ahadees-container" data-collection="unknown" data-id="128" data-token="H|128" data-type="hadees" id="ahadees-1757439211286-522">
  <button class="delete-hadees-btn ks-ahadees-delete-btn" title="Delete this hadees">✕</button>
  <div class="hadees-header ks-ahadees-header">
    <h4><i class="fa fa-comment ks-ahadees-header-icon" aria-hidden="true"></i>Ali Ibn Abu Talib<span class="ks-ahadees-subject">- Human Potential, Universe, Macrocosm</span></h4>
  </div>
  <div class="hadees-arabic ks-ahadees-arabic">…</div>
  <div class="hadees-english ks-ahadees-english">…</div>
</div>

<div class="etymology-derivative-card">…</div>
<div class="poetry-wrapper">…</div>
<p><img class="fr-fic fr-dib imgResponsive fr-bordered" src="Resources/IMAGES/211/51ab58b2-8ccb-4c74-8a4d-4e55078cea62.jpg"></p>
<table>…</table>

Self-Contained Styling (no dependency on Beautiful Islam at runtime)
What we will extract and localize

Source (one-time migration):
D:\PROJECTS\KSESSIONS\Source Code\Sessions.Spa\Content\styles\

Selectors to support (from the canonical sample & other known assets):

Qur’an/ayah: .ayah-card, .golden-surah-header, .clickable-ayah-header, .ayah-arabic, .ayah-translation, .translation-header, .ayah-number-img

Hadith: .inserted-hadees, .ks-ahadees-container, .ks-ahadees-header, .ks-ahadees-subject, .ks-ahadees-arabic, .ks-ahadees-english, .ks-ahadees-header-icon

Etymology: .etymology-derivative-card, .derivative-root-reference, .derivative-main-display

Poetry: .poetry-wrapper, .froala-poetry-container, .poetry-poet-header, .poetry-couplet, .arabic-text, .text-maroon

Editor leftovers & utilities: .fr-fic, .fr-dii, .fr-dib, .imgResponsive, .fr-bordered, .row, .col-xs-12, .btn, .btn-sm, .btn-primary, .text-center, .text-muted, .h3

Local bundles in NOOR CANVAS (example layout):

web/styles/noor-core.css (typography, RTL, color tokens, whiteboard/canvas chrome)

web/styles/noor-ayah.css

web/styles/noor-hadith.css

web/styles/noor-etymology.css

web/styles/noor-poetry.css

web/styles/noor-editor-compat.css (Froala class compatibility)

web/styles/noor-share-overlay.css (the injected Share button + host toolbar)

Fonts, icons, images

Bundle Arabic/Latin fonts locally (e.g., Amiri, Noto Naskh, Inter) and update CSS to reference local paths.

Replace any CDN icon/font refs (e.g., Font Awesome) with locally packaged assets, or swap to lucide/SVG where needed.

Copy any images referenced by CSS into /public/assets/… and rewrite URLs.

Normalizing inline styles

Where transcripts contain inline styles (gradients, borders), we migrate to classes in our bundle for consistency and theming.

Sanitization strips unsafe attributes while preserving required presentation.

Acceptance criteria (styling)

A fresh NOOR CANVAS instance renders the canonical asset HTML pixel-faithfully (within reasonable font differences) without loading any CSS/JS from the original app.

No external network calls for fonts/icons/images (besides asset images embedded in the content itself, which you control).

Arabic RTL text renders with correct ligatures and spacing; contrast meets WCAG 2.2 AA.

The injected Share overlay and the Host toolbar are fully styled by our local bundle.

Real-Time & Persistence (essentials)

SignalR events (server → clients)
whiteboard:update { mode:'shared'|'waiting'|'ended', assetId?, html?, transition?, timerMs? }
annotation:ops { ops: AnnotationOp[] }

SignalR (Host → server)
host:share { assetId, html, timerMs?, transition? }
host:annotation { ops: AnnotationOp[] }
host:clearAnnotations {}
host:kick { registrationId } · host:ban { registrationId, reason? }

DB (questions persisted with asker)
Question(id, session_id, registration_id, text, status, upvotes, order_index, created_at)

Performance, A11y, and UX Guarantees

Share → render: ≤ 200ms P95 to participants.

Annotations: ≤ 100ms median round-trip; ≥ 45fps perceived drawing.

Timer: host-only; participants see either asset or subtle waiting.

A11y: keyboardable controls, ARIA live regions for “shared/cleared”, honors prefers-reduced-motion, WCAG 2.2 AA.

How to send changes (fastest formats)

One-liners:
ADD: Pause/Resume timer button.
MODIFY: Default timer 3m → 2m.
REMOVE: Presence count from Waiting.

Mini-spec block:

Change: Pause/Resume share timer
Type: Add
Sections: Host Toolbar, Whiteboard State
Spec: Toggle pauses countdown; broadcast paused flag; participants stay on asset
AC: Pause/resume propagates ≤200ms; resumes remaining time correctly
Priority: High


Inline edits:
“Timer is 3 minutes [replace → 2 minutes].”
“Waiting shows no quotes [insert → just one-line message].”