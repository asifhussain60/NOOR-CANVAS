# START HERE - AI Agent System Quick Start

**Welcome!** This guide gets you using AI agents in 5 minutes.

---

## Step 1: Configuration (30 seconds)

Copy this folder to your project, then run:

```
@workspace /total-recall
```

That's it! total-recall scans your project and configures everything automatically.

---

## Step 2: Learn What's Available (1 minute)

Ask the question agent:

```
@workspace /question "What agents are available and what do they do?"
```

---

## Step 3: Try Your First Feature (3 minutes)

Create a simple feature with the planning agent:

```
@workspace /feature key=hello-world user_request="Add a hello world endpoint that returns JSON"
```

**What happens:**
1. Feature agent creates a detailed plan
2. Shows you 4-5 phases to implement
3. Asks for your approval
4. You say "proceed"
5. Agent outputs handoff command
6. **YOU run the command** to start implementation
7. Task agent implements each phase

---

## Common Workflows

### Planning → Implementation → Testing

```
# Step 1: Plan the feature
@workspace /feature key=user-auth user_request="Add JWT authentication"

# Step 2: After reviewing plan, start implementation  
# (Feature agent gives you this command)
@workspace /task key=user-auth github-branch=development tasks="Phase 1: ...\n---\nPhase 2: ..."

# Step 3: Generate tests
@workspace /test-generation feature=authentication scenario="login with valid credentials"
```

### Quick Refactoring

```
@workspace /refactor target="src/services/UserService.cs" focus="Extract validation logic to separate class"
```

### Generate Commit Message

```
# After making changes
@workspace /commit
```

### Ask Questions

```
@workspace /question "How does the session management work?"
@workspace /question "What's the best practice for error handling in this codebase?"
@workspace /question "Show me examples of using the database context"
```

---

## Agent Descriptions

### 🎯 Feature Planning Agent (`/feature`)

**Purpose:** Turns user requests into detailed, phased implementation plans

**When to use:**
- Starting a new feature
- Need structured approach to complex changes
- Want validation before coding

**Example:**
```
@workspace /feature key=dark-mode user_request="Add dark mode toggle to UI"
```

**Output:**
- Multi-phase implementation plan
- Test requirements
- Architecture analysis
- Handoff command for task agent

**CRITICAL:** Feature agent NEVER executes code directly. It only plans and presents handoff commands for your approval.

---

### ⚙️ Task Execution Agent (`/task`)

**Purpose:** Implements features phase-by-phase based on plan

**When to use:**
- After feature agent creates a plan
- Implementing from existing plan document

**Example:**
```
@workspace /task key=dark-mode github-branch=development debug-level=simple tasks="Phase 1: Add theme state\n---\nPhase 2: Wire UI toggle"
```

**Output:**
- Implementation for each phase
- Build validation after changes
- Commit after each phase
- Progress updates

---

### 🔄 Refactor Agent (`/refactor`)

**Purpose:** Improves code quality and structure

**When to use:**
- Code smells detected
- Need to extract/simplify logic
- Performance optimization

**Example:**
```
@workspace /refactor target="src/api/SessionController.cs" focus="Extract validation to middleware"
```

**Output:**
- Refactored code
- Preserved functionality
- Tests updated if needed

---

### 🧪 Test Generation Agent (`/test-generation`)

**Purpose:** Creates end-to-end and unit tests

**When to use:**
- After implementing a feature
- Need test coverage
- Visual regression testing (Percy)

**Example:**
```
@workspace /test-generation feature=login scenario="user logs in with valid credentials" tokens="Host=ABC123,User=XYZ789"
```

**Output:**
- Playwright E2E tests
- Percy visual tests (if UI changes)
- Test orchestration scripts

---

### 💬 Question Agent (`/question`)

**Purpose:** Answers questions about codebase, architecture, agents

**When to use:**
- Need to understand how something works
- Looking for examples
- Learning agent capabilities

**Example:**
```
@workspace /question "How do I use SignalR hubs in this project?"
@workspace /question "What's the database schema for sessions?"
```

**Output:**
- Clear answers with code examples
- Links to relevant files
- Best practices

---

### 📝 Commit Agent (`/commit`)

**Purpose:** Generates conventional commit messages

**When to use:**
- After making changes
- Need proper commit format

**Example:**
```
@workspace /commit
```

**Output:**
- Conventional commit message
- Scope and description
- Breaking change flags if applicable

---

### 🏥 Health Check Agent (`/healthcheck`)

**Purpose:** Validates agent system integrity

**When to use:**
- After configuration
- Troubleshooting agent issues
- Verifying setup

**Example:**
```
@workspace /healthcheck
```

**Output:**
- System health report
- Missing files warnings
- Configuration validation

---

### 🧹 Cleanup Agent (`/cleanup`)

**Purpose:** Removes temporary files and artifacts

**When to use:**
- After completing work
- Before committing
- Workspace feeling cluttered

**Example:**
```
@workspace /cleanup
```

**Output:**
- Cleaned workspace
- List of removed files
- Disk space recovered

---

## Tips & Tricks

### 1. Use Key Parameters Consistently
```
# Start with feature agent
@workspace /feature key=user-profile user_request="..."

# Continue with same key
@workspace /task key=user-profile ...
@workspace /test-generation key=user-profile ...
```

### 2. Break Large Features into Phases
```
# Instead of one huge request
@workspace /feature key=big-feature user_request="Implement entire user management system"

# Break it down
@workspace /feature key=user-mgmt-phase1 user_request="Add user registration"
@workspace /feature key=user-mgmt-phase2 user_request="Add user profile editing"
```

### 3. Use Question Agent for Exploration
```
# Before implementing
@workspace /question "Show me existing authentication patterns in this codebase"

# Then implement
@workspace /feature key=new-auth ...
```

### 4. Review Plans Before Execution
Feature agent creates plans → You review → You approve → You run handoff command

Never skip the review step!

---

## Next Steps

1. ✅ Run `@workspace /total-recall` to configure
2. ✅ Try `@workspace /question "What agents are available?"`
3. ✅ Create first feature with `/feature`
4. ✅ Check `QUICK-REFERENCE.md` for syntax details
5. ✅ Review `README.md` for deeper understanding

---

**You're ready to go!** 🚀

Start with: `@workspace /question "What should I try first?"`
