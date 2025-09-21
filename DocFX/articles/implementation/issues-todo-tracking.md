# NOOR Canvas Issues & TODO Tracking

> **Last Updated:** September 15, 2025  
> **Active Issues:** 2 Critical, 1 In Progress  
> **Completed TODOs:** 2 Major Items  
> **Overall Health:** 🟡 **Good** - Minor blockers, strong progress

## 🚨 Critical Issues (Immediate Attention Required)

### ❌ Issue-53: CreateSession HttpClient BaseAddress Error

**Priority:** 🔥 **CRITICAL** - Blocking session creation workflow  
**Status:** ❌ **Not Started** - Requires immediate attention  
**Impact:** Prevents session creation after host authentication

#### Problem Summary:

CreateSession.razor component fails to initialize after successful host authentication due to HttpClient BaseAddress configuration issue.

#### Technical Details:

```csharp
// ❌ BROKEN PATTERN (Current Issue)
@inject HttpClient Http
var response = await Http.GetFromJsonAsync("api/endpoint");
// Fails: BaseAddress not set

// ✅ REQUIRED FIX (Proven Working)
@inject IHttpClientFactory HttpClientFactory
using var httpClient = HttpClientFactory.CreateClient("default");
var response = await httpClient.GetFromJsonAsync("api/endpoint");
```

#### Root Cause:

- CreateSession component using direct HttpClient injection (anti-pattern)
- HttpClientFactory pattern works in Landing.razor and Host.razor
- Albums dropdown fails to load from KSESSIONS database

#### Resolution Requirements:

1. **Update CreateSession.razor** - Replace HttpClient with HttpClientFactory pattern
2. **Test Album Loading** - Verify KSESSIONS database connectivity
3. **Validate Session Creation** - End-to-end session creation workflow
4. **Update Documentation** - Document HttpClientFactory as standard pattern

#### Business Impact:

- **Host Experience Broken** - Hosts cannot create new sessions
- **Development Blocked** - Phase 4 progress depends on session creation
- **User Testing Impossible** - Cannot demonstrate core functionality

---

### ❌ Issue: Dual URL Architecture Implementation

**Priority:** 🔥 **CRITICAL** - Major architectural change required  
**Status:** ❌ **Not Started** - New requirement (September 15, 2025)  
**Complexity:** **High** - Database schema changes and routing overhaul

#### Architectural Change Required:

**Current System (Needs Replacement):**

```
Single landing page: https://localhost:9091/
GUID-exposed URLs: https://localhost:9091/join/5ec82d65-2f89-...
Dual authentication panels on same page
```

**Target System (Implementation Required):**

```
Host URL: https://localhost:9091/host/P7X9K2M4
User URL: https://localhost:9091/user/H5T3R8W6
Clean 8-character tokens, no GUID exposure
```

#### Implementation Requirements:

1. **Database Schema Changes:**
   - Create `SecureTokens` table with Host/User token pairs
   - Token lifecycle management (creation, expiry, revocation)
   - Audit trail for security compliance

2. **Token Generation Service:**
   - 8-character human-friendly tokens (A-Z, 2-9 character set)
   - Exclude confusing characters (0/O, 1/I) for phone/SMS sharing
   - Cryptographically secure randomization
   - Collision detection and retry logic

3. **URL Routing System:**
   - `/host/{token}` endpoint with Host authentication
   - `/user/{token}` endpoint with User welcome experience
   - Token validation middleware
   - Proper error handling for invalid/expired tokens

4. **Landing Page Architecture:**
   - Split current unified landing page
   - Host-only landing page (remove User card)
   - User Welcome page (convert from User Welcome.html mock)
   - Maintain responsive design and animations

5. **HostProvisioner Integration:**
   ```
   Enhanced Output Format:
   ======================================================
   SessionID: 215
   Host URL: https://localhost:9091/host/P7X9K2M4
   User URL: https://localhost:9091/user/H5T3R8W6
   ======================================================
   ```

#### Security & UX Benefits:

