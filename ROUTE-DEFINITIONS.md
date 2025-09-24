# NOOR Canvas Route Definitions - Complete Reference

This document provides a comprehensive overview of all routes defined in the NOOR Canvas application.

## 📍 **Main Route Configuration File**
- **Primary File**: `SPA/NoorCanvas/Program.cs` (Lines 163-250)
- **Blazor Router**: `SPA/NoorCanvas/App.razor`

---

## 🌐 **HTTP Routes (Program.cs)**

### **Core Application Routes**
```csharp
// Configure endpoints
app.MapRazorPages();              // Maps all Razor Pages
app.MapBlazorHub();              // Maps Blazor SignalR Hub
app.MapControllers();            // Maps all API Controllers
app.MapFallbackToPage("/_Host"); // Fallback to _Host page
```

### **Testing & Development Routes**
```csharp
// Testing suite route
app.MapGet("/testing/{**catchall}", ...).WithName("TestingSuite");

// Health check endpoint
app.MapGet("/healthz", () => new { status = "ok", timestamp = DateTime.UtcNow, version = "1.0.0-phase1" });

// Observer stream (Development only)
app.MapGet("/observer/stream", ...) // Server-Sent Events endpoint
```

### **SignalR Hub Routes**
```csharp
app.MapHub<SessionHub>("/hub/session");        // Session real-time communication
app.MapHub<QAHub>("/hub/qa");                  // Q&A real-time communication
app.MapHub<AnnotationHub>("/hub/annotation");  // Annotation real-time communication
```

---

## 📄 **Blazor Page Routes (@page directives)**

### **Host Routes**
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HostLanding.razor | Root landing page |
| `/host/{friendlyToken?}` | HostLanding.razor | Host landing with token |
| `/host/landing` | HostLanding.razor | Host landing alternative |
| `/host/control-panel/{hostToken}` | HostControlPanel.razor | Host control panel |
| `/host/session-manager` | HostSessionManager.razor | Session management |
| `/host/session-opener` | Host-SessionOpener.razor | Session opener |

### **User/Participant Routes**
| Route | Component | Description |
|-------|-----------|-------------|
| `/user/landing` | UserLanding.razor | User landing page |
| `/user/landing/{sessionToken?}` | UserLanding.razor | User landing with token |
| `/landing` | UserLanding.razor | Landing alternative |
| `/participant/register` | ParticipantRegister.razor | Participant registration |

### **Session Routes**
| Route | Component | Description |
|-------|-----------|-------------|
| `/session/waiting/{sessionToken?}` | SessionWaiting.razor | Session waiting room |
| `/session/canvas/{sessionToken?}` | SessionCanvas.razor | Main session canvas |

### **Development & Testing Routes**
| Route | Component | Description |
|-------|-----------|-------------|
| `/test-harness` | SessionTestHarness.razor | Testing harness |
| `/test-harness/{mode}` | SessionTestHarness.razor | Testing harness with mode |
| `/visual-demo` | VisualDemo.razor | Visual demonstration |

---

## 🔌 **API Controller Routes**

### **AdminController** (`/api/admin`)
```csharp
[Route("api/[controller]")]
POST   /api/admin/authenticate                    // Admin authentication
GET    /api/admin/sessions                        // Get all sessions
POST   /api/admin/session/{sessionId}/terminate   // Terminate session
GET    /api/admin/users                           // Get all users
POST   /api/admin/user/{userId}/deactivate        // Deactivate user
```

### **HostController** (`/api/host`)
```csharp
[Route("api/[controller]")]
POST   /api/host/authenticate                     // Host authentication
POST   /api/host/session/create                   // Create new session
POST   /api/host/session/{sessionId}/end          // End session
GET    /api/host/albums                           // Get Islamic content albums
GET    /api/host/categories/{albumId}             // Get categories by album
GET    /api/host/sessions/{categoryId}            // Get sessions by category
GET    /api/host/countries                        // Get countries list
POST   /api/host/generate-token                   // Generate host token
```

### **AnnotationsController** (`/api/annotations`)
```csharp
[Route("api/[controller]")]
// Annotation management endpoints
```

### **QuestionController** (`/api/question`)
```csharp
[Route("api/[controller]")]
POST   /api/question/{questionId}/vote            // Vote on question
GET    /api/question/session/{sessionToken}       // Get questions for session
```

### **LogsController** (`/api/logs`)
```csharp
[Route("api/[controller]")]
POST   /api/logs                                  // Receive browser logs
```

### **HostProvisionerController** (`/api/hostprovisioner`)
```csharp
[Route("api/[controller]")]
POST   /api/hostprovisioner/generate              // Generate host token
GET    /api/hostprovisioner/status                // Get status
```

### **TokenController** (`/api/token`)
```csharp
[Route("api/[controller]")]
// Token management endpoints
```

---

## 🔧 **Route Configuration Details**

### **Static File Routes**
- **wwwroot**: All static files served from web root
- **Testing Suite**: `/testing/` directory mapped via MapGet handler

### **Fallback Behavior**
```csharp
app.MapFallbackToPage("/_Host"); // All unmatched routes fall back to _Host page
```

### **CORS Configuration** (Development Only)
```csharp
policy.WithOrigins("https://localhost:9090", "https://localhost:9091", 
                   "http://localhost:9090", "http://localhost:9091")
```

### **Development-Only Routes**
- `/observer/stream` - Server-Sent Events for debugging
- Enhanced CORS policies
- Debug middleware (currently disabled)

---

## 🏗️ **Route Architecture Notes**

### **Token-Based Routing**
- Host routes use `{hostToken}` or `{friendlyToken}`
- User routes use `{sessionToken}`
- Optional parameters marked with `?`

### **Cascading Dropdown API Pattern**
```
/api/host/albums → /api/host/categories/{albumId} → /api/host/sessions/{categoryId}
```

### **Real-time Communication Hubs**
- All SignalR hubs under `/hub/` prefix
- Separate hubs for different functionalities (session, qa, annotation)

### **Health Check Endpoints**
- `/healthz` - Simple health check
- Controller-based health checks also available

---

## 📊 **Route Summary**
- **Blazor Pages**: 8 main pages with 15+ route patterns
- **API Controllers**: 7 controllers with 20+ endpoints  
- **SignalR Hubs**: 3 real-time communication hubs
- **Static Routes**: Testing suite, health checks, observer stream
- **Total Routes**: 40+ distinct route patterns

This routing architecture supports the complete NOOR Canvas Islamic content sharing platform with host control panels, user participation, real-time communication, and administrative functions.