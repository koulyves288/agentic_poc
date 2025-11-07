@echo off
REM Change to the script directory
cd /d "%~dp0"

REM Create venv if it doesn't exist
if not exist ".venv\Scripts\activate.bat" (
    python -m venv ".venv"
)

REM Activate venv
call ".venv\Scripts\activate.bat"

REM Install dependencies
pip install -r "requirements.txt"

REM Run Chainlit
chainlit run "app.py" --port 8034
