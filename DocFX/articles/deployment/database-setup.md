# Database Setup

## Overview

NOOR Canvas uses a dual-database architecture with dedicated development and production environments. This guide covers complete database setup, schema creation, and cross-database integration configuration.

## Database Architecture

### Development Environment

- **Primary Database**: `KSESSIONS_DEV` (NOOR Canvas data with canvas schema)
- **Integration Database**: `KQUR_DEV` (Quranic content for cross-application features)
- **Server Instance**: Local SQL Server or SQL Server Express
- **Authentication**: SQL Server Authentication with `sa` account
- **Connection Timeout**: 3600 seconds (1 hour) for long operations

### Production Environment

- **Primary Database**: `KSESSIONS` (production NOOR Canvas data)
- **Integration Database**: `KQUR` (production Quranic content)
- **Server Instance**: Production SQL Server cluster
- **Authentication**: Integrated Windows Authentication preferred
- **Connection Timeout**: 3600 seconds (1 hour) for long operations

## Prerequisites

### SQL Server Requirements

- **SQL Server 2019** or later (Express Edition acceptable for development)
- **Mixed Mode Authentication** enabled for development
- **TCP/IP Protocol** enabled
- **Minimum Memory**: 512 MB allocated to SQL Server
- **Collation**: SQL_Latin1_General_CP1_CI_AS (case-insensitive)

### Required Permissions

- **Development**: `sa` account with sysadmin privileges
- **Production**: Dedicated service account with db_owner on both databases

## Database Creation

### Development Database Setup

#### 1. Create Development Databases

```sql
-- Connect as sa user to SQL Server instance
-- Create primary development database
CREATE DATABASE [KSESSIONS_DEV]
ON
( NAME = N'KSESSIONS_DEV',
  FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\DATA\KSESSIONS_DEV.mdf',
  SIZE = 100MB,
  MAXSIZE = 1GB,
  FILEGROWTH = 10MB )
LOG ON
( NAME = N'KSESSIONS_DEV_Log',
  FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\DATA\KSESSIONS_DEV_Log.ldf',
  SIZE = 10MB,
  MAXSIZE = 100MB,
  FILEGROWTH = 5MB );

-- Create integration development database
CREATE DATABASE [KQUR_DEV]
ON
( NAME = N'KQUR_DEV',
  FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\DATA\KQUR_DEV.mdf',
  SIZE = 100MB,
  MAXSIZE = 1GB,
  FILEGROWTH = 10MB )
LOG ON
( NAME = N'KQUR_DEV_Log',
  FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\DATA\KQUR_DEV_Log.ldf',
  SIZE = 10MB,
  MAXSIZE = 100MB,
  FILEGROWTH = 5MB );
```

#### 2. Enable sa Account (Development Only)

```sql
-- Enable sa account for development
USE [master]
ALTER LOGIN [sa] ENABLE;
ALTER LOGIN [sa] WITH PASSWORD = 'adf4961glo';
GO
```

### Production Database Setup

#### 1. Create Production Databases

```sql
-- Production database creation (execute on production server)
CREATE DATABASE [KSESSIONS]
ON
( NAME = N'KSESSIONS',
  FILENAME = N'E:\Data\KSESSIONS.mdf',
  SIZE = 500MB,
  MAXSIZE = 10GB,
  FILEGROWTH = 50MB )
LOG ON
( NAME = N'KSESSIONS_Log',
  FILENAME = N'F:\Logs\KSESSIONS_Log.ldf',
  SIZE = 50MB,
  MAXSIZE = 1GB,
  FILEGROWTH = 10MB );

CREATE DATABASE [KQUR]
ON
( NAME = N'KQUR',
  FILENAME = N'E:\Data\KQUR.mdf',
  SIZE = 1GB,
  MAXSIZE = 20GB,
  FILEGROWTH = 100MB )
LOG ON
( NAME = N'KQUR_Log',
  FILENAME = N'F:\Logs\KQUR_Log.ldf',
  SIZE = 100MB,
  MAXSIZE = 2GB,
  FILEGROWTH = 20MB );
```

#### 2. Create Service Account (Production)

```sql
-- Create dedicated service account for production
USE [master]
CREATE LOGIN [DOMAIN\noor-canvas-svc] FROM WINDOWS;

-- Grant database access
USE [KSESSIONS]
CREATE USER [DOMAIN\noor-canvas-svc] FOR LOGIN [DOMAIN\noor-canvas-svc];
ALTER ROLE [db_owner] ADD MEMBER [DOMAIN\noor-canvas-svc];

USE [KQUR]
CREATE USER [DOMAIN\noor-canvas-svc] FOR LOGIN [DOMAIN\noor-canvas-svc];
ALTER ROLE [db_datareader] ADD MEMBER [DOMAIN\noor-canvas-svc];
```

