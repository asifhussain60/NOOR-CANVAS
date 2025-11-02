# MANDATORY POST-TASK EXECUTION WORKFLOW

## CRITICAL: AUTO-EXECUTION REQUIRED

**This workflow runs AUTOMATICALLY after EVERY task completion.**  
**NO user reminders needed. NO exceptions (unless skip_post_task=true in handoff).**  
**Governed by Rule #16.**

---

## Purpose

Enforce KDS quality, consistency, and institutional knowledge building through mandatory automated steps:
1. ✅ Build validation (zero errors)
2. 📚 Pattern publishing (auto-publish successful work)
3. 🗑️ Cleanup (delete clutter, trust git)
4. 📂 Reorganization (enforce folder structure)
5. 🔍 KDS verification (redundancy, conflicts, performance, consistency)
6. 📝 Living docs update (KDS-DESIGN.md, governance/rules.md)

---

## Invoked By

- `prompts/internal/code-executor.md` - After code implementation
- `prompts/internal/test-generator.md` - After test passes
- `prompts/internal/work-planner.md` - After plan generation (lighter validation)

---

## Input Handoff

```json
{
  "type": "post-task-execution",
  "task_result": {
    "task_id": "phase-1-task-2",
    "feature": "user-dashboard",
    "component": "DashboardComponent",
    "test_passed": true,
    "test_attempts": 3,
    "ui_changes": true,
    "changed_files": [
      "SPA/NoorCanvas/Components/Dashboard.razor",
      "Tests/UI/dashboard-test.spec.ts"
    ],
    "test_data_validated": false,
    "workflow_completed": false
  },
  "skip_post_task": false
}
```

---

## Execution Sequence (6 Mandatory Steps)

### STEP 1: Build Validation ⚠️ HALT ON FAILURE

```python
def step_1_build_validation(config):
    """
    Rule #11: Zero Build Errors
    If build fails, HALT immediately - do NOT proceed to other steps.
    """
    build_cmd = config['application']['buildCommand']
    
    result = run_command(build_cmd)
    
    if result.exit_code != 0:
        return {
            'status': 'HALT',
            'step': 'build_validation',
            'error': 'Build failed with errors',
            'errors': result.stderr,
            'next_handoff': 'fix-build.json',
            'message': '❌ Build Failed - Task NOT Complete'
        }
    
    return {
        'status': 'PASS',
        'message': '✅ Build: PASSED (0 errors)'
    }
```

---

### STEP 2: Pattern Publishing (Auto-Publish)

