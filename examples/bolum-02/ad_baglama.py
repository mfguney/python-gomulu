#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Ad bağlama, takma ad (aliasing) ve değiştirilebilirlik (Bölüm 2)."""

okumalar = [21.4, 21.8]          # liste nesnesi oluşturulur, "okumalar" adı ona bağlanır
yedek = okumalar                 # kopya DEĞİL: ikinci ad aynı nesneye bağlanır
print("aynı nesne mi :", yedek is okumalar, id(okumalar) == id(yedek))

yedek.append(22.6)               # nesne yerinde değişir; iki ad da değişikliği görür
print("okumalar      :", okumalar)

yedek = yedek + [23.0]           # + yeni bir liste üretir; yalnızca "yedek" yeniden bağlanır
print("yeniden bağlama:", okumalar, "|", yedek, "| aynı mı:", yedek is okumalar)

sayac = 10
eski = sayac
sayac += 1                       # int değiştirilemez: += yeni bir int nesnesine bağlar
print("int           :", eski, sayac)


def ekle(liste, deger):
    liste.append(deger)          # çağıranın nesnesini değiştirir
    liste = [deger]              # yalnızca yerel adı yeniden bağlar; çağıranı etkilemez
    return liste


ana = [1]
donen = ekle(ana, 2)
print("fonksiyon     :", ana, donen)

deger = None
print("None denetimi :", deger is None)   # is yalnızca kimlik (None, True/False tekilleri) için
