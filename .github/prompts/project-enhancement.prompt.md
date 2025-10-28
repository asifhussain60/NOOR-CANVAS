# project-enhancement — Comprehensive Project Stack Analysis & Tooling Recommendations

**Version**: 1.0.0  
**Purpose**: Analyze entire application stack, identify enhancement opportunities, and recommend secure, production-grade tooling improvements for any GitHub project.

---

## Critical Rules
1. MAX 15 bullets per response (see `.github/prompts/shared/CONCISE-MANDATE.md`)
2. **NO code blocks** - Reference tools and packages only
3. **Security-first** - Only recommend non-vulnerable, actively-maintained tools
4. **Generic analysis** - Adaptable to any project stack
5. **Implementation options** - Always provide A/B/C choices
6. **VALIDATE BEFORE RESPONDING** - All output must pass validation

---

## Parameters

### scope *(optional, default=`all`)*
Analysis scope:
- `all` - Full stack analysis (UI, API, services, database, infrastructure)
- `frontend` - UI/UX tools and frameworks only
- `backend` - API, services, data layer
- `testing` - Test frameworks and quality tools
- `infrastructure` - DevOps, CI/CD, deployment
- `security` - Security scanning, vulnerability detection
- `documentation` - Documentation tools and generators

### focus *(optional)*
Specific area of interest:
- `ui-ux` - Design systems, component libraries, accessibility
- `performance` - Optimization, caching, bundling
- `developer-experience` - Tooling, linting, formatting
- `observability` - Logging, monitoring, tracing
- `data-visualization` - Charts, dashboards, analytics

### -test *(flag, optional)*
Enable validation using `.github/prompts/shared/prompt-test-validation-framework.md`

---

## Input
Optional context about current pain points or desired improvements

---

## Analysis Algorithm

```
FUNCTION AnalyzeProjectStack()
  
  // 1. Detect project type and stack
  stack = DetectStack()  // Blazor, React, Node.js, Python, etc.
  packageManagers = DetectPackageManagers()  // npm, NuGet, pip, etc.
  frameworks = IdentifyFrameworks()
  
  // 2. Security scan current dependencies
  vulnerabilities = ScanForVulnerabilities()
  outdatedPackages = CheckForOutdatedPackages()
  
  // 3. Analyze current tooling gaps
  gaps = {
    ui: AssessUITooling(),
    testing: AssessTestCoverage(),
    quality: AssessCodeQuality(),
    security: AssessSecurityTools(),
    devex: AssessDeveloperExperience()
  }
  
  // 4. Generate recommendations by category
  recommendations = {
    critical: [],    // Security fixes, major vulnerabilities
    high: [],        // Significant improvements, modern alternatives
    medium: [],      // Nice-to-haves, productivity boosters
    low: []          // Optional enhancements
  }
  
  // 5. Validate all recommendations for security
  FOR EACH tool IN recommendations
    IF HasKnownVulnerabilities(tool) THEN
      EXCLUDE tool
    END IF
    IF NOT ActivelyMaintained(tool) THEN
      EXCLUDE tool
    END IF
  END FOR
  
  RETURN {stack, gaps, recommendations, vulnerabilities}
  
END FUNCTION
```

---

## Security Validation

**ALL recommended tools MUST:**
- Have no known critical/high CVEs
- Be actively maintained (commits within 6 months)
- Have stable release version (not alpha/beta for production)
- Support current framework versions
- Have good community adoption (stars, downloads, usage)

**Automatic exclusions:**
- Tools with unpatched security vulnerabilities
- Abandoned projects (no updates >1 year)
- Experimental/unstable tools for production use
- Tools with poor security track record

---

## Stack Detection

```
FUNCTION DetectStack()
  
  stack = {
    type: null,
    frontend: [],
    backend: [],
    database: [],
    testing: [],
    infrastructure: []
  }
  
  // Check project files
  IF EXISTS("package.json") THEN
    packageJson = ReadJSON("package.json")
    
    IF packageJson.dependencies.react THEN
      stack.frontend.add("React")
    END IF
    
    IF packageJson.dependencies.next THEN
      stack.type = "Next.js"
    END IF
    
    IF packageJson.devDependencies.playwright THEN
      stack.testing.add("Playwright")
    END IF
  END IF
  
  IF EXISTS("*.csproj") THEN
    csproj = ReadXML("*.csproj")
    
    IF csproj.PackageReference["Microsoft.AspNetCore"] THEN
      stack.backend.add("ASP.NET Core")
      stack.type = "ASP.NET"
    END IF
    
    IF csproj.PackageReference["MudBlazor"] THEN
      stack.frontend.add("Blazor + MudBlazor")
    END IF
  END IF
  
  IF EXISTS("requirements.txt") OR EXISTS("pyproject.toml") THEN
    stack.type = "Python"
    // Parse Python dependencies
  END IF
  
  IF EXISTS("go.mod") THEN
    stack.type = "Go"
  END IF
  
  IF EXISTS("Cargo.toml") THEN
    stack.type = "Rust"
  END IF
  
  RETURN stack
  
END FUNCTION
```

