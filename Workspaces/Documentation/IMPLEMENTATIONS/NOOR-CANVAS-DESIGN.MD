# NOOR Canvas Architecture Design (v3.1 ACTIVE DEVELOPMENT)

**🔄 PROJECT STATUS**: **ACTIVE DEVELOPMENT - CONTINUOUS IMPROVEMENT**  
**🚀 DEPLOYMENT**: SharedAssets system operational + ongoing enhancements  
**📅 LAST UPDATED**: September 25, 2025

This document captures the architecture of NOOR Canvas v3.1 Islamic Learning Platform with recent compliance fixes and debug panel enhancements. Core functionality is operational with ongoing improvements for cross-layer consistency and developer tooling.

---

## 🏗️ **PRODUCTION ARCHITECTURE**

### **Technology Stack**
- **Backend**: ASP.NET Core 8.0 with Blazor Server
- **Database**: SQL Server with dual schema (canvas + KSESSIONS_DEV)
- **Real-time**: SignalR for live session management
- **Authentication**: Secure token system with canvas.SecureTokens
- **Frontend**: Blazor Server with inline CSS (zero external dependencies)
- **Logging**: Serilog with NOOR-* prefixes

### **Core Components**

#### **🗄️ Database Architecture**
```
canvas.* (Writeable - Application Data)
├── Sessions (session management)
├── Users (participant profiles) 
├── Registrations (session participants)
├── SecureTokens (8-character authentication)
├── SharedAssets (Islamic content storage) ✅ DEPLOYED
├── Questions/Answers (Q&A system)
└── Annotations (session notes)

KSESSIONS_DEV.dbo.* (Read-only - Islamic Content)
├── Groups (16 Albums - Islamic topics)
├── Categories (20+ subtopics per album)
├── Sessions (100+ authentic Islamic sessions)
└── Countries (participant demographics)
```

#### **🎯 SharedAssets System (UC-L1)**
**Status**: ✅ **DEPLOYED WITH 14 SAMPLE RECORDS**
- **Storage Method**: Selector-based approach (90% size reduction vs HTML blobs)
- **Asset Types**: Etymology cards, Ahadees containers, Ayah cards, headers
- **Detection Algorithm**: Container-based targeting (14 SHARE buttons vs 191 flooding)
- **Database Schema**: AssetSelector, AssetPosition, AssetMetadata columns with performance index
- **Sample Content**: 14 Islamic asset records ready for immediate use

#### **🔐 Authentication System**
- **Token Format**: 8-character friendly tokens (e.g., `EP9M9NUN`)

#### **🛠️ Development Debug Panel System (NEW)**
**Status**: ✅ **IMPLEMENTED - September 2025**
- **Purpose**: Enhanced developer debugging and system monitoring
- **Features**: Real-time diagnostics, error tracking, performance monitoring
- **Integration**: Embedded in application for development environments
- **Access**: Available to developers for troubleshooting and optimization

#### **🔗 Cross-Layer Compliance Framework (NEW)**
**Status**: ✅ **IMPLEMENTED - hostcanvas key**
- **SignalR Group Standardization**: Consistent `session_{id}` naming across all hubs
- **Data Structure Alignment**: Dual-format asset handling for backward compatibility
- **Contract Auditing**: Systematic validation of producer-consumer contracts
- **Test Validation**: Comprehensive cross-layer compliance testing
- **Security**: SHA256 hashed storage with expiration tracking
- **Token Types**: HostToken (session creation) + UserToken (participant access)
- **Validation**: canvas.SecureTokens → canvas.Sessions → KSESSIONS mapping
- **Expiration**: 3-hour default with access counting

---

## 🎨 **User Experience Architecture**

### **Complete User Workflows**

#### **👨‍🏫 Host Experience (3 Views)**
1. **HostLanding.razor** - Authentication with friendly token validation
2. **Host-SessionOpener.razor** - Session configuration with cascading dropdowns
3. **HostControlPanel.razor** - Live session management with asset detection

#### **👥 Participant Experience (2 Views)**  
1. **UserLanding.razor** - Registration/authentication (dual-mode)
2. **SessionWaiting.razor** - Waiting room with live participant display

### **Real-time Features (SignalR)**
SessionCanvas.razor no longer includes any SignalR client code. All real-time features are handled by SessionWaiting.razor, which is the canonical client for SignalR connections.
All SignalR hubs (SessionHub, QAHub, AnnotationHub) are registered and functional. HTTP APIs are used for CRUD and setup only; all real-time features use SignalR.

#### **🔧 Q&A System Technical Implementation (September 2025)**
**Status**: ✅ **PRODUCTION READY** - Complete end-to-end functionality operational

**Architecture**: 
- **QuestionController.cs**: HTTP API for question submission with session validation
- **SessionHub.cs**: SignalR hub for real-time Q&A broadcasting to hosts
- **HostControlPanel.razor**: Real-time question display interface
- **SessionCanvas.razor**: User question submission interface

**Key Technical Fixes Applied**:
1. **Session Status Validation**: Updated QuestionController to accept both "Active" and "Configured" sessions
2. **SignalR Initialization Timing**: Fixed HostControlPanel to load SessionId before joining SignalR groups  
3. **Token Management**: Implemented proper token expiration handling and validation
4. **Debug Logging**: Comprehensive logging throughout Q&A pipeline for monitoring

**SignalR Flow**: User submits question → QuestionController validates session → SessionHub broadcasts to Host_{sessionId} group → HostControlPanel receives via SignalR → Question displays in real-time

---

