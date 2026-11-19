#Requires -Version 7
<#
.SYNOPSIS
  Idle-time sweep of the Sihat TCM (sihat-tcm-go) ACI suites: runs the stalest / changed local suites while the PC is not busy.
  Ported from salon-system tools/aci-sweep.ps1 (Jay 2026-11-01).

.DESCRIPTION
  Runs `node aci.mjs test --sweep` batches (due suites first, then the stalest; scripts/aci-ledger.mjs), each batch recorded in .aci/ledger.json.
  It never competes with real work:
    - ONE sweep machine-wide: it takes the named mutex Global\JayAciSweep (shared by every app's sweep) or does not start,
    - starts only when CPU (median of 6 x 3 s samples) < CpuBelow, free RAM >= MinFreeGB and no other ACI run holds .aci/locks/,
    - checks again before every batch and stops at the first sign of load (a batch lasts about BatchMin minutes),
    - runs at BelowNormal priority with ACI_LOCK_BY=sweep: any other test run (gates, a fix loop) stops its tree; an interrupted batch records nothing.
  Only the hermetic stack is swept (fake Supabase + fake AI + a freshly built Go binary on the ACI ports). Never production, never --db=real,
  never --ai=pc: aci.mjs refuses those flags under --sweep.
  A suite the sweep finds RED goes to .aci/sweep-red.json and Jay gets one phone ping
  (only when it newly turns red; a suite still red from an earlier sweep is logged, not pinged again).
  Log lines are written as UTF-8 without BOM, so Chinese / emoji in a failure detail do not turn into mojibake.

.PARAMETER Install  Register the scheduled task "Sihat-ACI-Sweep" (every 30 min while the user is logged on; no admin).
.PARAMETER Remove   Remove that task.
.PARAMETER WhatIf   Check the idle conditions and the mutex, print what would run; run nothing.
#>
param([int]$BudgetMin = 20, [int]$BatchMin = 4, [double]$MinFreeGB = 4, [int]$CpuBelow = 60, [int]$MinAgeH = 12, [switch]$Install, [switch]$Remove, [switch]$WhatIf)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repo
$task = 'Sihat-ACI-Sweep'
$mutexName = 'Global\JayAciSweep'
$utf8 = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $utf8; $OutputEncoding = $utf8   # read node's UTF-8 stdout as UTF-8
if ($Remove) { Unregister-ScheduledTask -TaskName $task -Confirm:$false -ErrorAction SilentlyContinue; Write-Host "removed $task"; exit 0 }
if ($Install) {
  $pw = (Get-Command pwsh.exe -ErrorAction Stop).Source
  $act = New-ScheduledTaskAction -Execute $pw -Argument "-NoProfile -WindowStyle Hidden -File `"$PSCommandPath`"" -WorkingDirectory $repo
  $trg = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval (New-TimeSpan -Minutes 30)
  $set = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes ($BudgetMin + 10)) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  Register-ScheduledTask -TaskName $task -Action $act -Trigger $trg -Settings $set -Description 'Sihat TCM ACI idle sweep: runs the stalest regression suites while the PC is idle (tools/aci-sweep.ps1)' -Force | Out-Null
  Write-Host "registered ${task}: every 30 min, only runs when the PC is idle (CPU < ${CpuBelow} %, >= ${MinFreeGB} GB free) and no other app's sweep holds $mutexName"; exit 0
}
try { (Get-Process -Id $PID).PriorityClass = 'BelowNormal' } catch { }   # the sweep (and every node/go it starts) yields to real work
New-Item -ItemType Directory -Force -Path (Join-Path $repo '.aci') | Out-Null
$logP = Join-Path $repo '.aci/sweep.log'
function Note([string]$m) { $l = "$(Get-Date -Format 's') $m"; Write-Host $l; try { [System.IO.File]::AppendAllText($logP, $l + "`n", $utf8) } catch { } }
function FreeGB { [math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB, 1) }
function CpuMedian { $s = @((Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 3 -MaxSamples 6).CounterSamples | ForEach-Object CookedValue | Sort-Object); [math]::Round(($s[2] + $s[3]) / 2, 0) }  # a 3 s spike does not make the PC "busy"; sustained load does
function OtherRun {
  $dir = Join-Path $repo '.aci/locks'
  if (-not (Test-Path -LiteralPath $dir)) { return $null }
  foreach ($f in Get-ChildItem -LiteralPath $dir -Filter '*.json') {
    try { $lk = Get-Content -LiteralPath $f.FullName -Raw | ConvertFrom-Json } catch { continue }
    if ($lk -and (Get-Process -Id ([int]$lk.pid) -ErrorAction SilentlyContinue)) { return $lk }
  }
  return $null
}
function Idle {
  $g = OtherRun; if ($g) { return "an ACI run is going (pid $($g.pid), by $($g.by))" }
  $f = FreeGB; if ($f -lt $MinFreeGB) { return "only $f GB RAM free (< $MinFreeGB GB)" }
  $c = CpuMedian; if ($c -ge $CpuBelow) { return "CPU busy (median $c % >= $CpuBelow %)" }
  return ''
}

# one sweep at a time across ALL apps: the mutex is held for the whole run and released in finally (or by Windows if this process dies)
$mutex = [System.Threading.Mutex]::new($false, $mutexName)
$have = $false
try { $have = $mutex.WaitOne(0) } catch [System.Threading.AbandonedMutexException] { $have = $true }  # the previous holder died without releasing: it is ours now
if (-not $have) { Note "SKIP another app's ACI sweep holds $mutexName"; $mutex.Dispose(); exit 0 }

$red = @()
$redBefore = @(try { (Get-Content -LiteralPath (Join-Path $repo '.aci/sweep-red.json') -Raw | ConvertFrom-Json).suites } catch { })  # already pinged about these
try {
  $node = (Get-Command node -ErrorAction Stop).Source
  $t0 = Get-Date; $batches = 0
  while (((Get-Date) - $t0).TotalMinutes -lt $BudgetMin) {
    $why = Idle
    if ($why) { Note "STOP $why$(if ($batches) { " after $batches batch(es)" })"; break }
    if ($WhatIf) {
      $plan = & $node aci.mjs test --sweep --dry --budget-min=$BatchMin --min-age-h=$MinAgeH | ConvertFrom-Json
      Note "WOULD RUN (holding $mutexName, CPU/RAM idle): node aci.mjs test --sweep --budget-min=$BatchMin --min-age-h=$MinAgeH --brief --retry-failed=1 -> [$($plan.selected -join ',')] ~$($plan.est_s)s, $($plan.due) due"
      break
    }
    $env:ACI_LOCK_BY = 'sweep'; $env:ACI_WATCH_PID = "$PID"
    $tb = Get-Date
    $errF = [IO.Path]::GetTempFileName()   # stderr kept (not dropped) so a real crash is not mislabelled as a pre-emption
    $out = @(& $node aci.mjs test --sweep --budget-min=$BatchMin --min-age-h=$MinAgeH --brief --retry-failed=1 2>$errF | ForEach-Object { "$_" })   # --brief: progress is silenced, stdout = summary line + RED lines
    $code = $LASTEXITCODE; $first = "$($out | Select-Object -First 1)"
    $errTail = ""; try { $errTail = (@(Get-Content -LiteralPath $errF -Encoding UTF8 -ErrorAction SilentlyContinue | Where-Object { "$_".Trim() }) | Select-Object -Last 3) -join ' | ' } catch { }; Remove-Item -LiteralPath $errF -ErrorAction SilentlyContinue
    if (-not $first) {
      $secs = [int]((Get-Date) - $tb).TotalSeconds
      if ($code -eq 4) { Note "not started: lock held (exit 4) after ${secs}s: another run holds the ACI lock; nothing recorded" }
      elseif ($code -eq 5) { Note "ABORTED after ${secs}s (pre-empted by another run, exit 5): nothing recorded" }
      else { $tail = "$errTail"; if ($tail.Length -gt 300) { $tail = $tail.Substring(0, 300) }; Note "CRASHED exit ${code} after ${secs}s: $tail" }
      break
    }
    Note "BATCH exit=$code in $([int]((Get-Date) - $tb).TotalSeconds)s: $first"
    if ($first -match 'nothing due|not started') { break }
    $batches++
    if ($code -ne 0) { $red += ($out | Select-Object -Skip 1 -First 4); break }
  }
} finally {
  Remove-Item Env:ACI_LOCK_BY, Env:ACI_WATCH_PID -ErrorAction SilentlyContinue
  $mutex.ReleaseMutex(); $mutex.Dispose()
}
$newRed = @($red | Where-Object { $_ -match '^RED ([\w-]+):' -and $Matches[1] -notin $redBefore })
if ($red.Count) { Note "RED in the sweep: $($red -join ' | ')$(if (-not $newRed.Count) { ' (already red before: no ping)' })" }
if ($newRed.Count) {
  $red = $newRed
  $msg = 'Sihat TCM idle ACI sweep found a RED suite on the current tree: ' + (($red | Select-Object -First 2) -join ' | ')
  try { . 'C:\Users\Jyue\Scripts\Notify-Jay.ps1'; Send-JayPing -Business alert -Text $msg.Substring(0, [math]::Min(400, $msg.Length)) | Out-Null } catch { Note "ping failed: $_" }
}
