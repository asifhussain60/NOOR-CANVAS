# KDS Governance Rules v4.4.0
**Version:** 4.3.0  
**Format:** Structured for GitHub Copilot agents  
**Companion:** `KDS/KDS-DESIGN.md` (human-readable)

**⚠️ CRITICAL: ALL rules are MANDATORY during task execution. Copilot MUST enforce without user reminders.**

---

## RULE #1: Dual Interface Enforcement

```yaml
rule_id: DUAL_INTERFACE
severity: CRITICAL
scope: ALL_PROMPTS

validation:
  user_prompts:
    location: prompts/user/
    format: human_readable
    technical_details: FORBIDDEN
    examples:
      - plan.md
      - execute.md
      - test.md
    
  internal_agents:
    location: prompts/internal/
    format: machine_readable
    validation_logic: REQUIRED
    examples:
      - intent-router.md
      - work-planner.md
      - code-executor.md

enforcement:
  - NEVER expose technical validation in user prompts
  - ALWAYS use templates for user output
  - Internal agents INCLUDE full validation logic
```

---

## RULE #2: Live Design Document

```yaml
rule_id: LIVE_DESIGN_DOC
severity: CRITICAL
scope: KDS_DESIGN_MD

requirements:
  - UPDATE after EVERY KDS change
  - TRACK all design decisions with date
  - DELETE obsolete sections (trust git)
  - HUMAN_READABLE format for stakeholders

update_workflow:
  step_1: Make KDS change
  step_2: Update KDS-DESIGN.md FIRST
  step_3: Update this file (rules.md) for Copilot
  step_4: Implement code changes
  
validation:
  - KDS-DESIGN.md modification date matches commit date
  - Decision tracked in "Design Decisions" section
  - Change logged in "Change History" section
```

---

## RULE #3: Delete Over Archive

```yaml
rule_id: DELETE_NOT_ARCHIVE
severity: HIGH
scope: FILE_MANAGEMENT

principles:
  - Obsolete files: DELETED immediately
  - Archive folders: FORBIDDEN
  - .old suffixes: FORBIDDEN
  - Git history: PRIMARY archive

forbidden_patterns:
  - KDS/archive/
  - KDS/deprecated/
  - *.old
  - *.backup
  - *_v1, *_v2 (version suffixes)

enforcement:
  when_removing_file:
    - DELETE with git rm
    - Update references
    - Commit with message: "DELETE obsolete {filename} (archived in git)"
```

---

## RULE #4: Function-Based Naming

```yaml
rule_id: FUNCTION_NAMING
severity: MEDIUM
scope: PROMPT_FILES

naming_convention:
  user_prompts: "{action}.md"
    examples:
      - plan.md
      - execute.md
      - test.md
  
  internal_agents: "{verb}-{noun}.md"
    examples:
      - intent-router.md
      - work-planner.md
      - test-generator.md
  
  shared_modules: "{concept}.md"
    examples:
      - validation.md
      - handoff.md
      - test-first.md

forbidden:
  - route.prompt.md (use intent-router.md)
  - plan.prompt.md (use work-planner.md or plan.md for user)
  - generic names (utils.md, helpers.md)
```

---

## RULE #5: KDS Branch Isolation

```yaml
rule_id: KDS_BRANCH_ONLY
severity: CRITICAL
scope: GIT_WORKFLOW

branch: features/kds

pre_commit_validation:
  check_branch: features/kds
  check_files: KDS/** ONLY
  forbidden_files: SPA/**, Tests/**, Scripts/** (outside KDS)

post_merge_action:
  after_merge_to: [development, features/fab-button]
  action: git checkout features/kds
  reason: Keep KDS work isolated

error_messages:
  wrong_branch: "❌ KDS changes ONLY on features/kds branch"
  non_kds_files: "❌ KDS branch ONLY for KDS/ changes"
```

---

## RULE #6: Template-Driven Output

```yaml
rule_id: TEMPLATE_OUTPUT
severity: HIGH
scope: USER_RESPONSES

requirements:
  - ALL user-facing output via templates
  - Location: templates/user-output/
  - Engine: Mustache
  - Variables: {{key}}, {{nextCommand}}, {{timestamp}}

template_files:
  - plan-complete.md
  - phase-complete.md
  - task-complete.md
  - test-ready.md
  - error.md

forbidden:
  - Hardcoded user messages in prompts
  - Inline formatting in agent logic
  - Direct echo/Write-Host without templates

validation:
  check_prompts: No user-facing strings outside templates
  check_templates: All variables defined in schema
```

---

## RULE #7: Document First

```yaml
rule_id: DOCUMENT_FIRST
severity: HIGH
scope: CHANGE_WORKFLOW

sequence:
  1: Update KDS-DESIGN.md (human-readable)
  2: Update governance/rules.md (this file, machine-readable)
  3: Implement code changes
  4: Commit with message format

commit_message_format: |
  {TYPE}: {DESCRIPTION}
  
  Design Doc: Updated
  Rules: Updated
  Files Changed: {list}

types:
  - DESIGN: Design decision
  - REFACTOR: Code restructure
  - FEATURE: New capability
  - FIX: Bug fix
  - DELETE: File removal

validation:
  - KDS-DESIGN.md must be modified in commit
  - governance/rules.md must be modified in commit
  - Code changes come AFTER doc updates
```

---

## RULE #8: Test-First Always

```yaml
rule_id: TEST_FIRST_TDD
severity: CRITICAL
scope: CODE_IMPLEMENTATION

workflow:
  task_1a: Generate test (RED)
  task_1b_n: Implement code (GREEN → REFACTOR)

test_metadata_required: |
  /**
   * TEST METADATA
   * Test Name: {name}
   * Feature: {feature}
   * Session: {sessionId}
   * Orchestration: {scriptPath}
   * Pattern: {patternId}
   */

validation:
  - Task 1a ALWAYS creates test file
  - Test file exists BEFORE implementation files
  - Test initially FAILS (red phase)
  - Implementation makes test PASS (green phase)
  - Refactor while maintaining PASS (refactor phase)
```

---

## RULE #9: Honest Handoffs

```yaml
rule_id: HONEST_HANDOFFS
severity: CRITICAL
scope: AGENT_EXECUTION

principles:
  - Agents NEVER auto-execute
  - User invocation REQUIRED
  - Exception: autoChainTasks = true in config

handoff_format:
  - JSON file in keys/{key}/handoffs/
  - Next command displayed
  - HALT after handoff creation

auto_chain_rules:
  within_phase: IF governance.autoChainTasks = true
  between_phases: ALWAYS require user approval
  countdown: 5 seconds before auto-continue
  
output_format: |
  ✅ Task Complete
  
  **Next Command:**
  @workspace /execute #file:KDS/keys/{key}/handoffs/{next}.json
  
  **Auto-Chain:** Enabled (5s countdown)
  OPTION A: CONTINUE ✅
  OPTION B: HALT (Ctrl+C)
```

---

## RULE #10: Single Source of Truth

```yaml
rule_id: SINGLE_SOURCE
severity: HIGH
scope: SHARED_LOGIC

shared_modules:
  location: prompts/shared/
  files:
    - validation.md
    - handoff.md
    - test-first.md
    - config-loader.md

usage_pattern: |
  <!-- INCLUDE: shared/validation.md#Pre-Execution-Validation -->

forbidden:
  - Copy-paste logic between prompts
  - Duplicate validation code
  - Inline shared patterns

enforcement:
  - Scan for duplicate logic (>5 lines identical)
  - Flag violations in validate.md health check
  - Suggest shared module extraction
```

---

## RULE #11: Zero Build Errors

```yaml
rule_id: ZERO_BUILD_ERRORS
severity: CRITICAL
scope: POST_TASK_VALIDATION

validation_sequence:
  step_1: Execute build command (from config)
  step_2: Check exit code
  step_3: IF errors THEN HALT with report
  step_4: IF success THEN continue

build_command: "{{BUILD_CMD}}" # from kds.config.json

error_handling:
  on_failure:
    - Generate error report
    - Create fix handoff
    - HALT execution
  
  error_report_format: |
    ❌ Build Failed: {error_count} errors
    
    Errors:
    {error_list}
    
    Next Command:
    @workspace /execute #file:KDS/keys/{key}/handoffs/fix-build.json
```

---

## RULE #12: Test Pattern Reuse

