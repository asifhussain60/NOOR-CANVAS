# NOOR Canvas Mock-to-Razor View Implementation Guide

## Project Context & Technology Stack

**Framework**: ASP.NET Core 8.0 Blazor Server  
**Styling**: Bootstrap 5 + Custom CSS (nc-gold-theme.css)  
**Fonts**: Vendored locally (Poppins, Inter) via noor-fonts.css  
**Icons**: Font Awesome 6.5.1  
**Cache Busting**: `?v=@DateTime.Now.Ticks` for all CSS/assets  
**Dev URL**: https://localhost:9091

## Critical Implementation Protocol

### 1. MANDATORY HEADER STRUCTURE
**CRITICAL REQUIREMENT**: Every Blazor view/page MUST include the NC branding header. **No exceptions.**

**UPDATED RULE**: The NC-Header.png header MUST be included in ALL Razor views by default, **regardless of whether the mock includes it or not**. This is a universal requirement for brand consistency across the entire NOOR Canvas application.

**File Location**: The NC-Header.png file MUST be located at:
- **Source**: `D:\PROJECTS\NOOR CANVAS\Workspaces\Documentation\IMPLEMENTATIONS\NC-Assets\NC-Header.png`
- **SPA Location**: `D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\wwwroot\images\branding\NC-Header.png`
- **Web Path**: `/images/branding/NC-Header.png`

**ALWAYS** include this exact header at the top of every view (no exceptions):
```razor
<header class="nc-branding-header">
    <img src="/images/branding/NC-Header.png?v=@DateTime.Now.Ticks&force=@Guid.NewGuid()" alt="NOOR Canvas - Real-time Islamic Content Sharing Platform" class="nc-logo-resized" style="background: transparent !important;" />
</header>
```

**IMPLEMENTATION NOTE**: Even if a mock does not show the NC-Header.png logo, you MUST add it as the first element after the root container. This ensures brand consistency across all views in the NOOR Canvas platform.

**Asset Management**: If the file is missing from the SPA project, copy it from the source location:
```powershell
New-Item -ItemType Directory -Path "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\wwwroot\images\branding" -Force
Copy-Item "D:\PROJECTS\NOOR CANVAS\Workspaces\Documentation\IMPLEMENTATIONS\NC-Assets\NC-Header.png" "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\wwwroot\images\branding\NC-Header.png"
```

### 2. ROOT CONTAINER PATTERN
Every view must follow this exact structure for proper centering:
```razor
<div class="nc-landing-wrapper nc-landing-body">
    <!-- NOOR Canvas Branding Header - MANDATORY FOR ALL VIEWS -->
    <header class="nc-branding-header">
        <img src="/images/branding/NC-Header.png?v=@DateTime.Now.Ticks&force=@Guid.NewGuid()" alt="NOOR Canvas - Real-time Islamic Content Sharing Platform" class="nc-logo-resized" style="background: transparent !important;" />
    </header>

    <div class="nc-card-container">
        <!-- Mock content implementation here -->
    </div>
</div>
```

**Layout Rules**: 
- The header MUST be the first element after the root container div
- Use `nc-landing-wrapper` for proper vertical and horizontal centering
- Use `nc-landing-body` to control max-width and flex layout
- The `nc-card-container` provides the white card background matching the mock

### 3. MOCK-TO-CODE MEASUREMENT PRECISION

#### Font Sizing Standards (Exact Measurements):
- **Large Headings**: `font-size: 2.25rem` (36px) + `font-weight: 700` + `.nc-poppins`
- **Medium Headings**: `font-size: 1.875rem` (30px) + `font-weight: 600` + `.nc-poppins`
- **Subheadings**: `font-size: 1.5rem` (24px) + `font-weight: 600` + `.nc-inter`
- **Body Text**: `font-size: 1rem` (16px) + `font-weight: 400` + `.nc-inter`
- **Small Text**: `font-size: 0.875rem` (14px) + `font-weight: 400` + `.nc-inter`
- **Button Text**: `font-size: 1.125rem` (18px) + `font-weight: 500`

#### Spacing Standards (Critical for Mock Accuracy):
- **Main Card Padding**: `padding: 2.5rem` (40px) - use `nc-card-container`
- **Section Margins**: `margin-bottom: 1.5rem` (24px) between major elements
- **Button Padding**: `padding: 0.875rem 1.5rem` (14px 24px vertical, 24px horizontal)
- **Input Padding**: `padding: 0.75rem 1rem` (12px 16px)
- **Icon Margins**: `margin-right: 0.5rem` (8px) for icon-text combinations

