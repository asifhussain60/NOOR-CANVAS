# CDN Image Test Links

**Generated**: 2025-10-26  
**Database**: KSESSIONS_DEV  
**CDN Base**: https://resources.kashkole.com

---

## 🔗 Direct Test Links (Click to Test)

### Image 1
**Path**: `IMAGES/1278/02.jpg`  
**Session**: 829  
**CDN URL**: https://resources.kashkole.com/IMAGES/1278/02.jpg

### Image 2
**Path**: `IMAGES/1278/01.jpg`  
**Session**: 829  
**CDN URL**: https://resources.kashkole.com/IMAGES/1278/01.jpg

### Image 3
**Path**: `IMAGES/1278/83ede67d-dd24-4d7e-bfc8-b4b76d6bd1a6.jpg`  
**Session**: 823  
**CDN URL**: https://resources.kashkole.com/IMAGES/1278/83ede67d-dd24-4d7e-bfc8-b4b76d6bd1a6.jpg

### Image 4
**Path**: `IMAGES/1278/e3e5c9b9-9c1b-47e5-82f0-a53a75379898.jpg`  
**Session**: 823  
**CDN URL**: https://resources.kashkole.com/IMAGES/1278/e3e5c9b9-9c1b-47e5-82f0-a53a75379898.jpg

---

## 🧪 Quick Test Commands

### Test with curl
```powershell
curl -I https://resources.kashkole.com/IMAGES/1278/02.jpg
```

### Test with PowerShell
```powershell
Invoke-WebRequest -Uri "https://resources.kashkole.com/IMAGES/1278/02.jpg" -Method HEAD
```

### Verify File Exists Locally
```powershell
Test-Path "D:\Websites\KSESSIONS\Resources\IMAGES\1278\02.jpg"
```

---

## 📊 CDN Architecture

**Flow**:
```
Browser
    ↓
https://resources.kashkole.com/IMAGES/1278/02.jpg
    ↓
Cloudflare Edge (SSL termination)
    ↓
Cloudflared Tunnel (running on AHHOME)
    ↓
IIS KashkoleResources Site (localhost:80)
    ↓
D:\Websites\KSESSIONS\Resources\IMAGES\1278\02.jpg
```

**Status Check**:
- Cloudflared Process: `Get-Process cloudflared`
- IIS Site: `Get-Website -Name "KashkoleResources"`
- Local File: `Test-Path "D:\Websites\KSESSIONS\Resources\IMAGES\1278\02.jpg"`

---

## 🔍 Troubleshooting

### If CDN Returns 404
1. Check file exists: `Test-Path "D:\Websites\KSESSIONS\Resources\IMAGES\1278\02.jpg"`
2. Check IIS site running: `Get-Website -Name "KashkoleResources"`
3. Check cloudflared running: `Get-Process cloudflared`

### If CDN Returns 502/503
1. Restart cloudflared tunnel
2. Check IIS application pool status
3. Verify tunnel configuration

### If CDN Shows CORS Error
1. Check web.config has CORS headers
2. Verify origin is allowed
3. Test with curl (bypasses CORS)
