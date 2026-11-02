#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Sığ ve derin kopyalama farkı: iç içe yapılandırma sözlüğü (Bölüm 3)."""
import copy

varsayilan = {"aralik": 5, "sensorler": ["sensor0", "sensor1"], "seri": {"hiz": 9600}}

sig = copy.copy(varsayilan)          # dict(varsayilan) ve varsayilan.copy() ile aynı
derin = copy.deepcopy(varsayilan)

sig["aralik"] = 10                   # üst düzey anahtar: yalnızca kopyayı etkiler
sig["sensorler"].append("sensor2")   # iç liste PAYLAŞILIR: asıl nesne de değişir
derin["seri"]["hiz"] = 115200        # derin kopya tamamen bağımsızdır

print("varsayilan:", varsayilan)
print("sig       :", sig)
print("derin     :", derin)
print("iç liste aynı nesne mi? sığ:", sig["sensorler"] is varsayilan["sensorler"],
      "| derin:", derin["sensorler"] is varsayilan["sensorler"])

# Sık yapılan hata: [[]] * 3 aynı iç listeyi üç kez içerir
tablo = [[]] * 3
tablo[0].append(1)
print("[[]] * 3  :", tablo)
tablo = [[] for _ in range(3)]
tablo[0].append(1)
print("kavrama   :", tablo)
