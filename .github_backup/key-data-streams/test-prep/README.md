# Test Prep Tool - Quick Reference

**Tool**: `test-prep.prompt.md`  
**Purpose**: Automate Playwright test generation from real UI interactions  
**Version**: 1.0.0  
**Created**: 2025-10-31

---

## 🚀 Quick Start

### 1. Prep Components for Logging

```
@workspace /test-prep action=prep files=[HostControlPanel.razor,SessionCanvas.razor] session=212
```

**What it does**:
- Injects `data-playwright-log-marker` into components
- Creates PlaywrightLogger.js (if missing)
- Configures server-side logging
- Saves tracking file for cleanup

---

### 2. Manual Testing (You)

1. Run application:
   ```powershell
   dotnet run --project SPA/NoorCanvas
   ```

2. Interact with UI (5-10 minutes):
   - Click buttons, fill forms, submit data
   - Trigger all scenarios you want to test

3. Logs auto-saved to:
   - `playwright-interaction-logs.txt` (client clicks)
   - `playwright-server-logs.txt` (server events)

---

### 3. Generate Tests from Logs

```
@workspace /test-prep action=generate session=212 key=hcp feature=asset-sharing
```

**What it does**:
- Reads both log files
- Correlates client actions → server events (by timestamp)
- Generates Playwright test with assertions
- Saves to `Tests/UI/hcp-asset-sharing.spec.ts`

---

### 4. Cleanup Logging Infrastructure

```
@workspace /test-prep action=cleanup session=212
```

**What it does**:
- Removes all markers from files
- Deletes log files
- Archives session for audit trail

---

## 📋 Example Workflow

### Scenario: Test Asset Sharing Flow

**Step 1**: Prep
```
@workspace /test-prep action=prep files=[Components/HostControlPanel.razor,Components/AssetSidebar.razor] session=212
```

**Step 2**: Manual Test (you do this)
- Open browser → `/host/control-panel/212`
- Click "Share Asset" button
- Select image, click share
- Verify asset appears in participant view

**Step 3**: Generate
```
@workspace /test-prep action=generate session=212 key=hcp feature=asset-sharing --validate
```

**Output**: `Tests/UI/hcp-asset-sharing.spec.ts`

**Step 4**: Cleanup
```
@workspace /test-prep action=cleanup session=212
```

---

## 🎯 When to Use This Tool

**✅ Use test-prep when**:
- Creating NEW Playwright tests from scratch
- Testing complex UI flows with SignalR/database interactions
- Need accurate selectors from real DOM
- Want assertions from server events

**❌ Don't use test-prep when**:
- Writing simple unit tests
- Updating existing Playwright tests
- Testing API endpoints only (no UI)

---

## 🔗 Related Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `test-prep` | Prep components + generate tests | Creating new Playwright tests |
| `test-generation` | Generate tests from specs | Have test requirements, no logging needed |
| `cleanup-playwright-logging` | Manual cleanup | test-prep cleanup failed |
| `healthcheck` | Validate test quality | After test generation |

---

## 📊 Log Correlation Example

**Client Log**:
```
[CLIENT] 2025-10-31T14:32:15.123Z | CLICK | [data-testid="share-asset-btn"] | button | "Share Asset"
```

**Server Log** (2 seconds later):
```
[SERVER] 2025-10-31T14:32:15.456Z | AssetSidebar | Sharing asset ABC123 of type Image
```

**Generated Test**:
```typescript
await page.getByTestId('share-asset-btn').click();
await expect(page.locator('.asset-shared')).toContainText('ABC123');
```

---

## ⚙️ Configuration

**appsettings.Development.json** (auto-configured by test-prep):

```json
{
  "Serilog": {
    "WriteTo": [
      {
        "Name": "File",
        "Args": {
          "path": "playwright-server-logs.txt",
          "outputTemplate": "[SERVER] {Timestamp:yyyy-MM-ddTHH:mm:ss.fffZ} | {SourceContext} | {Message:lj}{NewLine}"
        }
      }
    ]
  }
}
```

---

## 🚨 Troubleshooting

**Problem**: No logs generated  
**Solution**: Verify appsettings.json configured, check PlaywrightLogger.js exists

**Problem**: Cleanup doesn't remove markers  
**Solution**: Check injected-files.json exists, verify session ID matches

**Problem**: Generated test has low quality score  
**Solution**: Use more specific data-testid attributes, longer manual test session

---

## See Also

- `.github/prompts/test-prep.prompt.md` - Full specification
- `.github/governance/kds-rulebook.md` - Rule #2b (Test Reverse-Engineering)
- `.github/prompts/shared/kds-validation-algorithms.md` - Algorithm 10 (InjectPlaywrightLogger)
- `.github/prompts/test-generation.prompt.md` - Test generation engine

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-31