- **No GUID Exposure** - Completely opaque 8-character tokens
- **Human-Friendly** - Easy to share via phone/SMS
- **Professional URLs** - Clean, short format for business use
- **Enhanced Security** - Expirable tokens with revocation capability
- **SMS-Friendly** - Fits easily in text messages (40 characters total)

#### Implementation Complexity:

- **Database Migration Required** - Schema changes with data preservation
- **Routing Changes** - Major URL structure modification
- **Component Refactoring** - Landing page split and authentication flow
- **Security Implementation** - Token generation and validation systems
- **Testing Requirements** - Comprehensive security and UX testing

---

## ⚡ Issues In Progress

### ⚡ Phase 4: External Library Integration

**Priority:** 🟡 **Medium** - Required for CSS implementation  
**Status:** ⚡ **In Progress** - Week 13 Day 3-4  
**Completion Target:** September 18, 2025

#### Current Progress:

- ✅ **Directory Structure Planned** - lib/tailwind, lib/fontawesome, lib/fonts/inter
- ✅ **Download Commands Ready** - PowerShell script prepared for execution
- 🔄 **Integration In Progress** - Local asset download and configuration

#### Remaining Work:

- **Execute Download Script** - Download 4.8MB of external libraries locally
- **Update Layout Files** - Replace CDN references with local assets
- **Validation Testing** - Ensure offline functionality and correct loading
- **Project Configuration** - Update .csproj to exclude development files

#### Libraries Being Integrated:

1. **Tailwind CSS v3.4** (~3.4MB) - Complete utility class library
2. **Font Awesome 6.5.1** (~1.2MB + WebFonts) - Icon system
3. **Google Fonts Inter** (~200KB) - Typography system (weights 400-700)

---

## ✅ Recently Completed TODOs

### ✅ TODO-1: COPILOT-WORKSPACE-INSTRUCTIONS.md TODO Handling

**Completed:** September 15, 2025  
**Implementation Summary:** Updated workspace instructions to track TODO prompts in IMPLEMENTATION-TRACKER.MD using exact same format as issues.

#### Key Changes Applied:

- **Tracking Location Changed** - From NC-ISSUE-TRACKER.MD → IMPLEMENTATION-TRACKER.MD
- **Documentation Format** - TODOs get detailed sections with technical implementation
- **Lifecycle Management** - Same status progression as issues (❌ → ⚡ → ⏳ → ✅)
- **History Preservation** - Completed TODOs preserved as implementation history

#### Technical Impact:

- **Unified Documentation** - All implementation work in single comprehensive document
- **Enhanced Tracking** - Full lifecycle management with visual status indicators
- **Single Source of Truth** - IMPLEMENTATION-TRACKER.MD as canonical development reference

### ✅ TODO-2: NCDOC Orphaned Windows Issue Resolution

**Completed:** September 15, 2025  
**Implementation Summary:** Complete elimination of orphaned PowerShell windows when serving DocFX documentation.

#### Problem Resolved:

- **Original Issue** - ncdoc created persistent PowerShell windows using `Start-Process -NoExit`
- **User Impact** - Orphaned windows cluttered taskbar, required manual cleanup
- **Technical Debt** - Complex parent-child process relationships, difficult server management

#### Solution Implemented:

- **Background Jobs** - Replaced `Start-Process` with `Start-Job` for invisible execution
- **Enhanced Tracking** - Job ID format instead of PID-only tracking
- **Simplified Architecture** - Removed Python HTTP server, DocFX serve as primary
- **Clean Termination** - Proper job lifecycle management

#### Technical Changes:

```powershell
# Before (Problematic)
$proc = Start-Process -FilePath $psExe -ArgumentList $args -WindowStyle Minimized

# After (Clean)
$job = Start-Job -ScriptBlock {
    param($docfxPath, $port)
    Set-Location $docfxPath
    & docfx serve _site --port $port
} -ArgumentList $docfxRoot, $Port
```

#### User Experience Impact:

- ✅ **Zero Window Clutter** - No orphaned PowerShell windows in taskbar
- ✅ **Clean Background Operation** - Server runs invisibly without user interaction
- ✅ **Reliable Termination** - `ncdoc -Stop` properly cleans up background jobs
- ✅ **Same Interface** - All existing parameters and functionality preserved

