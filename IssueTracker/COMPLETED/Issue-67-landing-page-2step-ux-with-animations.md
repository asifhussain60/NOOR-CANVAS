# Issue-67: Landing Page 2-Step UX with Card Animations

**Priority**: High  
**Type**: UX Enhancement  
**Phase**: Phase 4 - NOOR Canvas Branding & UX  
**Created**: September 14, 2025  
**Status**: Not Started

## 📋 **Issue Summary**

Implement a modern 2-step user experience for the Landing page that provides clear role selection followed by contextual input forms with smooth card animations.

## 🎯 **Requirements**

### **Step 1: Initial Choice View**

- **Restore Original Feature Lists**: Bring back the original feature list cards that were previously designed
- **Two Cards Display**:
  - **Host Authentication Card** - with feature list showing host capabilities
  - **Join Session Card** - with feature list showing participant features
- **Header Persistence**: NC-Logo + "A Space for Guided Learning" message always remains visible
- **Purple Borders**: Maintain consistent NOOR Canvas branding (`border-4 border-purple-500`)

### **Step 2: Input Form View (After Button Click)**

- **Header Static**: Header section never changes during transition
- **Selected Card Transformation**:
  - Replace feature list content with appropriate input form (Host GUID or Session Link)
  - **20% Expansion**: Increase card width and height by 20% with smooth animation
  - Show input controls matching the provided design mock
- **Other Card Behavior**:
  - **Become Invisible**: Smooth fade-out animation
  - **Space Management**: Selected card can utilize the additional space

### **🎬 Animation Specifications**

#### **Modern Card Transition System**

- **Expansion Animation**: 20% scale increase with smooth easing
- **Fade Transition**: CSS opacity transitions for card hiding/showing
- **Timing**: 0.4s duration with cubic-bezier easing for professional feel
- **Modern Enhancement**: Implement contemporary animation patterns (scale, transform, opacity)

#### **Technical Implementation**

```css
/* CSS Animation Classes */
.noor-card-expanded {
  transform: scale(1.2); /* 20% increase */
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.noor-card-hidden {
  opacity: 0;
  transform: scale(0.95);
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

.noor-card-interactive {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### **JavaScript Integration**

- **State Management**: Track which step user is on (choice vs input)
- **Animation Orchestration**: Coordinate card expansion and hiding animations
- **Focus Management**: Ensure proper focus handling during transitions

## 🔧 **Technical Details**

### **Component Structure**

```
┌─────────────────────────────────────┐
│      HEADER (Static)               │ ← Always visible
│   NC-Logo + "A Space for..."       │
├─────────────────────────────────────┤
│                                     │
│  Step 1: [Host Card] [Session Card] │ ← Feature lists
│  Step 2: [Expanded Card    ]       │ ← Input form + 20% larger
└─────────────────────────────────────┘
```

### **State Management**

- **Initial State**: `showFeatureLists = true`
- **Host Selected**: `selectedCard = "host"`, `showFeatureLists = false`
- **Session Selected**: `selectedCard = "session"`, `showFeatureLists = false`
- **Reset Capability**: Allow return to Step 1 from Step 2

### **Content Restoration**

- **Host Feature List**:
  - Session creation and management
  - Real-time participant monitoring
  - Q&A moderation capabilities
  - Analytics and reporting
- **Participant Feature List**:
  - Join active sessions
  - Interactive Q&A participation
  - Real-time content viewing
  - Cross-platform compatibility

## 🎨 **Design Integration**

### **Visual Consistency**

- **NOOR Canvas Branding**: Purple borders, Inter font, consistent spacing
- **Font Awesome Icons**: Large, visually appealing icons for each card
- **Responsive Design**: Ensure animations work on all device sizes
- **Accessibility**: Maintain focus management and screen reader compatibility

### **Animation Polish**

- **Smooth Transitions**: Professional cubic-bezier easing curves
- **Performance**: CSS transforms for optimal rendering performance
- **Fallback**: Graceful degradation for reduced-motion preferences

## ✅ **Acceptance Criteria**

### **Functional Requirements**

- [ ] Landing page shows two feature list cards initially
- [ ] Header remains static throughout all transitions
- [ ] Clicking card button transitions to Step 2 input form
- [ ] Selected card expands by 20% with smooth animation
- [ ] Other card fades out gracefully
- [ ] Input forms match provided design mock exactly
- [ ] Animation timing feels natural and professional

### **Technical Requirements**

- [ ] CSS animations use transform and opacity for performance
- [ ] JavaScript manages state transitions cleanly
- [ ] Component works on desktop and mobile devices
- [ ] Animations respect user's motion preferences
- [ ] Focus management maintains accessibility standards

### **Quality Assurance**

- [ ] No layout shifting during animations
- [ ] Consistent purple border styling throughout
- [ ] Proper error handling for failed animations
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

## 🔗 **Related Issues**

- **Issue-65**: Header Redesign Logo Only Implementation (Completed)
- **Issue-64**: Visual Design Mismatch Resolution (Completed)
- **Issue-66**: Landing Page Interactive Card UX Enhancement (Previous iteration)

## 📅 **Implementation Timeline**

- **Week 13 (Sep 14-20)**: Core 2-step UX implementation with feature list restoration
- **Week 14 (Sep 21-27)**: Animation system polish and cross-device testing
- **Integration**: Part of Phase 4 NOOR Canvas Branding & UX Enhancement

## 🏷️ **Labels**

`UX Enhancement` `Animation` `Landing Page` `Phase 4` `High Priority`

---

**Issue Created**: September 14, 2025  
**Assigned To**: Development Team  
**Target Completion**: September 20, 2025
