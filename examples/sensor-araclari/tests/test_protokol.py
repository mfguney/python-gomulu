# SPDX-License-Identifier: MIT
import pytest

from sensor_araclari import protokol
from sensor_araclari.protokol import CerceveHatasi, CihazHatasi


def test_crc_bilinen_deger():
    # CRC-16/MODBUS için standart sınama değeri: "123456789" -> 0x4B37
    assert protokol.crc16_modbus(b"123456789") == 0x4B37


def test_istek_bilinen_cerceve():
    # Adres 1, yazmaç 0'dan 10 adet okuma: yaygın olarak belgelenen örnek çerçeve
    assert protokol.istek_olustur(1, 0, 10) == bytes.fromhex("01 03 00 00 00 0A C5 CD")


def test_istek_gidis_donus():
    assert protokol.istek_coz(protokol.istek_olustur(17, 0x006B, 3)) == (17, 3, 0x006B, 3)


@pytest.mark.parametrize("adet", [0, 126])
def test_istek_adet_siniri(adet):
    with pytest.raises(ValueError):
        protokol.istek_olustur(1, 0, adet)


def test_yanit_gidis_donus():
    yazmaclar = [214, 455, 1013, 1]
    cerceve = protokol.yanit_olustur(1, yazmaclar)
    assert len(cerceve) == protokol.yanit_uzunlugu(4)
    assert protokol.yanit_coz(cerceve, 1) == yazmaclar


def test_bozuk_crc_yakalanir():
    cerceve = bytearray(protokol.yanit_olustur(1, [214]))
    cerceve[3] ^= 0x01                                  # tek bir bit bozulur
    with pytest.raises(CerceveHatasi, match="CRC"):
        protokol.yanit_coz(bytes(cerceve), 1)


def test_isaretli16():
    assert protokol.isaretli16(0xFF83) == -125
    assert protokol.isaretli16(214) == 214


def test_benzetici_yaniti(cihaz):
    yanit = cihaz.isle(protokol.istek_olustur(1, 0, 2))
    assert protokol.yanit_coz(yanit, 1) == [214, 455]


def test_benzetici_baska_adrese_sessiz(cihaz):
    assert cihaz.isle(protokol.istek_olustur(2, 0, 1)) is None


def test_benzetici_gecersiz_adres_hatasi(cihaz):
    yanit = cihaz.isle(protokol.istek_olustur(1, 3, 5))
    with pytest.raises(CihazHatasi) as bilgi:
        protokol.yanit_coz(yanit, 1)
    assert bilgi.value.kod == 2


def test_olcum_paketi_boyutu():
    assert protokol.OLCUM_PAKETI.size == 9               # '<' dolgusuz: 1+2+2+4
