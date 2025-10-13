# isolate.prompt.md Update - Full URL Documentation

## Changes Made

Updated the `isolate.prompt.md` file to provide clear, complete URLs for accessing isolation test pages.

---

## Sections Updated

### 1. Step 2: Isolation View Creation - File Creation Instructions

**Added**:
- Full HTTPS URL: `https://localhost:5001/isolated/{feature-name}`
- Full HTTP URL: `http://localhost:5000/isolated/{feature-name}`
- Example URL: `https://localhost:5001/isolated/canvas-questions`

**Location**: Line ~202-205

**Before**:
```markdown
1. **Create Isolation View File**
   - **Path**: `SPA/NoorCanvas/Pages/Isolated/{FeatureName}Isolation.razor`
   - **Route**: `@page "/isolated/{feature-name}"`
   - **Layout**: `@layout EmptyLayout` (isolated from main app)
```

**After**:
```markdown
1. **Create Isolation View File**
   - **Path**: `SPA/NoorCanvas/Pages/Isolated/{FeatureName}Isolation.razor`
   - **Route**: `@page "/isolated/{feature-name}"`
   - **Layout**: `@layout EmptyLayout` (isolated from main app)
   - **URL**: `https://localhost:5001/isolated/{feature-name}` (HTTPS) or `http://localhost:5000/isolated/{feature-name}` (HTTP)
   - **Example**: For canvas-questions feature → `https://localhost:5001/isolated/canvas-questions`
```

---

### 2. Step 1: Analysis Phase - Key Data Stream Documentation

**Added**: Complete isolation view information section with URLs

**Location**: Line ~168-178

**Before**:
```markdown
4. **Document in Key Data Stream**
   ```markdown
   ## Analysis Results
   
   ### Source Files Analyzed
   - File 1: Purpose and key components
   - File 2: Purpose and key components
```

**After**:
```markdown
4. **Document in Key Data Stream**
   ```markdown
   ## Analysis Results
   
   ### Isolation View Information
   - **Key**: isolate-{feature-name}
   - **Route**: /isolated/{feature-name}
   - **File Path**: SPA/NoorCanvas/Pages/Isolated/{FeatureName}Isolation.razor
   - **URL (HTTPS)**: https://localhost:5001/isolated/{feature-name}
   - **URL (HTTP)**: http://localhost:5000/isolated/{feature-name}
   - **Layout**: EmptyLayout (fully isolated)
   
   ### Source Files Analyzed
   - File 1: Purpose and key components
   - File 2: Purpose and key components
```

---

### 3. Step 5: Build and Test - Testing Instructions

**Added**: 
- Run application step
- Full URLs with both HTTPS and HTTP options
- Concrete example with canvas-questions

**Location**: Line ~441-465

**Before**:
```markdown
### Step 5: Build and Test (mode=isolate)
**Objective**: Verify isolation view works

1. **Build Project**
   ```powershell
   dotnet build SPA/NoorCanvas/NoorCanvas.csproj
   ```

2. **Check for Errors**
   - Use `get_errors` tool to validate no compilation errors
   - Fix any missing using statements or dependencies

3. **Test Isolation View**
   - Navigate to `/isolated/{feature-name}`
   - Verify all controls render correctly
   - Test parameter input and validation
   - Execute test and verify results display
```

**After**:
```markdown
### Step 5: Build and Test (mode=isolate)
**Objective**: Verify isolation view works

1. **Build Project**
   ```powershell
   dotnet build SPA/NoorCanvas/NoorCanvas.csproj
   ```

2. **Check for Errors**
   - Use `get_errors` tool to validate no compilation errors
   - Fix any missing using statements or dependencies

3. **Run Application**
   ```powershell
   cd SPA/NoorCanvas
   dotnet run
   ```

4. **Test Isolation View**
   - **Navigate to**: `https://localhost:5001/isolated/{feature-name}` or `http://localhost:5000/isolated/{feature-name}`
   - **Example**: For `isolate-canvas-questions`, navigate to `https://localhost:5001/isolated/canvas-questions`
   - Verify all controls render correctly
   - Test parameter input and validation
   - Execute test and verify results display

5. **Document Test Results**
   ```markdown
   ## Initial Test Results
   
   **Isolation View URL**: `https://localhost:5001/isolated/{feature-name}`
```

---

## Benefits

### Clear Navigation
- Users now know exactly where to go in their browser
- Both HTTPS and HTTP URLs provided for flexibility
- Port numbers explicitly stated (5001 for HTTPS, 5000 for HTTP)

### Concrete Examples
- Real example with canvas-questions feature
- Shows the URL format in practice
- Reduces confusion about route vs full URL

### Complete Instructions
- Added "Run Application" step (was missing)
- Step numbers corrected (was duplicate "4", now 4 and 5)
- Documentation template includes URL reference

### Consistency
- URL format consistent across all sections
- Same pattern used in documentation, testing, and creation steps

---

## Usage Example

When following the isolate.prompt.md workflow:

1. **Create isolation view**: `CanvasQuestionsIsolation.razor` with route `@page "/isolated/canvas-questions"`

2. **Build**: `dotnet build SPA/NoorCanvas/NoorCanvas.csproj`

3. **Run**: `cd SPA/NoorCanvas && dotnet run`

4. **Navigate**: Open browser to `https://localhost:5001/isolated/canvas-questions`

5. **Test**: Use the isolation test harness interface

---

## File Modified

- `.github/prompts/isolate.prompt.md`
  - 3 sections updated
  - 9 new lines added with URL information
  - Step numbering corrected

---

**Status**: ✅ Complete  
**Date**: 2025-10-13  
**Impact**: Documentation clarity improved - users now have full URLs to access isolation pages
