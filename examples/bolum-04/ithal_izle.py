#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""import sisteminin adımlarını gözlemler: sys.path, find_spec, sys.modules (Bölüm 4)."""
import importlib
import importlib.util
import subprocess
import sys
import tempfile
from pathlib import Path

print("1) sys.path[0] (betiğin dizini):", Path(sys.path[0]).name)

print("2) find_spec ile modülün bulunacağı yer:")
for ad in ("ayarlar", "json", "sys", "serial", "olmayan_modul"):
    spec = importlib.util.find_spec(ad)
    print(f"   {ad:<14} -> {spec.origin if spec else 'bulunamadı'}")

print("3) ilk import modülü çalıştırır ve sys.modules'a ekler:")
print("   önce :", "ayarlar" in sys.modules)
import ayarlar
print("   sonra:", "ayarlar" in sys.modules, "|", ayarlar.goster())

print("4) ikinci import önbellekten gelir (modül yeniden çalışmaz):")
import ayarlar as ikinci
print("   aynı nesne:", ikinci is sys.modules["ayarlar"])

print("5) importlib.reload modülü yeniden çalıştırır:")
importlib.reload(ayarlar)

print("6) gölgeleme: geçerli dizindeki serial.py, pyserial'ı gizler")
with tempfile.TemporaryDirectory() as d:
    (Path(d) / "serial.py").write_text("VERSION = 'sahte'\n")
    sonuc = subprocess.run([sys.executable, "-c",
                            "import serial, os; print('  ', os.path.basename(serial.__file__),"
                            " getattr(serial, 'VERSION', None))"],
                           cwd=d, capture_output=True, text=True)
    print(sonuc.stdout.rstrip() or sonuc.stderr)