```python
def step_2_pattern_publishing(task_result):
    """
    Rule #14: Publishing Mechanism
    Auto-identify and publish successful patterns WITHOUT user reminder.
    """
    published = []
    
    # Test Pattern (test passed after 2+ attempts)
    if task_result['test_passed'] and task_result['test_attempts'] >= 2:
        pattern = {
            'category': 'test-patterns',
            'name': f"{task_result['feature']}-test-pattern",
            'context': f"Testing {task_result['feature']} functionality",
            'implementation': extract_test_code(task_result['changed_files']),
            'whatWorked': extract_successful_approaches(task_result),
            'whatDidntWork': extract_failed_attempts(task_result),
            'successRate': f"{task_result['test_attempts']}/{task_result['test_attempts']} attempts"
        }
        
        if not is_duplicate_pattern(pattern):
            publish_result = invoke_publish_workflow(pattern)
            published.append(publish_result['file'])
    
    # UI Mapping (new data-testid attributes)
    if task_result['ui_changes']:
        testids = extract_testids_from_files(task_result['changed_files'])
        
        if testids:
            pattern = {
                'category': 'ui-mappings',
                'name': f"{task_result['component']}-testids",
                'context': f"UI elements for {task_result['component']}",
                'implementation': generate_testid_table(testids),
                'whatWorked': ['data-testid attributes added per Rule #15'],
                'whatDidntWork': []
            }
            
            if not is_duplicate_pattern(pattern):
                publish_result = invoke_publish_workflow(pattern)
                published.append(publish_result['file'])
    
    # Test Data (validated data used in tests)
    if task_result.get('test_data_validated'):
        pattern = {
            'category': 'test-data',
            'name': task_result['test_data_name'],
            'context': f"Validated test data for {task_result['feature']}",
            'implementation': extract_test_data(task_result),
            'whatWorked': ['Data validated across multiple scenarios'],
            'whatDidntWork': []
        }
        
        if not is_duplicate_pattern(pattern):
            publish_result = invoke_publish_workflow(pattern)
            published.append(publish_result['file'])
    
    # Workflow Pattern (end-to-end flow completed)
    if task_result.get('workflow_completed'):
        pattern = {
            'category': 'workflows',
            'name': f"{task_result['workflow_name']}-flow",
            'context': f"End-to-end workflow for {task_result['workflow_name']}",
            'implementation': extract_workflow_steps(task_result),
            'whatWorked': extract_workflow_successes(task_result),
            'whatDidntWork': []
        }
        
        if not is_duplicate_pattern(pattern):
            publish_result = invoke_publish_workflow(pattern)
            published.append(publish_result['file'])
    
    return {
        'status': 'COMPLETE',
        'published_count': len(published),
        'published_files': published,
        'message': f"✅ Publishing: {len(published)} patterns published" if published else "ℹ️ Publishing: No new patterns to publish"
    }
```

---

### STEP 3: Cleanup (Delete Clutter)

```python
def step_3_cleanup():
    """
    Rule #3: Delete Over Archive
    Remove forbidden patterns, empty dirs, trust git for history.
    """
    deleted = []
    
    # Find forbidden patterns
    forbidden_patterns = [
        'KDS/archive/**',
        'KDS/deprecated/**',
        'KDS/**/*.old',
        'KDS/**/*.backup',
        'KDS/**/*_v1.*',
        'KDS/**/*_v2.*'
    ]
    
    for pattern in forbidden_patterns:
        files = glob(pattern)
        for file in files:
            try:
                git_rm(file)
                deleted.append(file)
            except Exception as e:
                log_warning(f"Could not delete {file}: {e}")
    
    # Remove empty directories
    empty_dirs = find_empty_directories('KDS/')
    for dir in empty_dirs:
        if dir not in ['KDS/keys', 'KDS/knowledge']:  # Keep structure
            try:
                rmdir(dir)
                deleted.append(f"{dir}/ (empty)")
            except Exception as e:
                log_warning(f"Could not remove {dir}: {e}")
    
    return {
        'status': 'COMPLETE',
        'deleted_count': len(deleted),
        'deleted_files': deleted,
        'message': f"✅ Cleanup: {len(deleted)} items deleted (archived in git)" if deleted else "ℹ️ Cleanup: No clutter found"
    }
```

---

### STEP 4: Reorganization (Enforce Structure)

