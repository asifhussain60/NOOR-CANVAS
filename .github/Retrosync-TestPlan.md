# Retrosync Test Plan: Diagnostic Markers Confirmation

**Generated**: September 25, 2024  
**Focus**: Validate temporary diagnostics implementation and documentation synchronization  
**Environment**: NOOR Canvas Development Environment

---

## 🧪 **TEST PLAN CONTRACT**

### **Routes & Endpoints**
- **Host Control Panel**: `/host/control-panel/{sessionId}`
- **Session Canvas**: `/session/canvas/{sessionToken}`
- **SignalR Hub**: `/sessionhub` (ShareAsset method)

### **Tokens & Credentials**
- **Session ID**: Use existing session from database
- **User Token**: 8-character friendly token (from canvas.SecureTokens)
- **Host Auth Token**: 36-character UUID token

### **Setup Instructions**
1. **Environment Variables**: Default ports 9090 (HTTP), 9091 (HTTPS)
2. **Database State**: canvas database with active session and SecureTokens
3. **Application State**: NoorCanvas application running with SignalR enabled

---

## ✅ **VALIDATION STEPS**

### **Step 1: Confirm Diagnostic Markers Present**
```powershell
# Search for DEBUG-WORKITEM:canvas markers
cd "d:\PROJECTS\NOOR CANVAS"
Select-String -Pattern "DEBUG-WORKITEM:canvas" -Path "SPA\NoorCanvas\Pages\*.razor" -AllMatches
```

**Expected Output**: 22 matches across SessionCanvas.razor and HostControlPanel.razor

### **Step 2: Verify SignalR Hub Markers**
```powershell
Select-String -Pattern "NOOR-HUB-" -Path "SPA\NoorCanvas\Hubs\*.cs" -AllMatches
```

**Expected Output**: 21 matches in SessionHub.cs for connection and asset sharing logging

### **Step 3: Test Asset Sharing Pipeline**
1. **Navigate to Host Control Panel** with valid session
2. **Click "Test Share Asset" button**
3. **Open Session Canvas** in separate browser/tab
4. **Verify complex HTML content appears** in canvas area

**Expected Outputs**:
- Complex HTML with gradients, emojis, and interactive elements displays
- Console logs show complete pipeline: NOOR-TEST → NOOR-HUB-SHARE → NOOR-CANVAS-SHARE

### **Step 4: Verify Documentation Synchronization**
```powershell
# Check updated files exist
Test-Path ".github\TestShareAsset-Fix-Summary.md"
Test-Path ".github\Retrosync-Diagnostics-Analysis.md"
Select-String -Pattern "TESTSHAREASSET FIX" -Path "Workspaces\Documentation\IMPLEMENTATIONS\ncImplementationTracker.MD"
```

**Expected Outputs**:
- TestShareAsset-Fix-Summary.md exists and contains fix details
- ncImplementationTracker.MD updated with September 2024 TestShareAsset fix section
- SelfAwareness.instructions.md contains new lesson about SignalR event handlers

### **Step 5: Validate Application Build**
```powershell
cd "SPA\NoorCanvas"
dotnet build --no-restore
```

**Expected Output**: Successful build with no compilation errors (warnings about file locking acceptable if app running)

---

## 🎯 **SUCCESS CRITERIA**

### **Functional Validation** ✅
- [ ] All 22 DEBUG-WORKITEM:canvas markers found in expected locations
- [ ] All 21 NOOR-HUB markers present in SessionHub.cs
- [ ] TestShareAsset button successfully shares complex HTML to SessionCanvas
- [ ] Asset sharing pipeline shows complete logging chain in console

### **Documentation Validation** ✅  
- [ ] TestShareAsset-Fix-Summary.md created with comprehensive fix details
- [ ] ncImplementationTracker.MD updated with September 2024 fix section
- [ ] SelfAwareness.instructions.md contains new SignalR lesson
- [ ] Retrosync-Diagnostics-Analysis.md confirms temporary diagnostics

### **Technical Validation** ✅
- [ ] Application builds successfully with all markers in place
- [ ] SignalR connection established and functional
- [ ] Complex HTML content (CSS gradients, emojis, Unicode) renders correctly
- [ ] No regression in existing SessionCanvas or HostControlPanel functionality

---

## 📋 **CLEANUP READINESS ASSESSMENT**

### **Markers Ready for Future Cleanup** (via /cleanup)
- **SessionCanvas.razor**: 20 `[DEBUG-WORKITEM:canvas:*]` markers
- **HostControlPanel.razor**: 2 `[DEBUG-WORKITEM:canvas:*]` markers

### **Markers to Preserve**
- **SessionHub.cs**: All NOOR-HUB markers (operational logging)
- **Asset Sharing**: NOOR-TEST and NOOR-CANVAS-SHARE (ongoing validation)

### **State Files for Cleanup**
- `Workspaces\Copilot\retrosync\*` (after approval)
- `Workspaces\Copilot\canvas\*` (retain for ongoing work)

---

## 🚦 **APPROVAL GATE**

**Retrosync is ready for approval. Review:**
1. **Evidence Analysis**: Diagnostic markers confirmed per user request
2. **Documentation Updates**: All tracking files synchronized with current implementation
3. **Test Plan**: Comprehensive validation steps for marker presence and functionality
4. **Cleanup Preparation**: Ready for future marker cleanup while preserving operational logging

**On Approval**: Apply all documentation updates and prepare diagnostic marker cleanup recommendations  
**On No Approval**: Keep documents unchanged and summarize delta findings