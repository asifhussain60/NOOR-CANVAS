# KSESSIONS Resources CDN Setup

**Production-only CDN for serving static resources via Cloudflare Tunnel**

## Overview

Serves `D:\Websites\KSESSIONS\Resources` via `https://resources.kashkole.com` with:
- ✅ CORS headers for `noorcanvas.kashkole.com` and `session.kashkole.com`
- ✅ 1-year cache for static assets
- ✅ Auto-start Cloudflare tunnel as Windows service
- ✅ IIS compression and security headers

## Quick Start

### Prerequisites

1. **IIS Site**: `KashkoleResources` at `D:\Websites\KSESSIONS\Resources` on port 80
2. **Cloudflare Binary**: `cloudflared.exe` at `D:\PROJECTS\__CLOUDFLARE\cloudflared.exe`
3. **Tunnel Setup**: Active Cloudflare tunnel with credentials file
4. **DNS**: CNAME for `resources.kashkole.com` pointing to tunnel

### One-Command Deployment

```powershell
# Run as Administrator
cd "D:\PROJECTS\NOOR CANVAS\Scripts\Resources-CDN"
.\deploy-resources-cdn.ps1
```

## Manual Setup

### 1. Configure Cloudflare Tunnel

Copy and configure tunnel config:

```powershell
# Copy template to Cloudflare directory
Copy-Item "config-resources.yml" "D:\PROJECTS\__CLOUDFLARE\config-resources.yml"

# Edit config and replace placeholders:
# - <TUNNEL_ID> with your actual tunnel ID
# - <CREDENTIALS_FILE> with credentials filename
notepad "D:\PROJECTS\__CLOUDFLARE\config-resources.yml"
```

**Config Structure:**
```yaml
tunnel: abc123-def456-ghi789
credentials-file: D:\PROJECTS\__CLOUDFLARE\abc123-def456-ghi789.json

ingress:
  - hostname: resources.kashkole.com
    service: http://localhost:80
  - service: http_status:404
```

### 2. Configure IIS Site

```powershell
.\setup-resources-cdn.ps1
```

**What it does:**
- Creates/verifies IIS site `KashkoleResources`
- Generates `web.config` with CORS and caching
- Restarts site to apply configuration

### 3. Install Cloudflare Service

```powershell
.\install-cloudflare-resources-service.ps1
```

**What it does:**
- Removes existing `CloudflareResourcesTunnel` service if present
- Installs tunnel as Windows service
- Sets auto-start on Windows boot
- Starts the service

### 4. Verify Setup

```powershell
.\test-resources-cdn.ps1
```

**Tests:**
- ✓ Cloudflare service running
- ✓ IIS responding with CORS headers
- ✓ 1-year cache configured
- ✓ External URL accessible
- ✓ CORS from production domains

## Files

| File | Purpose |
|------|---------|
| `config-resources.yml` | Cloudflare tunnel configuration template |
| `setup-resources-cdn.ps1` | IIS site configuration script |
| `install-cloudflare-resources-service.ps1` | Windows service installation |
| `deploy-resources-cdn.ps1` | All-in-one deployment orchestrator |
| `test-resources-cdn.ps1` | Comprehensive verification tests |

## Configuration Details

### IIS `web.config`

```xml
<!-- CORS Headers -->
<add name="Access-Control-Allow-Origin" value="https://noorcanvas.kashkole.com,https://session.kashkole.com" />
<add name="Access-Control-Allow-Methods" value="GET, HEAD, OPTIONS" />

<!-- 1-Year Cache -->
<clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />

<!-- Security Headers -->
<add name="X-Content-Type-Options" value="nosniff" />
<add name="X-Frame-Options" value="SAMEORIGIN" />
```

### Cloudflare Tunnel Route

```
resources.kashkole.com → Cloudflare Edge → localhost:80 (IIS)
```

## Service Management

### View Service Status
```powershell
Get-Service CloudflareResourcesTunnel
```

### Start/Stop Service
```powershell
Start-Service CloudflareResourcesTunnel
Stop-Service CloudflareResourcesTunnel
```

### View Service Logs
```powershell
Get-EventLog -LogName Application -Source cloudflared -Newest 20
```

### Restart Service
```powershell
Restart-Service CloudflareResourcesTunnel
```

## Testing

### Basic Connectivity
```powershell
# Test local IIS
curl http://localhost:80

# Test external CDN
curl https://resources.kashkole.com
```

