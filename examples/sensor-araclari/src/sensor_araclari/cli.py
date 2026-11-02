# SPDX-License-Identifier: MIT
"""sensor-rapor: ölçüm dosyalarını özetleyen komut satırı aracı (Bölüm 5).

Çıkış kodları:
    0  başarılı, eşik aşılmadı
    1  en az bir sensör eşik değerini aştı (alarm)
    2  kullanım hatası (argparse tarafından verilir)
    3  dosya veya veri hatası

Ayar önceliği: komut satırı > ortam değişkeni > yapılandırma dosyası > varsayılan.
"""
from __future__ import annotations

import argparse
import configparser
import csv
import json
import logging
import os
import sys
from pathlib import Path

from . import __version__, kayit
from .olcum import Olcum, OlcumHatasi, dosya_oku, ozetle

CIKIS_TAMAM, CIKIS_ALARM, CIKIS_KULLANIM, CIKIS_VERI = 0, 1, 2, 3
BICIMLER = ("tablo", "json", "csv")
VARSAYILAN_YAPILANDIRMA = Path("/etc/sensor-araclari/rapor.ini")

log = logging.getLogger(__name__)


def arguman_ayristirici() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="sensor-rapor",
        description="Sensör ölçüm dosyalarını (CSV) özetler ve eşik denetimi yapar.",
        epilog="Çıkış kodları: 0 tamam, 1 eşik aşıldı, 2 kullanım hatası, 3 veri hatası.",
    )
    p.add_argument("dosyalar", nargs="+", type=Path, metavar="DOSYA", help="ölçüm dosyası (CSV)")
    p.add_argument("-b", "--bicim", choices=BICIMLER,
                   help="çıktı biçimi (ortam: SENSOR_RAPOR_BICIM, varsayılan: tablo)")
    p.add_argument("-e", "--esik", type=float, metavar="DEGER",
                   help="bu değeri aşan en büyük ölçüm alarm sayılır")
    p.add_argument("-y", "--yapilandirma", type=Path, metavar="INI",
                   help=f"yapılandırma dosyası (varsayılan: {VARSAYILAN_YAPILANDIRMA})")
    grup = p.add_mutually_exclusive_group()
    grup.add_argument("-v", "--ayrintili", action="count", default=0, help="daha çok günlük (-vv: ayıklama)")
    grup.add_argument("-q", "--sessiz", action="store_true", help="yalnızca hataları göster")
    p.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    return p


def ayarlari_birlestir(arg: argparse.Namespace) -> tuple[str, float | None]:
    """Biçim ve eşik değerini öncelik sırasına göre belirler."""
    ini = configparser.ConfigParser()
    yol = arg.yapilandirma or VARSAYILAN_YAPILANDIRMA
    okunan = ini.read(yol, encoding="utf-8")
    if arg.yapilandirma and not okunan:
        raise FileNotFoundError(f"yapılandırma dosyası okunamadı: {yol}")
    log.debug("yapılandırma: %s", okunan or "yok")
    bolum = ini["rapor"] if ini.has_section("rapor") else {}

    bicim = arg.bicim or os.environ.get("SENSOR_RAPOR_BICIM") or bolum.get("bicim", "tablo")
    if bicim not in BICIMLER:
        raise ValueError(f"geçersiz biçim: {bicim!r}")
    esik = arg.esik
    if esik is None and "esik" in bolum:
        esik = float(bolum["esik"])
    return bicim, esik


def yazdir(ozet: dict[str, dict[str, float]], bicim: str, cikti=None) -> None:
    # Varsayılan değer olarak sys.stdout yazılmaz: varsayılanlar def anında bir kez
    # değerlendirilir ve sonradan yönlendirilen sys.stdout görülmez (Bölüm 4.1).
    cikti = cikti or sys.stdout
    if bicim == "json":
        json.dump(ozet, cikti, ensure_ascii=False, indent=2)
        cikti.write("\n")
    elif bicim == "csv":
        yazici = csv.writer(cikti, lineterminator="\n")
        yazici.writerow(["sensor", "adet", "min", "max", "ort"])
        for sensor, d in ozet.items():
            yazici.writerow([sensor, d["adet"], d["min"], d["max"], d["ort"]])
    else:
        cikti.write(f"{'sensör':<10}{'adet':>6}{'min':>8}{'max':>8}{'ort':>8}\n")
        for sensor, d in ozet.items():
            cikti.write(f"{sensor:<10}{d['adet']:>6}{d['min']:>8.1f}{d['max']:>8.1f}{d['ort']:>8.2f}\n")


def main(argv: list[str] | None = None) -> int:
    arg = arguman_ayristirici().parse_args(argv)
    kayit.yapilandir(-1 if arg.sessiz else arg.ayrintili)
    try:
        bicim, esik = ayarlari_birlestir(arg)
        olcumler: list[Olcum] = []
        for yol in arg.dosyalar:
            log.info("okunuyor: %s", yol)
            olcumler.extend(dosya_oku(yol))
    except (OSError, OlcumHatasi, ValueError) as hata:
        log.error("%s", hata)
        return CIKIS_VERI

    ozet = ozetle(olcumler)
    yazdir(ozet, bicim)

    if esik is not None:
        asanlar = [s for s, d in ozet.items() if d["max"] > esik]
        if asanlar:
            log.warning("eşik %.1f aşıldı: %s", esik, ", ".join(asanlar))
            return CIKIS_ALARM
    return CIKIS_TAMAM


if __name__ == "__main__":
    sys.exit(main())
