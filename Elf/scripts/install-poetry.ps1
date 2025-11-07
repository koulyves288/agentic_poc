# Install pipx + poetry (recommended). Run from an elevated or normal PowerShell.

# Check for python
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) {
    Write-Error "Python not found in PATH. Install Python 3.12+ and retry."
    exit 1
}

# Ensure pip is available
& python -m pip --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "pip not available. Ensure pip is installed for this Python."
    exit 1
}

# Install pipx (user) if missing
$pipx = Get-Command pipx -ErrorAction SilentlyContinue
if (-not $pipx) {
    Write-Host "Installing pipx (user)..."
    & python -m pip install --user pipx
    if ($LASTEXITCODE -ne 0) {
        Write-Error "pipx install failed."
        exit 1
    }
    & python -m pipx ensurepath
    Write-Host "pipx installed. You may need to restart the terminal for PATH changes to apply."
} else {
    Write-Host "pipx already installed."
}

# Try to use pipx to install poetry
try {
    Write-Host "Installing/upgrading Poetry via pipx..."
    & pipx install poetry --force 2>$null
    if ($LASTEXITCODE -ne 0) {
        # try upgrade path if already present
        & pipx upgrade poetry 2>$null
    }
} catch {
    Write-Warning "pipx install/upgrade failed; trying pip --user install as fallback..."
    & python -m pip install --user poetry
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install poetry via pipx and pip."
        exit 1
    }
}

# Verify poetry is available
$poetry = Get-Command poetry -ErrorAction SilentlyContinue
if (-not $poetry) {
    Write-Warning "poetry executable not yet found in current PATH. Close and reopen your terminal, then run 'poetry --version'."
    Write-Host "Common user Scripts paths to add to PATH if missing:"
    Write-Host "  $env:USERPROFILE\AppData\Roaming\Python\Python$(python -c 'import sys; print(\"\".join(map(str,sys.version_info[:2])))')\Scripts"
    Write-Host "  $env:USERPROFILE\.local\bin (WSL)"
    exit 0
}

# Show poetry version
& poetry --version
Write-Host "Poetry installed. To set your project to a specific python (e.g. 3.12):"
Write-Host "  poetry env use C:\full\path\to\python3.12.exe"
Write-Host "Or run the helper to pick current python: poetry env use (Get-Command python).Source"
