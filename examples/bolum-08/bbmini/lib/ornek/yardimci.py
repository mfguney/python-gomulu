# SPDX-License-Identifier: MIT
"""Tariflerde ${@ornek.yardimci.<işlev>(d)} biçiminde çağrılabilen yardımcı işlevler."""


def sensor_listesi(d):
    """SENSOR_SAYISI değişkenine göre 'sensor0 sensor1 ...' listesini üretir."""
    adet = int(d.getVar("SENSOR_SAYISI") or "1")
    return " ".join("sensor%d" % i for i in range(adet))


def ozellik_secimi(d, ozellik, varsa, yoksa=""):
    """DISTRO_FEATURES içinde ozellik varsa 'varsa', yoksa 'yoksa' değerini döndürür."""
    import bb.utils
    return bb.utils.contains("DISTRO_FEATURES", ozellik, varsa, yoksa, d)
