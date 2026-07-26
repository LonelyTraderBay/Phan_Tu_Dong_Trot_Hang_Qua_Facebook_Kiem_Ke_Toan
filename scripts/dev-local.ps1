#Requires -Version 5.1
param(
  [switch]$NoWeb,
  [switch]$NoApi,
  [switch]$NoAi,
  [switch]$NoInngest,
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
  foreach ($name in @("api", "web", "ai", "inngest")) {
    $id = $saved.$name
    if ($id) {
      try {
        # Kill process tree (npx/node children for Inngest)
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
}

if ($Stop) {
  Stop-LocalStack
  exit 0
}

$EnvFile = Join-Path $Root ".env"
if (-not (Test-Path $EnvFile)) {
  # Linked worktrees often omit ignored .env — fall back to canonical repo root
  # (.worktrees/<name> → ../.. = repo root).
  $parentEnv = Join-Path $Root "..\..\.env"
  if (Test-Path $parentEnv) {
    $EnvFile = (Resolve-Path $parentEnv).Path
    Write-Host ("Using parent .env: {0}" -f $EnvFile)
  } else {
    throw "Missing .env. Create it from .env.example or .local-secrets first."
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

# Local stub embeddings when GEMINI empty: APP_ENV=local (AI default) or EMBEDDINGS_ALLOW_STUB=1.
# Ensure process env so uvicorn sees stub path without requiring apps/ai/.env edits.
if (-not $env:APP_ENV -or $env:APP_ENV.Trim() -eq "") {
  $env:APP_ENV = "local"
}
if (-not $env:EMBEDDINGS_ALLOW_STUB -or $env:EMBEDDINGS_ALLOW_STUB.Trim() -eq "") {
  $env:EMBEDDINGS_ALLOW_STUB = "1"
}

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
  Write-Host ("AI   pid {0}  -> http://127.0.0.1:8000/health (APP_ENV={1}, stub={2})" -f $p.Id, $env:APP_ENV, $env:EMBEDDINGS_ALLOW_STUB)
}

if (-not $NoWeb) {
  $p = Start-Process -FilePath $pnpmCmd -ArgumentList @("--dir", "apps/web", "dev") `
    -WorkingDirectory $Root -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir "web.out.log") `
    -RedirectStandardError (Join-Path $logDir "web.err.log")
  $pids.web = $p.Id
  Write-Host ("Web  pid {0}  -> http://127.0.0.1:3000" -f $p.Id)
}

# Inngest Dev Server — polls API serve endpoint for knowledge.reindex / outbox jobs.
# Prefer starting after API so sync can succeed promptly; CLI retries if API still booting.
if (-not $NoInngest) {
  $inngestArgs = @(
    "--yes",
    "inngest-cli@latest",
    "dev",
    "-u",
    "http://127.0.0.1:3001/api/inngest"
  )
  $p = Start-Process -FilePath $npxCmd -ArgumentList $inngestArgs `
    -WorkingDirectory $Root -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir "inngest.out.log") `
    -RedirectStandardError (Join-Path $logDir "inngest.err.log")
  $pids.inngest = $p.Id
  Write-Host ("Inngest pid {0}  -> http://127.0.0.1:8288 (app http://127.0.0.1:3001/api/inngest)" -f $p.Id)
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
if (-not $NoInngest) {
  Write-Host ("Inngest UI : {0}" -f (Probe "http://127.0.0.1:8288"))
}
Write-Host ""
Write-Host "Logs: .local-secrets\logs\"
Write-Host "Stop:  pnpm run dev:local:stop"
Write-Host "Chunks smoke: create product -> wait -> docker exec supabase_db_omni-commerce psql -U postgres -d postgres -t -c `"select count(*) from knowledge_chunks;`""