```yaml
rule_id: TEST_PATTERN_REUSE
severity: MEDIUM
scope: TEST_GENERATION

workflow:
  step_1: Query tests/index.json for pattern
  step_2: IF pattern found THEN reuse & customize
  step_3: IF no pattern THEN generate new test
  step_4: IF test PASSED THEN publish to registry

registry_structure:
  file: tests/index.json
  schema:
    id: string
    pattern: string (category)
    file: path
    orchestrator: path
    reusable: boolean
    description: string

validation:
  - ALWAYS check registry before generation
  - NEVER create duplicate test patterns
  - UPDATE registry after successful test
```

---

## RULE #13: Documentation Organization

```yaml
rule_id: DOC_ORGANIZATION
severity: MEDIUM
scope: FILE_STRUCTURE

allowed_root_md_files:
  - README.md
  - KDS-DESIGN.md

forbidden_root_md:
  - Any other *.md in KDS/

required_structure:
  docs/:
    - architecture/
    - database/
    - api/
    - testing/
    - guides/

post_request_cleanup:
  step_1: Scan KDS/*.md (exclude README.md, KDS-DESIGN.md)
  step_2: Move violations to docs/
  step_3: Update cross-references
  step_4: Validate compliance

violation_resolution:
  design_docs: → docs/architecture/
  user_guides: → docs/guides/
  db_docs: → docs/database/
  test_docs: → docs/testing/
  api_docs: → docs/api/
```

---

## RULE #14: Publishing Mechanism

```yaml
rule_id: PUBLISH_PATTERNS
severity: HIGH
scope: KNOWLEDGE_SHARING

purpose: |
  Publish successful patterns for Copilot reference across tasks.
  Build institutional knowledge that prevents repeated trial-and-error.

publish_categories:
  test_patterns:
    location: knowledge/test-patterns/
    examples:
      - playwright-element-selection.md
      - api-testing-with-retry.md
      - visual-regression-setup.md
    
  test_data:
    location: knowledge/test-data/
    examples:
      - session-212.md (validated session for testing)
      - pasted-image-test-data.md
      - multi-user-scenario-data.md
    
  ui_mappings:
    location: knowledge/ui-mappings/
    examples:
      - canvas-element-testids.md
      - modal-dialog-selectors.md
      - navigation-menu-ids.md
    
  workflows:
    location: knowledge/workflows/
    examples:
      - zoom-integration-flow.md
      - participant-registration-flow.md
      - annotation-broadcast-workflow.md

publish_workflow:
  step_1: Identify successful pattern
  step_2: Invoke publish.md shared workflow
  step_3: Validate against schema
  step_4: Deduplicate with existing (85% = reject, 60-84% = consolidate)
  step_5: Categorize automatically
  step_6: Save to knowledge/ folder
  step_7: Update knowledge index
  step_8: Update health metrics

when_to_publish:
  - Test passes after multiple attempts (capture what worked)
  - Test data validated across multiple scenarios
  - UI elements reliably selected by Playwright
  - Workflow completes end-to-end successfully
  - Pattern reused 3+ times (minimum reuse threshold)

pattern_format: |
  # Pattern: {Name}
  
  **Category**: {test-patterns | test-data | ui-mappings | workflows}
  **Published**: {YYYY-MM-DD}
  **Success Rate**: {X/Y attempts}
  **Reuse Count**: {number}
  **Last Used**: {YYYY-MM-DD}
  
  ## Context
  {When to use this pattern}
  
  ## Implementation
  {Code/data/configuration}
  
  ## What Worked
  {Successful approaches}
  
  ## What Didn't Work
  {Failed approaches to avoid}
  
  ## Related Patterns
  {Links to related knowledge}

validation:
  - Pattern must have succeeded at least once
  - Must include "What Didn't Work" section
  - Must include success rate data (minimum 80% success rate)
  - Must be deduplicated against existing knowledge
  - Minimum 3 reuse count before publishing

guardrails:
  capacity_limits:
    max_patterns_per_category: 10
    soft_limit_trigger: 8  # Trigger consolidation at 8/10
    consolidation_required_at: 8
    
  deduplication:
    duplicate_threshold: 0.85  # 85% similarity = REJECT
    similar_threshold: 0.60    # 60-84% = CONSOLIDATE
    auto_reject_duplicates: true
    
  quality_gates:
    minimum_success_rate: 0.80  # 80% success rate
    minimum_reuse_count: 3      # Pattern must be reused 3+ times
    evidence_required: true     # Git commits or test results
    
  sunset_policy:
    archive_after_days: 90      # Archive if unused for 90 days
    archive_location: .archived/
    use_git_for_history: true   # Git tracks deprecation, not status flags
    
  anti_bloat:
    alert_at_capacity: 8        # Alert when 8/10 patterns
    consolidation_triggers:
      - three_similar_patterns  # 3+ similar → consolidate to 1
      - category_at_soft_limit  # 8/10 → forced consolidation
      - pattern_success_below_60 # <60% success → deprecate
      
  forbidden_in_prompts:
    - Embedded command examples (all → knowledge/)
    - Inline code snippets (extract to patterns)
    - Duplicate logic (auto-extract to shared/)

monitoring:
  weekly_report:
    - pattern_count_per_category
    - unused_patterns_last_30_days
    - duplicate_candidates  # >60% similarity
    - consolidation_opportunities
    
  monthly_report:
    - kds_health_score  # 0-100
    - rule_count_trend  # Goal: ≤15
    - prompt_count_trend  # Goal: ≤13
    - archive_summary  # Patterns sunset this month
```

---

## RULE #15: UI Test Identifiers & Unique Element IDs (Context-Aware Hybrid)

