-- =============================================-- =============================================

-- Author:      GitHub Copilot (modified)

-- Create date: 2025-09-24-- Author:      GitHub Copilot (modified)-- =============================================

-- Description: Clean canvas schema for fresh testing (unconditional cleanup)

--              Refactored to ensure SessionId 212 always has 24hr expiration.-- Create date: 2025-09-24-- Author:� � � GitHub Copilot (modified)

--              Optimized by preventing SessionId 212 from being updated twice.

-- =============================================-- Description: Clean canvas schema for fresh testing (unconditional cleanup)-- Create date: 2025-09-24

CREATE PROCEDURE [canvas].[CleanCanvas]

AS--              Refactored to ensure SessionId 212 always has 24hr expiration.-- Description: Clean canvas schema for fresh testing (unconditional cleanup)

BEGIN

    SET NOCOUNT ON;--              Optimized by preventing SessionId 212 from being updated twice.--              Refactored to ensure SessionId 212 always has 24hr expiration.

    

    BEGIN TRY-- =============================================--              Optimized by preventing SessionId 212 from being updated twice.

        BEGIN TRANSACTION;

        CREATE PROCEDURE [canvas].[CleanCanvas]-- =============================================

        PRINT 'Cleaning canvas schema for fresh testing...';

        ASCREATE PROCEDURE [canvas].[CleanCanvas]

        -- Truncate SessionData (Questions and other data)

        TRUNCATE TABLE [canvas].[SessionData];BEGINAS

        PRINT 'Truncated canvas.SessionData table';

            SET NOCOUNT ON;BEGIN

        -- Truncate Participants

        TRUNCATE TABLE [canvas].[Participants];    � � SET NOCOUNT ON;

        PRINT 'Truncated canvas.Participants table';

            BEGIN TRY� ��

        -- Update all active sessions to extend expiration by 24 hours, excluding SessionId 212

        UPDATE [canvas].[Sessions]        BEGIN TRANSACTION;� � BEGIN TRY

        SET ExpiresAt = DATEADD(HOUR, 24, GETUTCDATE()),

            ModifiedAt = GETUTCDATE(),        � � � � BEGIN TRANSACTION;

            Status='Created'

        WHERE (ExpiresAt IS NULL OR ExpiresAt > GETUTCDATE())        PRINT 'Cleaning canvas schema for fresh testing...';� � � ��

            AND SessionId <> 212; -- Exclude SessionId 212 to prevent redundant update

                � � � � PRINT 'Cleaning canvas schema for fresh testing...';

        -- Capture and print the count for the general update

        DECLARE @UpdatedSessions INT = @@ROWCOUNT;        -- Truncate SessionData (Questions and other data)� � � ��

        PRINT CONCAT('Extended expiration for ', @UpdatedSessions, ' other active sessions by 24 hours');

                TRUNCATE TABLE [canvas].[SessionData];� � � � -- Truncate SessionData (Questions and other data)

        -- Dedicated UPDATE for SessionId=212 to reset tokens and ensure 24-hour expiration

        UPDATE canvas.Sessions        PRINT 'Truncated canvas.SessionData table';� � � � TRUNCATE TABLE [canvas].[SessionData];

        SET HostToken='PQ9N5YWW',

            UserToken='KJAHA99L',        � � � � PRINT 'Truncated canvas.SessionData table';

            [ScheduledDate]=NULL,

            [ScheduledDuration]=NULL,        -- Truncate Participants� � � � � ��

            ExpiresAt = DATEADD(HOUR, 24, GETUTCDATE()), -- **MANDATORY 24-HOUR EXTENSION**

            ModifiedAt = GETUTCDATE(),        TRUNCATE TABLE [canvas].[Participants];� � � � -- Truncate Participants

            Status='Created' -- Added Status update as requested

        WHERE SessionId=212;        PRINT 'Truncated canvas.Participants table';� � � � TRUNCATE TABLE [canvas].[Participants];

            

        IF @@ROWCOUNT > 0        � � � � PRINT 'Truncated canvas.Participants table';

        BEGIN

            PRINT 'Updated special SessionId 212 with fresh tokens and 24-hour expiration.';        -- Update all active sessions to extend expiration by 24 hours, excluding SessionId 212� � � � � ��

        END

        UPDATE [canvas].[Sessions]� � � � -- Update all active sessions to extend expiration by 24 hours, excluding SessionId 212

        

        -- Always run selects (active/unexpired records)        SET ExpiresAt = DATEADD(HOUR, 24, GETUTCDATE()),� � � � UPDATE [canvas].[Sessions]

        SELECT

            SessionId,            ModifiedAt = GETUTCDATE(),� � � � SET ExpiresAt = DATEADD(HOUR, 24, GETUTCDATE()),

            HostToken,

            UserToken,            Status='Created'� � � � � � ModifiedAt = GETUTCDATE(),

            Status,

            [ScheduledDate], [ScheduledDuration],        WHERE (ExpiresAt IS NULL OR ExpiresAt > GETUTCDATE())� � � � � � Status='Created'

            CreatedAt,

            ExpiresAt,            AND SessionId <> 212; -- Exclude SessionId 212 to prevent redundant update� � � � WHERE (ExpiresAt IS NULL OR ExpiresAt > GETUTCDATE())

            DATEDIFF(HOUR, GETUTCDATE(), ExpiresAt) AS HoursUntilExpiry

        FROM [canvas].[Sessions]                    AND SessionId <> 212; -- Exclude SessionId 212 to prevent redundant update

        WHERE ExpiresAt IS NULL OR ExpiresAt > GETUTCDATE()

        ORDER BY SessionId;        -- Capture and print the count for the general update� � � � � ��



        SELECT * FROM canvas.SessionData;        DECLARE @UpdatedSessions INT = @@ROWCOUNT;� � � � -- Capture and print the count for the general update

        SELECT * FROM canvas.Participants;

                PRINT CONCAT('Extended expiration for ', @UpdatedSessions, ' other active sessions by 24 hours');� � � � DECLARE @UpdatedSessions INT = @@ROWCOUNT;

        COMMIT TRANSACTION;

        PRINT 'Canvas schema cleaned successfully!';        � � � � PRINT CONCAT('Extended expiration for ', @UpdatedSessions, ' other active sessions by 24 hours');

        

    END TRY        -- Dedicated UPDATE for SessionId=212 to reset tokens and ensure 24-hour expiration� � � � � � 

    BEGIN CATCH

        IF @@TRANCOUNT > 0        UPDATE canvas.Sessions� � � � -- Dedicated UPDATE for SessionId=212 to reset tokens and ensure 24-hour expiration

            ROLLBACK TRANSACTION;

                SET HostToken='PQ9N5YWW',� � � � UPDATE canvas.Sessions�

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();

        DECLARE @ErrorNumber INT = ERROR_NUMBER();            UserToken='KJAHA99L',� � � � SET HostToken='PQ9N5YWW',�

        DECLARE @ErrorLine INT = ERROR_LINE();

                    [ScheduledDate]=NULL,� � � � � � UserToken='KJAHA99L',�

        RAISERROR('Error in CleanCanvas procedure: %s (Error %d at line %d)',

                  16, 1, @ErrorMessage, @ErrorNumber, @ErrorLine);            [ScheduledDuration]=NULL,� � � � � � [ScheduledDate]=NULL,�

    END CATCH

