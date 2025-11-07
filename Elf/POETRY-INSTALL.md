# Install Poetry (notes)

- If an installer prompts: "Enter the absolute path where the nvm-windows zip file is extracted/copied to:" — that prompt belongs to a Node/nvm installer, not Poetry. You can:
  - Extract the nvm-windows zip to an absolute path (example: `C:\nvm` or `C:\Users\<you>\Downloads\nvm`) and supply that folder path to that installer, OR
  - Skip that installer and use the instructions below to install Poetry (recommended).

Recommended (pipx):
1. Open PowerShell.
2. Run:
   - python -m pip install --user pipx
   - python -m pipx ensurepath
   - Close and reopen the terminal
   - pipx install poetry
3. Verify:
   - poetry --version

Fallback (pip user):
- python -m pip install --user poetry
- Restart terminal
- poetry --version

After Poetry is installed:
- From your project root (where pyproject.toml is), set a project Python:
  - poetry env use "C:\full\path\to\python3.12.exe"
- Then:
  - poetry install
