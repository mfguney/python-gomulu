# SPDX-License-Identifier: MIT
"""Uygulama genelinde logging yapılandırması (Bölüm 6).

Kütüphane modülleri yalnızca ``logging.getLogger(__name__)`` ile günlükçü alır;
yapılandırma yalnızca programın giriş noktasında (cli.main) bir kez yapılır.
"""
from __future__ import annotations

import logging
import logging.config
import os

BICIM = "%(asctime)s %(levelname)-7s %(name)s: %(message)s"
SYSLOG_BICIMI = "%(name)s[%(process)d]: %(levelname)s %(message)s"


def yapilandir(ayrinti: int = 0, syslog: bool = False) -> None:
    """ayrinti: -1 yalnızca hata, 0 uyarı, 1 bilgi, 2 ve üzeri ayıklama düzeyi.

    LOG_DUZEYI ortam değişkeni (DEBUG, INFO, ...) verilmişse komut satırından gelen
    düzeyin yerine geçer; bu, systemd servis dosyasından düzey değiştirmeyi kolaylaştırır.
    """
    duzey = {-1: "ERROR", 0: "WARNING", 1: "INFO"}.get(ayrinti, "DEBUG")
    duzey = os.environ.get("LOG_DUZEYI", duzey).upper()

    isleyiciler: dict[str, dict] = {
        "stderr": {"class": "logging.StreamHandler", "formatter": "duz", "stream": "ext://sys.stderr"},
    }
    if syslog and os.path.exists("/dev/log"):
        isleyiciler["syslog"] = {
            "class": "logging.handlers.SysLogHandler",
            "address": "/dev/log",
            "formatter": "syslog",
        }

    logging.config.dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "duz": {"format": BICIM, "datefmt": "%H:%M:%S"},
            "syslog": {"format": SYSLOG_BICIMI},
        },
        "handlers": isleyiciler,
        "root": {"level": duzey, "handlers": list(isleyiciler)},
    })