## Schema Creation

### Canvas Schema (NOOR Canvas Application Data)

#### 1. Create Canvas Schema

```sql
-- Execute on KSESSIONS_DEV (development) or KSESSIONS (production)
USE [KSESSIONS_DEV]; -- Use [KSESSIONS] for production

-- Create canvas schema
CREATE SCHEMA [canvas];
GO
```

#### 2. Create Canvas Tables

```sql
-- Sessions table - Core session management
CREATE TABLE [canvas].[Sessions] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Guid] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,
    [AlbumId] INT NULL, -- Foreign key to KSESSIONS.dbo.Groups
    [CategoryId] INT NULL, -- Foreign key to KSESSIONS.dbo.Categories
    [SessionId] INT NULL, -- Foreign key to KSESSIONS.dbo.Sessions
    [HostToken] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    [Title] NVARCHAR(500) NULL,
    [Description] NVARCHAR(2000) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [ExpiresAt] DATETIME2 NOT NULL DEFAULT DATEADD(HOUR, 24, GETUTCDATE()),
    [CreatedBy] NVARCHAR(200) NULL,
    [MaxParticipants] INT NULL DEFAULT 100,
    [IsActive] BIT NOT NULL DEFAULT 1
);

-- Session Transcripts - HTML content storage
CREATE TABLE [canvas].[SessionTranscripts] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [SessionId] INT NOT NULL,
    [HtmlContent] NVARCHAR(MAX) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    [Version] INT NOT NULL DEFAULT 1,
    CONSTRAINT FK_SessionTranscripts_Sessions FOREIGN KEY ([SessionId])
        REFERENCES [canvas].[Sessions]([Id]) ON DELETE CASCADE
);

-- Registrations - Participant management
CREATE TABLE [canvas].[Registrations] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [SessionId] INT NOT NULL,
    [Name] NVARCHAR(200) NOT NULL,
    [Country] NVARCHAR(100) NULL,
    [City] NVARCHAR(100) NULL,
    [FingerprintHash] NVARCHAR(64) NULL, -- SHA-256 hash for device identification
    [IpHash] NVARCHAR(64) NULL, -- SHA-256 hash of IP address
    [JoinTime] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [IsActive] BIT NOT NULL DEFAULT 1,
    [ConnectionId] NVARCHAR(200) NULL, -- SignalR connection tracking
    CONSTRAINT FK_Registrations_Sessions FOREIGN KEY ([SessionId])
        REFERENCES [canvas].[Sessions]([Id]) ON DELETE CASCADE
);

-- Questions - Q&A system
CREATE TABLE [canvas].[Questions] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [SessionId] INT NOT NULL,
    [ParticipantId] INT NOT NULL,
    [QuestionText] NVARCHAR(2000) NOT NULL,
    [AnswerText] NVARCHAR(MAX) NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Answered, Dismissed
    [Priority] INT NOT NULL DEFAULT 0, -- 0=Normal, 1=High, 2=Urgent
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [AnsweredAt] DATETIME2 NULL,
    [AnsweredBy] NVARCHAR(200) NULL,
    CONSTRAINT FK_Questions_Sessions FOREIGN KEY ([SessionId])
        REFERENCES [canvas].[Sessions]([Id]) ON DELETE CASCADE,
    CONSTRAINT FK_Questions_Participants FOREIGN KEY ([ParticipantId])
        REFERENCES [canvas].[Registrations]([Id]) ON DELETE CASCADE
);

-- Annotations - Real-time annotation data
CREATE TABLE [canvas].[Annotations] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [SessionId] INT NOT NULL,
    [ParticipantId] INT NULL, -- NULL for host annotations
    [AnnotationType] NVARCHAR(50) NOT NULL, -- 'drawing', 'text', 'highlight', 'pointer'
    [AnnotationData] NVARCHAR(MAX) NOT NULL, -- JSON data for annotation details
    [XPosition] DECIMAL(10,4) NULL, -- Relative X coordinate (0-1)
    [YPosition] DECIMAL(10,4) NULL, -- Relative Y coordinate (0-1)
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [ExpiresAt] DATETIME2 NULL, -- For temporary annotations
    [IsVisible] BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Annotations_Sessions FOREIGN KEY ([SessionId])
        REFERENCES [canvas].[Sessions]([Id]) ON DELETE CASCADE,
    CONSTRAINT FK_Annotations_Participants FOREIGN KEY ([ParticipantId])
        REFERENCES [canvas].[Registrations]([Id]) ON DELETE CASCADE
);
```

