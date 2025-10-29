# Implementation Plan: Portable Prompt System (prompt-port)

**Status**: 🎯 READY FOR APPROVAL  
**Key**: prompt-port  
**Branch**: development  
**Created**: 2025-10-21  
**Agent**: feature (planning)  

---

## 📋 Executive Summary

### Goal
Transform the existing port-instructions and total-recall prompts to create a **truly portable**, **drop-in** AI agent system that can be migrated to any project. The system will maintain the same folder structure as the source project, eliminate the setup.bat/setup.ps1 dependency, and use total-recall for intelligent configuration population.

### Key Outcomes
- ✅ **Drop-in Ready**: Copy `.github/_Portable/` folder → works immediately
- ✅ **No Manual Setup**: No setup.bat/ps1 required - total-recall handles everything
- ✅ **Intelligent Configuration**: total-recall scans new project and populates all templates
- ✅ **Structure Preservation**: Exact same folder hierarchy as source
- ✅ **Template-Based**: All prompts become `{promptname}.prompt.md.template` files
- ✅ **Shared Module Support**: Shared files (no `.template` extension) remain generic
- ✅ **Version Tracking**: Synchronized versioning across source and portable

---

## 🎯 User Request Analysis

### Original Request
> Update #file:port-instructions.prompt.md and #file:total-recall.prompt.md to create a portable version of the current #file:prompts and #file:instructions that can be migrated to a different project and configured via the total-recall prompt. I do not want the setup.bat format. Design it in a way so that when I execute #file:port-instructions.prompt.md, it creates a template version (keep the file names the same as the prompt {promptname}.prompt.md) in the exact same structure as in this project. User should be able to copy the .github folder from #file:_Portable that you created as a drop in for the new project, following exact same structure

### Key Requirements Extracted
1. **No setup.bat/ps1**: Eliminate scripted setup - use total-recall instead
2. **Drop-in ready**: `.github/_Portable/` folder can be copied directly to new project
3. **Template naming**: Keep same structure `{promptname}.prompt.md.template`
4. **Exact structure**: Maintain identical folder hierarchy as source
5. **total-recall configuration**: Use total-recall to scan project and populate templates
6. **Shared files**: Generic files (no `.template` suffix) work across projects

---

## 🏗️ Architecture Analysis

### Current State (.github/ folder structure)
```
.github/
├── prompts/
│   ├── feature.prompt.md           # Planning agent
│   ├── task.prompt.md              # Execution agent
│   ├── refactor.prompt.md          # Refactoring agent
│   ├── test-generation.prompt.md   # Test generation agent
│   ├── cleanup.prompt.md           # Cleanup agent
│   ├── sync.prompt.md              # Sync agent
│   ├── analyze-learning.prompt.md  # Learning analysis
│   ├── cohesion-review.prompt.md   # Cohesion review
│   ├── commit.prompt.md            # Commit message generator
│   ├── healthcheck.prompt.md       # Health check agent
│   ├── question.prompt.md          # Q&A agent
│   └── shared/                     # Shared modules (generic)
│       ├── agent-handoff-protocol.md
│       ├── phase-breakdown-patterns.md
│       ├── image-analysis-protocol.md
│       ├── commit-message-format.md
│       ├── test-orchestration-patterns.md
│       └── [25+ more generic modules]
├── instructions/
│   ├── SelfAwareness.instructions.md
│   └── Links/
│       ├── Architecture.md
│       ├── InfrastructureQuickRef.md
│       ├── SystemIndex.md
│       ├── FunctionalityRegistry.md
│       ├── API-Contract-Validation.md
│       ├── PlaywrightQuickRef.md
│       ├── PlaywrightConfig.MD
│       ├── PlaywrightTestPaths.MD
│       ├── HtmlServiceResponsibilities.md
│       ├── ValidationFramework.md
│       ├── AnalyzerConfig.MD
│       └── PromptEnhancementLibraries.md
└── learning/
    └── [learning infrastructure]
```

