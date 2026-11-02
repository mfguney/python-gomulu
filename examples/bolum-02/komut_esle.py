#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Metin tabanlı bakım komutlarının match deyimiyle ayrıştırılması (Bölüm 2, Python 3.10+).

Ağ geçidinin bakım arayüzü satır satır şu komutları kabul eder:
    OKU <sensör>            AYARLA <ad> <değer>       DURUM       CIKIS
"""
import sys

ayarlar = {"aralik": 5, "esik": 30.0}


def isle(satir: str) -> str:
    match satir.split():
        case []:
            return ""
        case ["OKU", sensor] if sensor.startswith("sensor"):
            return f"{sensor}: 21.4 C"
        case ["OKU", *_]:
            return "HATA: kullanım: OKU sensorN"
        case ["AYARLA", ("aralik" | "esik") as ad, deger]:
            try:
                ayarlar[ad] = type(ayarlar[ad])(deger)   # mevcut değerin türüne çevir
            except ValueError:
                return f"HATA: {ad} için geçersiz değer: {deger}"
            return f"TAMAM {ad}={ayarlar[ad]}"
        case ["DURUM"]:
            return " ".join(f"{k}={v}" for k, v in ayarlar.items())
        case ["CIKIS" | "QUIT"]:
            raise SystemExit(0)
        case [komut, *_]:
            return f"HATA: bilinmeyen komut: {komut}"


if __name__ == "__main__":
    girdi = sys.argv[1:] or ["OKU sensor0", "OKU", "AYARLA aralik 10", "AYARLA esik sicak",
                             "DURUM", "SIFIRLA", "CIKIS", "DURUM"]
    for komut in girdi:
        print(f"> {komut:<18} {isle(komut)}")
