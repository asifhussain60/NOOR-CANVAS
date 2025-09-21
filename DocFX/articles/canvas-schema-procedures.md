# Canvas Schema Stored Procedures

## canvas.StartFresh 🔄

**Purpose**: Comprehensive database cleanup procedure for development environment reset

### Overview

The `StartFresh` stored procedure provides a safe, controlled method to completely reset the canvas schema to an empty state while preserving all Islamic content in the `dbo` schema. This procedure is essential for development workflows and testing scenarios.

### Procedure Signature

```sql
CREATE PROCEDURE [canvas].[StartFresh]
    @ConfirmationToken NVARCHAR(50) = NULL,
    @DryRun BIT = 1
AS
```

### Parameters

| Parameter            | Type           | Default | Description                                         |
| -------------------- | -------------- | ------- | --------------------------------------------------- |
| `@ConfirmationToken` | `NVARCHAR(50)` | `NULL`  | Required safety token for live execution            |
| `@DryRun`            | `BIT`          | `1`     | Safety mode: 1 = preview only, 0 = actual execution |

### Safety Features

#### 🔒 Database Validation

- **Enforced Environment**: Only executes in `KSESSIONS_DEV` database
- **Production Protection**: Fails immediately if run against `KSESSIONS` (production)
- **Database Name Check**: `DB_NAME()` validation with detailed error reporting

#### 🛡️ Confirmation Mechanism

- **Required Token**: Live execution requires `@ConfirmationToken = 'NOOR_CANVAS_START_FRESH'`
- **Default Dry Run**: Safe preview mode by default (`@DryRun = 1`)
- **Double Confirmation**: Both token AND `@DryRun = 0` required for data deletion

#### 📊 Comprehensive Reporting

- **Pre-execution Analysis**: Shows all tables and current row counts
- **Impact Assessment**: Displays total tables and rows to be affected
- **Progress Tracking**: Real-time feedback during execution
- **Final Summary**: Completion status and cleanup results

### Execution Modes

#### Dry Run Mode (Default)

```sql
-- Safe preview - shows what WOULD be deleted
EXEC canvas.StartFresh
-- OR explicitly
EXEC canvas.StartFresh @DryRun = 1
```

**Output Example**:

```
NOOR-CANVAS-STARTFRESH: DRY RUN MODE - No data will be deleted
NOOR-CANVAS-STARTFRESH: Tables to be truncated:
  - canvas.AdminSessions (0 rows)
  - canvas.Annotations (0 rows)
  - canvas.AuditLog (0 rows)
  [... additional tables ...]
NOOR-CANVAS-STARTFRESH: Total tables: 15, Total rows: 0
```

#### Live Execution Mode

```sql
-- DANGER: Permanently deletes all canvas schema data
EXEC canvas.StartFresh
    @ConfirmationToken = 'NOOR_CANVAS_START_FRESH',
    @DryRun = 0
```

### Technical Implementation

#### Foreign Key Constraint Handling

The procedure handles complex foreign key relationships through:

- **Dependency Analysis**: Identifies table truncation order
- **Constraint Disabling**: Temporarily disables FK constraints where needed
- **Ordered Execution**: Truncates child tables before parent tables
- **Fallback Strategy**: Uses DELETE operations when TRUNCATE fails

#### Truncation Hierarchy

```
Level 3: QuestionAnswers, QuestionVotes (depend on Questions)
Level 2: Questions, Annotations, SharedAssets (depend on Sessions/Users)
Level 1: Registrations, SessionParticipants (session associations)
Level 0: Sessions, Users, SecureTokens (core entities)
```

#### Identity Seed Reset

- **DBCC CHECKIDENT**: Resets identity seeds to 0
- **Clean Slate**: Ensures predictable ID sequences for testing
- **Consistency**: Maintains uniform starting state

### Error Handling

#### Security Violations

```sql
-- Example error output
SECURITY VIOLATION: StartFresh can only be executed in KSESSIONS_DEV database. Current database: KSESSIONS
```

#### Safety Check Failures

```sql
-- Example safety error
SAFETY CHECK: To execute StartFresh, provide @ConfirmationToken = 'NOOR_CANVAS_START_FRESH' and @DryRun = 0
```

#### Transaction Protection

- **BEGIN TRANSACTION**: Wraps all operations
- **ROLLBACK on Error**: Automatic rollback on any failure
- **Atomic Operation**: All-or-nothing execution guarantee

### Integration with Development Workflow

#### Pre-Development Setup

```powershell
# Complete development environment reset
iiskill                    # Stop IIS processes
nc-reset-db               # Execute StartFresh procedure
nc 215                    # Launch with fresh session
```

#### Testing Scenarios

- **Unit Test Setup**: Clean environment for each test suite
- **Integration Testing**: Known state for component testing
- **Performance Testing**: Baseline measurements from empty state
- **Demo Preparation**: Clean slate for demonstrations

### Monitoring and Audit

#### Execution Logging

All StartFresh executions are logged with:

- **Timestamp**: Execution start and completion times
- **User Context**: Who executed the procedure
- **Parameters**: Dry run mode and confirmation token usage
- **Results**: Tables affected and rows deleted

#### Schema Preservation Verification

The procedure includes built-in verification that:

- **DBO Schema Intact**: No Islamic content is affected
- **Canvas Schema Only**: Only application tables are truncated
- **Relationship Integrity**: Foreign key constraints are properly restored

### Security Considerations

#### Access Control

- **Restricted Execution**: Requires appropriate database permissions
- **Environment Isolation**: Development database only
- **Audit Trail**: All executions logged for security review

#### Best Practices

- **Always Dry Run First**: Preview changes before live execution
- **Backup Before Reset**: Ensure recent backup before major cleanups
- **Coordinate with Team**: Communicate reset activities with other developers
- **Verify Environment**: Double-check database name before execution

---

### Usage Examples

#### Development Environment Reset

```sql
-- 1. Preview the cleanup (safe)
EXEC canvas.StartFresh

-- 2. Review the output and confirm scope

-- 3. Execute the actual cleanup
EXEC canvas.StartFresh
    @ConfirmationToken = 'NOOR_CANVAS_START_FRESH',
    @DryRun = 0
```

#### Automated Testing Integration

```sql
-- Test setup procedure
IF EXISTS (SELECT 1 FROM canvas.Sessions)
BEGIN
    EXEC canvas.StartFresh
        @ConfirmationToken = 'NOOR_CANVAS_START_FRESH',
        @DryRun = 0
    PRINT 'Test environment reset completed'
END
```

#### Scheduled Maintenance

```sql
-- Weekly development environment cleanup
-- (Typically run via scheduled job or CI/CD pipeline)
EXEC canvas.StartFresh
    @ConfirmationToken = 'NOOR_CANVAS_START_FRESH',
    @DryRun = 0
```

---

**⚠️ CRITICAL SAFETY REMINDER**: This procedure **PERMANENTLY DELETES** all data in the canvas schema. The Islamic content in the `dbo` schema is preserved, but all application sessions, users, questions, annotations, and related data will be **IRREVERSIBLY REMOVED**. Always run in dry-run mode first and ensure you have proper backups before live execution.
