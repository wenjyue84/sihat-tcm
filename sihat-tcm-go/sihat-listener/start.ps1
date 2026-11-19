# Start sihat-listener detached (idempotent). Logs: sihat-listener\logs\listener.out.log
# Usage: powershell -File sihat-listener\start.ps1 [-Port 8788]
param([int]$Port = 8788)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$logs = Join-Path $here "logs"; New-Item -ItemType Directory -Force $logs | Out-Null
try {
  $h = Invoke-RestMethod "http://127.0.0.1:$Port/healthz" -TimeoutSec 2
  if ($h.service -eq "sihat-listener") { Write-Output "already running on :$Port (served=$($h.served))"; exit 0 }
} catch { }
$env:SIHAT_LISTENER_PORT = "$Port"
$p = Start-Process -FilePath "node" -ArgumentList @((Join-Path $here "listener.mjs")) `
  -RedirectStandardOutput (Join-Path $logs "listener.out.log") -RedirectStandardError (Join-Path $logs "listener.err.log") `
  -WindowStyle Hidden -PassThru
Set-Content -Path (Join-Path $logs "listener.pid") -Value $p.Id
Start-Sleep -Seconds 2
$h = Invoke-RestMethod "http://127.0.0.1:$Port/healthz" -TimeoutSec 5
Write-Output "started pid $($p.Id) on :$Port ok=$($h.ok)"
# stop later with:  Stop-Process -Id (Get-Content sihat-listener\logs\listener.pid)
