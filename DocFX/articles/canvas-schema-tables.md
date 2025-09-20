# Canvas Schema Tables Reference

## Core Tables

### Sessions 📅
**Purpose**: Central hub for all learning sessions in NOOR Canvas

| Field | Type | Description |
|-------|------|-------------|
| `SessionId` | `bigint` (PK) | Unique session identifier |
| `GroupId` | `uniqueidentifier` | SignalR group identifier for real-time communication |
| `Title` | `nvarchar(200)` | Session display title |
| `Description` | `nvarchar(1000)` | Detailed session description |
| `HostGuid` | `nvarchar(100)` | Host identifier (NOT NULL, default '') |
| `MaxParticipants` | `int` | Maximum allowed participants |
| `ParticipantCount` | `int` | Current participant count |
| `Status` | `nvarchar(50)` | Session status (Pending, Active, Ended, etc.) |
| `StartedAt` | `datetime2` | When session actually started |
| `EndedAt` | `datetime2` | When session ended |
| `ExpiresAt` | `datetime2` | Session expiration time |
| `CreatedAt` | `datetime2` (NOT NULL) | Session creation timestamp |
| `ModifiedAt` | `datetime2` (NOT NULL, default '0001-01-01') | Last modification timestamp |
| `KSessionsId` | `bigint` | Link to dbo.Sessions for Islamic content |

**Relationships**: Links to `dbo.Sessions` for Islamic content integration

---

### Users 👥  
**Purpose**: User profiles and registration management

| Field | Type | Description |
|-------|------|-------------|
| `UserId` | `uniqueidentifier` (PK) | Unique user identifier |
| `UserGuid` | `nvarchar(256)` (NOT NULL, default '') | User GUID reference |
| `Name` | `nvarchar(256)` | User display name |
| `City` | `nvarchar(128)` | User's city |
| `Country` | `nvarchar(128)` | User's country |
| `FirstJoinedAt` | `datetime2` (NOT NULL) | First session join timestamp |
| `LastJoinedAt` | `datetime2` (NOT NULL) | Most recent session join |
| `CreatedAt` | `datetime2` (NOT NULL, default '0001-01-01') | User profile creation |
| `IsActive` | `bit` (NOT NULL, default 0) | Account status flag |
| `LastSeenAt` | `datetime2` | Last activity timestamp |
| `ModifiedAt` | `datetime2` (NOT NULL, default '0001-01-01') | Profile modification timestamp |

**Purpose**: Manages user demographics and engagement tracking for learning analytics.

---

### SecureTokens 🔐
**Purpose**: 8-character friendly token system for session access control

| Field | Type | Description |
|-------|------|-------------|
| `Id` | `int` (PK) | Token record identifier |
| `SessionId` | `bigint` (NOT NULL, FK) | Associated session |
| `HostToken` | `nvarchar(8)` (NOT NULL) | 8-char host access token |
| `UserToken` | `nvarchar(8)` (NOT NULL) | 8-char user access token |
| `ExpiresAt` | `datetime2` (NOT NULL) | Token expiration time |
| `IsActive` | `bit` (NOT NULL, default 1) | Token validity flag |
| `CreatedAt` | `datetime2` (NOT NULL, default GETUTCDATE()) | Token generation timestamp |
| `CreatedByIp` | `nvarchar(45)` | IP address of token creator |
| `AccessCount` | `int` (NOT NULL, default 0) | Usage counter |
| `LastAccessedAt` | `datetime2` | Most recent access timestamp |

**Security Features**:
- 8-character friendly format (e.g., `USER223A`, `HOST456B`)  
- Automatic expiration handling
- IP tracking for security audit
- Access counting for analytics

**URLs**:
- Host: `/host/control-panel/{hostToken}`
- User: `/user/landing/{userToken}`

---

## Learning Activity Tables

### Questions ❓
**Purpose**: Q&A system for interactive learning sessions

| Field | Type | Description |
|-------|------|-------------|
| `QuestionId` | `bigint` (PK) | Unique question identifier |
| `SessionId` | `bigint` (NOT NULL, FK) | Associated session |
| `UserId` | `uniqueidentifier` (NOT NULL, FK) | Question author |
| `QuestionText` | `nvarchar(280)` (NOT NULL) | Question content (280 char limit) |
| `QueuedAt` | `datetime2` (NOT NULL) | When question was submitted |
| `AnsweredAt` | `datetime2` | When question was answered |
| `VoteCount` | `int` (NOT NULL) | Community vote score |
| `Status` | `nvarchar(50)` (NOT NULL) | Question status (Pending, Answered, Rejected) |

**Relationships**: 
- `Sessions` (both canvas and dbo)
- `Users` for question attribution
- `QuestionAnswers` for responses
- `QuestionVotes` for community voting

---

### QuestionAnswers 💬
**Purpose**: Responses to submitted questions

