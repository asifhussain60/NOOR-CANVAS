# Completion Workflow Template

## Purpose
Comprehensive cross-layer documentation template for marking tasks as complete.

---

## When to Use
User specifies `tasks: mark complete` or `tasks: completed`

---

## Cross-Layer Documentation Structure

### 1. Frontend Layer
```markdown
## Frontend Layer

### UI Components
- **Component**: {ComponentName.razor}
- **Location**: {file path}
- **Purpose**: {brief description}
- **Props/Parameters**: 
  - {param1}: {type} - {description}
  - {param2}: {type} - {description}
- **Events**: 
  - {event1}: {description}
- **Dependencies**: {list injected services}

### User Journey
1. User {action 1}
2. System {response 1}
3. User {action 2}
4. System {response 2}

### Client-Side Logic
- **JavaScript Files**: {list files}
- **SignalR Connection**: {hub name, methods}
- **State Management**: {approach used}

### Styling
- **CSS Files**: {list files}
- **Theme Support**: {dark mode, responsive, etc.}
- **Accessibility**: {ARIA labels, keyboard nav, etc.}
```

### 2. API Layer
```markdown
## API Layer

### Endpoints
- **GET** `/api/{resource}` - {description}
  - **Query Params**: {list}
  - **Returns**: {type}
  - **Auth**: {required/optional}

- **POST** `/api/{resource}` - {description}
  - **Body**: {DTO type}
  - **Returns**: {type}
  - **Validation**: {rules}

### DTOs
- **{DtoName}**: {file path}
  - Properties: {list with types}
  - Validation: {attributes}

### Authentication
- **Method**: {JWT, cookie, etc.}
- **Claims**: {list required claims}
- **Authorization**: {policies, roles}

### Error Handling
- **Error Codes**: {list custom codes}
- **Validation Errors**: {how returned}
- **Logging**: {approach}
```

### 3. Service Layer
```markdown
## Service Layer

### Services
- **{ServiceName}**: {file path}
  - **Purpose**: {description}
  - **Methods**:
    - `{MethodName}({params})` → {return type}
      - Description: {what it does}
      - Business Logic: {key rules}
  - **Dependencies**: {injected services}

### Business Logic
- **Rule 1**: {description}
- **Rule 2**: {description}
- **Validations**: {list}

### Data Transformations
- {Source} → {Destination}: {transformation logic}

### External Dependencies
- **APIs**: {list external APIs called}
- **Libraries**: {NuGet packages used}

### Caching
- **Strategy**: {approach}
- **Duration**: {TTL}
- **Invalidation**: {when cleared}
```

### 4. Database Layer
```markdown
## Database Layer

### Tables/Models
- **{TableName}**: {schema.table}
  - Columns:
    - `{ColumnName}` {type} {constraints} - {description}
  - Primary Key: {column}
  - Foreign Keys: {list}
  - Indexes: {list}

### Migrations
- **{MigrationName}**: {timestamp}
  - Added: {tables/columns}
  - Modified: {changes}
  - Removed: {deprecated items}

### Queries
- **Query Type**: {SELECT/INSERT/UPDATE/DELETE}
  - SQL: `{query snippet}`
  - Performance: {indexes used, estimated cost}

### Constraints
- **Business Rules**: {enforced in DB}
- **Cascade Rules**: {ON DELETE/UPDATE behavior}
```

### 5. SignalR/Real-Time
```markdown
## SignalR Layer

### Hubs
- **{HubName}**: {file path}
  - **Hub Path**: `/hub/{path}`
  - **Methods**:
    - `{MethodName}({params})` - {description}
  - **Client Methods**: {list methods clients can receive}

### Connection Management
- **Lifecycle**: {connect, disconnect, reconnect}
- **Groups**: {how clients are grouped}
- **Error Handling**: {retry logic, fallback}

### Message Flow
1. {Client action}
2. {Hub method invoked}
3. {Broadcast to} {group/all/specific clients}
4. {Client receives} {method name}
5. {UI updates}

### Performance
- **Concurrent Connections**: {expected load}
- **Message Size**: {typical payload size}
- **Throttling**: {rate limits if any}
```

### 6. Configuration
```markdown
## Configuration

### appsettings.json
```json
{
  "FeatureFlags": {
    "{FeatureName}": true
  },
  "ConnectionStrings": {
    "DefaultConnection": "{value}"
  },
  "{Section}": {
    "{Key}": "{Value}"
  }
}
```

### Environment Variables
- `{VAR_NAME}`: {description} - {default value}

### Feature Flags
- **{FlagName}**: {enabled/disabled} - {purpose}

### External Services
- **Service**: {name}
  - Endpoint: {URL}
  - Auth: {method}
  - Config: {keys used}
```

