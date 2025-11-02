# KDS Context Continuity & View Mapping System

**Created:** 2025-11-02  
**Version:** 1.0  
**Audience:** Developers using KDS for feature work

---

## 🔄 Part 1: How KDS Maintains Context Across Chats

### The Continuity Mechanism

When you reference a file like `HostControlPanel.razor` and use the plan prompt:

```markdown
User: #file:.github/prompts/user/plan.md
      "Continue working on the FAB button in HostControlPanel.razor - add animation when questions arrive"
```

**What Happens Behind the Scenes:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Intent Router (Entry Point)                            │
├─────────────────────────────────────────────────────────────────┤
│ • Receives your natural language prompt                        │
│ • Detects keywords: "continue", "FAB button", file reference   │
│ • Routes to Work Planner agent                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Session State Check                                    │
├─────────────────────────────────────────────────────────────────┤
│ • Reads: .github/sessions/current-session.json                 │
│ • Finds active key: "fab-button-host-control-panel"           │
│ • Discovers: Last worked on 2 days ago, status: in-progress   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Full History Retrieval                                 │
├─────────────────────────────────────────────────────────────────┤
│ Loads from: .github/keys/fab-button-host-control-panel/        │
│                                                                 │
│ • plan.md           → Original feature specification          │
│ • work-log.md       → All completed tasks (15 entries)        │
│ • handoffs.md       → Cross-chat context (3 sessions)         │
│ • state.json        → Current implementation state            │
│                                                                 │
│ Result: Agent knows EVERYTHING done so far                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Plan Extension (Not Fresh Start)                       │
├─────────────────────────────────────────────────────────────────┤
│ Work Planner:                                                   │
│ ✅ Reads existing plan.md                                      │
│ ✅ Reviews work-log.md (sees FAB button already exists)        │
│ ✅ Adds NEW task: "Animate FAB button on question arrival"     │
│ ✅ Preserves existing context (button ID, event handlers)      │
│                                                                 │
│ ❌ DOES NOT start fresh                                        │
│ ❌ DOES NOT recreate existing button                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Execution with Historical Knowledge                    │
├─────────────────────────────────────────────────────────────────┤
│ Code Executor:                                                  │
│ • Knows FAB button ID: "content-fab-share-btn"                 │
│ • Knows existing CSS: .hcp-fab-share-button                    │
│ • Knows SignalR handler: HandleQuestionReceivedAsync()         │
│ • Adds ONLY animation logic (pulse effect on new question)     │
└─────────────────────────────────────────────────────────────────┘
```

### Key Discovery: Context Preservation

**You Get Continuity Because:**
1. **Session State Tracking** - `current-session.json` maintains active work reference
2. **Key-Based History** - All previous work stored in `.github/keys/{key-name}/`
3. **Similarity Matching** - Even if you say "FAB button feature" instead of exact key name, KDS matches it (70% threshold)
4. **Cross-Chat Handoffs** - `handoffs.md` preserves context between different chat sessions

**You Do NOT Get Fresh Start Unless:**
- No existing key matches your prompt (< 70% similarity)
- You explicitly say "start fresh" or "new feature"
- Session state has no active work reference

---

## 📚 Part 2: Centralized Architecture Knowledge

KDS v4.4 has **three levels** of architectural knowledge storage:

### Level 1: Published Patterns (Reusable Across Features)

**Location:** `.github/knowledge/`

```
.github/knowledge/
├── test-patterns/
│   └── playwright-element-selection.md      # HOW to select UI elements reliably
├── test-data/
│   └── session-212-canonical-data.md        # WHAT test data to use
├── ui-mappings/
│   └── host-control-panel-elements.md       # UI element ID mapping (see Part 3)
└── workflows/
    ├── zoom-integration-flow.md             # Complete workflow patterns
    └── participant-registration-flow.md
```

**How to Publish:**
After successfully implementing a pattern:
```
@workspace /execute #file:.github/prompts/shared/publish.md
```

**Guardrails (v4.3):**
- Max 10 patterns per category
- Minimum 80% success rate
- Minimum 3 reuse count
- Auto-reject duplicates >85% similarity
- 90-day sunset policy (unused patterns archived)

### Level 2: Documentation (Design Reference)

**Location:** `.github/docs/`

```
.github/docs/
├── architecture/
│   ├── KDS-DESIGN.md                        # SINGLE SOURCE OF TRUTH
│   ├── KDS-V3-IMPLEMENTATION-PLAN.md        # Industry best practices
│   └── KDS-ANTI-PATTERNS.md                 # What NOT to do (v2.1.0 lessons)
├── database/
│   └── schema.md                            # Database structure
├── api/
│   └── api-contracts.md                     # API endpoint documentation
├── testing/
│   └── playwright-guide.md                  # Test writing guide
└── guides/
    └── quick-start.md                       # Getting started
