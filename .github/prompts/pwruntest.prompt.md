mode: agent
name: pwru# 🎯 Mission
# Execute Playwright tests for NOOR Canvas with full debug capabilities.
# Auto-start application if needed, configure test environment from notes, 
# and generate comprehensive artifacts in PlayWright/ folders.t
description: >
  Execute Playwright tests matching ${name} with comprehensive debug artifacts and 
  application health checks. Auto-configures test environment from ${notes} hints 
  (token:xxx, sessionId:212, user:email@domain.com) or fallback sources. Ensures 
  NOOR Canvas application is running before test execution.

arguments:
  - name: name
    required: true
    description: >
      The test or describe title (or substring) to run (used with Playwright’s -g filter).
      Example: "Login Flow", "Session", "Smoke: Dashboard".
  - name: notes
    required: false
    description: >
      Free-form guidance to apply during this run. Supports inline hints like
      'token:abc...', 'sessionId:123...', 'user:qa@noor.app', 'tenant:dev', or
      'route:/sessions/212'. The runner parses these and exports appropriate env vars
      so tests can pick them up at runtime. If empty, the runner will auto-resolve
      tokens/sessionIds from known locations.

# 🎯 Mission
# Run Playwright tests matching ${name}; interpret ${notes} to enrich the run.
# Execution must respect the repo’s playwright.config.* (headless Chromium, 1 worker, retries, trace-on-retry),
# and write artifacts to PlayWright/reports, PlayWright/results, PlayWright/artifacts.

