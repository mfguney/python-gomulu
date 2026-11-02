#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Üyelik denetimi ve kuyruk işlemlerinde veri yapısı seçiminin etkisi (Bölüm 3).

Süreler makineye göre değişir; önemli olan oranlardır.
"""
import timeit
from collections import deque

N = 10_000
liste = list(range(N))
kume = set(liste)
sozluk = dict.fromkeys(liste)
aranan = N - 1                      # liste için en kötü durum: son öğe

for ad, kap in (("list", liste), ("set", kume), ("dict", sozluk)):
    sure = timeit.timeit(lambda: aranan in kap, number=2_000)
    print(f"'in' {ad:<5}: {sure * 1e6 / 2_000:8.3f} µs/işlem")


def bastan_cek_list():
    k = list(range(N))
    while k:
        k.pop(0)                    # her çekişte tüm öğeler bir sola kayar: O(n)


def bastan_cek_deque():
    k = deque(range(N))
    while k:
        k.popleft()                 # O(1)


for f in (bastan_cek_list, bastan_cek_deque):
    print(f"{f.__name__:<17}: {timeit.timeit(f, number=5) / 5 * 1e3:8.3f} ms")
