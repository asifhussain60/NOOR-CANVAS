# NOOR Canvas Phase 3.5 - SQL Deployment Scripts

**Generated**: September 12, 2025  
**Target Environment**: AHHOME SQL Server  
**Database**: KSESSIONS (Production) / KSESSIONS_DEV (Development)  
**EF Core Version**: 8.0.0

---

## 📁 **Deployment Artifacts**

### **1. Phase-3.5-Complete-Migration-Script.sql**

**Purpose**: Complete idempotent database schema deployment  
**Description**: Creates canvas schema with 13 tables, indexes, and relationships  
**Size**: ~550 lines  
**Execution Time**: ~2-3 minutes

**Tables Created**:

- `canvas.Sessions` - Main session management
- `canvas.Users` - Participant management
- `canvas.Annotations` - Annotation data storage
- `canvas.HostSessions` - Host authentication tokens
- `canvas.SessionLinks` - Session access links
- `canvas.SharedAssets` - Asset sharing system
- `canvas.AuditLog` - Activity logging
- `canvas.Issues` - Issue tracking
- `canvas.Questions` - Q&A system questions
- `canvas.Registrations` - Participant registrations
- `canvas.QuestionAnswers` - Q&A answers
- `canvas.QuestionVotes` - Q&A voting system
- `canvas.AdminSessions` - Administrative sessions

**Performance Indexes**: 15 indexes for optimal query performance

---

### **2. Phase-3.5-Security-Setup.sql**

**Purpose**: Application security configuration  
**Description**: Creates login, users, and permissions across databases  
**Size**: ~150 lines  
**Execution Time**: ~30 seconds

**Security Configuration**:

- Creates `noor_canvas_app` server login
- Creates database users in KSESSIONS and KQUR
- Grants canvas schema CRUD permissions
- Grants cross-schema read permissions for integration
- Provides connection string templates

---

### **3. Phase-3.5-Rollback-Script.sql**

**Purpose**: Complete system rollback capability  
**Description**: Removes all NOOR Canvas database objects and security  
**Size**: ~200 lines  
**Execution Time**: ~1 minute

**Rollback Actions**:

- Drops all foreign key constraints
- Removes all canvas tables in dependency order
- Drops canvas schema
- Cleans migration history
- Removes security principals from all databases

---

### **4. Phase-3.5-Deployment-Checklist.md**

**Purpose**: Comprehensive deployment validation process  
**Description**: Step-by-step checklist for production deployment  
**Sections**: Pre-deployment, Execution, Validation, Rollback, Sign-off

---

## 🚀 **Deployment Sequence**

### **Step 1: Pre-Deployment**

```powershell
# 1. Create database backup
# 2. Review deployment checklist
# 3. Validate development environment
# 4. Verify maintenance window
```

### **Step 2: Schema Deployment**

```sql
-- Execute in SQL Server Management Studio or sqlcmd
-- Target: KSESSIONS database on AHHOME server
sqlcmd -S AHHOME -d KSESSIONS -i "Phase-3.5-Complete-Migration-Script.sql"
```

### **Step 3: Security Configuration**

```sql
-- Execute security setup (requires sysadmin privileges)
sqlcmd -S AHHOME -i "Phase-3.5-Security-Setup.sql"
```

### **Step 4: Application Testing**

```powershell
# Update connection string in appsettings.json
# Test application startup and basic functionality
dotnet run --project "SPA/NoorCanvas"
```

### **Step 5: Validation**

```powershell
# Execute comprehensive testing using deployment checklist
# Verify all endpoints and functionality
# Complete sign-off process
```

---

## 🔧 **Connection String Configuration**

### **Production Connection String**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=AHHOME;Database=KSESSIONS;User Id=noor_canvas_app;Password=NoorCanvas2025!SecurePassword;TrustServerCertificate=true;MultipleActiveResultSets=true;"
  }
}
```

### **Development Connection String**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=AHHOME;Database=KSESSIONS_DEV;User Id=noor_canvas_app;Password=NoorCanvas2025!SecurePassword;TrustServerCertificate=true;MultipleActiveResultSets=true;"
  }
}
```

---

## 📊 **Database Schema Summary**

| Table           | Primary Key    | Foreign Keys           | Indexes | Purpose                  |
| --------------- | -------------- | ---------------------- | ------- | ------------------------ |
| Sessions        | SessionId      | GroupId → dbo.Groups   | 1       | Main session management  |
| Users           | UserId         | -                      | 2       | Participant profiles     |
| Annotations     | AnnotationId   | SessionId → Sessions   | 1       | Annotation storage       |
| HostSessions    | HostSessionId  | SessionId → Sessions   | 2       | Host authentication      |
| SessionLinks    | LinkId         | SessionId → Sessions   | 2       | Session access links     |
| SharedAssets    | AssetId        | SessionId → Sessions   | 1       | Asset sharing            |
| AuditLog        | EventId        | SessionId, UserId      | 2       | Activity logging         |
| Issues          | IssueId        | SessionId, UserId      | 2       | Issue tracking           |
| Questions       | QuestionId     | SessionId, UserId      | 2       | Q&A questions            |
| Registrations   | RegistrationId | SessionId, UserId      | 2       | Participant registration |
| QuestionAnswers | AnswerId       | QuestionId → Questions | 1       | Q&A answers              |
| QuestionVotes   | VoteId         | QuestionId, UserId     | 2       | Q&A voting               |
| AdminSessions   | AdminSessionId | -                      | -       | Admin authentication     |

**Total**: 13 tables, 15 indexes, 12 foreign key relationships

---

## ⚠️ **Important Notes**

### **Security Considerations**

- Change default password before production deployment
- Use strong passwords following organizational policy
- Consider using Windows Authentication in production
- Regularly rotate application passwords
- Monitor failed login attempts

### **Performance Considerations**

- All high-traffic queries have supporting indexes
- Foreign key relationships use appropriate cascade settings
- Audit log table may grow large - implement archiving strategy
- Consider partitioning for large-scale deployments

### **Backup Strategy**

- Take full backup before deployment
- Schedule regular backups including canvas schema
- Test backup restoration procedures
- Document recovery time objectives

### **Monitoring Requirements**

- Monitor application login failures
- Track database performance counters
- Set up alerts for critical errors
- Implement log rotation for audit tables

---

## 🆘 **Emergency Procedures**

### **If Deployment Fails**

1. **Stop Application**: Immediately stop NOOR Canvas services
2. **Execute Rollback**: Run `Phase-3.5-Rollback-Script.sql`
3. **Restore Backup**: Restore database from backup if needed
4. **Investigate**: Analyze logs and determine root cause
5. **Reschedule**: Plan corrective actions and reschedule deployment

### **If Rollback Fails**

1. **Manual Cleanup**: Manually drop objects if rollback script fails
2. **Backup Restoration**: Restore complete database from backup
3. **Service Restart**: Restart SQL Server services if needed
4. **Escalate**: Contact database administration team

### **Emergency Contacts**

- Database Administrator: [Contact Information]
- Lead Developer: [Contact Information]
- DevOps Engineer: [Contact Information]
- Project Manager: [Contact Information]

---

**Document Version**: 1.0  
**Last Updated**: September 12, 2025  
**Next Review**: Phase 4 completion