```

**Golden Rule:** NO .md files in `.github/` root except `README.md` and `KDS-DESIGN.md`

### Level 3: Feature-Specific Knowledge (Per-Key History)

**Location:** `.github/keys/{key-name}/`

```
.github/keys/fab-button-host-control-panel/
├── plan.md                 # Original feature specification
├── work-log.md             # Chronological implementation log
├── handoffs.md             # Cross-chat context preservation
├── state.json              # Current implementation state
└── test-results/           # Test execution evidence
    └── 2025-11-01-test-run.json
```

**Access Pattern:**
```markdown
# In any chat, reference existing work:
@workspace /execute #file:.github/keys/fab-button-host-control-panel/handoffs.md
```

---

## 🗺️ Part 3: HostControlPanel.razor View Mapping

### Component Hierarchy

```
HostControlPanel.razor (Page)
├── HostControlPanelHeader.razor          # Session info, SignalR status
├── ErrorDisplay.razor                     # Error panel (ID: noor-error-panel)
├── HostControlPanelSidebar.razor         # Pre-session controls
│   └── UserRegistrationLink.razor         # Canvas type selection
├── HostControlPanelContent.razor         # Main content area
│   ├── Transcript Panel (70% / 100%)
│   └── Q&A Panel (30% / hidden)
└── HostControlPanelModal.razor           # Delete confirmation
```

### Critical Element IDs (For Playwright Tests)

**Refactored with `[REFACTOR:hcp-id]` annotations - November 2025**

#### Session Controls
| Element | ID | Location | Purpose |
|---------|-----|----------|---------|
| Start Session Button | `sidebar-start-session-btn` | HostControlPanelSidebar | Initiates session |
| End Session Button | `content-end-session-btn` | HostControlPanelContent | Terminates session |
| Q&A Toggle Button | `content-qa-toggle-btn` | HostControlPanelContent | Shows/hides Q&A panel |

#### FAB Button System
| Element | ID | Location | Purpose |
|---------|-----|----------|---------|
| FAB Share Button | `content-fab-share-btn` | HostControlPanelContent | Broadcasts transcript |

#### Transcript Area
| Element | ID | Location | Purpose |
|---------|-----|----------|---------|
| Transcript Container | `content-transcript-container` | HostControlPanelContent | Main content area |

#### Q&A Panel
| Element | ID | Location | Purpose |
|---------|-----|----------|---------|
| Q&A Panel Container | `content-qa-panel` | HostControlPanelContent | Questions sidebar |
| Share Question Button | `qa-share-{Index}` | QuestionCard | Broadcasts question |
| Mark Answered Button | `qa-answered-{Index}` | QuestionCard | Removes question |
| Delete Question Button | `qa-delete-{Index}` | QuestionCard | Deletes question |

#### Error Handling
| Element | ID | Location | Purpose |
|---------|-----|----------|---------|
| Error Panel | `noor-error-panel` | ErrorDisplay | Error container |
| Error Details | `error-details` | ErrorDisplay | Stack trace |

#### Security
| Element | ID | Location | Purpose |
|---------|-----|----------|---------|
| Security Alert Overlay | `hcp-security-alert-overlay` | HostControlPanel | Production DB mismatch |
| Security Alert Card | `hcp-security-alert-card` | HostControlPanel | Alert content |

### Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ HostControlPanel.razor (Parent)                                 │
├──────────────────────────────────────────────────────────────────┤
│ State Management:                                                │
│ • SessionId (int?)                - Derived from HostToken       │
│ • Model (HostControlPanelViewModel) - Session data              │
│ • selectedQuestionId (Guid?)     - Currently shared question     │
│ • qaPanelOpen (bool)             - Q&A panel visibility          │
│ • sessionStartTime (DateTime?)   - For elapsed timer             │
│ • selectedCanvasType (string)    - "asset" or "transcript"       │
│                                                                  │
│ SignalR Events:                                                  │
│ • QuestionReceived              → HandleQuestionReceivedAsync()  │
│ • HostQuestionUpdated           → HandleHostQuestionUpdatedAsync()│
│ • HostQuestionDeleted           → HandleHostQuestionDeletedAsync()│
│ • TranscriptUpdated             → HandleTranscriptUpdatedAsync() │
│ • VoteUpdateReceived            → HandleVoteUpdateReceivedAsync()│
└──────────────────────────────────────────────────────────────────┘
                              ↓ Parameters
┌──────────────────────────────────────────────────────────────────┐
│ HostControlPanelContent.razor (Child)                           │
├──────────────────────────────────────────────────────────────────┤
│ Receives via [Parameter]:                                        │
│ • Model (read-only)                                              │
│ • HostToken (read-only)                                          │
│ • SessionStartTime (read-only)                                   │
│ • SelectedQuestionId (read-only)                                 │
│ • QAPanelOpen (read-only)                                        │
│                                                                  │
│ Callback Events:                                                 │
│ • OnEndSession              → EndSession()                       │
│ • OnBroadcastTranscript     → BroadcastFullTranscript()          │
│ • OnMarkQuestionAnswered    → MarkQuestionAnswered(Guid)         │
│ • OnShowDeleteModal         → ShowDeleteModal(Guid)              │
│ • OnQuestionClick           → ShareQuestionAsset(QuestionItem)   │
│ • OnToggleQAPanel           → ToggleQAPanel()                    │
└──────────────────────────────────────────────────────────────────┘
```