### Target State (.github/_Portable/ folder)
```
.github/_Portable/
├── README.md                       # Setup guide (simplified - no scripts)
├── START-HERE.md                   # Quick start guide
├── QUICK-REFERENCE.md              # Variable reference
├── COMPLETE.md                     # Completion checklist
├── prompts/
│   ├── port-instructions.prompt.md # Meta-prompt (no .template)
│   ├── total-recall.prompt.md      # Meta-prompt (no .template)
│   ├── feature.prompt.md.template  # Templated version
│   ├── task.prompt.md.template     # Templated version
│   ├── refactor.prompt.md.template # Templated version
│   ├── [all other prompts].template
│   └── shared/                     # Generic (no .template)
│       ├── agent-handoff-protocol.md
│       ├── phase-breakdown-patterns.md
│       └── [all shared modules - unchanged]
├── instructions/
│   ├── SelfAwareness.instructions.md.template
│   └── Links/
│       ├── Architecture.md.template
│       ├── InfrastructureQuickRef.md.template
│       ├── SystemIndex.md.template
│       └── [all instruction files].template
└── learning/
    └── [learning infrastructure - generic or templated]
```

### Workflow in New Project
```
1. Developer copies .github/_Portable/ → new-project/.github/
2. Developer runs: @workspace /total-recall
3. total-recall:
   - Scans project structure (detects .NET/Node/Python/etc)
   - Discovers database connections, build commands, ports
   - Populates ALL template variables
   - Removes .template extensions
   - Writes populated files to .github/
4. AI agents ready to use immediately
```

---

## 📦 Phase Breakdown

### Phase 1: Update port-instructions.prompt.md (Template Generation Logic)
**Objective**: Redesign port-instructions to create drop-in portable templates without setup scripts

**What Changes**:
- ❌ Remove: Setup.bat/setup.ps1 generation logic
- ✅ Add: "Drop-in Ready" mandate (no setup required)
- ✅ Add: Template file naming convention (`.template` for all non-shared files)
- ✅ Add: Shared file handling (copy as-is, no `.template` suffix)
- ✅ Add: Documentation generation (README explains total-recall setup)
- ✅ Update: Execution steps to focus on template creation only

**Key Deliverables**:
- Updated port-instructions.prompt.md
- No more setup script generation
- Clear documentation about total-recall workflow

**Debug Marker**: `[DEBUG-WORKITEM:prompt-port:phase:1:port-instructions-redesign]`

---

### Phase 2: Update total-recall.prompt.md (Intelligent Configuration)
**Objective**: Enhance total-recall to scan new projects and populate all template variables

**What Changes**:
- ✅ Add: Pre-execution check (verify .template files exist)
- ✅ Add: Project scanning logic (technology stack detection)
- ✅ Add: Variable extraction from templates (find all `{{VARIABLES}}`)
- ✅ Add: Intelligent population (auto-detect or prompt user)
- ✅ Add: Template processing (replace variables, remove .template extension)
- ✅ Add: Validation (ensure all variables populated)
- ✅ Add: Summary report (show what was configured)

**Key Deliverables**:
- Enhanced total-recall.prompt.md
- Comprehensive project scanning
- Automatic template population
- Post-configuration validation

**Debug Marker**: `[DEBUG-WORKITEM:prompt-port:phase:2:total-recall-enhancement]`

---

### Phase 3: Update README.md and Documentation
**Objective**: Rewrite portable system documentation to reflect drop-in workflow

**What Changes**:
- ❌ Remove: Setup script instructions
- ✅ Add: "Drop-In Setup" guide
- ✅ Add: total-recall usage instructions
- ✅ Update: QUICK-REFERENCE.md with all template variables
- ✅ Update: START-HERE.md with simplified workflow
- ✅ Update: COMPLETE.md checklist (post-total-recall verification)

**Key Deliverables**:
- Rewritten README.md (drop-in focused)
- Updated START-HERE.md (3-step setup)
- Updated QUICK-REFERENCE.md (variable catalog)
- Updated COMPLETE.md (validation checklist)

