# Poetry: Set project Python version to 3.12

Use the helper script to set the project's poetry environment to Python 3.12.

1. Open PowerShell (run as normal user).
2. From the project root (where pyproject.toml lives), run:
   .\Benefits\scripts\set-poetry-python.ps1
   - To target another version (if needed):cd 
     .\Benefits\scripts\set-poetry-python.ps1 -Version 3.12

3. If the script reports "poetry not found", install poetry (recommended via pipx) or ensure poetry's Scripts folder is in your PATH:
   - python -m pip install --user pipx
   - python -m pipx ensurepath
   - pipx install poetry
   Then close and reopen the terminal.

4. If the script reports "Could not find Python 3.12", install Python 3.12 from python.org or use your package manager, then re-run the script.

Manual alternative:
- If you have the Python 3.12 executable path (e.g. C:\Path\to\python.exe), run:
  poetry env use "C:\Path\to\python.exe"
- Then run:
  poetry install

Quick steps to change the Python used by this project:

1. Install Python 3.12 (from python.org) if not already installed.

2. Find the full path to the Python 3.12 executable (Windows example):
   - Using the py launcher:
     py -3.12 -c "import sys; print(sys.executable)"
   - Or list python executables:
     where python

3. Tell Poetry to use that python (run from the project root where pyproject.toml is):
   - Example:
     poetry env use "C:\Users\<you>\AppData\Local\Programs\Python\Python312\python.exe"

4. Verify and install dependencies:
   - poetry env info
   - poetry install

Install Dapr SDK into the project (Poetry)
1. If dapr/dapr-ext-fastapi are NOT yet listed in pyproject.toml:
   ```powershell
   # from project root
   poetry add dapr dapr-ext-fastapi
   ```
2. If they are already listed (pyproject.toml contains them):
   ```powershell
   poetry install
   ```

Verify inside Poetry env:
```powershell
poetry run python -c "import dapr; print(dapr.__version__)"
```

Alternative: create and use a local venv manually
- Create venv with Python 3.12:
  py -3.12 -m venv .venv
- Activate:
  - PowerShell: .\.venv\Scripts\Activate.ps1
  - CMD: .\.venv\Scripts\activate.bat
- Point Poetry at that venv python:
  poetry env use ".\.venv\Scripts\python.exe"
- Then run:
  poetry install

Notes:
- If pyproject.toml restricts Python (e.g. ^3.12), make sure the chosen python matches that constraint.
- If poetry reports the executable not found, ensure the path is correct and Poetry is installed and on PATH.
- After switching python, remove and recreate the env if you encounter issues:
  poetry env remove <current-venv>   # see poetry env list to get the name
  poetry env use <path-to-python>
  poetry install
