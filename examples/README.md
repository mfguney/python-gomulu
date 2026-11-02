# Örnekler

Bu dizindeki tüm kodlar MIT lisanslıdır (bkz. [COPYING.MIT](COPYING.MIT)). Kitaptaki terminal
örneklerinde bu dizinin `~/ornekler` adıyla kopyalandığı varsayılır:

```bash
git clone https://github.com/mfguney/python-gomulu.git
cp -r python-gomulu/examples ~/ornekler
```

## Hazırlık ve sınama

```bash
cd ~/ornekler/sensor-araclari
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[test]'
cd ..
sh hepsini-dene.sh                        # Bölüm 1-7: betikler ve 29 pytest testi
BITBAKE=~/bitbake sh hepsini-dene.sh      # Bölüm 8 dahil
```

Bölüm 8 için BitBake kaynak ağacı gerekir (tam Yocto kurulumu gerekmez):

```bash
git clone -b 2.18 https://git.openembedded.org/bitbake ~/bitbake
```

`veri_deposu.py` betiğinin `oe.utils` örnekleri için ayrıca OpenEmbedded-Core deposu
`OE_CORE` değişkeniyle gösterilebilir (`git clone -b wrynose https://git.openembedded.org/openembedded-core`).
BitBake, Unix soketi kullandığından `bbmini` projesi yerel bir Linux dosya sisteminde (ör. `~/` altında)
çalıştırılmalıdır.

## Dosyalar ve bölümler

