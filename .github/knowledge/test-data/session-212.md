# Test Data: Session 212 with Pasted Image

**Category**: test-data  
**Published**: 2025-11-02  
**Success Rate**: 5/5 test runs  
**Last Validated**: 2025-11-02

## Context

Use this session when testing:
- Canvas rendering with existing data
- Image paste functionality
- Participant session state
- Database queries with known data
- Regression testing for canvas operations

Session 212 is a **validated test session** with known state in the database. It contains pasted image data and serves as a reliable baseline for E2E tests.

## Data Structure

### Session Information
```json
{
  "sessionId": 212,
  "userToken": "PQ9N5YWW",
  "status": "Created",
  "scheduledDate": null,
  "scheduledDuration": null,
  "createdAt": "2025-10-27 11:51:55.6875989",
  "expiresAt": "2025-11-02 17:02:54.8000000",
  "hoursUntilExpiry": 24
}
```

### Database Query
```sql
SELECT 
    SessionId,
    UserToken,
    Status,
    ScheduledDate,
    ScheduledDuration,
    CreatedAt,
    ExpiresAt,
    HoursUntilExpiry
FROM Sessions
WHERE SessionId = 212;
```

### Known State
- **Created**: 2025-10-27 11:51:55
- **Expires**: 2025-11-02 17:02:54
- **Status**: Created (not started)
- **Scheduled**: NULL (ad-hoc session)
- **User Token**: PQ9N5YWW (for participant access)

## Setup Instructions

### Prerequisites
1. Database connection to NOOR Canvas SQL Server
2. Session 212 exists in database (verify with query above)
3. Canvas data exists for sessionId 212
4. Application running on localhost:9090

### Verification Query
```sql
-- Verify session exists
SELECT COUNT(*) FROM Sessions WHERE SessionId = 212;
-- Expected: 1

-- Verify canvas data exists
SELECT COUNT(*) FROM Canvas WHERE SessionId = 212;
-- Expected: > 0

-- Check if pasted image exists
SELECT TOP 1 * FROM Canvas 
WHERE SessionId = 212 
  AND CanvasType = 'PastedImage'
ORDER BY CreatedAt DESC;
```

### Environment Setup
```typescript
// Playwright test setup
test.beforeEach(async ({ page }) => {
    // Navigate to session 212
    await page.goto('http://localhost:9090?sessionId=212', {
        waitUntil: 'networkidle',
        timeout: 30000
    });
    
    // Verify session loaded
    await expect(page.getByTestId('session-id-display')).toHaveText('212');
});
```

## Validation Criteria

### Database State Validation
```typescript
// Verify session is in expected state
const sessionQuery = await db.query(
    'SELECT Status, SessionId FROM Sessions WHERE SessionId = 212'
);
expect(sessionQuery.rows[0].Status).toBe('Created');
expect(sessionQuery.rows[0].SessionId).toBe(212);
```

### UI State Validation
```typescript
// Verify canvas loads
await expect(page.getByTestId('canvas-container')).toBeVisible();

// Verify session info displays
await expect(page.getByTestId('session-id-display')).toContainText('212');

// Verify pasted image content exists (if applicable)
const canvasImages = await page.getByTestId('canvas-image').count();
expect(canvasImages).toBeGreaterThan(0);
```

### Network State Validation
```typescript
// Verify SignalR connection
await page.waitForResponse(
    response => response.url().includes('/canvashub/negotiate') && response.status() === 200
);

// Verify canvas data loaded
await page.waitForResponse(
    response => response.url().includes('/api/canvas') && response.status() === 200
);
```

## What Worked

1. **Stable Session ID**: Using session 212 as a fixed test session eliminated variability in tests. Data persists across test runs.

2. **Pasted Image Data**: The pasted image in this session provides reliable test data for image rendering tests.

3. **Known Expiration**: Expiration date (2025-11-02 17:02:54) allows testing time-based logic without race conditions.

4. **UserToken Validation**: Token "PQ9N5YWW" enables testing participant access flows.

