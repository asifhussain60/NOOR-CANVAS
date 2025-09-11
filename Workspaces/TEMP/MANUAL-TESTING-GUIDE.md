# NOOR Canvas Manual Testing Guide

**Project**: NOOR Canvas v3.0 FINAL  
**Created**: September 11, 2025  
**Status**: Phase 1-3 Features Ready for Testing  

---

## ⚠️ IMPORTANT - CLEANUP NOTICE
**This document is temporary and must be deleted during final project cleanup.**  
**Location**: `D:\PROJECTS\NOOR CANVAS\Workspaces\TEMP\MANUAL-TESTING-GUIDE.md`  
**Cleanup Phase**: Phase 6 (Testing & Deployment) - Final cleanup step  

---

## Prerequisites & Setup

### Environment Setup
- Application running on `localhost:9090` (HTTP) or `localhost:9091` (HTTPS)
- Launch via: `.\Workspaces\Global\ncrun.ps1` or global `nsrun` command
- Multiple browser windows/tabs for multi-user testing scenarios
- Developer tools open for monitoring console logs and network activity

### Browser Requirements
- **Primary**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: Enabled (required for SignalR and client logging)
- **Console Access**: F12 Developer Tools for log monitoring

---

## Phase 1 Features Testing (Infrastructure & Observability)

### 1. Application Startup & Health ✅
**Purpose**: Verify core application infrastructure and startup sequence  
**Test Steps**:
1. Navigate to application root URL (`http://localhost:9090` or `https://localhost:9091`)
2. Observe browser console during page load
3. Check for successful page rendering without errors

**Expected Results**:
- Landing page loads within 3 seconds
- Console shows NOOR-INIT message with Blazor mode and environment
- Console shows NOOR-BROWSER message with logger initialization
- No red error messages in browser console

**Verification Logs**:
```
[INFO] NOOR-INIT: NOOR Canvas application loaded {blazorMode: 'ServerPrerendered', environment: 'Development'}
[INFO] NOOR-BROWSER: Browser logger initialized {logLevel: 'INFO', sessionId: null, userId: null}
```

### 2. Health Endpoint Monitoring ✅
**Purpose**: Verify health monitoring and diagnostics endpoint  
**Test Steps**:
1. Open new browser tab
2. Navigate to `/healthz` endpoint
3. Observe JSON response structure

**Expected Results**:
- HTTP 200 OK status
- Valid JSON response with health status information
- Response time under 500ms

**Alternative Test**: PowerShell command
```powershell
Invoke-WebRequest -Uri 'https://localhost:9091/healthz' -SkipCertificateCheck
```

### 3. Client-Side Logging System ✅
**Purpose**: Verify JavaScript logging utility and browser-to-server integration  
**Test Steps**:
1. Open browser developer tools (F12)
2. Navigate through the application pages
3. Trigger various user interactions
4. Monitor console for structured NOOR- prefixed log messages
5. Check `/observer/stream` endpoint for real-time logs

**Expected Results**:
- Color-coded console logs with timestamps
- NOOR- prefixed messages for all major events
- Structured JSON payloads in log entries
- WARN+ level logs transmitted to server automatically

### 4. SignalR Connection & Protocols ✅
**Purpose**: Verify real-time communication infrastructure  
**Test Steps**:
1. Load application with developer tools open
2. Go to Network tab, filter by WebSocket (WS)
3. Observe SignalR connection establishment
4. Look for protocol negotiation messages

**Expected Results**:
- WebSocket connection to `wss://localhost:9091/_blazor`
- Connection established message in console
- Both 'json' and 'blazorpack' protocols available
- Automatic reconnection on network interruption

**Verification Logs**:
```
[Information] WebSocket connected to wss://localhost:9091/_blazor?id=...
[INFO] BLAZOR-STARTUP: Blazor server connection auto-established
```

---

## Phase 2 Features Testing (Authentication & Core UI)

