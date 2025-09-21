# NOOR CANVAS Technical Architecture

## System Overview

NOOR CANVAS is built on a modern, scalable architecture designed for real-time Islamic content sharing and collaboration.

### Core Technologies

**Backend Framework**

- ASP.NET Core 8.0 with Blazor Server
- Entity Framework Core for data access
- SignalR for real-time communication
- Serilog for structured logging

**Database**

- SQL Server with dedicated canvas schema
- Cross-application integration with existing dbo schema
- GUID-based session management
- Optimized indexes for real-time performance

**Frontend**

- Blazor Server with real-time rendering
- McBeatch responsive theme framework
- Multi-language support (Arabic RTL, English LTR, Urdu RTL)
- Canvas-based annotation system

**Real-time Communication**

- SignalR WebSocket connections
- Hub-based architecture for session management
- Live annotation synchronization
- Participant management and Q&A system

## Architecture Layers

### 1. Presentation Layer (Blazor Server)

```
Components/
├── Session Management
├── Annotation Canvas
├── Participant Interface
└── Q&A System
```

### 2. Application Layer

```
Controllers/
├── SessionController
├── ParticipantController
├── AnnotationController
└── QuestionController

Services/
├── SessionService
├── AnnotationService
├── ParticipantService
└── NotificationService
```

### 3. SignalR Hubs

```
Hubs/
├── SessionHub (session management)
├── AnnotationHub (real-time drawing)
├── ParticipantHub (user management)
└── QuestionHub (Q&A system)
```

### 4. Data Layer

```
Models/
├── Session
├── Participant
├── Annotation
├── Question
└── SessionTranscript

DbContext/
└── CanvasDbContext (canvas schema)
```

### 5. Database Schema

**Canvas Schema (NOOR CANVAS)**

- `canvas.Sessions` - Session management
- `canvas.SessionTranscripts` - Session content
- `canvas.Registrations` - Participant data
- `canvas.Questions` - Q&A system
- `canvas.Annotations` - Drawing data

**Cross-Schema Integration**

- Read access to existing `dbo` schema
- Asset referencing (no duplication)
- Shared authentication context

## Development Environment

**Required Setup**

- IIS Express x64 (localhost:9091 HTTPS)
- SQL Server with canvas schema
- Visual Studio or VS Code
- PowerShell for automation scripts

**Key Development Tools**

- `nc` command for application startup
- `nct` for host token generation
- Automated testing framework
- NOOR Observer debugging system

## Deployment Architecture

**Production Environment**

- IIS with dedicated application pool
- SQL Server production databases
- HTTPS with SSL certificates
- Application Insights monitoring

**Security Features**

- GUID-based session tokens
- SQL injection prevention
- Cross-schema access controls
- Structured logging with sanitization

## Performance Considerations

**Real-time Optimization**

- SignalR connection pooling
- Minimal message payloads
- Client-side caching
- Database query optimization

**Scalability**

- Stateless session design
- Database connection pooling
- CDN integration for static assets
- Load balancing support

---

_For detailed implementation information, see the [Development Guide](../development/getting-started.md)_
