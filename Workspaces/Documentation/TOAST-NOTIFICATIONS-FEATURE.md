# Toast Notifications Feature - SessionCanvas.razor

## Overview
Added optional participant-side toast notifications with user toggle for new questions in SessionCanvas.razor. This enhances real-time engagement while providing user control over notification preferences.

## Implementation Details

### Key Features
1. **Toggle Control**: Elegant toggle switch in Q&A tab header
2. **Persistent Preferences**: Uses localStorage to remember user settings
3. **Smart Notifications**: Shows toasts for others' questions, not user's own
4. **Visual Feedback**: Confirmation toast when preferences change
5. **Click-to-Navigate**: Toast clicks scroll to Q&A panel

### Files Modified
- `SPA/NoorCanvas/Pages/SessionCanvas.razor`

### New Components Added

#### State Management
- `toastNotificationsEnabled`: Boolean preference (default: true)
- `TOAST_PREF_KEY`: localStorage key for persistence

#### Methods Added
- `LoadToastPreferenceAsync()`: Loads saved preference from localStorage
- `SaveToastPreferenceAsync(bool enabled)`: Saves preference to localStorage  
- `ToggleToastNotifications()`: Toggles preference with immediate feedback

#### UI Components
- Toggle switch in Q&A tab header with bell icon
- Accessible design with proper ARIA attributes
- NOOR Canvas color scheme integration

#### JavaScript Functions
- `showParticipantQuestionToast()`: Participant-specific toast display
- `showToastPreferenceUpdate()`: Settings change confirmation
- `scrollToQAPanel()`: Navigation helper for toast clicks

### SignalR Integration
Enhanced existing `HostQuestionAlert` handler to:
- Check if toast notifications are enabled
- Avoid showing toasts for user's own questions
- Display formatted toast with question details

## Usage

### For Participants
1. Join session via SessionCanvas.razor
2. Toggle toast notifications using switch in Q&A tab header
3. Receive real-time notifications when others ask questions
4. Click toasts to navigate to Q&A panel

### Default Behavior
- Toast notifications **enabled by default** for new users
- Preference persists across browser sessions
- No toasts shown for user's own questions (avoids redundancy)
- Success toast shown when user submits their own question

## Technical Notes

### Dependencies
- Leverages existing Toastr.js library loaded in `_Host.cshtml`
- Uses localStorage API for preference persistence
- Integrates with existing SignalR infrastructure

### Performance Considerations
- Minimal overhead: only loads preference once on component init
- Efficient: checks preference before creating toast objects
- Safe: error handling prevents toast failures from breaking Q&A functionality

### Accessibility
- Screen reader compatible toggle controls
- Proper ARIA labels and titles
- Keyboard navigation support

## Testing Instructions

1. **Start Application**: Run `dotnet run` from SPA/NoorCanvas directory
2. **Access Session**: Navigate to SessionCanvas.razor via valid session token
3. **Test Toggle**: Click toggle switch in Q&A tab header
4. **Verify Persistence**: Refresh page and confirm toggle state maintained
5. **Test Notifications**: Submit questions from different users to see toast behavior

## Future Enhancements
- Batch notification management for rapid questions
- Different toast styles for question categories
- Mobile-specific positioning optimizations
- Integration with browser notification API (optional)