#### 3. Create Canvas Indexes

```sql
-- Performance indexes for canvas schema
CREATE INDEX IX_Sessions_Guid ON [canvas].[Sessions]([Guid]);
CREATE INDEX IX_Sessions_HostToken ON [canvas].[Sessions]([HostToken]);
CREATE INDEX IX_Sessions_Status_CreatedAt ON [canvas].[Sessions]([Status], [CreatedAt]);
CREATE INDEX IX_Sessions_ExpiresAt ON [canvas].[Sessions]([ExpiresAt]);

CREATE INDEX IX_Registrations_SessionId ON [canvas].[Registrations]([SessionId]);
CREATE INDEX IX_Registrations_FingerprintHash ON [canvas].[Registrations]([FingerprintHash]);

CREATE INDEX IX_Questions_SessionId_Status ON [canvas].[Questions]([SessionId], [Status]);
CREATE INDEX IX_Questions_CreatedAt ON [canvas].[Questions]([CreatedAt]);

CREATE INDEX IX_Annotations_SessionId_CreatedAt ON [canvas].[Annotations]([SessionId], [CreatedAt]);
CREATE INDEX IX_Annotations_ParticipantId ON [canvas].[Annotations]([ParticipantId]);
```

### Cross-Database Integration Schema

#### 1. Beautiful Islam Integration (KSESSIONS Database)

```sql
-- Verify existing Beautiful Islam tables (read-only access)
USE [KSESSIONS_DEV]; -- Use [KSESSIONS] for production

-- Groups table (Albums) - Contains Islamic content collections
-- Table: dbo.Groups
-- Key Columns: GroupID (int), GroupName (varchar), IsActive (bit)

-- Categories table - Subdivisions within Groups
-- Table: dbo.Categories
-- Key Columns: CategoryID (int), CategoryName (varchar), GroupID (FK), IsActive (bit)

-- Sessions table - Individual Islamic learning sessions
-- Table: dbo.Sessions
-- Key Columns: SessionID (int), GroupID (FK), CategoryID (FK), SessionName (varchar)

-- Verify tables exist
SELECT TABLE_NAME, TABLE_SCHEMA
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo'
AND TABLE_NAME IN ('Groups', 'Categories', 'Sessions');
```

#### 2. Quranic Content Integration (KQUR Database)

```sql
-- Verify Quranic content structure
USE [KQUR_DEV]; -- Use [KQUR] for production

-- Verify Users table exists
SELECT TABLE_NAME, TABLE_SCHEMA
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo'
AND TABLE_NAME = 'Users';
```

## Connection String Configuration

### Development Connection Strings

```json
// appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=localhost\\SQLEXPRESS;Initial Catalog=KSESSIONS_DEV;User ID=sa;Password=adf4961glo;Connection Timeout=3600;TrustServerCertificate=True;Encrypt=False;",
    "KSessionsDb": "Data Source=localhost\\SQLEXPRESS;Initial Catalog=KSESSIONS_DEV;User ID=sa;Password=adf4961glo;Connection Timeout=3600;TrustServerCertificate=True;Encrypt=False;"
  }
}
```

### Production Connection Strings

```json
// appsettings.Production.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=PROD-SQL-SERVER;Initial Catalog=KSESSIONS;Integrated Security=true;Connection Timeout=3600;TrustServerCertificate=True;Encrypt=True;",
    "KSessionsDb": "Data Source=PROD-SQL-SERVER;Initial Catalog=KSESSIONS;Integrated Security=true;Connection Timeout=3600;TrustServerCertificate=True;Encrypt=True;"
  }
}
```

## Entity Framework Configuration

### DbContext Setup

```csharp
// Configure Entity Framework contexts in Program.cs
builder.Services.AddDbContext<CanvasDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<KSessionsDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("KSessionsDb")
        ?? builder.Configuration.GetConnectionString("DefaultConnection")));
```

### Database Migration Commands

```powershell
# Development environment migrations
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"

# Create initial migration for Canvas schema
dotnet ef migrations add InitialCanvasSchema --context CanvasDbContext --output-dir Migrations/Canvas

# Update development database
dotnet ef database update --context CanvasDbContext

# Verify migration status
dotnet ef migrations list --context CanvasDbContext
```

## Data Validation and Testing

### Database Connectivity Test

