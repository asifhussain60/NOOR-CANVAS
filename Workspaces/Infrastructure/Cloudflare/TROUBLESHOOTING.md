# Cloudflare Tunnel Troubleshooting Guide

**Tunnel**: noorcanvas  
**Tunnel ID**: `5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1`  
**Service**: CloudflaredTunnel  
**Last Updated**: 2025-10-26

---

## Quick Reference

### Service Management

```powershell
# Check service status
Get-Service CloudflaredTunnel

# Start service
Start-Service CloudflaredTunnel

# Stop service
Stop-Service CloudflaredTunnel

# Restart service
Restart-Service CloudflaredTunnel

# Check service configuration
sc.exe qc CloudflaredTunnel
```

### Health Check

```powershell
# Run automated health check
.\Workspaces\Infrastructure\Cloudflare\check-tunnel-health.ps1

# Quick manual test
Invoke-WebRequest -Uri "https://noorcanvas.kashkole.com" -UseBasicParsing
```

### Logs

```powershell
# View Windows Event Log for service
Get-EventLog -LogName Application -Source Cloudflared -Newest 50

# Monitor service in real-time
Get-Service CloudflaredTunnel | Format-List *
```

---

## Common Issues

### Issue 1: Service Won't Start

**Symptoms:**
- Service status shows "Stopped"
- `Start-Service CloudflaredTunnel` fails
- Website returns 502 or 1016 errors

**Diagnosis:**
```powershell
# Check if config file exists
Test-Path "C:\Users\asifh\.cloudflared\config.yml"

# Check if credentials file exists
Test-Path "C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json"

# Check if cloudflared.exe exists
Test-Path "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe"

# Check service configuration
sc.exe qc CloudflaredTunnel
```

**Solutions:**

**A. Missing config files:**
```powershell
# Restore config from version control
Copy-Item "D:\PROJECTS\NOOR CANVAS\Workspaces\Infrastructure\Cloudflare\config.yml" `
          -Destination "C:\Users\asifh\.cloudflared\config.yml"

# Regenerate credentials (if lost)
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel token --cred-file "C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json" 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

**B. Service path incorrect:**
```powershell
# Reinstall service
.\Workspaces\Infrastructure\Cloudflare\uninstall-tunnel-service.ps1
.\Workspaces\Infrastructure\Cloudflare\install-tunnel-service-nssm.ps1
```

**C. Port conflict:**
```powershell
# Check if port 80 is available
Test-NetConnection -ComputerName localhost -Port 80

# Check IIS status
Get-Service W3SVC
```

---

### Issue 2: Website Returns 502 Bad Gateway

**Symptoms:**
- Tunnel service running
- `https://noorcanvas.kashkole.com` returns 502
- Cloudflare shows tunnel as healthy

**Diagnosis:**
```powershell
# Check if IIS is running
Get-Service W3SVC

# Check if local site responds
Invoke-WebRequest -Uri "http://localhost:80" -UseBasicParsing

# Check tunnel connections
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel info 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

**Solutions:**

**A. IIS not running:**
```powershell
Start-Service W3SVC
```

**B. Site not bound to port 80:**
```powershell
# Check IIS bindings
Import-Module WebAdministration
Get-WebBinding -Name "Default Web Site"
```

**C. Ingress configuration incorrect:**
```powershell
# Verify config.yml
Get-Content "C:\Users\asifh\.cloudflared\config.yml"

# Should show:
#   - hostname: noorcanvas.kashkole.com
#     service: http://127.0.0.1:80
```

---

### Issue 3: Error 1016 (Origin DNS Error)

**Symptoms:**
- Website returns Cloudflare error 1016
- Tunnel shows as connected
- DNS records look correct

**Diagnosis:**
```powershell
# Check DNS records
nslookup noorcanvas.kashkole.com

# Should return CNAME to: 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.cfargotunnel.com

# Check tunnel authentication method
Get-Content "C:\Users\asifh\.cloudflared\config.yml" | Select-String "credentials-file"
```

**Solutions:**

**A. Using token authentication (wrong):**
```powershell
# Verify credentials-based auth is configured
$config = Get-Content "C:\Users\asifh\.cloudflared\config.yml"
if ($config -notcontains "credentials-file") {
    Write-Host "ERROR: Config missing credentials-file line!"
}
```

**B. DNS record incorrect:**
- Go to Cloudflare dashboard
- Verify CNAME points to: `5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.cfargotunnel.com`
- Ensure Proxy status is ENABLED (orange cloud)

---

### Issue 4: Service Crashes Repeatedly

**Symptoms:**
- Service starts but stops within seconds
- Event log shows repeated failures
- Website intermittently unavailable

**Diagnosis:**
```powershell
# Check Event Log for errors
Get-EventLog -LogName Application -Source Cloudflared -EntryType Error -Newest 10

# Check service recovery settings
sc.exe qfailure CloudflaredTunnel