#### Color Accuracy (Comprehensive NOOR Canvas Palette):

**Core Brand Colors:**
- **NOOR Gold Primary**: `#D4AF37` (primary gold, buttons, accents)
- **NOOR Gold Secondary**: `#C5B358` (lighter gold, gradients)
- **Gold Gradient**: `linear-gradient(to right, #C5B358, #D4AF37, #C5B358)`

**Background Colors:**
- **Page Background**: `#F8F5F1` (warm cream background)
- **Card Background**: `#FFFFFF` (pure white cards)
- **Alt Background**: `#F8F9FA` (light gray sections)

**Text Colors:**
- **Text Primary**: `#8B6E36` (warm brown for headings)
- **Text Secondary**: `#6B7280` (medium gray for descriptions)
- **Text Dark**: `#4B3C2B` (deep brown for emphasis)
- **Text Light**: `#2C5530` (dark green for special content)

**Semantic Colors:**
- **Islamic Green**: `#006400` (education icons, success states)
- **Button Green**: `#059669` (action buttons, success)
- **Error Red**: `#721C24` (error states, warnings)
- **Info Blue**: `#007BFF` (information, links)

**UI Element Colors:**
- **Border Light**: `#E5E7EB` (subtle borders, dividers)
- **Border Medium**: `#D1D5DB` (form inputs, cards)
- **Shadow**: `rgba(0,0,0,0.12)` (card shadows, depth)
- **Hover State**: `rgba(0,0,0,0.05)` (interaction feedback)

**Navigation Colors:**
- **Nav Text**: `#D7D7D7` (navigation menu items)
- **Nav Active**: `#FFFFFF` (active navigation states)

### 4. CRITICAL GAP PREVENTION (Based on Previous Failures)

#### Shadow Implementation (Exact Values):
```css
/* Main card shadow - prominent depth */
box-shadow: 0 25px 50px rgba(0,0,0,0.12);
border: 1px solid rgba(0,0,0,0.06);

/* Button shadows */
box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);

/* Hover states */
box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
```

#### Font Loading Verification Checklist:
- [ ] Confirm `.nc-poppins` and `.nc-inter` classes are applied
- [ ] Verify noor-fonts.css loads in _Host.cshtml with cache-busting
- [ ] Test font rendering with different weights (300, 400, 500, 600, 700)
- [ ] Check fallback fonts: `'Poppins', sans-serif` and `'Inter', sans-serif`

#### Responsive Design Constraints:
- **Card Max Width**: `max-width: 28rem` (448px) to match mock proportions
- **Container Width**: `width: 100%` with `margin: 0 auto` for centering
- **Logo Width**: Fixed `400px` (current specification)
- **Minimum Viewport**: Support down to 320px width

### 5. CSS CLASS NAMING CONVENTION

**Mandatory Prefixing**: ALL custom classes MUST use `nc-` prefix
```css
/* ✅ Correct */
.nc-session-card { }
.nc-primary-btn { }
.nc-heading { }
.nc-icon-circle { }

/* ❌ Wrong - conflicts with Bootstrap/existing styles */
.session-card { }
.primary-btn { }
.heading { }
```

### 6. MOCK COMPARISON VALIDATION CHECKLIST

