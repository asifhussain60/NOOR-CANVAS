# Missing AI Agents - Gap Analysis Documentation

**Date**: 2025-10-12  
**Source**: Cohesion Review 2025-10-12  
**Purpose**: Document capabilities of missing specialized agents identified in gap analysis

---

## Overview

The NOOR CANVAS prompt system currently includes 8 active agents. The cohesion review identified 4 additional specialized agents that would enhance the system. This document explains what each missing agent would do and their potential value.

**Current Agents**: task, question, test-generation, refactor, healthcheck, analyze-learning, sync, cohesion-review  
**Missing Agents**: deployment, migration, security-audit, performance

---

## 1. Deployment Agent (deployment.prompt.md)

### What It Would Do

**Primary Purpose**: Automate application deployment to IIS and production environments with comprehensive validation and rollback capabilities.

**Core Capabilities**:

1. **Pre-Deployment Validation**
   - Verify build succeeds (zero errors, zero warnings)
   - Run full test suite (unit + integration + E2E)
   - Execute healthcheck agent for system integrity
   - Validate database migrations are applied
   - Check environment configuration (appsettings.Production.json)

2. **Automated Deployment Workflow**
   - Kill running Kestrel/IIS processes safely
   - Backup current production deployment
   - Execute `dotnet publish` with production configuration
   - Copy artifacts to IIS wwwroot directory
   - Update IIS application pool settings
   - Apply SSL certificates and HTTPS bindings
   - Start IIS application pool

3. **Post-Deployment Verification**
   - Smoke tests (verify app starts, endpoints respond)
   - Database connectivity check
   - SignalR hub verification
   - Session 212 canonical test execution
   - Performance baseline comparison

4. **Rollback Procedures**
   - Automatic rollback on deployment failure
   - Restore previous backup
   - Revert database migrations if needed
   - Notify team of rollback event

5. **Documentation Updates**
   - Update deployment log with timestamp, version, deployer
   - Record configuration changes
   - Document any manual intervention required
   - Update SystemIndex.md with deployment status

**Example Usage**:
```
@workspace /deploy target=production version=v2.3.1 run-tests=true
```

**Parameters**:
- `target`: staging | production | test
- `version`: Semantic version tag
- `run-tests`: true | false (default: true)
- `backup`: true | false (default: true)
- `auto-rollback`: true | false (default: true)

**Value Proposition**:
- **Consistency**: Every deployment follows same validated process
- **Safety**: Automatic rollback prevents downtime
- **Speed**: Automated workflow faster than manual deployment
- **Auditability**: Complete deployment history tracked

**Current Workaround**: Developers use task.prompt.md or manual deployment scripts

**Priority**: Low (manual deployment works, but automation would reduce errors)

---

## 2. Migration Agent (migration.prompt.md)

### What It Would Do

**Primary Purpose**: Streamline database schema changes and data migrations with validation, testing, and rollback support.

**Core Capabilities**:

1. **Entity Framework Migration Generation**
   - Detect model changes in Data/Models/
   - Generate EF Core migration with `dotnet ef migrations add`
   - Review generated migration code for correctness
   - Identify potential data loss operations (column drops, table drops)
   - Suggest migration improvements (indexes, constraints)

2. **SQL Script Review and Validation**
   - Parse SQL scripts for syntax errors
   - Detect schema rule violations (dbo.* READ-ONLY, canvas.* READ-WRITE)
   - Identify missing transaction wrappers
   - Check for hardcoded values (database names, server names)
   - Validate against InfrastructureQuickRef.md schema rules

3. **Data Migration Planning**
   - Identify data transformation requirements
   - Generate data migration scripts (INSERT, UPDATE, DELETE)
   - Plan for large dataset migrations (chunking, pagination)
   - Validate foreign key constraints won't break
   - Suggest data archival before destructive operations

4. **Rollback Script Generation**
   - Automatically generate DOWN migration for each UP migration
   - Create rollback SQL scripts for data changes
   - Test rollback procedures in development environment
   - Document rollback steps in migration comments

5. **Migration Testing**
   - Apply migration to test database (KSESSIONS_DEV)
   - Verify schema matches expected state
   - Run Playwright tests against migrated schema
   - Performance test (index effectiveness, query optimization)
   - Validate application still functions correctly

6. **Migration Documentation**
   - Update database schema documentation
   - Record migration in version control
   - Document breaking changes and backward compatibility
   - Update API contract validation if DTOs affected

**Example Usage**:
```
@workspace /migrate model=canvas.Questions changes="Add IslamicCategory column (varchar(50))" test=true
```

**Parameters**:
- `model`: Entity class name or table name
- `changes`: Description of schema changes
- `test`: true | false (default: true - run tests after migration)
- `rollback-plan`: true | false (default: true - generate rollback script)
- `data-migration`: SQL script path (optional)

**Value Proposition**:
- **Safety**: Schema changes validated before production
- **Consistency**: All migrations follow standard process
- **Auditability**: Complete migration history in version control
- **Confidence**: Rollback procedures tested and ready

**Current Workaround**: Developers use task.prompt.md and manually run `dotnet ef` commands

