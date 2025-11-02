# Test Registry: cloudflare-tunnel-stability

Last Updated: 2025-10-26

---

## Test Suites

### Phase 1: Verify Tunnel Integrity

| Test | Type | Status | Last Run | Pass/Fail |
|------|------|--------|----------|-----------|
| Credentials file exists | File | ⏳ Pending | - | - |
| Credentials valid JSON | Validation | ⏳ Pending | - | - |
| Config tunnel ID matches DNS | Integration | ⏳ Pending | - | - |
| All 3 hostnames resolve | DNS | ⏳ Pending | - | - |
| Backup created successfully | Backup | ⏳ Pending | - | - |

### Phase 2: Git Protection Hook

| Test | Type | Status | Last Run | Pass/Fail |
|------|------|--------|----------|-----------|
| Hook rejects wrong tunnel ID | Unit | ⏳ Pending | - | - |
| Hook allows correct tunnel ID | Unit | ⏳ Pending | - | - |
| Hook allows unrelated changes | Unit | ⏳ Pending | - | - |
| Workspace validator detects mismatch | Integration | ⏳ Pending | - | - |

### Phase 3: Windows Service Installation

| Test | Type | Status | Last Run | Pass/Fail |
|------|------|--------|----------|-----------|
| Service installs successfully | Integration | ⏳ Pending | - | - |
| Service starts automatically | Integration | ⏳ Pending | - | - |
| Service survives reboot | Integration | ⏳ Pending | - | - |
| Auto-recovery after stop | Integration | ⏳ Pending | - | - |

### Phase 4: Config Validation Script

| Test | Type | Status | Last Run | Pass/Fail |
|------|------|--------|----------|-----------|
| Validates config tunnel ID | Unit | ⏳ Pending | - | - |
| Checks DNS CNAME records | Integration | ⏳ Pending | - | - |
| Verifies credentials file | Unit | ⏳ Pending | - | - |
| Scheduled task runs daily | Integration | ⏳ Pending | - | - |

### Phase 5: Credential Backup System

| Test | Type | Status | Last Run | Pass/Fail |
|------|------|--------|----------|-----------|
| Backup creates encrypted file | Unit | ⏳ Pending | - | - |
| Restore recovers from backup | Integration | ⏳ Pending | - | - |
| Hash verification works | Unit | ⏳ Pending | - | - |
| Old backups cleaned up | Integration | ⏳ Pending | - | - |

### Phase 6: Health Monitoring & Alerting

| Test | Type | Status | Last Run | Pass/Fail |
|------|------|--------|----------|-----------|
| Detects service stopped | Unit | ⏳ Pending | - | - |
| Validates DNS resolution | Integration | ⏳ Pending | - | - |
| Tests URL connectivity | E2E | ⏳ Pending | - | - |
| Alerts trigger on failure | Integration | ⏳ Pending | - | - |
| Scheduled task runs every 5 min | Integration | ⏳ Pending | - | - |

### Phase 7: Documentation Synchronization

| Test | Type | Status | Last Run | Pass/Fail |
|------|------|--------|----------|-----------|
| IIS-Configuration.md updated | Validation | ⏳ Pending | - | - |
| CDN-Architecture.md updated | Validation | ⏳ Pending | - | - |
| __CLOUDFLARE README updated | Validation | ⏳ Pending | - | - |
| No old tunnel IDs remain | Validation | ⏳ Pending | - | - |
| Documentation index complete | Validation | ⏳ Pending | - | - |

---

## Test Execution Commands

### Run All Validation Tests
```powershell
# Phase 1 - Verify tunnel integrity
.\.github\key-data-streams\cloudflare-tunnel-stability\verify-tunnel.ps1

# Phase 4 - Config validation
.\.github\key-data-streams\cloudflare-tunnel-stability\validate-config.ps1

# Phase 6 - Health check
.\.github\key-data-streams\cloudflare-tunnel-stability\health-check.ps1
```

### Run Phase-Specific Tests

