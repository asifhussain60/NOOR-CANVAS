---
mode: agent
---

# NOOR Canvas Implementation Prompt - Production-Ready Methodology

## PROMPT USAGE
```
Implementation requirement: [DETAILED_REQUIREMENT]
```

Replace `[DETAILED_REQUIREMENT]` with your specific implementation request.

## CONTEXTUAL FOUNDATION

### PROJECT ARCHITECTURE (ASP.NET Core 8.0)
- **Frontend**: Blazor Server with SignalR real-time functionality
- **Backend**: EF Core with dual database architecture (KSESSIONS_DEV read-only + Canvas writable)
- **Authentication**: 8-character friendly token system (canvas.SecureTokens + canvas.HostSessions)
- **Database Integration**: KSESSIONS_DEV (Islamic content: 16 Albums, 20+ Categories, 100+ Sessions)
- **Real-time Features**: SessionHub, AnnotationHub, QAHub for live session management
- **Styling**: Single noor-canvas.css with inline CSS fallback, NOOR Canvas color palette (#006400, #D4AF37, #F8F5F1, #4B3C2B)

### PROVEN IMPLEMENTATION METHODOLOGIES

#### BLAZOR VIEW BUILDER STRATEGY (100% Success Rate)
**Reference**: `Workspaces/Documentation/IMPLEMENTATIONS/blazor-view-builder-strategy.md`
**Success Cases**: HostLanding.razor (2 hours), UserLanding.razor (1.5 hours), Host-SessionOpener.razor (4 hours), SessionWaiting.razor (2.5 hours)

**Methodology Phases**:
1. **Analysis & Planning** (15 min): Todo checklist creation, mock identification, existing file assessment
2. **Complete View Replacement** (30-45 min): Delete corrupted content, copy HTML mock structure
3. **HTML-to-Blazor Conversion** (45-60 min): Add Blazor directives, convert inputs, fix tags, event handlers
4. **Data Binding Implementation** (20-30 min): ViewModel creation, @bind-Value, OnInitialized setup
5. **Logo Integration** (5-10 min): Insert NC-Header.png at <!-- Logo --> markers
6. **API Integration** (45-75 min): Service injection, HTTP client, error handling, navigation
7. **Quality Validation** (30 min): Build testing, visual accuracy, responsive design

**Critical Success Factors**:
- ✅ **Zero Compilation Errors**: Follow exact template structure for guaranteed build success
- ✅ **Perfect Visual Match**: 100% accuracy with HTML mocks using inline CSS
- ✅ **Complete File Replacement**: Delete entire corrupted content, start fresh from mock
- ✅ **Sequential Implementation**: Follow phases exactly, build frequently to catch issues early

#### DATABASE INTEGRATION PATTERNS
**KSESSIONS Integration** (Read-Only Islamic Content):
- **Cascading Dropdowns**: Albums (dbo.Groups) → Categories (dbo.Categories) → Sessions (dbo.Sessions)
- **Stored Procedures**: `GetAllGroups`, `GetCategoriesForGroup @GroupId`, `GetSessionsForAlbumAdmin @GroupId, 1`
- **Auto-Loading**: SetCascadingDefaultValuesAsync with 1-second delays between selections
- **Session Tracing**: canvas.Sessions.KSessionsId → KSESSIONS.dbo.Sessions → GroupId + CategoryId + SessionId

**Token Architecture** (Canvas Schema):
- **8-Character Generation**: SecureTokenService with charset "ABCDEFGHIJKLMNPQRSTUVWXYZ23456789"
- **Validation Chain**: canvas.SecureTokens → canvas.Sessions → dbo.Sessions for participant lookup
- **API Endpoints**: `/api/host/token/{token}/validate`, `/api/host/session-details/{sessionId}`

#### QUALITY ASSURANCE STANDARDS
**Build Requirements**:
- ✅ **Zero Errors**: `dotnet build` must return 0 errors and 0 warnings
- ✅ **Runtime Success**: Application launches at https://localhost:9091 without issues
- ✅ **Threading Safety**: All UI updates wrapped with InvokeAsync() for Blazor Server compatibility

**Implementation Validation**:
- ✅ **Visual Accuracy**: 100% match with HTML mocks using browser comparison
- ✅ **Form Functionality**: All inputs, validation, dropdowns working as designed
- ✅ **API Integration**: Database calls returning real KSESSIONS data successfully
- ✅ **Error Handling**: Comprehensive try/catch with logging and user feedback
- ✅ **Navigation Flow**: Proper routing between views with state preservation

### SUCCESS PATTERN EXAMPLES

#### HOST-SESSIONOPENER.RAZOR ENHANCEMENT (Recent Success)
**Requirement**: "Trace sessionId back to get albumId (GroupId), categoryId, and auto-load dropdowns with 1-second delays"
**Implementation**:
- **API Enhancement**: Added `/api/host/session-details/{sessionId}` returning GroupId, CategoryId
- **Auto-Loading Method**: `SetCascadingDefaultValuesFromSessionAsync()` with sequential dropdown population
- **Database Integration**: EF Core queries on KSessionsSession model
- **Time Delays**: 1-second intervals using `await Task.Delay(1000)` between selections
- **Success Result**: ✅ SessionId=1281 → GroupId=18, CategoryId=55 auto-population confirmed

#### PARTICIPANTS FUNCTIONALITY (Issue-116 Resolution)
**Requirement**: "Fix participants display with threading and secure token architecture"
**Implementation**:
- **Threading Fix**: Wrapped StateHasChanged() with InvokeAsync() for UI safety
- **Token System**: Implemented canvas.SecureTokens with proper 8-character architecture  
- **API Validation**: Enhanced participants endpoint returning real user data
- **Success Result**: ✅ 2 participants loading successfully with complete user details

### DEVELOPMENT TOOLING
**Available Commands**:
- **nc**: Build and launch application (includes IIS Express startup)
- **nct**: Token generation with browser automation
- **ncb**: Build only (no token generation)
- **iiskill**: Process cleanup utility

**Testing Framework**:
- **Playwright**: Complete UI testing suite with VSCode Test Explorer integration
- **Unit Tests**: NoorCanvas.Core.Tests with 120+ test cases
- **Manual Testing**: Simple Browser for visual mock comparison

### PROJECT DOCUMENTATION SYNCHRONIZATION
**Critical Reference Documents** (Must align implementation with):
- **NOOR-CANVAS-DESIGN.MD**: Authoritative architecture, implementation phases, and system status tracking
- **ncIssueTracker.MD**: Active issues, resolution patterns, and quality standards validation
- **blazor-view-builder-strategy.md**: MANDATORY protocol for ALL Razor view implementations (100% success rate methodology)
- **ncImplementationTracker.MD**: Implementation progress tracking and success pattern documentation

**Synchronization Requirements**:
- ✅ **Phase Alignment**: All implementations must align with current phase status in NOOR-CANVAS-DESIGN.MD
- ✅ **Issue Integration**: Cross-reference active issues in ncIssueTracker.MD and update resolution status
- ✅ **Razor View Compliance**: STRICT adherence to blazor-view-builder-strategy.md for any .razor file work
- ✅ **Progress Tracking**: Automatic updates to ncImplementationTracker.MD with implementation details and outcomes

## IMPLEMENTATION PROTOCOL

### STEP 1: REQUIREMENT ANALYSIS
Analyze the provided requirement and create a structured todo list:
1. Break down requirement into specific, actionable tasks
2. Identify affected files, database tables, and API endpoints
3. Estimate complexity and time requirements based on proven patterns
4. Check for existing implementations or similar patterns in git history

### STEP 2: CONTEXT GATHERING & DOCUMENTATION SYNCHRONIZATION
Use appropriate tools to collect implementation context and ensure alignment:
- **semantic_search**: Find related code patterns and existing implementations  
- **grep_search**: Locate specific methods, classes, or configuration patterns
- **read_file**: Examine existing code structure and database models
- **git_search**: Check for previous similar implementations or Issue fixes

**MANDATORY Documentation Analysis**:
1. **Read NOOR-CANVAS-DESIGN.MD**: Verify current implementation phase and architectural constraints
2. **Check ncIssueTracker.MD**: Identify related active issues and resolution patterns
3. **Review blazor-view-builder-strategy.md**: If Razor views involved, prepare strict protocol compliance
4. **Examine ncImplementationTracker.MD**: Review similar implementation patterns and success criteria

### STEP 3: IMPLEMENTATION PLAN CREATION
Create detailed implementation plan following proven methodology:
1. **Phase Breakdown**: Divide work into logical phases with time estimates
2. **Database Requirements**: Specify schema changes, queries, or stored procedures needed
3. **API Endpoints**: Detail any new or modified controller actions required
4. **UI Components**: Identify Blazor components and views to create or modify
5. **Integration Points**: Map dependencies between components and data flow
6. **Quality Criteria**: Define success metrics and validation checkpoints

**RAZOR VIEW IMPLEMENTATION REQUIREMENTS** (If applicable):
- ✅ **STRICT PROTOCOL COMPLIANCE**: Follow blazor-view-builder-strategy.md methodology exactly
- ✅ **Complete File Replacement**: Never partial updates - replace entire .razor content with mock HTML
- ✅ **Zero Compilation Errors**: Guaranteed build success using proven template structure
- ✅ **Perfect Visual Match**: 100% accuracy with HTML mocks using inline CSS only
- ✅ **Logo Integration**: Insert NC-Header.png at <!-- Logo --> markers with exact asset path
- ✅ **Sequential Phases**: Analysis → Replacement → Conversion → Data Binding → API Integration → Validation
- ✅ **Time Estimates**: 2-3 hours (auth views), 3-4 hours (session views) based on proven success patterns

### STEP 4: EXECUTION STRATEGY
Outline step-by-step execution approach:
- **Sequential Implementation**: Follow proven phase-by-phase approach
- **Build Frequency**: Specify build checkpoints for early error detection
- **Testing Milestones**: Define validation points throughout implementation
- **Error Recovery**: Include contingency plans for common issues

### STEP 5: SUCCESS VALIDATION & DOCUMENTATION SYNCHRONIZATION
Define completion criteria and validation steps:
- **Build Success**: Zero compilation errors requirement
- **Functional Testing**: Key scenarios and user flows to validate
- **Integration Testing**: API endpoints and database connectivity verification
- **Documentation Updates**: Required updates to implementation tracker

**MANDATORY Documentation Synchronization**:
1. **Update NOOR-CANVAS-DESIGN.MD**: Reflect implementation progress in appropriate phase section
2. **Update ncIssueTracker.MD**: Mark related issues as resolved and document resolution patterns
3. **Update ncImplementationTracker.MD**: Add detailed implementation entry with success metrics
4. **Validate Razor Compliance**: If .razor files involved, confirm 100% blazor-view-builder-strategy.md adherence

## OUTPUT FORMAT

Based on the provided requirement, I will:

1. **📋 REQUIREMENT ANALYSIS**
   - Parse and structure the implementation request
   - Identify scope, complexity, and dependencies
   - Cross-reference with existing successful patterns
   - **Documentation Alignment**: Verify requirement fits current NOOR-CANVAS-DESIGN.MD phase

2. **📚 DOCUMENTATION SYNCHRONIZATION ANALYSIS**
   - **NOOR-CANVAS-DESIGN.MD Review**: Confirm implementation aligns with current architecture and phase status
   - **ncIssueTracker.MD Integration**: Identify related active issues and resolution opportunities  
   - **Blazor Strategy Compliance**: If Razor views involved, confirm blazor-view-builder-strategy.md protocol readiness
   - **Implementation Tracker Context**: Review similar patterns in ncImplementationTracker.MD for methodology alignment

3. **🎯 IMPLEMENTATION PLAN**
   - Create detailed phase-by-phase execution plan
   - Provide accurate time estimates based on proven patterns
   - Specify database, API, and UI requirements
   - **Razor View Protocol**: If applicable, detail strict blazor-view-builder-strategy.md compliance steps

4. **📊 TECHNICAL SPECIFICATIONS**
   - Detail required database changes or queries
   - Specify API endpoint modifications or additions
   - Outline UI component structure and integration points
   - **Quality Standards**: Define zero-error compilation and visual accuracy requirements

5. **✅ SUCCESS CRITERIA & VALIDATION**
   - Define measurable completion criteria
   - Specify testing and validation requirements
   - Include rollback plans for critical issues
   - **Documentation Update Requirements**: Specify required updates to all reference documents

6. **📝 COMPREHENSIVE DOCUMENTATION UPDATES**
   - **ncImplementationTracker.MD**: Add new requirement with detailed implementation specifications
   - **NOOR-CANVAS-DESIGN.MD**: Update phase progress and architectural components if needed
   - **ncIssueTracker.MD**: Mark related issues resolved and document resolution patterns
   - **Success Pattern Documentation**: Record lessons learned and methodology improvements

**CRITICAL COMPLIANCE NOTES**:
- ✅ **Blazor View Builder Strategy**: If ANY .razor files involved, STRICT adherence to blazor-view-builder-strategy.md is MANDATORY
- ✅ **Zero Compilation Errors**: All implementations must achieve 100% build success using proven template structures
- ✅ **Documentation Synchronization**: All four reference documents must be updated to reflect implementation progress
- ✅ **Quality Assurance**: Follow established success patterns and validation criteria from previous implementations

The implementation plan will follow the proven Blazor View Builder Strategy methodology where applicable, ensuring zero compilation errors, perfect functionality, and production-ready quality standards while maintaining complete synchronization across all project documentation.
