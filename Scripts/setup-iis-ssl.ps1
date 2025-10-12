<#
.SYNOPSIS
    Add SSL certificate binding to NoorCanvas IIS website.

.DESCRIPTION
    This script adds HTTPS binding (port 443) to the existing NoorCanvas website.
    You can either use an existing certificate or create a self-signed certificate for testing.

.PARAMETER CertificateThumbprint
    Thumbprint of an existing certificate to use. Leave empty to create a self-signed certificate.

.PARAMETER HostName
    Host name for the SSL certificate (e.g., "noorcanvas.local" or "localhost")

.PARAMETER SiteName
    Name of the IIS website. Default: "NoorCanvas"

.PARAMETER SelfSigned
    Create and use a self-signed certificate for testing.

.EXAMPLE
    .\setup-iis-ssl.ps1 -SelfSigned -HostName "localhost"
    Create a self-signed certificate for localhost

.EXAMPLE
    .\setup-iis-ssl.ps1 -CertificateThumbprint "ABC123..." -HostName "noorcanvas.local"
    Use an existing certificate
#>

param(
    [string]$CertificateThumbprint,
    [string]$HostName = "localhost",
    [string]$SiteName = "NoorCanvas",
    [switch]$SelfSigned
)

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n[STEP] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

try {
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  NoorCanvas SSL Configuration" -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta

    # Import WebAdministration module
    Write-Step "Loading IIS modules..."
    Import-Module WebAdministration
    Write-Success "IIS modules loaded"

    # Check if website exists
    Write-Step "Verifying website exists..."
    $site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
    if (-not $site) {
        throw "Website '$SiteName' not found. Run setup-iis.ps1 first."
    }
    Write-Success "Website found: $SiteName"

    # Get or create certificate
    $cert = $null
    
    if ($CertificateThumbprint) {
        Write-Step "Looking for certificate with thumbprint: $CertificateThumbprint..."
        $cert = Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object { $_.Thumbprint -eq $CertificateThumbprint }
        
        if (-not $cert) {
            throw "Certificate with thumbprint '$CertificateThumbprint' not found"
        }
        Write-Success "Certificate found: $($cert.Subject)"
        
    } elseif ($SelfSigned) {
        Write-Step "Creating self-signed certificate for: $HostName..."
        
        # Check if certificate already exists
        $existingCert = Get-ChildItem -Path Cert:\LocalMachine\My | 
            Where-Object { $_.Subject -eq "CN=$HostName" -and $_.Issuer -eq "CN=$HostName" } |
            Select-Object -First 1
        
        if ($existingCert) {
            Write-Warning "Self-signed certificate already exists for $HostName"
            $cert = $existingCert
            Write-Success "Using existing certificate"
        } else {
            # Create new self-signed certificate
            $cert = New-SelfSignedCertificate `
                -DnsName $HostName `
                -CertStoreLocation "Cert:\LocalMachine\My" `
                -NotAfter (Get-Date).AddYears(5) `
                -KeyAlgorithm RSA `
                -KeyLength 2048 `
                -HashAlgorithm SHA256 `
                -KeyExportPolicy Exportable `
                -KeyUsage DigitalSignature, KeyEncipherment `
                -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")
            
            Write-Success "Self-signed certificate created"
            Write-Host "  Subject: $($cert.Subject)" -ForegroundColor Gray
            Write-Host "  Thumbprint: $($cert.Thumbprint)" -ForegroundColor Gray
            Write-Host "  Valid Until: $($cert.NotAfter)" -ForegroundColor Gray
        }
        
    } else {
        Write-Warning "No certificate specified."
        Write-Host "`nOptions:" -ForegroundColor Yellow
        Write-Host "  1. Use -SelfSigned to create a self-signed certificate" -ForegroundColor Gray
        Write-Host "  2. Use -CertificateThumbprint to specify an existing certificate" -ForegroundColor Gray
        Write-Host "`nAvailable certificates:" -ForegroundColor Cyan
        
        Get-ChildItem -Path Cert:\LocalMachine\My | ForEach-Object {
            Write-Host "  Subject: $($_.Subject)" -ForegroundColor White
            Write-Host "  Thumbprint: $($_.Thumbprint)" -ForegroundColor Gray
            Write-Host "  Expires: $($_.NotAfter)" -ForegroundColor Gray
            Write-Host ""
        }
        
        exit 0
    }

    # Remove existing HTTPS binding if it exists
    Write-Step "Configuring HTTPS binding..."
    
    $existingBinding = Get-WebBinding -Name $SiteName -Protocol "https" -Port 443 -ErrorAction SilentlyContinue
    if ($existingBinding) {
        Write-Warning "Removing existing HTTPS binding"
        Remove-WebBinding -Name $SiteName -Protocol "https" -Port 443
    }

    # Add HTTPS binding
    if ($HostName -and $HostName -ne "*") {
        New-WebBinding -Name $SiteName -Protocol "https" -Port 443 -HostHeader $HostName
        Write-Success "Added HTTPS binding on port 443 with host header: $HostName"
    } else {
        New-WebBinding -Name $SiteName -Protocol "https" -Port 443
        Write-Success "Added HTTPS binding on port 443 (all host names)"
    }

    # Bind certificate to HTTPS binding
    Write-Step "Binding certificate to HTTPS..."
    
    $binding = Get-WebBinding -Name $SiteName -Protocol "https" -Port 443
    $binding.AddSslCertificate($cert.Thumbprint, "My")
    
    Write-Success "Certificate bound to HTTPS binding"

    # Verify the binding
    Write-Step "Verifying SSL configuration..."
    
    $sslBinding = Get-ChildItem -Path "IIS:\SslBindings" | 
        Where-Object { $_.Port -eq 443 } |
        Select-Object -First 1
    
    if ($sslBinding) {
        Write-Success "SSL binding verified"
        Write-Host "  Port: 443" -ForegroundColor Gray
        Write-Host "  Certificate: $($cert.Subject)" -ForegroundColor Gray
        Write-Host "  Thumbprint: $($cert.Thumbprint)" -ForegroundColor Gray
    }

    # Get current bindings
    $allBindings = Get-WebBinding -Name $SiteName
    
    # Summary
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  SSL CONFIGURATION COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Magenta
    
    Write-Host "`nWebsite Bindings:" -ForegroundColor Cyan
    foreach ($b in $allBindings) {
        $protocol = $b.protocol.ToUpper()
        $bindingInfo = $b.bindingInformation
        Write-Host "  $protocol - $bindingInfo" -ForegroundColor White
    }
    
    Write-Host "`nAccess URLs:" -ForegroundColor Cyan
    foreach ($b in $allBindings) {
        if ($b.protocol -eq "http") {
            $parts = $b.bindingInformation -split ':'
            $port = $parts[1]
            $hostname = if ($parts[2]) { $parts[2] } else { "localhost" }
            Write-Host "  http://${hostname}:$port" -ForegroundColor White
        }
        if ($b.protocol -eq "https") {
            $parts = $b.bindingInformation -split ':'
            $hostname = if ($parts[2]) { $parts[2] } else { "localhost" }
            Write-Host "  https://${hostname}:443" -ForegroundColor White
        }
    }
    
    if ($SelfSigned) {
        Write-Host "`nNote: Self-signed certificates will show a warning in browsers." -ForegroundColor Yellow
        Write-Host "You can add the certificate to Trusted Root Certification Authorities to remove the warning." -ForegroundColor Yellow
    }
    
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "  1. Test HTTP access" -ForegroundColor Gray
    Write-Host "  2. Test HTTPS access" -ForegroundColor Gray
    Write-Host "  3. Configure URL rewrite for HTTPS redirect if needed" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  SSL CONFIGURATION FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Error $_.Exception.Message
    Write-Host "`nError Details:" -ForegroundColor Yellow
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    exit 1
}
