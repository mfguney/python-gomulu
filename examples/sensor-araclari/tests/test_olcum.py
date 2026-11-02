# SPDX-License-Identifier: MIT
import dataclasses

import pytest

from sensor_araclari.olcum import Olcum, OlcumHatasi, dosya_oku, ozetle, satir_ayristir


def test_satir_ayristir_gecerli():
    o = satir_ayristir(["2026-11-02T10:00:01", "sensor0", "21.4", "C"])
    assert o == Olcum("2026-11-02T10:00:01", "sensor0", 21.4, "C")


@pytest.mark.parametrize(
    "alanlar, beklenen",
    [
        (["t", "sensor0", "yirmi", "C"], "sayı değil"),
        (["t", "sensor0", "21.4"], "4 alan bekleniyordu"),
        (["t", "sensor0", "21.4", "F"], "bilinmeyen birim"),
    ],
    ids=["sayi-degil", "eksik-alan", "gecersiz-birim"],
)
def test_satir_ayristir_hatali(alanlar, beklenen):
    with pytest.raises(OlcumHatasi, match=beklenen):
        satir_ayristir(alanlar, satir_no=7)


def test_hata_nedeni_korunur():
    with pytest.raises(OlcumHatasi) as bilgi:
        satir_ayristir(["t", "sensor0", "yirmi", "C"])
    assert isinstance(bilgi.value.__cause__, ValueError)   # raise ... from hata


def test_olcum_degistirilemez():
    o = Olcum("t", "sensor0", 21.4)
    with pytest.raises(dataclasses.FrozenInstanceError):
        o.deger = 99.0


def test_dosya_oku_yorumlari_atlar(ornek_csv):
    olcumler = list(dosya_oku(ornek_csv))
    assert len(olcumler) == 8
    assert olcumler[0].sensor == "sensor0"


def test_ozetle(gecici_csv):
    yol = gecici_csv("t1,sensor0,20.0,C", "t2,sensor0,22.0,C", "t1,sensor1,19.0,C")
    ozet = ozetle(dosya_oku(yol))
    assert ozet == {
        "sensor0": {"adet": 2, "min": 20.0, "max": 22.0, "ort": 21.0},
        "sensor1": {"adet": 1, "min": 19.0, "max": 19.0, "ort": 19.0},
    }


def test_bozuk_satirin_numarasi_bildirilir(gecici_csv):
    yol = gecici_csv("t1,sensor0,20.0,C", "t2,sensor0,??,C")
    with pytest.raises(OlcumHatasi, match=r"^satır 3: "):
        list(dosya_oku(yol))