# Monitor process in real-time
Get-Process cloudflared -ErrorAction SilentlyContinue | Format-List *
```

**Solutions:**

**A. Config file syntax error:**
```powershell
# Validate YAML syntax
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel --config "C:\Users\asifh\.cloudflared\config.yml" run --dry-run 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
```

**B. Credentials file corrupted:**
```powershell
# Regenerate credentials
cd "D:\PROJECTS\__CLOUDFLARE"
Remove-Item "C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json" -Force
.\cloudflared.exe tunnel token --cred-file "C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json" 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
Restart-Service CloudflaredTunnel
```

**C. Firewall blocking outbound:**
```powershell
# Test Cloudflare connectivity
Test-NetConnection -ComputerName region1.v2.argotunnel.com -Port 7844
```

---

### Issue 5: Service Won't Auto-Start on Boot

**Symptoms:**
- Service works when started manually
- After reboot, service is stopped
- `StartType` shows "Automatic" but doesn't start

**Diagnosis:**
```powershell
# Check service start type
(Get-Service CloudflaredTunnel).StartType

# Check service dependencies
sc.exe qc CloudflaredTunnel | Select-String "DEPENDENCIES"

# Check delayed start
Get-CimInstance -ClassName Win32_Service -Filter "Name='CloudflaredTunnel'" | Select-Object StartMode, DelayedAutoStart
```

**Solutions:**

**A. Change to automatic (delayed start):**
```powershell
sc.exe config CloudflaredTunnel start= delayed-auto
```

**B. Create startup task:**
```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-Command Start-Service CloudflaredTunnel"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
Register-ScheduledTask -TaskName "StartCloudflaredTunnel" `
    -Action $action -Trigger $trigger -Principal $principal
```

---

## Advanced Troubleshooting

### Debug Mode

Run tunnel manually with debug logging:

```powershell
# Stop service first
Stop-Service CloudflaredTunnel

# Run manually with debug output
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe --loglevel debug tunnel --config "C:\Users\asifh\.cloudflared\config.yml" run 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1

# Press Ctrl+C to stop when done debugging
# Restart service
Start-Service CloudflaredTunnel
```

### Connection Diagnostics

```powershell
# Check tunnel info from Cloudflare
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel info 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1

# List all tunnels
.\cloudflared.exe tunnel list

# Test specific route
.\cloudflared.exe tunnel route dns 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1 noorcanvas.kashkole.com
```

### Configuration Validation

```powershell
# Test config syntax
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel --config "C:\Users\asifh\.cloudflared\config.yml" ingress validate

# Test ingress rules
.\cloudflared.exe tunnel --config "C:\Users\asifh\.cloudflared\config.yml" ingress rule https://noorcanvas.kashkole.com
```

---

## Complete Reinstallation

If all else fails, reinstall from scratch:

```powershell
# 1. Stop and remove service
Stop-Service CloudflaredTunnel -Force -ErrorAction SilentlyContinue
sc.exe delete CloudflaredTunnel

# 2. Delete old tunnel (optional - only if creating new tunnel)
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel cleanup 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1
.\cloudflared.exe tunnel delete 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1

# 3. Create new tunnel
.\cloudflared.exe tunnel create noorcanvas-new

# 4. Update config.yml with new tunnel ID
# Edit: C:\Users\asifh\.cloudflared\config.yml
# Change tunnel ID line to new ID

# 5. Update DNS records in Cloudflare dashboard
# Change CNAME to: {new-tunnel-id}.cfargotunnel.com

# 6. Reinstall service
cd "D:\PROJECTS\NOOR CANVAS"
.\Workspaces\Infrastructure\Cloudflare\install-tunnel-service-nssm.ps1

# 7. Test
Invoke-WebRequest -Uri "https://noorcanvas.kashkole.com" -UseBasicParsing
```

---

## Reference Information

### Tunnel Configuration

- **Tunnel ID**: `5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1`
- **Tunnel Name**: `noorcanvas`
- **Authentication**: Credentials-based
- **Config File**: `C:\Users\asifh\.cloudflared\config.yml`
- **Credentials**: `C:\Users\asifh\.cloudflared\5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.json`
- **Binary**: `D:\PROJECTS\__CLOUDFLARE\cloudflared.exe`

### Service Configuration

- **Service Name**: `CloudflaredTunnel`
- **Display Name**: Cloudflare Tunnel - NoorCanvas
- **Start Type**: Automatic
- **Failure Recovery**: Restart after 60 seconds (3 attempts)

### DNS Configuration

| Record | Type | Content | Proxy |
|--------|------|---------|-------|
| noorcanvas | CNAME | 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.cfargotunnel.com | ✅ |
| session | CNAME | 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.cfargotunnel.com | ✅ |
| resources | CNAME | 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1.cfargotunnel.com | ✅ |

### Ingress Routes

1. `noorcanvas.kashkole.com` → `http://127.0.0.1:80` (IIS)
2. `session.kashkole.com` → `http://127.0.0.1:8080` (Session API)
3. Catchall → `http_status:404`

---

## Support Resources

- **Cloudflare Docs**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Tunnel Guide**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/
- **Troubleshooting**: https://developers.cloudflare.com/cloudflare-one/faq/tunnel/

---

**Last Updated**: 2025-10-26  
**Version**: 1.0  
**Key**: cloudflare-tunnel-stability
