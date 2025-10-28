# Cloudflare Tunnel Configuration Reference

**Last Updated**: 2025-10-26 23:00  
**Status**: Production - Active  
**Tunnel Version**: 2.0 (Credentials-based)

## Active Tunnel

**Tunnel ID**: `5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1`  
**Tunnel Name**: `noorcanvas`  
**Created**: 2025-10-26  
**Authentication**: Credentials file (config.yml ingress active)  
**Status**: ✅ Production - Active and verified

## File Locations

- **Cloudflared Binary**: `D:\PROJECTS\__CLOUDFLARE\cloudflared.exe`
- **Config File**: `C:\Users\asifh\.cloudflared\config.yml`
- **Credentials File**: `C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json`
- **Management Scripts**: `D:\PROJECTS\NOOR CANVAS\Workspaces\Infrastructure\Cloudflare\`

## Configuration

### config.yml

```yaml
tunnel: 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
credentials-file: C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json

ingress:
  - hostname: noorcanvas.kashkole.com
    service: http://127.0.0.1:80
    originRequest:
      noTLSVerify: true
      httpHostHeader: noorcanvas.kashkole.com
  - hostname: session.kashkole.com
    service: http://127.0.0.1:8080
  - service: http_status:404
```

### Ingress Routes Explained

| Hostname | Service | Target | Purpose |
|----------|---------|--------|---------|
| noorcanvas.kashkole.com | http://127.0.0.1:80 | IIS NoorCanvas site | Main application |
| session.kashkole.com | http://127.0.0.1:8080 | Session API | Session management |
| (catchall) | http_status:404 | - | Unknown hosts |

**Origin Request Options**:
- `noTLSVerify: true` - Skip TLS verification for local IIS (self-signed certs OK)
- `httpHostHeader: noorcanvas.kashkole.com` - Pass original hostname to IIS for proper routing

## DNS Records

### Cloudflare DNS Configuration

**Domain**: `kashkole.com`  
**Nameservers**: Cloudflare  
**DNSSEC**: Enabled

**CNAME Records**:

| Name | Type | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| noorcanvas | CNAME | 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.cfargotunnel.com | ✅ Proxied | Auto |
| resources | CNAME | 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.cfargotunnel.com | ✅ Proxied | Auto |
| session | CNAME | 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.cfargotunnel.com | ✅ Proxied | Auto |

**Note**: `.cfargotunnel.com` is Cloudflare's special domain for tunnel routing. When a CNAME points to `<tunnel-id>.cfargotunnel.com`, Cloudflare automatically routes traffic to that tunnel.

## Tunnel Creation History

### v2.0 - Current (Active)
- **Date**: 2025-10-26
- **ID**: `5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1`
- **Name**: `noorcanvas`
- **Auth**: Credentials-based
- **Reason**: Fresh start with proper credentials auth after token auth issues
- **Status**: ✅ Production

### v1.1 - Deleted (Failed)
- **Date**: 2025-10-26 22:18
- **ID**: `f7f4afae-a0d4-47bc-8441-52a265109796`
- **Name**: `Kashkole`
- **Auth**: Token-based (attempted)
- **Reason**: Token auth didn't support config.yml ingress rules, Error 1016
- **Status**: ❌ Deleted 2025-10-26 22:58

### v1.0 - Legacy (Deprecated)
- **ID**: `93650d38-60af-4dc7-a5ec-f8347fc57514`
- **Status**: Referenced in old docs but no longer in use
- **Note**: May still exist in Cloudflare dashboard but not in active DNS

## Verification Commands

### Check Tunnel Status

```powershell
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel info 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

**Expected Output**:
```
NAME:     noorcanvas
ID:       5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
CREATED:  2025-10-26...

CONNECTOR ID         CREATED              ARCHITECTURE  VERSION   ORIGIN IP      EDGE
c1cc49b8-...         2025-10-26...        windows_amd64 2025.10.0 98.221.185.102 1xewr01, 1xewr05, 2xewr14
```

### Test Site Accessibility

```powershell
# Test main site
Invoke-WebRequest -Uri "https://noorcanvas.kashkole.com" -UseBasicParsing

# Test resources CDN
Invoke-WebRequest -Uri "https://resources.kashkole.com" -UseBasicParsing

# Expected: HTTP 200 OK
```

### Check Service Status (after service installation)

```powershell
Get-Service cloudflared | Select-Object Name, Status, StartType

# Expected:
# Name        Status  StartType
# ----        ------  ---------
# cloudflared Running Automatic
```

### Test Local IIS Endpoints

```powershell
# Test with correct Host header
Invoke-WebRequest -Uri "http://127.0.0.1:80" -Headers @{"Host"="noorcanvas.kashkole.com"} -UseBasicParsing

# Check IIS bindings
Import-Module WebAdministration
Get-Website | Where-Object {$_.Name -eq "NoorCanvas"} | Select-Object Name, State, @{N='Bindings';E={$_.bindings.Collection.bindingInformation}}
```

