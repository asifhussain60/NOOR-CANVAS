# Phase Breakdown Patterns

**Status**: ✅ Production  
**Version**: 1.0.0  
**Last Updated**: 2025-10-20  
**Owner**: feature planning agent  

## Purpose

This module defines the systematic approach for decomposing complex user requests into independently verifiable implementation phases. It ensures consistent phase identification, dependency analysis, and enhancement recommendations across all planning operations.

---

## Phase Breakdown Algorithm

**Objective**: Transform user request into 3-7 independently verifiable phases

**Steps**:

### 1. Concept Extraction (from user_request and context)

- Parse user request for key concepts (e.g., "registration guard", "localStorage", "debug panel")
- Identify explicit phases (delimited by `---` in user_request)
- Extract implicit requirements (e.g., "prevent unauthorized access" → guard logic + tests)

### 2. Layer Mapping (from Architecture Layers)

- Map each concept to affected layers (UI, API, Services, Database, SignalR, Infrastructure)
- **Example**: "registration guard" → UI Layer (components) + Infrastructure (authentication)
- **Example**: "localStorage" → UI Layer (browser storage) + Services (data validation)

### 3. Dependency Analysis

- Identify phase dependencies (Phase B requires Phase A output)
- **Example**: "Add button to UI" (Phase 1) → "Wire button to API" (Phase 2) → "Test end-to-end flow" (Phase 3)
- Detect circular dependencies and break them (split into smaller phases)

### 4. Phase Generation

- **Foundation Phases** (no dependencies): Infrastructure setup, database schema, base services
- **Implementation Phases** (sequential dependencies): UI components → API endpoints → Service logic → Integration
- **Validation Phases** (depends on all): Testing, documentation, final validation
- **Target**: 3-7 phases (split large phases, combine tiny phases)

### 5. Phase Naming

- **Format**: `{Action} {Target}` (e.g., "Add Registration Guard to SessionWaiting")
- Include outcome in name when helpful (e.g., "Add localStorage with 2-Day Expiration")
- Keep concise (3-7 words)

### 6. Phase Deliverables

Each phase specifies:
- **Objectives** (1-5 numbered goals)
- **Context** (files to analyze, previous phase dependencies)
- **Implementation tasks** (TODO items with expected outcomes)
- **Validation checklist** (build, lint, tests)
- **Playwright test specification** (scenarios, guidelines, orchestration)
- **Commit format** (with debug markers)
- **Approval gate** (user must approve before next phase)

---

## Example Phase Breakdown

**User Request**: "Add registration guard to session pages and persist user data with localStorage"

### Concepts Extracted

- Registration guard (authentication/authorization)
- Session pages (multiple UI components)
- localStorage (browser storage + data validation)
- Data persistence (serialization, expiration)

### Layers Affected

- **UI Layer**: SessionWaiting.razor, SessionCanvas.razor, TranscriptCanvas.razor
- **Services Layer**: Data validation, expiration logic
- **Infrastructure**: Authentication checks

### Phase Breakdown

1. **Add Registration Guard to SessionWaiting** (Foundation - UI + Infrastructure)
2. **Add Registration Guard to SessionCanvas** (Depends on Phase 1 pattern)
3. **Add Registration Guard to TranscriptCanvas** (Depends on Phase 1 pattern)
4. **Implement localStorage Infrastructure** (Foundation - UI + Services)
5. **Add Data Validation and Expiration Logic** (Depends on Phase 4)
6. **Integrate Save/Load with Registration Flow** (Depends on Phases 1-5)
7. **Final E2E Testing and Validation** (Depends on all phases)

---

## Intelligent Enhancement Recommendation System

**Objective**: ALWAYS recommend enhancements based on analysis, in addition to user-requested work

**When**: After Technology Stack Discovery and before Iterative Refinement

### Analysis Criteria

#### 1. Architecture Complexity (from affected layers)

**Multi-layer changes** (3+ layers) → Recommend:
- Phase Rollback Strategy (easy recovery)
- Cross-Layer Integration Tests (validation)

