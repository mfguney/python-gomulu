# SPDX-License-Identifier: MIT
"""Örnek ağ geçidi (agecidi) için sensör araçları.

Alt modüller:
    olcum     - ölçüm kayıtlarının ayrıştırılması ve özetlenmesi (Bölüm 4, 6)
    protokol  - Modbus RTU benzeri ikili çerçeveler ve CRC-16 (Bölüm 7)
    kayit     - logging yapılandırması (Bölüm 6)
    cli       - sensor-rapor komut satırı aracı (Bölüm 5)
    istemci   - seri port / TCP üzerinden cihaz sorgulama (Bölüm 7)
"""

__version__ = "0.3.0"

from .olcum import Olcum, OlcumHatasi, ozetle, satir_ayristir

__all__ = ["Olcum", "OlcumHatasi", "ozetle", "satir_ayristir", "__version__"]
