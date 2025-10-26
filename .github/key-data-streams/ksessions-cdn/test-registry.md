# Test Registry: KSESSIONS Resources CDN

**Plan Key**: `ksessions-resources-cdn`  
**Created**: 2025-10-26  
**Purpose**: Define test scenarios for validating resource serving functionality

---

## Test Categories

### 1. Unit Tests
Location: `Tests/Integration/ResourceServices/`

- **ResourceTokenServiceTests.cs**
  - ✅ GenerateSignedUrl creates valid tokens
  - ✅ ValidateToken accepts valid signatures
  - ✅ ValidateToken rejects expired tokens
  - ✅ ValidateToken rejects tampered signatures
  - ✅ Token expiry calculation is accurate

- **ResourceUrlBuilderTests.cs**
  - ✅ BuildImageUrl uses file:/// in development
  - ✅ BuildImageUrl uses HTTPS in production
  - ✅ BuildAudioUrl generates correct extension
  - ✅ BuildVideoUrl includes signed token in prod
  - ✅ URL pattern matches expected format

- **SessionAssetsRepositoryTests.cs**
  - ✅ GetAssetByGuid returns correct asset
  - ✅ RegisterAsset creates new record
  - ✅ GetAssetsBySessionId returns all session assets
  - ✅ GUID uniqueness constraint enforced

---

### 2. Integration Tests
Location: `Tests/Integration/ResourceCdn/`

- **ResourceCdnIntegrationTests.cs**
  - ✅ IIS site serves static files correctly
  - ✅ CORS headers present for allowed origins
  - ✅ Cache headers set to 1 year
  - ✅ Range requests supported for MP3/MP4
  - ✅ 404 returned for non-existent assets
  - ✅ Token validation middleware accepts valid tokens
  - ✅ Token validation middleware rejects invalid tokens

---

### 3. End-to-End (E2E) Tests
Location: `Tests/UI/`

- **resources-cdn-access.spec.ts**
  ```typescript
  test('should load session image from CDN', async ({ page }) => {
    // Navigate to NoorCanvas host page
    // Verify image loads from resources.kashkole.com
    // Check image dimensions and visibility
  });
  
  test('should generate signed URL for new asset', async ({ page }) => {
    // Upload new image via NoorCanvas
    // Verify SessionAssets record created
    // Verify signed URL returned
    // Access URL and verify image loads
  });
  ```

- **resources-cors-validation.spec.ts**
  ```typescript
  test('should allow CORS from session.kashkole.com', async ({ request }) => {
    // Send OPTIONS preflight from session.kashkole.com origin
    // Verify Access-Control-Allow-Origin header
    // Verify GET request succeeds
  });
  
  test('should block CORS from unauthorized origins', async ({ request }) => {
    // Send request from malicious.com origin
    // Verify CORS headers absent or restrictive
  });
  ```

- **resources-streaming.spec.ts**
  ```typescript
  test('should support range requests for audio streaming', async ({ request }) => {
    // Request MP3 with Range: bytes=0-1024 header
    // Verify 206 Partial Content response
    // Verify Content-Range header present
    // Verify Accept-Ranges: bytes header
  });
  
  test('should stream video with seek support', async ({ page }) => {
    // Load video player in NoorCanvas
    // Seek to middle of video
    // Verify range request sent
    // Verify playback continues from seek position
  });
  ```

---

### 4. Performance Tests
Location: `Tests/Performance/`

- **ResourceCdnLoadTest.cs** (using NBomber or K6)
  ```csharp
  // Simulate 100 concurrent users requesting images
  // Measure:
  // - Response time (p50, p95, p99)
  // - Throughput (requests/sec)
  // - Error rate
  // - Cloudflare cache hit ratio
  ```

- **TokenGenerationBenchmark.cs** (using BenchmarkDotNet)
  ```csharp
  [Benchmark]
  public void GenerateSignedUrl_Performance()
  {
      // Benchmark token generation speed
      // Target: < 1ms per token
  }
  ```

---

### 5. Security Tests
Location: `Tests/Security/`

- **ResourceSecurityTests.cs**
  - ❌ Direct access without token (should fail in prod)
  - ❌ Expired token access (should return 401/403)
  - ❌ Tampered token signature (should return 401/403)
  - ✅ Valid token within expiry (should succeed)
  - ❌ Token reuse after expiry (should fail)
  - ❌ Directory traversal attempts (should be blocked)
  - ❌ Access to non-image files (e.g., .exe, .dll)

- **HotlinkingPreventionTests.cs**
  ```typescript
  test('should block hotlinking from external sites', async ({ request }) => {
    // Request resource with Referer: external-site.com
    // Verify blocked (if referer validation enabled)
  });
  ```

---

### 6. Smoke Tests (Production)
Location: `Scripts/`

- **production-resources-smoke-test.ps1**
  ```powershell
  # Test 1: Public URL resolution
  Test-NetConnection resources.kashkole.com -Port 443
  
  # Test 2: Sample image access
  $token = "GENERATE_VALID_TOKEN"
  Invoke-WebRequest "https://resources.kashkole.com/images/sample.jpg?token=$token"
  
  # Test 3: CORS validation
  # Test 4: Cache headers verification
  # Test 5: Streaming support (range requests)
  ```