---

## 📋 Upcoming TODOs (Planned)

### 🔄 TODO-3: External Library Integration (Week 13)

**Priority:** 🟡 **Medium** - Prerequisite for CSS implementation  
**Status:** 🔄 **In Progress** - Currently being executed  
**Target Completion:** September 18, 2025

#### Implementation Plan:

1. **Execute Download Script** - Download Tailwind CSS, Font Awesome, Inter fonts
2. **Directory Organization** - Structured lib/ folder with proper asset organization
3. **Layout Integration** - Update \_Layout.cshtml with local asset references
4. **Validation Testing** - Offline functionality and correct asset loading

### ⏳ TODO-4: CSS Modular Architecture Implementation (Week 13-14)

**Priority:** 🟡 **Medium** - Core Phase 4 deliverable  
**Status:** ⏳ **Awaiting** - Depends on TODO-3 completion  
**Target Completion:** September 25, 2025

#### Planned Deliverables:

- **6 Modular CSS Files** - Page-specific styling based on design mocks
- **CSS Architecture** - Color variables, typography system, layout utilities
- **Component Integration** - Apply styling to existing Blazor components
- **Responsive Validation** - Mobile and desktop breakpoint testing

### ⏳ TODO-5: SecureTokens Database Schema (Week 15)

**Priority:** 🔥 **High** - Critical for Dual URL Architecture  
**Status:** ❌ **Not Started** - Major architectural change  
**Target Completion:** October 2, 2025

#### Implementation Requirements:

- **Database Table Creation** - SecureTokens with Host/User token pairs
- **Migration Scripts** - EF Core migration for schema changes
- **Token Service Implementation** - 8-character secure token generation
- **Validation Middleware** - Token authentication and expiry handling

---

## 📊 Progress Dashboard

### Issue Resolution Health

- **Critical Issues:** 2 (Need immediate attention)
- **In Progress Issues:** 1 (On track)
- **Recently Resolved:** 2 major TODOs completed
- **Overall Status:** 🟡 **Good** with minor blockers

### Key Success Metrics

- **Phase 3 Completion:** ✅ **100%** - All advanced features delivered
- **Phase 4 Progress:** 🔄 **25%** - Week 13 initial deliverables complete
- **Backend Stability:** ✅ **95%** - Core infrastructure operational
- **Frontend Progress:** 🔄 **70%** - UI framework ready, styling in progress
- **Tool Integration:** ✅ **90%** - Command suite enhanced and operational

### Technical Debt Status

- **Code Quality:** 🟢 **Good** - Enhanced debug infrastructure implemented
- **Documentation:** 🟢 **Excellent** - Comprehensive tracking and user guides
- **Testing Coverage:** 🟡 **Moderate** - 120+ test cases, needs expansion for new features
- **Performance:** 🟢 **Good** - Target metrics being achieved

---

## 🎯 Action Items & Next Steps

### Immediate Priorities (This Week)

1. **Issue-53 Resolution** - Fix CreateSession HttpClient pattern (🔥 **CRITICAL**)
2. **External Library Integration** - Complete TODO-3 local asset download
3. **CSS Architecture Planning** - Prepare for modular CSS implementation

### Short-term Goals (Next 2 Weeks)

1. **Complete Phase 4 Week 13** - External libraries and initial CSS files
2. **Begin Dual URL Architecture** - Database schema design and planning
3. **Component Styling** - Apply NOOR Canvas branding to existing components

### Long-term Objectives (Phase 4 Completion)

1. **Visual Design Implementation** - Pixel-perfect mock reproduction
2. **Security Enhancement** - Complete token-based authentication system
3. **Performance Optimization** - CSS loading and animation performance
4. **Documentation Completion** - Final user guides and technical references

---

> **Summary:** Strong technical foundation with 2 critical issues requiring immediate attention. Phase 4 CSS implementation progressing well with enhanced debug infrastructure and completed TODO items. Dual URL architecture represents significant scope expansion requiring careful planning and execution.
