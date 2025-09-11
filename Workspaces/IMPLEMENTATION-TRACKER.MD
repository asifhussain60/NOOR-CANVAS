# NOOR Canvas Implementation Tracker

**Project**: NOOR Canvas v3.0 FINAL  
**Started**: September 11, 2025  
**Timeline**: 20 weeks (6 phases)  

---

## Phase 1 — Skeleton, Observer, Issue Tracker, DB (Weeks 1–3)
**Status**: Not Started  
**Duration**: 3 weeks  
**Target Completion**: October 2, 2025  

### Core Infrastructure
- [ ] Repository initialization and solution structure
- [ ] Main ASP.NET Core 8 Blazor Server project in `SPA/` folder
- [ ] Basic project configuration and dependencies
- [ ] IIS launch profile configuration
- [ ] Environment configuration (Development/Production)

### Database & Migrations
- [ ] EF Core setup and configuration
- [ ] Canvas schema implementation (Sessions, Users, etc.)
- [ ] Database migrations creation
- [ ] Users table implementation with persistent UserId
- [ ] Initial database seeding for development

### Console Applications (Tools folder)
- [ ] `Tools/HostProvisioner` - Host GUID generation and management
- [ ] `Tools/DbMigrator` - Database migrations and seeding
- [ ] `Tools/ObserverCli` - Observer stream connection utility
- [ ] `Tools/IssueUploader` - Issue import and batch processing
- [ ] `Tools/MigrationHelper` - Legacy KSESSIONS migration utility

### Observability & Health
- [ ] Health endpoint (`/healthz`) implementation
- [ ] Serilog integration and configuration
- [ ] Observer stream (`/observer/stream`) implementation
- [ ] Development diagnostics with `?debug=1` toggle
- [ ] Basic logging infrastructure

### Issue Tracker Foundation
- [ ] Issue Tracker folder structure organization
- [ ] NC-ISSUE-TRACKER.MD main file
- [ ] Status-based folder organization (NOT STARTED, COMPLETED, etc.)
- [ ] Issue tracking database schema
- [ ] Basic issue reporting endpoint (`POST /issues`)

### SignalR & Hub Infrastructure
- [ ] Basic SignalR setup and configuration
- [ ] Session Hub foundation (`/hub/session`)
- [ ] QA Hub foundation (`/hub/qa`)
- [ ] Hub authorization framework

### McBeatch Integration
- [ ] McBeatch theme integration foundation
- [ ] Basic CSS structure setup
- [ ] Asset path configuration (DEV/PROD mapping)

### Testing Framework
- [ ] Unit test project setup (xUnit/NUnit)
- [ ] Core helper tests (hashing, GUID validation)
- [ ] Basic repository mock tests
- [ ] Test configuration and CI integration

### Documentation & Quality
- [ ] Code documentation standards
- [ ] Development setup guide
- [ ] Console application usage documentation
- [ ] Quality gates implementation (build/lint/tests)

---

## Phase 2 — Host & Participant Core (Weeks 4–8)
**Status**: Not Started  
**Duration**: 5 weeks  
**Target Completion**: November 6, 2025  

### Authentication & Landing
- [ ] Single landing page with Host/User selection
- [ ] Host GUID authentication flow
- [ ] User GUID validation and routing
- [ ] Session link validation and expiry handling

### Host Console (Dashboard)
- [ ] Host dashboard layout and navigation
- [ ] Session creation and management
- [ ] Host GUID provisioning integration
- [ ] Session controls (Begin/End/Expire)
- [ ] Zoom integration panel (embedded iframe)
- [ ] Real-time session monitoring

### User Registration & Profiles
- [ ] User registration form (Name/City/Country)
- [ ] Persistent UserId implementation with localStorage
- [ ] Cross-session user profile management
- [ ] Registration validation and storage

### Waiting Room Experience
- [ ] Waiting room UI and user experience
- [ ] Session preview and status display
- [ ] Auto-navigation on session start
- [ ] Real-time updates via SignalR

### Canvas View (Read-only)
- [ ] Read-only transcript container implementation
- [ ] Sandboxed HTML rendering
- [ ] Asset detection framework
- [ ] Late-joiner synchronization via snapshots
- [ ] Real-time content updates

### Q&A System Foundation
- [ ] Question submission system (280 char limit)
- [ ] Question queue management
- [ ] Voting system (upvote/remove vote)
- [ ] Anonymous questions for users
- [ ] Host moderation capabilities

### Asset Detection & Sharing
- [ ] Asset detection overlay system
- [ ] Share button implementation
- [ ] Asset payload construction
- [ ] Real-time asset broadcasting
- [ ] Supported content types (Verse, Ayah, Hadith, etc.)

---

## Phase 3 — Annotations & Admin (Weeks 9–12)
**Status**: Not Started  
**Duration**: 4 weeks  
**Target Completion**: December 4, 2025  

