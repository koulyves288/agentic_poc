param(
    [string]$Version = "3.12"
)

# Try to run poetry --version to ensure poetry is available
try {
    & poetry --version > $null 2>&1
} catch {
    Write-Error "poetry not found in PATH. Install poetry or ensure its Scripts folder is in PATH."
    exit 2
}

# Attempt 1: use the py launcher to get the exact executable for the requested version
$pythonPath = $null
try {
    $pyCmd = "py -$Version -c `"import sys; print(sys.executable)`""
    $pyOutput = (Invoke-Expression $pyCmd) 2>$null
    if ($pyOutput) {
        $pythonPath = $pyOutput.Trim()
    }
} catch { }

# Attempt 2: fallback - check all python executables from 'where python' and pick the one matching version prefix
if (-not $pythonPath) {
    try {
        $whereList = & where.exe python 2>$null
        foreach ($p in $whereList) {
            try {
                $ver = & "$p" -c "import sys; print('.'.join(map(str, sys.version_info[:3])))" 2>$null
                if ($ver -and $ver.Trim().StartsWith($Version)) {
                    $pythonPath = $p.Trim()
                    break
                }
            } catch { }
        }
    } catch { }
}

# Attempt 3: use 'python' in PATH (if it matches)
if (-not $pythonPath) {
    try {
        $ver = & python -c "import sys; print('.'.join(map(str, sys.version_info[:3])))" 2>$null
        if ($ver -and $ver.Trim().StartsWith($Version)) {
            $pythonPath = (Get-Command python).Source
        }
    } catch { }
}

if (-not $pythonPath) {
    Write-Error "Could not find Python $Version on this machine. Install Python $Version and retry, or pass -Version with an installed version."
    exit 3
}

Write-Host "Using Python executable: $pythonPath"

# Run poetry env use
try {
    & poetry env use $pythonPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "poetry environment set to Python at: $pythonPath"
        Write-Host "Run: poetry install"
    } else {
        Write-Error "poetry env use failed. Exit code: $LASTEXITCODE"
        exit $LASTEXITCODE
    }
} catch {
    Write-Error "Error running 'poetry env use'. $_"
    exit 4
}
