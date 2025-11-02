# Cloudflare Configuration - Complete Reference

**Purpose**: Comprehensive documentation of Cloudflare Tunnel configuration for NOOR CANVAS application and resources CDN.

**Last Updated**: 2025-10-27  
**Status**: Production - Active  
**Owner**: Infrastructure Team  
**Related Keys**: `cloudflare-tunnel-stability`, `cdn-cloudflare-fix`, `ksessions-cdn`

---

## 🎯 Overview

NOOR CANVAS uses **Cloudflare Tunnel** (formerly Argo Tunnel) to securely expose local IIS sites and services to the internet without opening firewall ports. This architecture enables:

- ✅ Zero-trust network access
- ✅ Automatic HTTPS/TLS termination
- ✅ DDoS protection via Cloudflare edge
- ✅ No inbound firewall rules required
- ✅ Centralized routing configuration
- ✅ Seamless failover and load balancing

---

## 📐 Architecture Components

### 1. **Active Tunnel**

**Tunnel Name**: `noorcanvas`  
**Tunnel ID**: `5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1`  
**Created**: 2025-10-26  
**Authentication Method**: Credentials-based (allows `config.yml` ingress rules)  
**Status**: ✅ Production - Active and verified

### 2. **File Locations**

| Component | Location | Purpose |
|-----------|----------|---------|
| Cloudflared Binary | `D:\PROJECTS\__CLOUDFLARE\cloudflared.exe` | Tunnel client executable |
| Config File (Active) | `C:\Users\asifh\.cloudflared\config.yml` | Active tunnel configuration |
| Config File (Backup) | `D:\PROJECTS\NOOR CANVAS\Workspaces\Infrastructure\Cloudflare\config.yml` | Version-controlled backup |
| Credentials File | `C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json` | Tunnel authentication (SENSITIVE) |
| Management Scripts | `D:\PROJECTS\NOOR CANVAS\Workspaces\Infrastructure\Cloudflare\` | Service install/restart/health scripts |

### 3. **DNS Configuration**

**Domain**: `kashkole.com`  
**Nameservers**: Cloudflare  
**DNSSEC**: ✅ Enabled

**CNAME Records** (configured in Cloudflare DNS dashboard):

| Subdomain | Type | Target | Proxy Status | Purpose |
|-----------|------|--------|--------------|---------|
| `noorcanvas` | CNAME | `5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.cfargotunnel.com` | ✅ Proxied | Main application |
| `session` | CNAME | `5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.cfargotunnel.com` | ✅ Proxied | Session API |
| `resources` | CNAME | `5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.cfargotunnel.com` | ✅ Proxied | Media CDN |

**Note**: The `.cfargotunnel.com` suffix is Cloudflare's special routing domain. All traffic to these CNAMEs is automatically routed to the tunnel ID prefix.

---

## 🔧 Configuration Files

### config.yml (Active Configuration)

**Location**: `C:\Users\asifh\.cloudflared\config.yml`

```yaml
# Cloudflare Tunnel Configuration
# Tunnel: noorcanvas
# Tunnel ID: 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
# Created: 2025-10-26
# Authentication: Credentials-based (allows config.yml ingress rules)

tunnel: 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
credentials-file: C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json

ingress:
  # NoorCanvas main site (IIS)
  - hostname: noorcanvas.kashkole.com
    service: http://127.0.0.1:80
    originRequest:
      noTLSVerify: true
      httpHostHeader: noorcanvas.kashkole.com
  
  # Session API (separate service)
  - hostname: session.kashkole.com
    service: http://127.0.0.1:8080
  
  # Catchall for unmatched hostnames
  - service: http_status:404
```

### Ingress Rules Explained

| Hostname | Service | Target | Origin Options | Purpose |
|----------|---------|--------|----------------|---------|
| `noorcanvas.kashkole.com` | `http://127.0.0.1:80` | IIS NoorCanvas site | `noTLSVerify: true`<br>`httpHostHeader: noorcanvas.kashkole.com` | Main application with IIS binding |
| `session.kashkole.com` | `http://127.0.0.1:8080` | KSESSIONS API | (none) | Session management service |
| (catchall) | `http_status:404` | - | - | Unknown hostnames return 404 |