steps:
  - title: Pre-Execution Validation (CRITICAL)
    details: |
      • Enforce headless Chromium (do not flip to headed).
      • Single worker (sequential) to avoid session/token cross-talk.
      • Reporters: HTML, JSON + console (line/list) as configured.
      • Ensure artifact directories exist:
          PlayWright/reports, PlayWright/results, PlayWright/artifacts.
      • Health check NOOR Canvas at http://localhost:9090.
        If not up, start with .\nc.ps1 and wait ~18s for ASP.NET Core warm-up.

      PowerShell:
      ```powershell
      Write-Host "📁 Prepare artifact dirs..." -ForegroundColor Cyan
      New-Item -ItemType Directory -Force -Path "PlayWright/reports","PlayWright/results","PlayWright/artifacts" | Out-Null

      Write-Host "🔍 Check NOOR Canvas on :9090..." -ForegroundColor Cyan
      try {
        $r = Invoke-WebRequest -Uri "http://localhost:9090" -TimeoutSec 5 -UseBasicParsing
        Write-Host "✅ App is running (Status $($r.StatusCode))" -ForegroundColor Green
      } catch {
        Write-Host "⚠️ Not running. Starting NOOR Canvas application..." -ForegroundColor Yellow
        Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd 'd:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; dotnet run" -WindowStyle Hidden
        Write-Host "⏳ Waiting 20s for ASP.NET Core startup..." -ForegroundColor Cyan
        Start-Sleep 20
        
        # Verify startup successful
        try {
          $r = Invoke-WebRequest -Uri "http://localhost:9090" -TimeoutSec 10 -UseBasicParsing
          Write-Host "✅ Application started successfully (Status $($r.StatusCode))" -ForegroundColor Green
        } catch {
          Write-Host "❌ Failed to start application. Check manually." -ForegroundColor Red
          throw "Application startup failed"
        }
      }
      ```

  - title: Interpret Notes → Export Runtime Context
    details: |
      The runner parses ${notes} for structured hints. Supported keys (case-insensitive):
        token, sessionId, user, email, tenant, route, org, env
      Examples:
        • "token: xyz"               → CANVAS_TEST_TOKEN=xyz
        • "sessionId: 212"           → NOOR_SESSION_ID=212
        • "user: qa@noor.app"        → CANVAS_TEST_USER=qa@noor.app
        • "tenant: dev"              → CANVAS_TENANT=dev
        • "route: /sessions/212"     → CANVAS_TEST_ROUTE=/sessions/212

      Resolution order for token/sessionId when not explicitly provided in notes:
        1) Process env: CANVAS_TEST_TOKEN, NOOR_SESSION_ID
        2) .env / .env.local in repo root
        3) PlayWright/secrets/test-secrets.json (fields: token, sessionId, user, tenant)
        4) appsettings.Development.json (ConnectionStrings or seeded "Permanent Session 212" token)
        5) Fallback: known-good “Permanent Session 212” token from repo conventions (read-only test user)

      PowerShell (optimized notes parsing):
      ```powershell
      # Parse "key:value" pairs from ${notes} 
      $notes = "${notes}"
      
      # Helper function for clean env var export
      function Set-TestEnv($name, $value) {
        if ($value -and $value.Trim()) {
          [Environment]::SetEnvironmentVariable($name, $value.Trim(), "Process")
          Write-Host "🔧 $name configured" -ForegroundColor DarkCyan
        }
      }

      # Extract key-value pairs (case-insensitive)
      $patterns = @{
        "token"     = "CANVAS_TEST_TOKEN"
        "sessionid" = "NOOR_SESSION_ID" 
        "user"      = "CANVAS_TEST_USER"
        "email"     = "CANVAS_TEST_USER"
        "tenant"    = "CANVAS_TENANT"
        "route"     = "CANVAS_TEST_ROUTE"
      }

      foreach ($key in $patterns.Keys) {
        if ($notes -match "(?i)$key\s*:\s*(.+)") {
          Set-TestEnv $patterns[$key] $Matches[1]
        }
      }

      # Fallback resolution from standard sources
      function Get-JsonValue($path, $property) {
        if (Test-Path $path) { 
          try { 
            $json = Get-Content $path -Raw | ConvertFrom-Json
            return $json.$property
          } catch { }
        }
      }

      # Auto-resolve missing values in priority order
      if (-not $env:NOOR_SESSION_ID) { 
        # Try .env first, then fallback to Session 212
        $envValue = if (Test-Path ".env") { (Get-Content ".env" | Select-String "NOOR_SESSION_ID=" | ForEach-Object { ($_ -split "=",2)[1] }) }
        $env:NOOR_SESSION_ID = $envValue ?? "212"
      }
      
      if (-not $env:CANVAS_TEST_TOKEN) {
        # Try .env, then secrets, then known Session 212 tokens
        $envValue = if (Test-Path ".env") { (Get-Content ".env" | Select-String "CANVAS_TEST_TOKEN=" | ForEach-Object { ($_ -split "=",2)[1] }) }
        $secretsValue = Get-JsonValue "PlayWright/secrets/test-secrets.json" "token"
        $env:CANVAS_TEST_TOKEN = $envValue ?? $secretsValue ?? "VNBPRVII"
      }

      # Status report
      Write-Host "🔑 SessionId: $env:NOOR_SESSION_ID" -ForegroundColor DarkGray
      Write-Host "🔑 Token: $(if ($env:CANVAS_TEST_TOKEN) { '[SET]' } else { '[MISSING]' })" -ForegroundColor DarkGray
      ```

      Test contracts (TypeScript fixtures):
      ```ts
      // Tests automatically read these environment variables:
      // - CANVAS_TEST_TOKEN: Authentication token for API calls
      // - NOOR_SESSION_ID: Session ID for test scenarios  
      // - CANVAS_TEST_USER: User email for login scenarios
      // - CANVAS_TENANT: Tenant context for multi-tenant tests
      // - CANVAS_TEST_ROUTE: Specific route to test navigation
      ```

  - title: Execute Playwright Tests
    details: |
      Run tests with comprehensive debug output and artifact collection.
      Respects repo config: headless Chromium, single worker, retries enabled.

      PowerShell:
      ```powershell
      # Configure debug logging and execute
      $env:DEBUG = "pw:api,pw:test"
      Write-Host "🚀 Executing tests matching: ${name}" -ForegroundColor Green
      
      # Run with line reporter for clean console output
      npx playwright test -g "${name}" --reporter=line
      
      if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tests completed successfully" -ForegroundColor Green
        Write-Host "📊 View report: npx playwright show-report" -ForegroundColor Cyan
      } else {
        Write-Host "❌ Tests failed. Check artifacts in PlayWright/ folders" -ForegroundColor Red
      }
      ```

  - title: Test Results & Debug Artifacts
    details: |
      Comprehensive test artifacts automatically generated:
      
      • **HTML Report**: PlayWright/reports/index.html (interactive test results)
      • **JSON Data**: PlayWright/results/test-results.json (CI/CD integration)  
      • **Screenshots**: PlayWright/artifacts/ (failure captures)
      • **Video Recordings**: PlayWright/artifacts/ (full test sessions)
      • **Trace Files**: PlayWright/artifacts/*.zip (step-by-step debugging)

      Quick access commands:
      ```powershell
      # Open interactive HTML report
      npx playwright show-report
      
      # View specific test trace (drag-drop .zip file)
      npx playwright show-trace PlayWright/artifacts/trace-*.zip
      
      # List all artifacts
      Get-ChildItem PlayWright/ -Recurse -File | Select Name, Length, LastWriteTime
      ```

guardrails:
  - "Preserve repo playwright.config.* settings (headless, retries, reporters)"
  - "Single worker only - prevents session/token conflicts"  
  - "Never expose tokens in console output - use [SET]/[MISSING] status"
  - "Validate ${name} specificity - warn if too broad (>50 matches)"
  - "Use exact application startup command: 'cd SPA/NoorCanvas; dotnet run'"

quality_checklist:
  - "✅ NOOR Canvas running on http://localhost:9090"
  - "✅ Artifact directories created (PlayWright/reports, results, artifacts)" 
  - "✅ Test environment configured (tokens, sessionId from notes or fallbacks)"
  - "✅ Single-worker execution (--workers=1 implicit)"
  - "✅ Test filter '${name}' matches intended tests"
  - "✅ Debug logging enabled (pw:api, pw:test)"
