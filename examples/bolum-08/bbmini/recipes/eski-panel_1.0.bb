# SPDX-License-Identifier: MIT
SUMMARY = "Grafik arayüz gerektiren ve bu dağıtımda atlanan tarif (Bölüm 8)"

python () {
    if not bb.utils.contains("DISTRO_FEATURES", "x11", True, False, d):
        raise bb.parse.SkipRecipe("DISTRO_FEATURES içinde x11 yok")
}
