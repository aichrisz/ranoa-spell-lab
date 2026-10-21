"""Package only explicit source files; never dependencies, VCS or private data."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    'index.html', 'styles.css', 'engine.js', 'renderer.js', 'app.js',
    'assets/sigil.svg', 'package.json', 'package-lock.json',
    'playwright.config.cjs', '.gitignore', 'README.md',
    'docs/tdd-evidence.md', 'scripts/public.cjs', 'scripts/server.cjs',
    'scripts/build.cjs', 'scripts/export.cjs', 'scripts/check.cjs',
    'scripts/package.py', 'scripts/verify-artifacts.py', 'scripts/verify-correction.cjs',
    'tests/engine.test.cjs', 'tests/mana-invariant.test.cjs',
    'tests/e2e/game.spec.cjs', 'tests/e2e/delivery.spec.cjs',
    'docs/superpowers/specs/2026-10-22-ranoa-arcade-design.md',
    'docs/superpowers/plans/2026-10-22-ranoa-arcade.md',
]
output = ROOT / 'artifacts' / 'Ranoa-Spell-Lab-source.zip'
if output.is_symlink() or output.parent.is_symlink():
    raise ValueError('Unsafe output')
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in FILES:
        file = ROOT / name
        if file.is_symlink() or any(p.is_symlink() for p in file.parents if p != ROOT.parent):
            raise ValueError('Symlink source')
        archive.write(file, 'ranoa-spell-lab/' + name)
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(FILES)
print(f'Verified source ZIP: {output} ({len(FILES)} allowlisted files)')
