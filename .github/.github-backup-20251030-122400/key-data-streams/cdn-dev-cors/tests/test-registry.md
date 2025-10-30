# Test Registry: cdn-dev-cors-extension

**Last Updated**: 2025-10-26  
**Status**: Tests Defined

## Test Suites

### Phase 3: Validation and Testing
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| verify-dual-mode-cors.ps1 | Production CORS still works | Integration | ⏳ Pending | - | - |
| verify-dual-mode-cors.ps1 | Development CORS now works | Integration | ⏳ Pending | - | - |
| verify-dual-mode-cors.ps1 | Cache headers preserved | Integration | ⏳ Pending | - | - |
| verify-dual-mode-cors.ps1 | CORS preflight (OPTIONS) | Integration | ⏳ Pending | - | - |
| verify-dual-mode-cors.ps1 | File integrity check | Integration | ⏳ Pending | - | - |

## Test Execution Commands

### Run All Tests
```powershell
.\.github\key-data-streams\cdn-dev-cors-extension\tests\verify-dual-mode-cors.ps1
```

### Run Individual CORS Test
```powershell
# Production CORS
Invoke-WebRequest -Uri "https://resources.kashkole.com" -Headers @{"Origin"="https://noorcanvas.kashkole.com"} -UseBasicParsing

# Development CORS
Invoke-WebRequest -Uri "https://resources.kashkole.com" -Headers @{"Origin"="http://localhost:5000"} -UseBasicParsing
```

### Run Cache Header Test
```powershell
Invoke-WebRequest -Uri "https://resources.kashkole.com" -UseBasicParsing | Select-Object -ExpandProperty Headers
```

### Run File Integrity Test
```powershell
Get-ChildItem "D:\Websites\KSESSIONS\Resources" -Recurse -File | Where-Object { $_.Name -ne 'web.config' } | Measure-Object
```

## Test Coverage

- [x] Integration tests (CORS validation)
- [x] Configuration tests (cache headers)
- [x] Safety tests (file integrity)
- [ ] Unit tests (N/A - configuration only)
- [ ] E2E tests (N/A - infrastructure change)
- [ ] Visual regression tests (N/A - no UI changes)
- [ ] Accessibility tests (N/A - no UI changes)

## Test Success Criteria

**All tests must pass before marking plan complete:**
- ✅ Production CORS verified (noorcanvas.kashkole.com + session.kashkole.com)
- ✅ Development CORS verified (localhost:5000/5001)
- ✅ Cache-Control: max-age=31536000 present
- ✅ CORS preflight (OPTIONS) returns 200
- ✅ File count unchanged (only web.config modified)
