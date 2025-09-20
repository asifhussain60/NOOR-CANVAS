Write-Output "🔍 Searching for COPILOT-DEBUG logs..."
Get-ChildItem -Recurse -Include *.cs,*.razor,*.ts,*.js |
    Select-String "COPILOT-DEBUG:"

Write-Output "🧹 Removing COPILOT-DEBUG logs..."
Get-ChildItem -Recurse -Include *.cs,*.razor,*.ts,*.js | ForEach-Object {
    (Get-Content $_.FullName) |
        Where-Object {$_ -notmatch "COPILOT-DEBUG:"} |
        Set-Content $_.FullName
}

Write-Output "✅ Cleanup complete."
