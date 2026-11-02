#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Günlük satırlarının list, dict, set ve collections türleriyle özetlenmesi (Bölüm 3)."""
from collections import Counter, defaultdict, deque, namedtuple

GUNLUK = """\
10:00:01 sensor0 21.4 TAMAM
10:00:01 sensor1 19.0 TAMAM
10:00:06 sensor0 21.8 TAMAM
10:00:06 sensor1 0.0 E_ZAMAN_ASIMI
10:00:11 sensor0 22.6 TAMAM
10:00:11 sensor1 0.0 E_CRC
10:00:16 sensor0 31.2 TAMAM
10:00:16 sensor1 19.5 TAMAM
10:00:21 sensor2 0.0 E_ZAMAN_ASIMI
"""

Kayit = namedtuple("Kayit", "zaman sensor deger durum")

# Liste kavraması: her satır bir Kayit demetine dönüşür
kayitlar = [Kayit(z, s, float(d), du) for z, s, d, du in (sat.split() for sat in GUNLUK.splitlines())]
print("kayıt sayısı     :", len(kayitlar), "| ilk:", kayitlar[0])

# Küme kavraması: tekil sensör adları (sırasız; sıralı göstermek için sorted)
print("sensörler        :", sorted({k.sensor for k in kayitlar}))

# Counter: hata kodlarının sayımı
hatalar = Counter(k.durum for k in kayitlar if k.durum != "TAMAM")
print("hata sayıları    :", hatalar.most_common())

# defaultdict(list): sensöre göre gruplama
gruplar = defaultdict(list)
for k in kayitlar:
    if k.durum == "TAMAM":
        gruplar[k.sensor].append(k.deger)
print("gruplar          :", dict(gruplar))

# Sözlük kavraması: sensör başına ortalama
ortalama = {s: round(sum(v) / len(v), 2) for s, v in gruplar.items()}
print("ortalamalar      :", ortalama)

# deque(maxlen=3): son üç okumayı tutan halka arabellek ve kayan ortalama
pencere = deque(maxlen=3)
for d in gruplar["sensor0"]:
    pencere.append(d)
    print(f"  pencere {list(pencere)!s:<20} kayan ort. {sum(pencere) / len(pencere):.2f}")

# Dilimleme ve sıralama
sirali = sorted(kayitlar, key=lambda k: k.deger, reverse=True)
print("en yüksek iki    :", [(k.sensor, k.deger) for k in sirali[:2]])
print("ters sıra zaman  :", [k.zaman for k in kayitlar[::-1][:3]])