### 5. Host/User Landing Page & Routing ✅
**Purpose**: Verify role-based navigation and routing system  
**Test Steps**:
1. Navigate to application root (`/`)
2. Verify landing page displays with role selection
3. Click "Host" button and observe routing
4. Return and click "Participant" button
5. Test direct URL navigation to `/host` and `/participant`

**Expected Results**:
- Landing page renders with clear role selection options
- McBeatch theme styling applied correctly
- Smooth navigation transitions without page refresh
- URL changes reflect selected routes
- No route conflicts or ambiguous routing

### 6. User Registration & Persistent Storage ✅
**Purpose**: Verify user profile management and localStorage persistence  
**Test Steps**:
1. Navigate to participant registration
2. Fill form: Name, City, Country (all required)
3. Submit registration
4. Check browser localStorage for UserId
5. Refresh browser and verify UserId persists
6. Test with same UserId across browser sessions

**Expected Results**:
- Form validation prevents empty required fields
- Unique UserId generated and stored in localStorage
- UserId persists across browser refresh/close/reopen
- Cross-session profile lookup works with same UserId
- Registration data saved to database

**LocalStorage Verification**:
```javascript
// Check in browser console
localStorage.getItem('noor-canvas-userId')
```

### 7. Session Management & Real-time Updates ✅
**Purpose**: Verify session creation, joining, and real-time state management  
**Test Steps**:
1. **Host Flow**: Create new session from host dashboard
2. **Participant Flow**: Join session using generated link
3. **Multi-User**: Open multiple browser windows as different participants
4. **State Changes**: Host begins session, observe participant auto-navigation
5. **Monitoring**: Check real-time participant count updates

**Expected Results**:
- Host can create sessions with unique session links
- Participants can join via session link validation
- Waiting room displays correct session information
- Auto-navigation triggers when host begins session
- Real-time participant count updates on host dashboard
- Session expiry (3h default) terminates connections properly

---

## Phase 3 Features Testing (Annotations & Advanced Features)

### 8. Annotation System & SVG Overlays ✅
**Purpose**: Verify real-time annotation tools and multi-user synchronization  
**Test Steps**:
1. Navigate to annotation demo page
2. Verify annotation toolbar loads (Select, Highlight, Draw, Note tools)
3. Create highlight annotation on sample content
4. Draw free-form annotation with different colors
5. Add note annotation with text content
6. Test annotation editing and deletion
7. **Multi-User**: Open second browser, verify annotations appear in real-time

**Expected Results**:
- Annotation JavaScript module loads without errors
- SVG overlay renders correctly over content
- All annotation tools (highlight, draw, note) function properly
- Annotations persist after page refresh
- Real-time broadcasting to all connected clients
- Annotation geometry renders accurately across users
- No conflicts with multiple simultaneous edits

**Verification Logs**:
```
NOOR-ANNOTATION: JavaScript module loaded and ready
```

### 9. Q&A System & Voting ✅
**Purpose**: Verify question submission, voting, and moderation features  
**Test Steps**:
1. Submit question as participant (test 280 character limit)
2. Upvote questions from different participant accounts
3. Test remove vote functionality
4. **Host View**: Check question queue and voter metadata
5. **Moderation**: Test host moderation capabilities

**Expected Results**:
- 280 character limit enforced on question submission
- Anonymous questions display for participants
- Voting system works (upvote/remove vote)
- Host can view voter metadata for moderation
- Question queue updates in real-time
- Vote totals update immediately across all clients

### 10. Asset Detection & Content Sharing ✅
**Purpose**: Verify content detection and real-time sharing system  
**Test Steps**:
1. Load content containing Islamic assets (Verse, Ayah, Hadith)
2. Test asset detection overlay system
3. Click Share button on detected assets
4. **Multi-User**: Verify asset broadcasts to all session participants
5. Test different content types and asset formats