### 7. Testing Coverage
```markdown
## Testing Coverage

### Unit Tests
- **{TestClass}**: {file path}
  - Tests: {count}
  - Coverage: {percentage}
  - Key Scenarios: {list}

### Integration Tests
- **{TestClass}**: {file path}
  - Tests: {count}
  - Database: {in-memory/test DB}
  - External Dependencies: {mocked/stubbed}

### Playwright E2E Tests
- **{test-file}.spec.ts**: {location}
  - Browsers: {chromium, firefox, webkit}
  - Scenarios: {list}
  - Results: {X passed, Y failed}
  - Artifacts: {screenshots, traces}

### Visual Regression Tests
- **{test-file}-visual.spec.ts**: {location}
  - Percy Snapshots: {count}
  - States Tested: {default, hover, active, etc.}
  - Results: {approved/changes detected}

### Test Results
- **Last Run**: {timestamp}
- **Status**: {All Passed | X Failed}
- **Failed Tests**: {list if any}
```

### 8. Dependencies
```markdown
## Dependencies

### NuGet Packages
- **{PackageName}** {version} - {purpose}
- **{PackageName}** {version} - {purpose}

### npm Packages
- **{package-name}** {version} - {purpose}
- **{package-name}** {version} - {purpose}

### Framework Versions
- **.NET**: {version}
- **Blazor**: {Server/WebAssembly/Hybrid}
- **Entity Framework**: {version}
- **SignalR**: {version}

### External Services
- **Service**: {name}
  - Version/API: {version}
  - Documentation: {URL}
  - Contact: {support email/Slack}
```

---

## Completion Summary Template

Save completion summaries as Markdown files under:
- `Workspaces/Copilot/_DOCS/summaries/{key}-work-log.md`
Do NOT save any Markdown in `.github/prompts/` or `.github/instructions/`.

```markdown
# {Feature Name} - Completion Summary

**Status**: ✅ COMPLETE  
**Date**: {ISO-8601 timestamp}  
**Key**: {key-name}

## Feature Summary
{2-3 sentence description of what was built}

## Complete Workflow
{Brief end-to-end description of user journey}

## Files Modified
- {file1}: {type of change}
- {file2}: {type of change}
- {file3}: {type of change}

## Architectural Decisions
1. **Decision**: {what was decided}
   - **Rationale**: {why this approach}
   - **Alternatives Considered**: {other options}
   - **Trade-offs**: {pros/cons}

## Known Limitations
- {Limitation 1}: {description, workaround if any}
- {Limitation 2}: {description, workaround if any}

## Future Considerations
- {Enhancement 1}: {brief description}
- {Enhancement 2}: {brief description}

## Validation Results
- **Build**: ✅ Clean (0 errors, 0 warnings)
- **Unit Tests**: ✅ {X} passed
- **Integration Tests**: ✅ {Y} passed
- **E2E Tests**: ✅ {Z} passed
- **Visual Tests**: ✅ {A} snapshots approved
- **Code Analysis**: ✅ Roslynator clean
- **CSS Lint**: ✅ Stylelint clean

## Cross-Reference
- **Related Keys**: {list if any}
- **Documentation**: {links to Architecture.md sections}
- **Tests**: {links to test files}
```

---

## Obsolete Information Cleanup

### What to Remove
- Superseded implementations (old approaches that were replaced)
- Failed attempts (experiments that didn't work)
- Temporary workarounds (replaced by permanent solutions)
- Outdated architecture decisions (changed during development)
- Stale dependencies (packages removed or replaced)
- Debug/diagnostic code (unless explicitly requested to keep)

### What to Keep
- Current, working implementation details
- Successful patterns (for future reference)
- Active architectural decisions
- Known issues with workarounds
- Future enhancement ideas
- Final test results

---

## Output Format

### User Sees (Concise):
```
✅ Key marked as COMPLETE
📝 Comprehensive documentation added to work-log.md
🗑️ Obsolete information removed
🧹 Debug markers cleaned from {X} files
```

### work-log.md Contains (Full Detail) (stored under Workspaces/Copilot/_DOCS/summaries/):
- Complete cross-layer documentation (8 sections above)
- Completion summary
- Validation results
- Git commit references
