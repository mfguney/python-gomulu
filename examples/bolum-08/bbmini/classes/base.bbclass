# SPDX-License-Identifier: MIT
# Her tarifin otomatik devraldığı temel sınıf (OE-Core'daki base.bbclass'ın çok küçük bir benzeri).

addtask build
do_build[nostamp] = "1"
python do_build() {
    bb.plain("%s: do_build tamamlandı" % d.getVar("PF"))
}
