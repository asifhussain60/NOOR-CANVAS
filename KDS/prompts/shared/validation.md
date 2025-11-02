# KDS Shared Module: Validation

**Purpose:** Reusable validation helpers for session state, file existence, rule compliance, and error handling.

**Version:** 4.5  
**Loaded By:** All internal agents

---

## 🎯 Core Responsibility

Provide **standardized validation** across all KDS agents.

---

## 📚 Validation Helpers

### 1. Session State Validation

#### Valid Session Check
```typescript
function validateSession(sessionState: any): ValidationResult {
    const errors: string[] = [];
    
    // Required fields
    if (!sessionState.session_id) {
        errors.push("Missing session_id");
    }
    
    if (!sessionState.phases || !Array.isArray(sessionState.phases)) {
        errors.push("Missing or invalid phases array");
    }
    
    if (!sessionState.current_phase) {
        errors.push("Missing current_phase");
    }
    
    if (!sessionState.current_task) {
        errors.push("Missing current_task");
    }
    
    // Validate phase structure
    sessionState.phases?.forEach((phase, index) => {
        if (!phase.phase_number) {
            errors.push(`Phase ${index} missing phase_number`);
        }
        
        if (!phase.tasks || !Array.isArray(phase.tasks)) {
            errors.push(`Phase ${index} missing tasks array`);
        }
        
        phase.tasks?.forEach((task, taskIndex) => {
            if (!task.task_id) {
                errors.push(`Phase ${index}, Task ${taskIndex} missing task_id`);
            }
            
            if (!task.status || !['not_started', 'in_progress', 'completed'].includes(task.status)) {
                errors.push(`Phase ${index}, Task ${taskIndex} has invalid status: ${task.status}`);
            }
        });
    });
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}
```

#### Current Task Exists Check
```typescript
function validateCurrentTask(sessionState: any): ValidationResult {
    const { current_phase, current_task, phases } = sessionState;
    
    // Find phase
    const phase = phases.find(p => p.phase_number === current_phase);
    if (!phase) {
        return {
            valid: false,
            errors: [`Phase ${current_phase} not found`]
        };
    }
    
    // Find task
    const task = phase.tasks.find(t => t.task_id === current_task);
    if (!task) {
        return {
            valid: false,
            errors: [`Task ${current_task} not found in Phase ${current_phase}`]
        };
    }
    
    return { valid: true, errors: [] };
}
```

#### Auto-Repair Session
```typescript
function repairSession(sessionState: any): any {
    // Find last completed task
    let lastCompletedTask = null;
    
    for (const phase of sessionState.phases) {
        for (const task of phase.tasks) {
            if (task.status === 'completed') {
                lastCompletedTask = { phase: phase.phase_number, task: task.task_id };
            }
        }
    }
    
    // Find next not_started task
    for (const phase of sessionState.phases) {
        for (const task of phase.tasks) {
            if (task.status === 'not_started') {
                sessionState.current_phase = phase.phase_number;
                sessionState.current_task = task.task_id;
                return sessionState;
            }
        }
    }
    
    // All tasks completed
    sessionState.status = 'completed';
    return sessionState;
}
```

---

### 2. File Existence Validation

#### File Exists Check
```typescript
function validateFileExists(filePath: string): ValidationResult {
    // Use read_file tool to check existence
    try {
        // Attempt to read file
        const content = await readFile(filePath);
        return { valid: true, errors: [] };
    } catch (error) {
        return {
            valid: false,
            errors: [`File not found: ${filePath}`]
        };
    }
}
```

#### Multiple Files Check
```typescript
function validateFilesExist(filePaths: string[]): ValidationResult {
    const missing: string[] = [];
    
    for (const filePath of filePaths) {
        const result = validateFileExists(filePath);
        if (!result.valid) {
            missing.push(filePath);
        }
    }
    
    return {
        valid: missing.length === 0,
        errors: missing.map(f => `Missing file: ${f}`)
    };
}
```

---

### 3. Rule Compliance Validation

#### Rule #15 Validation (Hybrid UI Identifiers)
```typescript
function validateRule15(filePath: string, content: string): ValidationResult {
    const errors: string[] = [];
    
    // Check if file is .razor
    if (!filePath.endsWith('.razor')) {
        return { valid: true, errors: [] }; // Not applicable
    }
    
    // Check for JavaScript manipulation
    const hasJavaScript = /getElementById|querySelector|\.focus\(\)|\.innerHTML/.test(content);
    
    if (hasJavaScript) {
        // DUAL identifiers required
        const buttons = content.match(/<button[^>]*>/g) || [];
        
        for (const button of buttons) {
            const hasId = /id="[^"]*"/.test(button);
            const hasTestId = /data-testid="[^"]*"/.test(button);
            
            if (!hasId || !hasTestId) {
                errors.push(`Button missing DUAL identifiers (id + data-testid): ${button.substring(0, 50)}...`);
            }
        }
    } else {
        // SINGLE identifier (data-testid) required
        const buttons = content.match(/<button[^>]*>/g) || [];
        
        for (const button of buttons) {
            const hasTestId = /data-testid="[^"]*"/.test(button);
            
            if (!hasTestId) {
                errors.push(`Button missing data-testid: ${button.substring(0, 50)}...`);
            }
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}
```

#### Rule #8 Validation (Test-First)
```typescript
function validateRule8(taskDescription: string, testFile: string): ValidationResult {
    // Check if test file exists
    const testExists = validateFileExists(testFile);
    
    if (!testExists.valid) {
        return {
            valid: false,
            errors: [`Test-First violation: Test file not found: ${testFile}`]
        };
    }
    
    // TODO: Check if test was created before implementation
    // (requires git history analysis)
    
    return { valid: true, errors: [] };
}
```

