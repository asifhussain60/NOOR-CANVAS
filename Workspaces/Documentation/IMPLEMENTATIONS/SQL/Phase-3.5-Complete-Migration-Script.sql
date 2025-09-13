-- =============================================
-- NOOR Canvas Phase 3.5 - Complete Database Migration Script
-- Target: AHHOME SQL Server - KSESSIONS Database
-- Schema: canvas (NOOR Canvas application tables)
-- Generated: September 12, 2025
-- EF Core Version: 8.0.0
-- =============================================

-- This script is idempotent and can be run multiple times safely
-- It creates the complete canvas schema with all tables, indexes, and relationships

IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    IF SCHEMA_ID(N'canvas') IS NULL EXEC(N'CREATE SCHEMA [canvas];');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE TABLE [canvas].[Sessions] (
        [SessionId] bigint NOT NULL IDENTITY,
        [GroupId] uniqueidentifier NOT NULL,
        [StartedAt] datetime2 NULL,
        [EndedAt] datetime2 NULL,
        [ExpiresAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Sessions] PRIMARY KEY ([SessionId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE TABLE [canvas].[Users] (
        [UserId] uniqueidentifier NOT NULL,
        [Name] nvarchar(256) NULL,
        [City] nvarchar(128) NULL,
        [Country] nvarchar(128) NULL,
        [FirstJoinedAt] datetime2 NOT NULL,
        [LastJoinedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([UserId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE TABLE [canvas].[Annotations] (
        [AnnotationId] bigint NOT NULL IDENTITY,
        [SessionId] bigint NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [AnnotationData] nvarchar(max) NULL,
        [CreatedBy] nvarchar(128) NULL,
        CONSTRAINT [PK_Annotations] PRIMARY KEY ([AnnotationId]),
        CONSTRAINT [FK_Annotations_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [canvas].[Sessions] ([SessionId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE TABLE [canvas].[HostSessions] (
        [HostSessionId] bigint NOT NULL IDENTITY,
        [SessionId] bigint NOT NULL,
        [HostGuidHash] nvarchar(128) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ExpiresAt] datetime2 NULL,
        [LastUsedAt] datetime2 NULL,
        [CreatedBy] nvarchar(128) NULL,
        [RevokedAt] datetime2 NULL,
        [RevokedBy] nvarchar(128) NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_HostSessions] PRIMARY KEY ([HostSessionId]),
        CONSTRAINT [FK_HostSessions_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [canvas].[Sessions] ([SessionId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE TABLE [canvas].[SessionLinks] (
        [LinkId] bigint NOT NULL IDENTITY,
        [SessionId] bigint NOT NULL,
        [Guid] uniqueidentifier NOT NULL,
        [State] tinyint NOT NULL,
        [LastUsedAt] datetime2 NULL,
        [UseCount] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_SessionLinks] PRIMARY KEY ([LinkId]),
        CONSTRAINT [FK_SessionLinks_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [canvas].[Sessions] ([SessionId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE TABLE [canvas].[SharedAssets] (
        [AssetId] bigint NOT NULL IDENTITY,
        [SessionId] bigint NOT NULL,
        [SharedAt] datetime2 NOT NULL,
        [AssetType] nvarchar(50) NULL,
        [AssetData] nvarchar(max) NULL,
        CONSTRAINT [PK_SharedAssets] PRIMARY KEY ([AssetId]),
        CONSTRAINT [FK_SharedAssets_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [canvas].[Sessions] ([SessionId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE TABLE [canvas].[AuditLog] (
        [EventId] bigint NOT NULL IDENTITY,
        [At] datetime2 NOT NULL,
        [Actor] nvarchar(64) NULL,
        [SessionId] bigint NULL,
        [UserId] uniqueidentifier NULL,
        [Action] nvarchar(100) NULL,
        [Details] nvarchar(max) NULL,
        CONSTRAINT [PK_AuditLog] PRIMARY KEY ([EventId]),
        CONSTRAINT [FK_AuditLog_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [canvas].[Sessions] ([SessionId]),
        CONSTRAINT [FK_AuditLog_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [canvas].[Users] ([UserId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE TABLE [canvas].[Issues] (
        [IssueId] bigint NOT NULL IDENTITY,
        [Title] nvarchar(200) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Priority] nvarchar(50) NOT NULL,
        [Category] nvarchar(50) NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [ReportedAt] datetime2 NOT NULL,
        [SessionId] bigint NULL,
        [UserId] uniqueidentifier NULL,
        [ReportedBy] nvarchar(128) NULL,
        [Context] nvarchar(max) NULL,
        CONSTRAINT [PK_Issues] PRIMARY KEY ([IssueId]),
        CONSTRAINT [FK_Issues_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [canvas].[Sessions] ([SessionId]),
        CONSTRAINT [FK_Issues_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [canvas].[Users] ([UserId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE TABLE [canvas].[Questions] (
        [QuestionId] bigint NOT NULL IDENTITY,
        [SessionId] bigint NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [QuestionText] nvarchar(280) NOT NULL,
        [QueuedAt] datetime2 NOT NULL,
        [AnsweredAt] datetime2 NULL,
        [VoteCount] int NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        CONSTRAINT [PK_Questions] PRIMARY KEY ([QuestionId]),
        CONSTRAINT [FK_Questions_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [canvas].[Sessions] ([SessionId]) ON DELETE CASCADE,
        CONSTRAINT [FK_Questions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [canvas].[Users] ([UserId]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE TABLE [canvas].[Registrations] (
        [RegistrationId] bigint NOT NULL IDENTITY,
        [SessionId] bigint NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [JoinTime] datetime2 NOT NULL,
        CONSTRAINT [PK_Registrations] PRIMARY KEY ([RegistrationId]),
        CONSTRAINT [FK_Registrations_Sessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [canvas].[Sessions] ([SessionId]) ON DELETE CASCADE,
        CONSTRAINT [FK_Registrations_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [canvas].[Users] ([UserId]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE TABLE [canvas].[QuestionAnswers] (
        [AnswerId] bigint NOT NULL IDENTITY,
        [QuestionId] bigint NOT NULL,
        [PostedBy] nvarchar(64) NOT NULL,
        [PostedAt] datetime2 NOT NULL,
        [AnswerText] nvarchar(max) NULL,
        CONSTRAINT [PK_QuestionAnswers] PRIMARY KEY ([AnswerId]),
        CONSTRAINT [FK_QuestionAnswers_Questions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [canvas].[Questions] ([QuestionId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE TABLE [canvas].[QuestionVotes] (
        [VoteId] bigint NOT NULL IDENTITY,
        [QuestionId] bigint NOT NULL,
        [UserId] uniqueidentifier NULL,
        [VoteValue] tinyint NOT NULL,
        [VotedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_QuestionVotes] PRIMARY KEY ([VoteId]),
        CONSTRAINT [FK_QuestionVotes_Questions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [canvas].[Questions] ([QuestionId]) ON DELETE CASCADE,
        CONSTRAINT [FK_QuestionVotes_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [canvas].[Users] ([UserId]) ON DELETE NO ACTION
    );
END;
GO

-- Performance Indexes
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Annotations_SessionId] ON [canvas].[Annotations] ([SessionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AuditLog_SessionId] ON [canvas].[AuditLog] ([SessionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AuditLog_UserId] ON [canvas].[AuditLog] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_HostSessions_SessionGuidHash] ON [canvas].[HostSessions] ([SessionId], [HostGuidHash]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Issues_SessionId] ON [canvas].[Issues] ([SessionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Issues_UserId] ON [canvas].[Issues] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QuestionAnswers_QuestionId] ON [canvas].[QuestionAnswers] ([QuestionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Questions_SessionStatusVoteQueue] ON [canvas].[Questions] ([SessionId], [Status], [VoteCount], [QueuedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Questions_UserId] ON [canvas].[Questions] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QuestionVotes_UserId] ON [canvas].[QuestionVotes] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UQ_QuestionVotes_QuestionUser] ON [canvas].[QuestionVotes] ([QuestionId], [UserId]) WHERE [UserId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Registrations_SessionId] ON [canvas].[Registrations] ([SessionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [UQ_Registration_UserSession] ON [canvas].[Registrations] ([UserId], [SessionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SessionLinks_SessionId] ON [canvas].[SessionLinks] ([SessionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SessionLinks_StateGuid] ON [canvas].[SessionLinks] ([State], [Guid]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SharedAssets_SessionShared] ON [canvas].[SharedAssets] ([SessionId], [SharedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250911091420_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250911091420_InitialCreate', N'8.0.0');
END;
GO

COMMIT;
GO

-- =============================================
-- Phase 2: AdminSessions and Enhanced Fields
-- =============================================

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    ALTER TABLE [canvas].[Users] ADD [CreatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    ALTER TABLE [canvas].[Users] ADD [IsActive] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    ALTER TABLE [canvas].[Users] ADD [LastSeenAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    ALTER TABLE [canvas].[Users] ADD [ModifiedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    ALTER TABLE [canvas].[Users] ADD [UserGuid] nvarchar(256) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    ALTER TABLE [canvas].[Sessions] ADD [Description] nvarchar(1000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    ALTER TABLE [canvas].[Sessions] ADD [HostGuid] nvarchar(100) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    ALTER TABLE [canvas].[Sessions] ADD [MaxParticipants] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    ALTER TABLE [canvas].[Sessions] ADD [ModifiedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    ALTER TABLE [canvas].[Sessions] ADD [ParticipantCount] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    ALTER TABLE [canvas].[Sessions] ADD [Status] nvarchar(50) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    ALTER TABLE [canvas].[Sessions] ADD [Title] nvarchar(200) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    CREATE TABLE [canvas].[AdminSessions] (
        [AdminSessionId] bigint NOT NULL IDENTITY,
        [AdminGuid] nvarchar(100) NOT NULL,
        [SessionToken] nvarchar(128) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [LastUsedAt] datetime2 NULL,
        [IsActive] bit NOT NULL,
        [UserAgent] nvarchar(255) NULL,
        [IpAddress] nvarchar(45) NULL,
        CONSTRAINT [PK_AdminSessions] PRIMARY KEY ([AdminSessionId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250912174615_AddAdminSessions'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250912174615_AddAdminSessions', N'8.0.0');
