# Komut özeti

Kitapta kullanılan komutların ve kod kalıplarının hızlı başvuru listesi. Ayrıntılar parantez içindeki
bölümlerdedir.

## Yorumlayıcı (Bölüm 1)

| Komut | İşlevi |
|---|---|
| `python3 --version` | Sürüm |
| `which -a python3` | PATH'teki tüm `python3` eşleşmeleri |
| `python3 -c 'import sys; print(sys.executable, sys.prefix)'` | Çalışan yorumlayıcı ve kurulum kökü |
| `python3 -q` | Başlıksız REPL |
| `python3 -m modul` | Modülü `sys.path` üzerinden bulup `__main__` olarak çalıştırma |
| `python3 -I betik.py` | Yalıtılmış kip: betik dizini, kullanıcı dizini ve `PYTHON*` değişkenleri yok sayılır |
| `python3 -X warn_default_encoding betik.py` | Kodlamasız `open()` çağrıları için uyarı (3.10+) |
| `python3 -m timeit -s 'hazırlık' 'ifade'` | Küçük kod parçasının süresi |
| `python3 -m cProfile -s cumtime betik.py` | Program profili |

## Sanal ortam ve pip (Bölüm 1)

| Komut | İşlevi |
|---|---|
| `python3 -m venv .venv` | Ortam oluşturma |
| `source .venv/bin/activate` / `deactivate` | Etkinleştirme / çıkış |
| `.venv/bin/python -m pip ...` | Etkinleştirmeden ortamın pip'ini kullanma |
| `python -m pip install 'paket>=1.0'` | Kısıtlı kurulum |
| `python -m pip install -e '.[test]'` | Projeyi düzenlenebilir kipte, ek bağımlılıklarla kurma |
| `python -m pip install -r requirements.txt` | Sabitlenmiş ortamı kurma |
| `python -m pip freeze --exclude-editable > requirements.txt` | Ortamı sabitleme |
| `python -m pip list` / `show -f paket` / `check` | Liste / ayrıntı ve dosyalar / bağımlılık denetimi |
| `python -m pip uninstall paket` | Kaldırma |
| `PIP_REQUIRE_VIRTUALENV=1` | Ortam dışında kurulumu engelleme |
| `pip install --break-system-packages ...` | PEP 668 korumasını aşma (yalnızca atılabilir kapsayıcılarda) |

## Test ve denetim (Bölüm 4, 6)

| Komut | İşlevi |
|---|---|
| `pytest` / `pytest -q` / `pytest -v` | Tüm testler; kısa / ayrıntılı çıktı |
| `pytest -x` | İlk başarısızlıkta dur |
| `pytest -k 'crc or zaman_asimi'` | Adla seçim |
| `pytest --lf` | Yalnızca son başarısız testler |
| `pytest --fixtures` | Kullanılabilir fixture'lar ve belgeleri |
| `pytest -ra` | Atlanan/başarısız testlerin özeti |
| `mypy src/` | Statik tip denetimi |

## Seri port ve ağ (Bölüm 7)

| Komut / URL | İşlevi |
|---|---|
| `python -m serial.tools.list_ports -v` | Seri portları listeleme |
| `python -m serial.tools.miniterm /dev/ttyUSB0 9600` | Basit seri terminal |
| `loop://` | Geri döngü portu |
| `socket://127.0.0.1:5020` | TCP üzerinden ham bayt akışı |
| `spy://ttyUSB0?file=iz.txt` | Trafiği onaltılık döküm olarak kaydetme |
| `sudo usermod -aG dialout $USER` | Seri port erişim izni (yeniden oturum açılmalı) |

## Kitabın araçları