5. **Database Queries**: Direct database validation before/after tests ensures data integrity.
   ```typescript
   // Pre-test: capture initial state
   const before = await db.query('SELECT * FROM Canvas WHERE SessionId = 212');
   
   // Run test
   await performCanvasOperation();
   
   // Post-test: verify changes
   const after = await db.query('SELECT * FROM Canvas WHERE SessionId = 212');
   expect(after.rows.length).toBe(before.rows.length + 1);
   ```

6. **Created Status**: Using "Created" status (not started) provides clean state for testing session start flows.

## What Didn't Work

1. **Assuming Canvas Data Exists**: Early tests failed when canvas table had no records for session 212. Always verify with SQL query first.
   ```typescript
   // ❌ FAILED - Assumed canvas data exists
   await page.getByTestId('canvas-image').click();
   
   // ✅ WORKS - Verify before interacting
   const imageCount = await page.getByTestId('canvas-image').count();
   if (imageCount > 0) {
       await page.getByTestId('canvas-image').first().click();
   }
   ```

2. **Hardcoded Timestamps**: Tests that checked exact CreatedAt times failed due to timezone differences.
   ```typescript
   // ❌ FAILED - Exact timestamp comparison
   expect(session.CreatedAt).toBe('2025-10-27 11:51:55.6875989');
   
   // ✅ WORKS - Date-only or relative comparison
   expect(new Date(session.CreatedAt).getDate()).toBe(27);
   ```

3. **Relying on Expiry Logic**: Tests run after expiration date (2025-11-02 17:02:54) failed. Check HoursUntilExpiry before test.
   ```typescript
   // Check if session is still valid
   if (session.HoursUntilExpiry <= 0) {
       throw new Error('Session 212 expired - refresh test data');
   }
   ```

4. **Assuming Single Image**: Some tests assumed only one pasted image existed. Use `.first()` or `.nth(0)` for reliability.

5. **Not Cleaning Up Test Data**: Tests that modified session 212 without cleanup polluted subsequent tests. Use transactions or restore after test.

## Test Data Maintenance

### Data Refresh (If Expired)
```sql
-- Extend expiration date
UPDATE Sessions 
SET ExpiresAt = DATEADD(day, 7, GETDATE()),
    HoursUntilExpiry = 168
WHERE SessionId = 212;
```

### Data Cleanup (After Destructive Tests)
```sql
-- Backup before test
SELECT * INTO Sessions_Backup_212 FROM Sessions WHERE SessionId = 212;
SELECT * INTO Canvas_Backup_212 FROM Canvas WHERE SessionId = 212;

-- Restore after test
DELETE FROM Canvas WHERE SessionId = 212;
INSERT INTO Canvas SELECT * FROM Canvas_Backup_212;

DELETE FROM Sessions WHERE SessionId = 212;
INSERT INTO Sessions SELECT * FROM Sessions_Backup_212;
```

## Usage Example

### Complete Playwright Test
```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas with Session 212', () => {
    test('should load pasted image data', async ({ page }) => {
        // Navigate to session 212
        await page.goto('http://localhost:9090?sessionId=212', {
            waitUntil: 'networkidle'
        });
        
        // Verify session loaded
        await expect(page.getByTestId('session-id-display')).toHaveText('212');
        
        // Verify canvas container visible
        await expect(page.getByTestId('canvas-container')).toBeVisible();
        
        // Check for pasted image
        const images = page.getByTestId('canvas-image');
        const count = await images.count();
        expect(count).toBeGreaterThan(0);
        
        console.log(`✅ Session 212 loaded with ${count} image(s)`);
    });
});
```

## Related Test Data

- Session 215 (if exists) - Alternative test session
- Session 212 canvas data - Canvas table records
- UserToken PQ9N5YWW - Participant access token

## Related Patterns

- [Playwright Element Selection](../test-patterns/playwright-element-selection.md)
- [Canvas Element Test IDs](../ui-mappings/canvas-element-testids.md) (to be published)

---

**Last Updated**: 2025-11-02  
**Published By**: manual (extracted from database context and test patterns)  
**Database**: NOOR Canvas SQL Server  
**Source**: Sessions table, Canvas table
