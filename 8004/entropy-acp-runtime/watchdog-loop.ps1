$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$interval = if ($env:WATCHDOG_INTERVAL_SECONDS) { [int]$env:WATCHDOG_INTERVAL_SECONDS } else { 300 }

while ($true) {
    & (Join-Path $root 'watchdog.ps1')
    Start-Sleep -Seconds $interval
}
