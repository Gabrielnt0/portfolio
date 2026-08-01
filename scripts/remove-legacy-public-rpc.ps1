$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LegacySql = Join-Path $ProjectRoot "supabase\20260731_06_public_portfolio_content_rpc.sql"

if (Test-Path $LegacySql) {
  Remove-Item -Force $LegacySql
  Write-Host "SQL público duplicado removido:" -ForegroundColor Green
  Write-Host $LegacySql
}
else {
  Write-Host "O SQL duplicado já não existe." -ForegroundColor Yellow
}
