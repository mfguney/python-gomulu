# SPDX-License-Identifier: MIT
"""sensor-istemci: seri port veya TCP üzerinden sensör cihazını sorgular (Bölüm 7).

pyserial'ın serial_for_url() işlevi aynı kodla şu adresleri açabilir:
    /dev/ttyUSB0            gerçek seri port
    /dev/pts/3              sanal seri port (pty), bkz. examples/bolum-07/sanal_cihaz.py
    socket://127.0.0.1:5020 TCP üzerinden ham bayt akışı
    loop://                 geri döngü (yazılan geri okunur; yalnızca deneme için)
"""
from __future__ import annotations

import argparse
import logging
import sys

import serial

from . import kayit, protokol

log = logging.getLogger(__name__)


def oku(port: serial.Serial, adres: int, baslangic: int, adet: int) -> list[int]:
    """Bir istek gönderir, tam yanıtı bekler ve yazmaçları döndürür."""
    istek = protokol.istek_olustur(adres, baslangic, adet)
    port.reset_input_buffer()            # önceki işlemden kalan baytları at
    port.write(istek)
    log.debug("gönderilen: %s", protokol.onaltilik(istek))

    # Önce 5 bayt okunur: bu, hata yanıtının tamamı veya normal yanıtın başıdır.
    bas = port.read(5)
    if len(bas) < 5:
        raise TimeoutError(f"zaman aşımı: {len(bas)} bayt alındı")
    if bas[1] & protokol.HATA_BITI:
        yanit = bas
    else:
        kalan = protokol.yanit_uzunlugu(adet) - 5
        yanit = bas + port.read(kalan)
    log.debug("alınan   : %s", protokol.onaltilik(yanit))
    return protokol.yanit_coz(yanit, adres)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="sensor-istemci", description="Sensör cihazından yazmaç okur.")
    p.add_argument("url", help="seri port yolu veya pyserial URL'si (socket://, loop://)")
    p.add_argument("-a", "--adres", type=int, default=1, help="cihaz adresi (1-247)")
    p.add_argument("-b", "--hiz", type=int, default=9600, help="baud hızı (seri port için)")
    p.add_argument("-t", "--zaman-asimi", type=float, default=1.0, help="okuma zaman aşımı (s)")
    p.add_argument("-v", "--ayrintili", action="count", default=0)
    arg = p.parse_args(argv)
    kayit.yapilandir(arg.ayrintili)

    try:
        with serial.serial_for_url(arg.url, baudrate=arg.hiz, timeout=arg.zaman_asimi) as port:
            yazmac = oku(port, arg.adres, 0, 4)
    except TimeoutError as hata:         # OSError'ın alt sınıfıdır; bu nedenle önce yakalanır
        log.error("cihaz yanıt vermedi: %s", hata)
        return 5
    except (serial.SerialException, OSError) as hata:
        log.error("port açılamadı veya iletişim hatası: %s", hata)
        return 3
    except (protokol.CerceveHatasi, protokol.CihazHatasi) as hata:
        log.error("protokol hatası: %s", hata)
        return 4

    print(f"sıcaklık : {protokol.isaretli16(yazmac[0]) / 10:.1f} C")
    print(f"nem      : {yazmac[1] / 10:.1f} %RH")
    print(f"basınç   : {yazmac[2]} hPa")
    print(f"durum    : {'hazır' if yazmac[3] & 1 else 'hazır değil'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