```yaml
rule_id: UI_TEST_IDS
severity: CRITICAL
scope: UI_CODE_CHANGES

requirement: |
  AUTOMATICALLY add UI element identifiers based on context.
  NO user prompting required. This is AUTOMATIC behavior for ALL UI code generation.
  
  HYBRID APPROACH:
  - Elements with JavaScript DOM manipulation → id + data-testid (DUAL)
  - Pure Blazor/framework components → data-testid ONLY (SINGLE)

context_detection:
  javascript_dom_manipulation_patterns:
    - getElementById()
    - querySelector()
    - querySelectorAll()
    - .focus()
    - .innerHTML = 
    - .textContent =
    - .style.
    - .classList.
    - .addEventListener()
    - .setAttribute()
  
  detection_logic: |
    IF element_id is referenced in JavaScript patterns THEN
      require: BOTH id AND data-testid
    ELSE IF element uses @onclick, @bind, or Blazor directives THEN
      require: data-testid ONLY
    END IF

identifier_strategies:
  dual_identifiers:
    when: "JavaScript DOM manipulation detected"
    attributes:
      id: 
        purpose: "JavaScript targeting, DOM manipulation"
        format: "{component}-{element}-{descriptor}"
        examples:
          - id="noor-error-panel"              # JavaScript: getElementById
          - id="error-message"                  # JavaScript: .innerHTML
          - id="token-input"                    # JavaScript: .focus()
          - id="content-transcript-container"   # JavaScript: querySelector
      
      data_testid:
        purpose: "Playwright test automation, stable selectors"
        format: "{feature}-{element}-{action}"
        examples:
          - data-testid="error-notification-panel"
          - data-testid="error-message-text"
          - data-testid="user-token-input"
          - data-testid="transcript-container"
    
    example: |
      <!-- Error panel with JavaScript manipulation -->
      <div id="noor-error-panel"
           data-testid="error-notification-panel"
           style="display:none">
        <span id="error-message"></span>
      </div>
  
  single_identifier:
    when: "Pure Blazor component (no JavaScript DOM manipulation)"
    attributes:
      data_testid:
        purpose: "Playwright test automation, sufficient for Blazor"
        format: "{feature}-{element}-{action}"
        examples:
          - data-testid="fab-share-button"
          - data-testid="participant-name-input"
          - data-testid="session-start-button"
          - data-testid="qa-toggle-button"
    
    example: |
      <!-- Pure Blazor button (no JavaScript DOM manipulation) -->
      <button data-testid="fab-share-button"
              @onclick="HandleFabClick"
              class="hcp-fab-share-button">
        <i class="fa-solid fa-share"></i>
      </button>

automatic_generation:
  trigger: "ANY UI element creation (button, input, container, panel)"
  
  copilot_behavior: |
    When generating UI code, Copilot MUST:
    1. Scan for JavaScript DOM manipulation patterns in file
    2. For EACH interactive element:
       a. Check if element ID is used in JavaScript
       b. IF yes → Generate id + data-testid (DUAL)
       c. IF no → Generate data-testid ONLY (SINGLE)
    3. NO user reminder needed - this is AUTOMATIC
    4. Document decision rationale in work-log.md
  
  naming_convention_id:
    format: "{component}-{element}-{descriptor}"
    component: "content, qa, sidebar, header, modal, noor, canvas"
    element: "fab, share, delete, start, end, toggle, error, input"
    descriptor: "btn, container, panel, overlay, input, message"
    case: "kebab-case (lowercase with hyphens)"
  
  naming_convention_testid:
    format: "{feature}-{element}-{action}"
    feature: "canvas, participant, annotation, session, zoom, transcript, error"
    element: "save, delete, name, title, connect, share, toggle"
    action: "button, input, icon, header, link, panel, container"
    case: "kebab-case (lowercase with hyphens)"

when_required:
  dual_identifiers_required:
    - Error panels with JavaScript show/hide
    - Input fields with JavaScript .focus()
    - Containers with JavaScript content injection
    - Canvas elements with drawing context
    - Dynamic containers manipulated via JavaScript
    - Elements with addEventListener() in code section
  
  single_identifier_sufficient:
    - Pure Blazor buttons with @onclick
    - Blazor form inputs with @bind
    - Navigation links (pure markup)
    - Display-only containers (no JS manipulation)
    - Static content sections
    - Components using only Blazor directives

automated_workflow:
  step_1_context_detection:
    description: "Scan file for JavaScript DOM manipulation"
    action: "Detect getElementById, querySelector, .focus(), etc."
    output: "List of elements requiring dual identifiers"
  
  step_2_generation:
    description: "Generate identifiers based on context"
    dual_example: |
      <!-- JavaScript DOM manipulation detected -->
      <div id="noor-error-panel"
           data-testid="error-notification-panel"
           style="display:none">
        <span id="error-message"></span>
      </div>
      
      <script>
        const panel = document.getElementById('noor-error-panel');
        const msg = document.getElementById('error-message');
        msg.textContent = 'Error occurred';
      </script>
    
    single_example: |
      <!-- Pure Blazor component -->
      <button data-testid="fab-share-button"
              @onclick="HandleFabClick"
              aria-label="Share transcript">
        <i class="fa-solid fa-share"></i>
      </button>
  
  step_3_documentation:
    description: "Auto-document in work-log.md"
    format: |
      - Created element: {element_type}
      - Strategy: {DUAL|SINGLE}
      - Reason: {JavaScript manipulation|Pure Blazor}
      - ID: {unique_id} (if DUAL)
      - data-testid: {testid_value}
      - Purpose: {description}
  
  step_4_publishing:
    description: "Auto-publish to ui-mappings/ after 3+ elements"
    trigger: "Component has 3+ identifiers"
    action: "Create knowledge/ui-mappings/{component}-elements.md"
  
  step_5_test_generation:
    description: "Use appropriate selector in Playwright tests"
    selector_strategy:
      dual_elements: "Prefer data-testid for test stability"
      single_elements: "Use data-testid (only option)"
      fallback: "ARIA label if no data-testid"

validation:
  pre_commit:
    - Scan changed .razor, .cshtml, .html, .vue, .tsx files
    - Detect JavaScript DOM manipulation patterns
    - Verify DUAL strategy for JS-manipulated elements
    - Verify SINGLE strategy for pure Blazor elements
    - Check naming convention compliance
    - Flag elements missing required identifiers
  
  post_implementation:
    - Verify unique IDs are truly unique (no duplicates)
    - Test Playwright can select all elements via data-testid
    - Publish UI mappings to knowledge/
    - Update component documentation with strategy decisions

forbidden_patterns:
  selectors:
    - CSS class names (.btn-primary) - classes change with styling
    - Tag names (button) - too generic
    - Text content (contains("Save")) - text changes, i18n breaks
    - XPath - fragile, hard to maintain
    - nth-child/nth-of-type - breaks on DOM reorder
  
  id_patterns:
    - Generic IDs (button1, div2, container3)
    - Auto-generated GUIDs as IDs (non-semantic)
    - IDs without component context
  
  over_engineering:
    - Adding id when data-testid is sufficient
    - Dual identifiers for static display-only elements
    - data-testid on every single <div> and <span>

benefits_of_hybrid_approach:
  efficiency:
    - 40% less verbose than always-dual approach
    - Cleaner markup for pure Blazor components
    - No redundant attributes
  
  separation_of_concerns:
    - id = Production JavaScript needs
    - data-testid = Testing needs
    - Changes in one don't affect the other (when both exist)
  
  test_stability:
    - data-testid never changes for production reasons
    - JavaScript refactoring doesn't break tests
    - Framework migration safe (Blazor → React)
  
  no_external_dependencies:
    - Detection uses native PowerShell regex
    - No npm packages required
    - No cloud services needed
    - Fully local implementation

error_messages:
  missing_dual_for_js: |
    ❌ Element has JavaScript DOM manipulation but missing id
    
    File: {file_path}
    Element: {element_type} on line {line_number}
    JavaScript pattern detected: {pattern}
    Has: data-testid="{current_testid}"
    
    Fix: Add id="{suggested-id}"
    Reason: This element is manipulated via JavaScript
  
  unnecessary_dual: |
    ⚠️  Element has DUAL identifiers but no JavaScript manipulation
    
    File: {file_path}
    Element: {element_type} on line {line_number}
    Has: id="{current_id}" AND data-testid="{current_testid}"
    
    Recommendation: Remove id, keep data-testid only
    Reason: Pure Blazor component doesn't need id attribute
  
  missing_testid: |
    ❌ UI element missing data-testid attribute
    
    File: {file_path}
    Element: {element_type} on line {line_number}
    Has: id="{current_id}" (optional)
    
    Fix: Add data-testid="{suggested-testid}"
    Reason: ALL interactive elements need data-testid for Playwright

examples:
  dual_identifier_case:
    code: |
      <!-- Error notification with JavaScript manipulation -->
      <div id="noor-error-panel"
           data-testid="error-notification-panel"
           style="display:none">
        <span id="error-message" data-testid="error-message-text"></span>
        <span id="error-timestamp" data-testid="error-timestamp-text"></span>
        <button data-testid="error-close-button" @onclick="CloseError">
          Close
        </button>
      </div>
      
      <script>
        function showError(message) {
          const panel = document.getElementById('noor-error-panel');
          const msg = document.getElementById('error-message');
          msg.textContent = message;
          panel.style.display = 'block';
        }
      </script>
    
    explanation: |
      - Panel: id (JS shows/hides) + data-testid (Playwright)
      - Message span: id (JS sets text) + data-testid (Playwright)
      - Timestamp span: id (JS sets text) + data-testid (Playwright)
      - Close button: data-testid ONLY (Blazor @onclick, no JS manipulation)
  
  single_identifier_case:
    code: |
      <!-- FAB button - Pure Blazor -->
      <button data-testid="fab-share-button"
              @onclick="HandleFabClick"
              class="hcp-fab-share-button"
              aria-label="Share transcript">
        <i class="fa-solid fa-share"></i>
      </button>
      
      <!-- Participant input - Pure Blazor -->
      <input data-testid="participant-name-input"
             @bind="ParticipantName"
             type="text"
             placeholder="Enter name" />
      
      <!-- Navigation link - Pure markup -->
      <a data-testid="session-list-link" href="/sessions">
        View All Sessions
      </a>
    
    explanation: |
      - FAB button: data-testid only (Blazor handles @onclick)
      - Input field: data-testid only (Blazor @bind)
      - Link: data-testid only (static markup, no JS)
  
  invalid_naming: |
    ❌ Invalid identifier naming
    
    Current id: id="{current_id}"
    Current data-testid: data-testid="{current_testid}"
    
    Expected format:
    id: {component}-{element}-{descriptor}
    data-testid: {feature}-{element}-{action}
    
    Suggested:
    id="{suggested_id}"
    data-testid="{suggested_testid}"

copilot_mandate:
  no_user_prompting: |
    Copilot MUST NOT wait for user to request IDs.
    ID generation is AUTOMATIC for ALL UI code.
    This rule executes WITHOUT explicit user instruction.
  
  enforcement: "Pre-commit hook REJECTS UI changes without identifiers"
```

