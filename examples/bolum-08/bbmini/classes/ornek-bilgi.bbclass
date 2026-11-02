# SPDX-License-Identifier: MIT
# Seçilen değişkenlerin genişletilmiş değerlerini yazdıran bir Python görevi ekler (Bölüm 8).

BILGI_DEGISKENLERI ?= "PN PV PF OVERRIDES"

python do_bilgi() {
    for ad in d.getVar("BILGI_DEGISKENLERI").split():
        bb.plain("%-12s = %s" % (ad, d.getVar(ad)))
    bb.plain("%-12s = %s" % ("SERVIS (ham)", d.getVar("SERVIS", expand=False)))
    bb.note("çalışma dizini: %s" % os.path.relpath(os.getcwd(), d.getVar("TOPDIR")))
}
do_bilgi[doc] = "Seçilen değişkenlerin değerlerini yazdırır"
do_bilgi[nostamp] = "1"
do_bilgi[dirs] = "${B}"
addtask bilgi before do_build
