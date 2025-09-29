-- [DEBUG-WORKITEM:assetshare:continue] SQL script to fix session 212 database setup
-- This ensures HOST212A token exists and session is properly configured

PRINT '[DEBUG-WORKITEM:assetshare:continue] Checking session 212 setup...'

-- Check if session 212 exists in canvas.Sessions
IF EXISTS (SELECT 1 FROM canvas.Sessions WHERE SessionId = 212)
BEGIN
    PRINT '[DEBUG-WORKITEM:assetshare:continue] ✅ Canvas session 212 already exists'
    SELECT 
        SessionId, HostToken, UserToken, Status, CreatedAt, ExpiresAt
    FROM canvas.Sessions 
    WHERE SessionId = 212
END
ELSE
BEGIN
    PRINT '[DEBUG-WORKITEM:assetshare:continue] ❌ Canvas session 212 NOT found - creating it'
    
    -- Insert canvas session record with HOST212A token
    INSERT INTO canvas.Sessions (
        SessionId, HostToken, UserToken, Status, ParticipantCount, MaxParticipants,
        CreatedAt, ModifiedAt, ExpiresAt, AlbumId, ScheduledDate, ScheduledTime, ScheduledDuration
    )
    VALUES (
        212, 'HOST212A', 'USER212A', 'Waiting', 0, 50,
        GETUTCDATE(), GETUTCDATE(), DATEADD(day, 30, GETUTCDATE()),
        NEWID(), '09/29/2025', '6:00 PM', '60'
    )
    
    PRINT '[DEBUG-WORKITEM:assetshare:continue] ✅ Created canvas session 212 with HOST212A token'
END

-- Check KSessions data
IF EXISTS (SELECT 1 FROM dbo.Sessions WHERE SessionId = 212)
BEGIN
    PRINT '[DEBUG-WORKITEM:assetshare:continue] ✅ KSessions session 212 exists'
    SELECT 
        SessionId, SessionName, Description
    FROM dbo.Sessions 
    WHERE SessionId = 212
END
ELSE
BEGIN
    PRINT '[DEBUG-WORKITEM:assetshare:continue] ❌ KSessions session 212 NOT found'
END

-- Check transcript
IF EXISTS (SELECT 1 FROM dbo.SessionTranscripts WHERE SessionId = 212)
BEGIN
    PRINT '[DEBUG-WORKITEM:assetshare:continue] ✅ Session 212 transcript exists'
    SELECT 
        SessionId, LEN(Transcript) as TranscriptLength,
        (SELECT COUNT(*) FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn FROM STRING_SPLIT(Transcript, 'ayah-card') WHERE value <> '') x WHERE x.rn > 1) as AyahCardCount
    FROM dbo.SessionTranscripts 
    WHERE SessionId = 212
END
ELSE
BEGIN
    PRINT '[DEBUG-WORKITEM:assetshare:continue] ❌ Session 212 transcript NOT found'
END

-- Check AssetLookup table
PRINT '[DEBUG-WORKITEM:assetshare:continue] Checking AssetLookup table...'
SELECT 
    AssetIdentifier, CssSelector, DisplayName, IsActive
FROM canvas.AssetLookup 
WHERE IsActive = 1
ORDER BY AssetIdentifier

PRINT '[DEBUG-WORKITEM:assetshare:continue] Database check completed'
PRINT '[DEBUG-WORKITEM:assetshare:continue] Next: Test HOST212A at https://localhost:9091/host/HOST212A'