#!/bin/sh
# SPDX-License-Identifier: MIT
# Kitaptaki tüm örnekleri çalıştırır ve sensor-araclari testlerini koşturur.
#
#   sh hepsini-dene.sh                       # Bölüm 1-7
#   BITBAKE=~/bitbake sh hepsini-dene.sh     # Bölüm 8 (BitBake kaynak ağacı gerekir) dahil
#
# Gereksinimler: Python 3.10+, pyserial ve pytest (bir sanal ortamda kurulu olması önerilir).
set -eu
cd "$(dirname "$0")"
PY=${PYTHON:-python3}
export PYTHONPATH="$PWD/sensor-araclari/src${PYTHONPATH:+:$PYTHONPATH}"
export PYTHONDONTWRITEBYTECODE=1

adim() { printf '\n== %s\n' "$*"; }
calistir() { adim "$*"; "$@" > /dev/null; }

adim "sensor-araclari: pytest"
(cd sensor-araclari && $PY -m pytest -q -p no:cacheprovider)

calistir $PY bolum-01/ortam_bilgisi.py
calistir $PY bolum-02/ad_baglama.py
calistir $PY bolum-02/sayilar_metin.py
calistir $PY bolum-02/komut_esle.py
calistir $PY bolum-03/olcum_ozet.py
calistir $PY bolum-03/kopyalama.py
calistir $PY bolum-03/karmasiklik.py
calistir $PY bolum-04/ithal_izle.py
calistir $PY bolum-04/ayarlar.py
calistir $PY bolum-04/kapsam_dekorator.py
calistir $PY bolum-04/siniflar.py
calistir $PY bolum-05/guvenli_surec.py
calistir $PY bolum-05/dosya_islemleri.py
calistir $PY -m sensor_araclari.cli sensor-araclari/ornek-veri/olcumler.csv

adim "sensor-rapor: beklenen çıkış kodları (1: eşik aşıldı, 3: veri hatası)"
set +e
$PY -m sensor_araclari.cli -q -y sensor-araclari/ornek-veri/rapor.ini sensor-araclari/ornek-veri/olcumler.csv > /dev/null; k1=$?
$PY -m sensor_araclari.cli -q sensor-araclari/ornek-veri/bozuk.csv > /dev/null 2>&1; k3=$?
$PY bolum-06/istisna_zinciri.py > /dev/null 2>&1; k6=$?
set -e
[ "$k1" -eq 1 ] && [ "$k3" -eq 3 ] && [ "$k6" -eq 1 ] || { echo "beklenmeyen çıkış kodu: $k1 $k3 $k6"; exit 1; }

calistir $PY bolum-06/kayit_ornegi.py
calistir $PY bolum-07/bayt_struct.py
calistir $PY bolum-07/seri_dongu.py
calistir $PY bolum-07/sanal_cihaz.py --dene
calistir $PY bolum-07/udp_olcum.py

adim "TCP sunucu + istemci"
$PY bolum-07/tcp_sunucu.py --port 5020 --sure 3 > /dev/null &
sleep 1
$PY bolum-07/tcp_istemci.py --port 5020 > /dev/null
$PY -m sensor_araclari.istemci socket://127.0.0.1:5020 > /dev/null
wait

if [ -n "${BITBAKE:-}" ]; then
    calistir $PY bolum-08/veri_deposu.py
    adim "bbmini: sensor-oku -c bilgi"
    sh bolum-08/bbmini/calistir.sh sensor-oku -c bilgi > /dev/null
    adim "bbmini: gunluk-ornek -c yazdir"
    sh bolum-08/bbmini/calistir.sh gunluk-ornek -c yazdir > /dev/null
    adim "bbmini: servis-denetle (bilerek başarısız olmalı)"
    if sh bolum-08/bbmini/calistir.sh servis-denetle > /dev/null 2>&1; then
        echo "servis-denetle başarısız olmalıydı"; exit 1
    fi
    rm -rf bolum-08/bbmini/tmp bolum-08/bbmini/cache bolum-08/bbmini/bitbake-cookerdaemon.log
else
    adim "BITBAKE tanımlı değil: Bölüm 8 örnekleri atlandı"
fi

adim "TÜM ÖRNEKLER TAMAM"