---

### 4. Error Handling

#### Standard Error Format
```typescript
interface KDSError {
    code: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    recovery?: string;
}

function createError(code: string, message: string, severity: 'error' | 'warning' | 'info' = 'error', recovery?: string): KDSError {
    return { code, message, severity, recovery };
}
```

#### Common Errors
```typescript
const KDS_ERRORS = {
    SESSION_NOT_FOUND: createError(
        'SESSION_001',
        'No active session found',
        'error',
        'Create a new session: #file:KDS/prompts/user/plan.md'
    ),
    
    SESSION_CORRUPT: createError(
        'SESSION_002',
        'Session state is corrupted',
        'error',
        'Attempt auto-repair or create new session'
    ),
    
    TASK_NOT_FOUND: createError(
        'SESSION_003',
        'Current task not found in session',
        'error',
        'Verify session state or use task override'
    ),
    
    FILE_NOT_FOUND: createError(
        'FILE_001',
        'Required file not found',
        'error',
        'Verify file path or create missing file'
    ),
    
    RULE_VIOLATION: createError(
        'RULE_001',
        'KDS rule violation detected',
        'warning',
        'Fix violation or document exception'
    ),
    
    TEST_FIRST_VIOLATION: createError(
        'RULE_008',
        'Test-First principle violated',
        'error',
        'Create test before implementation'
    ),
    
    BUILD_FAILED: createError(
        'BUILD_001',
        'Build failed',
        'error',
        'Fix build errors and retry'
    ),
    
    TESTS_FAILED: createError(
        'TEST_001',
        'One or more tests failed',
        'error',
        'Fix failing tests or use #file:KDS/prompts/user/correct.md'
    )
};
```

---

### 5. Type Validation

#### Task Status
```typescript
const VALID_TASK_STATUSES = ['not_started', 'in_progress', 'completed'];

function validateTaskStatus(status: string): ValidationResult {
    if (!VALID_TASK_STATUSES.includes(status)) {
        return {
            valid: false,
            errors: [`Invalid task status: ${status}. Must be one of: ${VALID_TASK_STATUSES.join(', ')}`]
        };
    }
    return { valid: true, errors: [] };
}
```

#### Health Status
```typescript
const VALID_HEALTH_STATUSES = ['HEALTHY', 'DEGRADED', 'CRITICAL'];

function validateHealthStatus(status: string): ValidationResult {
    if (!VALID_HEALTH_STATUSES.includes(status)) {
        return {
            valid: false,
            errors: [`Invalid health status: ${status}. Must be one of: ${VALID_HEALTH_STATUSES.join(', ')}`]
        };
    }
    return { valid: true, errors: [] };
}
```

---

### 6. Path Validation

#### Workspace Path
```typescript
function validateWorkspacePath(path: string): ValidationResult {
    // Ensure path starts with workspace root
    const workspaceRoot = 'd:\\PROJECTS\\NOOR CANVAS';
    
    if (!path.startsWith(workspaceRoot)) {
        return {
            valid: false,
            errors: [`Path must be within workspace: ${path}`]
        };
    }
    
    return { valid: true, errors: [] };
}
```

#### KDS Path
```typescript
function validateKDSPath(path: string): ValidationResult {
    // Ensure path is within KDS/ directory
    if (!path.includes('\\KDS\\')) {
        return {
            valid: false,
            errors: [`Path must be within KDS/ directory: ${path}`]
        };
    }
    
    return { valid: true, errors: [] };
}
```

---

## 🧪 Usage Examples

### Example 1: Validate Session Before Execution
```typescript
// In code-executor.md
const sessionState = await loadSession();

const validation = validateSession(sessionState);
if (!validation.valid) {
    return {
        error: KDS_ERRORS.SESSION_CORRUPT,
        details: validation.errors
    };
}

const taskValidation = validateCurrentTask(sessionState);
if (!taskValidation.valid) {
    // Attempt auto-repair
    const repaired = repairSession(sessionState);
    await saveSession(repaired);
}
```

### Example 2: Validate Rule Compliance
```typescript
// In code-executor.md after creating file
const fileContent = await readFile(filePath);

const rule15Validation = validateRule15(filePath, fileContent);
if (!rule15Validation.valid) {
    return {
        error: KDS_ERRORS.RULE_VIOLATION,
        rule: 'Rule #15 (Hybrid UI Identifiers)',
        violations: rule15Validation.errors
    };
}
```

### Example 3: Validate Files Before Task
```typescript
// In code-executor.md before starting task
const task = getCurrentTask(sessionState);

const fileValidation = validateFilesExist(task.files);
if (!fileValidation.valid) {
    // Files don't exist yet - this is expected for new files
    // Proceed with creation
}
```

---

## 🎯 Standard Validation Result

### Interface
```typescript
interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[];
    info?: string[];
}
```

### Usage
```typescript
const result = validateSession(sessionState);

if (result.valid) {
    // Proceed
} else {
    // Handle errors
    console.error('Validation failed:', result.errors);
}
```

---

## 📋 Validation Checklist Template

```markdown
### Pre-Execution Validation
- [ ] Session exists
- [ ] Session structure valid
- [ ] Current task exists
- [ ] Required files accessible
- [ ] Applicable rules identified

### Post-Execution Validation
- [ ] Task status updated
- [ ] Files created/modified
- [ ] Tests passing
- [ ] Rule compliance verified
- [ ] Session state saved
```

---

**Validation module ensures consistency across KDS!** ✅