## Management Scripts

Located in: `Workspaces/Infrastructure/Cloudflare/`

### Installation

```powershell
# Install as Windows service
.\Workspaces\Infrastructure\Cloudflare\install-tunnel-service.ps1
```

### Uninstallation

```powershell
# Remove Windows service
.\Workspaces\Infrastructure\Cloudflare\uninstall-tunnel-service.ps1
```

### Restart

```powershell
# Restart service
.\Workspaces\Infrastructure\Cloudflare\restart-tunnel-service.ps1
```

### Health Check

```powershell
# Comprehensive health check
.\Workspaces\Infrastructure\Cloudflare\check-tunnel-health.ps1
```

## Troubleshooting Quick Reference

### Site Returns Error 1016

**Cause**: Tunnel not connected or IIS not responding

**Fix**:
```powershell
# Check if tunnel is running
Get-Process cloudflared

# Check IIS
Get-Service W3SVC

# Restart tunnel
Restart-Service cloudflared  # (after service installation)
```

### No Tunnel Connections

**Cause**: Service not started or network issues

**Fix**:
```powershell
# Check service
Get-Service cloudflared

# Start if stopped
Start-Service cloudflared

# Wait 15 seconds for connections
Start-Sleep -Seconds 15

# Verify
.\cloudflared.exe tunnel info 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

### Configuration File Corrupted

**Fix**: Restore from this documentation:

```powershell
$configContent = @"
tunnel: 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
credentials-file: C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json

ingress:
  - hostname: noorcanvas.kashkole.com
    service: http://127.0.0.1:80
    originRequest:
      noTLSVerify: true
      httpHostHeader: noorcanvas.kashkole.com
  - hostname: session.kashkole.com
    service: http://127.0.0.1:8080
  - service: http_status:404
"@

$configContent | Set-Content "C:\Users\asifh\.cloudflared\config.yml" -Encoding UTF8
```

### Credentials File Missing

**Fix**: Regenerate from tunnel:

```powershell
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel token --cred-file "C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json" 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

## Architecture Notes

### Why Credentials-Based Authentication?

**Token authentication** (what we tried initially):
- ❌ Requires routes configured in Cloudflare Zero Trust dashboard
- ❌ Config.yml ingress rules ignored
- ❌ Less version control friendly
- ❌ Dashboard dependency for routing changes

**Credentials-based authentication** (current setup):
- ✅ Config.yml ingress rules work correctly
- ✅ Full control over routing locally
- ✅ Easy to version control
- ✅ No dashboard dependency for route changes
- ✅ Simpler troubleshooting (one config file)

### IIS Integration

**NoorCanvas Site**:
- Binding: `http://*:80:noorcanvas.kashkole.com`
- Tunnel proxies to: `http://127.0.0.1:80`
- Host header: `noorcanvas.kashkole.com` (preserved via `httpHostHeader`)

**Resources Site**:
- Binding: `https://*:443:resources.kashkole.com`
- Note: Not currently in tunnel ingress (resources use separate configuration)

**Session API**:
- Port: 8080
- Tunnel proxies to: `http://127.0.0.1:8080`

## Security Notes

### Credentials File Protection

**CRITICAL**: The credentials file contains sensitive tunnel authentication data.

**Protections**:
- ✅ File located outside git repository (`C:\Users\asifh\.cloudflared\`)
- ✅ Never commit credentials file to version control
- ✅ Regenerate credentials if file is compromised
- ✅ Windows file permissions restrict access to admin users

**Backup Strategy**:
- Keep offline encrypted backup of credentials file
- Document regeneration procedure (see above)
- Test restore procedure periodically

### Tunnel ID Stability

**CRITICAL**: Changing tunnel ID requires DNS record updates and causes downtime.

**Protections** (to be implemented):
- Git pre-commit hook to detect tunnel ID changes
- Documentation references canonical tunnel ID
- Service scripts parameterized with tunnel ID

## Related Documentation

- **Full Plan**: `.github/key-data-streams/cloudflare-tunnel-stability/cloudflare-tunnel-stability-v2.plan.md`
- **Troubleshooting Guide**: `Workspaces/Infrastructure/Cloudflare/TROUBLESHOOTING.md`
- **IIS Configuration**: `.github/instructions/IIS-Configuration.md`
- **CDN Architecture**: `.github/instructions/CDN-Architecture.md`

## Support Contacts

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Zero Trust Dashboard**: https://one.dash.cloudflare.com
- **Cloudflare Tunnel Docs**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

---

**Document Version**: 2.0  
**Last Verified**: 2025-10-26 23:00  
**Next Review**: After Windows service installation
