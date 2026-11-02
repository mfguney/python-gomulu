#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""İstisnanın çağrı yığınında yukarı yayılması, raise from ve özel istisnalar (Bölüm 6).

Kullanım:  python3 istisna_zinciri.py           -> hatayı yakalar ve özetler
           python3 istisna_zinciri.py --yakalama -> hatayı yakalamaz; tam traceback görülür
"""
import sys


class AgecidiHatasi(Exception):
    """Uygulamanın tüm hatalarının ortak atası: çağıran tek bir türü yakalayabilir."""


class YapilandirmaHatasi(AgecidiHatasi):
    def __init__(self, anahtar, neden):
        self.anahtar = anahtar
        super().__init__(f"'{anahtar}' ayarı geçersiz: {neden}")


AYARLAR = {"aralik": "beş", "esik": "30.0"}


def deger_oku(anahtar):                       # 3. düzey: hata burada doğar
    return int(AYARLAR[anahtar])


def ayar_yukle(anahtar):                      # 2. düzey: düşük düzeyli hatayı anlamlı hale getirir
    try:
        return deger_oku(anahtar)
    except (KeyError, ValueError) as hata:
        raise YapilandirmaHatasi(anahtar, hata) from hata


def baslat():                                 # 1. düzey: hatayla ilgilenmez, yukarı geçer
    aralik = ayar_yukle("aralik")
    print("başladı, aralık:", aralik)


def main():
    try:
        baslat()
    except AgecidiHatasi as hata:             # en üst düzey: tek noktada karar verilir
        print(f"HATA: {hata}", file=sys.stderr)
        print(f"  tür      : {type(hata).__name__}", file=sys.stderr)
        print(f"  __cause__: {hata.__cause__!r}", file=sys.stderr)
        return 1
    finally:
        print("finally: kaynaklar serbest bırakıldı", file=sys.stderr)
    return 0


if __name__ == "__main__":
    if "--yakalama" in sys.argv:
        baslat()
    sys.exit(main())