```python
def step_4_reorganization():
    """
    Rule #13: Documentation Organization
    Move misplaced files to correct locations, update references.
    """
    moved = []
    
    # Find misplaced .md files in KDS root
    root_md_files = glob('KDS/*.md')
    allowed = ['KDS/README.md', 'KDS/KDS-DESIGN.md']
    
    for file in root_md_files:
        if file not in allowed:
            # Determine correct location
            new_location = determine_doc_location(file)
            
            # Move file
            move_file(file, new_location)
            
            # Update all references
            update_references(file, new_location)
            
            moved.append({
                'from': file,
                'to': new_location
            })
    
    # Verify prompts/ structure
    verify_prompt_structure()
    
    # Verify knowledge/ structure
    verify_knowledge_structure()
    
    return {
        'status': 'COMPLETE',
        'moved_count': len(moved),
        'moved_files': moved,
        'message': f"✅ Reorganization: {len(moved)} files moved" if moved else "ℹ️ Reorganization: All files in correct locations"
    }

def determine_doc_location(file):
    """Auto-categorize documentation files"""
    content = read_file(file)
    filename = os.path.basename(file).lower()
    
    # Architecture docs
    if any(kw in filename for kw in ['design', 'architecture', 'pattern']):
        return f"KDS/docs/architecture/{os.path.basename(file)}"
    
    # Database docs
    if any(kw in filename for kw in ['database', 'schema', 'migration', 'sql']):
        return f"KDS/docs/database/{os.path.basename(file)}"
    
    # Testing docs
    if any(kw in filename for kw in ['test', 'playwright', 'spec']):
        return f"KDS/docs/testing/{os.path.basename(file)}"
    
    # API docs
    if any(kw in filename for kw in ['api', 'endpoint', 'contract']):
        return f"KDS/docs/api/{os.path.basename(file)}"
    
    # Default: guides
    return f"KDS/docs/guides/{os.path.basename(file)}"
```

---

### STEP 5: KDS Verification (Critical Quality Checks)

