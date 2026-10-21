from pathlib import Path
from shutil import copy2

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "satu-pintu"
DIST = ROOT / "satu-pintu-dist"
PUBLIC_FILES = ("index.html", "style.css", "app.js", "catalog.js", "game.js")

DIST.mkdir(exist_ok=True)
for path in DIST.iterdir():
    if path.is_file() and path.name not in PUBLIC_FILES:
        path.unlink()
for name in PUBLIC_FILES:
    copy2(SOURCE / name, DIST / name)

size = sum((DIST / name).stat().st_size for name in PUBLIC_FILES)
print(f"Built {DIST} ({size:,} bytes, {len(PUBLIC_FILES)} files)")
