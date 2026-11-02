# SPDX-License-Identifier: MIT
"""Modbus RTU benzeri basit bir istek/yanıt protokolü.

Yalnızca "yazmaç oku" (0x03) işlevi uygulanmıştır. Çerçeve yapısı:

    İstek : adres(1) işlev(1) başlangıç(2, BE) adet(2, BE) CRC(2, LE)   = 8 bayt
    Yanıt : adres(1) işlev(1) bayt_sayısı(1) veri(2*adet, BE) CRC(2, LE)
    Hata  : adres(1) işlev|0x80(1) hata_kodu(1) CRC(2, LE)               = 5 bayt

Yazmaçlar 16 bitlik big-endian sözcüklerdir; CRC ise Modbus RTU'da olduğu gibi
düşük bayt önce (little-endian) gönderilir.
"""
from __future__ import annotations

import struct

YAZMAC_OKU = 0x03
HATA_BITI = 0x80
EN_COK_YAZMAC = 125

_ISTEK = struct.Struct(">BBHH")      # adres, işlev, başlangıç, adet
_CRC = struct.Struct("<H")           # CRC düşük bayt önce
_YANIT_BASI = struct.Struct(">BBB")  # adres, işlev, bayt sayısı

# UDP yayınında kullanılan sabit uzunluklu ölçüm paketi (Bölüm 7.3):
# sensör no (u8), sıcaklık x10 (i16), nem x10 (u16), zaman damgası (u32); little-endian, dolgusuz
OLCUM_PAKETI = struct.Struct("<BhHI")


class CerceveHatasi(ValueError):
    """Çerçeve bozuk: uzunluk, CRC veya alanlar beklenenle uyuşmuyor."""


class CihazHatasi(Exception):
    """Cihaz, Modbus istisna yanıtı döndürdü."""

    KODLAR = {1: "geçersiz işlev", 2: "geçersiz yazmaç adresi", 3: "geçersiz değer"}

    def __init__(self, kod: int) -> None:
        self.kod = kod
        super().__init__(f"cihaz hata kodu {kod}: {self.KODLAR.get(kod, 'bilinmiyor')}")


def crc16_modbus(veri: bytes) -> int:
    """CRC-16/MODBUS: polinom 0x8005 (yansıtılmış 0xA001), başlangıç 0xFFFF."""
    crc = 0xFFFF
    for bayt in veri:
        crc ^= bayt
        for _ in range(8):
            if crc & 0x0001:
                crc = (crc >> 1) ^ 0xA001
            else:
                crc >>= 1
    return crc


def _crc_ekle(govde: bytes) -> bytes:
    return govde + _CRC.pack(crc16_modbus(govde))


def _crc_dogrula(cerceve: bytes) -> bytes:
    if len(cerceve) < 4:
        raise CerceveHatasi(f"çerçeve çok kısa: {len(cerceve)} bayt")
    govde, (gelen,) = cerceve[:-2], _CRC.unpack(cerceve[-2:])
    hesap = crc16_modbus(govde)
    if gelen != hesap:
        raise CerceveHatasi(f"CRC uyuşmuyor: gelen 0x{gelen:04X}, hesaplanan 0x{hesap:04X}")
    return govde


def istek_olustur(adres: int, baslangic: int, adet: int) -> bytes:
    """Yazmaç okuma isteği üretir (8 bayt)."""
    if not 1 <= adet <= EN_COK_YAZMAC:
        raise ValueError(f"adet 1..{EN_COK_YAZMAC} aralığında olmalı: {adet}")
    return _crc_ekle(_ISTEK.pack(adres, YAZMAC_OKU, baslangic, adet))


def istek_coz(cerceve: bytes) -> tuple[int, int, int, int]:
    """İsteği (adres, işlev, başlangıç, adet) olarak çözer."""
    if len(cerceve) != _ISTEK.size + 2:
        raise CerceveHatasi(f"istek 8 bayt olmalı, {len(cerceve)} bayt geldi")
    return _ISTEK.unpack(_crc_dogrula(cerceve))


def yanit_olustur(adres: int, yazmaclar: list[int]) -> bytes:
    """Yazmaç değerlerinden yanıt çerçevesi üretir."""
    veri = struct.pack(f">{len(yazmaclar)}H", *yazmaclar)
    return _crc_ekle(_YANIT_BASI.pack(adres, YAZMAC_OKU, len(veri)) + veri)


def hata_yaniti_olustur(adres: int, islev: int, kod: int) -> bytes:
    """Modbus istisna yanıtı üretir (5 bayt)."""
    return _crc_ekle(bytes([adres, islev | HATA_BITI, kod]))


def yanit_uzunlugu(adet: int) -> int:
    """adet yazmaç için beklenen yanıt uzunluğu (bayt)."""
    return _YANIT_BASI.size + 2 * adet + 2


def yanit_coz(cerceve: bytes, beklenen_adres: int) -> list[int]:
    """Yanıtı doğrular ve yazmaç değerlerini (işaretsiz 16 bit) döndürür."""
    govde = _crc_dogrula(cerceve)
    adres, islev = govde[0], govde[1]
    if adres != beklenen_adres:
        raise CerceveHatasi(f"yanıt başka adresten geldi: {adres}")
    if islev == YAZMAC_OKU | HATA_BITI:
        raise CihazHatasi(govde[2])
    if islev != YAZMAC_OKU:
        raise CerceveHatasi(f"beklenmeyen işlev kodu: 0x{islev:02X}")
    bayt_sayisi = govde[2]
    veri = govde[3:]
    if len(veri) != bayt_sayisi or bayt_sayisi % 2:
        raise CerceveHatasi(f"bayt sayısı alanı {bayt_sayisi}, veri {len(veri)} bayt")
    return list(struct.unpack(f">{bayt_sayisi // 2}H", veri))


def isaretli16(deger: int) -> int:
    """İşaretsiz 16 bit yazmacı ikiye tümleyen işaretli tamsayıya çevirir."""
    return struct.unpack(">h", struct.pack(">H", deger))[0]


def onaltilik(veri: bytes) -> str:
    """Baytları '01 03 00 00' biçiminde gösterir."""
    return veri.hex(" ").upper()