```python
def step_5_kds_verification():
    """
    Rule #16: Comprehensive KDS health check
    Detect redundancy, conflicts, performance issues, consistency violations.
    """
    results = {}
    critical_failures = []
    
    # 5.1: Redundancy Check
    redundancy = check_redundancy()
    results['redundancy'] = redundancy
    
    if redundancy['duplicate_count'] > 0:
        # Auto-fix: extract to shared/
        for dup in redundancy['duplicates']:
            extract_to_shared(dup['duplicate_lines'], dup['file1'], dup['file2'])
        results['redundancy']['status'] = 'AUTO_FIXED'
    
    # 5.2: Conflict Check
    conflicts = check_conflicts()
    results['conflicts'] = conflicts
    
    if conflicts['status'] == 'CONFLICT_FOUND':
        critical_failures.append({
            'type': 'CONFLICTS',
            'details': conflicts['issues']
        })
    
    # 5.3: Performance Check
    performance = check_performance()
    results['performance'] = performance
    
    if performance['status'] == 'EXCEEDED_LIMITS':
        critical_failures.append({
            'type': 'PERFORMANCE',
            'details': f"Rule count: {performance['rule_count']}/{performance['rule_limit']}"
        })
    
    # 5.4: Consistency Check
    consistency = check_consistency()
    results['consistency'] = consistency
    
    # If critical failures, HALT
    if critical_failures:
        return {
            'status': 'HALT',
            'critical_failures': critical_failures,
            'message': '❌ KDS Verification FAILED - Critical issues detected'
        }
    
    return {
        'status': 'PASS',
        'results': results,
        'message': '✅ KDS Verification: PASSED (0 issues)'
    }

def check_redundancy():
    """Detect duplicate logic across prompts"""
    # Implementation from Algorithm 6 in governance/rules.md
    pass

def check_conflicts():
    """Detect rule conflicts"""
    # Implementation from Algorithm 6 in governance/rules.md
    pass

def check_performance():
    """Monitor KDS metrics (ENHANCED with knowledge health)"""
    rule_count = count_rules_in_governance()
    prompt_count = len(glob('KDS/prompts/**/*.md'))
    file_count = len(glob('KDS/**/*'))
    
    # Knowledge base health
    knowledge_health = check_knowledge_health()
    
    # Determine status
    status = 'WITHIN_LIMITS'
    issues = []
    
    # Rule count limits
    if rule_count > 20:
        status = 'EXCEEDED_LIMITS'
        issues.append(f'Rules: {rule_count}/20 (EXCEEDED)')
    elif rule_count > 18:
        status = 'APPROACHING_LIMITS'
        issues.append(f'Rules: {rule_count}/20 (approaching limit)')
    
    # Prompt count limits
    if prompt_count > 15:
        status = 'EXCEEDED_LIMITS'
        issues.append(f'Prompts: {prompt_count}/15 (EXCEEDED)')
    elif prompt_count > 13:
        status = 'APPROACHING_LIMITS' if status != 'EXCEEDED_LIMITS' else status
        issues.append(f'Prompts: {prompt_count}/15 (approaching limit)')
    
    # File count limits
    if file_count > 80:
        status = 'EXCEEDED_LIMITS'
        issues.append(f'Files: {file_count}/80 (EXCEEDED)')
    elif file_count > 70:
        status = 'APPROACHING_LIMITS' if status != 'EXCEEDED_LIMITS' else status
        issues.append(f'Files: {file_count}/80 (approaching limit)')
    
    # Knowledge base capacity limits
    if knowledge_health['any_at_capacity']:
        status = 'EXCEEDED_LIMITS'
        issues.extend(knowledge_health['capacity_issues'])
    
    return {
        'rule_count': rule_count,
        'rule_limit': 20,
        'rule_soft_limit': 15,
        'prompt_count': prompt_count,
        'prompt_limit': 15,
        'prompt_soft_limit': 13,
        'file_count': file_count,
        'file_limit': 80,
        'file_soft_limit': 70,
        'knowledge_health': knowledge_health,
        'status': status,
        'issues': issues
    }

def check_knowledge_health():
    """NEW: Monitor knowledge/ folder health"""
    categories = ['test-patterns', 'test-data', 'ui-mappings', 'workflows']
    health = {
        'categories': {},
        'any_at_capacity': False,
        'any_approaching_capacity': False,
        'capacity_issues': [],
        'unused_patterns': [],
        'duplicate_candidates': []
    }
    
    for category in categories:
        pattern_count = count_patterns_in_category(category)
        unused = find_unused_patterns(category, days=90)
        duplicates = find_duplicate_candidates(category, threshold=0.60)
        
        category_health = {
            'count': pattern_count,
            'capacity': f'{pattern_count}/10',
            'status': 'OK'
        }
        
        if pattern_count >= 10:
            category_health['status'] = 'AT_CAPACITY'
            health['any_at_capacity'] = True
            health['capacity_issues'].append(
                f'{category}: {pattern_count}/10 (AT CAPACITY - consolidation REQUIRED)'
            )
        elif pattern_count >= 8:
            category_health['status'] = 'APPROACHING_CAPACITY'
            health['any_approaching_capacity'] = True
            health['capacity_issues'].append(
                f'{category}: {pattern_count}/10 (consolidation recommended)'
            )
        
        health['categories'][category] = category_health
        health['unused_patterns'].extend(unused)
        health['duplicate_candidates'].extend(duplicates)
    
    return health

def check_consistency():
    """Validate naming, structure, validation presence"""
    issues = []
    
    # Check internal agents have validation: sections
    internal_agents = glob('KDS/prompts/internal/*.md')
    for agent in internal_agents:
        if 'validation:' not in read_file(agent):
            issues.append(f"Missing validation: {agent}")
    
    # Check user prompts exclude technical details
    user_prompts = glob('KDS/prompts/user/*.md')
    for prompt in user_prompts:
        if has_technical_details(prompt):
            issues.append(f"Technical details in user prompt: {prompt}")
    
    return {
        'issue_count': len(issues),
        'issues': issues,
        'status': 'VIOLATIONS_FOUND' if issues else 'CONSISTENT'
    }
```

---

### STEP 6: Living Docs Update

