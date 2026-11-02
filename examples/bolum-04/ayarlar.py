# SPDX-License-Identifier: MIT
"""ithal_izle.py tarafından içe aktarılan küçük modül (Bölüm 4)."""
print(f"  [ayarlar.py çalıştı; __name__ = {__name__!r}]")

ARALIK = 5


def goster():
    return f"aralık={ARALIK}"


if __name__ == "__main__":
    print("  doğrudan çalıştırıldı:", goster())
