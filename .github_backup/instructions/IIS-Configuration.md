# IIS Configuration Reference

**Last Updated**: 2025-10-26  
**Purpose**: Global reference for IIS site bindings and Cloudflare tunnel mappings

---

## IIS Site Bindings

### KSESSIONS Site (Main Application)
- **Physical Path**: D:\Websites\KSESSIONS
- **Bindings**:
  - **HTTP** (Port 8080): session.kashkole.com
  - **HTTPS** (Port 443): session.kashkole.com
  - **SSL Certificate**: CloudFlare Origin Certificate

### NoorCanvas Site
- **Physical Path**: (Inferred from IIS structure)
- **Bindings**:
  - **HTTPS** (Port 443): noorcanvas.kashkole.com
  - **HTTP** (Port 80): noorcanvas.kashkole.com
  - **SSL Certificate**: CloudFlare Origin Certificate

### KashkoleResources Site (Static Resources)
- **Physical Path**: D:\Websites\KSESSIONS\Resources
- **Bindings**:
  - **HTTP** (Port 80): Default binding (no specific hostname)
  - **HTTP** (Port 80): resources.kashkole.com
  - **HTTPS** (Port 443): resources.kashkole.com
  - **SSL Certificate**: CloudFlare Origin Certificate (b78ce1da4f4f1a93bca408fcd1976780be0e7834)
- Used for serving static files (images, audio, media)

---

## Cloudflare Tunnel Configuration

**Config File**: `C:\Users\asifh\.cloudflared\config.yml`  
**Tunnel ID**: `4e2266b5-48ed-429d-b9d3-e235186e9dca`  
**Credentials**: `C:\Users\asifh\.cloudflared\4e2266b5-48ed-429d-b9d3-e235186e9dca.json`

### Ingress Rules

| Domain | IIS Target | Port | HTTP Host Header | Notes |
|--------|-----------|------|------------------|-------|
| resources.kashkole.com | https://127.0.0.1:443 | 443 | resources.kashkole.com | KashkoleResources site (static files over HTTPS) |
| noorcanvas.kashkole.com | http://127.0.0.1:80 | 80 | noorcanvas.kashkole.com | NoorCanvas application |
| session.kashkole.com | http://127.0.0.1:8080 | 8080 | (none) | KSESSIONS main application |
| (catch-all) | http_status:404 | - | - | Fallback for unmapped domains |

### Tunnel Options
- **noTLSVerify**: true (for resources.kashkole.com and noorcanvas.kashkole.com)
- **httpHostHeader**: Set to match domain for proper IIS routing

---

## URL Mapping Examples

### Resources (Images, Audio, Media)
- **CDN URL**: `https://resources.kashkole.com/IMAGES/1278/02.jpg`
- **IIS Route**: Cloudflare Tunnel → https://127.0.0.1:443 (KashkoleResources) → D:\Websites\KSESSIONS\Resources\IMAGES\1278\02.jpg
- **Localhost URL**: `http://localhost/IMAGES/1278/02.jpg` (HTTP) or `https://localhost:443/IMAGES/1278/02.jpg` (HTTPS with cert warning)

### NoorCanvas Application
- **Public URL**: `https://noorcanvas.kashkole.com/`
- **IIS Route**: Cloudflare Tunnel → http://127.0.0.1:80 (NoorCanvas) → NoorCanvas site physical path

### Session Application
- **Public URL**: `https://session.kashkole.com/`
- **IIS Route**: Cloudflare Tunnel → http://127.0.0.1:8080 (KSESSIONS) → D:\Websites\KSESSIONS

---

## Database Resource Catalog

**Database**: KSESSIONS_DEV on AHHOME  
**Table**: canvas.ResourceCatalog

### Schema
```sql
ResourceID INT (Primary Key)
ID INT (SessionID - Foreign Key)
ResourceName VARCHAR(255) (Relative path like "1278/02.jpg")
ResourceType INT (1=Images, 2=MP3, 3=MEDIA)
```

### Physical File Structure
```
D:\Websites\KSESSIONS\Resources\
├── IMAGES\
│   ├── {SessionID}\
│   │   ├── {filename}.jpg
│   │   ├── {guid}.jpg
│   │   └── ...
├── MP3\
│   └── {SessionID}\
│       └── {filename}.mp3
└── MEDIA\
    └── {SessionID}\
        └── {filename}.*
```

---

## Troubleshooting Reference

### If CDN URLs Return 404
1. **Check Cloudflare Tunnel Status**: `Get-Process cloudflared`
2. **Verify IIS Site Running**: Check IIS Manager → Sites → KashkoleResources
3. **Test Localhost**: `http://localhost/IMAGES/{path}` should work
4. **Verify Host Header**: Ensure httpHostHeader in config.yml matches domain
5. **Restart Tunnel**: `Restart-Service cloudflared` or kill PID and restart

### If Localhost Works but CDN Doesn't
- **Likely Cause**: Cloudflare tunnel not routing correctly
- **Fix**: Verify config.yml ingress rules and restart cloudflared service

### Test Commands
```powershell
# Test localhost (should work)
Invoke-WebRequest -Uri "http://localhost/IMAGES/1278/02.jpg"

# Test CDN (should work if tunnel configured correctly)
Invoke-WebRequest -Uri "https://resources.kashkole.com/IMAGES/1278/02.jpg"

# Check cloudflared process
Get-Process cloudflared

# View tunnel logs (if service exists)
Get-EventLog -LogName Application -Source cloudflared -Newest 20
```

---

## Configuration Update History

### 2025-10-26 (Session 2)
- **Fixed mixed content blocking**: Added HTTPS binding to KashkoleResources site
- **SSL Certificate**: Bound Cloudflare Origin Certificate (b78ce1da4f4f1a93bca408fcd1976780be0e7834) to port 443
- **Cloudflare Tunnel**: Updated to use `https://127.0.0.1:443` for resources.kashkole.com
- **Result**: CDN now serves resources over HTTPS, eliminating mixed content warnings in browsers

### 2025-10-26
- Documented IIS bindings from screenshots
- Confirmed Cloudflare tunnel configuration
- Verified KashkoleResources serves from localhost:80
- Noted session.kashkole.com uses port 8080 (KSESSIONS site)
- Noted noorcanvas.kashkole.com and resources.kashkole.com both use port 80 with httpHostHeader routing
