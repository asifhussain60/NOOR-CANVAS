# Issue 3: SignalR Connection Parsing Error

## 🔴 **CRITICAL ISSUE**

### **Problem Description**

SignalR connection is failing with InvalidDataException during data parsing, causing connection drops and real-time functionality failures.

### **Error Details**

```javascript
blazor.server.js:1 [2025-09-11T12:56:49.584Z] Error: Connection disconnected with error 'Error: Server returned an error on close: Connection closed with an error. InvalidDataException: Reading 'target' as String failed.'.

blazor.server.js:1 Uncaught (in promise) Error: Server returned an error on close: Connection closed with an error. InvalidDataException: Reading 'target' as String failed.
    at Xt._processIncomingData (blazor.server.js:1:58755)
    at Xt.connection.onreceive (blazor.server.js:1:51920)
    at s.onmessage (blazor.server.js:1:80026)
```

### **Impact Assessment**

- **Severity:** HIGH 🔴
- **Category:** Bug 🐛
- **User Impact:** Breaks real-time annotations and live features
- **System Impact:** SignalR Hub communication fails

### **Root Cause Analysis**

InvalidDataException suggests data serialization/deserialization issues:

1. Incompatible data being sent through SignalR connection
2. Message format mismatch between client and server
3. Corrupt or malformed SignalR messages
4. Annotation data serialization issues in AnnotationHub

### **Connection Flow Analysis**

```
✅ WebSocket connected to wss://localhost:9091/_blazor?id=vvaeFujeK2XeHvf2VRnA3Q
❌ Connection disconnected with InvalidDataException: Reading 'target' as String failed
```

### **Reproduction Steps**

1. Start NOOR Canvas application
2. Navigate to any page with SignalR functionality
3. Monitor browser console for connection errors
4. Error occurs immediately after WebSocket connection establishment

### **Affected Components**

- AnnotationHub.cs - SignalR hub for real-time annotations
- Blazor Server SignalR integration
- Real-time annotation broadcasting
- Live session participant communication
- JavaScript interop with annotation tools

### **Technical Investigation Required**

- Review AnnotationHub message serialization
- Check annotation data model compatibility
- Verify SignalR message format consistency
- Test annotation data transmission methods

### **Expected Resolution**

- Fix data serialization issues in SignalR messages
- Ensure compatible data types in hub methods
- Validate annotation data before transmission
- Implement proper error handling for malformed messages

### **Acceptance Criteria**

- [ ] SignalR connections remain stable without disconnection errors
- [ ] No InvalidDataException errors in browser console
- [ ] Annotation data transmits successfully through SignalR
- [ ] Real-time features work consistently
- [ ] Connection recovery handles edge cases properly

**Priority:** HIGH  
**Status:** In Progress  
**Assigned:** GitHub Copilot  
**Created:** September 11, 2025  
**Updated:** September 11, 2025

---

## 🔧 **RESOLUTION IMPLEMENTED**

### **Fix Applied:** September 11, 2025

- **File Modified:** `Program.cs`
- **Root Cause Identified:** CORS policy only allowed `https://localhost:9090` but app runs on both 9090 and 9091
- **Change:** Extended CORS policy to include all development ports

### **Code Changes:**

```csharp
// OLD: Only HTTPS 9090 allowed (causing connection failures)
policy.WithOrigins("https://localhost:9090")

// NEW: All development ports allowed
policy.WithOrigins("https://localhost:9090", "https://localhost:9091",
                   "http://localhost:9090", "http://localhost:9091")
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials();
```

### **Expected Result:**

✅ No more CORS policy execution failures  
✅ SignalR WebSocket connections establish successfully on both ports  
✅ No more InvalidDataException: Reading 'target' as String failed  
✅ Stable real-time annotation and communication features

### **Testing Status:** ⚠️ Awaiting verification - SignalR connection testing required