| Komut | İşlevi |
|---|---|
| `sensor-rapor DOSYA... [-b BICIM] [-e DEGER] [-y INI] [-v] [-q]` | Ölçüm özeti; çıkış: 0 tamam, 1 eşik, 2 kullanım, 3 veri |
| `sensor-istemci URL [-a ADRES] [-t SANIYE] [-vv]` | Cihaz sorgusu; çıkış: 3 port, 4 protokol, 5 zaman aşımı |
| `python bolum-07/sanal_cihaz.py --bag ttySANAL0` | Sanal seri portta cihaz benzeticisi |
| `python bolum-07/tcp_sunucu.py [--port 5020]` | TCP cihaz sunucusu |
| `sh hepsini-dene.sh` | Tüm örnekleri ve testleri çalıştırma (`BITBAKE=~/bitbake` ile Bölüm 8 dahil) |

## Sık kullanılan kod kalıpları

```python
# Dosya: kodlama açık, with ile
with open(yol, encoding="utf-8") as f:
    for satir in f: ...

# Dış komut: liste biçimi, denetim ve zaman aşımı
r = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=True, timeout=10)

# İkili alanlar: bayt sırası her zaman açık
paket = struct.pack("<BhHI", no, sicaklik_x10, nem_x10, zaman)
no, sicaklik_x10, nem_x10, zaman = struct.unpack("<BhHI", paket)

# Seri port: zaman aşımı zorunlu, kısa okuma denetlenir
with serial.serial_for_url("/dev/ttyUSB0", baudrate=9600, timeout=1.0) as port:
    port.reset_input_buffer(); port.write(istek)
    yanit = port.read(13)
    if len(yanit) < 13: raise TimeoutError

# TCP: zaman aşımı ve tam uzunlukta okuma
with socket.create_connection((sunucu, 5020), timeout=1.0) as s:
    s.sendall(istek)

# Günlük: modülde günlükçü, giriş noktasında yapılandırma
log = logging.getLogger(__name__)
log.info("okunuyor: %s", yol)

# Hata zinciri
except ValueError as hata:
    raise YapilandirmaHatasi(anahtar, hata) from hata
```

## BitBake'te Python (Bölüm 8)

| Yazım | Anlamı |
|---|---|
| `X = "${@ifade}"` | Her genişletmede değerlendirilen satır içi Python |
| `X := "${@ifade}"` | Ayrıştırma anında bir kez değerlendirilir |
| `python do_ad() { ... }` + `addtask ad after do_x before do_y` | Python görevi |
| `python () { ... }` | Anonim Python: her tarifin ayrıştırılmasının sonunda |
| `def fonk(d): ...` | Metadata içi Python fonksiyonu |
| `addpylib ${LAYERDIR}/lib ad` | Katman kütüphanesini yükleme (`conf/layer.conf`) |
| `d.getVar("X")` / `d.getVar("X", False)` | Genişletilmiş / ham değer; tanımsızsa `None` |
| `d.setVar`, `d.appendVar`, `d.prependVar`, `d.delVar` | Değişken işlemleri |
| `d.getVarFlag("do_x", "dirs")`, `d.appendVarFlag(...)` | Bayrak işlemleri |
| `d.expand("${PN}-${PV}")` | Metin genişletme |
| `bb.utils.contains("DISTRO_FEATURES", "systemd", "a", "b", d)` | Tüm kelimeler varsa `a` |
| `bb.utils.contains_any(...)`, `bb.utils.filter(...)` | Herhangi biri / bulunanlar |
| `oe.utils.conditional(...)`, `oe.utils.vartrue(...)` | Eşitlik / mantıksal değer koşulu |
| `bb.plain`, `bb.note`, `bb.warn`, `bb.error`, `bb.fatal` | Günlük ve hata; `bb.fatal` durdurur |
| `raise bb.parse.SkipRecipe("neden")` | Tarifi atlama (anonim Python içinde) |
| `bb.build.exec_func("kabuk_isi", d)` | Python'dan metadata işlevi çalıştırma |
| `bitbake-getvar -r tarif DEGISKEN` | Değişkenin değeri ve geçmişi |