**Expected Results**:
- Asset detection identifies content types correctly (Verse, Ayah, Hadith, etc.)
- Share button overlay appears on detectable content
- Asset payload constructed with proper metadata
- Real-time broadcasting reaches all session participants
- Shared assets display correctly for all recipients

---

## Multi-User Testing Scenarios (Phase 7 Preparation)

### 11. SignalR Multi-User Stress Testing
**Purpose**: Verify system stability under concurrent user load  
**Test Setup**:
1. Open 5+ browser windows/tabs as different users
2. Mix of host and participant roles
3. Simultaneous actions across all clients

**Test Scenarios**:
- **Concurrent Annotations**: Multiple users drawing simultaneously
- **Rapid Q&A**: Burst question submissions and voting
- **Asset Sharing Storm**: Multiple rapid asset shares
- **Connection Resilience**: Simulate network interruptions
- **Session State**: Users joining/leaving during active session

**Success Criteria**:
- All clients maintain synchronized state
- No message loss during concurrent operations
- Performance remains responsive (<200ms interactions)
- SignalR connections handle interruptions gracefully
- No memory leaks during extended sessions

### 12. Browser Compatibility Testing
**Purpose**: Verify cross-browser functionality and compatibility  
**Test Matrix**:
- **Chrome 90+**: Primary development browser
- **Firefox 88+**: Alternative WebKit engine
- **Safari 14+**: iOS/macOS compatibility
- **Edge 90+**: Windows integration

**Test Each Browser**:
1. Complete Phase 1-3 feature testing
2. SignalR connection and real-time features
3. Annotation system functionality
4. Performance and memory usage
5. Mobile responsive behavior (if applicable)

---

## Performance & Diagnostics

### Debug Mode Testing
**Purpose**: Verify enhanced debugging and observability features  
**Test Steps**:
1. Add `?debug=1` parameter to any URL
2. Observe enhanced logging output
3. Check `/observer/stream` for real-time diagnostics
4. Monitor server-side structured logging

**Expected Results**:
- Enhanced DEBUG level logging enabled
- Additional diagnostic information in console
- Real-time observer stream shows detailed events
- Server logs capture all debug events with context

### Performance Baseline
**Target Metrics**:
- **Page Load**: <3 seconds initial load
- **SignalR Connect**: <1 second connection establishment
- **Real-time Updates**: <200ms propagation delay
- **Annotation Rendering**: <100ms SVG overlay updates
- **Memory Usage**: Stable over 30+ minute sessions

---

## Troubleshooting & Common Issues

### SignalR Connection Issues
- **Symptoms**: No real-time updates, connection timeouts
- **Check**: WebSocket connection in Network tab
- **Fix**: Verify CORS configuration for development ports

### Annotation System Not Loading
- **Symptoms**: No annotation toolbar, JavaScript errors
- **Check**: Console for `NOOR-ANNOTATION: JavaScript module loaded and ready`
- **Fix**: Verify JavaScript files loaded correctly

### Local Storage Issues
- **Symptoms**: UserId not persisting, registration loops
- **Check**: Browser localStorage contents
- **Fix**: Clear localStorage and re-register

### Health Endpoint Failures
- **Symptoms**: 500 errors on `/healthz`
- **Check**: Database connectivity and server logs
- **Fix**: Verify connection strings and database availability

---

## Cleanup Instructions

### Before Project Deployment
1. **Delete this file**: `D:\PROJECTS\NOOR CANVAS\Workspaces\TEMP\MANUAL-TESTING-GUIDE.md`
2. **Clean TEMP folder**: Remove all testing artifacts
3. **Verify removal**: Ensure no testing documents remain in repository

### Final Verification
- [ ] Manual testing guide deleted
- [ ] TEMP folder cleaned
- [ ] No testing artifacts in final build
- [ ] Production configuration verified

---

**Document Status**: Active - Ready for Phase 1-3 Testing  
**Cleanup Required**: Phase 6 (Testing & Deployment)  
**Last Updated**: September 11, 2025
