-- =============================================
-- Author:      GitHub Copilot
-- Create date: 2025-09-24
-- Description: Clean canvas schema for fresh testing
-- =============================================
CREATE OR ALTER PROCEDURE [canvas].[CleanCanvas]
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Clean out test data from canvas schema
        PRINT 'Cleaning canvas schema for fresh testing...';
        
        -- Truncate SessionData (Questions and other data)
        TRUNCATE TABLE [canvas].[SessionData];
        PRINT 'Truncated canvas.SessionData table';
        
        -- Truncate Participants
        TRUNCATE TABLE [canvas].[Participants];
        PRINT 'Truncated canvas.Participants table';
        
        -- Update Sessions table to extend token expiration by 24 hours
        -- Only update sessions that are not already expired
        UPDATE [canvas].[Sessions]
        SET ExpiresAt = DATEADD(HOUR, 24, GETUTCDATE()),
            ModifiedAt = GETUTCDATE(),
            Status='Created'
        WHERE ExpiresAt IS NULL OR ExpiresAt > GETUTCDATE();
        
        DECLARE @UpdatedSessions INT = @@ROWCOUNT;
        PRINT CONCAT('Extended expiration for ', @UpdatedSessions, ' active sessions by 24 hours');
        
        -- Special handling for SessionID 212 - extend to 1 week for testing
        UPDATE [canvas].[Sessions]
        SET ExpiresAt = DATEADD(DAY, 7, GETUTCDATE()),
            ModifiedAt = GETUTCDATE(),
            Status='Active'
        WHERE SessionId = 212;
        
        IF @@ROWCOUNT > 0
            PRINT 'Extended SessionID 212 expiration to 1 week for testing purposes';
        ELSE
            PRINT 'SessionID 212 not found - no special extension applied';
        
        -- Display current active sessions
        SELECT 
            SessionId,
            HostToken,
            UserToken,
            Status,
            CreatedAt,
            ExpiresAt,
            DATEDIFF(HOUR, GETUTCDATE(), ExpiresAt) AS HoursUntilExpiry
        FROM [canvas].[Sessions]
        WHERE ExpiresAt IS NULL OR ExpiresAt > GETUTCDATE()
        ORDER BY SessionId;
        
        COMMIT TRANSACTION;
        PRINT 'Canvas schema cleaned successfully!';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorNumber INT = ERROR_NUMBER();
        DECLARE @ErrorLine INT = ERROR_LINE();
        
        RAISERROR('Error in CleanCanvas procedure: %s (Error %d at line %d)', 16, 1, @ErrorMessage, @ErrorNumber, @ErrorLine);
    END CATCH
END;
GO

-- Grant execute permissions
GRANT EXECUTE ON [canvas].[CleanCanvas] TO [public];
GO

PRINT 'Stored procedure canvas.CleanCanvas created successfully!';