**Before declaring implementation complete, verify ALL items:**
- [ ] **Typography**: Font sizes match mock proportions exactly (measure with dev tools)
- [ ] **Spacing**: Padding/margins create identical whitespace distribution
- [ ] **Colors**: All colors match brand guidelines using exact hex values
- [ ] **Shadows**: Depth perception matches mock (subtle vs prominent)
- [ ] **Buttons**: Styling, rounded corners, colors, hover states accurate
- [ ] **Icons**: Correct sizes, positioning, and colors (especially #006400 green)
- [ ] **Card Proportions**: Width, height, aspect ratios match mock
- [ ] **Backgrounds**: Page background, card backgrounds, gradients correct
- [ ] **Logo**: Positioned correctly with proper sizing (400px)
- [ ] **Responsive**: Layout works on mobile (320px) to desktop

### 7. RAZOR VIEW IMPLEMENTATION WORKFLOW

#### Step 1: Verify Development Environment
**BEFORE creating any Razor view, ensure the development server is ready:**

```powershell
# Check IIS Express status
Get-Process -Name "iisexpress" -ErrorAction SilentlyContinue

# If not running, start the server
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet run

# Verify server accessibility
# Should see: "Now listening on: https://localhost:9091"
```

#### Step 2: Razor View Template

```razor
@page "/[ROUTE-PATH]"
@using Microsoft.AspNetCore.Components
@using NoorCanvas.Controllers
<!-- Add additional usings as needed for models/services -->

<div class="nc-landing-wrapper nc-landing-body">
    <!-- NOOR Canvas Branding Header - MANDATORY FOR ALL VIEWS (even if not in mock) -->
    <header class="nc-branding-header">
        <img src="/images/branding/NC-Header.png?v=@DateTime.Now.Ticks&force=@Guid.NewGuid()" alt="NOOR Canvas - Real-time Islamic Content Sharing Platform" class="nc-logo-resized" style="background: transparent !important;" />
    </header>

    <div class="nc-card-container nc-p-0">
        <!-- [MOCK_FILENAME] Implementation -->
        <h1 class="nc-heading nc-poppins">[MAIN_TITLE_FROM_MOCK]</h1>
        
        <!-- Session Card Pattern (if applicable) -->
        <div class="nc-session-card">
            <div class="nc-session-bg" aria-hidden="true"></div>
            <div class="nc-session-content">
                <div class="nc-icon-circle">
                    <i class="fa-solid [ICON-CLASS] fa-2x text-[#006400]"></i>
                </div>
                <h2 class="nc-session-title nc-inter">[CARD_TITLE]</h2>
                <p class="nc-session-desc nc-inter">[CARD_DESCRIPTION]</p>
            </div>
        </div>

        <!-- Primary Action Button Pattern -->
        <button class="nc-primary-btn" @onclick="[ACTION_METHOD]">
            <span class="mr-2">[BUTTON_TEXT]</span>
            <svg class="" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
            </svg>
        </button>

        <!-- Form Input Pattern (if applicable) -->
        <div class="w-full mb-6">
            <label class="noor-label mb-2 text-left text-lg" for="[INPUT_ID]">
                <i class="fa-solid [ICON] text-blue-500 me-2"></i>[LABEL_TEXT]
            </label>
            <input type="text" id="[INPUT_ID]" @bind="[PROPERTY]" class="noor-input" placeholder="[PLACEHOLDER]" />
        </div>
    </div>
</div>

@code {
    // Component logic here
}
```

#### Step 3: Test in Simple Browser
**IMMEDIATELY after creating the view, test it using VS Code Simple Browser:**

1. **Save the Razor file** and wait for hot reload (if running `dotnet run`)
2. **Open Simple Browser** in VS Code (`Ctrl+Shift+P` → "Simple Browser: Show")
3. **Navigate to your route**: `https://localhost:9091/[ROUTE-PATH]`
4. **Compare with mock**: Keep mock image open for side-by-side validation
5. **Use DevTools**: Right-click in Simple Browser → "Inspect Element" for measurements

**Testing URL Examples:**
- Landing Page: `https://localhost:9091/landing`
- Host Auth: `https://localhost:9091/host-auth` 
- Admin Dashboard: `https://localhost:9091/admin`

**Validation Steps:**
- [ ] Page loads without errors in Simple Browser
- [ ] NC-Header.png displays (mandatory for all views)
- [ ] Layout matches mock proportions
- [ ] Colors match NOOR Canvas brand palette
- [ ] Fonts render correctly (Inter/Poppins)
- [ ] Interactive elements work (buttons, forms, hover states)
```

### 8. ASSET MANAGEMENT PROTOCOL

#### File Paths (Always Use Absolute Paths):
- **NC Header Logo**: `/images/branding/NC-Header.png?v=@DateTime.Now.Ticks` (MANDATORY - must exist in SPA project)
- **Fonts**: Served from `wwwroot/fonts/` via noor-fonts.css
- **Icons**: Font Awesome 6.5.1 CDN (`fa-solid`, `fa-regular`, `fa-brands`)
- **Custom CSS**: `/css/nc-gold-theme.css?v=@DateTime.Now.Ticks`

**Asset Verification Checklist**:
- [ ] NC-Header.png exists at `/wwwroot/images/branding/NC-Header.png`
- [ ] File size is **exactly 1,769,400 bytes** (confirmed specification)
- [ ] Last modified: September 16, 2025, 6:55:03 AM
- [ ] Cache-busting parameter `?v=@DateTime.Now.Ticks&force=@Guid.NewGuid()` is included
- [ ] Alt text includes "NOOR Canvas - Real-time Islamic Content Sharing Platform"
- [ ] Image displays with transparent background using `style="background: transparent !important;"`

#### Cache-Busting Strategy:
```razor
<!-- CSS Files -->
<link href="css/nc-gold-theme.css?v=@DateTime.Now.Ticks" rel="stylesheet" />

<!-- Images -->
<img src="/images/branding/NC-Header.png?v=@DateTime.Now.Ticks" alt="..." />

<!-- Custom Assets -->
<script src="/js/custom.js?v=@DateTime.Now.Ticks"></script>
```

### 9. DEVELOPMENT SERVER & TESTING PROTOCOL

#### IIS Express Management:
**ALWAYS verify IIS Express is running before implementing or testing views.**

**Check Server Status:**
```powershell
# Verify IIS Express is running
Get-Process -Name "iisexpress" -ErrorAction SilentlyContinue

# Check if port 9091 is in use (NOOR Canvas default)
netstat -an | findstr ":9091"
```

**Start Development Server:**
```powershell
# Navigate to SPA project directory
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"

# Clean and build (if needed)
dotnet clean
dotnet build

# Start the application
dotnet run
```

**Alternative - Use VS Code Tasks:**
- Use `Ctrl+Shift+P` → "Tasks: Run Task" → "build" or "run-with-iiskill"
- Tasks automatically handle IIS Express lifecycle management

#### Simple Browser Testing Workflow:
**MANDATORY**: Use VS Code Simple Browser for immediate view testing during implementation.

**Load View in Simple Browser:**
1. **Verify Server Running**: Confirm https://localhost:9091 is accessible
2. **Open Simple Browser**: Use VS Code Simple Browser for side-by-side comparison
3. **Navigation URL Format**: `https://localhost:9091/[route-name]`
   - Example: `https://localhost:9091/landing` for Landing page
   - Example: `https://localhost:9091/host-auth` for Host Authentication
4. **Compare with Mock**: Keep mock image open alongside Simple Browser for pixel-perfect comparison

**Benefits of Simple Browser Testing:**
- ✅ **Immediate Feedback**: See changes instantly without leaving VS Code
- ✅ **Side-by-Side Comparison**: Mock image + live view in same editor
- ✅ **Faster Iteration**: No need to switch between applications
- ✅ **Development Tools**: Access Chrome DevTools for measurement and debugging

**Testing Checklist:**
- [ ] IIS Express running and accessible at https://localhost:9091
- [ ] Simple Browser loads the implemented view without errors
- [ ] NC-Header.png displays correctly (1,769,400 bytes, transparent background)
- [ ] All fonts load properly (Inter, Poppins via noor-fonts.css)
- [ ] Colors match NOOR Canvas brand palette exactly
- [ ] Layout matches mock proportions and spacing
- [ ] Responsive design works across different viewport sizes

### 10. DEBUGGING IMPLEMENTATION FAILURES

#### Common Failure Points & Solutions:

**Font Loading Issues:**
```bash
# Check font files exist
ls wwwroot/fonts/
# Verify CSS inclusion in _Host.cshtml
grep "noor-fonts" Pages/_Host.cshtml
```

**Spacing Discrepancies:**
- Use browser dev tools to measure mock vs implementation
- Check for competing CSS rules (Bootstrap overrides)
- Verify `nc-` prefixed classes take precedence

**Color Mismatches:**
- Use color picker browser extension on mock images
- Verify hex values exactly match brand guidelines
- Check for CSS inheritance issues

**Layout Breakage:**
```css
/* Verify container hierarchy */
.nc-landing-wrapper /* Root container */
  .nc-branding-header /* Logo header */
  .nc-card-container /* Main content card */
```

**Logo Display Problems:**
- Confirm file exists: `wwwroot/images/branding/NC-Header.png`
- Check file size (should be exactly 1,769,400 bytes)
- Verify cache-busting parameter updates

**IIS Express Connection Issues:**
```powershell
# Kill any hanging IIS Express processes
Stop-Process -Name "iisexpress" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "dotnet" -Force -ErrorAction SilentlyContinue

# Clear any port conflicts
netstat -an | findstr ":9091"

# Restart the application
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet clean
dotnet build
dotnet run
```

**Simple Browser Loading Issues:**
- Ensure https://localhost:9091 is accessible in external browser first
- Check for SSL certificate issues (accept development certificate)
- Verify VS Code Simple Browser extension is installed and updated
- Try refreshing Simple Browser or opening new Simple Browser window

### 10. QUALITY ASSURANCE WORKFLOW

#### Pre-Implementation:
1. **Mock Analysis**: Measure font sizes, spacing, colors using dev tools
2. **Asset Check**: Verify all required icons, fonts, images are available
   - **CRITICAL**: Confirm NC-Header.png exists at `/wwwroot/images/branding/NC-Header.png`
   - If missing, copy from source: `D:\PROJECTS\NOOR CANVAS\Workspaces\Documentation\IMPLEMENTATIONS\NC-Assets\NC-Header.png`
3. **Template Setup**: Use standard Razor template with mandatory header
4. **Development Server Check**: Verify IIS Express is running before implementation

#### During Implementation:
1. **Development Server Verification**: Always verify IIS Express is running before testing
   ```powershell
   # Check if IIS Express is running
   Get-Process -Name "iisexpress" -ErrorAction SilentlyContinue
   
   # If not running, start the application
   cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
   dotnet run
   ```
2. **Simple Browser Testing**: Load views in VS Code Simple Browser for immediate feedback
   - Use Simple Browser to view `https://localhost:9091/[your-route]`
   - Enables side-by-side comparison with mock images
   - Faster iteration cycle than external browsers
3. **Incremental Testing**: Test each component (header → card → buttons → forms)
4. **Cross-Browser**: Test Chrome, Edge, Firefox for consistency
5. **Responsive Check**: Test 320px, 768px, 1024px, 1440px widths

#### Post-Implementation:
1. **Side-by-Side**: Compare mock image with live implementation
2. **Pixel-Perfect**: Use overlay tools to check alignment
3. **Interactive Testing**: Verify all buttons, forms, hover states work
4. **Performance**: Check page load time <2s, no console errors

### 11. MOCK-SPECIFIC IMPLEMENTATION NOTES

#### Authentication/Login Views:
- Always include "Host Authentication" or equivalent heading
- Use session card pattern with appropriate icons
- Include "Access [System] Dashboard" button pattern

#### Form Views:
- Label + Icon pattern for all inputs
- Consistent input styling with `noor-input` class  
- Form validation styling for error states

#### Dashboard Views:
- Card-based layout for statistics/metrics
- Icon + number + label pattern for stats
- Consistent spacing between card elements

---

## Implementation Success Metrics

- ✅ **Development Server**: IIS Express running and accessible at https://localhost:9091
- ✅ **Simple Browser Testing**: View loads correctly in VS Code Simple Browser
- ✅ **Visual Accuracy**: 95%+ match to provided mock (verified via side-by-side comparison)
- ✅ **Performance**: Page loads <2s on localhost:9091
- ✅ **Responsiveness**: Works 320px to 1440px+ widths  
- ✅ **Accessibility**: Proper alt text, semantic HTML, keyboard navigation
- ✅ **Code Quality**: Clean Razor syntax, proper C# patterns
- ✅ **Brand Consistency**: NOOR Canvas colors, fonts, styling throughout

---

## Continuous Learning & Adaptation Protocol

### Learning Triggers
When user provides feedback with these phrases, **automatically update this guide**:
- "Implement this moving forward"
- "Update instructions for next time"
- "Add this to the guide"
- "Make this standard practice"
- "Prevent this issue in the future"

### Update Process
1. **Identify Pattern**: Analyze the user's correction/improvement request
2. **Document Solution**: Add specific instructions to prevent recurrence
3. **Update Relevant Section**: Modify appropriate section (fonts, spacing, colors, etc.)
4. **Version Update**: Update the "Last Updated" timestamp
5. **Commit Changes**: Use descriptive git commit message

### Evolution Areas
- **New UI Patterns**: Additional card types, form layouts, dashboard components
- **Measurement Refinements**: Exact spacing, font sizes, shadow values based on user feedback
- **Color Additions**: New brand colors, gradients, or theme variations
- **Component Templates**: Reusable Razor component patterns
- **Performance Optimizations**: Loading strategies, caching improvements
- **Accessibility Enhancements**: Screen reader support, keyboard navigation patterns

### Example Learning Entry Format
```markdown
#### [DATE] - [IMPROVEMENT_DESCRIPTION]
**Issue**: [What was wrong/missing]
**Solution**: [Specific fix implemented]
**New Standard**: [Updated instruction to prevent recurrence]
```

This ensures the guide evolves with each project iteration, becoming more accurate and comprehensive over time.

---

*Last Updated: September 16, 2025*  
*Focus: Pixel-perfect mock implementations with continuous learning integration*