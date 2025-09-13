# Database Schema Documentation

## Overview

NOOR CANVAS uses a dedicated `canvas` schema within SQL Server, designed for optimal performance with real-time operations.

## Schema Structure

### Development Environment
- **Database**: `KSESSIONS_DEV`
- **Schema**: `canvas`
- **Connection**: Trusted connection with 1-hour timeout

### Production Environment
- **Database**: `KSESSIONS`
- **Schema**: `canvas`  
- **Connection**: `sa` user with full permissions

## Tables

### canvas.Sessions
Primary session management table.

```sql
CREATE TABLE canvas.Sessions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    album_id INT NULL,
    category_id INT NULL,
    guid UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    host_token UNIQUEIDENTIFIER NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    expires_at DATETIME2 NULL,
    
    INDEX IX_Sessions_Guid (guid),
    INDEX IX_Sessions_HostToken (host_token),
    INDEX IX_Sessions_Status (status)
);
```

### canvas.SessionTranscripts
Stores session content and transcription data.

```sql
CREATE TABLE canvas.SessionTranscripts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_id INT NOT NULL,
    html_content NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (session_id) REFERENCES canvas.Sessions(id),
    INDEX IX_SessionTranscripts_SessionId (session_id)
);
```

### canvas.Registrations
Participant registration and management.

```sql
CREATE TABLE canvas.Registrations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    country NVARCHAR(100) NULL,
    city NVARCHAR(100) NULL,
    fingerprint_hash NVARCHAR(64) NOT NULL,
    ip_hash NVARCHAR(64) NOT NULL,
    join_time DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (session_id) REFERENCES canvas.Sessions(id),
    INDEX IX_Registrations_SessionId (session_id),
    INDEX IX_Registrations_FingerprintHash (fingerprint_hash)
);
```

### canvas.Questions
Q&A system data storage.

```sql
CREATE TABLE canvas.Questions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_id INT NOT NULL,
    participant_id INT NOT NULL,
    question_text NVARCHAR(MAX) NOT NULL,
    answer_text NVARCHAR(MAX) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (session_id) REFERENCES canvas.Sessions(id),
    FOREIGN KEY (participant_id) REFERENCES canvas.Registrations(id),
    INDEX IX_Questions_SessionId (session_id),
    INDEX IX_Questions_ParticipantId (participant_id),
    INDEX IX_Questions_Status (status)
);
```

### canvas.Annotations
Real-time annotation data storage.

```sql
CREATE TABLE canvas.Annotations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_id INT NOT NULL,
    participant_id INT NOT NULL,
    annotation_data NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (session_id) REFERENCES canvas.Sessions(id),
    FOREIGN KEY (participant_id) REFERENCES canvas.Registrations(id),
    INDEX IX_Annotations_SessionId (session_id),
    INDEX IX_Annotations_ParticipantId (participant_id),
    INDEX IX_Annotations_CreatedAt (created_at)
);
```

## Cross-Schema Integration

### Read Access to dbo Schema
NOOR CANVAS has read access to existing application data:

```sql
-- Beautiful Islam integration
USE KQUR_DEV; -- Development
USE KQUR;     -- Production

-- Available tables
SELECT * FROM dbo.Users;
SELECT * FROM dbo.Categories;
SELECT * FROM dbo.Albums;
```

### Asset Referencing Strategy
- **No Data Duplication**: Reference existing image paths
- **Shared Resources**: Use existing asset directories
- **Path References**: `D:\PROJECTS\KSESSIONS\Source Code\Sessions.Spa\Resources\IMAGES`

## Performance Optimizations

### Indexing Strategy
- **GUID Lookups**: Optimized for session token validation
- **Time-based Queries**: Indexed on creation timestamps  
- **Foreign Key Relationships**: Proper referential integrity
- **Real-time Queries**: Optimized for annotation retrieval

### Query Performance
- **Connection Pooling**: Efficient database connections
- **Timeout Configuration**: 1-hour timeout for long operations
- **Prepared Statements**: Parameterized queries for security
- **Bulk Operations**: Optimized for real-time data insertion

## Security Considerations

### Data Protection
- **Parameterized Queries**: SQL injection prevention
- **Hash Storage**: Fingerprint and IP address hashing
- **GUID Tokens**: Cryptographically secure session tokens
- **Schema Isolation**: Dedicated canvas schema separation

### Access Control
- **Minimal Permissions**: Read-only access to dbo schema
- **Service Account**: Dedicated application database user
- **Connection Security**: Trusted connections in development
- **Audit Trail**: Comprehensive logging for all operations

---

*For development setup instructions, see [Getting Started](../development/getting-started.md)*
