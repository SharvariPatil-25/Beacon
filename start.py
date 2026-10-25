#!/usr/bin/env python3
"""
start.py
--------
Cross-platform launcher for the BEACON Legal Meeting Intelligence Platform.
Starts the backend server and automatically opens the browser.
"""

import sys
import os
import shutil
import subprocess
import webbrowser
import threading
import time
from pathlib import Path

# On Windows, `python` may resolve to the Microsoft Store Python 3.13
# installation even when the project dependencies are installed in Python 3.12.
# Re-enter the launcher with that environment when it is available.
if os.name == "nt" and sys.version_info >= (3, 13) and not os.environ.get("BEACON_PYTHON_REEXEC"):
    preferred_python = Path.home() / "AppData" / "Local" / "Programs" / "Python" / "Python312" / "python.exe"
    if preferred_python.exists():
        os.environ["BEACON_PYTHON_REEXEC"] = "1"
        os.execv(str(preferred_python), [str(preferred_python), *sys.argv])

# Add project root to path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))


def run_command(command, cwd=ROOT):
    print(f">> Running: {' '.join(command)}")
    subprocess.run(command, cwd=cwd, check=True)


def ensure_runtime():
    """Install missing dependencies once, then build only when sources changed."""
    python_marker = ROOT / ".beacon-python-deps-installed"
    python_executable = Path(sys.executable)
    requirements = ROOT / "requirements.txt"
    if not python_marker.exists():
        run_command([str(python_executable), "-m", "pip", "install", "-r", str(requirements)])
        python_marker.touch()

    frontend = ROOT / "frontend"
    bundle = ROOT / "dist" / "beacon-standalone.html"
    source_files = list((frontend / "src").rglob("*")) + [frontend / "build.mjs"]
    build_required = not bundle.exists() or any(
        path.is_file() and path.stat().st_mtime > bundle.stat().st_mtime
        for path in source_files
    )
    if build_required:
        npm = shutil.which("npm")
        node_modules = frontend / "node_modules"
        if not npm:
            raise RuntimeError("Node.js and npm are required to build the frontend. Install Node.js 18+ and retry.")
        esbuild_entry = node_modules / "esbuild" / "lib" / "main.js"
        react_entry = node_modules / "react" / "package.json"
        if not esbuild_entry.is_file() or not react_entry.is_file():
            if node_modules.exists():
                print(">> Incomplete frontend dependencies detected; recreating frontend/node_modules")
                shutil.rmtree(node_modules)
            run_command([npm, "ci"], cwd=frontend)
        run_command([npm, "run", "build"], cwd=frontend)
        bundle.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(frontend / "dist" / "index.html", bundle)

def open_browser():
    time.sleep(1.2)
    url = f"http://localhost:{SERVER_PORT}"
    print(f">> Opening BEACON in default web browser: {url}")
    try:
        webbrowser.open(url)
    except Exception:
        pass


if __name__ == "__main__":
    ensure_runtime()
    from backend.app import start_server
    from config import SERVER_HOST, SERVER_PORT
    t = threading.Thread(target=open_browser, daemon=True)
    t.start()
    start_server(SERVER_HOST, SERVER_PORT)
