# NOOR Canvas Issue Tracker

**Last Updated**: September 16, 2025  
**Status**: Active Development Issues  
**Purpose**: Track and manage implementation issues, bugs, and feature requests

---

## 🔴 **CRITICAL ACTIVE ISSUES**

### **Issue-101: UserLanding.razor Conditional Display Logic Missing**
**Created**: September 16, 2025  
**Priority**: HIGH  
**Status**: ACTIVE  
**Reporter**: User Feedback  

#### **Problem Description**
UserLanding.razor currently shows registration form regardless of token presence/validity. Should conditionally display:
1. **Token Entry Form** (when no token or invalid token)
2. **Registration Form** (when valid token provided)

#### **Expected Behavior**
- **CASE 1**: No token or invalid token → Show UserLanding-Guid.html layout (token entry)
- **CASE 2**: Valid token → Show UserLanding-Reg.html layout (registration form)

#### **Current Issues**
1. ❌ Always shows registration form regardless of token state
2. ❌ No conditional logic for token validation state
3. ❌ Missing token entry UI for invalid/missing tokens
4. ❌ Not matching exact mock layouts (UserLanding-Guid.html vs UserLanding-Reg.html)

#### **Technical Requirements**
1. Implement conditional rendering based on `hasValidToken` state
2. Create token entry form matching UserLanding-Guid.html exactly
3. Update registration form to match UserLanding-Reg.html exactly
4. Add comprehensive token validation logic with proper error handling
5. Add debug logging for token validation flow

#### **Mock References**
- Token Entry Layout: `Mocks/UserLanding-Guid.html`
- Registration Layout: `Mocks/UserLanding-Reg.html`

#### **Edge Cases Identified**
1. User enters URL without token
2. User enters URL with invalid/expired token
3. User enters URL with valid token
4. Token validation API failure scenarios
5. Network connectivity issues during validation

#### **Implementation Plan**
1. ✅ Add `hasValidToken` boolean state variable
2. ✅ Create conditional rendering logic in the noor-inner-card div
3. ✅ Implement TokenEntryForm component matching UserLanding-Guid.html
4. ✅ Update RegistrationForm component to match UserLanding-Reg.html
5. ✅ Add comprehensive logging and error handling
6. ⚠️ Test all token validation scenarios (pending user approval)

#### **Implementation Status: RESOLVED - Awaiting User Testing**
**Resolved Date**: September 16, 2025  
**Changes Made**:
1. ✅ Added conditional UI state logic (`showTokenEntry`, `hasValidToken`)
2. ✅ Implemented `DetermineUIState()` method with comprehensive token validation
3. ✅ Added token entry form matching UserLanding-Guid.html layout exactly
4. ✅ Updated registration form to match UserLanding-Reg.html layout exactly
5. ✅ Added `ValidateTokenInput()` method for user-entered tokens
6. ✅ Implemented comprehensive ISSUE-101 prefixed logging throughout
7. ✅ Added Tailwind-style CSS classes for exact mock matching
8. ✅ Added proper error handling for all validation scenarios

---

## 📋 **ISSUE MANAGEMENT**

### **Issue Status Definitions**
- **ACTIVE**: Currently being worked on
- **PENDING**: Awaiting user approval or clarification
- **RESOLVED**: Fixed and tested (awaiting user confirmation)
- **COMPLETED**: User-confirmed as resolved
- **ARCHIVED**: Historical reference

### **Priority Levels**
- **CRITICAL**: Blocks core functionality
- **HIGH**: Affects user experience significantly
- **MEDIUM**: Nice to have improvements
- **LOW**: Future enhancements

### **Issue Lifecycle**
1. **Report** → Issue identified and documented
2. **Analyze** → Technical investigation and planning
3. **Implement** → Code changes and testing
4. **Review** → Internal validation
5. **Resolve** → Mark as resolved (awaiting user approval)
6. **Complete** → User confirms resolution

---

## 📚 **HISTORICAL ISSUES** (For Reference)

*Historical issues will be moved here once resolved and completed*

---

## 🔧 **DEBUG & LOGGING STANDARDS**

### **Logging Prefixes for Issue Tracking**
- `ISSUE-101-DEBUG:` - UserLanding token validation debugging
- `ISSUE-101-TOKEN:` - Token state and validation logging
- `ISSUE-101-UI:` - UI state and rendering logging
- `ISSUE-101-ERROR:` - Error conditions and handling

### **Debug Guidelines**
1. Add comprehensive console logging for all state changes
2. Log token validation attempts and results
3. Log UI rendering decisions (which form to show)
4. Log API calls and responses
5. Log error conditions with sufficient context

---

## 🎯 **IMMEDIATE ACTION ITEMS**

### **Issue-101 Implementation Tasks**
- [ ] Add conditional rendering logic to UserLanding.razor
- [ ] Create TokenEntryForm matching UserLanding-Guid.html
- [ ] Update RegistrationForm to match UserLanding-Reg.html exactly
- [ ] Implement comprehensive token validation
- [ ] Add debug logging throughout validation flow
- [ ] Test all edge cases and error scenarios
- [ ] Update CSS classes to match Tailwind mock styling

**Estimated Effort**: 2-3 hours  
**Dependencies**: Access to mock HTML files for exact styling reference  
**Testing Required**: All token validation scenarios, UI rendering, form submissions