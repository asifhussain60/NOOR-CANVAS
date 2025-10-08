# Session Transcript Viewer - Enhanced Standalone Page

## Overview

The **Session Transcript Viewer** is a modern, standalone web application designed to dynamically load and display Islamic content from the KSESSIONS database with proper Arabic font rendering and user-friendly interface.

## Key Features

### 🔧 **Dynamic Session Loading**
- Load any session by ID through a clean, intuitive interface
- Real-time content fetching from `/api/session/{sessionId}/transcript` endpoint
- URL parameter support for direct session access (e.g., `?sessionId=212`)
- Auto-loading when session ID is provided in URL

### 🎨 **Enhanced UI/UX**
- Modern, responsive design with gradient background
- Professional loading states with animated spinners
- Comprehensive toast notification system
- Error handling with retry functionality
- Session information display (size, update time, load performance)

### 🌍 **Arabic Font Support**
- Proper Unicode rendering for Arabic text
- Optimized font stack: `Scheherazade New`, `Amiri`, `Noto Sans Arabic`, `Noto Nastaliq Urdu`
- CSS styling specifically designed for RTL text
- Prevents UTF-8 byte corruption issues seen in previous versions

### ⚡ **Performance & Functionality**
- Fast API integration with error handling
- Keyboard shortcuts (Ctrl+R for refresh, Ctrl+L for session input focus)
- Interactive content cards with hover effects
- Mobile-responsive design

## File Location

```
/SPA/NoorCanvas/wwwroot/session-transcript-viewer.html
```

## Usage Instructions

### Basic Usage
1. **Navigate** to `http://localhost:9090/session-transcript-viewer.html`
2. **Enter** a session ID in the input field (default: 212)
3. **Click** "Load Session" or press Enter
4. **View** the dynamically loaded content with proper Arabic rendering

### URL Parameters
Access sessions directly via URL:
```
http://localhost:9090/session-transcript-viewer.html?sessionId=212
```

### Keyboard Shortcuts
- **Ctrl + R**: Refresh current session
- **Ctrl + L**: Focus on session ID input
- **Enter**: Load session when input is focused

## Technical Implementation

### API Integration
- **Endpoint**: `/api/session/{sessionId}/transcript`
- **Method**: GET
- **Response**: JSON with `sessionId`, `transcript` (HTML), and `lastUpdated`

### Error Handling
- **404**: Session not found
- **500**: Server errors
- **Network**: Connection failures
- **Validation**: Invalid session IDs

### Toast Notifications
- **Success**: Green toasts for successful operations
- **Error**: Red toasts for failures
- **Warning**: Yellow toasts for validation issues
- **Info**: Blue toasts for informational messages

## Key Improvements Over Previous Version

### ✅ **Fixed Issues**
1. **Arabic Font Corruption**: No more UTF-8 byte sequences like "Ú©Ø§ÙØ±"
2. **Dynamic Loading**: Eliminated hardcoded content, always loads from database
3. **Better UX**: Professional interface with loading states and error handling
4. **URL Support**: Direct session access via URL parameters

### 🚀 **New Features**
1. **Session Selector**: Clean interface for entering any session ID
2. **Performance Metrics**: Shows load time and content size
3. **Refresh Functionality**: Reload current session without re-entering ID
4. **Responsive Design**: Works on desktop, tablet, and mobile devices
5. **Accessibility**: Keyboard shortcuts and proper ARIA labels

## Technical Architecture

### CSS Classes
- `.inlineArabic`, `.arabic-text`: Proper Arabic font styling
- `.toast-*`: Notification system styling
- `.session-*`: Session selector components
- `.loading-*`: Loading state indicators

### JavaScript Functions
- `loadSession(sessionId)`: Main loading function
- `showToast(type, title, message)`: Notification system
- `updateSessionInfo(data, loadTime)`: UI updates
- `addContentInteractivity()`: Enhanced content interactions

### Dependencies
- **Tailwind CSS**: Modern utility-first CSS framework
- **Font Awesome**: Icons and visual elements
- **Google Fonts**: Arabic and Latin font families

## Example Sessions to Test

| Session ID | Description |
|-----------|-------------|
| 212 | Islamic content with Arabic text (default) |
| 215 | Alternative session for testing |
| 99999 | Non-existent session (for error testing) |

## Browser Support

- **Chrome**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Edge**: Full support
- **Mobile**: Responsive design supports all modern mobile browsers

## Development Notes

### Debugging
The viewer exposes a global `SessionViewer` object for debugging:
```javascript
// Load specific session programmatically
SessionViewer.loadSession(212);

// Show custom toast
SessionViewer.showToast('info', 'Debug', 'Custom message');

// Get current session
console.log(SessionViewer.getCurrentSessionId());
```

### Customization
- Modify CSS variables in `:root` for theme changes
- Update `--primary-color` for different brand colors
- Adjust `--border-radius` for different visual styles

## Future Enhancements

1. **Session History**: Remember recently viewed sessions
2. **Bookmarking**: Save favorite sessions
3. **Search**: Search within transcript content
4. **Export**: Download sessions as PDF or HTML
5. **Dark Mode**: Toggle between light and dark themes

---

This viewer represents a complete solution for accessing session transcripts with proper Arabic rendering and modern web standards.