---

## RULE #16: Mandatory Post-Task Execution

```yaml
rule_id: MANDATORY_POST_TASK
severity: CRITICAL
scope: ALL_TASK_COMPLETIONS

purpose: |
  ENFORCE automatic cleanup, publishing, and verification after EVERY task.
  Copilot MUST execute these steps WITHOUT user reminders.
  These are NOT optional - they are REQUIRED for task completion.

mandatory_sequence:
  step_1_build_validation:
    description: Zero build errors
    action: Run build command from kds.config.json
    on_failure: HALT and create fix handoff
    rule_reference: Rule #11
  
  step_2_pattern_publishing:
    description: Auto-publish successful patterns
    triggers:
      - Test passed after 2+ attempts → publish to test-patterns/
      - New UI elements with data-testid → publish to ui-mappings/
      - Validated test data used → publish to test-data/
      - End-to-end workflow completed → publish to workflows/
    action: Invoke prompts/shared/publish.md automatically
    rule_reference: Rule #14
    skip_condition: Pattern already published (deduplication check)
  
  step_3_cleanup:
    description: Delete clutter, trust git for archive
    actions:
      - Scan for archive/, deprecated/, *.old, *.backup patterns
      - DELETE forbidden patterns (git rm)
      - Remove empty directories
      - Clean up temporary files in keys/{key}/
    rule_reference: Rule #3
    forbidden_actions:
      - Creating archive folders
      - Renaming files with .old suffix
      - Moving files to deprecated/
  
  step_4_reorganization:
    description: Enforce folder structure compliance
    actions:
      - Scan KDS/*.md (exclude README.md, KDS-DESIGN.md)
      - Move misplaced docs to docs/ subfolders
      - Update cross-references automatically
      - Verify all files in correct locations
    rule_reference: Rule #13
    validation:
      - docs/ subfolders: architecture, database, api, testing, guides
      - prompts/ structure: user/, internal/, shared/
      - knowledge/ structure: test-patterns, test-data, ui-mappings, workflows
  
  step_5_kds_verification:
    description: Verify KDS performance, consistency, zero redundancy, knowledge health
    checks:
      redundancy:
        - Scan for duplicate logic (>5 lines identical across prompts)
        - Flag duplicate rules (same rule_id in multiple files)
        - Check for copy-paste patterns
        - Check for embedded examples in prompts (FORBIDDEN)
        action_on_violation: Extract to prompts/shared/ or knowledge/, update references
      
      conflicts:
        - Validate KDS-DESIGN.md rule count = governance/rules.md rule count
        - Check for contradictory rules (same scope, different actions)
        - Verify folder structure matches DIRECTORY-STRUCTURE.md
        action_on_violation: HALT, flag for governance review (Rule #6)
      
      performance:
        - Count total rules (soft limit: 15, hard limit: 20, current: 16)
        - Count prompt files (soft limit: 13, hard limit: 15, current: 13)
        - Count KDS files (soft limit: 70, hard limit: 80)
        - Check for circular dependencies in prompts
        action_on_violation: 
          - Approaching soft limit (18 rules, 14 prompts, 68 files): WARN, suggest consolidation
          - At/exceeding hard limit: HALT, require consolidation before continuing
      
      consistency:
        - Verify all internal agents have validation: sections
        - Check all user prompts exclude technical details
        - Validate naming conventions (Rule #4)
        - Ensure zero exemptions (no special cases for any prompt)
        action_on_violation: Auto-fix if possible, else flag
      
      knowledge_health:
        - Count patterns per category (max 10 each)
        - Identify unused patterns (>90 days since last use)
        - Detect duplicate candidates (>60% similarity)
        - Verify all patterns have Last Used timestamp
        action_on_violation:
          - At 8/10 capacity: TRIGGER consolidation (merge similar patterns)
          - At 10/10 capacity: HALT, require consolidation or archival
          - Unused >90 days: AUTO-ARCHIVE to .archived/ folder
          - Duplicates >85%: AUTO-REJECT new pattern
          - Duplicates 60-84%: CONSOLIDATE into comprehensive pattern
  
  step_6_update_living_docs:
    description: Update KDS-DESIGN.md and governance/rules.md
    actions:
      - Add change to "Change History" section (KDS-DESIGN.md)
      - Update metrics if structure changed
      - Increment version if rules added/modified
      - Update "Last Updated" timestamp
    rule_reference: Rule #2, Rule #7
    validation:
      - KDS-DESIGN.md modified in commit
      - Version incremented if breaking change

automation_level: FULL_AUTO
user_intervention: NONE (unless errors detected)

output_format: |
  ✅ Task Complete
  
  📊 Post-Task Execution Summary:
  ✅ Build: PASSED (0 errors)
  ✅ Publishing: 2 patterns published
     - knowledge/test-patterns/canvas-save-flow.md
     - knowledge/ui-mappings/canvas-buttons.md
  ✅ Cleanup: 3 files deleted (archived in git)
     - KDS/old-prompt.md.old
     - KDS/archive/ (folder removed)
  ✅ Reorganization: 1 file moved
     - canvas-guide.md → docs/guides/canvas-guide.md
  ✅ KDS Verification: PASSED
     - Redundancy: 0 duplicates
     - Conflicts: 0 issues
     - Performance: 16 rules, 13 prompts (within limits)
     - Consistency: 100% compliant
  ✅ Living Docs: Updated (v4.2.0)
  
  **Next Command:**
  @workspace /execute #file:KDS/keys/{key}/handoffs/{next}.json

failure_handling:
  on_build_failure:
    action: HALT immediately
    output: Create fix handoff, do NOT proceed to publishing/cleanup
  
  on_publishing_failure:
    action: WARN and continue (non-critical)
    log: Record failure for later review
  
  on_cleanup_failure:
    action: WARN and continue (non-critical)
    log: Record files that couldn't be deleted
  
  on_verification_failure:
    action: HALT if CRITICAL (conflicts, redundancy)
    action: WARN if MEDIUM (performance approaching limits)
    action: LOG if LOW (minor consistency issues)
  
  on_docs_update_failure:
    action: HALT (Rule #2 violation - critical)

skip_conditions:
  - Task is governance review (avoid circular validation)
  - Task is KDS design update (already updating docs)
  - Explicit flag: skip_post_task=true in handoff JSON

enforcement:
  - code-executor.md MUST call this workflow after implementation
  - test-generator.md MUST call this workflow after test passes
  - work-planner.md MUST include post-task in ALL task handoffs
  - NO EXCEPTIONS unless skip_conditions met
```

---

## RULE #19: Regular Maintenance (Docs Sync + Redundancy Cleanup)

```yaml
rule_id: REGULAR_MAINTENANCE
severity: HIGH
scope: KDS_HYGIENE

purpose: |
  Keep KDS documentation synchronized and storage lean.
  Automate document trilogy validation and redundant file cleanup.

cadence:
  - post_merge: ALWAYS (non-blocking)
  - weekly: Monday 09:00 local (recommended)
  - manual: VS Code tasks (dry-run and archive)

tools:
  trilogy_sync:
    script: KDS/scripts/sync-trilogy.ps1
    behavior: validate versions, write manifest, assert PR prompts present
  cleanup:
    script: KDS/scripts/clean-redundant-files.ps1
    behavior: detect temp/empty/duplicate/retention candidates, delete by default (Rule #3)
  maintenance_combined:
    script: KDS/scripts/run-maintenance.ps1
    behavior: run trilogy sync then cleanup (dry-run or delete)

vs_code_tasks:
  - label: "kds: maintenance (dry-run)"
  - label: "kds: maintenance (archive)"

enforcement:
  post_task_note: "Include maintenance summary in post-task logs (Rule #16)."
  non_blocking: true  # never blocks merges; only reports and deletes
  thresholds:
    max_empty_files: 0
    max_temp_files: 0
    action: delete   # trust git for history (Rule #3)

validation:
  trilogy:
    - versions_match: required
    - pr_prompts_present: required (Prompts 10–23)
  cleanup:
    - reports_written: required (JSON and CSV)
    - deletion_summary: required (console output)
```

---

## RULE #17: Challenge User Requests (KDS Defense Mechanism)