```python
def step_6_living_docs_update(task_result):
    """
    Rule #2: Live Design Document
    Rule #7: Document First
    Auto-update KDS-DESIGN.md and governance/rules.md
    """
    updates = []
    
    # Update KDS-DESIGN.md change history
    add_change_to_history(
        file='KDS/KDS-DESIGN.md',
        change=f"Task: {task_result['task_id']} - {task_result['feature']}",
        date='2025-11-02'
    )
    updates.append('KDS-DESIGN.md updated (change history)')
    
    # Update metrics if structure changed
    if task_result.get('structure_changed'):
        update_metrics('KDS/KDS-DESIGN.md')
        updates.append('KDS-DESIGN.md updated (metrics)')
    
    # Increment version if rules modified
    if task_result.get('rules_modified'):
        increment_version('KDS/KDS-DESIGN.md')
        increment_version('KDS/governance/rules.md')
        updates.append('Version incremented (v4.2.0 → v4.3.0)')
    
    # Update timestamp
    update_timestamp('KDS/KDS-DESIGN.md')
    update_timestamp('KDS/governance/rules.md')
    
    return {
        'status': 'COMPLETE',
        'updates': updates,
        'message': f"✅ Living Docs: Updated ({len(updates)} changes)"
    }
```

---

## Output Summary

```
✅ TASK COMPLETE

📊 Mandatory Post-Task Execution Summary:

✅ Step 1: Build Validation
   Status: PASSED
   Details: 0 errors, 0 warnings

✅ Step 2: Pattern Publishing
   Status: COMPLETE
   Published: 2 patterns
   - knowledge/test-patterns/user-dashboard-test-pattern.md
   - knowledge/ui-mappings/DashboardComponent-testids.md

✅ Step 3: Cleanup
   Status: COMPLETE
   Deleted: 3 items (archived in git)
   - KDS/old-file.md.old
   - KDS/archive/ (folder removed)
   - KDS/temp-backup.md.backup

✅ Step 4: Reorganization
   Status: COMPLETE
   Moved: 1 file
   - dashboard-guide.md → docs/guides/dashboard-guide.md

✅ Step 5: KDS Verification
   Status: PASSED
   - Redundancy: 0 duplicates
   - Conflicts: 0 issues
   - Performance: 16 rules, 13 prompts, 65 files (within limits)
   - Consistency: 100% compliant

✅ Step 6: Living Docs
   Status: UPDATED
   Changes: KDS-DESIGN.md updated (change history, timestamp)

═══════════════════════════════════════════════════════════

**Next Command:**
@workspace /execute #file:KDS/keys/user-dashboard/handoffs/phase-1-task-3.json

**Time Elapsed:** 2.3 seconds
**All Rules Enforced:** ✅ (16/16 rules compliant)
```

---

## Error Handling

### Build Failure (HALT)
```
❌ TASK NOT COMPLETE

Step 1: Build Validation - FAILED

Build Errors (3):
1. Error CS0103: The name 'model' does not exist
   File: Dashboard.razor, Line 42
2. Error CS1002: ; expected
   File: Dashboard.razor.cs, Line 89
3. Error CS0246: Type 'UserService' could not be found
   File: Dashboard.razor.cs, Line 12

🛑 HALTED - Fix build errors before continuing

**Next Command:**
@workspace /execute #file:KDS/keys/user-dashboard/handoffs/fix-build.json
```

### KDS Verification Failure (HALT)
```
❌ TASK NOT COMPLETE

Step 5: KDS Verification - FAILED

Critical Issues:
1. CONFLICT: Rule count mismatch
   - KDS-DESIGN.md: 16 rules
   - governance/rules.md: 15 rules
   
2. PERFORMANCE: Exceeded limits
   - Prompt count: 16/15 (EXCEEDED)
   - Consolidation recommended

🛑 HALTED - Governance review required (Rule #6)

**Next Command:**
@workspace /govern key=user-dashboard
```

---

## Skip Conditions

```json
{
  "skip_post_task": true,
  "skip_reason": "Governance review task (avoid circular validation)"
}
```

Allowed skip reasons:
- "Governance review task"
- "KDS design update"
- "Documentation-only change"

---

**Last Updated:** 2025-11-02  
**Version:** 1.0  
**Governed By:** Rule #16 (Mandatory Post-Task Execution)  
**Automation Level:** FULL_AUTO (no user intervention required)
