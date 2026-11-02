#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""bytes, bytearray, struct ve bayt sırası (endianness) (Bölüm 7)."""
import struct
import sys

print("sistemin bayt sırası:", sys.byteorder)

# bytes değiştirilemez, bytearray değiştirilebilir
cerceve = bytearray(b"\x01\x03\x00\x00")
cerceve += bytes([0x00, 0x04])
cerceve[0] = 0x11
print("bytearray :", cerceve.hex(" "), "| uzunluk", len(cerceve), "| cerceve[1] =", cerceve[1])
print("fromhex   :", bytes.fromhex("11 03 00 00 00 04") == cerceve, "| bytes ile karşılaştırma içerik üzerinden")

# int <-> bytes
deger = 0x1234
print("to_bytes  : big", deger.to_bytes(2, "big").hex(" "), "| little", deger.to_bytes(2, "little").hex(" "))
print("from_bytes:", int.from_bytes(b"\xff\x83", "big", signed=True), int.from_bytes(b"\xff\x83", "big"))

# struct: alanlar -> bayt dizisi.  sensör no u8, sıcaklık x10 i16, nem x10 u16, zaman u32
alanlar = (3, -125, 455, 1793613601)
for bicim in ("<BhHI", ">BhHI", "@BhHI"):
    paket = struct.pack(bicim, *alanlar)
    print(f"{bicim:<6}: {struct.calcsize(bicim):2d} bayt  {paket.hex(' ')}")

geri = struct.unpack("<BhHI", struct.pack("<BhHI", *alanlar))
print("unpack    :", geri, "| sıcaklık", geri[1] / 10, "C")

# Yanlış bayt sırasıyla çözme: hata vermez, yanlış sayı üretir
paket = struct.pack("<H", 455)
print("yanlış sıra:", struct.unpack(">H", paket)[0], "(doğrusu", struct.unpack("<H", paket)[0], ")")

# Önceden derlenmiş Struct ve ofsetle okuma
BASLIK = struct.Struct(">BBB")
yanit = bytes.fromhex("01 03 08 00 D6 01 C7 03 F5 00 01 47 AC")
adres, islev, n = BASLIK.unpack_from(yanit, 0)
yazmaclar = struct.unpack_from(f">{n // 2}H", yanit, BASLIK.size)
print("unpack_from:", adres, islev, n, yazmaclar)

# memoryview: kopyalamadan dilimleme
mv = memoryview(yanit)
veri = mv[3:3 + n]
print("memoryview :", veri.tobytes().hex(" "), "| aynı tampon:", veri.obj is yanit)

# Bit alanları: durum yazmacı
durum = 0b0000_0000_0000_0101
print("bitler     :", {"hazir": bool(durum & 1 << 0), "kalibre": bool(durum & 1 << 1), "isitici": bool(durum & 1 << 2)})