### Service Injection Pattern

**HostControlPanel.razor uses:**
```csharp
@inject IHttpClientFactory HttpClientFactory
@inject IJSRuntime JSRuntime
@inject NavigationManager Navigation
@inject ILogger<HostControlPanel> Logger
@inject SessionStateService SessionStateService
@inject SafeHtmlRenderingService SafeHtmlRenderer
@inject UnifiedHtmlTransformService HtmlTransform
@inject AssetProcessingService AssetProcessor
@inject IMediaUrlTransformService MediaUrlTransform
@inject IDatabaseEnvironmentGuardService DbGuard
@inject TranscriptProcessingService TranscriptProcessor
@inject IAssetSharingService AssetSharing
@inject IQuestionManagementService QuestionManagement
@inject SignalRMiddleware SignalRService
```

**Service Responsibilities:**
- **AssetSharing** - ShareAssetAsync() for individual assets
- **QuestionManagement** - LoadQuestionsAsync(), ShareQuestionAsync(), DeleteQuestionAsync()
- **TranscriptProcessor** - TransformForBroadcastAsync()
- **SafeHtmlRenderer** - RenderSafeHtml() to prevent XSS
- **DbGuard** - CheckEnvironmentMismatch() production safety

### CSS Class System

**Custom CSS File:** `wwwroot/css/host-control-panel.css`

```css
/* Main containers */
.host-main-container       /* Flex container for transcript + Q&A */
.host-transcript-panel     /* Left panel (70% / 100% width) */
.qa-panel                  /* Right panel (30% / hidden) */

/* FAB button */
.hcp-fab-share-button      /* Floating action button */

/* Content areas */
.html-viewer-content       /* Transcript rendering */
.session-transcript-content /* Islamic content theme */

/* Question cards */
.question-card             /* Individual question container */
.question-text             /* Question text styling */
.question-actions          /* Button row */

/* Buttons */
.end-session-button        /* Red terminate button */
```

### Playwright Test Selector Strategy

**Published Pattern:** `.github/knowledge/test-patterns/playwright-element-selection.md`

**Priority Order:**
1. **data-testid** (RECOMMENDED) - Not yet implemented
2. **Unique IDs** (CURRENT) - `#content-fab-share-btn`, `#qa-share-0`
3. **ARIA roles** (Fallback) - `button[aria-label="Broadcast transcript"]`
4. **CSS classes** (Avoid) - Fragile, changes with styling

**Example Test Code:**
```typescript
// Recommended (when data-testid added per Rule #15)
await page.getByTestId('fab-share-button').click();

// Current approach (unique IDs)
await page.locator('#content-fab-share-btn').click();

// Dynamic IDs (question cards)
await page.locator('#qa-share-0').click(); // First question
await page.locator('#qa-delete-1').click(); // Second question delete
```