**Priority**: Medium (database changes are frequent in this project)

**Integration with Existing Agents**:
- Calls healthcheck agent after migration to verify system integrity
- Updates InfrastructureQuickRef.md via sync agent if schema changes
- Generates Playwright tests via test-generation agent if new tables/columns affect UI

---

## 3. Security Audit Agent (security-audit.prompt.md)

### What It Would Do

**Primary Purpose**: Automated security scanning and vulnerability detection to identify security risks before they reach production.

**Core Capabilities**:

1. **Dependency Vulnerability Scanning**
   - Scan NuGet packages for known vulnerabilities (`dotnet list package --vulnerable`)
   - Scan npm packages for vulnerabilities (`npm audit`)
   - Check package versions against CVE databases
   - Recommend security patches and updates
   - Track security advisories for installed packages

2. **Code Pattern Analysis (SAST - Static Application Security Testing)**
   - **SQL Injection Detection**:
     - Identify string concatenation in SQL queries
     - Detect missing parameterization
     - Flag unsafe Entity Framework queries (FromSqlRaw without parameters)
   - **XSS (Cross-Site Scripting) Detection**:
     - Find unencoded user input in Razor views
     - Detect `@Html.Raw()` usage without sanitization
     - Identify JavaScript injection risks
   - **Authentication/Authorization Issues**:
     - Find missing `[Authorize]` attributes on sensitive controllers
     - Detect authorization bypass vulnerabilities
     - Check for weak password policies
   - **Information Disclosure**:
     - Find hardcoded secrets (API keys, connection strings, passwords)
     - Detect excessive error message details in production
     - Identify debug endpoints left enabled

3. **Authentication & Authorization Review**
   - Verify Azure AD B2C integration is secure
   - Check JWT token validation settings
   - Validate session token expiration policies
   - Review CORS configuration for security holes
   - Audit admin endpoints for proper authorization

4. **Secrets Detection**
   - Scan codebase for hardcoded API keys, passwords, tokens
   - Check for .env files in version control
   - Verify appsettings.json doesn't contain production secrets
   - Recommend Azure Key Vault integration
   - Validate secrets management practices

5. **Security Best Practices Validation**
   - HTTPS enforcement (verify all endpoints use HTTPS)
   - Content Security Policy (CSP) headers
   - CSRF protection on forms
   - Input validation and sanitization
   - Secure cookie settings (HttpOnly, Secure, SameSite)
   - SQL Server connection encryption

6. **Compliance Checking**
   - OWASP Top 10 vulnerability scanning
   - Data protection (GDPR, privacy laws)
   - Logging of security events
   - Secure defaults verification

7. **Security Report Generation**
   - Categorize findings by severity (Critical, High, Medium, Low)
   - Provide remediation guidance for each finding
   - Generate actionable security tasks
   - Track security debt over time

**Example Usage**:
```
@workspace /security-audit scope=all severity=medium+ generate-report=true
```

**Parameters**:
- `scope`: all | dependencies | code | auth | secrets
- `severity`: critical | high | medium | low (default: medium+)
- `generate-report`: true | false (default: true)
- `auto-fix`: true | false (default: false - suggest fixes only)

**Value Proposition**:
- **Proactive**: Catch vulnerabilities before production
- **Compliance**: Ensure security standards are met
- **Visibility**: Security debt tracked and measured
- **Confidence**: Regular audits reduce risk

**Current Workaround**: Manual security reviews, ad-hoc scanning

**Priority**: Medium (security is important, but no major incidents yet)

**Sample Output**:
```
🔒 Security Audit Results - 2025-10-12

Critical Findings: 0
High Findings: 2
- [H1] Hardcoded connection string in appsettings.Development.json (SECRET-001)
- [H2] Missing [Authorize] attribute on AdminController.DeleteSession (AUTH-001)

Medium Findings: 5
- [M1] npm package 'lodash' has known vulnerability (CVE-2021-23337)
- [M2] CORS policy allows all origins (*) in development (CORS-001)
- ...

Recommendations:
1. Move connection strings to Azure Key Vault
2. Add [Authorize(Roles = "Admin")] to AdminController
3. Update lodash to v4.17.21 or higher
4. Restrict CORS to specific domains in development
```

---

## 4. Performance Tuning Agent (performance.prompt.md)

### What It Would Do

**Primary Purpose**: Identify and optimize performance bottlenecks in database queries, API endpoints, and client-side code.

**Core Capabilities**:

1. **Database Query Optimization**
   - **N+1 Query Detection**:
     - Analyze Entity Framework queries for lazy loading issues
     - Identify loops that trigger individual database queries
     - Recommend `.Include()` and `.ThenInclude()` for eager loading
   - **Index Suggestions**:
     - Analyze SQL Server execution plans
     - Identify missing indexes for frequent queries
     - Recommend composite indexes for multi-column filters
     - Detect unused indexes (maintenance burden)
   - **Query Performance Analysis**:
     - Measure query execution times
     - Identify slow queries (>100ms)
     - Suggest query rewrites for efficiency
     - Recommend stored procedures for complex queries

