# Key Data Streams Index

**Purpose**: Maps workflow keys to their orchestration patterns

**Format**: `{key}: {prompt-sequence}`

**Location**: Each key's data stream is stored in `.github/key-data-streams/{key}/`

---

## Active Keys

### Canvas Maintenance
canvas-maintenance: plan → todo → task → healthcheck

### UI Components
ui-debug-panel: plan → task → test-generation → healthcheck

### Code Quality
refactor-quality: plan → task → healthcheck

### Documentation
sync-docs: plan → task → healthcheck

### Operations
ops-cleanup: plan → task → healthcheck

---

## Key Data Stream Structure

Each key folder contains:
- `{key}.plan.md` - Complete technical plan
- `{key}.plan.json` - Phase tracking metadata
- `work-log.md` - Execution history
- `rollback-index.md` - Checkpoint commit tracking
- `tests/` - Key-specific test files (optional)
- `scripts/` - Orchestration scripts (optional)

---

## Usage

**Create New Key**:
```
@workspace /plan key:new-feature-name
```

**Continue Existing Key**:
```
@workspace /todo key:existing-feature
```

**List All Keys**:
```powershell
Get-ChildItem .github/key-data-streams -Directory
```
