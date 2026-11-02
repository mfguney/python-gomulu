# SPDX-License-Identifier: MIT
SUMMARY = "Örnek ağ geçidi için sensör okuma aracı (yalnızca metadata denemesi)"

inherit ornek-bilgi

BILGI_DEGISKENLERI = "PF OVERRIDES KONSOL SERVIS SENSORLER ETIKETLER ARALIK ARALIK_MS OZET"

# 1) Koşullu değer: bb.utils.contains satır içi Python ile
SERVIS = "${@bb.utils.contains('DISTRO_FEATURES', 'systemd', 'sensor-oku.service', 'sensor-oku.init', d)}"

# 2) Katman kütüphanesindeki işlev (addpylib ile yüklenen "ornek" paketi)
SENSOR_SAYISI = "3"
SENSORLER = "${@ornek.yardimci.sensor_listesi(d)}"

# 3) Metadata içinde tanımlanan sıradan Python işlevi
def ozet_metni(d):
    return "%s-%s / %s" % (d.getVar("PN"), d.getVar("PV"), d.getVar("MACHINE"))

OZET = "${@ozet_metni(d)}"

# 4) Override ve :append: ayrıştırmanın sonunda, anonim Python'dan önce uygulanır
KONSOL = "ttyS0"
KONSOL:agecidi = "ttyAMA0"
ETIKETLER = "temel"
ETIKETLER:append = " append"
ARALIK ??= "5"

# 5) Anonim Python: ayrıştırma bittikten sonra, her tarif için bir kez çalışır
python () {
    aralik = d.getVar("ARALIK")
    if not aralik.isdigit():
        bb.fatal("ARALIK bir tamsayı olmalı, '%s' verildi" % aralik)
    d.setVar("ARALIK_MS", str(int(aralik) * 1000))
    d.appendVar("ETIKETLER", " anonim")
}
