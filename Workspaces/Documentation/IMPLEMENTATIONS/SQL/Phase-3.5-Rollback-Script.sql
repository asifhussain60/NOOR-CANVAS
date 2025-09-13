-- =============================================
-- NOOR Canvas Phase 3.5 - Rollback Script
-- Target: AHHOME SQL Server - KSESSIONS Database
-- Purpose: Complete rollback of canvas schema and security
-- Generated: September 12, 2025
-- =============================================

-- WARNING: This script will completely remove the NOOR Canvas implementation
-- Only run this script if you need to completely uninstall NOOR Canvas

USE [KSESSIONS]
GO

PRINT '🚨 NOOR CANVAS ROLLBACK SCRIPT'
PRINT '🚨 This will PERMANENTLY DELETE all NOOR Canvas data and schema'
PRINT ''

-- =============================================
-- 1. Drop Foreign Key Constraints First
-- =============================================

PRINT '🔗 Dropping foreign key constraints...'

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Annotations_Sessions_SessionId')
    ALTER TABLE [canvas].[Annotations] DROP CONSTRAINT [FK_Annotations_Sessions_SessionId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HostSessions_Sessions_SessionId')
    ALTER TABLE [canvas].[HostSessions] DROP CONSTRAINT [FK_HostSessions_Sessions_SessionId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SessionLinks_Sessions_SessionId')
    ALTER TABLE [canvas].[SessionLinks] DROP CONSTRAINT [FK_SessionLinks_Sessions_SessionId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SharedAssets_Sessions_SessionId')
    ALTER TABLE [canvas].[SharedAssets] DROP CONSTRAINT [FK_SharedAssets_Sessions_SessionId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_AuditLog_Sessions_SessionId')
    ALTER TABLE [canvas].[AuditLog] DROP CONSTRAINT [FK_AuditLog_Sessions_SessionId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_AuditLog_Users_UserId')
    ALTER TABLE [canvas].[AuditLog] DROP CONSTRAINT [FK_AuditLog_Users_UserId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Issues_Sessions_SessionId')
    ALTER TABLE [canvas].[Issues] DROP CONSTRAINT [FK_Issues_Sessions_SessionId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Issues_Users_UserId')
    ALTER TABLE [canvas].[Issues] DROP CONSTRAINT [FK_Issues_Users_UserId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Questions_Sessions_SessionId')
    ALTER TABLE [canvas].[Questions] DROP CONSTRAINT [FK_Questions_Sessions_SessionId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Questions_Users_UserId')
    ALTER TABLE [canvas].[Questions] DROP CONSTRAINT [FK_Questions_Users_UserId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Registrations_Sessions_SessionId')
    ALTER TABLE [canvas].[Registrations] DROP CONSTRAINT [FK_Registrations_Sessions_SessionId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Registrations_Users_UserId')
    ALTER TABLE [canvas].[Registrations] DROP CONSTRAINT [FK_Registrations_Users_UserId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_QuestionAnswers_Questions_QuestionId')
    ALTER TABLE [canvas].[QuestionAnswers] DROP CONSTRAINT [FK_QuestionAnswers_Questions_QuestionId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_QuestionVotes_Questions_QuestionId')
    ALTER TABLE [canvas].[QuestionVotes] DROP CONSTRAINT [FK_QuestionVotes_Questions_QuestionId]

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_QuestionVotes_Users_UserId')
    ALTER TABLE [canvas].[QuestionVotes] DROP CONSTRAINT [FK_QuestionVotes_Users_UserId]

PRINT '✅ Foreign key constraints dropped'

-- =============================================
-- 2. Drop Tables in Dependency Order
-- =============================================

PRINT '🗑️ Dropping canvas tables...'

-- Drop dependent tables first
IF OBJECT_ID('[canvas].[QuestionVotes]', 'U') IS NOT NULL
    DROP TABLE [canvas].[QuestionVotes]

IF OBJECT_ID('[canvas].[QuestionAnswers]', 'U') IS NOT NULL
    DROP TABLE [canvas].[QuestionAnswers]

IF OBJECT_ID('[canvas].[Questions]', 'U') IS NOT NULL
    DROP TABLE [canvas].[Questions]

IF OBJECT_ID('[canvas].[Registrations]', 'U') IS NOT NULL
    DROP TABLE [canvas].[Registrations]

IF OBJECT_ID('[canvas].[Issues]', 'U') IS NOT NULL
    DROP TABLE [canvas].[Issues]

IF OBJECT_ID('[canvas].[AuditLog]', 'U') IS NOT NULL
    DROP TABLE [canvas].[AuditLog]

IF OBJECT_ID('[canvas].[SharedAssets]', 'U') IS NOT NULL
    DROP TABLE [canvas].[SharedAssets]

IF OBJECT_ID('[canvas].[SessionLinks]', 'U') IS NOT NULL
    DROP TABLE [canvas].[SessionLinks]

IF OBJECT_ID('[canvas].[HostSessions]', 'U') IS NOT NULL
    DROP TABLE [canvas].[HostSessions]

IF OBJECT_ID('[canvas].[Annotations]', 'U') IS NOT NULL
    DROP TABLE [canvas].[Annotations]

IF OBJECT_ID('[canvas].[AdminSessions]', 'U') IS NOT NULL
    DROP TABLE [canvas].[AdminSessions]

-- Drop main tables
IF OBJECT_ID('[canvas].[Users]', 'U') IS NOT NULL
    DROP TABLE [canvas].[Users]

IF OBJECT_ID('[canvas].[Sessions]', 'U') IS NOT NULL
    DROP TABLE [canvas].[Sessions]

PRINT '✅ Canvas tables dropped'

-- =============================================
-- 3. Drop Canvas Schema
-- =============================================

IF SCHEMA_ID('canvas') IS NOT NULL
BEGIN
    DROP SCHEMA [canvas]
    PRINT '✅ Canvas schema dropped'
END

-- =============================================
-- 4. Clean Migration History
-- =============================================

IF OBJECT_ID('[__EFMigrationsHistory]', 'U') IS NOT NULL
BEGIN
    DELETE FROM [__EFMigrationsHistory] 
    WHERE [MigrationId] IN (
        '20250911091420_InitialCreate',
        '20250912174615_AddAdminSessions'
    )
    PRINT '✅ Migration history cleaned'
END

-- =============================================
-- 5. Remove Security Principals
-- =============================================

PRINT '🔐 Removing security principals...'

-- Remove database user from KSESSIONS
IF EXISTS (SELECT name FROM sys.database_principals WHERE name = 'noor_canvas_app')
BEGIN
    DROP USER [noor_canvas_app]
    PRINT '✅ Removed noor_canvas_app user from KSESSIONS'
END

-- Remove from KQUR database
USE [KQUR]
GO

IF EXISTS (SELECT name FROM sys.database_principals WHERE name = 'noor_canvas_app')
BEGIN
    DROP USER [noor_canvas_app]
    PRINT '✅ Removed noor_canvas_app user from KQUR'
END

-- Remove from development databases if they exist
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'KSESSIONS_DEV')
BEGIN
    USE [KSESSIONS_DEV]
    
    IF EXISTS (SELECT name FROM sys.database_principals WHERE name = 'noor_canvas_app')
    BEGIN
        DROP USER [noor_canvas_app]
        PRINT '✅ Removed noor_canvas_app user from KSESSIONS_DEV'
    END
END

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'KQUR_DEV')
BEGIN
    USE [KQUR_DEV]
    
    IF EXISTS (SELECT name FROM sys.database_principals WHERE name = 'noor_canvas_app')
    BEGIN
        DROP USER [noor_canvas_app]
        PRINT '✅ Removed noor_canvas_app user from KQUR_DEV'
    END
END

-- Remove server login (use master database)
USE [master]
GO

IF EXISTS (SELECT name FROM sys.server_principals WHERE name = 'noor_canvas_app')
BEGIN
    DROP LOGIN [noor_canvas_app]
    PRINT '✅ Removed noor_canvas_app server login'
END

-- =============================================
-- 6. Validation
-- =============================================

USE [KSESSIONS]
GO

PRINT ''
PRINT '🔍 ROLLBACK VALIDATION:'

-- Check if canvas schema still exists
IF SCHEMA_ID('canvas') IS NULL
    PRINT '✅ Canvas schema successfully removed'
ELSE
    PRINT '❌ Canvas schema still exists'

-- Check if any canvas tables remain
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'canvas')
    PRINT '✅ All canvas tables successfully removed'
ELSE
    PRINT '❌ Some canvas tables still exist'

-- Check if user still exists
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'noor_canvas_app')
    PRINT '✅ Application user successfully removed'
ELSE
    PRINT '❌ Application user still exists'

PRINT ''
PRINT '🚨 ROLLBACK COMPLETED'
PRINT '🚨 All NOOR Canvas data and schema have been permanently removed'
PRINT '🚨 This action cannot be undone without restoring from backup'
PRINT ''
