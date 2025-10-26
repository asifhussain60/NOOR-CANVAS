-- =============================================
-- Author:      GitHub Copilot (modified)
-- Create date: 2025-10-26
-- Description: Clean canvas schema for fresh testing (unconditional cleanup)
--              Universal token reset for ALL active sessions.
--              Randomized tokens for security (no hardcoded values).
-- =============================================

CREATE PROCEDURE [canvas].[CleanCanvas]
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        PRINT 'Cleaning canvas schema for fresh testing...';
        
        -- Truncate SessionData (Questions and other data)
        TRUNCATE TABLE [canvas].[SessionData];
        PRINT 'Truncated canvas.SessionData table';
        
        -- Truncate Participants
        TRUNCATE TABLE [canvas].[Participants];
        PRINT 'Truncated canvas.Participants table';
        
        -- Update ALL active sessions with randomized tokens and reset expiration
        UPDATE [canvas].[Sessions]
        SET HostToken = UPPER(LEFT(REPLACE(CAST(NEWID() AS VARCHAR(36)), '-', ''), 8)),
            UserToken = UPPER(LEFT(REPLACE(CAST(NEWID() AS VARCHAR(36)), '-', ''), 8)),
            [ScheduledDate] = NULL,
            [ScheduledDuration] = NULL,
            [ScheduledTime] = NULL,
            ExpiresAt = DATEADD(HOUR, 24, GETUTCDATE()),
            ModifiedAt = GETUTCDATE(),
            Status = 'Created'
        WHERE ExpiresAt IS NULL OR ExpiresAt > GETUTCDATE();
                
        -- Capture and print the count
        DECLARE @UpdatedSessions INT = @@ROWCOUNT;
        PRINT CONCAT('Reset tokens and extended expiration for ', @UpdatedSessions, ' active sessions by 24 hours');
        
        -- Always run selects (active/unexpired records)
        SELECT
            SessionId,
            HostToken,
            UserToken,
            Status,
            [ScheduledDate], [ScheduledDuration], [ScheduledTime],
            CreatedAt,
            ExpiresAt,
            DATEDIFF(HOUR, GETUTCDATE(), ExpiresAt) AS HoursUntilExpiry
        FROM [canvas].[Sessions]
        WHERE ExpiresAt IS NULL OR ExpiresAt > GETUTCDATE()
        ORDER BY SessionId;

        SELECT * FROM canvas.SessionData;
        SELECT * FROM canvas.Participants;
        
        COMMIT TRANSACTION;
        PRINT 'Canvas schema cleaned successfully!';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorNumber INT = ERROR_NUMBER();
        DECLARE @ErrorLine INT = ERROR_LINE();
        
        RAISERROR('Error in CleanCanvas procedure: %s (Error %d at line %d)',
                  16, 1, @ErrorMessage, @ErrorNumber, @ErrorLine);
    END CATCH
END;
