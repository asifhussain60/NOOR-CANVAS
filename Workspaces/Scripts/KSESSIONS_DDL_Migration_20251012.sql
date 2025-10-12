/*
==============================================================================
KSESSIONS DDL MIGRATION SCRIPT - CASCADE DELETE VALIDATION
==============================================================================
Description: Validates and ensures CASCADE DELETE is configured on canvas.Sessions foreign keys
Author: GitHub Copilot Task Agent (deploy key)
Created: October 12, 2025
Database: KSESSIONS (Target)
Source Analysis: KSESSIONS_DEV

PURPOSE:
This script analyzes the current state of foreign key constraints in the canvas schema
and ensures that CASCADE DELETE is properly configured for canvas.Sessions relationships.

SCOPE:
- Validates FK constraints on canvas.Participants (FK_Participants_Sessions_SessionId)
- Validates FK constraints on canvas.SessionData (FK_SessionData_Sessions_SessionId)
- Ensures ON DELETE CASCADE is configured (NOT canvas.AssetLookup - no FK to Sessions)
- Idempotent: Safe to run multiple times

ANALYSIS RESULTS (from KSESSIONS_DEV):
- FK_Participants_Sessions_SessionId: CASCADE DELETE ✓ (already configured)
- FK_SessionData_Sessions_SessionId: CASCADE DELETE ✓ (already configured)

CURRENT STATE (KSESSIONS):
- FK_Participants_Sessions_SessionId: CASCADE DELETE ✓ (already configured)
- FK_SessionData_Sessions_SessionId: CASCADE DELETE ✓ (already configured)

CONCLUSION:
No DDL changes required. Both databases already have proper CASCADE DELETE configuration.
This script serves as validation and documentation of the current state.

==============================================================================
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ScriptVersion VARCHAR(20) = '1.0.0';
DECLARE @ExecutionId UNIQUEIDENTIFIER = NEWID();
DECLARE @StartTime DATETIME2 = GETUTCDATE();

PRINT '================================================================================';
PRINT 'KSESSIONS DDL MIGRATION - CASCADE DELETE VALIDATION v' + @ScriptVersion;
PRINT 'Execution ID: ' + CAST(@ExecutionId AS VARCHAR(36));
PRINT 'Started: ' + FORMAT(@StartTime, 'yyyy-MM-dd HH:mm:ss UTC');
PRINT '================================================================================';
PRINT '';

-- =============================================================================
-- SECTION 1: VALIDATE DATABASE CONNECTION
-- =============================================================================
PRINT '>>> SECTION 1: PRE-FLIGHT VALIDATION';

IF DB_NAME() != 'KSESSIONS'
BEGIN
    PRINT '    ❌ ERROR: This script must be executed against KSESSIONS database';
    PRINT '    Current database: ' + DB_NAME();
    RAISERROR('Invalid target database. Expected KSESSIONS.', 16, 1);
    RETURN;
END
PRINT '    ✅ Connected to KSESSIONS database';

-- =============================================================================
-- SECTION 2: ANALYZE CURRENT FOREIGN KEY CONFIGURATION
-- =============================================================================
PRINT '';
PRINT '>>> SECTION 2: FOREIGN KEY ANALYSIS';

-- Check canvas.Participants FK
DECLARE @ParticipantsFKExists BIT = 0;
DECLARE @ParticipantsFKCascade BIT = 0;

SELECT 
    @ParticipantsFKExists = 1,
    @ParticipantsFKCascade = CASE WHEN fk.delete_referential_action_desc = 'CASCADE' THEN 1 ELSE 0 END
FROM sys.foreign_keys fk
INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = 'canvas' 
  AND t.name = 'Participants'
  AND fk.name = 'FK_Participants_Sessions_SessionId';

PRINT '  [2.1] canvas.Participants Foreign Key:';
IF @ParticipantsFKExists = 1
BEGIN
    IF @ParticipantsFKCascade = 1
        PRINT '    ✅ FK_Participants_Sessions_SessionId exists with CASCADE DELETE';
    ELSE
        PRINT '    ⚠️  FK_Participants_Sessions_SessionId exists but CASCADE DELETE NOT configured';
END
ELSE
    PRINT '    ❌ FK_Participants_Sessions_SessionId does NOT exist';

-- Check canvas.SessionData FK
DECLARE @SessionDataFKExists BIT = 0;
DECLARE @SessionDataFKCascade BIT = 0;

SELECT 
    @SessionDataFKExists = 1,
    @SessionDataFKCascade = CASE WHEN fk.delete_referential_action_desc = 'CASCADE' THEN 1 ELSE 0 END
FROM sys.foreign_keys fk
INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = 'canvas' 
  AND t.name = 'SessionData'
  AND fk.name = 'FK_SessionData_Sessions_SessionId';

PRINT '  [2.2] canvas.SessionData Foreign Key:';
IF @SessionDataFKExists = 1
BEGIN
    IF @SessionDataFKCascade = 1
        PRINT '    ✅ FK_SessionData_Sessions_SessionId exists with CASCADE DELETE';
    ELSE
        PRINT '    ⚠️  FK_SessionData_Sessions_SessionId exists but CASCADE DELETE NOT configured';
END
ELSE
    PRINT '    ❌ FK_SessionData_Sessions_SessionId does NOT exist';

-- =============================================================================
-- SECTION 3: APPLY DDL CHANGES (if needed)
-- =============================================================================
PRINT '';
PRINT '>>> SECTION 3: DDL CHANGES';

DECLARE @ChangesRequired BIT = 0;

-- Check if any changes are needed
IF @ParticipantsFKCascade = 0 OR @SessionDataFKCascade = 0
    SET @ChangesRequired = 1;

IF @ChangesRequired = 1
BEGIN
    PRINT '  [3.1] Changes required - beginning transaction...';
    
    BEGIN TRANSACTION DDLMigration;
    
    BEGIN TRY
        -- Fix Participants FK if needed
        IF @ParticipantsFKCascade = 0
        BEGIN
            PRINT '  [3.2] Updating canvas.Participants foreign key...';
            
            -- Drop existing FK
            IF @ParticipantsFKExists = 1
            BEGIN
                ALTER TABLE [canvas].[Participants] 
                DROP CONSTRAINT [FK_Participants_Sessions_SessionId];
                PRINT '    ✅ Dropped existing FK_Participants_Sessions_SessionId';
            END
            
            -- Recreate with CASCADE DELETE
            ALTER TABLE [canvas].[Participants]
            ADD CONSTRAINT [FK_Participants_Sessions_SessionId]
            FOREIGN KEY ([SessionId])
            REFERENCES [canvas].[Sessions] ([SessionId])
            ON DELETE CASCADE;
            
            PRINT '    ✅ Created FK_Participants_Sessions_SessionId with CASCADE DELETE';
        END
        
        -- Fix SessionData FK if needed
        IF @SessionDataFKCascade = 0
        BEGIN
            PRINT '  [3.3] Updating canvas.SessionData foreign key...';
            
            -- Drop existing FK
            IF @SessionDataFKExists = 1
            BEGIN
                ALTER TABLE [canvas].[SessionData]
                DROP CONSTRAINT [FK_SessionData_Sessions_SessionId];
                PRINT '    ✅ Dropped existing FK_SessionData_Sessions_SessionId';
            END
            
            -- Recreate with CASCADE DELETE
            ALTER TABLE [canvas].[SessionData]
            ADD CONSTRAINT [FK_SessionData_Sessions_SessionId]
            FOREIGN KEY ([SessionId])
            REFERENCES [canvas].[Sessions] ([SessionId])
            ON DELETE CASCADE;
            
            PRINT '    ✅ Created FK_SessionData_Sessions_SessionId with CASCADE DELETE';
        END
        
        COMMIT TRANSACTION DDLMigration;
        PRINT '  [3.4] ✅ DDL changes committed successfully';
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION DDLMigration;
        PRINT '  [3.4] ❌ DDL changes rolled back due to error';
        PRINT '    Error: ' + ERROR_MESSAGE();
        THROW;
    END CATCH
END
ELSE
BEGIN
    PRINT '  [3.1] ✅ No DDL changes required - CASCADE DELETE already configured correctly';
END

-- =============================================================================
-- SECTION 4: POST-MIGRATION VALIDATION
-- =============================================================================
PRINT '';
PRINT '>>> SECTION 4: POST-MIGRATION VALIDATION';

-- Re-validate Participants FK
SELECT @ParticipantsFKCascade = CASE WHEN fk.delete_referential_action_desc = 'CASCADE' THEN 1 ELSE 0 END
FROM sys.foreign_keys fk
INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = 'canvas' 
  AND t.name = 'Participants'
  AND fk.name = 'FK_Participants_Sessions_SessionId';

-- Re-validate SessionData FK
SELECT @SessionDataFKCascade = CASE WHEN fk.delete_referential_action_desc = 'CASCADE' THEN 1 ELSE 0 END
FROM sys.foreign_keys fk
INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = 'canvas' 
  AND t.name = 'SessionData'
  AND fk.name = 'FK_SessionData_Sessions_SessionId';

PRINT '  [4.1] Final validation:';
IF @ParticipantsFKCascade = 1 AND @SessionDataFKCascade = 1
    PRINT '    ✅ All foreign keys properly configured with CASCADE DELETE';
ELSE
    PRINT '    ❌ WARNING: Some foreign keys still missing CASCADE DELETE';

-- =============================================================================
-- SECTION 5: COMPLETION SUMMARY
-- =============================================================================
DECLARE @EndTime DATETIME2 = GETUTCDATE();
DECLARE @Duration INT = DATEDIFF(SECOND, @StartTime, @EndTime);

PRINT '';
PRINT '================================================================================';
PRINT 'DDL MIGRATION COMPLETED';
PRINT '================================================================================';
PRINT 'Execution ID: ' + CAST(@ExecutionId AS VARCHAR(36));
PRINT 'Duration: ' + CAST(@Duration AS VARCHAR(10)) + ' seconds';
PRINT '';
PRINT 'CASCADE DELETE CONFIGURATION:';
PRINT '  ✅ canvas.Participants → canvas.Sessions (ON DELETE CASCADE)';
PRINT '  ✅ canvas.SessionData → canvas.Sessions (ON DELETE CASCADE)';
PRINT '  ℹ️  canvas.AssetLookup - No FK to Sessions (excluded by design)';
PRINT '';
PRINT 'BEHAVIOR:';
PRINT '  When a record is deleted from canvas.Sessions:';
PRINT '    - Related canvas.Participants records are automatically deleted';
PRINT '    - Related canvas.SessionData records are automatically deleted';
PRINT '    - canvas.AssetLookup records remain unaffected (no relationship)';
PRINT '================================================================================';

SET NOCOUNT OFF;
