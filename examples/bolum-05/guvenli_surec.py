#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""subprocess modülünün güvenli kullanımı (Bölüm 5)."""
import os
import shlex
import subprocess
import sys

# 1) Argüman listesi + capture_output + text + check: önerilen temel kalıp
r = subprocess.run(["printf", "%s\\n", "sensor1", "sensor0"], capture_output=True, text=True, check=True)
print("1) stdout:", r.stdout.split(), "| returncode:", r.returncode)

# 2) Başarısız komut: check=True CalledProcessError yükseltir
try:
    subprocess.run(["ls", "/olmayan/dizin"], capture_output=True, text=True, check=True)
except subprocess.CalledProcessError as hata:
    print(f"2) {hata.cmd} -> kod {hata.returncode}; stderr: {hata.stderr.strip()}")

# 3) Komut bulunamadı: alt süreç hiç başlamaz, FileNotFoundError yükseltilir
try:
    subprocess.run(["olmayan-komut"], check=True)
except FileNotFoundError as hata:
    print("3) FileNotFoundError:", hata.strerror, hata.filename)

# 4) Zaman aşımı: süreç öldürülür ve TimeoutExpired yükseltilir
try:
    subprocess.run(["sleep", "5"], timeout=0.2)
except subprocess.TimeoutExpired as hata:
    print(f"4) TimeoutExpired: {hata.cmd} {hata.timeout:.1f} s")

# 5) Kabuk enjeksiyonu: dışarıdan gelen bir "dosya adı"
dosya = "olcum.csv; echo ENJEKSIYON"
kabuklu = subprocess.run(f"echo işleniyor: {dosya}", shell=True, capture_output=True, text=True)
listeli = subprocess.run(["echo", "işleniyor:", dosya], capture_output=True, text=True)
print("5) shell=True :", kabuklu.stdout.splitlines())
print("   liste      :", listeli.stdout.splitlines())
print("   shlex.quote:", shlex.quote(dosya))

# 6) İki süreci boruyla bağlama: printf ... | sort  (kabuk kullanmadan)
uretici = subprocess.Popen(["printf", "sensor2\\nsensor0\\nsensor1\\n"], stdout=subprocess.PIPE)
siralayici = subprocess.Popen(["sort"], stdin=uretici.stdout, stdout=subprocess.PIPE, text=True)
uretici.stdout.close()              # sort bitince printf'in SIGPIPE alabilmesi için
cikti, _ = siralayici.communicate(timeout=5)
uretici.wait()
print("6) boru hattı:", cikti.split(), "| kodlar:", uretici.returncode, siralayici.returncode)

# 7) Alt sürece girdi verme ve ortam değişkeni geçirme
r = subprocess.run([sys.executable, "-c", "import os,sys; print(os.environ['SENSOR'], sys.stdin.read().upper())"],
                   input="veri", capture_output=True, text=True,
                   env={**os.environ, "SENSOR": "sensor0"})   # env= ortamın TAMAMINI değiştirir
print("7) input/env :", r.stdout.strip())