| Dosya | Bölüm | İçerik |
|---|---|---|
| `sensor-araclari/pyproject.toml` | 1, 4 | Proje tanımı, bağımlılıklar, komut giriş noktaları, pytest ayarı |
| `sensor-araclari/src/sensor_araclari/__init__.py` | 4 | Paketin dışa açık arayüzü, `__version__` |
| `sensor-araclari/src/sensor_araclari/olcum.py` | 3, 4, 6 | `Olcum` dataclass'ı, CSV ayrıştırma (üreteç), özetleme, `OlcumHatasi` |
| `sensor-araclari/src/sensor_araclari/cli.py` | 5, 6 | `sensor-rapor`: argparse, configparser, JSON/CSV çıktı, çıkış kodları |
| `sensor-araclari/src/sensor_araclari/kayit.py` | 6 | `logging.config.dictConfig` ile yapılandırma, `LOG_DUZEYI` |
| `sensor-araclari/src/sensor_araclari/protokol.py` | 7 | Modbus RTU benzeri çerçeveler, `struct`, CRC-16/MODBUS, özel istisnalar |
| `sensor-araclari/src/sensor_araclari/benzetici.py` | 7 | Sensör cihazı benzeticisi (yazmaç haritası) |
| `sensor-araclari/src/sensor_araclari/istemci.py` | 7 | `sensor-istemci`: pyserial, iki aşamalı okuma, zaman aşımı |
| `sensor-araclari/tests/conftest.py` | 6 | Paylaşılan fixture'lar (`ornek_csv`, `gecici_csv`, `cihaz`) |
| `sensor-araclari/tests/test_olcum.py` | 6 | Ayrıştırma ve özetleme testleri, `parametrize` |
| `sensor-araclari/tests/test_protokol.py` | 6, 7 | Bilinen CRC değerleri ve çerçeveler, benzetici testleri |
| `sensor-araclari/tests/test_cli.py` | 5, 6 | `capsys`, `monkeypatch`, `unittest.mock` ile istemci testleri |
| `sensor-araclari/ornek-veri/olcumler.csv`, `bozuk.csv`, `rapor.ini` | 5, 6 | Örnek ölçüm verisi ve yapılandırma |
| `bolum-01/ortam_bilgisi.py` | 1 | Yorumlayıcı, `sys.prefix`/`sys.base_prefix`, `sys.path` |
| `bolum-01/requirements.txt` | 1 | `pip freeze` ile sabitlenmiş geliştirme ortamı |
| `bolum-02/ad_baglama.py` | 2 | Ad bağlama, takma ad, yeniden bağlama |
| `bolum-02/sayilar_metin.py` | 2 | `int`, `float`, `str`, `bytes`, f-string biçimleri |
| `bolum-02/komut_esle.py` | 2 | `match` deyimiyle komut ayrıştırma |
| `bolum-03/olcum_ozet.py` | 3 | `namedtuple`, kavramalar, `Counter`, `defaultdict`, `deque` |
| `bolum-03/kopyalama.py` | 3 | Sığ ve derin kopya, `[[]] * 3` tuzağı |
| `bolum-03/karmasiklik.py` | 3 | `timeit` ile list/set/dict ve deque karşılaştırması |
| `bolum-04/ithal_izle.py`, `bolum-04/ayarlar.py` | 4 | `find_spec`, `sys.modules`, `reload`, gölgeleme, `__name__` |
| `bolum-04/kapsam_dekorator.py` | 4 | Argüman türleri, varsayılan değer tuzağı, LEGB, kapanış, dekoratör |
| `bolum-04/siniflar.py` | 4 | Sınıf, `property`, `classmethod`, kalıtım, `Protocol`, `dataclass(order=True)` |
| `bolum-05/guvenli_surec.py` | 5 | `subprocess.run`, hata türleri, kabuk enjeksiyonu, `Popen` boru hattı |
| `bolum-05/dosya_islemleri.py` | 5 | `pathlib`, atomik yazma, kodlama hataları, `contextmanager` |
| `bolum-06/istisna_zinciri.py` | 6 | İstisna yayılması, `raise ... from`, özel istisnalar, `finally` |
| `bolum-06/kayit_ornegi.py` | 6 | Günlükçü hiyerarşisi, düzeyler, `log.exception` |
| `bolum-07/bayt_struct.py` | 7 | `bytearray`, `int.to_bytes`, `struct` bayt sırası ve hizalama, `memoryview` |
| `bolum-07/seri_dongu.py` | 7 | pyserial `loop://`, zaman aşımı davranışı, `read_until` |
| `bolum-07/sanal_cihaz.py` | 7 | pty tabanlı sanal seri port ve benzetici |
| `bolum-07/tcp_sunucu.py`, `bolum-07/tcp_istemci.py` | 7 | `select` tabanlı sunucu, zaman aşımlı istemci, tam uzunlukta okuma |
| `bolum-07/udp_olcum.py` | 7 | UDP datagram gönderme ve alma |
| `bolum-08/veri_deposu.py` | 8 | BitBake veri deposu (`bb.data`) ve `bb.utils`/`oe.utils` doğrudan Python'dan |
| `bolum-08/bbmini/conf/bitbake.conf` | 8 | En küçük BitBake yapılandırması, `addpylib`, `BB_GLOBAL_PYMODULES` |
| `bolum-08/bbmini/classes/base.bbclass`, `ornek-bilgi.bbclass` | 8 | Temel sınıf ve Python görevi `do_bilgi` |
| `bolum-08/bbmini/lib/ornek/` | 8 | Katman kütüphanesi (`BBIMPORTS`, `sensor_listesi`, `ozellik_secimi`) |
| `bolum-08/bbmini/recipes/sensor-oku_1.0.bb` | 8 | Satır içi Python, `def`, override, anonim Python |
| `bolum-08/bbmini/recipes/servis-denetle_1.0.bb` | 8 | Kabuk ve Python görevi, `bb.warn`, `bb.fatal` (bilerek başarısız) |
| `bolum-08/bbmini/recipes/eski-panel_1.0.bb` | 8 | `bb.parse.SkipRecipe` |
| `bolum-08/bbmini/recipes/gunluk-ornek_1.0.bb` | 8 | `print`, `bb.note`, `bb.plain`, `bb.build.exec_func` çıktılarının yeri |
| `bolum-08/bbmini/calistir.sh` | 8 | `BBPATH` ve `PATH` ayarıyla `bitbake` çalıştırma |
| `hepsini-dene.sh` | — | Tüm örnekleri ve testleri çalıştıran betik |

## Sınandığı ortam

- Ubuntu 24.04, Python 3.12.3 (sanal ortam) ve Python 3.13
- pyserial 3.5, pytest 9.2, mypy 2.4 (`mypy src/`: sorun yok)
- BitBake 2.18 (Yocto Project 6.0 *Wrynose* serisi), OpenEmbedded-Core `wrynose` dalı
