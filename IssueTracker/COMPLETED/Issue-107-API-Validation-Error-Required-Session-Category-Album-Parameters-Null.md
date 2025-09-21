# Issue-107: API Validation Error - Required Session/Category/Album Parameters Null

## 📊 **Status Dashboard**

- **Current Status:** NOT STARTED
- **Priority Level:** HIGH
- **Assigned Developer:** GitHub Copilot
- **Created:** 2025-09-18
- **Last Updated:** 2025-09-18

---

## 🎯 **Problem Summary**

API endpoint `/api/host/create-session` returning HTTP 400 BadRequest with error "Selected session, category, and album are required" when receiving NULL values for selectedSession, selectedCategory, and selectedAlbum parameters.

## 📝 **Detailed Description**

**Error Message:**

```json
{
  "error": "Selected session, category, and album are required",
  "received": {
    "selectedSession": "NULL",
    "selectedCategory": "NULL",
    "selectedAlbum": "NULL"
  }
}
```

**API Endpoint Affected:**

- `POST /api/host/create-session?token={hostToken}`
- Location: `HostController.CreateSessionWithTokens()` method (line ~464)

**Root Cause Analysis:**
The controller is receiving JsonElement sessionData but failing to extract the `SelectedSession`, `SelectedCategory`, and `SelectedAlbum` properties, resulting in null values that fail validation.

## 🔍 **Reproduction Steps**

1. Navigate to Host-SessionOpener page
2. Fill in all cascading dropdown selections (Album, Category, Session)
3. Fill in session date, time, and duration
4. Click "Open Session" button
5. Observe HTTP 400 error in browser network tab

## 🎯 **Acceptance Criteria**

- [ ] API successfully receives and parses the session/category/album selection data
- [ ] Validation passes when all required fields are provided
- [ ] Proper error handling for truly missing data vs parsing failures
- [ ] Comprehensive logging for debugging property extraction issues

## 🧪 **Testing Protocol**

- **Database:** KSESSIONS_DEV (read-only `dbo` schema, writable `canvas` schema)
- **UI Testing:** VSCode Playwright Test Explorer for end-to-end validation
- **API Testing:** Direct API calls to isolate data flow issues

## 📋 **Debugging Tasks**

- [ ] Create Playwright test to reproduce the error scenario
- [ ] Add comprehensive debug logging to property extraction
- [ ] Validate database session/category/album data integrity
- [ ] Compare frontend payload structure with backend expectations
- [ ] Test with various data combinations to isolate the failure pattern

## 🔧 **Investigation Results**

### Playwright Prerequisites

- Host token: Valid test token (e.g., 'JHINFLXN')
- Test data: Album 18, Category 55, Session 1281
- API base URL: https://localhost:9091
- Required headers: Accept: application/json

### Debug Evidence Log

**2025-09-18 08:30 - Initial Analysis:**

- Located error source in `HostController.CreateSessionWithTokens()` method
- Property extraction uses `JsonElement.TryGetProperty()` for SelectedSession/SelectedCategory/SelectedAlbum
- Frontend sends data via `PostAsJsonAsync()` with proper structure
- Need to validate property name matching between frontend payload and backend extraction

**Next Investigation Steps:**

1. Create comprehensive Playwright test to capture exact payload structure
2. Add detailed logging to compare sent vs received property names
3. Verify case sensitivity and property name matching
4. Test with hardcoded values to isolate parsing vs validation issues

---

## 🏁 **Resolution Tracking**

- **TODO:** ❌ Investigation and debugging
- **TODO:** ❌ Playwright test creation
- **TODO:** ❌ API fix implementation
- **TODO:** ❌ Validation and cleanup

---

**Link:** [Issue-107 Detail File](./Issue-107-API-Validation-Error-Required-Session-Category-Album-Parameters-Null.md)
