param(
    [string]$Path = "d:\PROJECTS\NOOR CANVAS\Workspaces\Documentation\IMPLEMENTATIONS\IMPLEMENTATION-TRACKER.html"
)

$content = Get-Content -Raw -Path $Path -Encoding UTF8
$lt = ($content.ToCharArray() | Where-Object { $_ -eq '<' }).Count
$gt = ($content.ToCharArray() | Where-Object { $_ -eq '>' }).Count
Write-Host "Counts: '<'=$lt, '>'=$gt\n"

$lines = Get-Content -Path $Path -Encoding UTF8
for($i=0; $i -lt $lines.Length; $i++){
    $line = $lines[$i]
    $l = ($line.ToCharArray() | Where-Object { $_ -eq '<' }).Count
    $g = ($line.ToCharArray() | Where-Object { $_ -eq '>' }).Count
    if($g -gt $l){
        Write-Host "Line $([int]($i+1)): <=$l >=$g : $line"
    }
}
