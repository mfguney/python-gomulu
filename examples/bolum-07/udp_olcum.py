#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""UDP ile sabit uzunluklu ölçüm paketlerinin gönderilmesi ve alınması (Bölüm 7).

UDP'de her sendto() bir datagramdır ve alıcıda tek bir recvfrom() ile bütün olarak
alınır (TCP'deki gibi birleşme veya bölünme olmaz); ancak teslim ve sıra garanti değildir.
"""
import socket

from sensor_araclari.protokol import OLCUM_PAKETI

ADRES = ("127.0.0.1", 5021)

alici = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
alici.bind(ADRES)
alici.settimeout(0.5)

gonderici = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
for no, sicaklik in ((0, 21.4), (1, -12.5), (2, 19.0)):
    paket = OLCUM_PAKETI.pack(no, round(sicaklik * 10), 455, 1793613601 + no)
    gonderici.sendto(paket, ADRES)
    print(f"gönderildi: {paket.hex(' ')}  ({len(paket)} bayt)")

while True:
    try:
        veri, kimden = alici.recvfrom(1500)
    except TimeoutError:                 # socket.timeout, 3.10'dan beri TimeoutError'ın takma adıdır
        print("zaman aşımı: başka paket yok")
        break
    no, sicaklik, nem, zaman = OLCUM_PAKETI.unpack(veri)
    print(f"alındı    : sensor{no} {sicaklik / 10:+.1f} C %{nem / 10} t={zaman} kaynak {kimden[0]}")

gonderici.close()
alici.close()
