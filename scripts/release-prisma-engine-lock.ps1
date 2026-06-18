param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectMarker,

    [int]$SelfPid = $PID
)

$escapedMarker = [regex]::Escape($ProjectMarker)

$pids = @(
    Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
        ForEach-Object {
            if ($_.ProcessId -eq $SelfPid) { return }
            if ($null -eq $_.CommandLine) { return }
            if ($_.CommandLine -match $escapedMarker) { $_.ProcessId }
        }
)

if ($pids.Count -eq 0) {
    exit 0
}

Write-Host "Stopping $($pids.Count) project Node process(es) to release the Prisma engine lock..."

foreach ($processId in $pids) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 3
exit 0
