# KDS Dashboard API Server
# Purpose: Simple HTTP server to provide health check data to the dashboard
# Usage: .\dashboard-api-server.ps1 [-Port 8765]

param(
    [int]$Port = 8765
)

$ErrorActionPreference = 'Stop'

Write-Host "🧠 Starting KDS Dashboard API Server..." -ForegroundColor Cyan
Write-Host "  Port: $Port" -ForegroundColor Gray
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Create HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Host "✅ Server running at http://localhost:$Port/" -ForegroundColor Green
Write-Host "  Endpoints:" -ForegroundColor Gray
Write-Host "    GET /api/health         - Run all health checks" -ForegroundColor Gray
Write-Host "    GET /api/health/[cat]   - Run specific category" -ForegroundColor Gray
Write-Host "    GET /api/status         - Quick status check" -ForegroundColor Gray
Write-Host ""

$scriptsDir = $PSScriptRoot

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Set CORS headers
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
        $response.ContentType = "application/json"
        
        # Handle OPTIONS (CORS preflight)
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }
        
        $path = $request.Url.AbsolutePath
        Write-Host "$(Get-Date -Format 'HH:mm:ss') $($request.HttpMethod) $path" -ForegroundColor Cyan
        
        try {
            $responseData = $null
            
            # Route handling
            if ($path -eq "/api/health") {
                # Run all health checks
                $healthCheckScript = Join-Path $scriptsDir "run-health-checks.ps1"
                $result = & $healthCheckScript -OutputFormat json -Category all 2>&1 | Out-String
                $responseData = $result
                
            } elseif ($path -match "^/api/health/(\w+)$") {
                # Run specific category
                $category = $matches[1]
                $healthCheckScript = Join-Path $scriptsDir "run-health-checks.ps1"
                $result = & $healthCheckScript -OutputFormat json -Category $category 2>&1 | Out-String
                $responseData = $result
                
            } elseif ($path -eq "/api/status") {
                # Quick status
                $responseData = @{
                    status = "OK"
                    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
                    server = "KDS Dashboard API"
                    version = "1.0"
                } | ConvertTo-Json
                
            } else {
                # 404
                $response.StatusCode = 404
                $responseData = @{
                    error = "Not Found"
                    path = $path
                } | ConvertTo-Json
            }
            
            # Send response
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseData)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            
        } catch {
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
            $response.StatusCode = 500
            $errorData = @{
                error = $_.Exception.Message
                path = $path
            } | ConvertTo-Json
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorData)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        
        $response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
    Write-Host ""
    Write-Host "Server stopped." -ForegroundColor Yellow
}