**Debug Marker**: `[DEBUG-WORKITEM:prompt-port:phase:3:documentation-update]`

---

### Phase 4: Test Portable System in Mock Project
**Objective**: Validate drop-in workflow works in a clean environment

**What Changes**:
- ✅ Create mock project (minimal .NET or Node.js setup)
- ✅ Copy `.github/_Portable/` → mock-project/.github/
- ✅ Run total-recall and verify:
  - All templates detected
  - Variables populated correctly
  - Files renamed (no .template extensions)
  - AI agents functional
- ✅ Document any issues/improvements

**Key Deliverables**:
- Validated portable system
- Test report
- Any necessary fixes

**Debug Marker**: `[DEBUG-WORKITEM:prompt-port:phase:4:validation-testing]`

---

### Phase 5: Regenerate .github/_Portable/ Folder FROM SCRATCH
**Objective**: Complete deletion and regeneration of portable system using updated port-instructions

**What Changes**:
- ✅ **DELETE entire `.github/_Portable/` folder** (destructive cleanup)
- ✅ Run updated port-instructions (@workspace /port-instructions)
- ✅ Verify generated structure matches design
- ✅ Verify all template variables correct
- ✅ Verify shared files copied correctly
- ✅ Verify documentation accurate
- ✅ Verify no leftover files from old system
- ✅ Commit finalized portable system

**Destructive Cleanup Process**:
1. Backup current `_Portable` folder (if needed for reference)
2. Delete entire `.github/_Portable/` directory
3. Verify deletion complete (folder no longer exists)
4. Run port-instructions to regenerate from scratch
5. Verify clean regeneration (no remnants of old system)

**Key Deliverables**:
- Completely regenerated .github/_Portable/ folder (fresh start)
- No legacy files or outdated templates
- Ready-to-use portable system
- Version-synced with source prompts

**Debug Marker**: `[DEBUG-WORKITEM:prompt-port:phase:5:portable-regeneration-from-scratch]`

---

## 🧪 Test Plan

### Test Strategy
All testing will be orchestrated via Playwright for consistency with existing infrastructure.

### Test Scenarios

#### Scenario 1: port-instructions Execution (Template Generation)
**Test**: Run `@workspace /port-instructions` and verify output

**Validation**:
- ✅ `.github/_Portable/prompts/` contains all `.template` files
- ✅ `.github/_Portable/prompts/shared/` contains generic files (no `.template`)
- ✅ `.github/_Portable/instructions/` contains all `.template` files
- ✅ Meta-prompts (port-instructions, total-recall) have no `.template` extension
- ✅ README.md explains drop-in workflow (no setup scripts)
- ✅ QUICK-REFERENCE.md lists all template variables
- ✅ All template files contain `{{VARIABLE}}` placeholders

**Test File**: `Tests/Agents/port-instructions-execution.spec.ts`

---

#### Scenario 2: total-recall Configuration (Project Scanning)
**Test**: Copy portable folder to mock project, run total-recall

**Setup**:
```powershell
# Create minimal .NET project
mkdir Tests/MockProjects/DotNetSample
cd Tests/MockProjects/DotNetSample
dotnet new web -n TestApp
cp -r .github/_Portable .github
```

**Validation**:
- ✅ total-recall detects .NET project type
- ✅ total-recall finds all `.template` files
- ✅ total-recall extracts all `{{VARIABLES}}`
- ✅ total-recall prompts for missing values (or auto-detects)
- ✅ total-recall populates all variables
- ✅ total-recall removes `.template` extensions
- ✅ Final .github/ folder ready for use

**Test File**: `Tests/Agents/total-recall-configuration.spec.ts`

---

#### Scenario 3: End-to-End Portable Workflow
**Test**: Complete workflow from generation to usage

**Steps**:
1. Run port-instructions in NOOR CANVAS
2. Copy `.github/_Portable/` to clean mock project
3. Run total-recall in mock project
4. Verify AI agents functional (run test task)

**Validation**:
- ✅ port-instructions generates valid portable system
- ✅ Portable system copied successfully
- ✅ total-recall configures system completely
- ✅ AI agents (feature, task, etc.) work in new project