**Origin Request Options**:
- `noTLSVerify: true` - Skip TLS verification for local IIS (self-signed certs acceptable)
- `httpHostHeader: noorcanvas.kashkole.com` - Pass original hostname to IIS for proper site routing

### Credentials File (SENSITIVE)

**Location**: `C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json`

**⚠️ SECURITY WARNING**:
- This file contains sensitive tunnel authentication credentials
- **NEVER** commit to git repository
- Located outside git workspace (`C:\Users\asifh\.cloudflared\`)
- Must exist for tunnel to authenticate with Cloudflare
- Regenerated only when creating new tunnel

---

## 🌐 Dashboard Access

### Cloudflare Dashboards

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| Main Dashboard | https://dash.cloudflare.com | Domain/DNS management |
| Zero Trust Dashboard | https://one.dash.cloudflare.com | Tunnel management, access policies |
| DNS Management | https://dash.cloudflare.com/kashkole.com/dns | CNAME record management |
| Tunnel Management | https://one.dash.cloudflare.com → Networks → Tunnels | Tunnel status, connections, routing |

### Dashboard Operations

**View Tunnel Status**:
1. Navigate to https://one.dash.cloudflare.com
2. Click **Networks** → **Tunnels**
3. Find tunnel: `noorcanvas` (ID: `5be8b5a1...`)
4. View connection count, uptime, traffic stats

**Update DNS Records**:
1. Navigate to https://dash.cloudflare.com
2. Select domain: `kashkole.com`
3. Click **DNS** → **Records**
4. Edit CNAME records as needed
5. Ensure **Proxy status** = ✅ Proxied (orange cloud)

**View Public Hostnames** (Token-based tunnels only):
1. Navigate to https://one.dash.cloudflare.com
2. Click **Networks** → **Tunnels** → `noorcanvas`
3. Click **Public Hostnames** tab
4. **Note**: Credentials-based tunnels use `config.yml` ingress, not dashboard routes

---

## 🚀 Tunnel Management

### Starting the Tunnel

**Manual Start** (Development):
```powershell
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel --config "C:\Users\asifh\.cloudflared\config.yml" run 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

**Background Start** (New Window):
```powershell
cd "D:\PROJECTS\__CLOUDFLARE"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& 'D:\PROJECTS\__CLOUDFLARE\cloudflared.exe' tunnel --config 'C:\Users\asifh\.cloudflared\config.yml' run 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1" -WindowStyle Normal
```

**Windows Service** (Production - Recommended):
```powershell
# Install service (one-time setup)
.\Workspaces\Infrastructure\Cloudflare\install-tunnel-service.ps1

# Start service
Start-Service cloudflared

# Check status
Get-Service cloudflared | Select-Object Name, Status, StartType
```

### Stopping the Tunnel

**Kill Process**:
```powershell
Stop-Process -Name cloudflared -Force
```

**Stop Service**:
```powershell
Stop-Service cloudflared
```

### Restarting the Tunnel

**Restart Service**:
```powershell
.\Workspaces\Infrastructure\Cloudflare\restart-tunnel-service.ps1
```

**Manual Restart**:
```powershell
Stop-Process -Name cloudflared -Force
Start-Sleep -Seconds 2
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel --config "C:\Users\asifh\.cloudflared\config.yml" run 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

---

## ✅ Verification Commands

### Check Tunnel Status
```powershell
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel info 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

**Expected Output**:
```
Tunnel: noorcanvas
ID: 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
Connections: 4
  - Connector ID: <uuid> (ewr01)
  - Connector ID: <uuid> (ewr05)
  - Connector ID: <uuid> (ewr14)
  - Connector ID: <uuid> (ewr14)
```

### Check Running Process
```powershell
Get-Process cloudflared -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime
```

### Test Endpoints
```powershell
# Test NoorCanvas
Invoke-WebRequest -Uri "https://noorcanvas.kashkole.com" -UseBasicParsing

# Test Session API
Invoke-WebRequest -Uri "https://session.kashkole.com/health" -UseBasicParsing

# Test Resources CDN
Invoke-WebRequest -Uri "https://resources.kashkole.com" -UseBasicParsing
```

### Health Check Script
```powershell
.\Workspaces\Infrastructure\Cloudflare\check-tunnel-health.ps1
```

**Health Check Output**:
```
✅ Tunnel Status: Connected (4 connections)
✅ NoorCanvas: 200 OK
✅ Session API: 200 OK
✅ Resources CDN: 200 OK
```

---

## 🛠️ Management Scripts

All scripts located in: `D:\PROJECTS\NOOR CANVAS\Workspaces\Infrastructure\Cloudflare\`

| Script | Purpose | Usage |
|--------|---------|-------|
| `install-tunnel-service.ps1` | Install tunnel as Windows Service | `.\install-tunnel-service.ps1` |
| `uninstall-tunnel-service.ps1` | Remove Windows Service | `.\uninstall-tunnel-service.ps1` |
| `restart-tunnel-service.ps1` | Restart service | `.\restart-tunnel-service.ps1` |
| `check-tunnel-health.ps1` | Verify tunnel + endpoints | `.\check-tunnel-health.ps1` |
| `test-tunnel-resilience.ps1` | Run comprehensive tests | `.\test-tunnel-resilience.ps1` |

### Install Tunnel Service

**Requirements**:
- Administrator privileges
- Tunnel config validated
- Credentials file exists

**Command**:
```powershell
.\Workspaces\Infrastructure\Cloudflare\install-tunnel-service.ps1
```

**What it does**:
1. Validates `config.yml` and credentials file exist
2. Stops existing tunnel processes
3. Installs Windows Service named `cloudflared`
4. Configures service to start automatically
5. Starts the service
6. Verifies connections established

**Service Details**:
- **Service Name**: `cloudflared`
- **Display Name**: Cloudflare Tunnel - noorcanvas
- **Start Type**: Automatic
- **Runs As**: Local System
- **Recovery**: Restart on failure

---

## 🔀 Authentication Methods

### Credentials-Based (CURRENT)

**How it works**:
1. Tunnel authenticated via credentials file (`*.json`)
2. Ingress routes defined in `config.yml`
3. Routes are version-controlled and deployable
4. No dashboard dependency for route changes

**Pros**:
- ✅ Version-controlled routing (`config.yml` in git)
- ✅ No dashboard clicks needed for route updates
- ✅ Infrastructure-as-code approach
- ✅ Easy to replicate across environments

**Cons**:
- ❌ Must protect credentials file (never commit)
- ❌ Requires manual DNS updates for new tunnel

**Active Since**: 2025-10-26 (Tunnel v2.0)

### Token-Based (NOT RECOMMENDED)

**How it works**:
1. Tunnel authenticated via token (embedded in `config.yml` or environment variable)
2. Ingress routes defined in **Cloudflare Zero Trust Dashboard**
3. Routes managed via web UI, not config file

**Pros**:
- ✅ Token is easily rotatable
- ✅ Dashboard UI for route management

**Cons**:
- ❌ `config.yml` ingress rules are **IGNORED**
- ❌ Requires dashboard clicks for route changes
- ❌ Not infrastructure-as-code
- ❌ Hard to version control routes

**Why Not Used**: Caused Error 1016 (origin DNS error) when attempting to use `config.yml` ingress rules. Deleted on 2025-10-26.

---

## 📊 Tunnel Routing Flow

```
Internet Request
     ↓
Cloudflare Edge (DDoS protection, HTTPS termination)
     ↓
DNS CNAME Lookup (noorcanvas.kashkole.com → <tunnel-id>.cfargotunnel.com)
     ↓
Cloudflare Tunnel Network
     ↓
Active Tunnel Connection (4 connections via cloudflared.exe)
     ↓
Ingress Rule Matching (config.yml)
     ↓
     ├─ noorcanvas.kashkole.com → http://127.0.0.1:80 (IIS)
     ├─ session.kashkole.com → http://127.0.0.1:8080 (KSESSIONS API)
     └─ (other) → HTTP 404
     ↓
Local Service Response
     ↓
Cloudflare Edge (Caching, Optimization)
     ↓
Internet Response
```

---

## 🔐 Security Considerations

### Credentials File Protection

**File**: `C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json`

**Security Measures**:
- ✅ Located outside git repository
- ✅ File system permissions restricted to user account
- ✅ Never committed to version control
- ✅ Backup stored in secure location (off-server)

**If Compromised**:
1. Delete tunnel in Cloudflare dashboard
2. Create new tunnel with new ID
3. Update DNS CNAMEs
4. Update `config.yml` with new tunnel ID
5. Update credentials file path
6. Restart service

### Tunnel ID Stability

**CRITICAL**: Changing tunnel ID requires DNS record updates and causes downtime.

**Protection Mechanisms**:
- Git pre-commit hook: `.github/hooks/validate-tunnel-id.ps1`
- Documentation references: Canonical tunnel ID documented here
- Service scripts: Parameterized with tunnel ID

**Related Work**: See `.github/key-data-streams/cloudflare-tunnel-stability/`

---

## 🚨 Troubleshooting

### Error: Tunnel Not Connecting

**Symptom**: `cloudflared` process runs but no connections established

**Diagnosis**:
```powershell
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel info 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

**Possible Causes**:
1. **Credentials file missing/invalid**
   ```powershell
   Test-Path "C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json"
   ```
   **Fix**: Regenerate credentials or restore from backup

2. **Config file incorrect**
   ```powershell
   Get-Content "C:\Users\asifh\.cloudflared\config.yml"
   ```
   **Fix**: Restore from `Workspaces\Infrastructure\Cloudflare\config.yml`

3. **Network/firewall blocking outbound HTTPS**
   **Fix**: Ensure outbound HTTPS (port 443) allowed

### Error: 502 Bad Gateway

**Symptom**: https://noorcanvas.kashkole.com returns 502

**Diagnosis**:
```powershell
# Check if IIS site running
Get-Website -Name "noorcanvas"

# Check tunnel connections
.\cloudflared.exe tunnel info 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

**Possible Causes**:
1. **IIS site stopped**
   ```powershell
   Start-Website -Name "noorcanvas"
   ```

2. **Tunnel not connected**
   ```powershell
   Restart-Service cloudflared
   ```

3. **Ingress route incorrect**
   - Verify `config.yml` hostname matches DNS
   - Verify service target is correct (port 80/8080)

### Error: 1016 Origin DNS Error

**Symptom**: Tunnel connected but requests fail with Error 1016

**Cause**: Using **token-based authentication** instead of credentials-based

**Fix**: Switch to credentials-based auth (see "Authentication Methods" section)

### Error: 404 Not Found

**Symptom**: https://noorcanvas.kashkole.com returns 404

**Possible Causes**:
1. **Hostname not in ingress rules**
   - Check `config.yml` ingress section
   - Ensure hostname matches DNS CNAME

2. **Catchall rule catching request**
   - Ingress rules match in order
   - Ensure specific hostnames listed before catchall

### Service Won't Start

**Symptom**: `Start-Service cloudflared` fails

**Diagnosis**:
```powershell
Get-EventLog -LogName Application -Source cloudflared -Newest 10
```

**Common Causes**:
1. **Config file not found**
   - Service runs as Local System
   - Ensure config path is absolute: `C:\Users\asifh\.cloudflared\config.yml`

2. **Credentials file not found**
   - Check path in `config.yml`
   - Ensure file exists and permissions correct

3. **Port already in use**
   - Another `cloudflared` process running
   - Kill process: `Stop-Process -Name cloudflared -Force`

---

## 🔄 Tunnel History

### v2.0 - Current (Active)
- **Date**: 2025-10-26
- **ID**: `5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1`
- **Name**: `noorcanvas`
- **Auth**: Credentials-based
- **Reason**: Fresh start with proper credentials auth after token auth issues
- **Status**: ✅ Production

### v1.1 - Failed Attempt
- **Date**: 2025-10-26 22:18
- **ID**: `f7f4afae-a0d4-47bc-8441-52a265109796`
- **Name**: `Kashkole`
- **Auth**: Token-based
- **Reason**: Attempted token auth, Error 1016 because config.yml ingress ignored
- **Status**: ❌ Deleted 2025-10-26 22:58

### v1.0 - Legacy
- **ID**: `5474d3b4-50ea-4588-8763-5fc7da533d6c` (mentioned in CDN-Architecture.md)
- **Status**: Deprecated, may still exist in dashboard but not in active DNS
- **Note**: Referenced in old documentation

---

## 📚 Related Documentation

### Internal References

| Document | Location | Purpose |
|----------|----------|---------|
| Tunnel Configuration | `Workspaces/Infrastructure/Cloudflare/tunnel-configuration.md` | Detailed config reference |
| Troubleshooting Guide | `Workspaces/Infrastructure/Cloudflare/TROUBLESHOOTING.md` | Common issues and fixes |
| CDN Architecture | `.github/instructions/CDN-Architecture.md` | Resources CDN design |
| Infrastructure Quick Ref | `.github/instructions/Links/InfrastructureQuickRef.md` | Database and infrastructure |

### Key Data Streams

| Key | Location | Purpose |
|-----|----------|---------|
| `cloudflare-tunnel-stability` | `.github/key-data-streams/cloudflare-tunnel-stability/` | Tunnel ID protection work |
| `cdn-cloudflare-fix` | `.github/key-data-streams/cdn-cloudflare-fix/` | CDN routing fixes |
| `ksessions-cdn` | `.github/key-data-streams/ksessions-cdn/` | CDN implementation |

### External Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| Cloudflare Tunnel Docs | https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/ | Official documentation |
| Cloudflare Dashboard | https://dash.cloudflare.com | Domain/DNS management |
| Zero Trust Dashboard | https://one.dash.cloudflare.com | Tunnel management |

---

## 🎓 Quick Reference

### Common Tasks

**Start tunnel manually**:
```powershell
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel --config "C:\Users\asifh\.cloudflared\config.yml" run 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

**Check tunnel status**:
```powershell
.\cloudflared.exe tunnel info 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

**Restart service**:
```powershell
Restart-Service cloudflared
```

**Test endpoints**:
```powershell
Invoke-WebRequest -Uri "https://noorcanvas.kashkole.com" -UseBasicParsing
```

**View logs** (if service installed):
```powershell
Get-EventLog -LogName Application -Source cloudflared -Newest 20
```

### Configuration Backup

**Backup config to git**:
```powershell
Copy-Item "C:\Users\asifh\.cloudflared\config.yml" `
          -Destination "D:\PROJECTS\NOOR CANVAS\Workspaces\Infrastructure\Cloudflare\config.yml"
```

**Restore config from git**:
```powershell
Copy-Item "D:\PROJECTS\NOOR CANVAS\Workspaces\Infrastructure\Cloudflare\config.yml" `
          -Destination "C:\Users\asifh\.cloudflared\config.yml"
```

---

## 📝 Change Log

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2025-10-27 | 1.0 | Initial comprehensive documentation | System |
| 2025-10-26 | - | Switched to credentials-based auth (v2.0) | Infrastructure Team |
| 2025-10-26 | - | Deleted token-based tunnel (v1.1) | Infrastructure Team |

---

**REMEMBER**: When working with Cloudflare configuration:
1. **Always** verify tunnel ID before making changes
2. **Always** backup config files before modifications
3. **Always** test endpoints after tunnel changes
4. **Never** commit credentials file to git
5. **Always** document changes in this file
