# signalcomm Workitem Requirements

## Problem Statement
The HTML broadcast functionality implemented in the signalcomm workitem is failing with JavaScript errors:
```
Uncaught SyntaxError: Failed to execute 'appendChild' on 'Node': Invalid or unexpected token
```

## Root Cause Analysis
The error occurs when Blazor tries to render complex HTML content with:
1. Complex CSS gradients and nested quotes in style attributes
2. Multiple font-family declarations 
3. Box-shadow and rgba() CSS functions
4. Potentially malformed quote escaping

## Implementation Requirements

### Phase 1: Diagnostic Enhancement
1. **Add Minimal HTML Button**: Create a fourth button "Minimal HTML" with the simplest possible HTML structure
2. **Enhanced Error Logging**: Add JavaScript error capture and display in UI
3. **HTML Content Validation**: Validate HTML before broadcasting

### Phase 2: HTML Sanitization System
1. **Quote Escaping Fix**: Properly escape all nested quotes in style attributes
2. **CSS Simplification**: Replace complex CSS with Blazor-safe alternatives
3. **Progressive Complexity Testing**: Test minimal → simple → complex HTML levels

### Phase 3: Robust Error Handling
1. **Fallback Content**: Display safe error messages when HTML fails to render
2. **Real-time Validation**: Validate HTML in textarea before broadcast
3. **User Feedback**: Show clear error messages for malformed HTML

## Success Criteria
- ✅ Minimal HTML broadcasts without errors
- ✅ Simple HTML broadcasts without errors  
- ✅ Complex HTML broadcasts without errors or has safe fallback
- ✅ Clear error messages for invalid HTML
- ✅ All JavaScript errors eliminated
- ✅ Playwright tests pass for all HTML complexity levels

## Files to Modify
- `SPA/NoorCanvas/Pages/HostControlPanel.razor` - Add minimal HTML button and validation
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` - Enhance GetSafeHtmlContent method
- `Workspaces/copilot/Tests/Playwright/signalcomm/` - Update tests for new functionality