# Test Registry: transcript-image-url-fix

**Last Updated**: 2025-10-26  
**Total Tests**: 17

---

## Test Suites

### Phase 1: Media URL Transform Service
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| MediaUrlTransformServiceTests.cs | RelativePath_Production_ReturnsCdnUrl | Unit | ⏳ Pending | - | - |
| MediaUrlTransformServiceTests.cs | RelativePath_Development_ReturnsFileUrl | Unit | ⏳ Pending | - | - |
| MediaUrlTransformServiceTests.cs | FileProtocol_Production_ConvertsToCdn | Unit | ⏳ Pending | - | - |
| MediaUrlTransformServiceTests.cs | FileProtocol_Development_Unchanged | Unit | ⏳ Pending | - | - |
| MediaUrlTransformServiceTests.cs | KSessionsDomain_Production_ConvertsToCdn | Unit | ⏳ Pending | - | - |
| MediaUrlTransformServiceTests.cs | AlreadyCdn_Unchanged | Unit | ⏳ Pending | - | - |
| MediaUrlTransformServiceTests.cs | MultipleImages_AllTransformed | Unit | ⏳ Pending | - | - |
| MediaUrlTransformServiceTests.cs | AudioTag_Transformed | Unit | ⏳ Pending | - | - |
| MediaUrlTransformServiceTests.cs | VideoTag_Transformed | Unit | ⏳ Pending | - | - |
| MediaUrlTransformServiceTests.cs | Cache_SecondCallReturnsCached | Unit | ⏳ Pending | - | - |

### Phase 2: Integration Testing
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| - | Service injection verification | Integration | ⏳ Pending | - | - |
| - | Transform step execution order | Integration | ⏳ Pending | - | - |

### Phase 3: E2E Testing (SessionId=2343)
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| verify-transcript-image-loading.spec.ts | Load images with CDN URLs in production | E2E | ⏳ Pending | - | - |
| verify-transcript-image-loading.spec.ts | Handle mixed media types (img, audio, video) | E2E | ⏳ Pending | - | - |
| verify-transcript-image-loading.spec.ts | Cache transformed HTML on subsequent loads | E2E | ⏳ Pending | - | - |
| verify-transcript-image-loading.spec.ts | Log media URL transformations | E2E | ⏳ Pending | - | - |

### Phase 3: Percy Visual Regression
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| verify-transcript-media-urls-percy.spec.ts | Render transcript with images (Desktop) | Visual | ⏳ Pending | - | - |
| verify-transcript-media-urls-percy.spec.ts | Render transcript with images (Mobile) | Visual | ⏳ Pending | - | - |
| verify-transcript-media-urls-percy.spec.ts | Handle missing images gracefully | Visual | ⏳ Pending | - | - |

---

## Test Execution Commands

### Run All Unit Tests
```powershell
dotnet test --filter "FullyQualifiedName~MediaUrlTransformServiceTests"
```

### Run E2E Tests (Headed)
```powershell
npx playwright test Tests/UI/verify-transcript-image-loading.spec.ts --headed
```

### Run Percy Visual Regression Tests
```powershell
$env:PERCY_TOKEN = "your-percy-token"
npx percy exec -- npx playwright test Tests/UI/verify-transcript-media-urls-percy.spec.ts
```

### Run All Tests (Phase-by-Phase)
```powershell
# Phase 1: Unit tests
dotnet test --filter "FullyQualifiedName~MediaUrlTransformServiceTests"

# Phase 3: E2E tests
npx playwright test Tests/UI/verify-transcript-image-loading.spec.ts

# Phase 3: Percy tests
npx percy exec -- npx playwright test Tests/UI/verify-transcript-media-urls-percy.spec.ts
```

---

## Test Coverage

- [x] Unit tests (10 tests)
- [ ] Integration tests (manual verification)
- [x] E2E tests (4 tests)
- [x] Visual regression tests (3 tests)
- [ ] Performance tests (cache validation)
- [ ] Error handling tests (graceful degradation)

---

## Test Data

**Primary Test Session**: SessionId=2343 (confirmed to have image references)

**URL Patterns Tested**:
1. Relative paths: `/IMAGES/117/test.jpg`
2. File protocol: `file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg`
3. KSESSIONS domain: `https://kashkole.com/Resources/IMAGES/117/test.jpg`
4. CDN URLs: `https://resources.kashkole.com/IMAGES/117/test.jpg`

**Media Types Tested**:
- Images: `<img src="..." />`
- Audio: `<audio src="..."></audio>`
- Video: `<video src="..."></video>`

**Environments Tested**:
- Production: CDN URLs (`https://resources.kashkole.com`)
- Development: File URLs (`file:///D:/Websites/KSESSIONS/Resources`)

---

## Validation Checklist

**Phase 1: Service Creation**
- [ ] `IMediaUrlTransformService` interface created
- [ ] `MediaUrlTransformService` implementation created
- [ ] Unit tests pass (10/10)
- [ ] Configuration added to `sharedsettings.json`

**Phase 2: Integration**
- [ ] Service injected into `UnifiedHtmlTransformService`
- [ ] Transform step added at correct position
- [ ] DI registration in `Program.cs`
- [ ] Participant view unaffected

**Phase 3: Testing**
- [ ] E2E tests pass with SessionId=2343 (4/4)
- [ ] Images load from CDN in production
- [ ] Images load from file:/// in development
- [ ] Audio/video tags transformed
- [ ] Cache reduces transformation time
- [ ] Percy baselines captured (3/3)
- [ ] Logging confirms transformations
- [ ] KSESSIONS unaffected (verified)

---

## Known Issues

*No known issues yet - will be updated during execution*

---

## Test Results Summary

*Will be updated as tests execute*

**Target**: 17/17 tests passing  
**Current**: 0/17 (pending execution)

---

**Registry Status**: ✅ Complete  
**Last Updated**: 2025-10-26