---

## 🎯 Part 4: How This All Works Together

### Real-World Scenario: Adding FAB Button Animation

**Chat 1 (October 28):** Created FAB button
```
User: #file:.github/prompts/user/plan.md
      "Add FAB button to HostControlPanel for broadcasting transcript"

KDS Created:
• Key: fab-button-host-control-panel
• File: HostControlPanel.razor (added #content-fab-share-btn)
• CSS: .hcp-fab-share-button
• Event: OnBroadcastTranscript callback
```

**Chat 2 (November 1):** Add animation (YOU ARE HERE)
```
User: #file:.github/prompts/user/plan.md
      "Continue FAB button work - animate button when questions arrive"

KDS Process:
1. Finds existing key: fab-button-host-control-panel
2. Loads work-log.md (sees button already exists)
3. Adds task: "Animate FAB on QuestionReceived event"
4. Code Executor:
   • Finds existing button ID: #content-fab-share-btn
   • Adds CSS animation: @keyframes pulse
   • Updates HandleQuestionReceivedAsync() to trigger animation
   • DOES NOT recreate button
```

**Chat 3 (Future):** Playwright test
```
User: #file:.github/prompts/user/test.md
      "Test FAB button animation when question arrives"

KDS Process:
1. Reads .github/knowledge/test-patterns/playwright-element-selection.md
2. Sees recommended pattern: Use unique IDs
3. Finds button ID from work-log.md: #content-fab-share-btn
4. Generates test:
   • Trigger SignalR QuestionReceived event
   • Check for animation class presence
   • Verify pulse effect CSS applied
```

### View Mapping Benefits

**When KDS knows the element IDs:**
- ✅ Generates accurate Playwright selectors
- ✅ Avoids recreating existing elements
- ✅ Preserves CSS class names
- ✅ Maintains event handler bindings

**Published to Knowledge Base:**
```
After FAB button stabilizes (3+ successful uses):

@workspace /execute #file:.github/prompts/shared/publish.md

Creates: .github/knowledge/ui-mappings/host-control-panel-elements.md

Content:
# Host Control Panel - UI Element Mapping

| Element | ID | CSS Class | Purpose | Test Selector |
|---------|-----|-----------|---------|---------------|
| FAB Share Button | content-fab-share-btn | hcp-fab-share-button | Broadcast transcript | #content-fab-share-btn |
| Q&A Toggle | content-qa-toggle-btn | (inline styles) | Show/hide questions | #content-qa-toggle-btn |
...
```

---

## 📋 Summary

### Context Continuity (Part 1)
- KDS **preserves** all previous work via session state + key history
- You **do NOT** get a fresh start unless <70% similarity match
- Natural language prompts automatically resume existing work

### Architecture Knowledge (Part 2)
- **Level 1:** Published patterns (`.github/knowledge/`) - reusable across features
- **Level 2:** Documentation (`.github/docs/`) - design reference
- **Level 3:** Feature history (`.github/keys/{key}/`) - per-feature context

### View Mapping (Part 3)
- **15+ unique IDs** in HostControlPanel for test automation
- **Component hierarchy** (Page → Header → Sidebar → Content)
- **Service injection** (11 services for separation of concerns)
- **CSS system** (custom classes in host-control-panel.css)

### Integration (Part 4)
- KDS **loads existing IDs** from work-log.md before generating code
- Test agents **reference published UI mappings** for selectors
- Architecture knowledge **prevents duplicate patterns**

---

## 🔗 Related Documents

- [KDS-LIFECYCLE-DEMO.md](./KDS-LIFECYCLE-DEMO.md) - Complete feature walkthrough
- [KDS-USER-QUICK-START.md](./KDS-USER-QUICK-START.md) - 5 command reference
- [KDS-ACTIVATION-AND-KEY-MANAGEMENT.md](./KDS-ACTIVATION-AND-KEY-MANAGEMENT.md) - Technical architecture
- [.github/knowledge/test-patterns/playwright-element-selection.md](../.github/knowledge/test-patterns/playwright-element-selection.md) - Selector strategies
- [.github/KDS-DESIGN.md](../.github/KDS-DESIGN.md) - SINGLE SOURCE OF TRUTH

**Last Updated:** 2025-11-02  
**KDS Version:** 4.4.0  
**Document Owner:** KDS Documentation Team
