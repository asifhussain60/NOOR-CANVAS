# Test Generation Validation Protocol

**Purpose:** Validate key data stream infrastructure and branch before test generation

**Referenced by:** test-generation.prompt.md (Step 0, Step 0.1)

---

## Step 0: Key Folder Existence Validation

**Trigger:** ALWAYS when test-generation.prompt.md is invoked

**Purpose:** Verify key data stream infrastructure exists before generating tests

### Validation Sequence

**1. Check if key folder exists:** `.github/key-data-streams/{key}/`

- If NOT exists → HALT immediately
- Error message to user:
  ```
  ❌ ERROR: Key data stream not found
  
  Key: {key}
  Expected path: .github/key-data-streams/{key}/
  
  Tests cannot be generated without a valid key infrastructure.
  The planning agent creates the folder structure and comprehensive plan.
  The task agent delegates to test-generation during Step 6.1 (UI changes).
  
  REQUIRED ACTIONS:
  1. Create plan first: @workspace /plan key={key} {feature-description}
  2. Plan creates key infrastructure automatically
  3. Task agent will invoke test-generation automatically when needed
  
  Or manually create key folder:
  mkdir -p .github/key-data-streams/{key}
  mkdir -p .github/key-data-streams/{key}/tests
  mkdir -p .github/key-data-streams/{key}/scripts
  ```
- **EXIT with status code 1** (do not proceed)

**2. Check if test directory exists:** `.github/key-data-streams/{key}/tests/`

- If NOT exists → Create it automatically
- Log: `"Created test directory: .github/key-data-streams/{key}/tests/"`
- Action:
  ```powershell
  New-Item -ItemType Directory -Path ".github/key-data-streams/{key}/tests" -Force
  ```

**3. Check if scripts directory exists:** `.github/key-data-streams/{key}/scripts/`

- If NOT exists → Create it automatically
- Log: `"Created scripts directory: .github/key-data-streams/{key}/scripts/"`
- Action:
  ```powershell
  New-Item -ItemType Directory -Path ".github/key-data-streams/{key}/scripts" -Force
  ```

**4. Check if test registry exists:** `.github/key-data-streams/{key}/tests/test-registry.md`

- If NOT exists → Create it using template (see test-registry-protocol.md)
- If exists → Load for deduplication check
- Action:
  ```powershell
  # Create new test registry
  $registryPath = ".github/key-data-streams/{key}/tests/test-registry.md"
  if (-not (Test-Path $registryPath)) {
    @(
      "# Test Registry: {key}",
      "",
      "**Purpose:** Track all tests generated for this key data stream",
      "**Last Updated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
      "",
      "---",
      "",
      "## Active Tests",
      "",
      "_(No tests generated yet)_",
      "",
      "---",
      "",
      "## Archived Tests (Promoted to Production)",
      "",
      "_(No tests promoted yet)_"
    ) | Set-Content -Path $registryPath
  }
  ```

### Validation Output

**Concise mode:**
```
✓ Key infrastructure validated
```

**Detailed mode:**
```
✓ Key Infrastructure Validation

Key: {key}
Key Folder: EXISTS
Test Directory: {CREATED | EXISTS}
Scripts Directory: {CREATED | EXISTS}
Test Registry: {CREATED | EXISTS}

Ready for test generation.
```

---

## Step 0.1: Branch Verification (MANDATORY)

**Trigger:** ALWAYS after Step 0 succeeds

**Purpose:** Ensure test generation occurs in correct branch (development, not master)

### Branch Strategy

- **`master`** - Production only (PROTECTED - deploy target)
  - Only receives tested merges from development
  - NEVER commit directly to master
  - Deployment script (`ncdeploy.ps1`) deploys from this branch

- **`development`** - ALL development work (DEFAULT)
  - All feature implementations
  - All bug fixes
  - All testing and experimentation
  - Agents should ALWAYS work in this branch

### Verification Algorithm

**1. Check current branch:**

```bash
git branch --show-current
# Expected output: development
```

**2. If on wrong branch:**

```bash
# Automatically switch to development
git checkout development
```

**3. Enforcement:**

- ⚠️ **ABORT** test generation if on `master` branch AND auto-switch fails
- ✅ **PROCEED** only if on `development` branch
- Error message if stuck on master:
  ```
  ❌ ERROR: Cannot generate tests on master branch
  
  Current branch: master
  Required branch: development
  
  The master branch is PROTECTED and only receives tested merges from development.
  All test generation must occur in the development branch.
  
  REQUIRED ACTION:
  git checkout development
  
  Then re-run test generation command.
  
  RATIONALE:
  - Production stability: master only contains tested, deployable code
  - Safe experimentation: development allows iteration without affecting production
  - Clear deployment path: ncdeploy.ps1 knows to deploy from master
  - Easy rollback: Can revert master without losing development work
  
  See: SelfAwareness.instructions.md - Branch Strategy section
  ```

**See:** `.github/instructions/SelfAwareness.instructions.md` - Branch Strategy section

### Verification Output

**Concise mode:**
```
✓ Branch verified: development
```

**Detailed mode:**
```
✓ Branch Verification

Current Branch: development
Target Branch: development (from plan or default)
Status: MATCH

Proceeding with test generation.
```

---

## Error Handling

**If validation fails at any step:**

1. **Log error** with specific failure point
2. **Show user-friendly message** with corrective actions
3. **EXIT with status code 1** (do not proceed to test generation)
4. **Do NOT attempt to generate tests** with invalid infrastructure

**If validation succeeds:**

1. **Log success** (concise or detailed based on verbosity)
2. **Proceed to Step 1** (Authentication Detection)
3. **Load next module:** `.github/prompts/shared/test-gen/authentication-detection.md`

---

## Integration Points

**Called by:**
- test-generation.prompt.md (Step 0, Step 0.1)

**Calls:**
- test-registry-protocol.md (if creating new test registry)

**Prerequisites:**
- Git repository initialized
- Key data stream may or may not exist (validation creates if missing)

**Postconditions:**
- Key infrastructure validated and ready
- Correct branch verified (development)
- Test registry initialized
- Ready to proceed with test generation
