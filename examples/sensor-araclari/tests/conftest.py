# SPDX-License-Identifier: MIT
"""Testlerde paylaşılan fixture'lar. pytest bu dosyayı otomatik olarak yükler."""
from pathlib import Path

import pytest

from sensor_araclari.benzetici import SensorBenzetici

VERI_DIZINI = Path(__file__).resolve().parent.parent / "ornek-veri"


@pytest.fixture
def ornek_csv() -> Path:
    """Depodaki örnek ölçüm dosyası (salt okunur kullanılır)."""
    return VERI_DIZINI / "olcumler.csv"


@pytest.fixture
def gecici_csv(tmp_path):
    """İçeriği teste göre yazılan geçici bir CSV dosyası üreten fabrika fixture'ı."""
    def yaz(*satirlar: str) -> Path:
        yol = tmp_path / "olcum.csv"
        yol.write_text("zaman,sensor,deger,birim\n" + "".join(s + "\n" for s in satirlar),
                       encoding="utf-8")
        return yol
    return yaz


@pytest.fixture
def cihaz() -> SensorBenzetici:
    """Her test için yeni bir benzetici: testler birbirinin durumunu etkilemez."""
    return SensorBenzetici(adres=1)