**Database changes** → Recommend:
- Migration Rollback Scripts (safety)
- Data Validation Tests (integrity)

**UI + SignalR** → Recommend:
- Multi-Browser Testing (compatibility)
- Real-Time Event Testing (synchronization)

#### 2. Cross-Key Patterns (from cross-key analysis)

**Similar patterns found** → Recommend:
- Pattern Reuse (avoid reinventing)
- Shared Test Library (consistency)

**Conflicting file changes** → Recommend:
- Conflict Detection (early warning)
- Merge Strategy Documentation (coordination)

#### 3. Technology Stack Capabilities (from stack detection)

**Playwright available** → Recommend:
- Visual Regression Testing (Percy)
- Test Flakiness Detection (reliability)

**SignalR present** → Recommend:
- Real-Time Flow Testing (broadcast validation)

**Entity Framework + Database** → Recommend:
- Migration Testing (schema validation)
- Data Seeding for Tests (repeatability)

#### 4. Testing Complexity (from phase count and scope)

**5+ phases** → Recommend:
- Comprehensive Regression Suite (incremental breakage detection)
- Phase Completion Tracking (progress visibility)

**UI changes** → Recommend:
- Automated Selector Generation (framework-aware)
- Interactive Preview Mode (see changes before execution)

#### 5. Maintenance Burden (from file modification count)

**10+ files modified** → Recommend:
- Detailed Change Documentation (traceability)
- Cross-File Impact Analysis (dependency tracking)

**Shared components modified** → Recommend:
- Impact Analysis Report (who else uses this?)
- Backward Compatibility Testing (no breaking changes)

### Recommendation Format

After analysis, present recommendations in categories:

```
## 🎯 Recommended Enhancements (Based on Analysis)

### High Priority (Strongly Recommended)
- **{Enhancement Name}** *(Effort: Low/Medium/High)*  
  Rationale: {Why this is critical based on analysis}  
  Benefit: {Specific value add}

### Medium Priority (Recommended)
- **{Enhancement Name}** *(Effort: Low/Medium/High)*  
  Rationale: {Why this helps based on analysis}  
  Benefit: {Specific value add}

### Low Priority (Optional)
- **{Enhancement Name}** *(Effort: Low/Medium/High)*  
  Rationale: {Why this is nice-to-have}  
  Benefit: {Specific value add}

**Selection**: Respond with comma-delimited list (e.g., "1,2,4" or "none")
```

### Example Analysis-Driven Recommendations

**Detected**: Multi-layer changes (UI + Services + Database), 6 phases, Playwright available, Similar pattern found in 'userlanding' key

**High Priority**:
- **Phase Rollback Strategy** (Low effort) - 6 phases increase failure risk; rollback capability critical
- **Pattern Reuse from 'userlanding'** (Low effort) - Similar registration guard already implemented and tested

**Medium Priority**:
- **Visual Regression Testing (Percy)** (Medium effort) - UI changes require visual validation
- **Test Flakiness Detection** (Low effort) - 6 phases = many tests; identify unreliable tests early

**Low Priority**:
- **Cross-Key Conflict Detection** (High effort) - 'userlanding' modifies same files; coordinate changes

---

## Database Migration Protocol (MANDATORY for Database Changes)

**Trigger**: When Architecture Layers detection identifies **Database Layer** changes

**Purpose**: Automatically create production migration scripts for all database schema changes to ensure safe, auditable deployments

### When to Create Production Migrations

**ALWAYS create migrations when planning includes**:

- ✅ ALTER TABLE (add/modify/drop columns)
- ✅ CREATE TABLE / DROP TABLE
- ✅ CREATE INDEX / DROP INDEX
- ✅ ADD CONSTRAINT / DROP CONSTRAINT (foreign keys, checks, defaults)
- ✅ Schema changes (canvas.* tables)
- ✅ Data migrations (UPDATE, INSERT for schema initialization)

**DO NOT create migrations for**:

- ❌ Development-only changes (KSESSIONS_DEV specific)
- ❌ Temporary test data (will be cleared)
- ❌ Code-only changes (no database impact)

