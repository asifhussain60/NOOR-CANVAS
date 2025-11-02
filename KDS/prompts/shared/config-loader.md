# KDS Shared Module: Config Loader

**Purpose:** Load and validate KDS configuration, session state, and runtime settings.

**Version:** 4.5  
**Loaded By:** All internal agents

---

## 🎯 Core Responsibility

Provide **centralized configuration** access for all KDS components.

---

## 📋 Configuration Sources

### 1. KDS Design Document
```markdown
File: KDS/KDS-DESIGN.md

Contains:
  - Design philosophy
  - Architecture decisions
  - Version history
  - System status

Usage:
  #file:KDS/KDS-DESIGN.md
```

### 2. KDS Rules
```markdown
File: KDS/governance/rules.md

Contains:
  - Machine-readable rules
  - Validation criteria
  - Enforcement mechanisms
  - Rule numbering

Usage:
  #file:KDS/governance/rules.md
```

### 3. Session State
```markdown
File: KDS/sessions/current-session.json

Contains:
  - Active session details
  - Current phase/task
  - Task statuses
  - Session metadata

Usage:
  Load: loadSession()
  Save: saveSession(state)
```

### 4. Project Configuration
```markdown
File: config/sharedsettings.json

Contains:
  - Application settings
  - Feature flags
  - Environment config
  - Third-party integrations

Usage:
  #file:config/sharedsettings.json
```

---

## 🔧 Configuration Loaders

### Load KDS Design
```typescript
interface KDSDesign {
    version: string;
    status: string;
    philosophy: string[];
    decisions: Decision[];
}

async function loadKDSDesign(): Promise<KDSDesign> {
    const content = await readFile('KDS/KDS-DESIGN.md');
    
    // Parse version
    const versionMatch = content.match(/Version:\s*([0-9.]+)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';
    
    // Parse status
    const statusMatch = content.match(/Status:\s*([A-Z]+)/);
    const status = statusMatch ? statusMatch[1] : 'unknown';
    
    // Parse philosophy (look for bullet points under Philosophy section)
    const philosophySection = content.match(/## Philosophy\n([\s\S]*?)\n##/);
    const philosophy = philosophySection 
        ? philosophySection[1].split('\n').filter(line => line.trim().startsWith('-'))
        : [];
    
    return {
        version,
        status,
        philosophy,
        decisions: [] // Parse design decisions if needed
    };
}
```

### Load KDS Rules
```typescript
interface KDSRule {
    number: number;
    title: string;
    description: string;
    validation: string;
    enforcement: string;
}

async function loadKDSRules(): Promise<KDSRule[]> {
    const content = await readFile('KDS/governance/rules.md');
    
    // Parse rules (markdown headers with numbers)
    const rules: KDSRule[] = [];
    const ruleMatches = content.matchAll(/### Rule #(\d+):\s*([^\n]+)\n\n([^#]+)/g);
    
    for (const match of ruleMatches) {
        rules.push({
            number: parseInt(match[1]),
            title: match[2].trim(),
            description: match[3].trim(),
            validation: '',  // Parse from rule content if needed
            enforcement: ''
        });
    }
    
    return rules;
}
```

### Load Session State
```typescript
interface SessionState {
    session_id: string;
    status: 'planned' | 'in_progress' | 'completed';
    current_phase: number;
    current_task: string;
    phases: Phase[];
    created_at: string;
    updated_at: string;
}

async function loadSession(): Promise<SessionState | null> {
    try {
        const content = await readFile('KDS/sessions/current-session.json');
        return JSON.parse(content);
    } catch (error) {
        // No active session
        return null;
    }
}

async function saveSession(state: SessionState): Promise<void> {
    state.updated_at = new Date().toISOString();
    const content = JSON.stringify(state, null, 2);
    await writeFile('KDS/sessions/current-session.json', content);
}
```

### Load Project Config
```typescript
interface ProjectConfig {
    features: {
        [key: string]: boolean;
    };
    settings: {
        [key: string]: any;
    };
}

async function loadProjectConfig(): Promise<ProjectConfig> {
    const content = await readFile('config/sharedsettings.json');
    return JSON.parse(content);
}
```

---

## 🧠 Configuration Validation

### Validate KDS Design
```typescript
function validateKDSDesign(design: KDSDesign): ValidationResult {
    const errors: string[] = [];
    
    if (!design.version) {
        errors.push('KDS Design missing version');
    }
    
    if (!design.status || !['DRAFT', 'ACTIVE', 'DEPRECATED'].includes(design.status)) {
        errors.push('KDS Design has invalid status');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}
```

