# SPDX-License-Identifier: MIT
"""Donanım olmadan deneme için sensör cihazı benzeticisi.

Yazmaç haritası (adres 0'dan başlar):
    0: sıcaklık x10 (işaretli 16 bit, örn. 214 = 21.4 C, 0xFF83 = -12.5 C)
    1: bağıl nem x10 (işaretsiz, örn. 455 = %45.5)
    2: basınç (hPa, işaretsiz)
    3: durum bitleri (bit0: sensör hazır)
"""
from __future__ import annotations

from . import protokol


class SensorBenzetici:
    def __init__(self, adres: int = 1, yazmaclar: list[int] | None = None) -> None:
        self.adres = adres
        self.yazmaclar = yazmaclar if yazmaclar is not None else [214, 455, 1013, 0x0001]

    def isle(self, istek: bytes) -> bytes | None:
        """Bir isteği işler; yanıt çerçevesi veya (başka adrese gidiyorsa) None döndürür."""
        try:
            adres, islev, baslangic, adet = protokol.istek_coz(istek)
        except protokol.CerceveHatasi:
            return None                      # bozuk çerçeveye Modbus cihazları yanıt vermez
        if adres != self.adres:
            return None
        if islev != protokol.YAZMAC_OKU:
            return protokol.hata_yaniti_olustur(adres, islev, 1)
        if baslangic + adet > len(self.yazmaclar):
            return protokol.hata_yaniti_olustur(adres, islev, 2)
        return protokol.yanit_olustur(adres, self.yazmaclar[baslangic:baslangic + adet])
