# Canvas Schema Complete Reference

**Comprehensive documentation for the NOOR Canvas application database schema**

## 📚 Documentation Sections

### [Schema Overview](canvas-schema-overview.md)

**Purpose, architecture, and design principles**

- Canvas schema mission and objectives
- Dual-schema integration strategy (canvas + dbo)
- Security and real-time learning features
- Key architectural patterns and integration points

### [Tables Reference](canvas-schema-tables.md)

**Complete field-by-field documentation of all tables**

- **Core Tables**: Sessions, Users, SecureTokens
- **Learning Activities**: Questions, Annotations, SharedAssets
- **Tracking & Analytics**: SessionParticipants, AuditLog, Issues
- **Administrative**: HostSessions, AdminSessions, SessionLinks
- **Relationship diagrams and foreign key mappings**

### [Stored Procedures](canvas-schema-procedures.md)

**Detailed documentation of database procedures**

- **canvas.StartFresh**: Complete database cleanup procedure
- Safety features and confirmation mechanisms
- Usage examples and integration patterns
- Error handling and security considerations

### [Performance & Indexes](canvas-schema-performance.md)

**Optimization strategies and index documentation**

- Index strategy for real-time performance
- SignalR hub optimization
- Query performance analysis and benchmarks
- Maintenance procedures and monitoring queries

### [Data Flows & Integration](canvas-schema-integration.md)

**System integration and data flow patterns**

- Session lifecycle and user registration flows
- Cross-schema integration with Islamic content
- SignalR hub data patterns
- Entity Framework integration strategies

---

## 🎯 Quick Reference

### Key Statistics

- **15 Tables**: Comprehensive application data model
- **1 Stored Procedure**: Safe database reset functionality
- **Multiple Indexes**: Optimized for real-time performance
- **Cross-Schema FKs**: Integration with Islamic content repository

### Essential Tables

| Table                 | Purpose            | Key Features                                          |
| --------------------- | ------------------ | ----------------------------------------------------- |
| `Sessions`            | Session management | Real-time status, participant limits                  |
| `SecureTokens`        | Access control     | 8-char friendly tokens, expiration                    |
| `Questions`           | Q&A system         | Community voting, prioritization                      |
| `SharedAssets`        | Content sharing    | **Selector-based detection** (~90% storage reduction) |
| `SessionParticipants` | Real-time tracking | SignalR integration, join/leave events                |

### Performance Highlights

- **<1ms Token Validation**: Critical path optimization
- **<3s Participant Updates**: Real-time SignalR performance
- **90% Storage Reduction**: SharedAssets selector-based architecture
- **100+ Concurrent Sessions**: Proven scaling capability

---

## 🚀 Getting Started

### For Developers

1. **Read [Schema Overview](canvas-schema-overview.md)** - Understand the architecture
2. **Review [Tables Reference](canvas-schema-tables.md)** - Learn the data model
3. **Study [Data Flows](canvas-schema-integration.md)** - Understand integration patterns

### For Database Administrators

1. **Review [Performance Guide](canvas-schema-performance.md)** - Index strategies
2. **Study [Stored Procedures](canvas-schema-procedures.md)** - Maintenance operations
3. **Monitor using provided queries** - Performance tracking scripts

### For System Architects

1. **Analyze [Integration Patterns](canvas-schema-integration.md)** - Cross-schema design
2. **Review [Security Model](canvas-schema-overview.md)** - Token-based access control
3. **Study [Performance Benchmarks](canvas-schema-performance.md)** - Scaling considerations

---

## 🔍 Schema at a Glance

### Core Entity Relationships

```
Sessions (1) ←→ (1) SecureTokens
Sessions (1) ←→ (M) Questions
Sessions (1) ←→ (M) Annotations
Sessions (1) ←→ (M) SharedAssets
Sessions (1) ←→ (M) SessionParticipants

Users (1) ←→ (M) Questions
Users (1) ←→ (M) Registrations
Questions (1) ←→ (M) QuestionAnswers
Questions (1) ←→ (M) QuestionVotes
```

### Cross-Schema Integration

```
canvas.Sessions ←→ dbo.Sessions (SessionId)
canvas.SecureTokens → dbo.Sessions (Content Access)
canvas.Annotations → dbo.Sessions (Content Highlighting)
```

### Security Architecture

- **8-Character Tokens**: USER123A, HOST456B format
- **Role Separation**: Host control vs User participation
- **Session Isolation**: Token-based access control
- **Audit Trail**: Comprehensive activity logging

---

## 🛠️ Maintenance Operations

### Database Reset (Development)

```sql
-- Safe preview
EXEC canvas.StartFresh

-- Live execution (DESTRUCTIVE)
EXEC canvas.StartFresh
    @ConfirmationToken = 'NOOR_CANVAS_START_FRESH',
    @DryRun = 0
```

### Performance Monitoring

```sql
-- Active sessions overview
SELECT SessionId, Title, Status, ParticipantCount
FROM canvas.Sessions
WHERE Status = 'Active'
ORDER BY CreatedAt DESC
```

### Index Maintenance

```sql
-- Check fragmentation
SELECT
    i.name,
    ps.avg_fragmentation_in_percent
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'DETAILED') ps
JOIN sys.indexes i ON ps.object_id = i.object_id
WHERE ps.avg_fragmentation_in_percent > 10
```

---

**Documentation Version**: v3.0 (September 2025)  
**Schema Status**: Production Ready  
**Last Updated**: Post-StartFresh implementation and selector-based SharedAssets optimization

_This documentation reflects the complete canvas schema as implemented in NOOR Canvas v3.0, including all production optimizations and the revolutionary SharedAssets selector-based architecture._
