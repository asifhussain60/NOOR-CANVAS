# NoorCanvas IIS Configuration Summary

**Date**: October 12, 2025  
**Status**: ✅ Successfully Configured and Deployed

---

## 🌐 Access URLs

| Protocol | URL | Purpose |
|----------|-----|---------|
| **HTTP** | http://localhost:9090 | Main application access |
| **HTTPS** | https://localhost:443 | Secure access (SSL enabled) |

---

## 📋 IIS Configuration

### Application Pool: **NoorCanvas**
- ✅ Status: **Started**
- ✅ .NET CLR Version: **No Managed Code** (ASP.NET Core)
- ✅ Pipeline Mode: **Integrated**
- ✅ Start Mode: **Always Running**
- ✅ Idle Timeout: **20 minutes**
- ✅ Periodic Restart: **Disabled**

### Website: **NoorCanvas**
- ✅ Status: **Started**
- ✅ Physical Path: `D:\Websites\NOOR-CANVAS`
- ✅ Application Pool: **NoorCanvas**

### Bindings
- ✅ **HTTP**: Port **9090** (avoids conflict with KSESSIONS on port 80)
- ✅ **HTTPS**: Port **443** with SSL certificate
  - Certificate: Self-signed for **localhost**
  - Thumbprint: `4B15B5ADEE320959C3E705AA39B1F2F5FE3B9EE8`
  - Valid Until: ~2030

---

## 📁 Deployment Location

```
D:\Websites\NOOR-CANVAS\
├── NoorCanvas.dll
├── web.config
├── appsettings.json
├── appsettings.Production.json
├── logs\
└── wwwroot\
```

### Backups Location
```
D:\Websites\NOOR-CANVAS-Backups\
├── backup-2025-10-12_06-51-33\
├── backup-2025-10-12_06-40-55\
└── ...
```

---

## 🚀 Deployment Scripts

### Deploy Application
```powershell
cd 'D:\PROJECTS\NOOR CANVAS'
.\ncdeploy.ps1
```

### Rollback to Previous Version
```powershell
# List available backups
.\ncrollback.ps1

# Restore latest backup
.\ncrollback.ps1 -Latest

# Restore specific backup
.\ncrollback.ps1 -BackupName "backup-2025-10-12_06-40-55"
```

### Reconfigure IIS
```powershell
# Setup IIS (HTTP only)
.\setup-iis.ps1 -Port 9090

# Add SSL certificate
.\setup-iis-ssl.ps1 -SelfSigned -HostName "localhost"

# Remove and recreate
.\setup-iis.ps1 -Port 9090 -RemoveExisting
```

---

## 🔧 Management Commands

### Website Control
```powershell
# Stop website
Stop-Website -Name "NoorCanvas"

# Start website
Start-Website -Name "NoorCanvas"

# Restart website
Restart-Website -Name "NoorCanvas"

# Check status
Get-Website -Name "NoorCanvas"
```

### Application Pool Control
```powershell
# Stop app pool
Stop-WebAppPool -Name "NoorCanvas"

# Start app pool
Start-WebAppPool -Name "NoorCanvas"

# Restart app pool
Restart-WebAppPool -Name "NoorCanvas"

# Check status
Get-WebAppPoolState -Name "NoorCanvas"
```

### View Logs
```powershell
# View recent application logs
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-*.txt" -Tail 100

# Monitor logs in real-time
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-*.txt" -Wait -Tail 50

# View IIS stdout logs
Get-Content "D:\Websites\NOOR-CANVAS\logs\stdout*.log" -Tail 50
```

---

## ⚙️ Configuration Files

### appsettings.Production.json
Location: `D:\Websites\NOOR-CANVAS\appsettings.Production.json`

**Note**: This file is preserved during deployments. Update connection strings here:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=PRODUCTION_SERVER;Database=...",
    "KSessionsDb": "Server=PRODUCTION_SERVER;Database=...",
    "KQurDb": "Server=PRODUCTION_SERVER;Database=..."
  }
}
```

### web.config
Location: `D:\Websites\NOOR-CANVAS\web.config`

Key settings:
- ASP.NET Core Module V2
- InProcess hosting model
- stdout logging: Enabled
- WebSocket: Enabled (required for SignalR)

---

## 🔒 SSL Certificate Information

### Self-Signed Certificate
- **Subject**: CN=localhost
- **Issuer**: CN=localhost (Self-signed)
- **Thumbprint**: 4B15B5ADEE320959C3E705AA39B1F2F5FE3B9EE8
- **Valid Until**: ~2030
- **Location**: Cert:\LocalMachine\My

### Browser Warning
Self-signed certificates will show a security warning in browsers. This is normal for development/testing.

**To remove the warning** (optional for local development):
1. Open `certmgr.msc` (Certificate Manager)
2. Navigate to: Personal → Certificates
3. Find the certificate for "localhost"
4. Export it (right-click → All Tasks → Export)
5. Import it to: Trusted Root Certification Authorities

### Using a Production Certificate
For production, replace with a valid certificate:

```powershell
# List available certificates
Get-ChildItem Cert:\LocalMachine\My

# Use specific certificate
.\setup-iis-ssl.ps1 -CertificateThumbprint "YOUR_CERT_THUMBPRINT"
```

---

## ⚠️ Important Notes

### Port Configuration
- **HTTP Port 9090**: Chosen to avoid conflict with KSESSIONS application on port 80
- **HTTPS Port 443**: Standard HTTPS port

### WebSocket Support
⚠️ **Warning**: WebSocket feature is not enabled in Windows
- SignalR connections may not work properly
- **To enable**:
  ```powershell
  Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
  ```
- After enabling, restart IIS:
  ```powershell
  iisreset
  ```

### Database Configuration
Ensure database connection strings in `appsettings.Production.json` point to the correct servers:
- Development: `AHHOME`
- Production: Update as needed

### Deployment Process
1. Build → 2. Stop IIS → 3. Backup → 4. Deploy → 5. Start IIS → 6. Verify

Auto-backup keeps last 5 versions for easy rollback.

---

## ✅ Verification Checklist

- [x] IIS Application Pool created and running
- [x] IIS Website created and running  
- [x] HTTP binding on port 9090
- [x] HTTPS binding on port 443
- [x] SSL certificate installed
- [x] Application deployed to D:\Websites\NOOR-CANVAS
- [x] Backup system working
- [x] Deployment script functional
- [x] Rollback script functional

### Still Needed (Optional)
- [ ] Enable WebSocket feature in Windows
- [ ] Install production SSL certificate (if not using self-signed)
- [ ] Configure automatic HTTPS redirect
- [ ] Set up application monitoring
- [ ] Configure database backups

---

## 📞 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Site won't start | Check port conflicts: `Get-Website` |
| 502 Bad Gateway | Check logs in `D:\Websites\NOOR-CANVAS\logs\` |
| SSL certificate warning | Normal for self-signed certs, or install to Trusted Root |
| SignalR not working | Enable WebSocket feature, restart IIS |
| Database connection errors | Verify connection strings in `appsettings.Production.json` |
| Deployment fails | Check logs, ensure IIS app pool is stopped |

---

## 📚 Documentation Files

- **DEPLOYMENT.md**: Complete deployment guide
- **IIS-CONFIGURATION-SUMMARY.md**: This file
- **ncdeploy.ps1**: Main deployment script
- **ncrollback.ps1**: Rollback script
- **setup-iis.ps1**: IIS configuration script
- **setup-iis-ssl.ps1**: SSL configuration script

---

**System Configured By**: GitHub Copilot  
**Last Updated**: October 12, 2025
