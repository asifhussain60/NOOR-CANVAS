# Canvas Key - Requirements

## Overview
Implement UI enhancements for the SessionCanvas (canvas key) based on annotated screenshot feedback.

## User Request Analysis
Based on the approved interpretation of annotated screenshot annotations, the following changes are required:

### 1. Enhanced Header - Logo & Session Name
- **Logo Resize**: Increase session logo/icon size to 200x200 pixels 
- **Session Name Enhancement**: Increase font size of the session name
- **Clean Metadata**: Remove additional descriptive text (date/time/participant count info)

### 2. Connection Status Indicator
- **Replace Top-Right Controls**: Remove existing top-right control elements
- **New Status Display**: Add SignalR connection status indicator in top-right
  - **Green**: Successfully connected to SignalR hub
  - **Red**: Not connected or connection issue

### 3. Clean Content Cards
- **Remove Label Text**: Remove text labels "Participants", "Duration", "Topic" from content cards
- **Preserve Content**: Keep icons and main content/values displayed

## Technical Specifications

### Files Modified
- `d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Pages\SessionCanvas.razor`

### Dependencies
- SessionCanvas.razor component 
- SignalR hub connection status
- Font Awesome icons
- Existing CSS framework

### Implementation Approach
1. **HTML Structure Changes**: Modify logo container and session header layout
2. **CSS Updates**: Update logo sizing, font sizes, and layout positioning
3. **SignalR Integration**: Add connection status monitoring and display
4. **Content Card Cleanup**: Remove label text while preserving functionality

## Success Criteria
- Logo displays at 200x200 pixels with enhanced session name font size
- Header shows clean presentation without metadata text
- Top-right shows color-coded SignalR connection status
- Content cards display icons and values without descriptive labels
- No compilation errors or analyzer violations
- Clean build without warnings related to changes
- SignalR functionality preserved and enhanced with status display

## Quality Gates
- .NET analyzers pass without warnings
- ESLint passes (existing baseline debt acceptable)
- Application builds successfully  
- SignalR connection remains functional
- No runtime errors in development mode
- Visual alignment matches annotation requirements

## Risk Assessment
- **Low Risk**: UI-only changes to existing component
- **No Breaking Changes**: All existing functionality preserved
- **Visual Enhancement**: Improves user experience and connection transparency
- **Minimal Dependencies**: Uses existing SignalR infrastructure