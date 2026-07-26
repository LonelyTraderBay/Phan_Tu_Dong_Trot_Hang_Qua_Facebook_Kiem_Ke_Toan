#Requires -Version 5.1
param(
  [switch]$NoWeb,
  [switch]$NoApi,
  [switch]$NoAi,
  [switch]$NoInngest,
  [switch]$Stop,
  [switch]$SkipPortCheck
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root
. (Join-Path $PSScriptRoot "Get-OmniLocalPorts.ps1")
$Ports = Get-OmniLocalPorts -RepoRoot $Root
$HostName = [string]$Ports.host
$PortWeb = [int]$Ports.apps.web
$PortApi = [int]$Ports.apps.api
$PortAi = [int]$Ports.apps.ai
$PortInngest = [int]$Ports.apps.inngest
$UrlWeb = "http://${HostName}:${PortWeb}"
$UrlApi = "http://${HostName}:${PortApi}"
$UrlAi = "http://${HostName}:${PortAi}"
$UrlInngest = "http://${HostName}:${PortInngest}"
$UrlInngestServe = "${UrlApi}/api/inngest"

$PidFile = Join-Path $Root ".local-secrets\dev-pids.json"
New-Item -ItemType Directory -Force -Path (Join-Path $Root ".local-secrets") | Out-Null

function Stop-ByPort([int]$Port, [string]$Label) {
  $hits = @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
  foreach ($h in $hits) {
    $procId = $h.OwningProcess
    if (-not $procId) { continue }
    try {
      & taskkill /PID $procId /T /F 2>$null | Out-Null
      Write-Host ("Stopped {0} on :{1} (pid {2})" -f $Label, $Port, $procId)
    } catch {
      Write-Host ("Skip stop {0} :{1}: {2}" -f $Label, $Port, $_.Exception.Message)
    }
  }
}

function Stop-LocalStack {
  if (Test-Path $PidFile) {
    $saved = Get-Content $PidFile -Raw | ConvertFrom-Json
    foreach ($name in @("api", "web", "ai", "inngest")) {
      $id = $saved.$name
      if ($id) {
        try {
          & taskkill /PID $id /T /F 2>$null | Out-Null
          Write-Host ("Stopped {0} (pid {1})" -f $name, $id)
        } catch {
          try {
            Stop-Process -Id $id -Force -ErrorAction Stop
            Write-Host ("Stopped {0} (pid {1})" -f $name, $id)
          } catch {
            Write-Host ("Skip {0}: {1}" -f $name, $_.Exception.Message)
          }
        }
      }
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
  } else {
    Write-Host "No PID file — cleaning by locked Omni ports..."
  }
  # Always clear locked app ports (orphans / duplicate Inngest)
  Stop-ByPort -Port $PortWeb -Label "web"
  Stop-ByPort -Port $PortApi -Label "api"
  Stop-ByPort -Port $PortAi -Label "ai"
  Stop-ByPort -Port $PortInngest -Label "inngest"
}

if ($Stop) {
  Stop-LocalStack
  exit 0
}

Write-Host ("Omni locked ports → web:{0} api:{1} ai:{2} inngest:{3} (see config/local-ports.json)" -f `
  $PortWeb, $PortApi, $PortAi, $PortInngest)

if (-not $SkipPortCheck) {
  Assert-OmniAppPortsFree -Ports $Ports
}

$EnvFile = Join-Path $Root ".env"
if (-not (Test-Path $EnvFile)) {
  $parentEnv = Join-Path $Root "..\..\.env"
  if (Test-Path $parentEnv) {
    $EnvFile = (Resolve-Path $parentEnv).Path
    Write-Host ("Using parent .env: {0}" -f $EnvFile)
  } else {
    throw "Missing .env. Create from .env.example, then: pnpm run ports:sync"
  }
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

$npxCmd = Join-Path $env:APPDATA "npm\npx.cmd"
if (-not (Test-Path $npxCmd)) {
  $npxCmd = (Get-Command npx.cmd -ErrorAction SilentlyContinue).Source
}
if (-not $npxCmd -and -not $NoInngest) { throw "npx.cmd not found (needed for Inngest CLI)" }

if (-not $env:APP_ENV -or $env:APP_ENV.Trim() -eq "") {
  $env:APP_ENV = "local"
}
if (-not $env:EMBEDDINGS_ALLOW_STUB -or $env:EMBEDDINGS_ALLOW_STUB.Trim() -eq "") {
  $env:EMBEDDINGS_ALLOW_STUB = "1"
}

# Force process env to locked ports (overrides stale .env for child processes)
$env:PORT = "$PortApi"
$env:AI_BASE_URL = $UrlAi
$env:CORE_BASE_URL = $UrlApi
$env:NEXT_PUBLIC_API_BASE_URL = $UrlApi
$env:NEXT_PUBLIC_SUPABASE_URL = $Ports.urls.supabase

if (-not $NoApi) {
  $p = Start-Process -FilePath $pnpmCmd -ArgumentList @("--dir", "apps/api", "dev") `
    -WorkingDirectory $Root -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir "api.out.log") `
    -RedirectStandardError (Join-Path $logDir "api.err.log")
  $pids.api = $p.Id
  Write-Host ("API  pid {0}  -> {1}/health" -f $p.Id, $UrlApi)
}

if (-not $NoAi) {
  $p = Start-Process -FilePath $uvExe -ArgumentList @(
      "run", "uvicorn", "app.main:app", "--reload",
      "--host", $HostName, "--port", "$PortAi"
    ) `
    -WorkingDirectory (Join-Path $Root "apps\ai") -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir "ai.out.log") `
    -RedirectStandardError (Join-Path $logDir "ai.err.log")
  $pids.ai = $p.Id
  Write-Host ("AI   pid {0}  -> {1}/health (APP_ENV={2}, stub={3})" -f $p.Id, $UrlAi, $env:APP_ENV, $env:EMBEDDINGS_ALLOW_STUB)
}

if (-not $NoWeb) {
  $p = Start-Process -FilePath $pnpmCmd -ArgumentList @(
      "--dir", "apps/web", "exec", "next", "dev",
      "-H", $HostName, "-p", "$PortWeb"
    ) `
    -WorkingDirectory $Root -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir "web.out.log") `
    -RedirectStandardError (Join-Path $logDir "web.err.log")
  $pids.web = $p.Id
  Write-Host ("Web  pid {0}  -> {1}" -f $p.Id, $UrlWeb)
}

if (-not $NoInngest) {
  $inngestArgs = @(
    "--yes",
    "inngest-cli@latest",
    "dev",
    "-u", $UrlInngestServe,
    "-p", "$PortInngest"
  )
  $p = Start-Process -FilePath $npxCmd -ArgumentList $inngestArgs `
    -WorkingDirectory $Root -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir "inngest.out.log") `
    -RedirectStandardError (Join-Path $logDir "inngest.err.log")
  $pids.inngest = $p.Id
  Write-Host ("Inngest pid {0}  -> {1} (serve {2})" -f $p.Id, $UrlInngest, $UrlInngestServe)
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

Write-Host ("API : {0}" -f (Probe "${UrlApi}/health"))
Write-Host ("AI  : {0}" -f (Probe "${UrlAi}/health"))
Write-Host ("Web : {0}" -f (Probe "${UrlWeb}/"))
if (-not $NoInngest) {
  Write-Host ("Inngest UI : {0}" -f (Probe $UrlInngest))
}
Write-Host ""
Write-Host "Port lock: config\local-ports.json | Sync env: pnpm run ports:sync"
Write-Host "Logs: .local-secrets\logs\"
Write-Host "Stop:  pnpm run dev:local:stop"
Write-Host ("Chunks smoke: create product -> docker exec supabase_db_omni-commerce psql -U postgres -d postgres -t -c `"select count(*) from knowledge_chunks;`"")
