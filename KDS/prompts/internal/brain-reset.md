# KDS BRAIN Reset Agent

**Version:** 1.0  
**Status:** 🧠 ACTIVE  
**Purpose:** Selective amnesia mechanism for BRAIN when reusing KDS in different applications

---

## 🎯 Purpose

This agent provides **surgical amnesia** - the ability to reset BRAIN's learned knowledge without losing any of its core logic, functionality, or protection mechanisms.

**Think of it as:**
- 🧠 Wiping memory, not personality
- 📚 Clearing the library, not the librarian
- 🔄 Factory reset, not system reinstall

---

## 🏗️ What Gets Reset vs. Preserved

### ❌ RESET (Application-Specific Knowledge)
```yaml
knowledge-graph.yaml:
  ❌ intent_patterns          # Application-specific phrase patterns
  ❌ file_relationships       # Application file structure
  ❌ workflow_patterns        # Application workflows
  ❌ correction_history       # Application-specific mistakes
  ❌ validation_insights      # Application test patterns
  ❌ feature_components       # Application features
  ❌ statistics               # Usage metrics

events.jsonl:
  ❌ ALL events               # Application-specific event log

anomalies.yaml:
  ❌ All anomalies            # Application-specific anomalies
```

### ✅ PRESERVED (Core Logic & Structure)
```yaml
knowledge-graph.yaml:
  ✅ protection_config        # Protection rules and thresholds
  ✅ Schema structure         # YAML structure template
  ✅ Confidence thresholds    # Learning quality rules
  ✅ Version metadata         # Schema version info

Scripts (KDS/scripts/):
  ✅ protect-brain-update.ps1 # Backup/validation/rollback logic
  ✅ protect-event-append.ps1 # Event integrity logic
  ✅ manage-anomalies.ps1     # Anomaly detection logic
  ✅ populate-kds-brain.ps1   # Crawler/scanner logic

Agents (KDS/prompts/internal/):
  ✅ brain-query.md           # Query logic
  ✅ brain-updater.md         # Update logic
  ✅ brain-reset.md           # This agent
  ✅ brain-crawler.md         # Crawler agent (NEW)
  ✅ intent-router.md         # Routing logic
  ✅ All other agents         # Complete KDS functionality
```

---

## 🔧 Reset Modes

### Mode 1: SOFT RESET (Recommended)
**What:** Preserve protection config, reset all learned data  
**When:** Moving to similar application (same tech stack)  
**Result:** Clean slate with same protection rules

```powershell
# PowerShell
.\KDS\scripts\brain-reset.ps1 -Mode soft
```

**Before:**
```yaml
intent_patterns:
  plan:
    phrases:
      - pattern: "add [X] button"
        confidence: 0.95
        frequency: 12
statistics:
  total_events_processed: 247
protection_config:
  enabled: true
  min_confidence_threshold: 0.70
```

**After:**
```yaml
intent_patterns:
  plan: {}
  execute: {}
  resume: {}
  # ... (empty sections)
statistics:
  total_events_processed: 0
  last_updated: "2025-11-02T18:00:00Z"
protection_config:
  enabled: true
  min_confidence_threshold: 0.70  # PRESERVED
```

### Mode 2: HARD RESET (Factory Default)
**What:** Reset everything to pristine factory state  
**When:** Moving to completely different application/domain  
**Result:** Like fresh KDS installation

```powershell
# PowerShell
.\KDS\scripts\brain-reset.ps1 -Mode hard
```

**Before:**
```yaml
# Custom protection config
protection_config:
  enabled: true
  min_confidence_threshold: 0.60  # Customized
  min_occurrences_for_pattern: 5  # Customized
```

**After:**
```yaml
# Factory default protection config
protection_config:
  enabled: true
  min_confidence_threshold: 0.70  # DEFAULT
  min_occurrences_for_pattern: 3  # DEFAULT
```

### Mode 3: EXPORT-RESET (Portable Templates)
**What:** Export generic learnings before reset  
**When:** Want to preserve generalized patterns (not app-specific)  
**Result:** Clean slate + template library

```powershell
# PowerShell
.\KDS\scripts\brain-reset.ps1 -Mode export-reset -ExportPath ".\brain-templates\"
```

**Exports:**
```
brain-templates/
├── generic-intent-patterns.yaml   # "I want to add *" (no app specifics)
├── generic-workflows.yaml         # UI feature workflow pattern
├── generic-test-patterns.yaml     # Playwright/Percy patterns
└── protection-config.yaml         # Your customized protection rules
```

**Then applies SOFT RESET**

---

## 📋 Reset Workflow

### Standard Reset (Soft)
```
Step 1: Validation
  ✅ Check for active sessions (warn if any)
  ✅ Verify backup directory exists
  ✅ Confirm user intent

Step 2: Backup (Safety First)
  💾 Create timestamped backup:
      KDS/kds-brain/backups/pre-reset-{timestamp}/
      ├── knowledge-graph.yaml
      ├── events.jsonl
      └── anomalies.yaml

Step 3: Reset
  🧹 Clear all learned data
  ✅ Preserve protection_config
  ✅ Reset statistics
  ✅ Initialize empty sections

Step 4: Verification
  ✅ Validate YAML structure
  ✅ Verify protection rules intact
  ✅ Test BRAIN query functionality

Step 5: Confirmation
  ✅ Display summary
  ✅ Show backup location
  ✅ Provide rollback instructions
```

