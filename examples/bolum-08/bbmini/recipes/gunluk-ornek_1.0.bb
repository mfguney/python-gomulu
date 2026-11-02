# SPDX-License-Identifier: MIT
SUMMARY = "Python görevlerinde çıktının nereye gittiğini gösteren örnek (Bölüm 8)"

python do_yazdir() {
    print("print ile yazıldı")                     # yalnızca görev günlüğüne gider
    bb.note("bb.note: ", d.getVar("PN"))           # argümanlar birleştirilir; günlüğe gider
    bb.plain("bb.plain ile yazıldı")               # günlüğe ve konsola gider
    bb.build.exec_func("kabuk_isi", d)             # kabuk işlevini Python görevinden çalıştırma
}

kabuk_isi() {
    echo "kabuk işlevi: ${PN} ${MACHINE}"
}

addtask yazdir
do_yazdir[nostamp] = "1"