### Annotation System
- [ ] SVG overlay annotation tools
- [ ] Annotation creation and editing
- [ ] Annotation persistence and synchronization
- [ ] Real-time annotation broadcasting
- [ ] Annotation conflict resolution

### Admin Functionality
- [ ] Admin role implementation
- [ ] Session management admin interface
- [ ] User management and moderation
- [ ] System monitoring and diagnostics

### Performance & Sync
- [ ] Sync throttling implementation
- [ ] Performance optimization
- [ ] Redis backplane setup (if needed)
- [ ] Connection management improvements

### Roster Management
- [ ] Real-time roster updates
- [ ] User presence tracking
- [ ] Roster admin controls
- [ ] User analytics and reporting

---

## Phase 4 — Styling & Content Integration (Weeks 13–15)
**Status**: Not Started  
**Duration**: 3 weeks  
**Target Completion**: December 25, 2025  

### CSS & Styling
- [ ] Complete McBeatch theme integration
- [ ] NOOR CSS modules (noor-ayah, noor-hadith, etc.)
- [ ] Arabic font bundling (Amiri, Noto)
- [ ] Responsive design implementation
- [ ] RTL (Right-to-Left) support

### Content Integration
- [ ] Beautiful Islam metadata integration
- [ ] Quran.com API integration
- [ ] Image path resolution (DEV/PROD)
- [ ] Content type styling and formatting

### Share Overlay Polish
- [ ] Share button visual refinements
- [ ] Asset overlay improvements
- [ ] User interaction enhancements
- [ ] Mobile responsiveness

---

## Phase 5 — Performance & Accessibility (Weeks 16–18)
**Status**: Not Started  
**Duration**: 3 weeks  
**Target Completion**: January 15, 2026  

### Performance Optimization
- [ ] Performance budgets implementation
- [ ] Asset caching strategy
- [ ] Virtual scrolling for large content
- [ ] Connection pooling and optimization
- [ ] Load testing and optimization

### Accessibility (WCAG 2.2 AA)
- [ ] Screen reader compatibility
- [ ] Keyboard navigation support
- [ ] ARIA attributes implementation
- [ ] Color contrast compliance
- [ ] Accessibility testing and validation

### Telemetry & Analytics
- [ ] User engagement metrics
- [ ] Session analytics
- [ ] Performance monitoring
- [ ] Error tracking and reporting
- [ ] Usage analytics dashboard

---

## Phase 6 — Testing & Deployment (Weeks 19–20)
**Status**: Not Started  
**Duration**: 2 weeks  
**Target Completion**: January 29, 2026  

### Automated Testing
- [ ] Unit test coverage completion
- [ ] Integration testing suite
- [ ] End-to-end testing implementation
- [ ] Performance testing automation
- [ ] Accessibility testing automation

### Load Testing
- [ ] Concurrent user load testing
- [ ] SignalR connection stress testing
- [ ] Database performance testing
- [ ] Memory and resource usage testing

### Deployment Preparation
- [ ] Production configuration
- [ ] Security hardening
- [ ] Deployment scripts and procedures
- [ ] Monitoring and alerting setup
- [ ] Documentation completion

### Go-Live Preparation
- [ ] Production deployment
- [ ] User training materials
- [ ] Support documentation
- [ ] Issue escalation procedures
- [ ] Post-deployment monitoring

---

## Overall Progress Summary

**Total Tasks**: 0 / 94 (0%)  
**Completed Phases**: 0 / 6  
**Current Phase**: Phase 1 (Planning)  
**Overall Status**: Planning & Design Complete  

### Key Milestones
- [ ] Phase 1 Complete (Skeleton & Foundation)
- [ ] Phase 2 Complete (Core Functionality)
- [ ] Phase 3 Complete (Advanced Features)
- [ ] Phase 4 Complete (Polish & Integration)
- [ ] Phase 5 Complete (Performance & Accessibility)
- [ ] Phase 6 Complete (Testing & Deployment)
- [ ] Production Go-Live

### Critical Dependencies
- [ ] SQL Server setup and configuration
- [ ] Development environment configuration
- [ ] External API access (Quran.com, Beautiful Islam)
- [ ] Design assets and branding materials

---

## Notes & Issues

### Implementation Notes
- Main application location: `D:\PROJECTS\NOOR CANVAS\SPA`
- Helper tools location: `D:\PROJECTS\NOOR CANVAS\Tools`  
- Issue tracker organization: Status-based folder structure
- All console apps use .NET 8 with consistent CLI contracts

### Blockers & Dependencies
*(None currently identified)*

### Change Requests
*(None currently pending)*

---

**Last Updated**: September 11, 2025  
**Next Review**: Weekly during active phases  
**Document Version**: 1.0  
