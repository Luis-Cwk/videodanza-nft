$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$log = Join-Path $root 'watchdog.log'
$node = 'C:\Program Files\nodejs\node.exe'

function Write-WatchdogLog {
    param([string]$Message)
    $line = "[{0}] {1}" -f (Get-Date).ToUniversalTime().ToString('o'), $Message
    Add-Content -Path $log -Value $line -Encoding utf8
}

$running = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -match 'worker\.mjs' -and $_.CommandLine -notmatch 'watchdog'
}

if ($running) {
    return
}

try {
    Write-WatchdogLog "Worker no encontrado, reiniciando."
    $process = Start-Process -FilePath $node `
        -ArgumentList 'worker.mjs' `
        -WorkingDirectory $root `
        -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $root 'worker.out.log') `
        -RedirectStandardError (Join-Path $root 'worker.err.log') `
        -PassThru
    Write-WatchdogLog "Worker reiniciado PID $($process.Id)"
} catch {
    Write-WatchdogLog "Error al reiniciar: $($_.Exception.Message)"
}
