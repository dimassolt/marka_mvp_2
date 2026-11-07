# First-time setup on Windows: Engine dependencies, the GLiNER model, the Extension.
# Run in PowerShell from the repo folder:
#   powershell -ExecutionPolicy Bypass -File scripts\install.ps1
# Safe to run again; it skips what is done.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

function Step($text) { Write-Host "`n==> $text" }
function Fail($text) { Write-Host "`nError: $text" -ForegroundColor Red; exit 1 }
function Run($dir, $cmd, [string[]]$cmdArgs) {
    Push-Location $dir
    try {
        & $cmd @cmdArgs
        if ($LASTEXITCODE -ne 0) { Fail "'$cmd $cmdArgs' failed in $dir." }
    } finally { Pop-Location }
}

Step "Checking tools"
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host "uv not found. Installing it with the official installer (https://docs.astral.sh/uv/)."
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    $env:Path = "$env:USERPROFILE\.local\bin;$env:Path"
    if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
        Fail "uv was installed but is not on PATH. Open a new PowerShell window and run this script again."
    }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Fail "Node.js not found. Install Node 22 or newer from https://nodejs.org and run this script again."
}
$nodeMajor = [int](node -p "process.versions.node.split('.')[0]")
if ($nodeMajor -lt 22) { Fail "Node $nodeMajor found, but the Extension needs Node 22 or newer." }

# fast_gliner (the GLiNER runtime) has no Windows wheel, so uv builds it from source with Rust.
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Fail ("Rust not found. fast_gliner is built from source on Windows. " +
          "Install Rust from https://rustup.rs (choose the default MSVC setup, which also " +
          "installs the Visual Studio C++ Build Tools), open a new PowerShell window and run this script again.")
}
Write-Host "uv, Node $(node --version) and Rust found"

Step "Engine: Python dependencies (the first run builds fast_gliner, which takes a few minutes)"
Run "engine" "uv" @("sync")

Step "Engine: GLiNER model (about 600 MB, downloaded once)"
Run "engine" "uv" @("run", "python", "scripts/fetch_gliner.py")

Step "Extension: npm packages"
Run "extension" "npm" @("install")

Step "Checking the Engine"
Run "engine" "uv" @("run", "pytest", "-q")

Write-Host @"

Done. Start the Engine and the Extension in two PowerShell windows:

  cd engine;    uv run ghost-engine
  cd extension; npm run dev
"@
