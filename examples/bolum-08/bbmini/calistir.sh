#!/bin/sh
# SPDX-License-Identifier: MIT
# bbmini örneğini çalıştırır. Kullanım: BITBAKE=<bitbake kaynak dizini> ./calistir.sh [bitbake argümanları]
# Argüman verilmezse sensor-oku tarifinin do_bilgi görevi çalıştırılır.
set -eu
: "${BITBAKE:?BITBAKE değişkeni bitbake kaynak dizinini göstermeli (ör. ~/bitbake)}"
cd "$(dirname "$0")"
export BBPATH="$PWD"
export PATH="$BITBAKE/bin:$PATH"
if [ $# -eq 0 ]; then
    set -- sensor-oku -c bilgi
fi
exec bitbake "$@"
