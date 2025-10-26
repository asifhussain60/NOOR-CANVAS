# Cloudflare Service Fix - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Cloudflare Service Installation                   │
│                    with Complete Fix Solution                        │
└─────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   USER      │
                              │  EXECUTES   │
                              └──────┬──────┘
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │  install-cloudflare-resources-service.ps1              │
        │  ┌──────────────────────────────────────────────────┐  │
        │  │ Enhancement A: Verbose Logging                   │  │
        │  │ • Timestamped log files                          │  │
        │  │ • Multi-level logging (INFO/SUCCESS/WARNING/ERR) │  │
        │  │ • Captures all outputs                           │  │
        │  └──────────────────────────────────────────────────┘  │
        │                                                         │
        │  ┌──────────────────────────────────────────────────┐  │
        │  │ Enhancement B: Registration Verification         │  │
        │  │ • 5 retry attempts                               │  │
        │  │ • 2-second intervals                             │  │
        │  │ • sc.exe fallback                                │  │
        │  └──────────────────────────────────────────────────┘  │
        │                                                         │
        │  ┌──────────────────────────────────────────────────┐  │
        │  │ Enhancement C: Auto-Recovery                     │  │
        │  │ • 1min → 2min → 5min restart delays              │  │
        │  │ • 24-hour reset period                           │  │
        │  │ • sc.exe failure configuration                   │  │
        │  └──────────────────────────────────────────────────┘  │
        └────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
        ┌──────────────────┐ ┌──────────────┐ ┌────────────────┐
        │ Windows Service  │ │  Log Files   │ │ Event Viewer   │
        │                  │ │              │ │                │
        │ CloudflareRes... │ │ install-*.log│ │ Application    │
        │ Status: Running  │ │              │ │ Source: cloud..│
        │ Auto-start: Yes  │ └──────────────┘ └────────────────┘
        │ Recovery: Config │
        └──────────────────┘

                              ┌─────────────┐
                              │   USER      │
                              │  EXECUTES   │
                              └──────┬──────┘
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │  create-startup-task.ps1                               │
        │  Enhancement D: Fallback Startup Task                  │
        │                                                         │
        │  Creates Scheduled Task:                               │
        │  • Name: StartCloudflareResourcesTunnel                │
        │  • Trigger: At Startup (+2min delay)                   │
        │  • Action: Start service if not running                │
        │  • User: SYSTEM                                        │
        │  • Privilege: Highest                                  │
        └────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │   Windows Task Scheduler        │
                    │                                 │
                    │   StartCloudflareResourcesTunnel│
                    │   State: Ready                  │
                    │   Next Run: At startup          │
                    └─────────────────────────────────┘

                              ┌─────────────┐
                              │   USER      │
                              │  EXECUTES   │
                              └──────┬──────┘
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │  diagnose-cloudflare-service.ps1                       │
        │  Enhancement E: Comprehensive Diagnostics              │
        │                                                         │
        │  Diagnostic Categories:                                │
        │  ┌──────────────────────────────────────────────────┐  │
        │  │ 1. SERVICE REGISTRATION                          │  │
        │  │    • Service exists check                        │  │
        │  │    • Status verification                         │  │
        │  │    • Account validation                          │  │
        │  ├──────────────────────────────────────────────────┤  │
        │  │ 2. BINARY VALIDATION                             │  │
        │  │    • cloudflared.exe exists                      │  │
        │  │    • Version check                               │  │
        │  │    • File integrity                              │  │
        │  ├──────────────────────────────────────────────────┤  │
        │  │ 3. CONFIGURATION VALIDATION                      │  │
        │  │    • Config file exists                          │  │
        │  │    • No placeholders                             │  │
        │  │    • Credentials file check                      │  │
        │  ├──────────────────────────────────────────────────┤  │
        │  │ 4. RECOVERY CONFIGURATION                        │  │
        │  │    • Auto-restart verified                       │  │
        │  │    • Recovery actions check                      │  │
        │  ├──────────────────────────────────────────────────┤  │
        │  │ 5. SCHEDULED TASK CHECK                          │  │
        │  │    • Task exists                                 │  │
        │  │    • Last/next run times                         │  │
        │  ├──────────────────────────────────────────────────┤  │
        │  │ 6. WINDOWS EVENT LOG                             │  │
        │  │    • Recent events analysis                      │  │
        │  │    • Error/warning counts                        │  │
        │  ├──────────────────────────────────────────────────┤  │
        │  │ 7. NETWORK CONNECTIVITY                          │  │
        │  │    • Cloudflare API reachable                    │  │
        │  │    • Tunnel URL responding                       │  │
        │  │    • IIS backend online                          │  │
        │  └──────────────────────────────────────────────────┘  │
        └────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │   Health Status Report          │
                    │                                 │
                    │   EXCELLENT / GOOD / DEGRADED   │
                    │   CRITICAL                      │
                    │                                 │
                    │   Optional: JSON export         │
                    └─────────────────────────────────┘

                              ┌─────────────┐
                              │   USER      │
                              │  EXECUTES   │
                              └──────┬──────┘
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │  test-service-enhancements.ps1                         │
        │  Validation Test Suite                                 │
        │                                                         │
        │  Tests All Enhancements:                               │
        │  ✓ Enhancement A: Verbose Logging                      │
        │  ✓ Enhancement B: Service Verification                 │
        │  ✓ Enhancement C: Auto-Recovery                        │
        │  ✓ Enhancement D: Startup Task                         │
        │  ✓ Enhancement E: Diagnostics                          │
        │  ✓ Integration Test                                    │
        └────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │   Test Results                  │
                    │                                 │
                    │   Total: 6                      │
                    │   Passed: 6                     │
                    │   Failed: 0                     │
                    │   Errors: 0                     │
                    │                                 │
                    │   Status: ✓ ALL TESTS PASSED    │
                    └─────────────────────────────────┘
