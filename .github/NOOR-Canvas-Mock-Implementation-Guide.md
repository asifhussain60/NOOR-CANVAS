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
**ALWAYS** include this exact header at the top of every view (no exceptions):
```razor
<header class="nc-branding-header">
    <img src="/images/branding/NC-Header.png?v=@DateTime.Now.Ticks" alt="NOOR Canvas - Real-time Islamic Content Sharing Platform" class="nc-logo-resized" />
</header>
```

### 2. ROOT CONTAINER PATTERN
Every view must follow this exact structure:
```razor
<div class="nc-landing-wrapper nc-landing-body">
    <!-- NOOR Canvas Branding Header -->
    <header class="nc-branding-header">
        <img src="/images/branding/NC-Header.png?v=@DateTime.Now.Ticks" alt="NOOR Canvas - Real-time Islamic Content Sharing Platform" class="nc-logo-resized" />
    </header>

    <div class="nc-card-container nc-p-0">
        <!-- Mock content implementation here -->
    </div>
</div>
```

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

#### Color Accuracy (Exact Brand Colors):
- **NOOR Gold Primary**: `#D4AF37`
- **NOOR Gold Lighter**: `#C5B358`  
- **Gold Gradient**: `linear-gradient(to right, #C5B358, #D4AF37, #C5B358)`
- **Page Background**: `#F8F5F1` (warm off-white)
- **Card Background**: `#FFFFFF` (pure white)
- **Text Primary**: `#8B6E36` (warm brown for headings)
- **Text Secondary**: `#6B7280` (gray for descriptions)
- **Islamic Green**: `#006400` (for educational icons)
- **Button Green**: `#059669` (success actions)

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

### 7. RAZOR VIEW TEMPLATE

```razor
@page "/[ROUTE-PATH]"
@using Microsoft.AspNetCore.Components
@using NoorCanvas.Controllers
<!-- Add additional usings as needed for models/services -->

<div class="nc-landing-wrapper nc-landing-body">
    <!-- NOOR Canvas Branding Header - MANDATORY -->
    <header class="nc-branding-header">
        <img src="/images/branding/NC-Header.png?v=@DateTime.Now.Ticks" alt="NOOR Canvas - Real-time Islamic Content Sharing Platform" class="nc-logo-resized" />
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

### 8. ASSET MANAGEMENT PROTOCOL

#### File Paths (Always Use Absolute Paths):
- **Logo**: `/images/branding/NC-Header.png?v=@DateTime.Now.Ticks`
- **Fonts**: Served from `wwwroot/fonts/` via noor-fonts.css
- **Icons**: Font Awesome 6.5.1 CDN (`fa-solid`, `fa-regular`, `fa-brands`)
- **Custom CSS**: `/css/nc-gold-theme.css?v=@DateTime.Now.Ticks`

#### Cache-Busting Strategy:
```razor
<!-- CSS Files -->
<link href="css/nc-gold-theme.css?v=@DateTime.Now.Ticks" rel="stylesheet" />

<!-- Images -->
<img src="/images/branding/NC-Header.png?v=@DateTime.Now.Ticks" alt="..." />

<!-- Custom Assets -->
<script src="/js/custom.js?v=@DateTime.Now.Ticks"></script>
```

### 9. DEBUGGING IMPLEMENTATION FAILURES

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
- Check file size (should be ~1.77MB, not 2.07MB)
- Verify cache-busting parameter updates

### 10. QUALITY ASSURANCE WORKFLOW

#### Pre-Implementation:
1. **Mock Analysis**: Measure font sizes, spacing, colors using dev tools
2. **Asset Check**: Verify all required icons, fonts, images are available
3. **Template Setup**: Use standard Razor template with mandatory header

#### During Implementation:
1. **Incremental Testing**: Test each component (header → card → buttons → forms)
2. **Cross-Browser**: Test Chrome, Edge, Firefox for consistency
3. **Responsive Check**: Test 320px, 768px, 1024px, 1440px widths

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

- ✅ **Visual Accuracy**: 95%+ match to provided mock
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