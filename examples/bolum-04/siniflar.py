#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Sınıflar, kalıtım, property, sınıf yöntemleri ve dataclass (Bölüm 4)."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


class Sensor:
    """Tüm sensörler için temel sınıf."""

    sayac = 0                                    # sınıf niteliği: tüm örnekler paylaşır

    def __init__(self, ad: str, adres: int) -> None:
        self.ad = ad                             # örnek niteliği: her nesneye özgü
        self._adres = adres
        Sensor.sayac += 1

    @property
    def adres(self) -> int:                      # okunur nitelik gibi kullanılır: s.adres
        return self._adres

    @adres.setter
    def adres(self, yeni: int) -> None:
        if not 1 <= yeni <= 247:
            raise ValueError(f"Modbus adresi 1-247 olmalı: {yeni}")
        self._adres = yeni

    @classmethod
    def yapilandirmadan(cls, satir: str) -> Sensor:
        """'ad:adres' biçimindeki satırdan nesne üretir (alternatif kurucu)."""
        ad, adres = satir.split(":")
        return cls(ad, int(adres))

    def oku(self) -> float:
        raise NotImplementedError

    def __repr__(self) -> str:
        return f"{type(self).__name__}(ad={self.ad!r}, adres={self._adres})"


class SicaklikSensoru(Sensor):
    def __init__(self, ad: str, adres: int, kayma: float = 0.0) -> None:
        super().__init__(ad, adres)              # temel sınıfın kurucusu çağrılır
        self.kayma = kayma

    def oku(self) -> float:
        return round(21.4 + self.kayma, 1)


class Okunabilir(Protocol):
    """Yapısal tip: oku() yöntemi olan her nesne bu türe uyar (kalıtım gerekmez)."""
    def oku(self) -> float: ...


def ortalama(kaynaklar: list[Okunabilir]) -> float:
    return sum(k.oku() for k in kaynaklar) / len(kaynaklar)


@dataclass(order=True)
class Alarm:
    oncelik: int
    ileti: str = field(compare=False)
    etiketler: list[str] = field(default_factory=list, compare=False)


s1 = SicaklikSensoru("sensor0", 1)
s2 = SicaklikSensoru.yapilandirmadan("sensor1:2")
s2.kayma = -2.4
print(s1, s2, "| oluşturulan:", Sensor.sayac)
print("okuma     :", s1.oku(), s2.oku(), "| ortalama:", ortalama([s1, s2]))
print("isinstance:", isinstance(s2, Sensor), "| MRO:", [k.__name__ for k in SicaklikSensoru.__mro__])
try:
    s1.adres = 300
except ValueError as hata:
    print("property  :", hata)

alarmlar = [Alarm(2, "nem yüksek"), Alarm(1, "sıcaklık kritik", ["sensor0"]), Alarm(3, "pil zayıf")]
print("sıralı    :", [a.ileti for a in sorted(alarmlar)])
print("dataclass :", alarmlar[1])
print("eşitlik   :", Alarm(1, "a") == Alarm(1, "b"))