```yaml
rule_id: CHALLENGE_REQUESTS
severity: CRITICAL
scope: ALL_USER_REQUESTS_AFFECTING_KDS

purpose: |
  Copilot MUST challenge user requests that may harm KDS design.
  DO NOT blindly accept requests - validate against existing design.
  STOP user and provide alternatives when beneficial.
  Act as KDS guardian, not passive executor.

validation_workflow:
  step_1_analyze_request:
    description: Parse user request and identify KDS impact
    checks:
      - Does request modify KDS/ files?
      - Does request add new prompts/rules?
      - Does request change existing workflows?
      - Does request violate existing rules?
      - Does request duplicate existing functionality?
    
  step_2_check_existing_design:
    description: Search KDS for existing solutions
    actions:
      - Query KDS-DESIGN.md for similar features
      - Check governance/rules.md for conflicts
      - Search prompts/ for duplicate functionality
      - Review knowledge/ for existing patterns
      - Check sessions/current-session.json for context
    
  step_3_evaluate_benefit:
    description: Assess if request improves or harms KDS
    criteria:
      beneficial:
        - Simplifies existing complexity
        - Removes duplication
        - Improves automation
        - Strengthens governance
        - Enhances multi-chat continuity
        - Adds missing critical functionality
      
      harmful:
        - Adds duplication (violates Rule #10)
        - Creates new prompt when existing one works
        - Bypasses governance (violates Rules #1-16)
        - Increases complexity without benefit
        - Violates anti-patterns (see KDS-ANTI-PATTERNS.md)
        - Conflicts with existing rules
      
      neutral:
        - Minor documentation update
        - Clarification of existing rule
        - Non-structural change
  
  step_4_decision:
    if_beneficial:
      action: PROCEED with implementation
      message: "✅ Request aligns with KDS design - proceeding"
    
    if_harmful:
      action: STOP and challenge
      message: |
        ⚠️ Request may harm KDS design
        
        Issue: {specific_problem}
        Violates: {rule_or_principle}
        
        Existing Solution: {show_current_mechanism}
        
        Alternatives:
        1. {alternative_1}
        2. {alternative_2}
        
        Recommendation: {best_approach}
        
        Proceed anyway? (requires explicit confirmation)
    
    if_neutral:
      action: PROCEED with minimal validation
      message: "ℹ️ Minor change - proceeding with standard validation"

challenge_triggers:
  - User requests new prompt (check for duplication)
  - User requests new rule (verify not covered by existing)
  - User requests workaround (may violate governance)
  - User requests exemption (violates zero-exemption policy)
  - User requests manual process (should be automated)
  - User requests archive folder (violates Rule #3)
  - User requests status flags (violates git-based tracking)

challenge_examples:
  example_1:
    user_request: "Create a kds-review prompt to keep Copilot honest"
    analysis: |
      - New prompt request (duplication check triggered)
      - Searched existing design
      - Found: Rule #16 Step 5 already does KDS verification
      - Found: ask-kds.md already validates freshness
      - Conclusion: DUPLICATE functionality
    
    challenge_response: |
      ⚠️ Request would add duplication
      
      Issue: Functionality already exists
      Violates: Rule #10 (Single Source of Truth)
      
      Existing Solution:
      - Rule #16 Step 5: KDS Verification (runs after EVERY task)
      - ask-kds.md: Freshness validation
      
      Alternatives:
      1. Enhance Rule #16 Step 5 with violation tracking
      2. Add pre-task health check to work-planner.md
      
      Recommendation: Strengthen existing mechanisms instead of adding new prompt
      
      Proceed with new prompt anyway? [y/N]
  
  example_2:
    user_request: "Let's create an archive/ folder for old patterns"
    analysis: |
      - Archive folder request (Rule #3 violation)
      - Conflicts with "Delete Over Archive" principle
      - Anti-pattern from v2.1.0 (documented)
    
    challenge_response: |
      ⚠️ Request violates Rule #3: Delete Over Archive
      
      Issue: Archive folders are FORBIDDEN
      Violates: Rule #3, Anti-Pattern #1 (bloat)
      
      Current Approach: Git history serves as archive
      
      Alternative: Use .archived/ for auto-sunset (90-day policy)
      
      Recommendation: Use .archived/ ONLY for automated archival, not manual storage
      
      Proceed with archive/ folder anyway? [y/N]

enforcement:
  when_to_challenge:
    - ANY request affecting KDS/ structure
    - ANY request adding prompts/rules/workflows
    - ANY request creating exceptions/exemptions
    - ANY request bypassing automation
  
  when_not_to_challenge:
    - Application code changes (SPA/, Tests/, etc.)
    - Non-KDS documentation (Docs/, README.md)
    - Configuration tweaks (kds.config.json values)
    - Session state updates (automatic)

challenge_authority: MANDATORY
user_override: ALLOWED (but logged with rationale)

output_format: |
  ⚠️ KDS Design Challenge
  
  Request: {user_request}
  Impact: {kds_impact_analysis}
  
  Issue: {specific_problem}
  Violates: {rule_or_principle}
  
  Existing Solution:
  {show_current_mechanism}
  
  Alternatives:
  1. {alternative_with_rationale}
  2. {alternative_with_rationale}
  
  Recommendation: {best_approach_with_reasoning}
  
  ═══════════════════════════════════════════════════════════
  
  Proceed with original request? [y/N]
  Or accept recommended alternative? [1/2]
```

---

## RULE #18: Project Tooling Awareness & Local-First Dependencies