| Field | Type | Description |
|-------|------|-------------|
| `AnswerId` | `bigint` (PK) | Unique answer identifier |
| `QuestionId` | `bigint` (NOT NULL, FK) | Parent question |
| `PostedBy` | `nvarchar(64)` (NOT NULL) | Answer author |
| `PostedAt` | `datetime2` (NOT NULL) | Answer timestamp |
| `AnswerText` | `nvarchar(MAX)` | Answer content (unlimited length) |

---

### QuestionVotes 🗳️
**Purpose**: Community voting system for question prioritization

| Field | Type | Description |
|-------|------|-------------|
| `VoteId` | `bigint` (PK) | Unique vote identifier |
| `QuestionId` | `bigint` (NOT NULL, FK) | Target question |
| `UserId` | `uniqueidentifier` (FK) | Voting user |
| `VoteValue` | `tinyint` (NOT NULL) | Vote value (+1, -1) |
| `VotedAt` | `datetime2` (NOT NULL) | Vote timestamp |

**Features**:
- Prevents duplicate voting per user per question
- Aggregates to `Questions.VoteCount` for sorting
- Supports upvote/downvote mechanics

---

### Annotations ✏️
**Purpose**: Real-time highlighting and note-taking system

| Field | Type | Description |
|-------|------|-------------|
| `AnnotationId` | `bigint` (PK) | Unique annotation identifier |
| `SessionId` | `bigint` (NOT NULL, FK) | Associated session |
| `CreatedAt` | `datetime2` (NOT NULL) | Annotation timestamp |
| `AnnotationData` | `nvarchar(MAX)` | JSON annotation data (highlights, notes, coordinates) |
| `CreatedBy` | `nvarchar(128)` | Annotation author |
| `IsDeleted` | `bit` (NOT NULL, default 0) | Soft delete flag |

**Data Format**: JSON structure containing:
- Text selection coordinates
- Highlight color and style
- Contextual notes
- User interaction metadata

---

### SharedAssets 📤
**Purpose**: Content sharing and asset management during sessions

| Field | Type | Description |
|-------|------|-------------|
| `AssetId` | `bigint` (PK) | Unique asset identifier |
| `SessionId` | `bigint` (NOT NULL, FK) | Associated session |
| `SharedAt` | `datetime2` (NOT NULL) | Sharing timestamp |
| `AssetType` | `nvarchar(50)` | Asset type (Image, Document, Link, Video) |
| `AssetData` | `nvarchar(MAX)` | Asset content or reference |
| `AssetSelector` | `nvarchar(500)` | CSS/DOM selector for positioning |
| `AssetPosition` | `int` | Display order/position |
| `AssetMetadata` | `nvarchar(MAX)` | JSON metadata (title, description, etc.) |

**Key Features**:
- **Selector-based Detection**: 14 SHARE container selectors replace 191 buttons
- **~90% Storage Reduction** vs HTML blob storage
- **Indexed Performance**: `IX_SharedAssets_TypeSelector` for fast queries
- **Rich Metadata**: JSON-based extensible metadata system

---

## Tracking & Analytics Tables

### SessionParticipants 👥
**Purpose**: Real-time participant tracking and session analytics

| Field | Type | Description |
|-------|------|-------------|
| `Id` | `bigint` (PK) | Unique participant record |
| `SessionId` | `bigint` (NOT NULL, FK) | Associated session |
| `UserId` | `nvarchar(128)` (NOT NULL) | Participant identifier |
| `DisplayName` | `nvarchar(255)` | Participant display name |
| `JoinedAt` | `datetime2` | Join timestamp |
| `LeftAt` | `datetime2` | Leave timestamp (NULL if still active) |
| `CreatedAt` | `datetime2` (NOT NULL, default GETUTCDATE()) | Record creation |
| `ModifiedAt` | `datetime2` (NOT NULL, default GETUTCDATE()) | Last update |

**Analytics Features**:
- Real-time participant counting
- Session duration tracking  
- Join/leave pattern analysis
- SignalR group membership management

---

### Registrations 📝
**Purpose**: User session registration and join tracking

| Field | Type | Description |
|-------|------|-------------|
| `RegistrationId` | `bigint` (PK) | Unique registration identifier |
| `SessionId` | `bigint` (NOT NULL, FK) | Target session |
| `UserId` | `uniqueidentifier` (NOT NULL, FK) | Registering user |
| `JoinTime` | `datetime2` (NOT NULL) | Registration timestamp |

**Purpose**: Links users to sessions for attendance tracking and capacity management.

---

### AuditLog 📊  
**Purpose**: Comprehensive activity logging for security and analytics

| Field | Type | Description |
|-------|------|-------------|
| `EventId` | `bigint` (PK) | Unique event identifier |
| `At` | `datetime2` (NOT NULL) | Event timestamp |
| `Actor` | `nvarchar(64)` | Action performer |
| `SessionId` | `bigint` (FK) | Associated session (if applicable) |
| `UserId` | `uniqueidentifier` (FK) | Associated user (if applicable) |
| `Action` | `nvarchar(100)` | Action type description |
| `Details` | `nvarchar(MAX)` | Detailed event information |