```

## Data Flow

```
1. Installation Flow
   ═══════════════════
   User → install-cloudflare-resources-service.ps1
        → cloudflared.exe service install
        → Retry Loop (5x with 2s delay)
        → Service Registration Check
        → Fallback to sc.exe (if needed)
        → Auto-Recovery Configuration
        → Service Start
        → Log Everything
        
2. Fallback Task Flow
   ═══════════════════
   User → create-startup-task.ps1
        → New-ScheduledTaskAction (PowerShell script)
        → New-ScheduledTaskTrigger (At Startup)
        → Register-ScheduledTask (as SYSTEM)
        → Task Scheduler
        
3. System Startup Flow
   ═══════════════════
   Windows Boots
        ├→ Service Manager
        │  └→ CloudflareResourcesTunnel (auto-start)
        │     └→ On Failure: Auto-restart (1min/2min/5min)
        │
        └→ Task Scheduler (+2min delay)
           └→ StartCloudflareResourcesTunnel
              └→ Check service status
                 └→ Start if not running
                    
4. Diagnostic Flow
   ═══════════════════
   User → diagnose-cloudflare-service.ps1
        → 7 Diagnostic Categories
        → Collect Status from:
           ├→ Windows Service Manager
           ├→ File System
           ├→ Event Log
           ├→ Task Scheduler
           └→ Network Tests
        → Generate Report
        → Calculate Health Score
        → Optional: Export JSON
        
5. Validation Flow
   ═══════════════════
   User → test-service-enhancements.ps1
        → Test Each Enhancement
        → Verify Script Existence
        → Check Functionality
        → Integration Tests
        → Generate Summary
```

## Component Interactions

```
┌─────────────────────────────────────────────────────────────┐
│                    Operating System Layer                    │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐     │
│  │  Service    │  │    Task     │  │  Event Viewer    │     │
│  │  Manager    │  │  Scheduler  │  │  (Application)   │     │
│  └─────┬───────┘  └──────┬──────┘  └────────┬─────────┘     │
└────────┼─────────────────┼──────────────────┼───────────────┘
         │                 │                  │
         │ Controls        │ Triggers         │ Logs to
         │                 │                  │
┌────────▼─────────────────▼──────────────────▼───────────────┐
│                    Service Layer                             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  CloudflareResourcesTunnel Service                   │    │
│  │  • Runs: cloudflared.exe                             │    │
│  │  • Config: config-resources.yml                      │    │
│  │  • Account: LocalSystem                              │    │
│  │  • Auto-start: Yes                                   │    │
│  │  • Recovery: Configured                              │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
         │
         │ Connects to
         │
┌────────▼─────────────────────────────────────────────────────┐
│                    Network Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐     │
│  │ Cloudflare  │  │   Tunnel    │  │  IIS Backend     │     │
│  │    API      │◄─┤   (Secure)  │─►│  localhost:80    │     │
│  └─────────────┘  └─────────────┘  └──────────────────┘     │
└──────────────────────────────────────────────────────────────┘
         │                                        │
         │ Public Internet                        │ Local Network
         │                                        │
┌────────▼────────────────────────────────────────▼─────────────┐
│                    External Access                            │
│  resources.kashkole.com ──► Cloudflare ──► Tunnel ──► IIS    │
└───────────────────────────────────────────────────────────────┘
```

## Recovery Mechanisms

```
Failure Scenario → Recovery Action → Redundancy Layer

Service Crashes
    └─→ Auto-Recovery (1min)
        └─→ Scheduled Task (backup)
            └─→ Manual Start (last resort)

Service Won't Auto-Start
    └─→ Scheduled Task (2min after boot)
        └─→ Event Log alert
            └─→ Diagnostics script

Configuration Error
    └─→ Installation logs
        └─→ Diagnostic script identifies issue
            └─→ User corrects and re-runs

Binary Missing
    └─→ Diagnostic script detects
        └─→ Installation fails gracefully
            └─→ Clear error message

Network Connectivity
    └─→ Cloudflare handles reconnection
        └─→ Service stays running
            └─→ Automatic tunnel restoration
```

## File Dependency Graph

```
install-cloudflare-resources-service.ps1
├─ Requires: cloudflared.exe
├─ Requires: config-resources.yml
├─ Creates: install-service-*.log
├─ Creates: CloudflareResourcesTunnel (Service)
├─ Configures: Auto-recovery via sc.exe
└─ References: diagnose-cloudflare-service.ps1

create-startup-task.ps1
├─ Creates: StartCloudflareResourcesTunnel (Task)
├─ Depends on: CloudflareResourcesTunnel (Service)
└─ Logs to: Event Viewer (CloudflareTunnelTask source)

diagnose-cloudflare-service.ps1
├─ Reads: Service status
├─ Reads: Scheduled task status
├─ Reads: Event logs
├─ Reads: cloudflared.exe
├─ Reads: config-resources.yml
├─ Tests: Network connectivity
└─ Optionally Creates: diagnostic-report-*.json

test-service-enhancements.ps1
├─ Validates: install-cloudflare-resources-service.ps1
├─ Validates: create-startup-task.ps1
├─ Validates: diagnose-cloudflare-service.ps1
├─ Creates: test-log-*.log (temporary)
└─ Outputs: Test results summary
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: October 26, 2025  
**Status**: Production Ready ✓
