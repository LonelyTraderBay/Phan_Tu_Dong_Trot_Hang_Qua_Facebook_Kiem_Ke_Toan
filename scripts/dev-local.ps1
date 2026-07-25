#Requires -Version 5.1
param(
  [switch]$NoWeb,
  [switch]$NoApi,
  [switch]$NoAi,
  [switch]$Stop
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root
$PidFile = Join-Path $Root ".local-secrets\dev-pids.json"
New-Item -ItemType Directory -Force -Path (Join-Path $Root ".local-secrets") | Out-Null

function Stop-LocalStack {
  if (-not (Test-Path $PidFile)) {
    Write-Host "No PID file."
    return
  }
  $saved = Get-Content $PidFile -Raw | ConvertFrom-Json
  foreach ($name in @("api", "web", "ai")) {
    $id = $saved.$name
    if ($id) {
      try {
        Stop-Process -Id $id -Force -ErrorAction Stop
        Write-Host ("Stopped {0} (pid {1})" -f $name, $id)
      } catch {
        Write-Host ("Skip {0}: {1}" -f $name, $_.Exception.Message)
      }
    }
  }
  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

if ($Stop) {
  Stop-LocalStack
  exit 0
}

if (-not (Test-Path (Join-Path $Root ".env"))) {
  throw "Missing .env. Create it from .env.example or .local-secrets first."
}

$uvCandidates = @(
  "$env:APPDATA\Python\Python312\Scripts",
  "$env:LOCALAPPDATA\Programs\Python\Python312\Scripts"
)
foreach ($c in $uvCandidates) {
  if (Test-Path $c) {
    $env:Path = "$c;$env:Path"
  }
}

Write-Host "Installing/syncing deps if needed..."
try { corepack enable | Out-Null } catch {}
pnpm install --prod=false | Out-Null
pnpm --filter @omni/authz-types build | Out-Null
Push-Location (Join-Path $Root "apps\ai")
uv sync
Pop-Location

$logDir = Join-Path $Root ".local-secrets\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$pids = @{}

$pnpmCmd = Join-Path $env:APPDATA "npm\pnpm.cmd"
if (-not (Test-Path $pnpmCmd)) {
  $pnpmCmd = (Get-Command pnpm.cmd -ErrorAction SilentlyContinue).Source
}
if (-not $pnpmCmd) { throw "pnpm.cmd not found" }

$uvExe = Join-Path $env:APPDATA "Python\Python312\Scripts\uv.exe"
if (-not (Test-Path $uvExe)) {
  $uvExe = (Get-Command uv.exe -ErrorAction SilentlyContinue).Source
}
if (-not $uvExe) { throw "uv.exe not found" }

if (-not $NoApi) {
  $p = Start-Process -FilePath $pnpmCmd -ArgumentList @("--dir", "apps/api", "dev") `
    -WorkingDirectory $Root -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir "api.out.log") `
    -RedirectStandardError (Join-Path $logDir "api.err.log")
  $pids.api = $p.Id
  Write-Host ("API  pid {0}  -> http://127.0.0.1:3001/health" -f $p.Id)
}

if (-not $NoAi) {
  $p = Start-Process -FilePath $uvExe -ArgumentList @("run", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000") `
    -WorkingDirectory (Join-Path $Root "apps\ai") -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir "ai.out.log") `
    -RedirectStandardError (Join-Path $logDir "ai.err.log")
  $pids.ai = $p.Id
  Write-Host ("AI   pid {0}  -> http://127.0.0.1:8000/health" -f $p.Id)
}

if (-not $NoWeb) {
  $p = Start-Process -FilePath $pnpmCmd -ArgumentList @("--dir", "apps/web", "dev") `
    -WorkingDirectory $Root -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir "web.out.log") `
    -RedirectStandardError (Join-Path $logDir "web.err.log")
  $pids.web = $p.Id
  Write-Host ("Web  pid {0}  -> http://127.0.0.1:3000" -f $p.Id)
}

$pids | ConvertTo-Json | Set-Content $PidFile -Encoding utf8
Write-Host ""
Write-Host "Waiting for health..."
Start-Sleep -Seconds 25

function Probe([string]$url) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 8
    $snip = $r.Content
    if ($snip.Length -gt 80) { $snip = $snip.Substring(0, 80) }
    return ("{0} {1}" -f $r.StatusCode, $snip)
  } catch {
    return ("FAIL {0}" -f $_.Exception.Message)
  }
}

Write-Host ("API : {0}" -f (Probe "http://127.0.0.1:3001/health"))
Write-Host ("AI  : {0}" -f (Probe "http://127.0.0.1:8000/health"))
Write-Host ("Web : {0}" -f (Probe "http://127.0.0.1:3000/"))
Write-Host ""
Write-Host "Logs: .local-secrets\logs\"
Write-Host "Stop:  pnpm run dev:local:stop"
