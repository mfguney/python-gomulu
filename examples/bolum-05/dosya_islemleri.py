#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""pathlib, metin kodlaması, bağlam yöneticisi ve atomik yazma (Bölüm 5)."""
import json
import os
import tempfile
from contextlib import contextmanager
from pathlib import Path


def atomik_yaz(hedef: Path, icerik: str) -> None:
    """Önce aynı dizinde geçici dosyaya yazar, diske zorlar, sonra os.replace ile değiştirir.

    Güç kesilirse dosya ya eski ya yeni haliyle kalır; yarım yazılmış dosya oluşmaz.
    """
    fd, gecici = tempfile.mkstemp(dir=hedef.parent, prefix=f".{hedef.name}.")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(icerik)
            f.flush()
            os.fsync(f.fileno())
        os.replace(gecici, hedef)               # aynı dosya sisteminde atomiktir
    except BaseException:
        os.unlink(gecici)
        raise


@contextmanager
def calisma_dizini(yol: Path):
    """Geçici olarak dizin değiştiren bağlam yöneticisi; çıkışta eski dizine döner."""
    eski = Path.cwd()
    os.chdir(yol)
    try:
        yield yol
    finally:
        os.chdir(eski)


with tempfile.TemporaryDirectory() as d:
    kok = Path(d)
    veri = kok / "veri" / "2026-11-02"
    veri.mkdir(parents=True, exist_ok=True)
    for i in range(3):
        (veri / f"sensor{i}.csv").write_text(f"zaman,sensor,deger,birim\nt,sensor{i},2{i}.0,C\n", encoding="utf-8")

    print("1) parçalar :", veri.name, veri.parent.name, (veri / "sensor0.csv").suffix, (veri / "a.tar.gz").suffixes)
    print("2) glob     :", sorted(p.name for p in kok.glob("veri/*/*.csv")))
    print("3) rglob    :", len(list(kok.rglob("*.csv"))), "dosya")

    ayar = kok / "ayar.json"
    atomik_yaz(ayar, json.dumps({"aralik": 5, "sensorler": ["sensor0"]}, ensure_ascii=False))
    print("4) atomik   :", json.loads(ayar.read_text(encoding="utf-8")), sorted(p.name for p in kok.iterdir()))

    bozuk = kok / "bozuk.txt"
    bozuk.write_bytes("sıcaklık".encode("iso8859-9"))          # eski bir cihazın Latin-5 kaydı
    try:
        bozuk.read_text(encoding="utf-8")
    except UnicodeDecodeError as hata:
        print("5) kodlama  :", hata.reason, "konum", hata.start)
    print("   replace  :", bozuk.read_text(encoding="utf-8", errors="replace"))
    print("   doğru    :", bozuk.read_text(encoding="iso8859-9"))

    with calisma_dizini(veri):
        print("6) bağlam   :", Path.cwd().name, sorted(os.listdir()))
    print("   çıkışta  :", Path.cwd() != veri)

    with open(veri / "sensor0.csv", encoding="utf-8") as f:
        print("7) with     :", f.readline().rstrip(), "| kapandı mı:", f.closed)
    print("   sonra    : kapandı mı:", f.closed)