### CORS Testing
```powershell
# From NoorCanvas domain
curl -H "Origin: https://noorcanvas.kashkole.com" https://resources.kashkole.com

# From Sessions domain
curl -H "Origin: https://session.kashkole.com" https://resources.kashkole.com
```

### Cache Headers
```powershell
curl -I https://resources.kashkole.com/images/flags/us.png
# Look for: Cache-Control: max-age=31536000
```

### Full Verification
```powershell
.\test-resources-cdn.ps1
```

## Application Integration

### Update FlagService.cs

```csharp
// Before
private const string FlagImageBasePath = "/images/flags/";

// After (Production)
private const string FlagImageBasePath = "https://resources.kashkole.com/images/flags/";
```

### Update UnifiedHtmlTransformService.cs

Search for hardcoded resource paths and replace with CDN URLs:
```csharp
// Before
src="/css/styles.css"

// After
src="https://resources.kashkole.com/css/styles.css"
```

## Troubleshooting

### Service Won't Start

```powershell
# Check config file exists
Test-Path "D:\PROJECTS\__CLOUDFLARE\config-resources.yml"

# Verify credentials file
Test-Path "D:\PROJECTS\__CLOUDFLARE\<your-tunnel-id>.json"

# Check event logs
Get-EventLog -LogName Application -Source cloudflared -Newest 10
```

### CORS Headers Not Working

```powershell
# Verify web.config exists
Test-Path "D:\Websites\KSESSIONS\Resources\web.config"

# Check IIS site bindings
Get-WebBinding -Name "KashkoleResources"

# Test local IIS directly
curl -I http://localhost:80
```

### External URL Not Accessible

1. **Check DNS**: Verify CNAME points to Cloudflare tunnel
   ```powershell
   nslookup resources.kashkole.com
   ```

2. **Check Service**: Ensure tunnel service is running
   ```powershell
   Get-Service CloudflareResourcesTunnel
   ```

3. **Check Cloudflare Dashboard**: Verify tunnel is connected

### Cache Not Working

```powershell
# Test cache headers
curl -I https://resources.kashkole.com/test.css

# Should see:
# Cache-Control: max-age=31536000

# If missing, restart IIS site
Restart-WebAppPool -Name "DefaultAppPool"
iisreset
```

## DNS Configuration

**Cloudflare Dashboard → DNS:**

| Type | Name | Target | Proxy Status |
|------|------|--------|--------------|
| CNAME | resources.kashkole.com | `<tunnel-id>.cfargotunnel.com` | Proxied (orange cloud) |

## Security Considerations

- ✅ **HTTPS Only**: All traffic encrypted via Cloudflare
- ✅ **Limited CORS**: Only whitelisted domains
- ✅ **Read-Only**: No POST/PUT/DELETE methods
- ✅ **Static Content**: No server-side processing
- ✅ **Security Headers**: XSS and clickjacking protection

## Performance

- **Cache Duration**: 1 year (31,536,000 seconds)
- **Compression**: Gzip/Brotli enabled
- **CDN Edge**: Cloudflare global network
- **Expected Response Time**: <100ms globally

## Monitoring

### Health Check Script

```powershell
# Quick health check
$response = Invoke-WebRequest -Uri "https://resources.kashkole.com" -UseBasicParsing
if ($response.StatusCode -eq 200) {
    Write-Host "✓ CDN Healthy" -ForegroundColor Green
} else {
    Write-Host "✗ CDN Issue" -ForegroundColor Red
}
```

### Metrics to Monitor

- Service uptime: `Get-Service CloudflareResourcesTunnel`
- IIS site state: `Get-Website -Name KashkoleResources`
- Response time: Via Cloudflare Analytics
- Bandwidth usage: Via Cloudflare Analytics

## Rollback

### Remove Service

```powershell
Stop-Service CloudflareResourcesTunnel
D:\PROJECTS\__CLOUDFLARE\cloudflared.exe service uninstall
```

### Restore IIS

```powershell
Remove-Item "D:\Websites\KSESSIONS\Resources\web.config" -Force
iisreset
```

## Support

**Service Key**: `ksessions-resources-cdn`

**Logs Location**:
- Windows Event Log: Application → cloudflared
- IIS Logs: `C:\inetpub\logs\LogFiles\`

**Created**: 2025-10-26  
**Last Updated**: 2025-10-26
