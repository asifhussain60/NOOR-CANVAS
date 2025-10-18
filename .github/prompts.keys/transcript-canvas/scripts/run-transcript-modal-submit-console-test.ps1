Param(
  [string]$Token = "KJAHA99L"
)

# Orchestration script to run the console-breadcrumb smoke test.
# Note: Playwright webServer should start the app automatically (PW_MODE=standalone).

$env:PW_SESSION_TOKEN = $Token

# Run test via central Playwright config
npx playwright test .github/prompts.keys/transcript-canvas/tests/transcript-modal-submit-console.spec.ts --reporter=list
