# SPDX-License-Identifier: MIT
SUMMARY = "Kabuk görevinin ürettiği dosyayı Python göreviyle denetleyen örnek (Bölüm 8)"

SERVIS_DOSYASI = "${B}/sensor-oku.service"
EXEC_SATIRI ?= ""

# Kabuk görevi: ${...} başvuruları görev çalışmadan önce BitBake tarafından genişletilir
do_uret() {
    printf '[Unit]\nDescription=Sensör okuma servisi\n\n[Service]\n%s\n' "${EXEC_SATIRI}" > ${SERVIS_DOSYASI}
}
do_uret[dirs] = "${B}"
addtask uret before do_denetle

python do_denetle() {
    yol = d.getVar("SERVIS_DOSYASI")
    with open(yol, encoding="utf-8") as f:
        satirlar = [s.strip() for s in f]
    if "[Install]" not in satirlar:
        bb.warn("%s: [Install] bölümü yok; servis açılışta etkinleştirilemez" % os.path.basename(yol))
    if not any(s.startswith("ExecStart=") for s in satirlar):
        bb.fatal("%s: ExecStart= satırı bulunamadı" % os.path.basename(yol))
    bb.note("servis dosyası geçerli")
}
addtask denetle before do_build
do_uret[nostamp] = "1"
do_denetle[nostamp] = "1"