### Validate Session State
```typescript
function validateSession(session: SessionState): ValidationResult {
    const errors: string[] = [];
    
    // Required fields
    if (!session.session_id) {
        errors.push('Missing session_id');
    }
    
    if (!session.phases || !Array.isArray(session.phases)) {
        errors.push('Missing or invalid phases array');
    }
    
    // Validate current phase exists
    const currentPhase = session.phases?.find(p => p.phase_number === session.current_phase);
    if (!currentPhase) {
        errors.push(`Current phase ${session.current_phase} not found`);
    }
    
    // Validate current task exists
    const currentTask = currentPhase?.tasks.find(t => t.task_id === session.current_task);
    if (!currentTask) {
        errors.push(`Current task ${session.current_task} not found in phase ${session.current_phase}`);
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}
```

---

## 🔍 Configuration Queries

### Get Rule by Number
```typescript
async function getRuleByNumber(ruleNumber: number): Promise<KDSRule | null> {
    const rules = await loadKDSRules();
    return rules.find(r => r.number === ruleNumber) || null;
}
```

### Get Applicable Rules for File
```typescript
async function getApplicableRules(filePath: string): Promise<KDSRule[]> {
    const rules = await loadKDSRules();
    const applicableRules: KDSRule[] = [];
    
    // Rule #8: Test-First (applies to all code files)
    if (filePath.endsWith('.cs') || filePath.endsWith('.razor') || filePath.endsWith('.js')) {
        const rule8 = rules.find(r => r.number === 8);
        if (rule8) applicableRules.push(rule8);
    }
    
    // Rule #15: Hybrid UI Identifiers (applies to .razor files)
    if (filePath.endsWith('.razor')) {
        const rule15 = rules.find(r => r.number === 15);
        if (rule15) applicableRules.push(rule15);
    }
    
    // Rule #18: No External Dependencies (applies to all)
    const rule18 = rules.find(r => r.number === 18);
    if (rule18) applicableRules.push(rule18);
    
    return applicableRules;
}
```

### Get Current Task
```typescript
async function getCurrentTask(): Promise<Task | null> {
    const session = await loadSession();
    
    if (!session) {
        return null;
    }
    
    const phase = session.phases.find(p => p.phase_number === session.current_phase);
    if (!phase) {
        return null;
    }
    
    const task = phase.tasks.find(t => t.task_id === session.current_task);
    return task || null;
}
```

### Get Next Task
```typescript
async function getNextTask(): Promise<Task | null> {
    const session = await loadSession();
    
    if (!session) {
        return null;
    }
    
    // Find next not_started task
    for (const phase of session.phases) {
        for (const task of phase.tasks) {
            if (task.status === 'not_started') {
                return task;
            }
        }
    }
    
    // All tasks completed
    return null;
}
```

---

## 🎯 Feature Flag Support

### Check Feature Flag
```typescript
async function isFeatureEnabled(featureName: string): Promise<boolean> {
    const config = await loadProjectConfig();
    return config.features[featureName] === true;
}
```

### Example Usage
```typescript
// In code-executor.md
const percyEnabled = await isFeatureEnabled('PercyVisualTesting');

if (percyEnabled) {
    // Create Percy snapshot test
} else {
    // Create standard visual test
}
```

---

## 📊 Session Management

