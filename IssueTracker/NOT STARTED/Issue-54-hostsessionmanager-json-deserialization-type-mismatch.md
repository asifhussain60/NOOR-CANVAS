# Issue-54: HostSessionManager JSON Deserialization Type Mismatch

**Status:** NOT STARTED
**Priority:** HIGH 🔴
**Type:** BUG 🐛
**Created:** September 13, 2025 17:47
**Reporter:** GitHub Copilot
**Assignee:** Development Team

---

## 📋 **ISSUE SUMMARY**

HostSessionManager fails to initialize with JSON deserialization error when trying to load albums from KSESSIONS database. The API returns integer values for GroupID, CategoryID, and SessionID, but the frontend models expect GUID types, causing a type mismatch during JSON parsing.

---

## 🐛 **BUG DESCRIPTION**

### **Problem**
After successful host authentication, the HostSessionManager page displays "Failed to initialize session manager" error due to JSON deserialization failure.

### **Error Details**
```
System.Text.Json.JsonException: The JSON value could not be converted to System.Guid. 
Path: $[0].groupId | LineNumber: 0 | BytePositionInLine: 14.
---> System.InvalidOperationException: Cannot get the value of a token type 'Number' as a string.
```

### **Root Cause**
- **Database**: KSESSIONS database stores GroupID, CategoryID, SessionID as **integers**
- **API**: HostController returns these as **integers** in JSON response
- **Frontend**: HostSessionManager and CreateSession models expect these as **GUID** types
- **Result**: JSON deserializer cannot convert integer to GUID, throwing exception

---

## 🔍 **TECHNICAL ANALYSIS**

### **What Works ✅**
- Host authentication (Landing.razor and Host.razor)
- API endpoint `/api/host/albums` successfully returns data
- Database connectivity and query execution (loads 14 albums)
- HttpClientFactory configuration (fixed in Issue-53)

### **What Fails ❌**
- JSON deserialization in HostSessionManager.AuthenticateHostAndLoadData()
- JSON deserialization in CreateSession.LoadAlbums()
- Type conversion from integer to GUID in model binding

### **Evidence from Logs**
```
[17:46:28 INF] NoorCanvas.Controllers.HostController NOOR-SUCCESS: Loaded 14 albums from KSESSIONS database
[17:46:28 ERR] NoorCanvas.Pages.HostSessionManager NOOR-ERROR: Failed to authenticate host and load data
System.Text.Json.JsonException: The JSON value could not be converted to System.Guid. Path: $[0].groupId
```

---

## 📊 **IMPACT ASSESSMENT**

### **User Impact**
- **Severity:** HIGH - Blocks core session creation workflow
- **Affected Users:** All hosts attempting to create sessions
- **Workaround:** None available

### **System Impact**
- **Components:** HostSessionManager.razor, CreateSession.razor
- **APIs:** /api/host/albums, /api/host/categories, /api/host/sessions
- **Database:** KSESSIONS_DEV (data types are correct, frontend models are wrong)

---

## 🔧 **SOLUTION APPROACH**

### **Option 1: Fix Frontend Models (RECOMMENDED)**
Change frontend model types from GUID to int:
- `HostSessionManager.razor` - AlbumData, CategoryData, SessionData models
- `CreateSession.razor` - AlbumDto, CategoryDto, SessionDto models

### **Option 2: Change Database Schema (NOT RECOMMENDED)**
Convert database columns to GUID - would require data migration and break Beautiful Islam integration.

### **Option 3: API Layer Conversion (COMPLEX)**
Convert integers to GUIDs in API layer - adds unnecessary complexity and performance overhead.

---

## 📝 **REPRODUCTION STEPS**

1. Start NOOR Canvas application
2. Navigate to https://localhost:9091/landing
3. Enter GUID: `12345678-1234-1234-1234-123456789abc`
4. Click "Continue as Host"
5. **Expected:** Host session manager loads with albums dropdown
6. **Actual:** Error "Failed to initialize session manager"

---

## 🎯 **ACCEPTANCE CRITERIA**

### **Primary Goals**
- [ ] HostSessionManager loads successfully after host authentication
- [ ] Albums dropdown populates with 14 albums from KSESSIONS database
- [ ] Categories dropdown loads when album is selected
- [ ] Sessions dropdown loads when category is selected
- [ ] Complete session creation workflow functions end-to-end

### **Technical Requirements**
- [ ] Change GroupID from Guid to int in HostSessionManager models
- [ ] Change CategoryID from Guid to int in HostSessionManager models  
- [ ] Change SessionID from Guid to int in HostSessionManager models
- [ ] Apply same fixes to CreateSession.razor models
- [ ] Verify JSON deserialization works with integer types
- [ ] Maintain backward compatibility with existing API contracts

---

## 🔗 **RELATED ISSUES**

### **Dependencies**
- **Issue-53:** CreateSession Page Initialization Failure - Same root cause (type mismatch)
- **Issue-25:** Host Authentication Failure - **RESOLVED** (authentication now works)

### **Blocked Issues**
- Any session creation workflow testing
- Integration testing with KSESSIONS database
- Host dashboard functionality validation

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests**
- JSON deserialization with integer IDs
- Model binding validation
- Type conversion testing

### **Integration Tests**
- End-to-end session creation workflow
- Database integration with correct data types
- API response format validation

### **Manual Testing**
- Host authentication → album selection → category selection → session selection → session creation
- Verify all dropdowns load correctly with integer IDs
- Confirm error messages are cleared

---

## 💡 **ADDITIONAL NOTES**

### **Development Pattern**
This issue highlights the importance of:
- Consistent data type usage between database, API, and frontend
- Proper model validation during development
- Integration testing across all layers

### **Future Prevention**
- Add type validation in API response models
- Implement automated testing for JSON serialization/deserialization
- Document data type contracts between layers

---

**Next Action:** Change frontend model types from GUID to int in both HostSessionManager.razor and CreateSession.razor components.