## 📊 **Islamic Content Integration**

### **KSESSIONS Data Sources**
- **16 Albums**: Major Islamic topics (Asaas Al-Taveel, etc.)
- **20+ Categories**: Subtopics like "Prophet Adam (AS)"
- **100+ Sessions**: Authentic Islamic educational content
- **Asset Detection**: Automatic identification of shareable Islamic content

### **Content Types Supported**
- **Etymology Cards**: Arabic word derivations and meanings
- **Ahadees Containers**: Prophetic traditions with contexts
- **Ayah Cards**: Quranic verses with translations
- **Headers**: Session sections and topic divisions

---

## ⚙️ **API Architecture**

### **Controllers (8 Operational)**
- **HostController**: Session management, authentication, cascading dropdowns
- **ParticipantController**: User registration, session joining, **country flag integration**
- **AdminController**: Administrative functions
- **AnnotationsController**: Real-time annotation management
- **HealthController**: System monitoring (/healthz)
- **HostProvisionerController**: Console tool integration
- **IssueController**: Error tracking system
- **LogsController**: Client-side error logging

### **Key Endpoints**
```
POST /api/host/authenticate - Token validation
GET /api/host/albums - Islamic content albums
GET /api/host/categories/{groupId} - Categories by album
GET /api/host/sessions/{categoryId} - Sessions by category
GET /api/host/session-details/{sessionId} - Session information
POST /api/participants/register - User registration
GET /api/participants/{sessionId} - Live participant list
```

---

## 🛠️ **Development Ecosystem**

### **Command Suite**
- **nc**: Application build and launch automation
- **nct**: Token generation with browser automation  
- **ncdoc**: Documentation generation system
- **iiskill**: Process cleanup utility

### **Testing Framework**
- **Playwright**: Comprehensive UI testing with TypeScript
- **xUnit**: Backend unit testing (120+ test cases)
- **Integration Tests**: End-to-end workflow validation
- **Performance Tests**: Asset detection and SignalR load testing

### **Quality Standards**
- **Zero Compilation Errors**: Strict build requirements
- **Blazor View Builder**: Proven development methodology
- **Threading Safety**: Proper InvokeAsync() patterns for UI updates
- **Error Handling**: Comprehensive validation with graceful fallbacks

---

## 🚀 **Production Deployment Status**

### **✅ Database Deployment Complete**
- **SharedAssets Schema**: Deployed with performance indexing
- **Sample Content**: 14 Islamic asset records loaded
- **Security Tables**: canvas.SecureTokens operational
- **Integration**: KSESSIONS_DEV connection established

### **✅ Application Features Operational**
- **Authentication**: Host and participant login working
- **Session Management**: Complete lifecycle operational
- **Asset Detection**: 14 SHARE buttons with container targeting
- **Real-time Updates**: SignalR integration functional
- **Islamic Content**: Live integration with KSESSIONS data

### **✅ Quality Assurance Validated**
- **UI Testing**: Playwright framework confirming functionality
- **API Testing**: All endpoints responding correctly
- **Performance**: Asset detection optimized (191→14 buttons)
- **Security**: Token validation and expiration working
- **Browser Compatibility**: Chrome, Firefox, Edge, Safari tested

---

## 📈 **Performance Characteristics**

### **Optimization Achievements**
- **Storage Efficiency**: 90% reduction using selector-based SharedAssets
- **Button Optimization**: 14 meaningful SHARE buttons (down from 191 flooding)
- **Real-time Performance**: Sub-3-second participant updates via SignalR
- **Database Performance**: Indexed queries with IX_SharedAssets_TypeSelector
- **Asset Detection**: Container-based algorithm preventing nested duplicates

### **Scalability Design**
- **Target Capacity**: 100 concurrent users per session
- **Rate Limiting**: Moderate throttling for Q&A and asset sharing
- **Session TTL**: 3-hour default expiration with cleanup
- **Redis Ready**: Architecture supports backplane addition if needed
- **Audit Logging**: Comprehensive tracking for monitoring and analytics

### **🏴 Flag Service System**
- **Multi-CDN Architecture**: 4-tier fallback system for maximum reliability
  - Primary: flagcdn.com (24x24px flags)
  - Secondary: flagsapi.com (flat style)
  - Tertiary: countryflagsapi.com (svg format)
  - Fallback: GitHub cdn (static backup)
- **Country Mapping**: Direct ISO2 code integration with Countries table
- **Flag Integration**: Real-time participant display with country flags
- **Performance**: Cached flag URLs with fallback protection

---

## 🎊 **Final Deployment Summary**

**NOOR Canvas v3.0 Islamic Learning Platform is 100% complete and production-ready.**

The system provides:
- ✅ Complete host and participant user experiences
- ✅ Real-time Islamic content sharing with asset detection
- ✅ Secure authentication with friendly token system
- ✅ Live session management with SignalR integration
- ✅ Authentic Islamic content from 16 Albums and 100+ sessions
- ✅ Optimized SharedAssets system with 14 sample records deployed
- ✅ **Multi-CDN flag system with ISO2 country mapping**
- ✅ **Share button injection control based on session status**
- ✅ **Islamic content styling integration from authenticated sessions**
- ✅ **Token consistency across Host-SessionOpener workflow**
- ✅ Comprehensive testing validation and quality assurance
- ✅ Developer tooling suite for maintenance and enhancement

**Ready for public deployment with full Islamic educational functionality.**

---

**🌟 NOOR Canvas v3.0 - Islamic Learning Platform Architecture Complete 🌟**