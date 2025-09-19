# Issue-117: SessionActive.razor Implementation - Live Canvas Experience

**Priority**: HIGH - Core Functionality - Canvas View Implementation  
**Status**: NOT STARTED  
**Report Date**: September 18, 2025

## **Problem Description**
With all core workflow views now operational and participants functionality validated, the final missing piece is SessionActive.razor for the live canvas experience where participants interact with shared Islamic content during active sessions.

## **Technical Requirements**
- Live canvas rendering with Islamic content display
- Real-time asset sharing and participant interaction
- Q&A system integration with voting capabilities  
- Session transcript rendering in sandboxed containers
- SignalR integration for live session updates
- Annotation system for shared content interaction

## **Implementation Priority**
This is the final core view needed for complete NOOR Canvas functionality. All infrastructure (authentication, session management, participants display) is now operational and ready to support the live canvas experience.

## **Expected Behavior**
Complete interactive Islamic learning experience with real-time content sharing, participant engagement, and comprehensive session management.

## **Acceptance Criteria**
- [ ] Live canvas interface with Islamic content rendering
- [ ] Real-time participant interaction capabilities
- [ ] Q&A system with voting and moderation
- [ ] Session transcript display with proper formatting
- [ ] SignalR integration for real-time updates
- [ ] Annotation and collaboration tools
- [ ] Mobile-responsive design for all devices

## **Files to Create/Modify**
- `SPA/NoorCanvas/Pages/SessionActive.razor` - Main live canvas component
- `SPA/NoorCanvas/Components/CanvasRenderer.razor` - Content display component
- `SPA/NoorCanvas/Components/QAPanel.razor` - Q&A interaction component
- `SPA/NoorCanvas/Hubs/CanvasHub.cs` - SignalR hub for real-time updates
- `Tests/UI/session-active-*.spec.ts` - Comprehensive test coverage

## **Related Issues**
- Dependent on Issue-116 (Participants functionality) - ✅ COMPLETED
- Related to Issue-119 (SignalR real-time updates) - In development

## **Implementation Notes**
This component should follow the established patterns from SessionWaiting.razor and Host-SessionOpener.razor for consistency with the existing codebase architecture.