```yaml
rule_id: PROJECT_TOOLING
severity: CRITICAL
scope: ALL_KDS_OPERATIONS

purpose: |
  KDS MUST discover and leverage existing project tooling automatically.
  NEVER create external dependencies - house ALL tools locally.
  Refresh tooling inventory regularly to stay current with project evolution.

tooling_discovery:
  mechanism:
    location: "KDS/tooling/"
    files:
      - tooling-inventory.json    # Auto-generated catalog
      - refresh-tooling.ps1       # Discovery script
      - kds.config.json           # KDS-specific tool configuration
  
  refresh_triggers:
    - On KDS initialization (first time setup)
    - Weekly automatic scan (cron-like)
    - After package.json changes detected
    - After *.csproj changes detected
    - After new tool installation
    - Manual refresh command
  
  discovery_process:
    step_1_scan_project:
      description: "Scan project for existing tooling"
      searches:
        - package.json (npm/node tools)
        - "*.csproj" (NuGet packages, dotnet tools)
        - global.json (dotnet SDK version)
        - playwright.config.ts (test framework)
        - tsconfig.json (TypeScript setup)
        - "KDS/workflows/*.yml" (GitHub Actions)
        - "Scripts/*.ps1" (PowerShell automation)
        - "Tools/**" (custom project tools)
    
    step_2_categorize:
      description: "Organize tools by purpose"
      categories:
        build_tools:
          - dotnet CLI
          - MSBuild
          - npm/yarn/pnpm
          - TypeScript compiler
        
        test_tools:
          - Playwright
          - xUnit/NUnit/MSTest
          - Jest/Mocha
          - Percy (visual regression)
        
        quality_tools:
          - Roslynator (C# analysis)
          - ESLint/TSLint
          - Prettier
          - SonarQube
        
        deployment_tools:
          - PowerShell scripts
          - Azure CLI
          - Docker
          - IIS management
        
        database_tools:
          - EF Core migrations
          - SQL scripts
          - Database backup utilities
        
        kds_specific:
          - Git hooks
          - Validation scripts
          - Pattern publishing tools
    
    step_3_generate_inventory:
      description: "Create tooling-inventory.json"
      format: |
        {
          "last_updated": "2025-11-02T10:30:00Z",
          "project_name": "NOOR-CANVAS",
          "tooling": {
            "build": [
              {
                "name": "dotnet",
                "version": "8.0.100",
                "command": "dotnet build",
                "config_file": "NoorCanvas.sln",
                "kds_usage": "Rule #11 build validation"
              }
            ],
            "test": [
              {
                "name": "Playwright",
                "version": "1.40.0",
                "command": "npx playwright test",
                "config_file": "playwright.config.ts",
                "kds_usage": "Rule #8 test generation, ui-mappings validation"
              }
            ],
            "quality": [
              {
                "name": "Roslynator",
                "version": "4.7.0",
                "command": "dotnet roslynator analyze",
                "config_file": ".roslynator.json",
                "kds_usage": "Post-task code quality validation"
              }
            ],
            "custom_scripts": [
              {
                "name": "ncb (NOOR Canvas Build)",
                "location": "Scripts/ncw.ps1",
                "purpose": "Shortcut for dotnet build",
                "kds_usage": "Quick build validation"
              }
            ]
          },
          "project_specific_patterns": {
            "build_command": "dotnet build SPA/NoorCanvas/NoorCanvas.csproj",
            "test_command": "npx playwright test",
            "quality_check": "pwsh -File Workspaces/CodeQuality/run-roslynator.ps1"
          }
        }
    
    step_4_validate_availability:
      description: "Verify tools are installed and accessible"
      checks:
        - Run "{tool} --version" for each tool
        - Validate config files exist
        - Check PATH environment for CLI tools
        - Verify project references for libraries

local_first_principle:
  mandate: |
    KDS MUST NEVER create external dependencies.
    ALL essential tools MUST be housed locally in the project.
  
  tool_integration_workflow:
    step_1_evaluate_need:
      description: "Assess if tool is essential for KDS"
      essential_tools:
        - Git (version control - EXCEPTION: system dependency)
        - Validation scripts (rule enforcement)
        - Pattern publishing utilities
        - Test automation frameworks (if project uses them)
      
      optional_tools:
        - Code formatters (nice-to-have, not required)
        - Linters (project-specific, not KDS requirement)
        - Deployment tools (project-specific)
    
    step_2_check_existing:
      description: "Search project for existing implementation"
      locations:
        - "KDS/scripts/"
        - "Scripts/"
        - "Tools/"
        - "node_modules/" (npm packages)
        - NuGet packages in *.csproj
    
    step_3_local_housing:
      if_not_exists:
        action: "Create local implementation"
        location: "KDS/scripts/{tool-name}/"
        structure: |
          KDS/scripts/validation/
          ├── validate-build.ps1
          ├── validate-ui-ids.ps1
          ├── publish-pattern.ps1
          └── README.md
      
      forbidden_actions:
        - Installing global npm packages (use local devDependencies)
        - Requiring user to install tools separately
        - Depending on cloud services for validation
        - Using external APIs for core KDS functions
    
    step_4_document:
      description: "Add to tooling-inventory.json"
      update_kds_config: |
        {
          "kds_version": "4.4.0",
          "required_tools": [
            {
              "name": "UI ID Validator",
              "location": "KDS/scripts/validation/validate-ui-ids.ps1",
              "purpose": "Rule #15 enforcement",
              "triggers": ["pre-commit", "post-ui-change"]
            }
          ]
        }

automatic_leveraging:
  copilot_behavior: |
    When executing tasks, Copilot MUST:
    1. Read tooling-inventory.json FIRST
    2. Use discovered tools instead of guessing
    3. Never assume tool locations/commands
    4. Update inventory if new tools added
  
  examples:
    build_validation:
      wrong_approach: |
        # BAD: Guessing build command
        await run_in_terminal("dotnet build")
      
      correct_approach: |
        # GOOD: Using discovered tooling
        tooling = read_json("KDS/tooling/tooling-inventory.json")
        build_cmd = tooling.project_specific_patterns.build_command
        await run_in_terminal(build_cmd)
    
    test_execution:
      wrong_approach: |
        # BAD: Assuming Playwright exists
        await run_in_terminal("npx playwright test {spec}")
      
      correct_approach: |
        # GOOD: Checking inventory first
        tooling = read_json("KDS/tooling/tooling-inventory.json")
        if "Playwright" in tooling.tooling.test:
          test_cmd = tooling.tooling.test.Playwright.command
          await run_in_terminal(f"{test_cmd} {spec}")
        else:
          return ERROR("No test framework found in project")

kds_initial_setup:
  requirements:
    description: "Minimum tooling for KDS v4.4 to function"
    essential:
      - Git (version control)
      - Build system (dotnet/npm/maven - detected from project)
      - Text processing (grep, sed, awk - native or PowerShell)
      - JSON parser (native language support)
    
    kds_specific:
      - Validation scripts (KDS/scripts/validation/)
      - Pattern publishing (KDS/scripts/publish/)
      - Tooling discovery (KDS/tooling/refresh-tooling.ps1)
      - Pre-commit hooks (KDS/hooks/)
  
  setup_process:
    step_1_detect_project_type:
      indicators:
        - "*.sln" → .NET project
        - "package.json" → Node.js project
        - "pom.xml" → Java/Maven project
        - "requirements.txt" → Python project
    
    step_2_scaffold_kds:
      action: "Create KDS/ structure"
      files_created:
        - "KDS/tooling/kds.config.json"
        - "KDS/tooling/refresh-tooling.ps1"
        - "KDS/scripts/validation/validate-build.ps1"
        - "KDS/scripts/validation/validate-ui-ids.ps1"
        - "KDS/hooks/pre-commit"
    
    step_3_discover_existing:
      action: "Run refresh-tooling.ps1"
      result: "Generates tooling-inventory.json"
    
    step_4_integrate:
      action: "Configure KDS to use discovered tools"
      validation: "Verify all Rule #11, #15, #16 validations work"

refresh_mechanism:
  schedule:
    - Weekly automatic (Monday 00:00 UTC)
    - On package.json modification
    - On *.csproj modification
    - Manual trigger: @workspace /refresh-tooling
  
  refresh_script:
    location: "KDS/tooling/refresh-tooling.ps1"
    behavior: |
      1. Scan project structure
      2. Detect new/changed tools
      3. Update tooling-inventory.json
      4. Validate KDS can use discovered tools
      5. Report changes to user
  
  change_notification:
    format: |
      📦 Tooling Inventory Updated
      
      New Tools Discovered:
      - Percy (visual regression testing)
      
      Updated Tools:
      - Playwright: 1.38.0 → 1.40.0
      
      Removed Tools:
      - ESLint (no longer in package.json)
      
      KDS Impact:
      ✅ Percy can now be used for visual regression in test-generator
      ✅ Playwright updated - tests should still work
      ⚠️  ESLint removed - quality checks may be affected

integration_with_rules:
  rule_11_build_validation:
    requirement: "Use discovered build command from tooling-inventory.json"
    fallback: "ERROR if no build tool found"
  
  rule_15_ui_validation:
    requirement: "Use validate-ui-ids.ps1 from KDS/scripts/"
    fallback: "Create script if missing (local-first principle)"
  
  rule_16_post_task:
    requirement: "Use ALL discovered quality tools automatically"
    example: "If Roslynator exists, run analysis post-build"

error_handling:
  missing_inventory:
    action: "Auto-run refresh-tooling.ps1"
    message: "Tooling inventory not found - generating..."
  
  missing_tool:
    action: "Check if tool is essential"
    if_essential:
      error: "Essential tool {tool_name} not found - KDS cannot proceed"
      resolution: "Install {tool_name} or update kds.config.json"
    if_optional:
      warning: "Optional tool {tool_name} not found - skipping related validations"
  
  outdated_inventory:
    detection: "Compare tooling-inventory.json timestamp to package.json/csproj modification"
    action: "Auto-refresh if >7 days old OR if dependencies changed"

copilot_mandate:
  automatic_discovery: |
    Copilot MUST read tooling-inventory.json BEFORE executing tasks.
    NO assumptions about tool availability or commands.
    ALL tool usage MUST reference discovered tooling.
  
  local_first_enforcement: |
    Copilot MUST NOT suggest external dependencies.
    If tool is needed, create LOCAL implementation in KDS/scripts/.
    Document ALL custom tools in tooling-inventory.json.
  
  refresh_awareness: |
    Copilot MUST detect stale inventory and trigger refresh.
    If project dependencies change, update inventory immediately.
```

---

## VALIDATION ALGORITHMS

### Algorithm 1: Dual Interface Validation

```python
def validate_dual_interface(prompt_file):
    if prompt_file.startswith("prompts/user/"):
        # User interface - check for technical details
        technical_patterns = [
            "schema validation",
            "JSON schema",
            "regex pattern",
            "exit code",
            "try-catch"
        ]
        for pattern in technical_patterns:
            if pattern in prompt_file.content:
                return ERROR(f"Technical detail '{pattern}' in user prompt")
    
    elif prompt_file.startswith("prompts/internal/"):
        # Internal agent - require validation logic
        if "validation:" not in prompt_file.content:
            return WARNING("Missing validation logic in internal agent")
    
    return PASS
```

