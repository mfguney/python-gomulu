#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Sayılar, metin (str) ve bayt (bytes) türleri; f-string biçimlendirme (Bölüm 2)."""
import math

# int: sınırsız duyarlık, taşma yok
print("2**64        =", 2**64)
yazmac = 0b1010_0011
print("bit işlemleri:", bin(yazmac), hex(yazmac & 0x0F), yazmac >> 4, f"{yazmac:08b}")
print("tamsayı bölme:", 7 // 2, -7 // 2, 7 % 3, -7 % 3)

# float: IEEE 754 çift duyarlık
print("0.1 + 0.2    =", 0.1 + 0.2, "| eşit mi:", 0.1 + 0.2 == 0.3)
print("isclose      :", math.isclose(0.1 + 0.2, 0.3))

# str: Unicode kod noktaları dizisi; bytes: 0-255 arası tamsayılar dizisi
ad = "sıcaklık"
kodlu = ad.encode("utf-8")
print("str uzunluğu :", len(ad), "| UTF-8 bayt:", len(kodlu), kodlu)
print("bytes[0]     :", kodlu[0], "| bytes[0:1]:", kodlu[0:1])
print("geri çözme   :", kodlu.decode("utf-8"))
try:
    kodlu.decode("ascii")
except UnicodeDecodeError as hata:
    print("hata         :", hata)

# f-string biçim belirteçleri
deger, sensor = 21.4567, "sensor0"
print(f"[{sensor:<8}] [{deger:>8.2f}] [{deger:+.1e}] [{255:#06x}] [{1013:,}]")
print(f"{deger=:.1f} {sensor=}")