### Migration Creation Protocol

#### Step 1: Detect Database Changes

During Architecture Analysis, if **Database Layer** is affected:

```markdown
### Architecture Layers Affected

- UI Layer: {changes}
- API Layer: {changes}
- **Database Layer**: ALTER TABLE canvas.Sessions ADD CanvasType column ⚠️ **MIGRATION REQUIRED**
```

#### Step 2: Include Migration in Plan Draft

Add to Plan Draft:

```markdown
### ⚠️ Production Migration Required

**Database Changes Detected**: Add CanvasType column to canvas.Sessions

**Migration Will Be Generated**:
- Forward Migration: `Scripts/Migrations/Prod/pending/migration-{timestamp}-{key}-{description}.sql`
- Rollback Script: `Scripts/Migrations/Prod/rollback/rollback-{timestamp}-{key}-{description}.sql`
- Deployment: Automatic via ncdeploy.ps1
```

#### Step 3: Document in {key}.plan.md

Every phase with database changes must include a **Production Migration Specification** section:

```markdown
## Phase {N}: {Title}

### Production Migration Specification

**Migration Required**: YES

**Migration ID**: {YYYYMMDD-HHMMSS} (generated at task execution time)

**Database Changes**:
- ALTER TABLE [canvas].[Sessions] ADD [CanvasType] NVARCHAR(20) NULL DEFAULT 'asset'
- CREATE INDEX IX_Sessions_CanvasType ON [canvas].[Sessions] ([CanvasType])

**Migration Script**: 
- Location: `Scripts/Migrations/Prod/pending/migration-{timestamp}-{key}-add-canvastype-column.sql`
- Rollback: `Scripts/Migrations/Prod/rollback/rollback-{timestamp}-{key}-add-canvastype-column.sql`

**Safety Checks**:
- ✅ Database name validation (KSESSIONS only)
- ✅ Idempotent (IF NOT EXISTS checks)
- ✅ Transaction wrapped (ROLLBACK on error)
- ✅ MigrationHistory tracking

**Rollback Strategy**:
- DROP COLUMN [CanvasType]
- Remove from MigrationHistory
- Auto-executed on migration failure

**Deployment**:
- Executed during ncdeploy.ps1 Step 3 (before code deployment)
- Validated in dry-run mode
- Archived to `archived/{YYYY-MM-DD}/` after success
```

### Migration Script Template (for task agent)

**When task agent executes phase with database changes, generate**:

#### 1. Forward Migration (`pending/migration-{YYYYMMDD-HHMMSS}-{key}-{description}.sql`)

```sql
-- ============================================================================
-- Production Migration Script
-- ============================================================================
-- Migration ID: {YYYYMMDD-HHMMSS}
-- Key: {key}
-- Description: {description}
-- Created: {ISO-8601-timestamp}
-- Author: GitHub Copilot (Agent: task)
-- Database: KSESSIONS (Production)
-- Schema: canvas
-- ============================================================================

-- SAFETY CHECKS
IF DB_NAME() != 'KSESSIONS'
BEGIN
    RAISERROR('ERROR: This migration must run against KSESSIONS database only!', 16, 1)
    RETURN
END
GO

-- Check if already applied
IF EXISTS (SELECT 1 FROM canvas.MigrationHistory WHERE MigrationId = '{YYYYMMDD-HHMMSS}')
BEGIN
    PRINT 'Migration {YYYYMMDD-HHMMSS} already applied - skipping'
    RETURN
END
GO

-- MIGRATION LOGIC
BEGIN TRANSACTION MigrationTrans;

BEGIN TRY
    PRINT 'Starting migration: {description}'
    
    -- {Database changes here - use idempotent checks}
    
    -- Record in history
    INSERT INTO canvas.MigrationHistory (MigrationId, Description, AppliedAt, AppliedBy)
    VALUES ('{YYYYMMDD-HHMMSS}', '{description}', GETUTCDATE(), SYSTEM_USER);
    
    COMMIT TRANSACTION MigrationTrans;
    PRINT '✅ Migration {YYYYMMDD-HHMMSS} completed successfully'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION MigrationTrans;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    PRINT '❌ Migration failed: ' + @ErrorMessage
    RAISERROR(@ErrorMessage, 16, 1);
END CATCH
GO
```