### Create New Session
```typescript
async function createSession(feature: string, createdBy: string): Promise<SessionState> {
    const sessionId = `${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${feature.toLowerCase().replace(/\s+/g, '-')}`;
    
    const session: SessionState = {
        session_id: sessionId,
        status: 'planned',
        current_phase: 1,
        current_task: '1.1',
        phases: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    await saveSession(session);
    return session;
}
```

### Update Task Status
```typescript
async function updateTaskStatus(taskId: string, status: 'not_started' | 'in_progress' | 'completed'): Promise<void> {
    const session = await loadSession();
    
    if (!session) {
        throw new Error('No active session');
    }
    
    // Find and update task
    for (const phase of session.phases) {
        for (const task of phase.tasks) {
            if (task.task_id === taskId) {
                task.status = status;
                
                if (status === 'completed') {
                    task.completed_at = new Date().toISOString();
                }
                
                await saveSession(session);
                return;
            }
        }
    }
    
    throw new Error(`Task ${taskId} not found`);
}
```

### Advance to Next Task
```typescript
async function advanceToNextTask(): Promise<void> {
    const session = await loadSession();
    
    if (!session) {
        throw new Error('No active session');
    }
    
    const nextTask = await getNextTask();
    
    if (!nextTask) {
        // All tasks completed
        session.status = 'completed';
        await saveSession(session);
        return;
    }
    
    // Update current task/phase
    session.current_task = nextTask.task_id;
    
    // Update phase if changed
    for (const phase of session.phases) {
        if (phase.tasks.some(t => t.task_id === nextTask.task_id)) {
            session.current_phase = phase.phase_number;
            break;
        }
    }
    
    await saveSession(session);
}
```

---

## 🚨 Error Handling

### Missing Configuration
```typescript
async function loadKDSDesignSafe(): Promise<KDSDesign> {
    try {
        return await loadKDSDesign();
    } catch (error) {
        console.warn('Failed to load KDS Design, using defaults');
        return {
            version: '4.5',
            status: 'ACTIVE',
            philosophy: [],
            decisions: []
        };
    }
}
```

### Corrupted Session
```typescript
async function loadSessionSafe(): Promise<SessionState | null> {
    try {
        const session = await loadSession();
        
        if (!session) {
            return null;
        }
        
        const validation = validateSession(session);
        if (!validation.valid) {
            console.error('Session validation failed:', validation.errors);
            // Attempt repair
            return repairSession(session);
        }
        
        return session;
    } catch (error) {
        console.error('Failed to load session:', error);
        return null;
    }
}
```

---

## 🔄 Configuration Cache

### Cache Configuration (Performance)
```typescript
let kdsDesignCache: KDSDesign | null = null;
let kdsRulesCache: KDSRule[] | null = null;

async function getKDSDesignCached(): Promise<KDSDesign> {
    if (!kdsDesignCache) {
        kdsDesignCache = await loadKDSDesign();
    }
    return kdsDesignCache;
}

async function getKDSRulesCached(): Promise<KDSRule[]> {
    if (!kdsRulesCache) {
        kdsRulesCache = await loadKDSRules();
    }
    return kdsRulesCache;
}

function clearCache(): void {
    kdsDesignCache = null;
    kdsRulesCache = null;
}
```

---

## 📝 Configuration File Paths

### Standard Paths
```typescript
const CONFIG_PATHS = {
    KDS_DESIGN: 'KDS/KDS-DESIGN.md',
    KDS_RULES: 'KDS/governance/rules.md',
    CURRENT_SESSION: 'KDS/sessions/current-session.json',
    PROJECT_CONFIG: 'config/sharedsettings.json',
    PROJECT_CONFIG_LOCAL: 'config/sharedsettings.local.json'
};
```

### Local Overrides
```typescript
async function loadProjectConfigWithOverrides(): Promise<ProjectConfig> {
    // Load base config
    const baseConfig = await loadProjectConfig();
    
    // Try to load local overrides
    try {
        const localContent = await readFile(CONFIG_PATHS.PROJECT_CONFIG_LOCAL);
        const localConfig = JSON.parse(localContent);
        
        // Merge (local overrides base)
        return {
            features: { ...baseConfig.features, ...localConfig.features },
            settings: { ...baseConfig.settings, ...localConfig.settings }
        };
    } catch (error) {
        // No local overrides, return base
        return baseConfig;
    }
}
```

---

## 🧪 Example Usage

### In work-planner.md
```typescript
// Load KDS design and rules
const design = await loadKDSDesign();
const rules = await loadKDSRules();

// Create new session
const session = await createSession('PDF Export', 'asifhussain60');

// Add phases and tasks
session.phases = createPhases(featureRequest, rules);

// Save session
await saveSession(session);
```

### In code-executor.md
```typescript
// Load session
const session = await loadSession();

if (!session) {
    throw new Error('No active session. Use plan.md to create one.');
}

// Get current task
const task = await getCurrentTask();

// Execute task...

// Mark complete and advance
await updateTaskStatus(task.task_id, 'completed');
await advanceToNextTask();
```

### In health-validator.md
```typescript
// Load session for history
const session = await loadSession();

// Run health checks
const healthStatus = await runHealthChecks();

// Save to session history
if (session) {
    session.health_history = session.health_history || [];
    session.health_history.push({
        timestamp: new Date().toISOString(),
        status: healthStatus.status
    });
    
    await saveSession(session);
}
```

---

## 🎯 Best Practices

### Always Validate After Load
```typescript
const session = await loadSession();

if (session) {
    const validation = validateSession(session);
    if (!validation.valid) {
        console.error('Session invalid:', validation.errors);
        // Handle error or repair
    }
}
```

### Use Safe Loaders in Production
```typescript
// Prefer safe loaders that handle errors gracefully
const design = await loadKDSDesignSafe();
const session = await loadSessionSafe();
```

### Cache When Appropriate
```typescript
// KDS Design and Rules don't change frequently - cache them
const rules = await getKDSRulesCached();

// Session state changes frequently - don't cache
const session = await loadSession(); // Always fresh
```

---

**Config Loader centralizes all KDS configuration!** ⚙️