### Export-Reset Workflow
```
Step 1: Extract Generic Patterns
  📊 Identify non-application-specific patterns
  📊 Generalize wildcards ("add * button" instead of "add share button")
  📊 Extract workflow sequences (not file paths)

Step 2: Export to Templates
  💾 Save to specified directory
  📝 Add metadata (source app, extraction date, confidence thresholds)

Step 3: Standard Reset
  (Same as soft reset above)

Step 4: Template Readme
  📄 Create README.md in template directory
  📄 Document how to re-import for new application
```

---

## 🛡️ Safety Features

### Pre-Reset Checks
```powershell
# Check for active sessions
if (Test-Path "KDS/sessions/*.yaml") {
    $activeSessions = Get-ChildItem "KDS/sessions/*.yaml" | 
                      Where-Object { (Get-Content $_) -match "status:\s*in_progress" }
    
    if ($activeSessions.Count -gt 0) {
        Write-Warning "⚠️ $($activeSessions.Count) active session(s) detected!"
        Write-Warning "Complete or archive before reset? (Y/n)"
        # ... confirmation logic
    }
}
```

### Automatic Backup
```powershell
# Always backup before reset
$backupDir = "KDS/kds-brain/backups/pre-reset-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force

Copy-Item "KDS/kds-brain/knowledge-graph.yaml" "$backupDir/"
Copy-Item "KDS/kds-brain/events.jsonl" "$backupDir/" -ErrorAction SilentlyContinue
Copy-Item "KDS/kds-brain/anomalies.yaml" "$backupDir/" -ErrorAction SilentlyContinue

Write-Host "✅ Backup created: $backupDir"
```

### Rollback Capability
```powershell
# Rollback if something goes wrong
.\KDS\scripts\brain-reset.ps1 -Mode rollback -BackupPath "backups/pre-reset-20251102-180000"
```

### Validation After Reset
```powershell
# Verify BRAIN still works
.\KDS\scripts\protect-brain-update.ps1 -Mode validate

# Test query functionality
#file:KDS/prompts/internal/brain-query.md
query_type: system_health
```

---

## 📊 Reset Templates

### Factory Default Knowledge Graph
```yaml
# knowledge-graph.yaml (post soft-reset)
# KDS BRAIN - Knowledge Graph
# Version: 1.0
# Last Updated: 2025-11-02T18:00:00Z
# Purpose: Aggregated learnings from KDS interactions
# STATUS: RESET - Ready for new application

intent_patterns:
  plan: {}
  execute: {}
  resume: {}
  correct: {}
  test: {}
  validate: {}
  ask: {}
  govern: {}

file_relationships: {}

workflow_patterns: {}

correction_history:
  file_mismatch:
    total_occurrences: 0
    common_mistakes: []
  approach_mismatch:
    total_occurrences: 0
    common_mistakes: []
  scope_mismatch:
    total_occurrences: 0
    common_mistakes: []

validation_insights:
  common_failures: []
  test_patterns: {}

feature_components: {}

statistics:
  total_events_processed: 0
  last_updated: "2025-11-02T18:00:00Z"
  knowledge_graph_version: "1.0"
  confidence_threshold: 0.70
  learning_enabled: true
  status: "RESET"

protection_config:
  enabled: true
  version: "1.0"
  description: "Phase 1 Protection - Confidence checks and learning quality thresholds"
  
  learning_quality:
    min_confidence_threshold: 0.70
    min_occurrences_for_pattern: 3
    max_single_event_confidence: 0.50
    anomaly_confidence_threshold: 0.95
    description: "Prevents learning from insufficient data and detects anomalies"
  
  routing_safety:
    enabled: true
    fallback_on_low_confidence: true
    ask_user_threshold: 0.70
    auto_route_threshold: 0.85
    description: "Asks user for clarification when confidence is low"
  
  correction_memory:
    enabled: true
    alert_on_repeated_mistake: 3
    prevent_action_threshold: 5
    track_correction_patterns: true
    description: "Prevents repeating the same mistakes"
  
  validation:
    validate_confidence_scores: true
    validate_file_references: true
    detect_stale_relationships: true
    max_relationship_age_days: 90
    description: "Ensures data integrity and removes stale information"
```

---

## 🎯 Usage Examples

### Example 1: Moving KDS to New Project
```markdown
Scenario: You built an ASP.NET app with KDS, now starting a React app

Step 1: Export generic patterns (optional)
  PowerShell: .\KDS\scripts\brain-reset.ps1 -Mode export-reset -ExportPath ".\kds-templates\aspnet-patterns\"

Step 2: Copy entire KDS/ to new project
  PowerShell: Copy-Item -Recurse "D:\PROJECTS\NOOR CANVAS\KDS" "D:\PROJECTS\NEW-REACT-APP\KDS"

Step 3: BRAIN automatically has clean slate (export-reset did it)
  Result: KDS works immediately with zero learned data but full functionality

Step 4: Start using KDS normally
  #file:KDS/prompts/user/kds.md
  I want to add a login form
```

