using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoorCanvas.Data.Migrations
{
    /// <inheritdoc />
    public partial class MigrateDataToSimplifiedSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Migrate Sessions data with embedded tokens
            migrationBuilder.Sql(@"
                INSERT INTO [canvas].[Sessions_New] (
                    HostToken, UserToken, Title, Description, Status, 
                    CreatedAt, ExpiresAt, CreatedBy
                )
                SELECT 
                    COALESCE(st.HostToken, UPPER(SUBSTRING(CONVERT(VARCHAR(36), NEWID()), 1, 8))) AS HostToken,
                    COALESCE(st.UserToken, UPPER(SUBSTRING(CONVERT(VARCHAR(36), NEWID()), 10, 8))) AS UserToken,
                    s.Title,
                    s.Description,
                    CASE 
                        WHEN s.Status IS NULL OR s.Status = '' THEN 'Active'
                        ELSE s.Status 
                    END AS Status,
                    s.CreatedAt,
                    COALESCE(s.ExpiresAt, DATEADD(HOUR, 3, s.CreatedAt)) AS ExpiresAt,
                    COALESCE(hs.CreatedBy, 'System') AS CreatedBy
                FROM [canvas].[Sessions] s
                LEFT JOIN [canvas].[SecureTokens] st ON st.SessionId = s.SessionId
                LEFT JOIN [canvas].[HostSessions] hs ON hs.SessionId = s.SessionId;
            ");

            // Step 2: Create session mapping temp table for reference
            migrationBuilder.Sql(@"
                CREATE TABLE #SessionMapping (
                    OldSessionId BIGINT,
                    NewSessionId INT,
                    HostToken VARCHAR(8)
                );

                INSERT INTO #SessionMapping (OldSessionId, NewSessionId, HostToken)
                SELECT 
                    s.SessionId AS OldSessionId,
                    sn.SessionId AS NewSessionId,
                    sn.HostToken
                FROM [canvas].[Sessions] s
                INNER JOIN [canvas].[Sessions_New] sn ON (
                    sn.Title = s.Title AND 
                    sn.CreatedAt = s.CreatedAt
                ) OR (
                    sn.HostToken IN (
                        SELECT st.HostToken 
                        FROM [canvas].[SecureTokens] st 
                        WHERE st.SessionId = s.SessionId
                    )
                );
            ");

            // Step 3: Migrate Users + Registrations → Participants
            migrationBuilder.Sql(@"
                INSERT INTO [canvas].[Participants_New] (
                    SessionId, UserGuid, Name, Country, City, 
                    JoinedAt, LastSeenAt
                )
                SELECT 
                    sm.NewSessionId,
                    u.UserGuid,
                    u.Name,
                    COALESCE(r.Country, u.Country) AS Country,
                    u.City,
                    r.CreatedAt AS JoinedAt,
                    u.LastSeenAt
                FROM [canvas].[Users] u
                INNER JOIN [canvas].[Registrations] r ON r.UserId = u.UserId
                INNER JOIN #SessionMapping sm ON sm.OldSessionId = r.SessionId;
            ");

            // Step 4: Migrate SharedAssets
            migrationBuilder.Sql(@"
                INSERT INTO [canvas].[SessionData_New] (SessionId, DataType, Content, CreatedBy, CreatedAt)
                SELECT 
                    sm.NewSessionId,
                    'SharedAsset' AS DataType,
                    JSON_OBJECT(
                        'SharedAssetId', sa.SharedAssetId,
                        'AssetSelector', sa.AssetSelector,
                        'AssetPosition', sa.AssetPosition,
                        'AssetMetadata', sa.AssetMetadata,
                        'ShareCount', sa.ShareCount,
                        'AssetType', 'SharedAsset'
                    ) AS Content,
                    sa.SharedBy AS CreatedBy,
                    sa.SharedAt AS CreatedAt
                FROM [canvas].[SharedAssets] sa
                INNER JOIN #SessionMapping sm ON sm.OldSessionId = sa.SessionId;
            ");

            // Step 5: Migrate Annotations
            migrationBuilder.Sql(@"
                INSERT INTO [canvas].[SessionData_New] (SessionId, DataType, Content, CreatedBy, CreatedAt, IsDeleted)
                SELECT 
                    sm.NewSessionId,
                    'Annotation' AS DataType,
                    CASE 
                        WHEN ISJSON(a.AnnotationData) = 1 THEN a.AnnotationData
                        ELSE JSON_OBJECT('data', a.AnnotationData, 'legacy', 1)
                    END AS Content,
                    a.CreatedBy,
                    a.CreatedAt,
                    a.IsDeleted
                FROM [canvas].[Annotations] a
                INNER JOIN #SessionMapping sm ON sm.OldSessionId = a.SessionId;
            ");

            // Step 6: Migrate Questions
            migrationBuilder.Sql(@"
                INSERT INTO [canvas].[SessionData_New] (SessionId, DataType, Content, CreatedBy, CreatedAt)
                SELECT 
                    sm.NewSessionId,
                    'Question' AS DataType,
                    JSON_OBJECT(
                        'QuestionId', q.QuestionId,
                        'QuestionText', q.QuestionText,
                        'VoteCount', COALESCE(q.VoteCount, 0),
                        'Status', COALESCE(q.Status, 'Queued'),
                        'QueuedAt', q.QueuedAt,
                        'UserId', q.UserId,
                        'AssetReference', q.AssetReference,
                        'IsAnonymous', q.IsAnonymous
                    ) AS Content,
                    COALESCE(p.Name, 'Anonymous') AS CreatedBy,
                    q.QueuedAt AS CreatedAt
                FROM [canvas].[Questions] q
                INNER JOIN #SessionMapping sm ON sm.OldSessionId = q.SessionId
                LEFT JOIN [canvas].[Users] u ON u.UserId = q.UserId
                LEFT JOIN [canvas].[Participants_New] p ON p.UserGuid = u.UserGuid AND p.SessionId = sm.NewSessionId;
            ");

            // Step 7: Migrate QuestionAnswers (if any exist)
            migrationBuilder.Sql(@"
                INSERT INTO [canvas].[SessionData_New] (SessionId, DataType, Content, CreatedBy, CreatedAt)
                SELECT 
                    sm.NewSessionId,
                    'QuestionAnswer' AS DataType,
                    JSON_OBJECT(
                        'QuestionAnswerId', qa.QuestionAnswerId,
                        'QuestionId', qa.QuestionId,
                        'AnswerText', qa.AnswerText,
                        'AnsweredAt', qa.AnsweredAt,
                        'IsApproved', qa.IsApproved
                    ) AS Content,
                    qa.AnsweredBy AS CreatedBy,
                    qa.AnsweredAt AS CreatedAt
                FROM [canvas].[QuestionAnswers] qa
                INNER JOIN [canvas].[Questions] q ON q.QuestionId = qa.QuestionId
                INNER JOIN #SessionMapping sm ON sm.OldSessionId = q.SessionId;
            ");

            // Step 8: Clean up temp table
            migrationBuilder.Sql("DROP TABLE #SessionMapping;");

            // Step 9: Add validation comments
            migrationBuilder.Sql(@"
                -- Validation queries (run these after migration to verify data integrity)
                /*
                SELECT 'Original Sessions' as Source, COUNT(*) as Count FROM [canvas].[Sessions]
                UNION ALL
                SELECT 'Migrated Sessions' as Source, COUNT(*) as Count FROM [canvas].[Sessions_New]

                UNION ALL
                SELECT 'Original Users+Registrations' as Source, COUNT(*) as Count 
                FROM [canvas].[Users] u INNER JOIN [canvas].[Registrations] r ON u.UserId = r.UserId
                UNION ALL  
                SELECT 'Migrated Participants' as Source, COUNT(*) as Count FROM [canvas].[Participants_New]

                UNION ALL
                SELECT 'Original Content Items' as Source, 
                    (SELECT COUNT(*) FROM [canvas].[SharedAssets]) + 
                    (SELECT COUNT(*) FROM [canvas].[Annotations] WHERE IsDeleted = 0) + 
                    (SELECT COUNT(*) FROM [canvas].[Questions]) as Count
                UNION ALL
                SELECT 'Migrated Content Items' as Source, COUNT(*) as Count FROM [canvas].[SessionData_New];
                */
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Clear migrated data (keep tables for potential re-migration)
            migrationBuilder.Sql("DELETE FROM [canvas].[SessionData_New];");
            migrationBuilder.Sql("DELETE FROM [canvas].[Participants_New];");
            migrationBuilder.Sql("DELETE FROM [canvas].[Sessions_New];");
        }
    }
}