2. **API Endpoint Profiling**
   - Measure endpoint response times
   - Identify slow endpoints (>500ms)
   - Analyze middleware pipeline overhead
   - Detect inefficient serialization (large DTOs)
   - Profile SignalR hub method performance
   - Recommend pagination for large result sets

3. **Client-Side Performance Analysis**
   - **Blazor Component Optimization**:
     - Detect unnecessary re-renders
     - Identify large component trees
     - Recommend `ShouldRender()` optimizations
     - Suggest component virtualization for large lists
   - **JavaScript Performance**:
     - Analyze SignalR connection overhead
     - Detect memory leaks in event handlers
     - Identify inefficient DOM manipulations
   - **Asset Optimization**:
     - Measure bundle sizes (CSS, JS)
     - Recommend code splitting
     - Suggest image optimization
     - Identify render-blocking resources

4. **Caching Strategy Recommendations**
   - Identify frequently accessed data (good cache candidates)
   - Recommend caching layers:
     - In-memory cache for session data
     - Distributed cache (Redis) for multi-server scenarios
     - Output caching for API responses
     - CDN for static assets
   - Suggest cache invalidation strategies
   - Calculate cache hit ratios

5. **Database Connection Optimization**
   - Detect connection pool exhaustion
   - Recommend connection pooling settings
   - Identify long-running transactions (blocking)
   - Suggest async/await for database calls

6. **Performance Benchmarking**
   - Establish performance baselines
   - Track performance over time
   - Compare before/after optimization
   - Generate performance reports

7. **Lighthouse/Performance Metrics**
   - Run Lighthouse audits on pages
   - Measure Core Web Vitals (LCP, FID, CLS)
   - Provide actionable recommendations
   - Track performance scores over time

**Example Usage**:
```
@workspace /performance analyze=api endpoint=/api/Question/GetAll threshold=200ms
@workspace /performance analyze=database detect-n-plus-1=true
@workspace /performance analyze=client page=SessionCanvas
```

**Parameters**:
- `analyze`: api | database | client | all
- `endpoint`: Specific API endpoint to profile (optional)
- `threshold`: Performance threshold in ms (default: 500ms for API, 100ms for DB)
- `detect-n-plus-1`: true | false (default: true)
- `generate-report`: true | false (default: true)

**Value Proposition**:
- **User Experience**: Faster load times, better responsiveness
- **Scalability**: Identify bottlenecks before they cause issues
- **Cost Optimization**: Reduce database load, server resources
- **Data-Driven**: Performance metrics guide optimization efforts

**Current Workaround**: Refactor agent handles some performance issues, but not systematically

**Priority**: Low (application performs well currently, but systematic optimization would help scaling)

**Sample Output**:
```
⚡ Performance Analysis - API Endpoints

Slow Endpoints (>500ms):
1. GET /api/Question/GetAll - 1,247ms average
   - Issue: N+1 query detected (loading Votes in loop)
   - Recommendation: Use .Include(q => q.Votes) in query
   - Expected improvement: ~900ms reduction

2. POST /api/Question/Submit - 687ms average
   - Issue: Synchronous database write
   - Recommendation: Use await SaveChangesAsync()
   - Expected improvement: ~150ms reduction

Database Queries:
- Total queries analyzed: 45
- Slow queries (>100ms): 3
- Missing indexes: 2 (canvas.Questions.IslamicCategory, canvas.Votes.QuestionId)
- N+1 patterns: 1

Caching Opportunities:
- /api/Question/GetAll called 234 times/hour with same results
  → Recommend output caching (5 min TTL)
  → Estimated 80% reduction in database load
```

---

## Summary Comparison

| Agent | Priority | Effort | Current Workaround | Key Value |
|-------|----------|--------|-------------------|-----------|
| **Deployment** | Low | 5 SP | Manual scripts | Consistency, safety, speed |
| **Migration** | Medium | 5 SP | task.prompt.md + manual | Schema safety, auditability |
| **Security Audit** | Medium | 8 SP | Manual reviews | Proactive vulnerability detection |
| **Performance** | Low | 5 SP | refactor.prompt.md | User experience, scalability |

---

## Implementation Recommendations

**Phase 1 (High Value, Medium Effort)**:
1. **Migration Agent** - Database changes are frequent, automation would reduce errors
2. **Security Audit Agent** - Security is critical, automated scanning provides peace of mind

**Phase 2 (Nice to Have)**:
3. **Deployment Agent** - Deployment works, but automation would streamline releases
4. **Performance Agent** - Performance is good, but systematic optimization would help scaling

**Alternative Approach**: Instead of creating 4 new prompt files, consider:
- Extend existing agents (e.g., refactor agent includes performance analysis)
- Create specialized sub-commands for task agent (e.g., `@workspace /task deploy`, `@workspace /task migrate`)
- Keep current approach (use task.prompt.md for all specialized work)

---

**Document Created**: 2025-10-12  
**Next Review**: Evaluate agent needs after 3 months of usage  
**Related**: Cohesion Review 2025-10-12, Gap Analysis Section 2
