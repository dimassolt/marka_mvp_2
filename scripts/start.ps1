# Start the Engine and the Extension together on Windows, like `make start` (make isn't on Windows).
# Run in PowerShell from the repo folder, after scripts\install.ps1:
#   powershell -ExecutionPolicy Bypass -File scripts\start.ps1
# Ctrl+C stops both. If one of them stops on its own, the other is stopped too.
$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot ".."

$engine = Start-Process -FilePath "uv" -ArgumentList "run", "ghost-engine" `
    -WorkingDirectory (Join-Path $root "engine") -NoNewWindow -PassThru
# npm is a .cmd file on Windows, so it runs through cmd.
$extension = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm", "run", "dev" `
    -WorkingDirectory (Join-Path $root "extension") -NoNewWindow -PassThru

Write-Host "Engine and Extension starting. Press Ctrl+C to stop both."
try {
    while (-not $engine.HasExited -and -not $extension.HasExited) { Start-Sleep -Milliseconds 500 }
    if ($engine.HasExited) { Write-Host "The Engine stopped. Stopping the Extension." }
    else { Write-Host "The Extension stopped. Stopping the Engine." }
} finally {
    # /T stops the whole tree: uv starts Python, and npm starts node.
    foreach ($process in @($engine, $extension)) {
        if (-not $process.HasExited) { taskkill /PID $process.Id /T /F | Out-Null }
    }
}
