# NOOR CANVAS - Detailed Phased Implementation Plan

## Project Overview
NOOR CANVAS is a real-time Islamic content sharing platform enabling hosts to share religious content (Qur'an, Hadith, Etymology, Poetry) with participants through live sessions with annotation capabilities. The application will use the **McBeatch theme** styling framework for all web application views.

## Design Framework Integration
All web application interfaces will leverage the **McBeatch theme** components and styling:
- **Typography**: Open Sans font family with established hierarchy (h1-h6)
- **Color Scheme**: Professional palette with customizable color variants (red, blue, brown, green, orange, yellow)
- **Layout**: Bootstrap-based responsive grid system
- **Components**: Navigation, cards, buttons, forms, and interactive elements
- **Assets**: Integrated icons, images, and UI components from McBeatch theme
- **Multi-Platform Design**: Beautiful modern desktop version + responsive mobile interfaces
- **Language Support**: Arabic (RTL), English (LTR), and Urdu (RTL) with proper typography

---

## PHASE 1: Foundation & Infrastructure (Weeks 1-3)

### 1.1 Project Setup & Architecture
**Duration**: Week 1
**Deliverables**:
- [ ] ASP.NET Core 8.0 project structure with Clean Architecture
- [ ] Database setup (SQL Server with Entity Framework Core) using "canvas" schema
- [ ] SignalR Hub configuration for real-time communication
- [ ] GUID-based session validation (no traditional authentication required)
- [ ] **NOOR Diagnostic & Telemetry System** (comprehensive logging and monitoring)
- [ ] Basic configuration management

**Technical Stack**:
- Backend: ASP.NET Core 8.0, Entity Framework Core, SignalR
- Frontend: Blazor Server/WASM or React with TypeScript
- Database: SQL Server with "canvas" schema
- Styling: McBeatch theme + Custom NOOR styling
- Real-time: SignalR WebSocket connections
- Security: GUID-based session validation (no traditional authentication)
- **Diagnostics**: Serilog + Application Insights + Custom telemetry system
- **Development**: IIS Express x64 on localhost:8090
- **Production**: IIS site deployment with application pool configuration

### 1.2 Database Schema Design
**Duration**: Week 1-2
**Core Tables**:
```sql
-- Sessions Management (canvas schema)
canvas.Sessions (id, album_id, category_id, guid, host_token, status, created_at, expires_at)
canvas.SessionTranscripts (id, session_id, html_content, created_at)

-- User Management (canvas schema)
canvas.Registrations (id, session_id, name, country, city, fingerprint_hash, ip_hash, join_time)
canvas.AuditLog (id, session_id, registration_id, action, details, timestamp)

-- Content & Interactions (canvas schema)
canvas.Questions (id, session_id, registration_id, text, status, upvotes, order_index, created_at)
canvas.SharedAssets (id, session_id, asset_html, asset_type, shared_at, timer_duration)
canvas.Annotations (id, session_id, asset_id, annotation_data, created_at)
```

#### 1.2.1 Database Security & Access Configuration
**CRITICAL: Dedicated SQL Account & Cross-Schema Access**
**Duration**: Week 1 (Parallel with schema creation)

**SQL Account Requirements**:
- [ ] **Create dedicated SQL account**: `noor_canvas_app` for application access
- [ ] **Canvas schema permissions**: Full CRUD access to `canvas` schema objects
- [ ] **Cross-schema read access**: READ-ONLY access to `dbo` schema for Beautiful Islam integration
- [ ] **Image path resolution**: Access to Beautiful Islam image metadata in `dbo` schema
- [ ] **Connection string security**: Encrypted credentials and connection pooling

**Database Access Pattern**:
```sql
-- Create dedicated application user
CREATE USER [noor_canvas_app] WITH PASSWORD = 'SecurePassword123!';

-- Grant full access to canvas schema
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::canvas TO [noor_canvas_app];

-- Grant read-only access to dbo schema for Beautiful Islam data
GRANT SELECT ON SCHEMA::dbo TO [noor_canvas_app];

-- Specific permissions for image path resolution
GRANT SELECT ON dbo.Sessions TO [noor_canvas_app];
GRANT SELECT ON dbo.SessionTranscripts TO [noor_canvas_app];
-- Additional dbo tables as needed for image/content references
```

**Cross-Application Integration**:
- [ ] **Image Reference Strategy**: Read image paths from Beautiful Islam `dbo` schema
- [ ] **Content Integration**: Access Beautiful Islam session data for transcript loading
- [ ] **Security Isolation**: NOOR CANVAS writes only to `canvas` schema
- [ ] **Data Consistency**: Referential integrity across schemas where needed

### 1.2.1 NOOR Diagnostic & Telemetry System
**PRIORITY: First Implementation After Project Skeleton**
**Duration**: Week 1 (Parallel with database setup)

#### Core Architecture - "NOOR Observer"
**Overview**: Comprehensive diagnostic, logging, and telemetry system with environment-aware configuration and real-time monitoring capabilities.

**Key Components**:
- [ ] **Server-Side Telemetry**: Structured logging with Serilog + Application Insights
- [ ] **Client-Side Telemetry**: Browser console integration + custom dashboard
- [ ] **Real-Time Monitoring**: SignalR-based live diagnostics for development
- [ ] **Performance Metrics**: Session performance, annotation latency, user experience tracking
- [ ] **Configuration-Driven**: AppSettings-controlled diagnostic levels (Development/Staging/Production)

#### Recommended NuGet Packages & Libraries
**Server-Side Packages**:
```xml
<!-- Core Logging & Telemetry -->
<PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
<PackageReference Include="Serilog.Sinks.Console" Version="5.0.0" />
<PackageReference Include="Serilog.Sinks.File" Version="5.0.0" />
<PackageReference Include="Serilog.Sinks.ApplicationInsights" Version="4.0.0" />
<PackageReference Include="Microsoft.ApplicationInsights.AspNetCore" Version="2.21.0" />

<!-- Advanced Diagnostics -->
<PackageReference Include="Serilog.Enrichers.Environment" Version="2.3.0" />
<PackageReference Include="Serilog.Enrichers.Process" Version="2.0.2" />
<PackageReference Include="Serilog.Enrichers.Thread" Version="3.1.0" />
<PackageReference Include="Serilog.Settings.Configuration" Version="8.0.0" />

<!-- Performance Monitoring -->
<PackageReference Include="System.Diagnostics.DiagnosticSource" Version="8.0.0" />
<PackageReference Include="Microsoft.Extensions.Diagnostics.HealthChecks" Version="8.0.0" />
```

**Client-Side Libraries**:
```json
{
  "dependencies": {
    "@microsoft/applicationinsights-web": "^3.0.5",
    "console-feed": "^3.5.1",
    "debug": "^4.3.4",
    "loglevel": "^1.8.1"
  }
}
```

#### Configuration Structure (appsettings.json)
```json
{
  "NoorObserver": {
    "Enabled": true,
    "LogLevel": "Debug",
    "Environment": "Development",
    "Features": {
      "ServerLogging": true,
      "ClientLogging": true,
      "RealTimeMonitoring": true,
      "PerformanceMetrics": true,
      "SignalRDiagnostics": true,
      "SessionTracking": true,
      "AnnotationPerformance": true
    },
    "Outputs": {
      "Console": true,
      "File": true,
      "ApplicationInsights": false,
      "Dashboard": true
    },
    "Dashboard": {
      "Enabled": true,
      "Port": 5050,
      "RealTimeUpdates": true
    }
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning",
        "Microsoft.AspNetCore.SignalR": "Debug"
      }
    }
  }
}
```

#### Implementation Features
**Server-Side Capabilities**:
- [ ] **Structured Logging**: JSON-formatted logs with contextual information
- [ ] **Session Lifecycle Tracking**: Complete session flow monitoring
- [ ] **SignalR Connection Monitoring**: Real-time connection health and message flow
- [ ] **Performance Counters**: Annotation sync times, share latency, database query performance
- [ ] **Error Correlation**: Automatic error tracking with stack traces and context
- [ ] **Health Checks**: Endpoint monitoring for database, SignalR, and external dependencies

**Client-Side Capabilities**:
- [ ] **Browser Console Integration**: Enhanced console logging with filtering and formatting
- [ ] **User Action Tracking**: Click, scroll, annotation, and Q&A interaction logging
- [ ] **Performance Monitoring**: Page load times, canvas rendering, real-time update latency
- [ ] **Error Boundary Logging**: Automatic JavaScript error capture and reporting
- [ ] **Network Request Monitoring**: API call tracking with timing and response analysis

**Development-Specific Features**:
- [ ] **Live Diagnostic Dashboard**: Real-time log viewing during development
- [ ] **Session Replay Capability**: Record and replay user sessions for debugging
- [ ] **Annotation Performance Visualizer**: Real-time annotation latency graphs
- [ ] **SignalR Message Inspector**: Live SignalR message flow visualization
- [ ] **Database Query Profiler**: EF Core query performance analysis

#### Auto-Configuration for Development
**Environment Detection**:
```csharp
// Automatic development mode detection
if (builder.Environment.IsDevelopment())
{
    // Enable all diagnostic features
    builder.Services.AddNoorObserver(config => {
        config.EnableAllFeatures();
        config.StartDashboard(port: 5050);
        config.EnableRealTimeMonitoring();
    });
}
```

**Production Safety**:
- [ ] **Automatic Disable**: Sensitive diagnostics automatically disabled in production
- [ ] **Performance Impact**: Minimal overhead when disabled
- [ ] **Security**: No sensitive data logging in production mode
- [ ] **Compliance**: GDPR/privacy-compliant logging practices

#### Diagnostic Categories
**Session Management**:
- Session creation, start, end events
- Participant join/leave tracking
- Host action monitoring

**Real-Time Features**:
- SignalR connection events
- Message delivery confirmation
- Annotation synchronization timing

**Performance Metrics**:
- Share-to-render latency
- Annotation round-trip time
- Database query performance
- Memory usage patterns

**User Experience**:
- Page load times
- Interactive element response times
- Error occurrence patterns
- Feature usage analytics

### 1.3 McBeatch Theme Integration
**Duration**: Week 2-3
**Styling Architecture**:
- [ ] Extract and integrate McBeatch CSS framework
- [ ] Create NOOR-specific style extensions (`noor-*.css` modules)
- [ ] Implement responsive design patterns from McBeatch
- [ ] Set up color theming system (default: professional blue/green palette)
- [ ] Configure typography and icon systems

**CRITICAL: CSS Independence from KSESSIONS with Cross-Application Asset Access**:
- [ ] **Extract Islamic Content CSS Rules**: Mine and extract all CSS rules for Islamic content from `D:\PROJECTS\KSESSIONS\Source Code\Sessions.Spa\Content\styles\`
- [ ] **Create Self-Contained Modules**: Build independent CSS files with zero dependency on KSESSIONS project files
- [ ] **Asset-Specific Extraction**:
  - Extract `.ayah-card`, `.golden-surah-header`, `.ayah-arabic`, `.ayah-translation` styles
  - Extract `.ks-ahadees-container`, `.ks-ahadees-header`, `.ks-ahadees-arabic` styles  
  - Extract `.etymology-derivative-card`, `.derivative-root-reference` styles
  - Extract `.poetry-wrapper`, `.froala-poetry-container`, `.poetry-couplet` styles
  - Extract image styling, editor compatibility classes, and utility styles
- [ ] **Font and Asset Localization**: Copy and bundle all fonts, icons locally
- [ ] **CRITICAL - Image Reference Strategy**: DO NOT copy images - Reference existing KSESSIONS locations
  - DEV: `D:\PROJECTS\KSESSIONS\Source Code\Sessions.Spa\Resources\IMAGES`
  - PROD: `D:\Websites\KSESSIONS\Resources\IMAGES`
  - Update CSS url() paths to reference existing Beautiful Islam image directories
- [ ] **Database Integration**: Use `dbo` schema read access to resolve image paths and content references
- [ ] **Validation**: Ensure pixel-perfect rendering with cross-application asset references

**Style Modules Structure**:
```
/styles/
  /mcbeatch/
    - bootstrap.min.css
    - style.css (core McBeatch styles)
    - [color].css (theme variants)
    - font-awesome.min.css
  /noor/
    - noor-core.css (base application styles)
    - noor-ayah.css (Qur'an verse styling)
    - noor-hadith.css (Hadith content styling)
    - noor-etymology.css (Etymology card styling)
    - noor-poetry.css (Poetry display styling)
    - noor-canvas.css (Canvas/whiteboard styling)
    - noor-annotations.css (Live annotation styling)
```

#### 1.3.1 KSESSIONS CSS Extraction Process
**CRITICAL: Zero Dependency Migration**
**Duration**: Week 2 (Parallel with McBeatch integration)
**Source Location**: `D:\PROJECTS\KSESSIONS\Source Code\Sessions.Spa\Content\styles\`

**Extraction Methodology**:
- [ ] **CSS File Analysis**: Analyze all CSS files in KSESSIONS styles directory
- [ ] **Selector Identification**: Create comprehensive list of all Islamic content selectors
- [ ] **Dependency Mapping**: Map all @import, url(), and external references
- [ ] **Asset Cataloging**: List all fonts, images, icons referenced in CSS
- [ ] **Rule Extraction**: Extract complete CSS rules with all vendor prefixes and responsive breakpoints
- [ ] **Local Asset Migration**: Copy all referenced assets to NOOR CANVAS project structure
- [ ] **Path Resolution**: Update all asset paths to local project references
- [ ] **Testing**: Validate extracted CSS produces identical visual output

**Key CSS Targets for Extraction**:
```css
/* Qur'an/Ayah Styles */
.ayah-card, .golden-surah-header, .clickable-ayah-header
.ayah-arabic, .ayah-translation, .translation-header, .ayah-number-img

/* Hadith Styles */
.inserted-hadees, .ks-ahadees-container, .ks-ahadees-header
.ks-ahadees-subject, .ks-ahadees-arabic, .ks-ahadees-english
.delete-hadees-btn, .ks-ahadees-delete-btn, .ks-ahadees-header-icon

/* Etymology Styles */
.etymology-derivative-card, .derivative-root-reference
.derivative-main-display

/* Poetry Styles */
.poetry-wrapper, .froala-poetry-container, .poetry-poet-header
.poetry-couplet, .poetry-restore-btn, .froala-only-btn
.arabic-text, .text-maroon

/* Editor & Utility Styles */
.fr-fic, .fr-dii, .fr-dib, .imgResponsive, .fr-bordered
.row, .col-xs-12, .btn, .btn-sm, .btn-primary
.text-center, .text-muted, .h3
```

**Asset Migration Checklist**:
- [ ] **Fonts**: Extract Amiri, Noto Naskh, Inter, and any custom fonts
- [ ] **Icons**: Font Awesome files and any custom icon fonts  
- [ ] **Images**: Verse number images, background patterns, decorative elements
- [ ] **CSS References**: Update all url() paths to local project structure
- [ ] **Validation**: Ensure zero external dependencies remain

---

## PHASE 2: Core Platform Development (Weeks 4-8)

### 2.1 Host Experience Implementation
**Duration**: Weeks 4-6

#### 2.1.1 Session Management Interface
**Using McBeatch Components for Desktop & Mobile**:
- [ ] **Desktop Dashboard**: Beautiful modern interface with McBeatch card layouts and advanced navigation
- [ ] **Mobile Dashboard**: Simplified responsive interface optimized for touch
- [ ] **Session creation wizard**: Multi-step interface using McBeatch form styling
- [ ] **Album/Category/Session selection**: Enhanced dropdown components with search/filter
- [ ] **McBeatch button styling**: Consistent across all platforms with touch-friendly sizing

**Features**:
- [ ] **Session Creation**: Album → Category → Session selection flow
- [ ] **Host Console**: Real-time transcript view with McBeatch layout (desktop-optimized)
- [ ] **Session Controls**: BEGIN/END session with confirmation modals
- [ ] **Participant Overview**: Live roster with McBeatch table styling (desktop) / simplified list (mobile)
- [ ] **Session Status**: Real-time indicators using McBeatch badges
- [ ] **Multi-Language Support**: Interface elements support Arabic, English, and Urdu

#### 2.1.2 Content Sharing System
**McBeatch Integration**:
- [ ] Transcript viewer with McBeatch content panels
- [ ] Share button overlays with McBeatch button styling
- [ ] Timer controls using McBeatch form elements
- [ ] Asset preview with McBeatch card components

**Technical Features**:
- [ ] **HTML Content Injection**: Dynamic "Share" button overlay system
- [ ] **Asset Detection**: Identify shareable blocks (`.ayah-card`, `.ks-ahadees-container`, etc.)
- [ ] **Content Sanitization**: Server-side HTML cleaning and validation
- [ ] **Timer Management**: Per-share countdown (30s/1m/3m/5m/custom/none)
- [ ] **Real-time Broadcasting**: SignalR content distribution

#### 2.1.3 Q&A Moderation Panel
**McBeatch UI Components**:
- [ ] Question list with McBeatch list-group styling
- [ ] Drag-and-drop reordering with McBeatch interactive elements
- [ ] Moderation buttons using McBeatch button variants
- [ ] Status indicators with McBeatch badge system

**Functionality**:
- [ ] **Question Management**: Pin, hide, mark answered, reorder
- [ ] **Participant Identity**: Full visibility for host, anonymized for others
- [ ] **Database Persistence**: All Q&A interactions logged with metadata

### 2.2 Participant Experience Implementation
**Duration**: Weeks 5-7

#### 2.2.1 Registration & Waiting Experience
**McBeatch Design Elements**:
- [ ] Registration form with McBeatch form styling
- [ ] Waiting room with McBeatch loading components
- [ ] Responsive design using McBeatch grid system
- [ ] Subtle animations respecting `prefers-reduced-motion`

**User Flow**:
- [ ] **Registration**: Name, country, optional city capture
- [ ] **Waiting Room**: Calm, minimal interface with soft backgrounds
- [ ] **Session Validation**: Real-time session status checking
- [ ] **Auto-transition**: Seamless move to Canvas when session begins

#### 2.2.2 Canvas/Whiteboard Interface
**McBeatch Layout System - Multi-Platform**:
- [ ] **Desktop Interface**: Large canvas area with full annotation toolbar and side panels
- [ ] **Mobile Interface**: Simplified canvas with touch-optimized controls
- [ ] **Tablet Interface**: Hybrid approach with moderate feature set
- [ ] **Header**: Session metadata using McBeatch navbar (responsive)
- [ ] **Asset display area**: McBeatch card styling with zoom controls for mobile
- [ ] **Q&A panel**: Desktop sidebar / Mobile bottom sheet using McBeatch components

**Interactive Features**:
- [ ] **Real-time Asset Display**: Styled content matching original formatting across all devices
- [ ] **Live Annotations Viewing**: 
  - Desktop: Full annotation display with interaction
  - Mobile: Read-only simplified annotation viewing
- [ ] **Responsive Layout**: Mobile-first design with McBeatch breakpoints
- [ ] **Waiting States**: Elegant transitions between shared content
- [ ] **Cross-Application Content**: Seamless integration with Beautiful Islam content via `dbo` schema access

#### 2.2.3 Q&A Interaction System
**McBeatch Form Components**:
- [ ] Question submission with McBeatch input styling
- [ ] Voting interface using McBeatch button groups
- [ ] Question list with McBeatch list styling
- [ ] Real-time updates with subtle animations

**Features**:
- [ ] **Question Submission**: Real-time text input with character limits
- [ ] **Upvoting System**: Democratic question prioritization
- [ ] **Anonymous Display**: Privacy-preserving question display
- [ ] **Persistence**: All interactions saved with participant tracking

---

## PHASE 3: Advanced Features Development (Weeks 9-12)

### 3.1 Live Annotation System
**Duration**: Weeks 9-11

#### 3.1.1 Host Annotation Tools
**McBeatch Toolbar Integration**:
- [ ] Annotation toolbar with McBeatch button styling
- [ ] Tool selection with McBeatch radio/toggle buttons
- [ ] Color picker with McBeatch dropdown components
- [ ] Undo/redo with McBeatch icon buttons

**Technical Implementation**:
- [ ] **SVG Overlay Architecture**: Transparent layer over shared content
- [ ] **Drawing Tools**: Laser pointer, underline, box, arrow, pen, text highlight
- [ ] **RTL Text Support**: Arabic text highlighting with DOM Range API
- [ ] **Keyboard Shortcuts**: Shift (straight lines), Ctrl+Z/Y (undo/redo)
- [ ] **Real-time Sync**: 45Hz drawing updates via SignalR

#### 3.1.2 Annotation Synchronization
**Performance Targets**:
- [ ] **Real-time Updates**: <100ms median round-trip latency
- [ ] **Throttling**: Coalesced drawing operations for efficiency
- [ ] **Conflict Resolution**: Last-write-wins with timestamp ordering
- [ ] **Memory Management**: Automatic cleanup on asset transitions

#### 3.1.3 Annotation Lifecycle
**Features**:
- [ ] **Session-scoped**: Annotations exist only while asset is shared
- [ ] **Auto-clear**: Reset on next asset or waiting state
- [ ] **Export Options**: Save annotations with shared content (future enhancement)

### 3.2 User Management & Security
**Duration**: Weeks 10-12

#### 3.2.1 Participant Control System
**McBeatch Admin Interface**:
- [ ] Participant roster with McBeatch table styling
- [ ] Action buttons with McBeatch button variants
- [ ] Confirmation modals using McBeatch modal components
- [ ] Status indicators with McBeatch badges

**Administrative Features**:
- [ ] **Kick Functionality**: Temporary removal with rejoin capability
- [ ] **Ban System**: Session-scoped permanent exclusion
- [ ] **Identity Tracking**: Registration ID + fingerprint/IP hashing
- [ ] **Audit Logging**: All moderation actions recorded

#### 3.2.2 Session Security
**Technical Implementation**:
- [ ] **Session GUID Generation**: Cryptographically secure tokens for session access
- [ ] **Token Expiration**: 3-hour maximum session duration
- [ ] **GUID-based Access Control**: Session validity through GUID verification only
- [ ] **Rate Limiting**: API and SignalR connection throttling

---

## PHASE 4: Styling & Content Integration (Weeks 13-15)

### 4.1 Self-Contained Content Styling
**Duration**: Weeks 13-14

#### 4.1.1 Islamic Content CSS Modules
**CRITICAL: Complete KSESSIONS Independence**:
- [ ] **Source Analysis**: Thoroughly analyze `D:\PROJECTS\KSESSIONS\Source Code\Sessions.Spa\Content\styles\` to identify all CSS rules affecting Islamic content
- [ ] **CSS Rule Extraction**: Extract and migrate all relevant styles without any file dependencies
- [ ] **Asset Inventory**: Catalog all fonts, images, icons, and media files referenced in KSESSIONS styles
- [ ] **Local Asset Migration**: Copy and host all external assets locally within NOOR CANVAS

**Content-Specific Styling**:
- [ ] **Qur'an Styling** (`noor-ayah.css`):
  - Extract: `.ayah-card`, `.golden-surah-header`, `.ayah-arabic`, `.ayah-translation`
  - Extract: `.clickable-ayah-header`, `.ayah-number-img`, `.translation-header`
  - RTL text rendering with proper ligatures
  - Verse number styling and positioning
  - McBeatch card integration for container styling

- [ ] **Hadith Styling** (`noor-hadith.css`):
  - Extract: `.ks-ahadees-container`, `.ks-ahadees-header`, `.ks-ahadees-arabic`
  - Extract: `.ks-ahadees-english`, `.ks-ahadees-subject`, `.ks-ahadees-header-icon`
  - Extract: `.inserted-hadees`, `.delete-hadees-btn`, `.ks-ahadees-delete-btn`
  - Collection and narrator information display
  - McBeatch typography integration

- [ ] **Etymology Styling** (`noor-etymology.css`):
  - Extract: `.etymology-derivative-card`, `.derivative-root-reference`
  - Extract: `.derivative-main-display` and all nested styling
  - Gradient backgrounds and semantic color coding
  - McBeatch spacing and typography

- [ ] **Poetry Styling** (`noor-poetry.css`):
  - Extract: `.poetry-wrapper`, `.froala-poetry-container`, `.poetry-couplet`
  - Extract: `.poetry-poet-header`, `.poetry-restore-btn`, `.froala-only-btn`
  - Extract: `.arabic-text`, `.text-maroon`, `.text-muted` classes
  - Bilingual display with proper alignment
  - McBeatch responsive grid integration

- [ ] **Editor Compatibility** (`noor-editor-compat.css`):
  - Extract: `.fr-fic`, `.fr-dii`, `.fr-dib`, `.imgResponsive`, `.fr-bordered`
  - Extract: `.row`, `.col-xs-12`, Bootstrap grid compatibility
  - Extract: `.btn`, `.btn-sm`, `.btn-primary`, `.text-center` utilities

#### 4.1.2 Font and Asset Management
**Cross-Application Asset Strategy with Beautiful Islam Integration**:
- [ ] **Typography Migration**: 
  - Extract and bundle Amiri, Noto Naskh, Inter fonts from KSESSIONS
  - Add Urdu font support (Noto Nastaliq Urdu or equivalent)
  - Identify all font-face declarations and font file dependencies
  - Create local font hosting with proper WOFF2/WOFF/TTF fallbacks
- [ ] **Icon System Migration**:
  - Extract Font Awesome styles and font files from KSESSIONS
  - Create local Font Awesome hosting or migrate to modern alternatives
  - Ensure all icon references work independently
- [ ] **CRITICAL - Image Asset Integration**: 
  - **DO NOT COPY IMAGES** - Reference existing Beautiful Islam image locations
  - DEV Environment: `D:\PROJECTS\KSESSIONS\Source Code\Sessions.Spa\Resources\IMAGES`
  - PROD Environment: `D:\Websites\KSESSIONS\Resources\IMAGES`
  - Use `dbo` schema read access to resolve image metadata and paths
  - Update CSS url() references to point to existing Beautiful Islam image directories
  - Ensure NOOR CANVAS application has file system read access to image directories
- [ ] **Database-Driven Asset Resolution**: 
  - Query `dbo` schema for image metadata and paths
  - Implement fallback mechanisms for missing images
  - Cache image path resolution for performance
- [ ] **Performance Optimization**: 
  - Implement local caching strategies for CSS and fonts
  - Optimize asset loading and bundling
  - Leverage existing Beautiful Islam image caching infrastructure

### 4.2 Share Button Overlay System
**Duration**: Week 14-15

#### 4.2.1 Dynamic UI Injection
**Technical Implementation**:
- [ ] **Content Detection**: Scan for shareable content blocks
- [ ] **Overlay Positioning**: Centered share buttons with McBeatch styling
- [ ] **Hover States**: Interactive feedback using McBeatch hover effects
- [ ] **Accessibility**: Keyboard navigation and screen reader support

#### 4.2.2 UI Integration
**McBeatch Components**:
- [ ] Share buttons with McBeatch button styling
- [ ] Tooltips and hints using McBeatch popover components
- [ ] Loading states with McBeatch spinner elements
- [ ] Success feedback with McBeatch alert components

---

## PHASE 5: Performance & Polish (Weeks 16-18)

### 5.1 Performance Optimization
**Duration**: Weeks 16-17

#### 5.1.1 Real-time Performance
**Metrics & Targets**:
- [ ] **Share Latency**: <200ms P95 from host share to participant render
- [ ] **Annotation Sync**: <100ms median round-trip for drawing operations
- [ ] **Connection Stability**: 99.5% uptime for SignalR connections
- [ ] **Concurrent Users**: Support 100+ participants per session

#### 5.1.2 Frontend Optimization
**McBeatch Theme Optimization**:
- [ ] **CSS Minification**: Optimized McBeatch stylesheets
- [ ] **Asset Compression**: Images and fonts optimized for web delivery
- [ ] **Lazy Loading**: Progressive content loading strategies
- [ ] **Caching**: Browser and CDN caching for static assets

### 5.2 Accessibility & UX
**Duration**: Weeks 17-18

#### 5.2.1 WCAG 2.2 AA Compliance
**Accessibility Features**:
- [ ] **Keyboard Navigation**: Full keyboard accessibility for all features
- [ ] **Screen Reader Support**: ARIA labels and live regions
- [ ] **Color Contrast**: McBeatch theme compliance with WCAG standards
- [ ] **Motion Preferences**: `prefers-reduced-motion` support throughout

#### 5.2.2 User Experience Polish
**McBeatch Integration Excellence**:
- [ ] **Consistent Styling**: Unified design language across all interfaces
- [ ] **Responsive Design**: Mobile-first approach with McBeatch breakpoints
- [ ] **Loading States**: Elegant transitions and feedback
- [ ] **Error Handling**: User-friendly error messages with McBeatch styling

---

## PHASE 6: Testing & Deployment (Weeks 19-20)

### 6.1 Comprehensive Testing
**Duration**: Week 19

#### 6.1.1 Functional Testing
**Test Coverage**:
- [ ] **Host Workflow**: Complete session lifecycle testing
- [ ] **Participant Experience**: Registration through conclusion
- [ ] **Real-time Features**: Annotation and Q&A synchronization
- [ ] **Security Testing**: GUID validation, session management, and access control

#### 6.1.2 Performance Testing
**Load Testing Scenarios**:
- [ ] **Concurrent Sessions**: Multiple simultaneous sessions
- [ ] **High Participant Count**: 100+ users per session
- [ ] **Annotation Stress**: Heavy drawing activity simulation
- [ ] **Network Conditions**: Various connectivity scenarios

### 6.2 Production Deployment
**Duration**: Week 20

#### 6.2.1 Infrastructure Setup
**Deployment Strategy**:
- [ ] **Development Environment**: IIS Express x64 configured for localhost:8090
- [ ] **Production Environment**: IIS site deployment with dedicated application pool
- [ ] **Azure/AWS Setup**: Cloud infrastructure provisioning (if cloud deployment required)
- [ ] **Database Migration**: Production database setup and seeding
- [ ] **SignalR Scaling**: Redis backplane for multi-instance deployment
- [ ] **CDN Configuration**: Static asset delivery optimization

**IIS Configuration Requirements**:
- [ ] **Application Pool**: .NET 8.0 runtime, 64-bit enabled
- [ ] **SSL Certificate**: HTTPS configuration for production
- [ ] **URL Rewrite**: SPA routing support for client-side navigation
- [ ] **Compression**: Enable static and dynamic content compression
- [ ] **WebSocket Support**: Ensure WebSocket protocol enabled for SignalR

#### 6.2.2 IIS Setup Instructions - Step by Step

**Prerequisites**:
- [ ] Windows Server 2019/2022 or Windows 10/11 Pro with IIS enabled
- [ ] .NET 8.0 Hosting Bundle installed
- [ ] SQL Server with "canvas" and "dbo" schemas configured
- [ ] IIS Manager access with administrative privileges

**Step 1: Install Required Features**
```powershell
# Enable IIS with ASP.NET Core features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-RequestFiltering, IIS-StaticContent, IIS-DefaultDocument, IIS-DirectoryBrowsing, IIS-ASPNET45, IIS-NetFxExtensibility45, IIS-ISAPIExtensions, IIS-ISAPIFilter, IIS-HttpCompressionStatic, IIS-HttpCompressionDynamic, IIS-WebSockets

# Install .NET 8.0 Hosting Bundle (download from Microsoft)
# https://dotnet.microsoft.com/download/dotnet/8.0
```

**Step 2: Create Application Pool**
1. Open **IIS Manager**
2. Right-click **Application Pools** → **Add Application Pool**
3. **Application Pool Settings**:
   - **Name**: `NOOR_CANVAS_AppPool`
   - **.NET CLR Version**: `No Managed Code` (for .NET 8.0)
   - **Managed Pipeline Mode**: `Integrated`
   - **Start Immediately**: ✅ Checked

4. **Advanced Settings** (Right-click pool → Advanced Settings):
   - **Process Model** → **Identity**: `ApplicationPoolIdentity`
   - **Process Model** → **Load User Profile**: `True`
   - **Process Model** → **Enable 32-Bit Applications**: `False`
   - **Recycling** → **Regular Time Interval**: `1740` (29 hours)
   - **CPU** → **Limit**: `0` (unlimited)
   - **CPU** → **Limit Action**: `NoAction`

**Step 3: Create IIS Site**
1. Right-click **Sites** → **Add Website**
2. **Site Configuration**:
   - **Site Name**: `NOOR CANVAS`
   - **Application Pool**: `NOOR_CANVAS_AppPool`
   - **Physical Path**: `C:\inetpub\wwwroot\noorcanvas` (or your deployment path)
   - **Binding Type**: `http`
   - **IP Address**: `All Unassigned`
   - **Port**: `8090` (development) or `80/443` (production)
   - **Host Name**: Leave blank for development, set domain for production

**Step 4: Configure Site Settings**
1. Select your site in IIS Manager
2. **Authentication**:
   - **Anonymous Authentication**: `Enabled`
   - **Windows Authentication**: `Disabled` (NOOR CANVAS uses GUID-based sessions)
   
3. **Compression**:
   - Enable **Static Content Compression**
   - Enable **Dynamic Content Compression**

4. **URL Rewrite** (install URL Rewrite module if not present):
   ```xml
   <!-- Add to web.config in site root -->
   <system.webServer>
     <rewrite>
       <rules>
         <rule name="SPA Routes" stopProcessing="true">
           <match url=".*" />
           <conditions logicalGrouping="MatchAll">
             <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
             <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
             <add input="{REQUEST_URI}" pattern="^/(hub)" negate="true" />
           </conditions>
           <action type="Rewrite" url="/" />
         </rule>
       </rules>
     </rewrite>
   </system.webServer>
   ```

**Step 5: WebSocket Configuration**
1. Select your site → **WebSocket Protocol**
2. **Enable WebSocket Protocol**: ✅ (required for SignalR)
3. Verify in web.config:
   ```xml
   <system.webServer>
     <webSocket enabled="true" />
   </system.webServer>
   ```

**Step 6: Database Connection Setup**
1. **SQL Server Permissions**:
   ```sql
   -- Create login for IIS application pool
   USE master;
   CREATE LOGIN [IIS APPPOOL\NOOR_CANVAS_AppPool] FROM WINDOWS;
   
   -- Grant access to canvas and dbo schemas
   USE [YourDatabase];
   CREATE USER [IIS APPPOOL\NOOR_CANVAS_AppPool] FOR LOGIN [IIS APPPOOL\NOOR_CANVAS_AppPool];
   ALTER ROLE db_datareader ADD MEMBER [IIS APPPOOL\NOOR_CANVAS_AppPool];
   ALTER ROLE db_datawriter ADD MEMBER [IIS APPPOOL\NOOR_CANVAS_AppPool];
   
   -- Grant execute permissions on canvas schema
   GRANT EXECUTE ON SCHEMA::canvas TO [IIS APPPOOL\NOOR_CANVAS_AppPool];
   -- Grant read-only access to dbo schema (for Beautiful Islam integration)
   GRANT SELECT ON SCHEMA::dbo TO [IIS APPPOOL\NOOR_CANVAS_AppPool];
   ```

2. **Connection String** (in appsettings.json):
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=YourDatabase;Integrated Security=true;TrustServerCertificate=true;MultipleActiveResultSets=true"
     }
   }
   ```

**Step 7: SSL Configuration (Production)**
1. **Certificate Installation**:
   - Install SSL certificate in Windows Certificate Store
   - Or use Let's Encrypt with win-acme for free certificates

2. **HTTPS Binding**:
   - Right-click site → **Edit Bindings**
   - **Add** → Type: `https`, Port: `443`, SSL Certificate: [Select installed certificate]

3. **HTTP to HTTPS Redirect**:
   ```xml
   <system.webServer>
     <rewrite>
       <rules>
         <rule name="HTTP to HTTPS redirect" stopProcessing="true">
           <match url="(.*)" />
           <conditions>
             <add input="{HTTPS}" pattern="off" ignoreCase="true" />
           </conditions>
           <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
         </rule>
       </rules>
     </rewrite>
   </system.webServer>
   ```

**Step 8: Application Deployment**
1. **Publish Application**:
   ```powershell
   # From your development machine
   dotnet publish -c Release -r win-x64 --self-contained false -o "./publish"
   ```

2. **Copy Files**:
   - Copy published files to `C:\inetpub\wwwroot\noorcanvas\`
   - Ensure `web.config` is present and configured
   - Copy `appsettings.Production.json` with production settings

3. **Set Permissions**:
   ```powershell
   # Grant IIS_IUSRS read/execute permissions to site folder
   icacls "C:\inetpub\wwwroot\noorcanvas" /grant "IIS_IUSRS:(OI)(CI)RX" /T
   
   # Grant application pool write access to logs folder
   icacls "C:\inetpub\wwwroot\noorcanvas\Logs" /grant "IIS APPPOOL\NOOR_CANVAS_AppPool:(OI)(CI)F" /T
   ```

**Step 9: Verification & Troubleshooting**
1. **Test Application**:
   - Browse to `http://localhost:8090` (or your configured port)
   - Verify SignalR connections work
   - Test database connectivity

2. **Common Issues**:
   - **500.19 Error**: Check web.config syntax and .NET 8 hosting bundle
   - **500.30 Error**: Verify application pool .NET version and publish settings
   - **SignalR Issues**: Confirm WebSocket protocol is enabled
   - **Database Errors**: Verify connection string and SQL permissions

3. **Performance Monitoring**:
   - Enable **Failed Request Tracing** for debugging
   - Configure **Application Insights** for production monitoring
   - Set up **Health Checks** endpoint

#### 6.2.3 Go-Live Preparation
**Launch Readiness**:
- [ ] **Documentation**: User guides and admin documentation
- [ ] **Training Materials**: Host training resources
- [ ] **Monitoring**: Application performance monitoring setup
- [ ] **Support Process**: Issue tracking and resolution procedures

---

## Technical Architecture Summary

### Frontend Architecture
```
/src/
  /components/
    /shared/           # McBeatch-styled reusable components
    /host/            # Host-specific interfaces
    /participant/     # Participant interfaces
  /styles/
    /mcbeatch/        # McBeatch theme files
    /noor/           # NOOR-specific extensions
  /services/          # SignalR and API services
  /diagnostics/       # NOOR Observer client telemetry
  /utils/            # Utility functions and helpers
```

### Backend Architecture
```
/src/
  /NoorCanvas.API/          # Web API and SignalR hubs
  /NoorCanvas.Core/         # Business logic and entities
  /NoorCanvas.Infrastructure/ # Data access and external services
  /NoorCanvas.Shared/       # Shared models and contracts
  /NoorCanvas.Diagnostics/  # NOOR Observer telemetry system
```

### Database Architecture
- **Session Management**: Sessions, transcripts, and metadata (canvas schema)
- **User Management**: Registration, audit logs, and permissions (canvas schema)
- **Content System**: Shared assets, annotations, and Q&A (canvas schema)
- **Cross-Application Integration**: Read-only access to Beautiful Islam data (dbo schema)
- **Security**: Dedicated SQL account `noor_canvas_app` with schema-specific permissions
- **Performance**: Optimized indexes and query patterns
- **Image Resolution**: Database-driven asset path resolution from Beautiful Islam

## Success Metrics

### Host Experience
- [ ] Session setup time < 2 minutes
- [ ] Content sharing latency < 200ms
- [ ] Annotation tools responsive and intuitive
- [ ] Q&A moderation efficient and comprehensive

### Participant Experience  
- [ ] Registration process < 30 seconds
- [ ] Canvas loading time < 3 seconds
- [ ] Real-time updates seamless and smooth
- [ ] Mobile experience fully functional

### Technical Performance
- [ ] 99.5% uptime for live sessions
- [ ] Support 100+ concurrent participants
- [ ] Sub-100ms annotation synchronization
- [ ] WCAG 2.2 AA accessibility compliance

### Design Integration
- [ ] Consistent McBeatch styling across all views (desktop and mobile)
- [ ] Beautiful modern desktop interface with advanced features
- [ ] Responsive design for all device sizes (mobile-first approach)
- [ ] Professional, cohesive visual identity
- [ ] Seamless theme customization capabilities
- [ ] Multi-language support (Arabic RTL, English LTR, Urdu RTL)

### Cross-Application Integration Excellence
- [ ] Seamless Beautiful Islam content integration via dbo schema access
- [ ] Efficient image asset referencing without duplication
- [ ] Database-driven content resolution with fallback mechanisms
- [ ] Shared infrastructure utilization for optimal performance

### Diagnostic & Telemetry Excellence
- [ ] Zero-configuration development diagnostics
- [ ] Real-time performance monitoring during development
- [ ] Comprehensive error tracking and correlation
- [ ] Production-safe telemetry with privacy compliance
- [ ] Sub-5ms diagnostic overhead in production mode

---

## Risk Mitigation

### Technical Risks
- **SignalR Scaling**: Implement Redis backplane early
- **Real-time Performance**: Continuous latency monitoring with NOOR Observer
- **Browser Compatibility**: Cross-browser testing throughout development
- **Mobile Performance**: Regular mobile device testing with diagnostic telemetry
- **Diagnostic Overhead**: Monitor performance impact of telemetry system in production

### User Experience Risks
- **Complexity**: Iterative UX testing and simplification
- **Accessibility**: WCAG compliance testing at each phase
- **Performance**: Load testing with realistic user scenarios
- **Content Styling**: Pixel-perfect reproduction of Islamic content

### Project Risks
- **Scope Creep**: Strict adherence to phased approach
- **Integration Challenges**: Early McBeatch theme integration
- **Timeline Management**: Regular milestone reviews and adjustments
- **Quality Assurance**: Continuous testing and code review processes

This comprehensive implementation plan ensures the successful delivery of NOOR CANVAS with professional McBeatch styling, optimal performance, and exceptional user experience for both hosts and participants.
