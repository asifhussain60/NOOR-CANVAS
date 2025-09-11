# Issue-11: Complete nsrun/ncrun Removal - Fix Global Command Loading

**Created:** September 11, 2025  
**Priority:** High  
**Category:** Bug  
**Status:** Not Started  

## **Problem Description**

Despite implementing Issue-10 to consolidate global commands, the terminal still shows:
```
? NOOR Canvas global commands loaded: nsrun, nc
```

This indicates that `nsrun` is still being loaded as a global command and remains functional, which defeats the purpose of the consolidation effort.

**Current Issues:**
- `nsrun` command still appears in global command loading message
- `nsrun` command is still functional/executable
- Files may not have been properly deleted from the system
- Global command registration system still recognizes nsrun

## **Root Cause Investigation**

Need to investigate:
1. **PowerShell Profile**: Check if nsrun/ncrun are registered in PowerShell profile
2. **PATH Environment**: Verify if old command paths are still in system PATH
3. **File System**: Confirm physical file deletion
4. **Alias System**: Check if aliases are registered elsewhere
5. **Global Loading Script**: Find what script displays the loading message

## **Resolution Requirements**

### **Complete Removal Checklist:**
- [ ] **Physical File Deletion**: Ensure all nsrun/ncrun files are completely deleted
- [ ] **PowerShell Profile Cleanup**: Remove any profile entries for nsrun/ncrun
- [ ] **PATH Cleanup**: Remove old command paths from environment variables
- [ ] **Alias Removal**: Delete any PowerShell aliases for nsrun/ncrun
- [ ] **Loading Script Update**: Update the script that shows global command loading
- [ ] **Verification**: Terminal should show only "nc" in global commands loaded

### **Expected Final State:**
```
? NOOR Canvas global commands loaded: nc
```

## **Implementation Plan**

### **Phase 1: Investigate Current State**
1. Find the script that displays "NOOR Canvas global commands loaded"
2. Locate all remaining nsrun/ncrun files in the system
3. Check PowerShell profile for command registrations
4. Identify where nsrun command is still accessible from

### **Phase 2: Complete Cleanup**
1. Delete all remaining nsrun/ncrun files physically
2. Update the global loading script to remove nsrun references
3. Clean PowerShell profile if needed
4. Update PATH environment variables if needed
5. Remove any aliases or functions

### **Phase 3: Verification**
1. Open fresh terminal and verify only "nc" loads
2. Confirm nsrun/ncrun commands are not accessible
3. Test nc command functionality
4. Update documentation

## **Files to Investigate/Modify**

### **Potential Locations:**
- `Workspaces/Global/` - Check for remaining files
- PowerShell Profile (`$PROFILE`) - Check for aliases/functions
- Environment PATH variables
- Any initialization scripts in the project
- Scripts that display the loading message

### **Expected Files to Update:**
- Script that displays global command loading message
- Any remaining nsrun/ncrun files
- PowerShell profile (if applicable)
- PATH environment variables (if applicable)

## **Success Criteria**
- ✅ Terminal shows only "nc" in global commands loaded message
- ✅ nsrun command completely inaccessible
- ✅ ncrun command completely inaccessible  
- ✅ nc command fully functional with all features
- ✅ No references to nsrun/ncrun in any system files
- ✅ Fresh terminal sessions show clean global command loading

## **Related Issues**
- **Issue-10**: Initial consolidation attempt (completed but incomplete removal)

---

**Resolution Type:** Complete System Cleanup  
**Verification Method:** Terminal Testing + File System Verification  
**Priority Justification:** Incomplete removal defeats consolidation purpose  
**Impact:** Confusing development experience, contradicts Issue-10 completion
