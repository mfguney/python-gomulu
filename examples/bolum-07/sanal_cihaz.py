#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Sanal seri port (pty) üzerinde çalışan sensör cihazı benzeticisi (Bölüm 7).

    python3 sanal_cihaz.py                   # portu açar ve Ctrl+C'ye kadar istekleri yanıtlar
    python3 sanal_cihaz.py --bag ttySANAL0   # ayrıca ttySANAL0 adlı sembolik bağlantı oluşturur
    python3 sanal_cihaz.py --dene            # aynı süreçte sensor-istemci ile bir sorgu yapar

Bir pty çifti, bir ucu "cihaz", diğer ucu "seri port" olan sanal bir kablo gibidir:
istemci /dev/pts/N yolunu gerçek bir seri port gibi açar.
"""
import os
import signal
import sys
import threading
import tty

from sensor_araclari import protokol
from sensor_araclari.benzetici import SensorBenzetici

ISTEK_BOYU = 8


def hizmet_ver(ana_fd: int, cihaz: SensorBenzetici) -> None:
    tampon = b""
    while True:
        try:
            parca = os.read(ana_fd, 64)
        except OSError:                    # karşı uç kapandı
            return
        if not parca:
            return
        tampon += parca
        while len(tampon) >= ISTEK_BOYU:   # akışı sabit uzunluklu isteklere böl
            istek, tampon = tampon[:ISTEK_BOYU], tampon[ISTEK_BOYU:]
            yanit = cihaz.isle(istek)
            print(f"[cihaz] alındı {protokol.onaltilik(istek)} -> "
                  f"{protokol.onaltilik(yanit) if yanit else 'yanıt yok'}", file=sys.stderr, flush=True)
            if yanit:
                os.write(ana_fd, yanit)


def main() -> int:
    ana_fd, uc_fd = os.openpty()
    tty.setraw(uc_fd)                      # satır düzenini kapat: baytlar olduğu gibi geçsin
    yol = os.ttyname(uc_fd)
    cihaz = SensorBenzetici(adres=1)
    is_parcacigi = threading.Thread(target=hizmet_ver, args=(ana_fd, cihaz), daemon=True)
    is_parcacigi.start()

    if "--dene" in sys.argv:
        from sensor_araclari import istemci
        return istemci.main([yol, "-vv"])

    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))   # kill ile kapatılınca da temizlik yapılsın
    bag = None
    if "--bag" in sys.argv:                # socat'ın link= seçeneği gibi: sabit bir ad verir
        bag = sys.argv[sys.argv.index("--bag") + 1]
        if os.path.islink(bag):
            os.unlink(bag)
        os.symlink(yol, bag)
    print(f"sanal port: {yol}" + (f" -> {bag}" if bag else "") + "  (çıkmak için Ctrl+C)", flush=True)
    try:
        is_parcacigi.join()
    except KeyboardInterrupt:
        pass
    finally:
        if bag and os.path.islink(bag):
            os.unlink(bag)
    return 0


if __name__ == "__main__":
    sys.exit(main())