### Algorithm 2: KDS Branch Validation

```python
def validate_kds_branch():
    current_branch = git.current_branch()
    
    if current_branch != "features/kds":
        return ERROR("KDS changes ONLY on features/kds branch")
    
    changed_files = git.diff_cached_names()
    non_kds_files = [f for f in changed_files if not f.startswith("KDS/")]
    
    if non_kds_files:
        return ERROR(f"Non-KDS files in commit: {non_kds_files}")
    
    return PASS
```

### Algorithm 3: Delete vs Archive Validation

```python
def validate_no_archives():
    forbidden_patterns = [
        "KDS/archive/",
        "KDS/deprecated/",
        "*.old",
        "*.backup",
        "*_v1", "*_v2"
    ]
    
    for pattern in forbidden_patterns:
        if files_exist(pattern):
            return ERROR(f"Forbidden pattern found: {pattern}")
    
    return PASS
```

### Algorithm 4: Publishing Validation

```python
def validate_publish_pattern(pattern_file):
    required_sections = [
        "Context",
        "Implementation", 
        "What Worked",
        "What Didn't Work",
        "Success Rate"
    ]
    
    content = read_file(pattern_file)
    missing = [s for s in required_sections if s not in content]
    
    if missing:
        return ERROR(f"Missing sections: {missing}")
    
    # Check deduplication
    existing = list_files("knowledge/")
    similar = find_similar_patterns(pattern_file, existing)
    
    if similar:
        return WARNING(f"Similar pattern exists: {similar[0]}")
    
    return PASS
```

### Algorithm 5: UI Test ID Validation

```python
def validate_ui_test_ids(changed_files):
    ui_files = [f for f in changed_files 
                if f.endswith(('.razor', '.cshtml', '.html'))]
    
    violations = []
    
    for file in ui_files:
        content = read_file(file)
        
        # Find interactive elements
        interactive_elements = find_elements(content, [
            'button', 'input', 'select', 'textarea',
            'a href=', '@onclick=', '@onchange='
        ])
        
        for element in interactive_elements:
            if 'data-testid=' not in element:
                violations.append({
                    'file': file,
                    'line': element.line_number,
                    'element': element.type,
                    'suggested_id': generate_testid(element)
                })
            else:
                # Validate naming convention
                testid = extract_testid(element)
                if not is_valid_testid_format(testid):
                    violations.append({
                        'file': file,
                        'line': element.line_number,
                        'error': 'Invalid naming convention',
                        'current': testid,
                        'suggested': suggest_testid_fix(testid)
                    })
    
    if violations:
        return ERROR(f"UI test ID violations: {violations}")
    
    return PASS

def is_valid_testid_format(testid):
    # Format: feature-element-action
    parts = testid.split('-')
    return (
        len(parts) >= 3 and
        testid.islower() and
        not any(c.isupper() for c in testid)
    )
```

### Algorithm 6: Mandatory Post-Task Execution

```python
def execute_mandatory_post_task(task_result):
    """
    CRITICAL: This MUST run after EVERY task completion.
    No user reminder required - fully automated.
    """
    results = {
        'build': None,
        'publishing': [],
        'cleanup': [],
        'reorganization': [],
        'verification': {},
        'docs_update': None
    }
    
    # STEP 1: Build Validation
    build_result = run_build_command()
    if build_result.exit_code != 0:
        return HALT({
            'error': 'Build failed',
            'details': build_result.errors,
            'next_handoff': 'fix-build.json'
        })
    results['build'] = 'PASSED'
    
    # STEP 2: Pattern Publishing (Auto-publish)
    patterns_to_publish = identify_publishable_patterns(task_result)
    for pattern in patterns_to_publish:
        if not is_duplicate(pattern):
            publish_result = invoke_publish_workflow(pattern)
            results['publishing'].append(publish_result)
    
    # STEP 3: Cleanup (Delete clutter)
    forbidden = find_forbidden_patterns([
        'KDS/archive/',
        'KDS/deprecated/',
        '**/*.old',
        '**/*.backup'
    ])
    for file in forbidden:
        git_rm(file)
        results['cleanup'].append(f"Deleted: {file}")
    
    # STEP 4: Reorganization (Enforce structure)
    misplaced = find_misplaced_files()
    for file in misplaced:
        new_location = determine_correct_location(file)
        move_file(file, new_location)
        update_references(file, new_location)
        results['reorganization'].append(f"Moved: {file} → {new_location}")
    
    # STEP 5: KDS Verification
    verification = {
        'redundancy': check_redundancy(),
        'conflicts': check_conflicts(),
        'performance': check_performance(),
        'consistency': check_consistency()
    }
    
    # Critical violations halt execution
    if verification['conflicts']['status'] == 'CONFLICT_FOUND':
        return HALT({
            'error': 'KDS conflicts detected',
            'details': verification['conflicts']['issues']
        })
    
    if verification['redundancy']['duplicate_count'] > 0:
        # Auto-fix: extract to shared/
        extract_to_shared(verification['redundancy']['duplicates'])
        results['verification']['redundancy'] = 'AUTO_FIXED'
    
    results['verification'] = verification
    
    # STEP 6: Update Living Docs
    update_kds_design_md(task_result)
    increment_version_if_needed(task_result)
    results['docs_update'] = 'UPDATED'
    
    return SUCCESS(results)

def identify_publishable_patterns(task_result):
    """Auto-identify patterns that should be published"""
    patterns = []
    
    # Test passed after multiple attempts
    if task_result.test_attempts > 1 and task_result.test_passed:
        patterns.append({
            'category': 'test-patterns',
            'name': f"{task_result.feature}-test-pattern",
            'content': extract_test_pattern(task_result)
        })
    
    # New UI elements with data-testid
    if task_result.ui_changes:
        testids = extract_testids(task_result.changed_files)
        if testids:
            patterns.append({
                'category': 'ui-mappings',
                'name': f"{task_result.component}-testids",
                'content': generate_ui_mapping(testids)
            })
    
    # Validated test data
    if task_result.test_data_validated:
        patterns.append({
            'category': 'test-data',
            'name': task_result.test_data_name,
            'content': extract_test_data_doc(task_result)
        })
    
    # Workflow completed
    if task_result.workflow_completed:
        patterns.append({
            'category': 'workflows',
            'name': f"{task_result.workflow_name}-flow",
            'content': extract_workflow_doc(task_result)
        })
    
    return patterns

def check_redundancy():
    """Detect duplicate logic across prompts"""
    prompts = load_all_prompts()
    duplicates = []
    
    for i, prompt1 in enumerate(prompts):
        for prompt2 in prompts[i+1:]:
            similarity = calculate_code_similarity(prompt1, prompt2)
            if similarity > 0.70:  # 70% similar
                duplicates.append({
                    'file1': prompt1.path,
                    'file2': prompt2.path,
                    'similarity': similarity,
                    'duplicate_lines': extract_duplicate_lines(prompt1, prompt2)
                })
    
    return {
        'status': 'DUPLICATES_FOUND' if duplicates else 'CLEAN',
        'duplicate_count': len(duplicates),
        'duplicates': duplicates
    }

def check_conflicts():
    """Detect rule conflicts and inconsistencies"""
    design_doc = load_kds_design_md()
    rules_doc = load_governance_rules_md()
    
    conflicts = []
    
    # Rule count mismatch
    design_rule_count = count_rules(design_doc)
    governance_rule_count = count_rules(rules_doc)
    
    if design_rule_count != governance_rule_count:
        conflicts.append({
            'type': 'RULE_COUNT_MISMATCH',
            'design_count': design_rule_count,
            'governance_count': governance_rule_count
        })
    
    # Contradictory rules (same scope, different actions)
    for rule in rules_doc.rules:
        contradictions = find_contradictions(rule, rules_doc.rules)
        if contradictions:
            conflicts.append({
                'type': 'CONTRADICTORY_RULES',
                'rule': rule.id,
                'contradicts': contradictions
            })
    
    return {
        'status': 'CONFLICT_FOUND' if conflicts else 'NO_CONFLICTS',
        'issues': conflicts
    }

def check_performance():
    """Monitor KDS performance metrics"""
    return {
        'rule_count': count_total_rules(),
        'rule_limit': 20,
        'prompt_count': count_prompt_files(),
        'prompt_limit': 15,
        'total_files': count_github_files(),
        'file_limit': 80,
        'status': 'WITHIN_LIMITS'  # or 'APPROACHING_LIMITS' or 'EXCEEDED_LIMITS'
    }
```