#### Phase 2: Git Hook Tests
```powershell
# Test with wrong tunnel ID (should fail)
echo "tunnel: 5474d3b4-50ea-4588-8763-5fc7da533d6c" > C:\Users\asifh\.cloudflared\config.yml
git add .
git commit -m "test: should fail"  # Should be rejected

# Test with correct tunnel ID (should pass)
echo "tunnel: 93650d38-60af-4dc7-a5ec-f8347fc57514" > C:\Users\asifh\.cloudflared\config.yml
git add .
git commit -m "test: should pass"  # Should succeed
```

#### Phase 3: Service Tests
```powershell
# Test auto-recovery
Stop-Service cloudflared -Force
Start-Sleep -Seconds 65
$status = (Get-Service cloudflared).Status
if ($status -eq "Running") { Write-Host "✅ Auto-recovery works" }

# Test reboot persistence (requires actual reboot)
Restart-Computer -Confirm
# After reboot:
Get-Service cloudflared | Select-Object Status
```

#### Phase 5: Backup/Restore Tests
```powershell
# Create backup
.\.github\key-data-streams\cloudflare-tunnel-stability\backup-credentials.ps1

# List backups
Get-ChildItem .github/key-data-streams/cloudflare-tunnel-stability/backups -Filter "manifest-*.json"

# Test restore (use timestamp from latest manifest)
.\.github\key-data-streams\cloudflare-tunnel-stability\restore-credentials.ps1 -BackupTimestamp "20251026-120000"
```

#### Phase 6: Health Monitoring Tests
```powershell
# Manual health check
.\.github\key-data-streams\cloudflare-tunnel-stability\health-check.ps1 -Verbose

# Check scheduled task
Get-ScheduledTask -TaskName "CloudflareTunnelHealthMonitor"
```

---

## Test Coverage

- [x] Unit tests (script-level validation)
- [x] Integration tests (service, DNS, backup/restore)
- [x] E2E tests (URL connectivity)
- [ ] Visual regression tests (N/A for infrastructure)
- [ ] Accessibility tests (N/A for infrastructure)
- [x] Recovery tests (backup/restore, auto-recovery)

---

## Manual Test Checklist

### Pre-Implementation
- [ ] Verify no cloudflared services running
- [ ] Verify config.yml exists with correct tunnel ID
- [ ] Verify credentials file exists
- [ ] Verify DNS records point to correct tunnel ID

### Post-Phase 1
- [ ] Credentials file validated
- [ ] Config matches DNS
- [ ] Backup created successfully

### Post-Phase 2
- [ ] Git hook installed in `.git/hooks/pre-commit`
- [ ] Hook rejects wrong tunnel ID
- [ ] Hook allows correct tunnel ID

### Post-Phase 3
- [ ] Service installed as "cloudflared"
- [ ] Service status: Running
- [ ] Service StartType: Automatic
- [ ] Auto-recovery configured (3 attempts)

### Post-Phase 4
- [ ] Validation script works
- [ ] Scheduled task created
- [ ] Daily validation runs at 8 AM

### Post-Phase 5
- [ ] Backup script creates encrypted credentials
- [ ] Restore script recovers successfully
- [ ] Old backups cleaned up

### Post-Phase 6
- [ ] Health check script works
- [ ] Scheduled task runs every 5 minutes
- [ ] Logs created in logs/ directory

### Post-Phase 7
- [ ] All docs reference correct tunnel ID
- [ ] No references to old tunnel IDs
- [ ] Documentation index created

---

## Test Results Summary

| Phase | Total Tests | Passed | Failed | Pending |
|-------|-------------|--------|--------|---------|
| 1     | 5           | 0      | 0      | 5       |
| 2     | 4           | 0      | 0      | 4       |
| 3     | 4           | 0      | 0      | 4       |
| 4     | 4           | 0      | 0      | 4       |
| 5     | 4           | 0      | 0      | 4       |
| 6     | 5           | 0      | 0      | 5       |
| 7     | 5           | 0      | 0      | 5       |
| **Total** | **31** | **0** | **0** | **31** |

---

## Known Issues

None yet - plan not implemented

---

## Test Environment

**Machine**: Windows (local development)  
**PowerShell Version**: 5.1+  
**Cloudflare Account**: kashkole.com  
**Tunnel ID**: 93650d38-60af-4dc7-a5ec-f8347fc57514  
**Config Location**: C:\Users\asifh\.cloudflared\config.yml  
**External Tools**: D:\PROJECTS\__CLOUDFLARE\