**Test File**: `Tests/Agents/portable-workflow-e2e.spec.ts`

---

#### Scenario 4: Template Variable Coverage
**Test**: Verify all necessary variables defined and populated

**Validation**:
- ✅ All project-specific values converted to variables
- ✅ No hardcoded NOOR CANVAS values in templates
- ✅ Variables follow naming convention (`{{UPPERCASE_UNDERSCORE}}`)
- ✅ QUICK-REFERENCE.md documents all variables
- ✅ total-recall knows how to populate each variable

**Test File**: `Tests/Agents/template-variable-coverage.spec.ts`

---

### Test Orchestration

All tests will use Playwright test runner:

```powershell
# Run all portable system tests
npx playwright test Tests/Agents/ --grep "portable|port-instructions|total-recall"

# Run specific test
npx playwright test Tests/Agents/total-recall-configuration.spec.ts --headed
```

**Test Report Location**: `Tests/Agents/reports/portable-system-test-report.html`

---

## 📊 Template Variables Catalog

### Project Identity
- `{{PROJECT_NAME}}` - Project name (e.g., "NOOR CANVAS" → "NewProject")
- `{{PROJECT_TYPE}}` - Project type (.NET, Node.js, Python, Java)
- `{{LANGUAGES}}` - Programming languages (C#, JavaScript, TypeScript)
- `{{FRAMEWORKS}}` - Frameworks (ASP.NET Core, Blazor, SignalR)

### Build & Execution
- `{{BUILD_COMMAND}}` - Build command (dotnet build, npm run build)
- `{{TEST_COMMAND}}` - Test command (dotnet test, npm test)
- `{{RUN_COMMAND}}` - Run command (dotnet run, npm start)
- `{{LINT_COMMAND}}` - Linting command (dotnet format, npm run lint)

### Database
- `{{DATABASE_TYPE}}` - Database type (SQL Server, PostgreSQL, MySQL)
- `{{DATABASE_NAME}}` - Primary database name (KSESSIONS → NewProjectDB)
- `{{DATABASE_SERVER}}` - Database server (AHHOME → localhost)
- `{{SCHEMA_PRIMARY}}` - Writable schema (canvas → app_schema)
- `{{SCHEMA_READONLY}}` - Read-only schemas (dbo, audit)
- `{{ORM_TYPE}}` - ORM framework (Entity Framework, Hibernate)

### Infrastructure
- `{{APP_PORT}}` - Application port (9091 → 5000, 3000)
- `{{APP_BASE_URL}}` - Base URL (https://localhost:9091)
- `{{API_BASE_URL}}` - API base URL (if separate from app)
- `{{REALTIME_TECH}}` - Real-time technology (SignalR, Socket.IO, WebSockets)
- `{{UI_FRAMEWORK}}` - UI framework (Blazor Server, React, Vue.js)
- `{{AUTH_TYPE}}` - Authentication type (JWT, OAuth, Cookie-based)

### Paths
- `{{SOURCE_PATH}}` - Main source path (SPA/NoorCanvas → src/)
- `{{TEST_PATH}}` - Test path (Tests/ → tests/, __tests__)
- `{{CONFIG_PATH}}` - Config path (config/ → config/, .env)
- `{{WORKSPACE_PATH}}` - Workspace path (Workspaces/ → workspace/)

### Testing
- `{{TEST_FRAMEWORK}}` - Testing framework (Playwright, Cypress, Selenium)
- `{{TEST_RUNNER}}` - Test runner (xUnit, Jest, PyTest)
- `{{TEST_CONFIG_FILE}}` - Test config file (playwright.config.ts)

### Code Quality
- `{{ANALYZER_TOOLS}}` - Analysis tools (Roslynator, ESLint, Pylint)
- `{{FORMATTER}}` - Code formatter (dotnet format, Prettier, Black)
- `{{PACKAGE_MANAGER}}` - Package manager (NuGet, npm, pip, Maven)

### Domain-Specific (NOOR CANVAS examples → Generic patterns)
- `{{PRIMARY_ENTITY}}` - Main entity type (Session → Order, User, Product)
- `{{ENTITY_ID_TYPE}}` - Entity ID type (int, Guid, string)
- `{{SIGNALR_HUB}}` - SignalR hub name (CanvasHub → NotificationHub)
- `{{TEST_USER_ID}}` - Test user ID (KJAHA99L → test-user-123)
- `{{TEST_HOST_ID}}` - Test host ID (PQ9N5YWW → test-host-456)

**Total Count**: 35+ template variables

---

## 🔗 Cross-Key Dependencies

### Analysis Summary
No conflicts detected. This is a meta-infrastructure change that enhances the portable system without modifying core NOOR CANVAS code.

### Related Keys
- **prompts**: All prompt files will have portable templates created
- **instructions**: All instruction files will have portable templates created
- **learning**: Learning infrastructure templates will be updated

### Coordination Strategy
- Sequential execution (no parallel work needed)
- Version tracking ensures sync between source and portable
- Regeneration can be triggered anytime with port-instructions

---

## ⚠️ Risk Analysis

### Risk 1: total-recall Complexity
**Impact**: High  
**Probability**: Medium  
**Description**: total-recall logic for scanning and populating variables may become complex

**Mitigation**:
- Start with most common project types (.NET, Node.js)
- Provide fallback: User can manually edit templates if auto-detection fails
- Document manual override process clearly

---

### Risk 2: Variable Naming Conflicts
**Impact**: Medium  
**Probability**: Low  
**Description**: Template variable names may conflict across different contexts

**Mitigation**:
- Use descriptive prefixes (e.g., `{{DATABASE_*}}`, `{{APP_*}}`, `{{TEST_*}}`)
- Document all variables in QUICK-REFERENCE.md
- Validate during template processing

---

### Risk 3: Incomplete Template Coverage
**Impact**: High  
**Probability**: Low  
**Description**: Some project-specific values may be missed during templating

**Mitigation**:
- Comprehensive scanning during port-instructions execution
- Validation step checks for unhanded project-specific patterns
- User can report gaps for improvement

---

## 🎓 Learning Integration

### Lessons to Capture
1. **Template-Based Portability Patterns** (New lesson)
   - Variable naming conventions
   - Shared vs templated file strategies
   - Drop-in workflow design

2. **Intelligent Project Scanning** (New lesson)
   - Technology stack detection patterns
   - Configuration extraction techniques
   - Variable population algorithms

3. **Meta-Prompt Design** (New lesson)
   - Self-modifying AI agent systems
   - Bootstrap problem solutions
   - Version synchronization strategies

### Learning File Locations
- `.github/learning/portability/template-based-portability.md`
- `.github/learning/portability/project-scanning-patterns.md`
- `.github/learning/portability/meta-prompt-design.md`

---

## 📝 Commit Strategy

### Commit Format
All commits will follow the enhanced debug marker format:

```
feat(portability): {Description}

[DEBUG-WORKITEM:prompt-port:phase:{N}:{component}]

{Details}

CLEANUP_OK
```

### Commit Sequence

**Phase 1 Commit**:
```
feat(portability): redesign port-instructions for drop-in workflow

[DEBUG-WORKITEM:prompt-port:phase:1:port-instructions-redesign]

- Remove setup.bat/setup.ps1 generation logic
- Add drop-in ready mandate
- Update template naming convention
- Simplify execution steps (template creation only)
- Update documentation sections

Files Modified:
- .github/_Portable/prompts/port-instructions.prompt.md

CLEANUP_OK
```

**Phase 2 Commit**:
```
feat(portability): enhance total-recall with project scanning

[DEBUG-WORKITEM:prompt-port:phase:2:total-recall-enhancement]

- Add pre-execution template validation
- Implement technology stack detection
- Add variable extraction from templates
- Implement intelligent variable population
- Add template processing (variable replacement)
- Add post-configuration validation

Files Modified:
- .github/_Portable/prompts/total-recall.prompt.md

CLEANUP_OK
```

**Phase 3 Commit**:
```
docs(portability): update portable system documentation

[DEBUG-WORKITEM:prompt-port:phase:3:documentation-update]

- Rewrite README.md for drop-in workflow
- Update START-HERE.md with 3-step setup
- Update QUICK-REFERENCE.md with variable catalog
- Update COMPLETE.md with validation checklist

Files Modified:
- .github/_Portable/README.md
- .github/_Portable/START-HERE.md
- .github/_Portable/QUICK-REFERENCE.md
- .github/_Portable/COMPLETE.md

CLEANUP_OK
```

**Phase 4 Commit**:
```
test(portability): validate drop-in workflow in mock project

[DEBUG-WORKITEM:prompt-port:phase:4:validation-testing]

- Create mock .NET project
- Copy portable system
- Run total-recall
- Validate AI agent functionality
- Document test results

Files Added:
- Tests/Agents/port-instructions-execution.spec.ts
- Tests/Agents/total-recall-configuration.spec.ts
- Tests/Agents/portable-workflow-e2e.spec.ts
- Tests/Agents/template-variable-coverage.spec.ts

Test Results:
- All scenarios passing
- Drop-in workflow validated

CLEANUP_OK
```

**Phase 5 Commit**:
```
feat(portability): regenerate portable system from scratch with drop-in design

[DEBUG-WORKITEM:prompt-port:phase:5:portable-regeneration-from-scratch]

- Deleted entire .github/_Portable/ folder (destructive cleanup)
- Executed updated port-instructions for fresh regeneration
- Generated new .github/_Portable/ structure from scratch
- Verified template variables
- Verified shared files
- Confirmed no legacy files remain
- Version sync with source prompts

Files Deleted:
- .github/_Portable/ (entire folder)

Files Created:
- .github/_Portable/ (completely regenerated from scratch)

Status: ✅ Clean regeneration complete, ready for migration to other projects

CLEANUP_OK
```

---

## 📋 Approval Checklist

Before proceeding to execution, confirm:

- [ ] **User Requirements**: All requirements from user request addressed
- [ ] **Architecture**: Folder structure preserves source layout
- [ ] **Drop-In Workflow**: No setup scripts required
- [ ] **total-recall Integration**: Intelligent configuration scanning designed
- [ ] **Template Variables**: Comprehensive variable catalog defined
- [ ] **Testing Strategy**: Test scenarios cover all workflows
- [ ] **Documentation**: README and guides updated for drop-in process
- [ ] **Risk Mitigation**: Known risks identified with mitigation plans
- [ ] **Learning Integration**: New lessons planned for capture
- [ ] **Commit Strategy**: Clear commit sequence with debug markers

---

## 🚀 Next Steps

### After Approval
1. Execute Phase 1: Update port-instructions.prompt.md
2. Execute Phase 2: Update total-recall.prompt.md
3. Execute Phase 3: Update documentation files
4. Execute Phase 4: Validate in mock project
5. Execute Phase 5: Regenerate .github/_Portable/ folder
6. Final validation and commit

### Invocation for Execution
```
@workspace /task key=prompt-port phase=1 user_request="Execute Phase 1: Update port-instructions.prompt.md per plan"
```

---

## 📚 References

### Source Files
- `.github/_Portable/prompts/port-instructions.prompt.md` (current version)
- `.github/_Portable/prompts/total-recall.prompt.md` (current version)
- `.github/_Portable/README.md` (current documentation)

### Related Documentation
- `.github/prompts/shared/phase-breakdown-patterns.md` - Phase breakdown methodology
- `.github/prompts/shared/agent-handoff-protocol.md` - Agent handoff standards
- `.github/prompts/feature.prompt.md` - Planning agent protocol (this execution follows)

### Template Variable Standards
- All variables use `{{UPPERCASE_UNDERSCORE}}` format
- Documented in QUICK-REFERENCE.md
- Extracted and populated by total-recall

---

**END OF PLAN**

**Approval Required**: Please review and approve to proceed with execution.
