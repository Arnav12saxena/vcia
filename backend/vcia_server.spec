# vcia_server.spec
# ─────────────────────────────────────────────────────────────────
# PyInstaller spec to bundle the FastAPI backend into a single
# executable (vcia_server.exe on Windows, vcia_server on Mac/Linux).
#
# Build:
#   pip install pyinstaller
#   pyinstaller vcia_server.spec --clean
#   Output: dist/vcia_server/  (copy entire folder to electron/backend/)
# ─────────────────────────────────────────────────────────────────

import sys
from pathlib import Path

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=[str(Path('.').resolve())],
    binaries=[],
    datas=[],
    hiddenimports=[
        # FastAPI / Starlette internals
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.loops.asyncio',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        # ML / CV
        'sklearn.neighbors._partition_nodes',
        'sklearn.utils._cython_blas',
        'sklearn.utils._weight_vector',
        'cv2',
        'numpy',
        # Multipart
        'multipart',
        'python_multipart',
        # Async
        'anyio',
        'anyio.abc',
        'anyio._backends._asyncio',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter', 'matplotlib', 'IPython', 'jupyter',
        'notebook', 'sphinx', 'pytest',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='vcia_server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,          # No terminal window on Windows
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='vcia_server',
)