END;            ExpiresAt = DATEADD(HOUR, 24, GETUTCDATE()), -- **MANDATORY 24-HOUR EXTENSION**� � � � � � [ScheduledDuration]=NULL,


            ModifiedAt = GETUTCDATE(),� � � � � � ExpiresAt = DATEADD(HOUR, 24, GETUTCDATE()), -- **MANDATORY 24-HOUR EXTENSION**

            Status='Created' -- Added Status update as requested� � � � � � ModifiedAt = GETUTCDATE(),

        WHERE SessionId=212;            Status='Created' -- Added Status update as requested

            � � � � WHERE SessionId=212;

        IF @@ROWCOUNT > 0            

        BEGIN        IF @@ROWCOUNT > 0

            PRINT 'Updated special SessionId 212 with fresh tokens and 24-hour expiration.';        BEGIN

        END            PRINT 'Updated special SessionId 212 with fresh tokens and 24-hour expiration.';

        END

        

        -- Always run selects (active/unexpired records)� � � ��

        SELECT� � � � -- Always run selects (active/unexpired records)

            SessionId,� � � � SELECT�

            HostToken,� � � � � � SessionId,

            UserToken,� � � � � � HostToken,

            Status,� � � � � � UserToken,

            [ScheduledDate], [ScheduledDuration],� � � � � � Status,

            CreatedAt,� � � � � � [ScheduledDate], [ScheduledDuration],

            ExpiresAt,� � � � � � CreatedAt,

            DATEDIFF(HOUR, GETUTCDATE(), ExpiresAt) AS HoursUntilExpiry� � � � � � ExpiresAt,

        FROM [canvas].[Sessions]� � � � � � DATEDIFF(HOUR, GETUTCDATE(), ExpiresAt) AS HoursUntilExpiry

        WHERE ExpiresAt IS NULL OR ExpiresAt > GETUTCDATE()� � � � FROM [canvas].[Sessions]

        ORDER BY SessionId;� � � � WHERE ExpiresAt IS NULL OR ExpiresAt > GETUTCDATE()

� � � � ORDER BY SessionId;

        SELECT * FROM canvas.SessionData;

        SELECT * FROM canvas.Participants;� � � � SELECT * FROM canvas.SessionData;

        � � � � SELECT * FROM canvas.Participants;

        COMMIT TRANSACTION;� � � ��

        PRINT 'Canvas schema cleaned successfully!';� � � � COMMIT TRANSACTION;

        � � � � PRINT 'Canvas schema cleaned successfully!';

    END TRY� � � ��

    BEGIN CATCH� � END TRY

        IF @@TRANCOUNT > 0� � BEGIN CATCH

            ROLLBACK TRANSACTION;� � � � IF @@TRANCOUNT > 0

        � � � � � � ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();� � � � � ��

        DECLARE @ErrorNumber INT = ERROR_NUMBER();� � � � DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();

        DECLARE @ErrorLine INT = ERROR_LINE();� � � � DECLARE @ErrorNumber INT = ERROR_NUMBER();

        � � � � DECLARE @ErrorLine INT = ERROR_LINE();

        RAISERROR('Error in CleanCanvas procedure: %s (Error %d at line %d)',� � � ��

                  16, 1, @ErrorMessage, @ErrorNumber, @ErrorLine);� � � � RAISERROR('Error in CleanCanvas procedure: %s (Error %d at line %d)',�

    END CATCH� � � � � � � � � 16, 1, @ErrorMessage, @ErrorNumber, @ErrorLine);

END;� � END CATCH

END;


(1 rows affected)
