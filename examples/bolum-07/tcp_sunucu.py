#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""select ile birden çok istemciye hizmet veren TCP sensör sunucusu (Bölüm 7).

    python3 tcp_sunucu.py [--port 5020] [--sure SANIYE]

İstekler Modbus RTU çerçeveleridir (CRC dahil) ve TCP akışı üzerinden taşınır.
TCP bir bayt akışıdır: bir recv() çağrısı yarım ya da birden çok istek döndürebilir;
bu nedenle her istemci için ayrı bir tampon tutulur.
"""
import argparse
import select
import socket
import sys
import time

from sensor_araclari import protokol
from sensor_araclari.benzetici import SensorBenzetici

ISTEK_BOYU = 8


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--port", type=int, default=5020)
    p.add_argument("--sure", type=float, default=None, help="bu kadar saniye sonra kapan")
    arg = p.parse_args()

    cihaz = SensorBenzetici(adres=1)
    dinleyici = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    dinleyici.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)   # yeniden başlatmada "Address already in use" önlenir
    dinleyici.bind(("127.0.0.1", arg.port))
    dinleyici.listen()
    dinleyici.setblocking(False)
    print(f"[sunucu] 127.0.0.1:{arg.port} dinleniyor", flush=True)

    tamponlar: dict[socket.socket, bytes] = {}
    bitis = time.monotonic() + arg.sure if arg.sure else None
    try:
        while bitis is None or time.monotonic() < bitis:
            okunabilir, _, _ = select.select([dinleyici, *tamponlar], [], [], 0.5)   # 0.5 s zaman aşımı
            for s in okunabilir:
                if s is dinleyici:
                    baglanti, adres = dinleyici.accept()
                    baglanti.setblocking(False)
                    tamponlar[baglanti] = b""
                    print(f"[sunucu] bağlandı: {adres[0]}:{adres[1]}", flush=True)
                    continue
                veri = s.recv(1024)
                if not veri:                          # b"": karşı taraf bağlantıyı kapattı
                    print("[sunucu] bağlantı kapandı", flush=True)
                    del tamponlar[s]
                    s.close()
                    continue
                tamponlar[s] += veri
                while len(tamponlar[s]) >= ISTEK_BOYU:
                    istek, tamponlar[s] = tamponlar[s][:ISTEK_BOYU], tamponlar[s][ISTEK_BOYU:]
                    yanit = cihaz.isle(istek)
                    print(f"[sunucu] {protokol.onaltilik(istek)} -> {'yanıt' if yanit else 'yanıt yok'}", flush=True)
                    if yanit:
                        s.sendall(yanit)
    except KeyboardInterrupt:
        pass
    finally:
        for s in tamponlar:
            s.close()
        dinleyici.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