```sql
-- Test database connections and permissions
USE [KSESSIONS_DEV];

-- Verify canvas schema access
SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'canvas';

-- Test canvas tables
SELECT COUNT(*) as SessionCount FROM [canvas].[Sessions];
SELECT COUNT(*) as TranscriptCount FROM [canvas].[SessionTranscripts];
SELECT COUNT(*) as RegistrationCount FROM [canvas].[Registrations];
SELECT COUNT(*) as QuestionCount FROM [canvas].[Questions];
SELECT COUNT(*) as AnnotationCount FROM [canvas].[Annotations];

-- Test cross-database integration
SELECT COUNT(*) as GroupCount FROM [dbo].[Groups] WHERE IsActive = 1;
SELECT COUNT(*) as CategoryCount FROM [dbo].[Categories] WHERE IsActive = 1;
```

### Application Health Check

```csharp
// Health check configuration for database connectivity
builder.Services.AddHealthChecks()
    .AddDbContextCheck<CanvasDbContext>("canvas_database")
    .AddDbContextCheck<KSessionsDbContext>("ksessions_database")
    .AddSqlServer(
        connectionString: builder.Configuration.GetConnectionString("DefaultConnection"),
        healthQuery: "SELECT 1 FROM [canvas].[Sessions]",
        name: "canvas_schema_check");
```

## Backup and Recovery

### Development Backup Strategy

```sql
-- Create development database backup
BACKUP DATABASE [KSESSIONS_DEV]
TO DISK = 'C:\Backups\KSESSIONS_DEV_Full.bak'
WITH FORMAT, INIT, NAME = 'KSESSIONS_DEV Full Backup';

BACKUP DATABASE [KQUR_DEV]
TO DISK = 'C:\Backups\KQUR_DEV_Full.bak'
WITH FORMAT, INIT, NAME = 'KQUR_DEV Full Backup';
```

### Production Backup Strategy

```sql
-- Production backup with compression
BACKUP DATABASE [KSESSIONS]
TO DISK = 'E:\Backups\KSESSIONS_Full.bak'
WITH FORMAT, INIT, COMPRESSION,
NAME = 'KSESSIONS Production Full Backup';

-- Transaction log backup for point-in-time recovery
BACKUP LOG [KSESSIONS]
TO DISK = 'E:\Backups\KSESSIONS_Log.trn'
WITH FORMAT, INIT;
```

## Security Configuration

### Database Security Best Practices

```sql
-- Revoke unnecessary permissions from public role
USE [KSESSIONS_DEV];
REVOKE ALL ON SCHEMA::canvas FROM public;

-- Grant specific permissions to application users
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::canvas TO [DOMAIN\noor-canvas-svc];

-- Audit login attempts
SELECT
    login_time,
    login_name,
    client_interface_name,
    application_name
FROM sys.dm_exec_sessions
WHERE is_user_process = 1
ORDER BY login_time DESC;
```

### Connection Security

- **Development**: Use sa account only in development environment
- **Production**: Use dedicated service account with minimal privileges
- **Encryption**: Enable SSL/TLS for production connections
- **Firewall**: Restrict SQL Server port (1433) to application servers only

## Troubleshooting Common Issues

### Connection Issues

```sql
-- Check SQL Server configuration
SELECT
    name,
    value_in_use
FROM sys.configurations
WHERE name IN ('remote access', 'show advanced options');

-- Verify network protocols
EXEC xp_readerrorlog 0, 1, N'Server is listening on';
```

### Performance Issues

```sql
-- Check database size and growth
SELECT
    DB_NAME(database_id) AS DatabaseName,
    name AS LogicalName,
    size * 8/1024 AS SizeMB,
    growth AS GrowthSetting
FROM sys.master_files
WHERE DB_NAME(database_id) IN ('KSESSIONS_DEV', 'KQUR_DEV');

-- Monitor active connections
SELECT
    DB_NAME(dbid) AS DatabaseName,
    COUNT(*) AS ConnectionCount
FROM sys.sysprocesses
WHERE dbid > 0
GROUP BY dbid, DB_NAME(dbid);
```

### Schema Issues

```sql
-- Verify canvas schema objects
SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'canvas'
ORDER BY TABLE_NAME;

-- Check foreign key constraints
SELECT
    fk.name AS ConstraintName,
    tp.name AS ParentTable,
    cp.name AS ParentColumn,
    tr.name AS ReferencedTable,
    cr.name AS ReferencedColumn
FROM sys.foreign_keys fk
INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns cp ON fkc.parent_column_id = cp.column_id AND fkc.parent_object_id = cp.object_id
INNER JOIN sys.columns cr ON fkc.referenced_column_id = cr.column_id AND fkc.referenced_object_id = cr.object_id
WHERE tp.schema_id = SCHEMA_ID('canvas');
```

For IIS database connection configuration, see the [IIS Configuration Guide](iis-configuration.md).
For complete production deployment procedures, see the [Production Deployment Guide](production-deployment.md).