### Example 2: Cleaning Up After Testing
```markdown
Scenario: You tested KDS extensively, want to reset before production use

Step 1: Soft reset
  PowerShell: .\KDS\scripts\brain-reset.ps1 -Mode soft

Step 2: Verify clean state
  Check: KDS/kds-brain/knowledge-graph.yaml (should show empty sections)

Step 3: Continue development
  #file:KDS/prompts/user/kds.md
  I want to implement dark mode
```

### Example 3: Starting Over Completely
```markdown
Scenario: You customized protection rules, want factory defaults

Step 1: Hard reset
  PowerShell: .\KDS\scripts\brain-reset.ps1 -Mode hard

Step 2: Verify factory defaults
  Check: protection_config in knowledge-graph.yaml (0.70 threshold, etc.)

Step 3: Fresh start
  #file:KDS/prompts/user/kds.md
  I want to add a navbar
```

---

## 🔄 Re-Import Patterns (Optional)

If you exported generic patterns, you can selectively re-import:

### Manual Re-Import
```markdown
#file:KDS/prompts/internal/brain-updater.md

Import patterns from: ./kds-templates/aspnet-patterns/generic-workflows.yaml
Apply confidence reduction: 0.50 (start cautious)
```

### Automatic Re-Import (Future Enhancement)
```powershell
# PowerShell
.\KDS\scripts\brain-import.ps1 -TemplatePath ".\kds-templates\aspnet-patterns\" -ConfidenceMultiplier 0.5
```

---

## ✅ Verification Checklist

After reset, verify:

- [ ] **BRAIN functionality intact**
  ```markdown
  #file:KDS/prompts/internal/brain-query.md
  query_type: system_health
  ```

- [ ] **Protection scripts work**
  ```powershell
  .\KDS\scripts\protect-brain-update.ps1 -Mode validate
  ```

- [ ] **Event logging works**
  ```markdown
  #file:KDS/prompts/user/kds.md
  I want to test event logging
  
  # Check: KDS/kds-brain/events.jsonl (should have new entry)
  ```

- [ ] **All agents load**
  ```markdown
  #file:KDS/prompts/user/plan.md
  #file:KDS/prompts/user/execute.md
  #file:KDS/prompts/user/test.md
  # ... all should work
  ```

- [ ] **Knowledge graph valid**
  ```yaml
  # Should parse without errors:
  statistics:
    status: "RESET"
    learning_enabled: true
  ```

---

## 📚 Integration with KDS

### Router Integration
```markdown
# In intent-router.md

After BRAIN reset, router automatically:
  ✅ Detects empty knowledge graph (statistics.status = "RESET")
  ✅ Falls back to pattern matching (100% of time until learning accumulates)
  ✅ Logs all events normally (BRAIN starts learning immediately)
  ✅ No degradation in functionality (just no learned shortcuts yet)
```

### Session Management
```markdown
# Sessions are independent from BRAIN

Reset BRAIN: ❌ Does NOT delete sessions
Reset BRAIN: ✅ Sessions continue to work
Reset BRAIN: ✅ New sessions use fresh BRAIN
Reset BRAIN: ❌ Does NOT affect work-in-progress
```

---

## 🎓 Best Practices

### When to Reset

✅ **Reset when:**
- Moving KDS to different application
- Switching domains (ASP.NET → React, Desktop → Web)
- After extensive testing (want clean production state)
- BRAIN learned bad patterns (lots of corrections)
- Starting fresh project (zero historical context)

❌ **Don't reset when:**
- You made a single mistake (correction system handles it)
- You want to "undo" recent changes (use rollback instead)
- BRAIN confidence seems low (let it learn more)
- Mid-project (disrupts workflow)

### Choosing Reset Mode

**SOFT RESET:**
- ✅ Moving to similar application (same patterns likely useful)
- ✅ Want to keep protection customizations
- ✅ Clean slate but preserve configuration

**HARD RESET:**
- ✅ Completely different domain
- ✅ Want factory defaults (including protection rules)
- ✅ True "fresh install" experience

**EXPORT-RESET:**
- ✅ Want to preserve generic learnings
- ✅ Building template library
- ✅ Multiple similar projects (share patterns)

---

## 🎯 Summary

**BRAIN Reset = Amnesia, Not Lobotomy**

```
❌ RESET: Application-specific knowledge (file names, patterns, history)
✅ PRESERVE: Core logic, protection rules, all functionality
```

**Three modes:**
- 🔄 **SOFT:** Clean data, keep config
- 🔄 **HARD:** Factory defaults
- 🔄 **EXPORT:** Save generics, then clean

**Safety:**
- 💾 Automatic backups
- ✅ Validation checks
- 🔄 Rollback capability

**Zero downtime:**
- ✅ KDS works immediately after reset
- ✅ No reconfiguration needed
- ✅ Starts learning from first interaction

**Use when moving to new application - full KDS power, zero old context!** 🧠🔄
