#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""socket ile TCP istemcisi: zaman aşımı ve tam uzunlukta okuma (Bölüm 7).

    python3 tcp_istemci.py [--port 5020] [--adres 1]
"""
import argparse
import socket
import sys

from sensor_araclari import protokol


def tam_oku(s: socket.socket, n: int) -> bytes:
    """Tam olarak n bayt okur; recv() daha az bayt döndürebileceği için döngü gerekir."""
    parcalar = []
    while n:
        parca = s.recv(n)
        if not parca:
            raise ConnectionError("sunucu bağlantıyı kapattı")
        parcalar.append(parca)
        n -= len(parca)
    return b"".join(parcalar)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--port", type=int, default=5020)
    p.add_argument("--adres", type=int, default=1)
    arg = p.parse_args()
    try:
        with socket.create_connection(("127.0.0.1", arg.port), timeout=1.0) as s:
            istek = protokol.istek_olustur(arg.adres, 0, 2)
            s.sendall(istek)
            print("gönderildi:", protokol.onaltilik(istek))
            yanit = tam_oku(s, protokol.yanit_uzunlugu(2))
            print("alındı    :", protokol.onaltilik(yanit))
            sicaklik, nem = protokol.yanit_coz(yanit, arg.adres)
            print(f"sonuç     : {protokol.isaretli16(sicaklik) / 10} C, %{nem / 10}")
    except ConnectionRefusedError:
        print("HATA: bağlantı reddedildi (sunucu çalışıyor mu?)", file=sys.stderr)
        return 3
    except TimeoutError:
        print("HATA: zaman aşımı: sunucu 1 s içinde yanıt vermedi", file=sys.stderr)
        return 5
    return 0


if __name__ == "__main__":
    sys.exit(main())
