#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""logging: günlükçü hiyerarşisi, düzeyler, işleyiciler ve istisna kaydı (Bölüm 6)."""
import logging
import sys

# Kütüphane kodu: yalnızca günlükçü alır, yapılandırma yapmaz
seri_log = logging.getLogger("agecidi.seri")
modbus_log = logging.getLogger("agecidi.seri.modbus")   # agecidi.seri'nin çocuğu


def sorgula(adres):
    modbus_log.debug("istek hazırlanıyor: adres=%d", adres)   # %-biçim: yalnızca gerekirse işlenir
    if adres > 247:
        raise ValueError(f"geçersiz adres {adres}")
    seri_log.info("adres %d sorgulandı", adres)


# Uygulama kodu: giriş noktasında bir kez yapılandırılır
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)-7s %(name)-20s %(message)s",
    stream=sys.stdout,
)

print("--- düzey INFO: DEBUG iletileri görünmez")
sorgula(1)

print("--- yalnızca agecidi.seri.modbus için DEBUG")
modbus_log.setLevel(logging.DEBUG)
sorgula(2)

print("--- istisna kaydı: log.exception traceback'i de yazar")
try:
    sorgula(300)
except ValueError:
    seri_log.exception("sorgu başarısız")

print("--- düzeyler:", [logging.getLevelName(n) for n in (10, 20, 30, 40, 50)])
print("--- etkin düzey:", logging.getLevelName(seri_log.getEffectiveLevel()),
      logging.getLevelName(modbus_log.getEffectiveLevel()))
