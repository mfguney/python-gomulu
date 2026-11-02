#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Argüman türleri, LEGB kapsamı, kapanışlar ve dekoratörler (Bölüm 4)."""
import functools
import time

# --- Argüman türleri: konumsal-yalnız (/), anahtar-yalnız (*), *args, **kwargs
def oku(sensor, /, adet=1, *, zaman_asimi=1.0, **ek):
    return f"oku({sensor!r}, adet={adet}, zaman_asimi={zaman_asimi}, ek={ek})"

print(oku("sensor0"))
print(oku("sensor0", 3, zaman_asimi=0.5, birim="C"))
try:
    oku("sensor0", 3, 0.5)          # zaman_asimi anahtar-yalnızdır
except TypeError as hata:
    print("TypeError:", hata)

# --- Değiştirilebilir varsayılan değer tuzağı: varsayılan def anında BİR KEZ oluşturulur
def ekle_hatali(deger, liste=[]):
    liste.append(deger)
    return liste

def ekle_dogru(deger, liste=None):
    if liste is None:
        liste = []
    liste.append(deger)
    return liste

print("hatalı:", ekle_hatali(1), ekle_hatali(2))
print("doğru :", ekle_dogru(1), ekle_dogru(2))

# --- LEGB: Local, Enclosing, Global, Built-in
birim = "C"                         # global
def dis():
    birim = "K"                     # enclosing (dis'in yereli)
    def ic():
        return birim                # yerelde yok -> kapsayan kapsamda bulunur
    return ic()
print("LEGB  :", dis(), birim, len("abc"))   # len: built-in kapsamdan

# --- Kapanış (closure) ve nonlocal: durum tutan sayaç fabrikası
def sayac_uret(baslangic=0):
    deger = baslangic
    def artir(adim=1):
        nonlocal deger              # nonlocal olmadan atama yeni bir yerel ad oluştururdu
        deger += adim
        return deger
    return artir

hata_sayaci = sayac_uret()
hata_sayaci(); hata_sayaci()
print("kapanış:", hata_sayaci(), hata_sayaci.__closure__[0].cell_contents)

# --- Geç bağlama tuzağı: döngü değişkeni çağrı anında okunur
gec = [lambda: i for i in range(3)]
erken = [lambda i=i: i for i in range(3)]
print("geç bağlama:", [f() for f in gec], "| varsayılanla:", [f() for f in erken])

# --- Dekoratör: fonksiyonu saran ve yeniden deneyen bir fonksiyon
def yeniden_dene(deneme=3, bekleme=0.01, hatalar=(TimeoutError,)):
    def dekorator(fonk):
        @functools.wraps(fonk)      # __name__, __doc__ gibi bilgileri korur
        def sarmalayici(*args, **kwargs):
            for n in range(1, deneme + 1):
                try:
                    return fonk(*args, **kwargs)
                except hatalar as hata:
                    print(f"  {fonk.__name__}: deneme {n}/{deneme} başarısız ({hata})")
                    if n == deneme:
                        raise
                    time.sleep(bekleme)
        return sarmalayici
    return dekorator

yanitlar = iter([TimeoutError("yanıt yok"), TimeoutError("yanıt yok"), 21.4])

@yeniden_dene(deneme=3)
def sicaklik_oku():
    """Cihazdan sıcaklık okur (benzetim)."""
    sonuc = next(yanitlar)
    if isinstance(sonuc, Exception):
        raise sonuc
    return sonuc

print("dekoratör:", sicaklik_oku(), "|", sicaklik_oku.__name__, "|", sicaklik_oku.__doc__)