**Tracked Events**:
- User authentication and authorization
- Session lifecycle events (create, start, end)
- Question submission and answering
- Asset sharing and annotations
- Security events and access patterns

---

## Administrative Tables

### Issues 🐛
**Purpose**: Issue tracking and user feedback system

| Field | Type | Description |
|-------|------|-------------|
| `IssueId` | `bigint` (PK) | Unique issue identifier |
| `Title` | `nvarchar(200)` (NOT NULL) | Issue title |
| `Description` | `nvarchar(MAX)` | Detailed issue description |
| `Priority` | `nvarchar(50)` (NOT NULL) | Priority level (Low, Medium, High, Critical) |
| `Category` | `nvarchar(50)` (NOT NULL) | Issue category (Bug, Feature, Performance, etc.) |
| `Status` | `nvarchar(50)` (NOT NULL) | Issue status (Open, In Progress, Resolved, Closed) |
| `ReportedAt` | `datetime2` (NOT NULL) | Issue creation timestamp |
| `SessionId` | `bigint` (FK) | Associated session (if applicable) |
| `UserId` | `uniqueidentifier` (FK) | Reporting user |
| `ReportedBy` | `nvarchar(128)` | Reporter identifier |
| `Context` | `nvarchar(MAX)` | Additional context and environment info |

---

### SessionLinks 🔗
**Purpose**: Session URL management and access tracking

| Field | Type | Description |
|-------|------|-------------|
| `LinkId` | `bigint` (PK) | Unique link identifier |
| `SessionId` | `bigint` (NOT NULL, FK) | Associated session |
| `Guid` | `uniqueidentifier` (NOT NULL) | Link GUID |
| `State` | `tinyint` (NOT NULL) | Link state (Active, Expired, Revoked) |
| `LastUsedAt` | `datetime2` | Most recent access |
| `UseCount` | `int` (NOT NULL) | Usage counter |
| `CreatedAt` | `datetime2` (NOT NULL) | Link creation timestamp |

---

### HostSessions 🎯
**Purpose**: Host authentication and session control

| Field | Type | Description |
|-------|------|-------------|
| `HostSessionId` | `bigint` (PK) | Unique host session identifier |
| `SessionId` | `bigint` (NOT NULL, FK) | Associated session |
| `HostGuidHash` | `nvarchar(128)` (NOT NULL) | Hashed host identifier |
| `CreatedAt` | `datetime2` (NOT NULL) | Host session creation |
| `ExpiresAt` | `datetime2` | Host session expiration |
| `LastUsedAt` | `datetime2` | Most recent host access |
| `CreatedBy` | `nvarchar(128)` | Host session creator |
| `RevokedAt` | `datetime2` | Revocation timestamp |
| `RevokedBy` | `nvarchar(128)` | Who revoked the session |
| `IsActive` | `bit` (NOT NULL) | Host session status |

---

### AdminSessions 👑
**Purpose**: Administrative access and control panel sessions

| Field | Type | Description |
|-------|------|-------------|
| `AdminSessionId` | `bigint` (PK) | Unique admin session identifier |
| `AdminGuid` | `nvarchar(100)` (NOT NULL) | Admin GUID identifier |
| `SessionToken` | `nvarchar(128)` (NOT NULL) | Admin session token |
| `CreatedAt` | `datetime2` (NOT NULL) | Admin session creation |
| `ExpiresAt` | `datetime2` (NOT NULL) | Admin session expiration |
| `LastUsedAt` | `datetime2` | Most recent admin access |
| `IsActive` | `bit` (NOT NULL) | Admin session status |
| `UserAgent` | `nvarchar(255)` | Browser/client information |
| `IpAddress` | `nvarchar(45)` | Admin IP address |

---

## Key Relationships

### Primary Relationships
- **Sessions** ↔ **SecureTokens**: 1:1 token pair per session
- **Sessions** ↔ **Questions**: 1:Many Q&A per session  
- **Questions** ↔ **QuestionAnswers**: 1:Many answers per question
- **Questions** ↔ **QuestionVotes**: Many:Many voting system
- **Sessions** ↔ **Annotations**: 1:Many highlights per session
- **Sessions** ↔ **SharedAssets**: 1:Many shared content per session

### Cross-Schema Integration
- **canvas.Sessions** ↔ **dbo.Sessions**: SessionId linkage for Islamic content
- **canvas.SecureTokens** → **dbo.Sessions**: Content access control
- **canvas.Annotations** → **dbo.Sessions**: Content annotation system

### User Activity Chains
- **Users** → **Registrations** → **Sessions**: User enrollment flow
- **Users** → **Questions** → **QuestionAnswers**: Q&A participation
- **Users** → **QuestionVotes**: Community engagement
- **SessionParticipants**: Real-time presence tracking

---

*Each table is designed to support the real-time, collaborative nature of Islamic learning sessions while maintaining data integrity and performance at scale.*