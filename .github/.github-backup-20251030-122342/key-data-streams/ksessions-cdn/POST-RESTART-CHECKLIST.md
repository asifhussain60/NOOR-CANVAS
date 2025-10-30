# Post-Restart Checklist - KSESSIONS Resources CDN

**Date**: 2025-10-26  
**Key**: `ksessions-resources-cdn`  
**Status**: Ready for restart

---

## ✅ Completed Before Restart

- [x] IIS site "KashkoleResources" configured (port 80, hostname: resources.kashkole.com)
- [x] web.config deployed with CORS and caching headers
- [x] Cloudflare tunnel created (ID: 5474d3b4-50ea-4588-8763-5fc7da533d6c)
- [x] Config file created: `C:\Users\asifh\.cloudflared\config.yml`
- [x] DNS routes configured for resources.kashkole.com

---

## 🔄 After Restart - Run This

### Option A: Quick Start (Recommended)
```cmd
D:\PROJECTS\NOOR CANVAS\Scripts\START-CLOUDFLARED-TUNNEL.bat
```

### Option B: Manual Start
```powershell
# Start tunnel
Start-Process -FilePath "pwsh.exe" -ArgumentList "-NoProfile", "-Command", "& 'D:\PROJECTS\__CLOUDFLARE\cloudflared.exe' tunnel --config 'C:\Users\asifh\.cloudflared\config.yml' run noorcanvas" -WindowStyle Minimized

# Wait 15 seconds
Start-Sleep -Seconds 15

# Test production URL
Invoke-WebRequest -Uri "https://resources.kashkole.com/IMAGES/1/dd004eb0-fd39-4207-b1da-32b3e3c48269.jpg" -UseBasicParsing -SkipCertificateCheck
```

---

## 🎯 Expected Results

**Tunnel should show 4 connections:**
- ewr05, ewr08, ewr13 (Cloudflare edge locations)

**Production test should return:**
- Status: 200 OK
- Content-Type: image/jpeg
- Cache-Control: public, max-age=31536000, immutable
- Access-Control-Allow-Origin: https://noorcanvas.kashkole.com,https://session.kashkole.com

---

## 📝 Configuration Files

**Cloudflare Tunnel Config**: `C:\Users\asifh\.cloudflared\config.yml`
```yaml
tunnel: 5474d3b4-50ea-4588-8763-5fc7da533d6c
credentials-file: C:\Users\asifh\.cloudflared\5474d3b4-50ea-4588-8763-5fc7da533d6c.json

ingress:
  - hostname: resources.kashkole.com
    service: http://127.0.0.1:80
  - hostname: noorcanvas.kashkole.com
    service: http://127.0.0.1:80
  - hostname: session.kashkole.com
    service: http://127.0.0.1:8080
  - service: http_status:404
```

**IIS web.config**: `D:\Websites\KSESSIONS\Resources\web.config`
- CORS enabled for noorcanvas.kashkole.com and session.kashkole.com
- 1-year caching
- Range requests enabled for MP3 streaming

---

## ⚠️ If 404 Errors Occur

**Issue**: Cloudflare tunnel routes to wrong IIS site

**Fix**: Stop Default Web Site (it catches all port 80 traffic)
```powershell
Import-Module WebAdministration
Stop-Website -Name "Default Web Site"
```

---

## 🔍 Troubleshooting Commands

```powershell
# Check tunnel status
cd "D:\PROJECTS\__CLOUDFLARE"
.\cloudflared.exe tunnel info noorcanvas

# Check running process
Get-Process -Name "cloudflared"

# Test local IIS (bypass tunnel)
Invoke-WebRequest -Uri "http://resources.kashkole.com/IMAGES/1/dd004eb0-fd39-4207-b1da-32b3e3c48269.jpg" -UseBasicParsing

# Check IIS sites
Get-Website | Select-Object Name, State, Bindings
```

---

## ✅ Final Validation

Once tunnel is running, mark Phase 2 and Phase 3 complete:

```
✓ Phase 2: Cloudflare tunnel running
✓ Phase 3: Production smoke tests passed
✓ CDN LIVE: https://resources.kashkole.com
```
