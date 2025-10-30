# Test Registry: host-provisioner-domain-fix

Last Updated: 2025-10-26

---

## Test Suites

### Phase 5: URL Validation Test
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| Validate-Production-URLs.ps1 | Verify all app.config files have kashkole.com for production | PowerShell | ⏳ Pending | - | - |
| ConfigValidationTests.cs | Unit tests for HostProvisionerConfig URL detection | xUnit | ⏳ Pending | - | - |

### Phase 6: Manual Verification Tests
| Test Scenario | Type | Status | Last Run | Pass/Fail |
|---------------|------|--------|----------|-----------|
| Production URL Detection | Manual | ⏳ Pending | - | - |
| Token Copy and Browser Launch | Manual | ⏳ Pending | - | - |
| Clipboard Error Handling | Manual | ⏳ Pending | - | - |
| Development Environment | Manual | ⏳ Pending | - | - |
| Environment Badge Tooltip | Manual | ⏳ Pending | - | - |

---

## Test Execution Commands

### Run URL Validation Test
```powershell
.\.github\key-data-streams\host-provisioner-domain-fix\tests\run-validation-tests.ps1
```

### Manual Testing Instructions

**Test 1: Production URL Detection**
```powershell
# 1. Set production environment
$configPath = "Tools\HostProvisioner\HostProvisioner.WinForms\bin\Release\net8.0-windows\HostProvisioner.WinForms.dll.config"
# Modify XML: <add key="ASPNETCORE_ENVIRONMENT" value="Production" />

# 2. Run app
.\Tools\HostProvisioner\HostProvisioner.WinForms\bin\Release\net8.0-windows\HostProvisioner.WinForms.exe

# 3. Verify Base URL label shows: https://noorcanvas.kashkole.com
# 4. Verify red badge visible in top-right corner
```

**Test 2: Token Generation and Copy**
```powershell
# 1. Enter Session ID: 212
# 2. Click "Generate Host Token"
# 3. Click "Copy Token"
# 4. Verify copied URL contains: https://noorcanvas.kashkole.com/host/{TOKEN}
# 5. Click "Open in Browser"
# 6. Verify browser opens correct kashkole.com URL
```

**Test 3: Clipboard Error Fallback**
```powershell
# 1. Simulate clipboard failure (disable clipboard service or modify permissions)
# 2. Click "Copy Token"
# 3. Verify fallback dialog appears
# 4. Verify URL shown in read-only textbox
# 5. Verify text is auto-selected
# 6. Verify instructions visible
# 7. Press Ctrl+C to manually copy
```

**Test 4: Development Environment**
```powershell
# 1. Set development environment
# 2. Run app
# 3. Verify Base URL: https://localhost:9091
# 4. Verify green badge visible
# 5. Generate token, verify localhost URL
```

**Test 5: Environment Badge Tooltip**
```powershell
# 1. Run app in Development mode
# 2. Hover over green badge
# 3. Verify tooltip: "🟢 DEVELOPMENT\nSafe to experiment"
# 4. Switch to Production mode
# 5. Hover over red badge
# 6. Verify tooltip: "🔴 PRODUCTION\n⚠️ Changes affect live system"
```

---

## Test Coverage

- [x] Unit tests - PowerShell validation script
- [ ] Integration tests - (not applicable)
- [x] E2E tests - Manual verification tests
- [ ] Visual regression tests - (not applicable for desktop app)
- [ ] Accessibility tests - (not applicable)

---

## Test Results Summary

**Total Tests**: 7 (1 automated, 6 manual)  
**Passing**: 0  
**Failing**: 0  
**Pending**: 7  
**Coverage**: TBD after execution

---

## Notes

- Manual tests required due to WinForms desktop app nature
- Clipboard error simulation may be difficult without admin permissions
- Production testing requires modifying deployed app.config
- Consider automating config file validation in CI/CD