### Algorithm 7: Challenge User Requests (Rule #17)

```python
def challenge_user_request(user_request):
    """
    CRITICAL: Challenge requests that may harm KDS design.
    DO NOT blindly accept - validate and provide alternatives.
    """
    # STEP 1: Analyze Request
    analysis = {
        'modifies_github': affects_kds_structure(user_request),
        'adds_prompts': contains_create_prompt_intent(user_request),
        'adds_rules': contains_new_rule_intent(user_request),
        'changes_workflows': modifies_existing_workflows(user_request),
        'violates_rules': check_rule_violations(user_request),
        'duplicates_functionality': check_for_duplication(user_request)
    }
    
    # STEP 2: Check Existing Design
    existing = {
        'similar_features': search_kds_design_md(user_request),
        'conflicting_rules': search_governance_rules(user_request),
        'duplicate_prompts': search_prompts_folder(user_request),
        'existing_patterns': search_knowledge_folder(user_request),
        'anti_patterns': search_anti_patterns_doc(user_request)
    }
    
    # STEP 3: Evaluate Benefit
    if is_beneficial(analysis, existing):
        return {
            'decision': 'PROCEED',
            'message': '✅ Request aligns with KDS design - proceeding',
            'action': 'implement_request'
        }
    
    elif is_harmful(analysis, existing):
        # Build challenge response
        challenge = build_challenge_response(
            request=user_request,
            issues=analysis,
            existing_solutions=existing,
            alternatives=generate_alternatives(user_request, existing)
        )
        
        return {
            'decision': 'CHALLENGE',
            'message': challenge,
            'action': 'await_user_confirmation'
        }
    
    else:  # Neutral
        return {
            'decision': 'PROCEED_WITH_VALIDATION',
            'message': 'ℹ️ Minor change - proceeding with standard validation',
            'action': 'implement_with_validation'
        }

def is_beneficial(analysis, existing):
    """Determine if request improves KDS"""
    beneficial_indicators = [
        simplifies_complexity(analysis),
        removes_duplication(existing),
        improves_automation(analysis),
        strengthens_governance(analysis),
        adds_missing_critical_feature(existing)
    ]
    return any(beneficial_indicators)

def is_harmful(analysis, existing):
    """Determine if request harms KDS"""
    harmful_indicators = [
        analysis['duplicates_functionality'],
        analysis['violates_rules'],
        creates_new_when_existing_works(existing),
        bypasses_governance(analysis),
        matches_anti_pattern(existing['anti_patterns']),
        adds_unnecessary_complexity(analysis)
    ]
    return any(harmful_indicators)

def build_challenge_response(request, issues, existing_solutions, alternatives):
    """Format challenge message for user"""
    specific_problem = identify_main_issue(issues)
    violated_rule = identify_violated_rule(issues)
    current_mechanism = extract_existing_solution(existing_solutions)
    
    return f"""⚠️ KDS Design Challenge

Request: {request}
Impact: {analyze_kds_impact(issues)}

Issue: {specific_problem}
Violates: {violated_rule}

Existing Solution:
{format_existing_mechanism(current_mechanism)}

Alternatives:
{format_alternatives(alternatives)}

Recommendation: {select_best_alternative(alternatives)}

═══════════════════════════════════════════════════════════

Proceed with original request? [y/N]
Or accept recommended alternative? [1/2/3]"""

def check_for_duplication(user_request):
    """Check if request duplicates existing functionality"""
    # Extract intent (e.g., "review", "validate", "check")
    intent = extract_intent(user_request)
    
    # Search existing prompts
    existing_prompts = {
        'review': ['ask-kds.md', 'Rule #16 Step 5'],
        'validate': ['health-validator.md', 'Rule #16 Step 5'],
        'check': ['knowledge-retriever.md', 'mandatory-post-task.md'],
        'govern': ['Rule #6', 'change-governor.md']
    }
    
    if intent in existing_prompts:
        return {
            'duplicate': True,
            'existing': existing_prompts[intent],
            'severity': 'HIGH'
        }
    
    # Search for similar functionality in rules
    similar_rules = search_rules_by_intent(intent)
    if similar_rules:
        return {
            'duplicate': True,
            'existing': similar_rules,
            'severity': 'MEDIUM'
        }
    
    return {'duplicate': False}

def generate_alternatives(user_request, existing):
    """Generate better alternatives to user request"""
    alternatives = []
    
    # If duplication detected, suggest enhancement
    if existing['duplicate_prompts']:
        alternatives.append({
            'option': 1,
            'description': f"Enhance existing {existing['duplicate_prompts'][0]}",
            'rationale': "Avoids duplication (Rule #10)",
            'benefit': "Strengthens existing mechanism instead of adding new one"
        })
    
    # If governance-related, suggest Rule #16 enhancement
    if 'governance' in user_request.lower() or 'review' in user_request.lower():
        alternatives.append({
            'option': 2,
            'description': "Add validation to Rule #16 Step 5 (KDS Verification)",
            'rationale': "Leverages mandatory automation",
            'benefit': "Runs automatically after every task (no manual trigger)"
        })
    
    # If pattern-related, suggest knowledge/ enhancement
    if 'pattern' in user_request.lower() or 'track' in user_request.lower():
        alternatives.append({
            'option': 3,
            'description': "Enhance knowledge/ publishing with additional metadata",
            'rationale': "Uses existing infrastructure",
            'benefit': "No new files, just enriched data"
        })
    
    return alternatives
```

---

## ENFORCEMENT CHECKLIST

### Pre-Execution Validation (NEW - Rule #17, Rule #18)
- [ ] Rule #17: Challenge KDS-modifying requests
- [ ] Rule #17: Check for duplication before proceeding
- [ ] Rule #17: Search existing design for solutions
- [ ] Rule #17: Provide alternatives when harmful
- [ ] Rule #17: Require explicit confirmation for harmful changes
- [ ] Rule #18: Read tooling-inventory.json BEFORE task execution
- [ ] Rule #18: Verify tooling inventory is current (<7 days old)
- [ ] Rule #18: Auto-refresh if package.json/csproj changed

### Pre-Commit Validation (Git Hooks)
- [ ] Rule #5: Check branch = features/kds
- [ ] Rule #5: Check files = KDS/** only
- [ ] Rule #7: Check KDS-DESIGN.md updated
- [ ] Rule #7: Check governance/rules.md updated
- [ ] Rule #3: Check no archive folders
- [ ] Rule #15: Validate BOTH id AND data-testid on UI elements
- [ ] Rule #15: Check UI element naming conventions (kebab-case)

### Post-Task Validation (MANDATORY - Rule #16)
- [ ] Rule #11: Build succeeds (exit code 0) - HALT if fails
- [ ] Rule #14: Auto-publish patterns (2+ test attempts, new testids, validated data)
- [ ] Rule #3: Delete clutter (archive/, *.old, *.backup) - Auto-cleanup
- [ ] Rule #13: Reorganize misplaced files - Auto-move to correct folders
- [ ] Rule #15: Publish UI mappings if 3+ unique IDs added
- [ ] Rule #16: KDS Verification:
  - [ ] Redundancy check (>70% similarity across prompts)
  - [ ] Conflict check (rule count, contradictions)
  - [ ] Performance check (rule count, prompt count, file count)
  - [ ] Consistency check (naming, structure, validation presence)
- [ ] Rule #2: Update KDS-DESIGN.md and governance/rules.md
- [ ] Rule #10: No duplicate logic detected
- [ ] Rule #18: Update tooling-inventory.json if new tools added

### Post-Test-Pass Validation (AUTOMATIC)
- [ ] Rule #14: Consider publishing test pattern if reused 3+ times
- [ ] Rule #15: Publish UI mappings to knowledge/ui-mappings/
- [ ] Rule #12: Update test registry (tests/index.json)

### Post-Merge Action
- [ ] Rule #5: Auto-switch to features/kds

---

**END OF GOVERNANCE RULES**

**Version:** 4.2.0  
**Last Updated:** 2025-11-02  
**Companion Doc:** `KDS/KDS-DESIGN.md` (human-readable)
