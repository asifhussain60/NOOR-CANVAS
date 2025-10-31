# E2E Test Preparation Guide (Manual Approach)

**Status**: Active  
**Last Updated**: October 31, 2025  
**Approach**: Server logs + Manual browser console logs

---

## 🎯 Purpose

Capture dual-stream logs (server + browser) for E2E test generation with minimal automation.

---

## 📋 Prerequisites

- Application running (`ncb` or `dotnet run`)
- Browser DevTools open (F12)
- Test scenario planned

---

## 🔧 Preparation Steps

### 1. Configure Server Logging

Server logs are automatically captured to:
- **File**: `SPA/NoorCanvas/playwright-server-logs.txt`
- **Configuration**: `appsettings.Development.json` (Serilog)
- **Content**: HTTP requests, SignalR messages, database queries, application events

**No action required** - works out of the box.

### 2. Prepare Browser Console

Open browser DevTools (F12) and prepare to copy console output manually.

NoorLogger automatically logs:
- Component lifecycle events
- User interactions
- JavaScript errors
- Network failures

---

## 📝 Capture Process

### Step 1: Start Application
```powershell
cd SPA/NoorCanvas
dotnet run
```

### Step 2: Navigate to Page
- **HostControlPanel**: `http://localhost:9090/HostControlPanel?token={HostToken}`
- **SessionCanvas**: `http://localhost:9090/SessionCanvas?token={UserToken}`
- **TranscriptCanvas**: `http://localhost:9090/TranscriptCanvas?token={UserToken}`

### Step 3: Open DevTools
Press **F12** → **Console** tab

### Step 4: Perform Test Scenario
Execute your test actions (click buttons, enter text, etc.)

### Step 5: Save Browser Logs

**Right-click in console** → **Save as...** → Save to:
```
.github/key-data-streams/test-prep/{marker}-browser-logs.txt
```

**Or copy/paste:**
1. Select all console text (Ctrl+A)
2. Copy (Ctrl+C)
3. Paste into new file
4. Save as above

### Step 6: Copy Server Logs
```powershell
Copy-Item SPA/NoorCanvas/playwright-server-logs.txt .github/key-data-streams/test-prep/{marker}-server-logs.txt
```

---

## 📁 File Naming Convention

```
{marker}-{type}-logs.txt
```

**Examples:**
- `20251031-hcp-session-creation-browser-logs.txt`
- `20251031-hcp-session-creation-server-logs.txt`
- `20251031-participant-submit-question-browser-logs.txt`
- `20251031-participant-submit-question-server-logs.txt`

---

## 🎯 What to Capture

### Good Test Scenarios

✅ **User workflows with clear start/end:**
- Host creates session
- Participant submits question
- Host answers question
- Participant shares transcript section

✅ **Error scenarios:**
- Invalid input handling
- Network failure recovery
- Authentication errors

### Avoid

❌ Complex multi-page flows (split into smaller scenarios)
❌ Random clicking (plan clear steps)
❌ Long sessions (keep under 2 minutes)

---

## 🔍 Log Review Checklist

Before using logs for test generation, verify:

### Browser Logs
- [ ] Contains NoorLogger initialization
- [ ] Shows component lifecycle (mount, render)
- [ ] Captures user interactions (clicks, inputs)
- [ ] Includes element identifiers (IDs, classes, data attributes)
- [ ] No excessive noise (filter if needed)

### Server Logs
- [ ] Shows HTTP requests with paths
- [ ] Includes SignalR hub calls
- [ ] Contains database queries
- [ ] Has response status codes
- [ ] Timestamps align with browser logs

---

## 📊 Example Log Structure

### Browser Console Output
```
[16:30:15] NOOR-BROWSER: Browser logger initialized
[16:30:16] COMPONENT: HostControlPanel mounted
[16:30:18] USER-INTERACTION: Button clicked - #start-session-btn
[16:30:18] INPUT: Session title entered - "Test Session"
[16:30:19] NETWORK: POST /api/sessions - Status 200
[16:30:19] STATE: Session created - ID: 215
```

### Server Log Output
```
[16:30:18 INF] HTTP POST /api/sessions - User: Host123
[16:30:18 DBG] Creating session: Title="Test Session"
[16:30:18 INF] Database: INSERT INTO Sessions...
[16:30:19 INF] Response: 200 OK - SessionId: 215
```

---

## 🚀 Next Steps

### After Capturing Logs

1. **Review logs** - Ensure both streams captured the scenario
2. **Provide to Copilot** - Share both files for test generation
3. **Generate test** - Copilot creates Playwright test from logs
4. **Review test** - Verify selectors and assertions
5. **Run test** - Execute and fix any issues

### Test Generation Prompt

```
I have dual-stream logs for E2E test generation:

**Scenario**: [describe scenario]
**Browser Logs**: [attach/paste browser logs]
**Server Logs**: [attach/paste server logs]

Please generate a Playwright test that:
1. Uses proper selectors (data-testid preferred)
2. Includes wait conditions for async operations
3. Verifies expected outcomes
4. Handles error cases
```

---

## 🧹 Cleanup

After test generation is complete:

```powershell
# Archive logs
Move-Item .github/key-data-streams/test-prep/*.txt .github/key-data-streams/test-prep/archive/

# Clear server logs
Remove-Item SPA/NoorCanvas/playwright-server-logs.txt
```

---

## ⚙️ Troubleshooting

### Browser Logs Not Showing
- Check DevTools is open (F12)
- Verify `noor-logging.js` is loaded (check Network tab)
- Check for JavaScript errors blocking NoorLogger

### Server Logs Missing
- Verify `appsettings.Development.json` has Serilog configuration
- Check file path: `SPA/NoorCanvas/playwright-server-logs.txt`
- Restart application to reinitialize logging

### Logs Too Noisy
- Filter console by "NOOR" prefix
- Adjust log level in browser: `NoorLogger.setLevel('INFO')`
- Use Serilog MinimumLevel in appsettings

---

## 📚 Related Documentation

- **NoorLogger API**: `SPA/NoorCanvas/wwwroot/js/noor-logging.js`
- **Server Logging Config**: `SPA/NoorCanvas/appsettings.Development.json`
- **Test Generation**: `.github/prompts/test-prep.prompt.md`

---

**Approach**: Simple, manual, reliable  
**Automation**: Minimal (server logs only)  
**User Action**: Save browser console manually  
**Quality**: High (full context from both streams)
