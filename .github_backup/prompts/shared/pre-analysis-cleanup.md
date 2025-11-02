# Pre-Analysis Cleanup Protocol

## When to Use
Before running analyze-learning agent to ensure optimal pattern analysis.

## Workflow

### 1. Run Cleanup Prompt
```
@workspace /cleanup target=key-streams consolidate-keys=true
```

### 2. Benefits of Pre-Analysis Cleanup
- **Reduced key count**: Consolidate related keys for clearer pattern analysis
- **Better signal-to-noise**: Remove stale/obsolete keys from analysis
- **Complete history**: Consolidated keys preserve all git commits and work logs
- **Accurate metrics**: Base metrics on active keys, not archived ones

### 3. Skip Cleanup If
- Analysis is post-mortem on specific key (`scope=key=X`)
- Recent cleanup performed (<7 days ago)
- User explicitly requests skip

## Integration
Referenced by: analyze-learning.prompt.md (Step 0)