---

## Tooling Recommendation Categories

### 1. UI/UX Enhancement Tools
- **Component Libraries**: Pre-built, accessible components
- **Design Systems**: Consistent styling and theming
- **Animation Libraries**: Smooth transitions and interactions
- **Icon Systems**: Modern, lightweight icon sets
- **Accessibility Tools**: WCAG compliance validators

### 2. Testing & Quality Tools
- **E2E Testing**: Playwright, Cypress alternatives
- **Visual Regression**: Percy, Chromatic, BackstopJS
- **Performance Testing**: Lighthouse, WebPageTest
- **Code Quality**: ESLint, Prettier, Roslynator
- **Coverage Tools**: Istanbul, Coverlet

### 3. Developer Experience Tools
- **Linting**: Language-specific linters
- **Formatting**: Auto-formatters (Prettier, Black, gofmt)
- **Type Safety**: TypeScript, mypy, type checkers
- **Git Hooks**: Husky, pre-commit hooks
- **Documentation**: DocFX, Docusaurus, Swagger/OpenAPI

### 4. Performance & Optimization
- **Bundlers**: Vite, esbuild, Rollup
- **Image Optimization**: Sharp, ImageMagick wrappers
- **Caching**: Redis, Memcached, CDN strategies
- **Code Splitting**: Dynamic imports, lazy loading
- **Compression**: Brotli, gzip strategies

### 5. Security & Compliance
- **Dependency Scanning**: Snyk, Dependabot, npm audit
- **SAST**: SonarQube, CodeQL, Semgrep
- **Secret Scanning**: GitGuardian, TruffleHog
- **License Compliance**: FOSSA, License Finder
- **Authentication**: Auth0, Firebase Auth, IdentityServer

### 6. Observability & Monitoring
- **Logging**: Serilog, Winston, structured logging
- **Monitoring**: Application Insights, Datadog, New Relic
- **Tracing**: OpenTelemetry, Jaeger
- **Error Tracking**: Sentry, Rollbar, Bugsnag
- **Metrics**: Prometheus, Grafana

---

## Output Format (STRICT)

```
🧠 Analysis (≤5 bullets)
- Stack: {detected-stack-summary}
- Type: {project-type}
- Gaps: {critical-gaps}
- Vulnerabilities: {count} found
- Recommendations: {count} total

📌 Summary (≤10 bullets)
1. Stack: {frontend} + {backend} + {database}
2. Current Tools: {existing-tooling}
3. Security: {vulnerabilities-summary}
4. Critical: {critical-recommendations}
5. High Priority: {high-priority-recommendations}
6. Medium: {medium-recommendations}
7. Quick Wins: {low-hanging-fruit}
8. Implementation: {estimated-effort}
9. ROI: {expected-benefits}
10. Next: **A.** {action} | **B.** {action} | **C.** {action}

📊 Final
- Status: {analysis-complete}
- Recommendations: {count}
- Next: {primary-action}
```

---

## Recommendation Output Structure

### Critical (Fix Immediately)
```
**Security Vulnerabilities:**
- {package-name} ({version}) → {vulnerability-description}
  - Severity: Critical
  - Fix: Upgrade to {safe-version}
  - CVE: {cve-id}
```

### High Priority (Significant Improvements)
```
**Modernization Opportunities:**
- {current-tool} → {recommended-tool}
  - Benefit: {performance/security/dx-improvement}
  - Effort: {low/medium/high}
  - Migration Path: {strategy}
```

### Medium (Productivity Boosters)
```
**Developer Experience:**
- Add {tool-name}
  - Purpose: {what-it-solves}
  - Setup: {installation-method}
  - Benefit: {time-saved/quality-improved}
```

### Low (Optional Enhancements)
```
**Nice-to-Haves:**
- Consider {tool-name} for {use-case}
  - Benefit: {marginal-improvement}
  - When: {future-consideration}
```

---

## Implementation Options (MANDATORY)

**ALWAYS end with 2-4 letter-based options:**

```
🎯 What Would You Like To Do Next?

**A.** Implement Critical Fixes (security vulnerabilities)
  - Upgrade {count} vulnerable packages
  - Add security scanning to CI/CD
  - Estimated time: {duration}

**B.** Phased Enhancement Plan
  - Phase 1: Critical security fixes (immediate)
  - Phase 2: High-priority modernization (1-2 weeks)
  - Phase 3: Developer experience improvements (ongoing)
  - Create detailed implementation plan with @workspace /plan

**C.** Quick Wins Only (low effort, high impact)
  - Add {tool-1}
  - Configure {tool-2}
  - Setup {tool-3}
  - Estimated time: {1-2 days}

**D.** Review Detailed Analysis
  - Generate comprehensive report
  - Include migration strategies
  - Cost-benefit analysis
```

