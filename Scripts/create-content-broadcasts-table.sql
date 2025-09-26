-- [DEBUG-WORKITEM:signalcomm:impl] Content Broadcasts Table for Database-Driven HTML Broadcasting ;CLEANUP_OK
-- This replaces the problematic real-time SignalR DOM manipulation with reliable database storage

-- Create the ContentBroadcasts table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ContentBroadcasts' AND schema_id = SCHEMA_ID('canvas'))
BEGIN
    CREATE TABLE [canvas].[ContentBroadcasts] (
        [BroadcastId] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [SessionId] BIGINT NOT NULL,
        [ContentType] NVARCHAR(50) NOT NULL, -- 'HTML', 'Text', 'Image', 'Announcement'
        [Title] NVARCHAR(200) NULL,
        [Content] NVARCHAR(MAX) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [CreatedBy] NVARCHAR(100) NOT NULL DEFAULT 'Host',
        [IsActive] BIT NOT NULL DEFAULT 1,
        [ExpiresAt] DATETIME2 NULL,
        [ViewCount] INT NOT NULL DEFAULT 0,
        [LastViewedAt] DATETIME2 NULL,
        
        -- Foreign key constraint
        CONSTRAINT [FK_ContentBroadcasts_Sessions] 
            FOREIGN KEY ([SessionId]) REFERENCES [canvas].[Sessions]([SessionId])
    );

    -- Create indexes for performance
    CREATE NONCLUSTERED INDEX [IX_ContentBroadcasts_SessionId_Active] 
        ON [canvas].[ContentBroadcasts] ([SessionId], [IsActive]) 
        INCLUDE ([CreatedAt], [ContentType]);

    CREATE NONCLUSTERED INDEX [IX_ContentBroadcasts_CreatedAt] 
        ON [canvas].[ContentBroadcasts] ([CreatedAt] DESC);

    PRINT '[DEBUG-WORKITEM:signalcomm:impl] ContentBroadcasts table created successfully ;CLEANUP_OK';
END
ELSE
BEGIN
    PRINT '[DEBUG-WORKITEM:signalcomm:impl] ContentBroadcasts table already exists ;CLEANUP_OK';
END

-- Insert sample data for testing
INSERT INTO [canvas].[ContentBroadcasts] ([SessionId], [ContentType], [Title], [Content], [CreatedBy])
VALUES 
    (212, 'HTML', 'Welcome Message', '<div style="padding:20px;background:#f0f9ff;border:1px solid #0ea5e9;border-radius:8px;"><h3>Welcome to the Session</h3><p>This is a sample HTML broadcast using the new database-driven approach.</p></div>', 'System'),
    (212, 'Text', 'Simple Announcement', 'This is a simple text announcement that will display safely without any DOM parsing issues.', 'Host'),
    (212, 'HTML', 'Complex Styling Test', '<div style="background:linear-gradient(45deg,#ff6b6b,#4ecdc4);color:white;padding:25px;border-radius:12px;font-family:Arial,sans-serif;"><h2>Enhanced Content</h2><p style="opacity:0.9;">This content uses complex CSS that would previously cause appendChild errors in Blazor.</p></div>', 'System');

PRINT '[DEBUG-WORKITEM:signalcomm:impl] Sample content broadcasts inserted ;CLEANUP_OK';