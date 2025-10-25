# Questionnaire: zoom-integration

**Status**: Awaiting Answers  
**Created**: 2025-10-25 10:45:00  
**Plan Version**: 1.0

---

## Instructions

1. **Mark your choice** with an `X` between the brackets: `[X]`
2. **Save the file** after marking answers
3. **Tell agent** "questionnaire complete" to continue planning

---

## Questions

### Q1: Zoom SDK Credentials Availability

**Why we're asking**: We need to know if Zoom credentials exist to determine whether to include setup instructions in Phase 1 or defer integration until credentials are obtained. This affects the first commit and documentation structure.

**Options** (mark ONE with X):
- [ ] **A.** Yes, I have Zoom SDK credentials (ClientId/ClientSecret)
  - *Pros*: Can proceed immediately, no delays, full integration possible in this session
  - *Cons*: None
  - *Effort*: Low (just configuration in User Secrets/Environment Variables)

- [ ] **B.** No, need to create Zoom Marketplace app first
  - *Pros*: Proper setup from start, follows Zoom best practices, production-ready credentials
  - *Cons*: Additional setup time (30-60 min), delays integration implementation
  - *Effort*: Medium (Zoom Marketplace setup + credential generation + app approval)

- [ ] **C.** Have test credentials, need production credentials later
  - *Pros*: Can start development now, production setup deferred, parallel work possible
  - *Cons*: Two-phase credential management, potential config differences dev vs prod
  - *Effort*: Low now, Medium later (two credential setup sessions)

**Your Answer**: *(will be extracted after you mark X)*

---

### Q2: Zoom Meeting Creation Strategy

**Why we're asking**: This determines the host workflow, database schema requirements (ZoomMeetingId storage), API integration complexity, and user experience. Auto-creation requires Zoom REST API integration; manual entry is simpler but less automated.

**Options** (mark ONE with X):
- [ ] **A.** Auto-create Zoom meetings when host starts session
  - *Pros*: Seamless UX, no manual steps, automatic meeting IDs, host can't make typos, meeting metadata available
  - *Cons*: Requires Zoom API integration, meeting cleanup needed, API rate limits, error handling complexity
  - *Effort*: High (Zoom REST API calls, OAuth flow, error handling, cleanup logic, testing)

- [ ] **B.** Host manually enters existing Zoom meeting IDs
  - *Pros*: Simple implementation, no Zoom API needed, full host control, works with external meetings
  - *Cons*: Extra host step, potential typos, no meeting metadata sync, can't validate meeting exists
  - *Effort*: Low (just input field + basic validation + database storage)

- [ ] **C.** Hybrid: Auto-create with manual override option
  - *Pros*: Best of both worlds, flexibility, graceful degradation if API fails, host can use existing meetings
  - *Cons*: More complex UI, both code paths needed, maintenance burden
  - *Effort*: High (combines A + B, plus toggle logic and state management)

**Your Answer**: *(will be extracted after you mark X)*

---

### Q3: Link Sharing and Token Strategy

**Why we're asking**: This affects participant UX, URL structure, security model, and how Zoom access is communicated. Single token is simpler; separate links give more control; embedded button is most seamless.

**Options** (mark ONE with X):
- [ ] **A.** Single token URL with auto-detect (e.g., `/session/{token}` shows Zoom if available)
  - *Pros*: Simplest for users, one link to share, automatic Zoom detection, no confusion
  - *Cons*: Less control over Zoom access, can't share session without Zoom separately
  - *Effort*: Low (conditional rendering in SessionCanvas.razor based on session data)

- [ ] **B.** Separate Zoom invite link generation (e.g., `/session/{token}/zoom`)
  - *Pros*: Explicit control, can share session vs Zoom separately, clear intent, easier testing
  - *Cons*: Two URLs to manage, potential user confusion, more complex link generation
  - *Effort*: Medium (new route, link generation logic, UI for both links)

- [ ] **C.** Embedded "Join Zoom" button in participant canvas (RECOMMENDED in draft plan)
  - *Pros*: Most seamless, familiar NoorCanvas interface first, Zoom loads in-page, no redirect, conditional UI
  - *Cons*: Requires Zoom SDK JavaScript interop, larger page weight, more complex frontend
  - *Effort*: Medium (Zoom SDK integration, button component, JavaScript interop, modal/embed logic)

**Your Answer**: *(will be extracted after you mark X)*

---

### Q4: Recording Storage Location

**Why we're asking**: This determines infrastructure requirements, cost implications, storage capacity planning, and compliance considerations (GDPR, data residency). Zoom Cloud is easiest but costs money per recording; local requires server storage; external cloud needs integration.

**Options** (mark ONE with X):
- [ ] **A.** Zoom Cloud (default, requires Zoom subscription)
  - *Pros*: No infrastructure needed, automatic retention, Zoom manages storage, easy access via Zoom API
  - *Cons*: Monthly cost per recording, subject to Zoom's data policies, limited to Zoom's retention period
  - *Effort*: Low (no additional code, just enable in Zoom settings)

- [ ] **B.** Local server download after meeting ends
  - *Pros*: Full control, no recurring costs, unlimited retention, data sovereignty
  - *Cons*: Requires storage space, bandwidth for downloads, cleanup logic needed, download delays
  - *Effort*: High (Zoom webhook integration, download automation, storage management, cleanup jobs)

- [ ] **C.** External cloud storage (S3, Azure Blob, etc.)
  - *Pros*: Scalable, cost-effective, integrates with existing cloud, compliance-ready, CDN-friendly
  - *Cons*: Requires cloud account, download-then-upload flow, additional integration, cost monitoring
  - *Effort*: High (Zoom download + cloud upload pipeline, error handling, credentials management)

- [ ] **D.** Defer recording storage decision (implement Zoom join/leave only, no recording in Phase 1)
  - *Pros*: Fastest initial integration, can evaluate needs after testing, defer infrastructure costs
  - *Cons*: No recording capability initially, may need to revisit architecture later
  - *Effort*: None for Phase 1 (just remove recording UI from scope)

**Your Answer**: *(will be extracted after you mark X)*

---

## Drift Questions

*(No drift questions detected yet for this key)*

---

## Answered Questions Archive

*(Empty - no questions answered yet)*

---

**Next Steps**: After marking your answers, save this file and say "questionnaire complete"