---

## Stack-Specific Recommendations

### Blazor Projects
**UI Enhancement:**
- Radzen Blazor Components (free tier)
- DaisyUI + Tailwind CSS (if using Tailwind)
- Heroicons (lightweight icons)

**Testing:**
- bUnit (Blazor component testing)
- Playwright for E2E (already common)
- Percy for visual regression

**Quality:**
- Roslynator (C# analyzer)
- StyleCop (code style)
- SonarAnalyzer.CSharp

### React/Next.js Projects
**UI Enhancement:**
- Shadcn/ui (modern components)
- Radix UI (accessible primitives)
- Framer Motion (animations)

**Testing:**
- Vitest (faster than Jest)
- Testing Library (component tests)
- Playwright (E2E)

**Quality:**
- ESLint + TypeScript
- Prettier (formatting)
- Husky (git hooks)

### Python Projects
**Framework:**
- FastAPI (modern, async)
- Pydantic (validation)
- SQLAlchemy (ORM)

**Testing:**
- pytest (standard)
- pytest-cov (coverage)
- Playwright for Python (E2E)

**Quality:**
- ruff (fast linter/formatter)
- mypy (type checking)
- black (formatting)

### Node.js/Express Projects
**Framework:**
- Fastify (faster alternative)
- Nest.js (enterprise structure)

**Testing:**
- Vitest (unit/integration)
- Supertest (API testing)
- Playwright (E2E)

**Quality:**
- ESLint + TypeScript
- Prettier
- ts-node (development)

---

## Security Scanning Integration

```
FUNCTION ScanForVulnerabilities()
  
  vulnerabilities = []
  
  // Scan package manifests
  IF EXISTS("package.json") THEN
    npmAudit = RunCommand("npm audit --json")
    vulnerabilities.add(ParseNpmAudit(npmAudit))
  END IF
  
  IF EXISTS("*.csproj") THEN
    dotnetList = RunCommand("dotnet list package --vulnerable")
    vulnerabilities.add(ParseDotnetVulnerabilities(dotnetList))
  END IF
  
  IF EXISTS("requirements.txt") THEN
    pipAudit = RunCommand("pip-audit")
    vulnerabilities.add(ParsePipAudit(pipAudit))
  END IF
  
  // Check for known vulnerable patterns
  FOR EACH file IN codebase
    IF ContainsHardcodedSecrets(file) THEN
      vulnerabilities.add({
        type: "hardcoded-secret",
        file: file,
        severity: "critical"
      })
    END IF
  END FOR
  
  RETURN vulnerabilities
  
END FUNCTION
```

---

## Actively Maintained Check

```
FUNCTION IsActivelyMaintained(packageName, ecosystem)
  
  // Check last update date
  IF ecosystem == "npm" THEN
    info = FetchFromRegistry("https://registry.npmjs.org/{packageName}")
    lastUpdate = info.time.modified
  ELSE IF ecosystem == "nuget" THEN
    info = FetchFromRegistry("https://api.nuget.org/v3-flatcontainer/{packageName}/index.json")
    lastUpdate = info.versions[-1].published
  END IF
  
  daysSinceUpdate = Now() - lastUpdate
  
  IF daysSinceUpdate > 365 THEN
    RETURN false  // Likely abandoned
  END IF
  
  // Check GitHub activity if available
  IF info.repository THEN
    commits = FetchRecentCommits(info.repository)
    IF commits.count == 0 IN last 180 days THEN
      RETURN false
    END IF
  END IF
  
  RETURN true
  
END FUNCTION
```

---

## Example Usage

### Full Stack Analysis
```bash
@workspace /project-enhancement
```

### UI/UX Focus
```bash
@workspace /project-enhancement scope=frontend focus=ui-ux
```

### Security Audit
```bash
@workspace /project-enhancement scope=security
```

### Testing Improvements
```bash
@workspace /project-enhancement scope=testing
```

### With Validation
```bash
@workspace /project-enhancement -test
```

---

## Success Criteria
- Stack accurately detected
- All recommendations security-validated
- Tools actively maintained
- Migration paths provided
- Implementation options clear (A/B/C format)
- No vulnerable packages recommended
- ROI/effort estimates included
- Generic enough for any project
- Output passes CONCISE-MANDATE validation

---

## Integration Points
- Can invoke `/plan` for detailed implementation
- Can invoke `/healthcheck` for validation
- Can invoke `/task` for immediate fixes
- Compatible with drift detection for found issues

---

## Notes
- This prompt is **read-only analysis** - does not modify code
- Recommendations are **suggestions only** - user decides implementation
- **Security-first** - never recommend vulnerable tools
- **Effort estimates** included for user planning
- **Migration strategies** provided for major changes
- Works with **any GitHub project** regardless of stack
