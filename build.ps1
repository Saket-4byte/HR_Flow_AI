# HR Flow AI - Windows PowerShell Build Script Wrapper
# Executes cross-platform Node.js build runner

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🚀 HR Flow AI - Windows PowerShell Build Launcher" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Execute node scripts/build.js
& node "$ScriptDir\scripts\build.js"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
