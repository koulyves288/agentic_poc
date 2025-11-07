@echo off
REM Change directory to the folder where this script is located
cd /d "%~dp0"

REM Activate the virtual environment
call venv\Scripts\activate.bat

REM Start the FastAPI server
python -m uvicorn server:app --port 30214
