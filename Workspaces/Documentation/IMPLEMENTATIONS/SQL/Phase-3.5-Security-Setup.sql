-- =============================================
-- NOOR Canvas Phase 3.5 - Security Setup Script
-- Target: AHHOME SQL Server
-- Purpose: Create application login and permissions
-- Generated: September 12, 2025
-- =============================================

USE [master]
GO

-- =============================================
-- 1. Create Application Login (Production)
-- =============================================

-- Check if login exists, create if not
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'noor_canvas_app')
BEGIN
    CREATE LOGIN [noor_canvas_app] WITH PASSWORD = 'NoorCanvas2025!SecurePassword'
    PRINT '✅ Created login: noor_canvas_app'
END
ELSE
BEGIN
    PRINT '⚠️ Login noor_canvas_app already exists'
END
GO

-- =============================================
-- 2. KSESSIONS Database Permissions
-- =============================================

USE [KSESSIONS]
GO

-- Create database user for the login
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'noor_canvas_app')
BEGIN
    CREATE USER [noor_canvas_app] FOR LOGIN [noor_canvas_app]
    PRINT '✅ Created user noor_canvas_app in KSESSIONS database'
END
ELSE
BEGIN
    PRINT '⚠️ User noor_canvas_app already exists in KSESSIONS database'
END
GO

-- Grant permissions on canvas schema
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::canvas TO [noor_canvas_app]
PRINT '✅ Granted full CRUD permissions on canvas schema'

-- Grant read permissions on dbo schema (for Groups, Categories integration)
GRANT SELECT ON SCHEMA::dbo TO [noor_canvas_app]
PRINT '✅ Granted SELECT permissions on dbo schema'

-- Grant specific permissions for cross-schema operations
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Groups')
BEGIN
    GRANT SELECT ON [dbo].[Groups] TO [noor_canvas_app]
    PRINT '✅ Granted SELECT on dbo.Groups'
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Categories')
BEGIN
    GRANT SELECT ON [dbo].[Categories] TO [noor_canvas_app]
    PRINT '✅ Granted SELECT on dbo.Categories'
END

-- =============================================
-- 3. KQUR Database Permissions (Cross-Database)
-- =============================================

USE [KQUR]
GO

-- Create database user for Islamic content access
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'noor_canvas_app')
BEGIN
    CREATE USER [noor_canvas_app] FOR LOGIN [noor_canvas_app]
    PRINT '✅ Created user noor_canvas_app in KQUR database'
END
ELSE
BEGIN
    PRINT '⚠️ User noor_canvas_app already exists in KQUR database'
END
GO

-- Grant read-only permissions on KQUR content
GRANT SELECT ON SCHEMA::dbo TO [noor_canvas_app]
PRINT '✅ Granted SELECT permissions on KQUR.dbo schema'

-- =============================================
-- 4. Development Database Permissions (if needed)
-- =============================================

-- KSESSIONS_DEV permissions
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'KSESSIONS_DEV')
BEGIN
    USE [KSESSIONS_DEV]
    
    IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'noor_canvas_app')
    BEGIN
        CREATE USER [noor_canvas_app] FOR LOGIN [noor_canvas_app]
        PRINT '✅ Created user noor_canvas_app in KSESSIONS_DEV database'
    END
    
    GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::canvas TO [noor_canvas_app]
    GRANT SELECT ON SCHEMA::dbo TO [noor_canvas_app]
    PRINT '✅ Granted permissions on KSESSIONS_DEV'
END

-- KQUR_DEV permissions  
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'KQUR_DEV')
BEGIN
    USE [KQUR_DEV]
    
    IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'noor_canvas_app')
    BEGIN
        CREATE USER [noor_canvas_app] FOR LOGIN [noor_canvas_app]
        PRINT '✅ Created user noor_canvas_app in KQUR_DEV database'
    END
    
    GRANT SELECT ON SCHEMA::dbo TO [noor_canvas_app]
    PRINT '✅ Granted SELECT permissions on KQUR_DEV'
END

-- =============================================
-- 5. Connection String Template
-- =============================================

PRINT ''
PRINT '📋 CONNECTION STRING TEMPLATES:'
PRINT ''
PRINT 'Production:'
PRINT 'Server=AHHOME;Database=KSESSIONS;User Id=noor_canvas_app;Password=NoorCanvas2025!SecurePassword;TrustServerCertificate=true;MultipleActiveResultSets=true;'
PRINT ''
PRINT 'Development:'  
PRINT 'Server=AHHOME;Database=KSESSIONS_DEV;User Id=noor_canvas_app;Password=NoorCanvas2025!SecurePassword;TrustServerCertificate=true;MultipleActiveResultSets=true;'
PRINT ''
PRINT '⚠️ IMPORTANT: Change default password before production deployment!'
PRINT ''

-- =============================================
-- 6. Validation Queries
-- =============================================

USE [KSESSIONS]
GO

PRINT '🔍 VALIDATION CHECKS:'
PRINT ''

-- Check canvas schema tables
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'Sessions')
    PRINT '✅ canvas.Sessions table exists'
ELSE
    PRINT '❌ canvas.Sessions table missing'

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'AdminSessions')
    PRINT '✅ canvas.AdminSessions table exists'
ELSE
    PRINT '❌ canvas.AdminSessions table missing'

-- Check user permissions
SELECT 
    dp.class_desc,
    dp.permission_name,
    dp.state_desc,
    p.name AS principal_name
FROM sys.database_permissions dp
JOIN sys.objects o ON dp.major_id = o.object_id
JOIN sys.database_principals p ON dp.grantee_principal_id = p.principal_id
WHERE p.name = 'noor_canvas_app'

PRINT ''
PRINT '✅ Security setup completed successfully!'
PRINT '✅ Application login ready for Phase 3.5 deployment'
