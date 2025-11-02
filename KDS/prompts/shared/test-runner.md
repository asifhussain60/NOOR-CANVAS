# KDS Shared Module: Test Runner

**Purpose:** Abstract test execution (Dependency Inversion Principle).

**Version:** 5.0 (SOLID Refactor)  
**Type:** Shared utility module  
**Single Responsibility:** Test execution ONLY  
**Dependencies:** ✅ ZERO external dependencies (uses project's existing tools)

---

## 🎯 Purpose (DIP Compliance)

**Problem:** Agents hardcoded test commands, creating tight coupling to tools.

**Solution:** Abstract test execution behind this interface.

**CRITICAL:** This module does NOT require any external packages. It discovers and uses tools that are **already installed in the project** (via tooling-inventory.json).

```markdown
# Before (Tight Coupling)
await run_in_terminal("npx playwright test spec.ts")  # Hardcoded command

# After (Dependency Inversion)
#shared-module:test-runner.md
await test_runner.run("spec.ts", framework="playwright")
→ Command comes from tooling-inventory.json
```

---

## 📥 Interface

### Run Test
```json
{
  "operation": "run",
  "test_file": "string (path to test file)",
  "framework": "playwright | mstest | jest | percy",
  "options": {
    "headed": "boolean",
    "reporter": "string",
    "timeout": "integer"
  },
  "return": "TestResult object"
}
```

### Run Test Suite
```json
{
  "operation": "run_suite",
  "pattern": "string (glob pattern)",
  "framework": "string",
  "return": "TestSuiteResult object"
}
```

### Check Test Framework
```json
{
  "operation": "check_availability",
  "framework": "string",
  "return": "boolean (available/not available)"
}
```

---

## 📤 TestResult Object Schema

```json
{
  "success": "boolean",
  "framework": "string",
  "test_file": "string",
  "duration_ms": "integer",
  "tests_run": "integer",
  "tests_passed": "integer",
  "tests_failed": "integer",
  "failures": [
    {
      "test_name": "string",
      "error_message": "string",
      "stack_trace": "string"
    }
  ],
  "output": "string (full test output)"
}
```

---

## 🔧 Implementation (Framework-Agnostic)

### Test Framework Discovery (LOCAL ONLY)
```python
def discover_test_frameworks():
    """
    Load available test frameworks from tooling inventory.
    
    CRITICAL: Does NOT install anything. Only discovers tools that
    are ALREADY installed in the project.
    
    KDS has ZERO external dependencies. This abstraction simply
    provides a consistent interface to PROJECT's existing tools.
    """
    
    # Read LOCAL inventory file (no external calls)
    inventory = load_json("KDS/tooling/tooling-inventory.json")
    
    frameworks = {}
    for tool in inventory.tooling.test:
        frameworks[tool.name.lower()] = {
            'command': tool.command,      # From PROJECT's package.json/csproj
            'version': tool.version,      # Installed version (not from npm)
            'config_file': tool.config_file
        }
    
    return frameworks
```

### Run Test
```python
def run(test_file, framework="auto", options={}):
    """Execute test using configured framework"""
    
    # Auto-detect framework if not specified
    if framework == "auto":
        framework = detect_framework(test_file)
    
    # Get framework config
    frameworks = discover_test_frameworks()
    if framework not in frameworks:
        raise FrameworkNotFoundError(f"{framework} not available")
    
    config = frameworks[framework]
    
    # Build command
    command = build_test_command(
        base_command=config.command,
        test_file=test_file,
        options=options
    )
    
    # Execute
    start = time.now()
    result = run_in_terminal(command)
    duration = (time.now() - start).milliseconds
    
    # Parse output
    return parse_test_result(
        output=result.output,
        exit_code=result.exit_code,
        framework=framework,
        duration=duration
    )
```

---

## 📚 Usage Examples

### In test-generator.md
```markdown
# Old (Hardcoded)
await run_in_terminal("npx playwright test verify-button.spec.ts")

# New (Abstract)
#shared-module:test-runner.md
result = await test_runner.run(
    test_file="verify-button.spec.ts",
    framework="playwright",
    options={"headed": True}
)

if result.success:
    print(f"✅ Test passed ({result.tests_passed}/{result.tests_run})")
```

### In code-executor.md
```markdown
# Old (Hardcoded)
await run_in_terminal("dotnet test --filter TestMethod")

# New (Abstract)
#shared-module:test-runner.md
result = await test_runner.run(
    test_file="Tests/Unit/ServiceTests.cs",
    framework="mstest",
    options={"filter": "TestMethod"}
)
```

### In health-validator.md
```markdown
# Old (Hardcoded)
await run_in_terminal("npx playwright test --grep @smoke")

# New (Abstract)
#shared-module:test-runner.md
result = await test_runner.run_suite(
    pattern="**/*.spec.ts",
    framework="playwright",
    options={"grep": "@smoke"}
)

health_score = calculate_health(result.tests_passed, result.tests_run)
```

---

## ✅ Benefits

### Framework Independence
- ✅ Swap test frameworks without changing agents
- ✅ Support multiple frameworks simultaneously
- ✅ Add new frameworks via tooling-inventory.json

### Consistent Interface
- ✅ Same API for all test types (unit, integration, UI)
- ✅ Unified result parsing
- ✅ Standardized error handling

### Maintainability
- ✅ One place to update test execution logic
- ✅ Centralized command building
- ✅ Consistent timeout/retry logic

---

## 🚨 Error Handling

### Framework Not Available
```json
{
  "error": "FRAMEWORK_NOT_FOUND",
  "requested": "playwright",
  "available": ["mstest", "jest"],
  "suggestion": "Use available framework from PROJECT (KDS doesn't install tools)"
}
```

### Test Execution Failed
```json
{
  "error": "TEST_EXECUTION_FAILED",
  "framework": "mstest",
  "test_file": "ServiceTests.cs",
  "exit_code": 1,
  "stderr": "Test assembly not found",
  "suggestion": "Build project before running tests"
}
```

### Timeout
```json
{
  "error": "TEST_TIMEOUT",
  "framework": "playwright",
  "duration_ms": 30000,
  "timeout_ms": 30000,
  "suggestion": "Increase timeout or optimize test"
}
```

---

## 🔄 Framework-Specific Implementations

### Playwright
```python
def run_playwright_test(test_file, options):
    """Execute Playwright test with framework-specific options"""
    
    base_cmd = get_framework_command("playwright")  # From inventory
    
    # Build Playwright-specific command
    cmd_parts = [base_cmd, "test", test_file]
    
    if options.get("headed"):
        cmd_parts.append("--headed")
    
    if options.get("debug"):
        cmd_parts.append("--debug")
    
    if options.get("project"):
        cmd_parts.extend(["--project", options.project])
    
    command = " ".join(cmd_parts)
    
    # Execute
    result = run_in_terminal(command)
    
    # Parse Playwright output format
    return parse_playwright_output(result.output, result.exit_code)
```

### MSTest
```python
def run_mstest_test(test_file, options):
    """Execute MSTest with framework-specific options"""
    
    base_cmd = get_framework_command("mstest")  # "dotnet test"
    
    cmd_parts = [base_cmd]
    
    if options.get("filter"):
        cmd_parts.extend(["--filter", options.filter])
    
    if options.get("configuration"):
        cmd_parts.extend(["--configuration", options.configuration])
    
    # MSTest needs project file, not test file
    project = find_project_for_test(test_file)
    cmd_parts.append(project)
    
    command = " ".join(cmd_parts)
    
    # Execute
    result = run_in_terminal(command)
    
    # Parse MSTest output format
    return parse_mstest_output(result.output, result.exit_code)
```

### Percy (Visual Regression)
```python
def run_percy_test(test_file, options):
    """Execute Percy visual regression test"""
    
    percy_cmd = get_framework_command("percy")  # "npx percy exec"
    playwright_cmd = get_framework_command("playwright")
    
    # Percy wraps Playwright
    command = f"{percy_cmd} -- {playwright_cmd} test {test_file}"
    
    # Execute
    result = run_in_terminal(command)
    
    # Parse Percy + Playwright output
    return parse_percy_output(result.output, result.exit_code)
```

---

## 📝 Configuration (PROJECT TOOLS ONLY)

### In tooling-inventory.json (LOCAL FILE)
```json
{
  "tooling": {
    "test": [
      {
        "name": "Playwright",
        "version": "1.40.0",
        "command": "npx playwright",  // PROJECT's existing tool
        "config_file": "playwright.config.ts"
      },
      {
        "name": "MSTest",
        "version": "2.2.10",
        "command": "dotnet test",  // PROJECT's existing tool
        "config_file": "NoorCanvas.sln"
      },
      {
        "name": "Percy",
        "version": "1.20.0",
        "command": "npx percy exec",  // PROJECT's existing tool
        "config_file": ".percy.yml"
      }
    ]
  }
}
```

**CRITICAL NOTES:**
- ✅ This inventory is **generated by refresh-tooling.ps1** (KDS-owned script)
- ✅ It discovers tools **already in the project** (package.json, *.csproj)
- ✅ KDS **does NOT install** these tools
- ✅ If tool missing, KDS reports error (doesn't auto-install)
- ✅ Zero external dependencies for KDS itself

---

## 🎯 Auto-Detection Logic

```python
def detect_framework(test_file):
    """Auto-detect test framework from file extension/content"""
    
    ext = get_extension(test_file)
    
    if ext in [".spec.ts", ".spec.js"]:
        # Check if Playwright or Jest
        content = read_file(test_file)
        if "test(" in content or "describe(" in content:
            if "page." in content:
                return "playwright"
            return "jest"
    
    elif ext == ".cs":
        content = read_file(test_file)
        if "[TestMethod]" in content or "[Fact]" in content:
            return "mstest"
    
    elif ext == ".py":
        return "pytest"
    
    raise FrameworkDetectionError(f"Cannot detect framework for {test_file}")
```

---

**Test Runner: Decouple agents from test frameworks!** 🧪
