# SPDX-License-Identifier: MIT
"""Ölçüm kayıtlarının ayrıştırılması ve özetlenmesi.

Kayıt biçimi (CSV, başlık satırlı):
    zaman,sensor,deger,birim
    2026-11-02T10:00:01,sensor0,21.4,C
"""
from __future__ import annotations

import csv
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator

GECERLI_BIRIMLER = frozenset({"C", "%RH", "hPa"})


class OlcumHatasi(ValueError):
    """Bir ölçüm satırı ayrıştırılamadığında yükseltilir."""

    def __init__(self, ileti: str, satir_no: int | None = None) -> None:
        self.satir_no = satir_no
        if satir_no is not None:
            ileti = f"satır {satir_no}: {ileti}"
        super().__init__(ileti)


@dataclass(frozen=True, slots=True)
class Olcum:
    """Tek bir sensör ölçümü. frozen=True: oluşturulduktan sonra değiştirilemez."""

    zaman: str
    sensor: str
    deger: float
    birim: str = "C"

    def __post_init__(self) -> None:
        if self.birim not in GECERLI_BIRIMLER:
            raise OlcumHatasi(f"bilinmeyen birim: {self.birim!r}")


def satir_ayristir(alanlar: list[str], satir_no: int | None = None) -> Olcum:
    """CSV satırının alanlarından bir Olcum nesnesi üretir."""
    if len(alanlar) != 4:
        raise OlcumHatasi(f"4 alan bekleniyordu, {len(alanlar)} alan var", satir_no)
    zaman, sensor, deger_metin, birim = (a.strip() for a in alanlar)
    try:
        deger = float(deger_metin)
    except ValueError as hata:
        raise OlcumHatasi(f"sayı değil: {deger_metin!r}", satir_no) from hata
    return Olcum(zaman, sensor, deger, birim)


def dosya_oku(yol: Path) -> Iterator[Olcum]:
    """CSV dosyasındaki ölçümleri sırayla üretir (generator)."""
    with yol.open(encoding="utf-8", newline="") as f:
        okuyucu = csv.reader(f)
        baslik = next(okuyucu, None)
        if baslik != ["zaman", "sensor", "deger", "birim"]:
            raise OlcumHatasi(f"beklenmeyen başlık: {baslik}", 1)
        for satir_no, alanlar in enumerate(okuyucu, start=2):
            if not alanlar or alanlar[0].startswith("#"):
                continue
            yield satir_ayristir(alanlar, satir_no)


def ozetle(olcumler: Iterable[Olcum]) -> dict[str, dict[str, float]]:
    """Her sensör için adet, en küçük, en büyük ve ortalama değeri hesaplar."""
    gruplar: defaultdict[str, list[float]] = defaultdict(list)
    for o in olcumler:
        gruplar[o.sensor].append(o.deger)
    return {
        sensor: {
            "adet": len(degerler),
            "min": min(degerler),
            "max": max(degerler),
            "ort": round(sum(degerler) / len(degerler), 2),
        }
        for sensor, degerler in sorted(gruplar.items())
    }
