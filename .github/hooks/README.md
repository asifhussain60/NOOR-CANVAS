# Git Hooks for Cloudflare Tunnel Protection

This directory contains validation scripts that protect critical configuration files from accidental changes.

## Available Hooks

### `validate-tunnel-id.ps1`

Validates that the Cloudflare tunnel ID in `C:\Users\asifh\.cloudflared\config.yml` matches the canonical tunnel ID.

**Canonical Tunnel ID**: `93650d38-60af-4dc7-a5ec-f8347fc57514`

**Why this matters**: All production DNS CNAME records point to this specific tunnel ID. Changing it will break:
- noorcanvas.kashkole.com
- resources.kashkole.com
- session.kashkole.com

### Usage

**Manual validation**:
```powershell
.\.github\hooks\validate-tunnel-id.ps1 -Verbose
```

**In CI/CD**:
```powershell
.\.github\hooks\validate-tunnel-id.ps1
if ($LASTEXITCODE -ne 0) {
    throw "Tunnel ID validation failed"
}
```

**As pre-commit hook** (manual setup required):

1. Copy to `.git/hooks/pre-commit`:
   ```powershell
   Copy-Item .\.github\hooks\pre-commit .\.git\hooks\pre-commit
   ```

2. Make executable (if on Unix-like system):
   ```bash
   chmod +x .git/hooks/pre-commit
   ```

## Pre-commit Hook Installation

The pre-commit hook is included in this directory but must be manually installed to `.git/hooks/` because git doesn't track the `.git` directory.

**To install**:
```powershell
# From workspace root
Copy-Item .\.github\hooks\pre-commit .\.git\hooks\pre-commit -Force
```

**To test**:
```powershell
# Try to commit a change - hook will run automatically
git commit -m "test commit"
```

## Protection Mechanism

The pre-commit hook:
1. Checks if `C:\Users\asifh\.cloudflared\config.yml` exists
2. Extracts the tunnel ID from the config
3. Compares it to the canonical tunnel ID
4. **Rejects the commit** if tunnel ID doesn't match
5. Allows the commit if tunnel ID is correct or config doesn't exist

## Bypassing (Emergency Only)

If you MUST bypass the hook (strongly discouraged):

```powershell
git commit --no-verify -m "emergency commit"
```

⚠️ **WARNING**: Only bypass if you know exactly what you're doing and have updated DNS records first!

## Validation Output

**Success**:
```
✅ Tunnel ID is correct: 93650d38-60af-4dc7-a5ec-f8347fc57514
```

**Failure**:
```
❌ Tunnel ID mismatch detected!

   Expected: 93650d38-60af-4dc7-a5ec-f8347fc57514
   Found:    5474d3b4-50ea-4588-8763-5fc7da533d6c

   DNS CNAME records point to 93650d38-60af-4dc7-a5ec-f8347fc57514
   Changing tunnel ID will break production URLs:
     - noorcanvas.kashkole.com
     - resources.kashkole.com
     - session.kashkole.com

   To fix: Revert C:\Users\asifh\.cloudflared\config.yml to use canonical tunnel ID
```

## Related Files

- **Verification**: `.github/key-data-streams/cloudflare-tunnel-stability/verify-tunnel-integrity.ps1`
- **Validation**: `.github/key-data-streams/cloudflare-tunnel-stability/validate-config.ps1`
- **Health Check**: `.github/key-data-streams/cloudflare-tunnel-stability/health-check.ps1`
- **Plan**: `.github/key-data-streams/cloudflare-tunnel-stability/cloudflare-tunnel-stability.plan.md`

## Maintenance

This hook is part of the Cloudflare Tunnel Stability system. For more information, see:
- `.github/key-data-streams/cloudflare-tunnel-stability/cloudflare-tunnel-stability.plan.md`