#### 2. Rollback Script (`rollback/rollback-{YYYYMMDD-HHMMSS}-{key}-{description}.sql`)

```sql
-- ============================================================================
-- Production Migration Rollback Script
-- ============================================================================
-- Migration ID: {YYYYMMDD-HHMMSS}
-- Key: {key}
-- Description: Rollback {description}
-- Created: {ISO-8601-timestamp}
-- Author: GitHub Copilot (Agent: task)
-- Database: KSESSIONS (Production)
-- Schema: canvas
-- ============================================================================

-- SAFETY CHECKS
IF DB_NAME() != 'KSESSIONS'
BEGIN
    RAISERROR('ERROR: This rollback must run against KSESSIONS database only!', 16, 1)
    RETURN
END
GO

-- ROLLBACK LOGIC
BEGIN TRANSACTION RollbackTrans;

BEGIN TRY
    PRINT 'Starting rollback: {description}'
    
    -- {Reverse database changes here - use idempotent checks}
    
    -- Update history
    UPDATE canvas.MigrationHistory
    SET RolledBackAt = GETUTCDATE(), RolledBackBy = SYSTEM_USER
    WHERE MigrationId = '{YYYYMMDD-HHMMSS}';
    
    COMMIT TRANSACTION RollbackTrans;
    PRINT '✅ Rollback {YYYYMMDD-HHMMSS} completed successfully'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION RollbackTrans;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    PRINT '❌ Rollback failed: ' + @ErrorMessage
    RAISERROR(@ErrorMessage, 16, 1);
END CATCH
GO
```

### Migration File Naming Convention

**Format**: `migration-{YYYYMMDD-HHMMSS}-{key}-{description}.sql`

**Components**:
- `{YYYYMMDD-HHMMSS}`: Timestamp (ensures unique ID and execution order)
- `{key}`: Implementation key (e.g., `user-landing`, `session-tracking`)
- `{description}`: Kebab-case description (e.g., `add-canvastype-column`)

**Examples**:
- `migration-20251020-143000-user-landing-add-canvastype-column.sql`
- `migration-20251020-150000-session-tracking-add-performance-indexes.sql`

---

## Integration with create-plan.prompt.md

This module is used throughout feature planning agent execution:

- **Step 2 (Phase Breakdown)**: Apply Phase Breakdown Algorithm to generate 3-7 phases
- **Step 2 (Enhancement Recommendations)**: Use Intelligent Enhancement Recommendation System
- **Step 2 (Migration Detection)**: Trigger Database Migration Protocol when Database Layer affected
- **Step 6 ({key}.plan.md writing)**: Document phase deliverables using Phase Deliverables structure
- **Step 6 (task agent handoff)**: Ensure migration specifications included in handoff context

### Example Usage in create-plan.prompt.md

```markdown
### Step 2: Draft Plan

**Phase Breakdown**: Apply [Phase Breakdown Patterns](shared/phase-breakdown-patterns.md) algorithm

1. Extract concepts from user request
2. Map to architecture layers (from Step 0.5)
3. Analyze dependencies
4. Generate 3-7 phases with clear objectives
5. Apply enhancement recommendation system
6. Trigger migration protocol if Database Layer affected
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-20 | Initial extraction from create-plan.prompt.md (Steps 2-4, ~450 lines) |

---

## Related Modules

- [image-analysis-protocol.md](./image-analysis-protocol.md) - AI-powered image analysis for requirement extraction
- [agent-handoff-protocol.md](./agent-handoff-protocol.md) - Standardized agent-to-agent handoffs
- [commit-message-format.md](./commit-message-format.md) - Commit message structure
- [task-parameters-reference.md](./task-parameters-reference.md) - Task agent parameter specifications

