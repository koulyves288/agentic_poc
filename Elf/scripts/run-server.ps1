# Usage: from project root in PowerShell: .\Benefits\scripts\run-server.ps1

# show current python
Write-Host "Python in PATH:" (Get-Command python -ErrorAction SilentlyContinue).Source
python -V 2>$null

# If poetry is available, prefer poetry run
if (Get-Command poetry -ErrorAction SilentlyContinue) {
    Write-Host "Found poetry -- running: poetry run python server.py"
    & poetry run python server.py
    exit $LASTEXITCODE
}

# Fallback: if a .venv exists, activate and run
if (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "Activating .venv and running server..."
    . .\.venv\Scripts\Activate.ps1
    python -c "import sys; print('Using', sys.executable)"
    python -c "import dapr; print('dapr ok', getattr(dapr,'__version__', 'unknown'))" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Package 'dapr' not found in this venv. Install with: pip install dapr"
    }
    python server.py
    exit $LASTEXITCODE
}

# No poetry or venv found: print instructions
Write-Warning "No poetry in PATH and no .venv detected."
Write-Host "If you use Poetry, run from project root:"
Write-Host "  poetry install"
Write-Host "  poetry run python server.py"
Write-Host "Or create a venv and install deps:"
Write-Host "  py -3.12 -m venv .venv"
Write-Host "  .\\.venv\\Scripts\\Activate.ps1"
Write-Host "  pip install -r requirements.txt  # or pip install dapr python-dotenv dapr-ext-fastapi uvicorn"
Write-Host "  python server.py"
