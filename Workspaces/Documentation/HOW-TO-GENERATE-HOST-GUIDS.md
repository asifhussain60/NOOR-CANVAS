# How to Generate Host GUIDs - Complete Guide

## **Method 1: API Endpoint (Recommended for Testing)**

### **Prerequisites**
- NOOR Canvas application running on `https://localhost:9091`
- Start with: `nc -NoBrowser -Https`

### **PowerShell Command**
```powershell
# Trust self-signed certificates
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

# Generate Host GUID
$request = @{ 
    SessionId = 100
    CreatedBy = "Your Name Here" 
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://localhost:9091/api/hostprovisioner/generate" -Method Post -Body $request -ContentType "application/json"

# Display results
Write-Host "✅ Host GUID Generated: $($response.hostGuid)" -ForegroundColor Green
Write-Host "📊 Session ID: $($response.sessionId)" -ForegroundColor Yellow  
Write-Host "👤 Created By: $($response.createdBy)" -ForegroundColor Yellow
Write-Host "⏰ Created At: $($response.createdAt)" -ForegroundColor Yellow
```

### **Example Response**
```json
{
  "hostGuid": "3cbd173a-a146-4049-9f50-e33eb9ee2f2c",
  "sessionId": 100,
  "createdBy": "Your Name Here", 
  "createdAt": "2025-09-12T19:09:00Z",
  "hash": "A1B2C3D4E5F6G7H8..."
}
```

---

## **Method 2: HostProvisioner Console Tool (Production Ready)**

### **Location**
`D:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner\`

### **Streamlined Interactive Mode**
```bash
# Run Host Provisioner
dotnet run

# Enter Session ID when prompted
# Application automatically generates GUID and exits (no continuation prompts)
```

### **Commands**

#### **Dry Run (Preview Only)**
```bash
cd "D:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner"
dotnet run -- create --session-id 200 --created-by "Admin User" --dry-run
```

#### **Generate Host GUID (Real)**
```bash
cd "D:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner"
dotnet run -- create --session-id 200 --created-by "Admin User"
```

#### **With Expiration Date**
```bash
dotnet run -- create --session-id 200 --created-by "Admin User" --expires "2025-12-31"
```

### **Example Output**
```
[15:09:39 INF] PROVISIONER: Creating Host GUID for Session 200
[15:09:39 INF] DRY-RUN: Would create Host Session:
[15:09:39 INF]   Session ID: 200
[15:09:39 INF]   Host GUID: fa4a5e78-6ebd-4fad-bd9f-95e214e0c3cf
[15:09:39 INF]   Hash: R5IbfAf1JBloB9/f...
[15:09:39 INF]   Created By: Console User
[15:09:39 INF]   Expires At: Never
```

---

## **Method 3: Manual Generation (Development Only)**

### **Simple PowerShell**
```powershell
$hostGuid = [System.Guid]::NewGuid()
Write-Host "Generated Host GUID: $hostGuid"
```

### **With HMAC-SHA256 Hash (Matching System)**
```powershell
$hostGuid = [System.Guid]::NewGuid()
$secret = "NOOR-CANVAS-HOST-SECRET-2025"
$hmac = New-Object System.Security.Cryptography.HMACSHA256([System.Text.Encoding]::UTF8.GetBytes($secret))
$hash = [System.Convert]::ToBase64String($hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($hostGuid.ToString())))

Write-Host "Host GUID: $hostGuid"
Write-Host "Hash: $($hash.Substring(0, 16))..."
```

---

## **Recently Generated Host GUIDs (Ready to Use)**

### **From API Generation**
- **GUID**: `3cbd173a-a146-4049-9f50-e33eb9ee2f2c`
- **Session**: 100
- **Created**: September 12, 2025
- **Created By**: User Request

### **From Console Tool**  
- **GUID**: `fa4a5e78-6ebd-4fad-bd9f-95e214e0c3cf`
- **Session**: 200
- **Created**: September 12, 2025
- **Created By**: Console User

---

## **How to Use Generated Host GUIDs**

### **1. Authentication Test**
```powershell
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

$authRequest = @{ HostGuid = "3cbd173a-a146-4049-9f50-e33eb9ee2f2c" } | ConvertTo-Json
$authResponse = Invoke-RestMethod -Uri "https://localhost:9091/api/host/authenticate" -Method Post -Body $authRequest -ContentType "application/json"

Write-Host "Authentication Success: $($authResponse.success)"
Write-Host "Session Token: $($authResponse.sessionToken)"
```

### **2. Access Host Dashboard**
Navigate to: `https://localhost:9091/host/dashboard?guid=3cbd173a-a146-4049-9f50-e33eb9ee2f2c`

### **3. Use in Application Testing**
Enter the Host GUID in any host authentication form in the NOOR Canvas application.

---

## **System Architecture Notes**

- **HostProvisionerController**: Database-independent token generation
- **HostController**: Phase 2 simplified authentication (accepts any valid GUID)
- **Future Enhancement**: Phase 3+ will include database storage and validation
- **Security**: Uses HMAC-SHA256 with secret key for hash generation
- **Format**: Standard UUID/GUID format (RFC 4122 compliant)

---

## **Troubleshooting**

### **API Method Not Working**
- Ensure NOOR Canvas is running: `nc -NoBrowser -Https`
- Check port 9091 is accessible: `netstat -ano | findstr ":9091"`
- Verify HTTPS certificate trust is disabled in PowerShell

### **Console Tool Issues**
- Build the project first: `dotnet build`
- Use correct parameter format: `--session-id 200` (not just `200`)
- Check .NET 8 SDK is installed

### **Authentication Failures**
- Verify GUID format is correct (36 characters with hyphens)
- Ensure application is in Phase 2+ (accepts any valid GUID format)
- Check browser developer tools for detailed error messages
