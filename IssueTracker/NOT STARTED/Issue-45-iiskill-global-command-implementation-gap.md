# Issue 45: IISKILL Global Command Implementation Gap

**Date:** September 14, 2025  
**Priority:** Medium  
**Category:** Enhancement  
**Status:** Not Started

## Description

The `iiskill` global command exists but doesn't follow the same implementation patterns as other global commands (`nc`, `nct`, `ncdoc`). It needs to be updated to match the established patterns for consistency and better user experience.

## Analysis

After examining `nc.ps1` and `nct.ps1`, the following patterns are established:

### Current Implementation Gaps in `iiskill.ps1`:

1. **Missing Help System**: No `-Help` parameter with formatted help output
2. **No Header/Branding**: Missing consistent header formatting like other commands
3. **Limited Parameter Support**: Only supports `-WhatIf`, missing verbose options
4. **Inconsistent Output**: Doesn't match the color coding and formatting of other commands
5. **Missing Error Handling**: No try-finally blocks or location restoration like `nct`
6. **No Clear-Host**: Other commands clear the screen for better UX

### Expected Pattern (from nc/nct analysis):

1. **Parameter Block**: Consistent parameter declarations with [switch] types
2. **Help Block**: Formatted help with title, usage, features, and examples
3. **Clear-Host**: Clean terminal start
4. **Colored Headers**: Green/Cyan headers with separators
5. **Structured Output**: Consistent color coding (Green=success, Yellow=info, Red=error)
6. **Error Handling**: Try-catch blocks with proper cleanup

## Acceptance Criteria

- [ ] Add `-Help` parameter with formatted help output
- [ ] Add consistent header formatting matching `nc`/`nct` patterns
- [ ] Implement proper color coding for output messages
- [ ] Add `-Verbose` parameter for detailed output
- [ ] Add proper error handling with try-catch blocks
- [ ] Ensure output format matches other global commands
- [ ] Test that `iiskill` works seamlessly like `nc` and `nct`
- [ ] Verify `.bat`/`.cmd` wrappers work correctly

## Implementation Notes

- Follow the exact formatting patterns from `nc.ps1` (lines 1-25) for parameter handling
- Use the help format from `nct.ps1` (lines 6-24) as template
- Maintain existing P/Invoke functionality but wrap in better UX
- Add `Clear-Host` at the start like `nct.ps1`
- Use consistent color scheme: Green for titles, Yellow for info, Red for errors

## Technical Requirements

- Maintain backward compatibility with existing `-WhatIf` parameter
- Keep existing P/Invoke IsWow64Process functionality
- Ensure script works with both PowerShell and PowerShell Core
- Verify `.bat` and `.cmd` wrappers function correctly