---

## Test Execution Plan

### Development Phase
```bash
# Run unit tests
dotnet test --filter "Category=Unit"

# Run integration tests (requires IIS site running)
dotnet test --filter "Category=Integration"

# Run E2E tests (requires NoorCanvas running)
npx playwright test Tests/UI/resources-*
```

### Pre-Deployment
```bash
# Full test suite
dotnet test
npx playwright test

# Performance baseline
dotnet run --project Tests/Performance/ResourceCdnLoadTest
```

### Post-Deployment (Production)
```powershell
# Smoke tests
.\Scripts\production-resources-smoke-test.ps1

# Visual regression (if applicable)
npx playwright test --project=production
```

---

## Success Criteria

### Functional Requirements
- [ ] 100% of unit tests pass
- [ ] 100% of integration tests pass
- [ ] 100% of E2E tests pass
- [ ] CORS works for all allowed origins
- [ ] Token validation prevents unauthorized access
- [ ] Streaming works for audio/video

### Performance Requirements
- [ ] Token generation: < 1ms per token
- [ ] Image load time: < 500ms (p95)
- [ ] CDN cache hit ratio: > 90% after warmup
- [ ] Concurrent users: Support 100+ simultaneous requests

### Security Requirements
- [ ] No unauthorized access possible
- [ ] Expired tokens rejected
- [ ] Directory traversal blocked
- [ ] Only allowed MIME types served

---

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Resources CDN Tests

on:
  push:
    branches: [development, master]
  pull_request:
    branches: [development]

jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: 8.0.x
      
      - name: Run unit tests
        run: dotnet test --filter "Category=Unit"
      
      - name: Setup IIS
        run: .\Scripts\setup-resources-iis.ps1
      
      - name: Run integration tests
        run: dotnet test --filter "Category=Integration"
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npx playwright test Tests/UI/resources-*
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

---

## Test Data

### Sample Assets (for testing)
Create in `Tests/TestData/Resources/`:
```
Tests/TestData/Resources/
├── IMAGES/
│   ├── sample-1.jpg (1920x1080, 500KB)
│   ├── sample-2.png (800x600, 200KB)
│   └── sample-3.gif (animated, 100KB)
├── MP3/
│   ├── sample-audio.mp3 (3min, 5MB)
│   └── sample-short.mp3 (10sec, 200KB)
└── MEDIA/
    ├── sample-video.mp4 (30sec, 10MB)
    └── sample-video.webm (30sec, 8MB)
```

### Test Database Records
```sql
-- Insert test session assets
INSERT INTO SessionAssets (SessionId, AssetGuid, AssetType, FileName, PhysicalPath, RelativePath, MimeType)
VALUES 
    (1, 'dd004eb0-fd39-4207-b1da-32b3e3c48269', 'image', 'sample-1.jpg', 'D:\Websites\KSESSIONS\Resources\IMAGES\1\sample-1.jpg', 'images/dd004eb0-fd39-4207-b1da-32b3e3c48269.jpg', 'image/jpeg'),
    (1, '63697171-fb29-43b2-8155-6546b25e695e', 'audio', 'sample-audio.mp3', 'D:\Websites\KSESSIONS\Resources\MP3\1\sample-audio.mp3', 'audio/63697171-fb29-43b2-8155-6546b25e695e.mp3', 'audio/mpeg');
```

---

## Manual Test Checklist

### Pre-Deployment
- [ ] Local IIS site accessible at localhost:9092
- [ ] web.config present with correct CORS headers
- [ ] Sample image loads via browser
- [ ] Sample MP3 plays in browser
- [ ] Token generation service works
- [ ] Database migrations applied successfully

### Post-Deployment
- [ ] DNS resolves resources.kashkole.com
- [ ] HTTPS certificate valid (Cloudflare)
- [ ] Image loads from production URL
- [ ] CORS headers present in production
- [ ] Cache headers set to 1 year
- [ ] Token validation works
- [ ] 404 for non-existent resources
- [ ] No directory listing enabled

---

## Troubleshooting Tests

### Common Issues

**Issue**: CORS not working
- **Test**: `curl -H "Origin: https://session.kashkole.com" -I https://resources.kashkole.com/images/test.jpg`
- **Expected**: `Access-Control-Allow-Origin` header present
- **Fix**: Check web.config customHeaders section

**Issue**: Range requests not supported
- **Test**: `curl -H "Range: bytes=0-1024" https://resources.kashkole.com/audio/test.mp3`
- **Expected**: HTTP 206 response with `Content-Range` header
- **Fix**: Ensure httpCompression disabled for range request support

**Issue**: Token validation fails
- **Test**: Generate token, immediately use it
- **Expected**: 200 OK
- **Fix**: Check clock synchronization, verify HMAC secret matches

---

**Test Registry Version**: 1.0  
**Last Updated**: 2025-10-26  
**Status**: Ready for implementation
