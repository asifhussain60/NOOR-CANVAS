# NOOR Canvas Global Command Shortcuts

**Ultra-Fast Application Serving** - Created September 15, 2025

## 🚀 Quickest Commands to Serve NC Application

### **FASTEST (No Build):**
```powershell
# Ultra-fast serving (no build, no restore) - RECOMMENDED
ncs                    # Full command with auto-cleanup
nc                     # Super-short alias (same as ncs)

# Equivalent to: dotnet run --no-build --no-restore --urls "https://localhost:9091;http://localhost:9090"
```

### **Build Options:**
```powershell
ncs -Build            # Build and serve
ncs -Kill             # Kill any running NC processes
ncs -Help             # Show detailed help
```

## ⚡ Speed Comparison

| Command | Build Time | Start Time | Use Case |
|---------|------------|------------|----------|
| `ncs` or `nc` | **0 seconds** | **~2 seconds** | ✅ **Fastest** - Use after any previous build |
| `ncs -Build` | ~10-30 seconds | ~2 seconds | Use after code changes |
| `dotnet run` | ~10-30 seconds | ~2 seconds | Standard command |

## 🎯 Usage Guidelines

### **Primary Workflow:**
1. **After Code Changes:** `ncs -Build` (build first time)
2. **Subsequent Runs:** `ncs` or `nc` (ultra-fast, no build)
3. **Process Issues:** `ncs -Kill` (cleanup processes)

### **Super-Fast Development Loop:**
```powershell
# Make code changes...
ncs -Build              # Build once after changes

# Then use ultra-fast serving repeatedly:
nc                      # Start server
# Ctrl+C to stop
nc                      # Restart instantly
# Ctrl+C to stop
nc                      # Restart again...
```

## 🌐 Server URLs
- **Primary:** https://localhost:9091
- **Secondary:** http://localhost:9090

## 📋 All Available NC Global Commands ✅

### **✅ ACTIVE GLOBAL COMMANDS** (Shown on PowerShell startup):
- `nc` - Ultra-fast serve (no build, 2-second startup) ⚡ **FASTEST**
- `ncs` - NOOR Canvas Server (full command with `-Build`, `-Kill`, `-Help`)
- `nct` - NOOR Canvas Token generator (Host GUID provisioning)
- `ncdoc` - NOOR Canvas Documentation generator

### **Server Management:**
- `ncs` / `nc` - Ultra-fast serve (no build)
- `ncs -Build` - Build and serve
- `ncs -Kill` - Kill NC processes
- `ncs -Help` - Server help

### **Token/Session Management:**
- `nct` - Interactive Host GUID generator
- `nct 123` - Generate GUID for session 123
- `nct -Help` - Token help

### **Documentation:**
- `ncdoc` - Documentation generator
- `ncdoc -Help` - Documentation help

### **Other Utilities:**
- `nc-build` - Build utilities
- `nc-cleanup` - Cleanup utilities
- `nc-prockill` - Process management

## 🔧 Technical Details

### **What `ncs` does:**
1. **Auto-cleanup:** Kills any existing NC processes
2. **Fast serving:** Uses `--no-build --no-restore` flags
3. **URL binding:** Serves on both HTTP and HTTPS
4. **Error handling:** Provides troubleshooting tips

### **Command Translation:**
```powershell
ncs = cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas" && 
      dotnet run --no-build --no-restore --urls "https://localhost:9091;http://localhost:9090"
```

## 💡 Pro Tips

1. **First run of the day:** Use `ncs -Build`
2. **Subsequent runs:** Use `nc` (2 characters!)
3. **Stuck processes:** Use `ncs -Kill`
4. **Port conflicts:** Check if 9090/9091 are available
5. **Code changes:** Always use `ncs -Build` after modifications

## ⚙️ Installation Location
- **Script:** `D:\PROJECTS\NOOR CANVAS\Workspaces\Global\ncs.ps1`
- **Profile:** Added to PowerShell profile for global access
- **Aliases:** Available in any PowerShell session

---

**Result:** You can now serve the NC application in just **2 characters** (`nc`) with **zero build time**! 🎉
