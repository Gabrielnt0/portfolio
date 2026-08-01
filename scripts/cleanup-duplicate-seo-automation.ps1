$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot

$Files = @(
  ".github\workflows\update-static-seo.yml",
  "scripts\update-static-seo.mjs"
)

foreach ($RelativePath in $Files) {
  $Path = Join-Path $ProjectRoot $RelativePath

  if (Test-Path $Path) {
    Remove-Item -Force $Path
    Write-Host "Removido: $RelativePath" -ForegroundColor Green
  }
  else {
    Write-Host "Já não existe: $RelativePath" -ForegroundColor Yellow
  }
}
