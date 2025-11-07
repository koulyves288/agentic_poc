# Dev setup / fix missing 'dapr' module

Quick checklist

1. From project root, install dependencies with Poetry (recommended):
   - poetry install
   - poetry run python -c "import dapr; print(dapr.__version__)"

2. If not using Poetry, create and activate a venv:
   - py -3.12 -m venv .venv
   - PowerShell: .\.venv\Scripts\Activate.ps1
   - pip install python-dotenv dapr dapr-ext-fastapi uvicorn

3. Verify the Python and package location:
   - python -c "import sys; print(sys.executable)"
   - python -c "import pkgutil, importlib; print(bool(pkgutil.find_loader('dapr')))"

4. Run the server:
   - With Poetry: poetry run python server.py
   - With venv: python server.py

Install Dapr SDK (quick)
- With Poetry (preferred):
  ```powershell
  poetry add dapr dapr-ext-fastapi
  poetry install
  poetry run python -c "import dapr; print(dapr.__version__)"
  ```
- With venv + pip:
  ```powershell
  py -3.12 -m venv .venv
  .\.venv\Scripts\Activate.ps1
  pip install dapr dapr-ext-fastapi python-dotenv uvicorn
  python -c "import dapr; print(dapr.__version__)"
  ```

If you still get "ModuleNotFoundError: No module named 'dapr'":
- Ensure you're running the same python that has the package installed (compare outputs of which/where python and pip show dapr).
- If needed, explicitly install into that interpreter:
  - C:\full\path\to\python.exe -m pip install dapr
