#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""BitBake veri deposunu (DataSmart) BitBake'i çalıştırmadan, doğrudan Python'dan kullanır (Bölüm 8).

    BITBAKE=~/bitbake python3 veri_deposu.py
    BITBAKE=~/bitbake OE_CORE=~/openembedded-core python3 veri_deposu.py   # oe.utils örnekleri de

Tariflerdeki d nesnesi bu sınıfın bir örneğidir; aşağıdaki çağrılar python görevlerinde ve
anonim Python işlevlerinde aynen kullanılır.
"""
import os
import sys

bitbake = os.path.expanduser(os.environ.get("BITBAKE", "~/bitbake"))
sys.path.insert(0, os.path.join(bitbake, "lib"))
import bb           # noqa: E402  (yol eklendikten sonra içe aktarılır)
import bb.data      # noqa: E402
import bb.parse     # noqa: E402
import bb.utils     # noqa: E402

d = bb.data.init()


def goster(baslik, deger):
    print(f"{baslik:<34}: {deger!r}")


# 1) setVar / getVar: getVar varsayılan olarak genişletir (expand=True)
d.setVar("PN", "sensor-oku")
d.setVar("PV", "1.0")
d.setVar("BP", "${PN}-${PV}")
goster("getVar('BP')", d.getVar("BP"))
goster("getVar('BP', expand=False)", d.getVar("BP", expand=False))
goster("getVar('TANIMSIZ')", d.getVar("TANIMSIZ"))

# 2) Tembel genişletme: BP'nin değeri okunduğu andaki PV'ye göre hesaplanır (BitBake '=')
d.setVar("PV", "1.1")
goster("PV değişince getVar('BP')", d.getVar("BP"))
d.setVar("SABIT_BP", d.getVar("BP"))           # ':=' benzeri: o anki değer sabitlenir
d.setVar("PV", "2.0")
goster("SABIT_BP (':=' benzeri)", d.getVar("SABIT_BP"))

# 3) Satır içi Python: ${@...} her getVar çağrısında değerlendirilir
d.setVar("DISTRO_FEATURES", "systemd usrmerge ipv6")
d.setVar("SERVIS", "${@bb.utils.contains('DISTRO_FEATURES', 'systemd', 'sensor-oku.service', 'sensor-oku.init', d)}")
goster("SERVIS", d.getVar("SERVIS"))
d.setVar("DISTRO_FEATURES", "usrmerge ipv6")
goster("systemd çıkarılınca SERVIS", d.getVar("SERVIS"))
d.setVar("BUYUK_AD", "${@d.getVar('PN').upper().replace('-', '_')}")
goster("BUYUK_AD", d.getVar("BUYUK_AD"))

# 4) Override ve :append, :remove: getVar sırasında uygulanır
d.setVar("OVERRIDES", "agecidi:ornekos")
d.setVar("KONSOL", "ttyS0")
d.setVar("KONSOL:agecidi", "ttyAMA0")
d.setVar("PAKETLER", "sensor-oku htop")
d.setVar("PAKETLER:append", " nano")
d.setVar("PAKETLER:remove", "htop")
goster("KONSOL (agecidi override)", d.getVar("KONSOL"))
goster("PAKETLER (:append, :remove)", d.getVar("PAKETLER"))
d.appendVar("PAKETLER", " sensor-servis")      # anonim Python'daki d.appendVar ile aynı
goster("appendVar sonrası", d.getVar("PAKETLER"))

# 5) Değişken bayrakları (do_install[dirs], SRC_URI[sha256sum] ...)
d.setVarFlag("do_bilgi", "doc", "Değişkenleri yazdırır")
d.setVarFlag("do_bilgi", "dirs", "${WORKDIR}/build")
d.setVar("WORKDIR", "/tmp/work/${BP}")
goster("getVarFlag(doc)", d.getVarFlag("do_bilgi", "doc"))
goster("getVarFlag(dirs)", d.getVarFlag("do_bilgi", "dirs"))
goster("getVarFlags", sorted(d.getVarFlags("do_bilgi")))

# 6) expand: tanımsız başvurular olduğu gibi bırakılır
goster("expand", d.expand("${PN} -> ${bindir}/${PN}"))

# 7) bb.utils yardımcıları
d.setVar("DISTRO_FEATURES", "systemd usrmerge ipv6")
goster("contains('systemd ipv6')", bb.utils.contains("DISTRO_FEATURES", "systemd ipv6", "evet", "hayır", d))
goster("contains('systemd x11')", bb.utils.contains("DISTRO_FEATURES", "systemd x11", "evet", "hayır", d))
goster("contains_any('wayland x11')", bb.utils.contains_any("DISTRO_FEATURES", "wayland x11", "evet", "hayır", d))
goster("filter('ipv6 wifi')", bb.utils.filter("DISTRO_FEATURES", "ipv6 wifi", d))
goster("to_boolean('yes')", bb.utils.to_boolean("yes"))

# 8) Kopya veri deposu: görevler ve tarifler genel deponun kopyası üzerinde çalışır
yerel = bb.data.createCopy(d)
yerel.setVar("PN", "baska-tarif")
goster("kopyada / asılda PN", (yerel.getVar("PN"), d.getVar("PN")))

# 9) Sık hatalar: None metne dönüşür; genişletme hataları ExpansionError olarak bildirilir
d.setVar("EK", "-${@None}-")
goster("${@None}", d.getVar("EK"))
for ad, deger in (("Q", "${@d.getVar('TANIMSIZ').split()}"), ("P", "${P} ek")):
    d.setVar(ad, deger)
    try:
        d.getVar(ad)
    except bb.data_smart.ExpansionError as hata:
        print(f"{'ExpansionError (' + ad + ')':<34}: {str(hata).splitlines()[0]}")

# 10) İsteğe bağlı: OE-Core'un oe.utils yardımcıları
oe_core = os.environ.get("OE_CORE")
if oe_core:
    sys.path.insert(0, os.path.join(os.path.expanduser(oe_core), "meta", "lib"))
    import oe.utils  # noqa: E402
    d.setVar("DEBUG_BUILD", "1")
    d.setVar("INIT_MANAGER", "systemd")
    goster("oe.utils.conditional", oe.utils.conditional("INIT_MANAGER", "systemd", "servis", "init", d))
    goster("oe.utils.vartrue(DEBUG_BUILD)", oe.utils.vartrue("DEBUG_BUILD", "-O0", "-O2", d))
    goster("oe.utils.all_distro_features", oe.utils.all_distro_features(d, "systemd ipv6", "evet", "hayır"))
    goster("oe.utils.trim_version", oe.utils.trim_version("6.0.4", 2))
