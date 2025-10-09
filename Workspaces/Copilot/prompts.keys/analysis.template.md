# Technical Analysis: [Key Name]

## Executive Summary
High-level overview of the technical analysis findings.

**Key:** `[key-name]`  
**Analysis Date:** YYYY-MM-DD  
**Analyzed By:** [Agent/Person]  
**Scope:** [What was analyzed]

---

## Current State Analysis

### Architecture Overview
Description of current architecture relevant to this key.

```
[ASCII diagram or description of current architecture]
```

### Component Inventory
| Component | Type | Responsibility | Status |
|-----------|------|---------------|--------|
| ComponentA | Service | Does X | Active |
| ComponentB | Controller | Does Y | Active |
| ComponentC | Model | Represents Z | Active |

### Data Flow Analysis
```
User Action → Component A → Component B → Database
           ↓
        SignalR Hub → Connected Clients
```

### Dependencies
- **Direct Dependencies:**
  - Package/Library 1 (v1.2.3)
  - Package/Library 2 (v4.5.6)

- **Indirect Dependencies:**
  - Transitive dependency analysis

---

## Gap Analysis

### Functional Gaps
1. **Gap 1:** [Description]
   - Impact: High/Medium/Low
   - Recommendation: [What should be done]

2. **Gap 2:** [Description]
   - Impact: High/Medium/Low
   - Recommendation: [What should be done]

### Technical Debt
1. **Debt Item 1:** [Description]
   - Location: `path/to/file.cs:123`
   - Effort: [Story points or time estimate]
   - Priority: High/Medium/Low

### Performance Issues
1. **Issue 1:** [Description]
   - Current Performance: [Metrics]
   - Target Performance: [Goals]
   - Optimization Strategy: [Approach]

### Security Concerns
1. **Concern 1:** [Description]
   - Severity: Critical/High/Medium/Low
   - Mitigation: [Strategy]

---

## Code Quality Analysis

### Complexity Metrics
- **Cyclomatic Complexity:** Average X, Max Y
- **Lines of Code:** XXXX total, XXX per file average
- **Code Coverage:** XX%

### Design Patterns Identified
1. **Pattern 1:** [Name]
   - Location: `path/to/implementation`
   - Effectiveness: Good/Needs Improvement
   - Recommendation: [If any]

### Anti-Patterns Detected
1. **Anti-Pattern 1:** [Name]
   - Location: `path/to/problem`
   - Impact: [Description]
   - Refactoring Strategy: [Approach]

---

## Database Analysis

### Schema Review
- **Tables Affected:** TableA, TableB, TableC
- **Indexes:** Current state and recommendations
- **Constraints:** Foreign keys, unique constraints, checks

### Query Performance
```sql
-- Example problematic query
SELECT * FROM LargeTable WHERE UnindexedColumn = @value
```
- **Issue:** Full table scan
- **Recommendation:** Add index on UnindexedColumn

### Migration Strategy
1. Step 1: [Description]
2. Step 2: [Description]
3. Step 3: [Description]

---

## API Contract Analysis

### Endpoints Affected
| Endpoint | Method | Current Contract | Proposed Changes |
|----------|--------|------------------|------------------|
| /api/resource | GET | `ResourceDto` | Add `NewProperty` |
| /api/resource | POST | `CreateRequest` | No changes |

### Breaking Changes
- [ ] None identified
- [ ] Breaking change 1: [Description]
- [ ] Breaking change 2: [Description]

### Versioning Strategy
- Current Version: v1
- Proposed Version: v1 (backward compatible) / v2 (breaking changes)

---

## Testing Analysis

### Current Test Coverage
- **Unit Tests:** XX% coverage
- **Integration Tests:** XX% coverage
- **E2E Tests:** XX scenarios covered

### Test Gaps Identified
1. **Gap 1:** No tests for [scenario]
   - Recommendation: Add [type] tests
   - Priority: High/Medium/Low

### Testing Recommendations
1. Add unit tests for new business logic
2. Add integration tests for API endpoints
3. Add Playwright tests for UI workflows

---

## Performance Analysis

### Current Metrics
- **Response Time:** Average XXms, P95 XXms, P99 XXms
- **Throughput:** XX requests/second
- **Resource Usage:** XX% CPU, XX% Memory

### Bottlenecks Identified
1. **Bottleneck 1:** [Description]
   - Location: `path/to/code:line`
   - Impact: [Quantified impact]
   - Optimization: [Strategy]

### Performance Recommendations
1. Implement caching for [scenario]
2. Optimize database queries with [approach]
3. Add pagination for [endpoint]

---

## Security Analysis

### Vulnerability Assessment
- [ ] No vulnerabilities found
- [ ] Vulnerability 1: [Description] - Severity: [Level]
- [ ] Vulnerability 2: [Description] - Severity: [Level]

### Authentication & Authorization
- Current Mechanism: [Description]
- Gaps: [If any]
- Recommendations: [Improvements]

### Data Protection
- Sensitive Data: [List]
- Current Protection: [Measures]
- Recommendations: [Enhancements]

---

## Recommendations

### Critical (Must Do)
1. **Recommendation 1:** [Description]
   - Justification: [Why it's critical]
   - Implementation: [How to do it]
   - Timeline: [When to do it]

### Important (Should Do)
1. **Recommendation 2:** [Description]
   - Justification: [Why it's important]
   - Implementation: [How to do it]
   - Timeline: [When to do it]

### Nice to Have (Could Do)
1. **Recommendation 3:** [Description]
   - Justification: [Benefits]
   - Implementation: [How to do it]
   - Timeline: [When to do it]

---

## Impact Assessment

### User Impact
- **Positive:** [Benefits to users]
- **Negative:** [Potential disruptions]
- **Mitigation:** [How to minimize negative impact]

### System Impact
- **Performance:** [Expected changes]
- **Scalability:** [Impact on scaling]
- **Maintainability:** [Impact on maintenance]

### Business Impact
- **Cost:** [Financial implications]
- **Timeline:** [Schedule impact]
- **Risk:** [Business risks]

---

## Alternative Solutions Considered

### Alternative 1: [Name]
- **Pros:** [Advantages]
- **Cons:** [Disadvantages]
- **Why Not Chosen:** [Reason]

### Alternative 2: [Name]
- **Pros:** [Advantages]
- **Cons:** [Disadvantages]
- **Why Not Chosen:** [Reason]

---

## Conclusion
Summary of analysis findings and recommended path forward.

---

## Appendices

### Appendix A: Code Samples
```csharp
// Example code relevant to analysis
public class Example
{
    // Implementation
}
```

### Appendix B: Database Schema
```sql
CREATE TABLE Example (
    Id INT PRIMARY KEY,
    Name NVARCHAR(100)
);
```

### Appendix C: References
- [External Documentation](url)
- [Related Analysis](path/to/doc)
- [Industry Best Practices](url)

---

**Analysis Completed:** YYYY-MM-DD  
**Review Status:** [Draft | Under Review | Approved]  
**Next Review Date:** YYYY-MM-DD
