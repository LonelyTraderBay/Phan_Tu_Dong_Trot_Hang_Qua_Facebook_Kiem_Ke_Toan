# Apply supabase/migrations to a linked staging project.
# Requires: SUPABASE_ACCESS_TOKEN, STAGING_PROJECT_REF
# Usage:  pwsh scripts/staging-migrate.ps1
# Optional: -DryRun

param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Error "Missing SUPABASE_ACCESS_TOKEN. Run: supabase login   OR set the env var."
}

$ref = $env:STAGING_PROJECT_REF
if (-not $ref) {
  Write-Error "Missing STAGING_PROJECT_REF (Supabase project ref for staging)."
}

Write-Host "Linking staging project $ref ..."
npx supabase link --project-ref $ref

if ($DryRun) {
  Write-Host "Dry-run db push ..."
  npx supabase db push --dry-run
  exit $LASTEXITCODE
}

Write-Host "Applying migrations (db push) ..."
npx supabase db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "OK — update docs/ops/p0-staging-migrate.md status log."
