# Key: {key-name}

## Metadata
- **Status**: not-started | in-progress | completed | refactored | blocked
- **Created**: YYYY-MM-DD
- **Last Updated**: YYYY-MM-DD
- **Owner**: GitHub Copilot
- **Description**: Brief purpose of this key (one sentence)
- **Complexity**: simple | moderate | complex
- **Debug Level**: simple | detailed | verbose

## File Mappings

### Frontend (Views)
- `SPA/NoorCanvas/Pages/Example.razor` - Brief description of view's purpose
- `SPA/NoorCanvas/Pages/AnotherView.razor` - Another view description

### Frontend (Components)
- `SPA/NoorCanvas/Components/Shared/ExampleComponent.razor` - Component description
- `SPA/NoorCanvas/Components/Feature/SpecificComponent.razor` - Specific feature component

### Backend (Controllers)
- `SPA/NoorCanvas/Controllers/ExampleController.cs` - API endpoints description (GET, POST, PUT, DELETE)
- `SPA/NoorCanvas/Controllers/AnotherController.cs` - Another API controller

### Backend (Services)
- `SPA/NoorCanvas/Services/ExampleService.cs` - Business logic description
- `SPA/NoorCanvas/Services/HelperService.cs` - Helper service description

### Backend (DTOs)
- `SPA/NoorCanvas/Models/ExampleDto.cs` - Data transfer object description
- `SPA/NoorCanvas/Models/RequestDto.cs` - Request DTO description

### Database
- **Tables**:
  - `schema.TableName` (Description: Column1, Column2, Column3)
  - `schema.AnotherTable` (Description: Id, Name, CreatedDate)
- **Scripts**:
  - `Scripts/create-example-table.sql` - Table creation script
  - `Scripts/Validation/verify-example-data.sql` - Validation queries

### Tests
- **E2E (Playwright)**:
  - `Tests/UI/example-feature-test.spec.ts` - Feature workflow test
  - `Tests/UI/verify-example-crud.spec.ts` - CRUD operations test
- **Unit Tests**:
  - `Tests/Unit/ExampleControllerTests.cs` - Controller unit tests
  - `Tests/Unit/ExampleServiceTests.cs` - Service unit tests

### Configuration
- **appsettings.json**:
  - `Feature:SettingName` - Setting description and purpose
  - `Feature:AnotherSetting` - Another setting description
- **Environment Variables**:
  - `FEATURE_DEBUG_MODE` - Enable/disable debug mode
  - `FEATURE_MAX_ITEMS` - Maximum items configuration

### Documentation
- `DocFX/articles/example-feature.md` - Architecture and design overview
- `Workspaces/Documentation/example-api-spec.md` - API documentation
- `Workspaces/Documentation/example-workflow.md` - Feature workflow documentation

## Dependencies
- **Keys**: related-key-1, related-key-2
- **External Libraries**: SignalR, EF Core, Library Name
- **npm Packages**: @microsoft/signalr, package-name

## Summary
Brief overview of what this key accomplishes and its role in the application. Include the main features being implemented or modified.

## Current Work
- Active task 1: Description of what's currently being worked on
- Active task 2: Another active task description
- WIP feature: Work in progress feature description

## Recent Changes
- YYYY-MM-DD: Major change description (commit: abc1234)
- YYYY-MM-DD: Another change description (commit: def5678)

## Related Keys
- **key-name-1**: Brief context of how this key relates
- **key-name-2**: Another related key with context

## Notes
- Important implementation detail or consideration
- Another important note about this key
- Technical debt or future improvements needed

---

## Functionality Registry
**Purpose**: Track core behaviors that MUST continue working across all changes to prevent regressions.

### Core Behaviors (Must Always Work)
- ✅ **Behavior 1**: Description of critical user-facing functionality (e.g., "Valid token in URL → Direct to registration (no flash)")
- ✅ **Behavior 2**: Another critical behavior (e.g., "Invalid token → Show error message")
- ✅ **Behavior 3**: Third core behavior (e.g., "Missing token → Show token entry panel")

### Related Test Coverage
- **Automated Tests**:
  - `Tests/UI/feature-workflow.spec.ts` - Covers behaviors 1, 2, 3
  - `Tests/Unit/ServiceTests.cs` - Unit test coverage for service layer
- **Manual Validation**:
  - Navigate to `/path/to/feature` with valid data
  - Verify behavior X occurs without errors
  - Check browser console for warnings

### Breaking Change Detection
- **File Watch**: Files that control this functionality (triggers validation if modified)
  - `SPA/NoorCanvas/Pages/ComponentName.razor`
  - `SPA/NoorCanvas/Services/ServiceName.cs`
  - `SPA/NoorCanvas/Controllers/ControllerName.cs`
- **Method Watch**: Critical methods that must preserve behavior
  - `ComponentName.OnInitializedAsync()` - Initialization logic
  - `ServiceName.ProcessData()` - Core business logic
- **State Watch**: Important state variables and their expected values
  - `Model.PropertyName` - Expected state transitions
  - `IsFeatureEnabled` - Configuration flags

### Last Validation
- **Date**: YYYY-MM-DD HH:MM:SS (ISO-8601)
- **Method**: automated | manual | hybrid
- **Result**: PASS | FAIL | PARTIAL
- **Notes**: Additional context about validation (e.g., "All automated tests passed, manual UX verification pending")

### Regression History
- YYYY-MM-DD: Regression detected in behavior X (commit: abc1234) - Fixed in commit def5678
- YYYY-MM-DD: Breaking change prevented by validation system (file watch triggered)

---

## Execution Tracking (Auto-populated by task.prompt.md)

### Phases
- **Checkpoint**: ⏳ pending | ✅ completed (duration, timestamp)
- **Plan**: ⏳ pending | ✅ completed (duration, timestamp)
- **Execute**: ⏳ pending | ✅ completed (duration, timestamp)
- **Validate**: ⏳ pending | ✅ completed (duration, timestamp)
- **Confirm**: ⏳ pending | ✅ completed (duration, timestamp)

### Commits
- `abc1234` - commit message description
- `def5678` - another commit message

### Files Modified
- Path to modified file 1
- Path to modified file 2

### Warnings & Errors
- Warning: Description of warning
- Error: Description of error (if any)
