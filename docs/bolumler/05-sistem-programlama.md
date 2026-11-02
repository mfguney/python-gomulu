# 5 · Dosyalar, süreçler ve komut satırı araçları

<div class="kunye" markdown>
<span>Süre: ~60 dk + uygulama</span><span>Düzey: Orta</span><span>Ön koşul: Bölüm 4</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - `pathlib` ile dosya yollarını taşınabilir ve okunabilir biçimde işleyebilirsiniz.
    - Dosyaları doğru kip ve kodlamayla açabilir, yarım yazılmış dosya bırakmayan atomik yazma uygulayabilirsiniz.
    - Bağlam yöneticilerinin (`with`) kaynakları nasıl güvenceye aldığını açıklayıp kendi bağlam yöneticinizi yazabilirsiniz.
    - `subprocess` ile dış komutları kabuk enjeksiyonu riski olmadan çalıştırabilir, boru hattı kurabilirsiniz.
    - `argparse` ile yardım metni, seçenek doğrulaması ve anlamlı çıkış kodları olan bir komut satırı aracı yazabilirsiniz.
    - JSON, CSV ve INI biçimlerini okuyup yazabilir, ayar önceliğini ortam değişkenleriyle birlikte tasarlayabilirsiniz.

## 5.1 Dosya yolları: `pathlib`

Linux'ta "her şey bir dosyadır": ölçüm kayıtları, yapılandırma dosyaları, `/sys/class/gpio` altındaki
denetim dosyaları ve `/dev/ttyS0` gibi aygıt düğümleri aynı dosya sistemi arayüzüyle kullanılır. Yolları
metin birleştirerek oluşturmak (`dizin + "/" + ad`) eğik çizgi tekrarı, eksik ayraç ve göreli/mutlak
yol karışıklıklarına yol açar. Standart kütüphanenin `pathlib` modülü yolları nesne olarak ele alır:

```python
from pathlib import Path

veri = Path("/var/lib/sensor-araclari") / "2026-11-02"   # / işleci yol birleştirir
dosya = veri / "sensor0.csv"
dosya.name, dosya.stem, dosya.suffix      # ('sensor0.csv', 'sensor0', '.csv')
dosya.parent                              # PosixPath('/var/lib/sensor-araclari/2026-11-02')
Path("a.tar.gz").suffixes                 # ['.tar', '.gz']
veri.mkdir(parents=True, exist_ok=True)   # mkdir -p karşılığı
sorted(veri.glob("*.csv"))                # bu dizindeki eşleşmeler
list(Path("/var/lib").rglob("*.csv"))     # alt dizinler dahil
dosya.exists(), dosya.is_file(), dosya.stat().st_size
dosya.resolve()                           # sembolik bağlantıları çözülmüş mutlak yol
Path.home() / ".config" / "sensor"        # ~/.config/sensor
```

`Path` nesneleri `open()`, `subprocess.run()`, `os` modülü ve `shutil` fonksiyonlarının hepsine doğrudan
verilebilir. Küçük dosyalar için `read_text()`, `write_text()`, `read_bytes()` ve `write_bytes()`
kısayolları dosyayı açıp kapatma işini de yapar. Çekirdeğin `/sys` ve `/proc` altındaki sanal dosyaları
da bu yolla okunur: `int(Path("/sys/class/thermal/thermal_zone0/temp").read_text())` işlemci
sıcaklığını mili-derece olarak verir (dosyanın varlığı donanıma ve çekirdek yapılandırmasına bağlıdır;
bkz. <a href="../../cekirdek-onyukleme/bolumler/05-kullanici-alani-arayuzleri.html">Çekirdek kitabı, Bölüm 5</a>).

## 5.2 Dosya açma, kip ve kodlama

`open()` fonksiyonu bir dosya nesnesi döndürür. Kip dizgisi iki bilgiyi birleştirir: işlem (`r` okuma,
`w` sıfırdan yazma, `a` sona ekleme, `x` yalnızca dosya yoksa oluşturma, `+` okuma ve yazma) ve tür
(`t` metin, varsayılan; `b` ikili).

| Kip | Dosya yoksa | Dosya varsa | Dönen veri |
|---|---|---|---|
| `"r"` | `FileNotFoundError` | Baştan okunur | `str` |
| `"w"` | Oluşturulur | **İçeriği silinir** | `str` |
| `"a"` | Oluşturulur | Sona eklenir | `str` |
| `"x"` | Oluşturulur | `FileExistsError` | `str` |
| `"rb"`, `"wb"` | Yukarıdakiler gibi | | `bytes` |

**Metin kipinde kodlama her zaman açıkça verilmelidir:** `open(yol, encoding="utf-8")`. Verilmezse
Python yerel ayarın (`locale`) kodlamasını kullanır; aynı betik geliştirici makinesinde UTF-8 ile,
yerel ayarı farklı yapılandırılmış bir CI makinesinde başka bir kodlamayla çalışabilir. `python -X
warn_default_encoding` seçeneği (3.10+) kodlamasız çağrıları uyarıyla bildirir. PEP 686 ile UTF-8
kipinin Python'un ileriki bir sürümünde varsayılan olması kabul edilmiştir; ancak hedef cihazdaki
sürüm ne olursa olsun açık kodlama yazmak en güvenli yoldur.

Kodlaması bilinmeyen veya bozuk baytlar içeren dosyalar için `errors` parametresi davranışı belirler:
`"strict"` (varsayılan) `UnicodeDecodeError` yükseltir, `"replace"` çözülemeyen baytların yerine `�`
koyar, `"surrogateescape"` baytları kayıpsız taşır ve aynı ayarla geri yazıldığında özgün baytları
üretir. Eski bir cihazdan gelen Latin-5 (ISO 8859-9) kodlu bir kayıt dosyası UTF-8 olarak
okunmaya çalışıldığında hata alınır; doğru çözüm kodlamayı tahmin etmek değil, kaynağın kodlamasını
belirleyip açıkça vermektir.

Metin kipinde satır sonları da dönüştürülür: okumada `\r\n` ve `\r` tek `\n` olur. Seri porttan
kaydedilmiş, `\r\n` ile biten satırlar bu nedenle metin kipinde temiz okunur; ikili protokol kayıtları
ise her zaman `"rb"` ile açılmalıdır, aksi halde `0x0D` baytları değişebilir.

Büyük dosyalar `read()` ile tek seferde değil, dosya nesnesi üzerinde döngüyle satır satır okunur.
Dosya nesnesi bir yineleyicidir ve her adımda yalnızca bir satırı belleğe alır.

### Atomik yazma

Gömülü cihazlarda en önemli dosya kuralı, güç kesintisinde yarım yazılmış dosya bırakmamaktır.
`open(yol, "w")` dosyayı önce **boşaltır**; yazma bitmeden enerji giderse yapılandırma dosyası boş
veya yarım kalır ve cihaz bir sonraki açılışta ayarsız başlar. Doğru yöntem, aynı dizinde geçici bir
dosyaya yazmak, veriyi diske zorlamak ve ardından `os.replace()` ile asıl adın üzerine taşımaktır.
POSIX, aynı dosya sistemi içindeki yeniden adlandırmanın atomik olduğunu güvence eder: dosya ya eski
ya yeni içeriğiyle görülür.

```python title="examples/bolum-05/dosya_islemleri.py (kesit)"
def atomik_yaz(hedef: Path, icerik: str) -> None:
    fd, gecici = tempfile.mkstemp(dir=hedef.parent, prefix=f".{hedef.name}.")   # (1)!
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(icerik)
            f.flush()                                                          # (2)!
            os.fsync(f.fileno())
        os.replace(gecici, hedef)                                              # (3)!
    except BaseException:
        os.unlink(gecici)
        raise
```

1.  **Aynı dizin:** Geçici dosya başka bir dosya sisteminde (ör. `/tmp` bir tmpfs ise) oluşturulursa
    yeniden adlandırma atomik olmaz, hatta kopyalamaya dönüşür.
2.  **flush ve fsync:** `flush()` Python'un tamponunu işletim sistemine, `os.fsync()` ise işletim sisteminin
    önbelleğini depolama aygıtına gönderir. İkisi birlikte yapılmadan yeniden adlandırılan dosya, kesintiden
    sonra boş görünebilir. Tam güvence için dizinin de `fsync` edilmesi önerilir.
3.  **os.replace:** Hedef varsa üzerine yazar; `os.rename`'in aksine bu davranış tüm platformlarda aynıdır.

## 5.3 Bağlam yöneticileri ve `with`

Dosya, soket, seri port ve kilit gibi kaynaklar işleri bittiğinde serbest bırakılmalıdır. Bir hata
oluştuğunda da bırakılmalarını güvence altına almak için `try/finally` yazılabilir; `with` deyimi bu
kalıbın kısaltmasıdır:

```python
with open(yol, encoding="utf-8") as f:     # __enter__ çağrılır, dönen değer f'ye bağlanır
    satir = f.readline()
# blok bittiğinde (normal çıkış, return, break veya istisna) __exit__ çağrılır ve dosya kapanır
```

`with` deyimini destekleyen nesneye **bağlam yöneticisi** denir. `__exit__` yöntemi bloktan çıkılırken
her durumda çağrılır ve oluşan istisnayı da parametre olarak alır. Kendi bağlam yöneticisini yazmanın
en kısa yolu `contextlib.contextmanager` dekoratörüdür: `yield` öncesi giriş, sonrası çıkış kodudur.

```python title="examples/bolum-05/dosya_islemleri.py (kesit)"
@contextmanager
def calisma_dizini(yol: Path):
    eski = Path.cwd()
    os.chdir(yol)
    try:
        yield yol
    finally:                  # finally olmadan, blokta istisna olursa eski dizine dönülmezdi
        os.chdir(eski)
```

`contextlib` modülü başka kullanışlı araçlar da sunar: `suppress(FileNotFoundError)` belirli bir
istisnayı yutar (`with suppress(FileNotFoundError): os.unlink(kilit)`); `ExitStack` sayısı çalışma
anında belli olan birden çok kaynağı (birkaç seri port gibi) tek blokta yönetir. pyserial'ın port
nesneleri ve `socket` nesneleri de bağlam yöneticisidir (bkz. [Bölüm 7](07-donanim-iletisim.md)).

## 5.4 Dış komutların çalıştırılması: `subprocess`

Derleme ve test betikleri çoğu zaman başka programları çalıştırır: `git`, `bitbake`, `dtc`, cihaza
dosya kopyalayan `scp`. Python'da bunun için `subprocess` modülü kullanılır. Temel kalıp, komutun
**argüman listesi** olarak verilmesidir:

```python
r = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                   capture_output=True, text=True, check=True, timeout=10, cwd=depo)
surum = r.stdout.strip()
```

| Parametre | Anlamı |
|---|---|
| `capture_output=True` | stdout ve stderr yakalanır (`r.stdout`, `r.stderr`); verilmezse çıktı doğrudan terminale gider |
| `text=True` | Çıktı `bytes` yerine `str` olarak çözülür; gerekirse `encoding="utf-8"` ile birlikte |
| `check=True` | Çıkış kodu 0 değilse `CalledProcessError` yükseltilir |
| `timeout=10` | Süre aşılırsa süreç öldürülür ve `TimeoutExpired` yükseltilir |
| `cwd=`, `env=` | Çalışma dizini ve ortam; `env` verilirse ortamın **tamamının** yerine geçer |
| `input=` | Sürecin standart girdisine yazılacak veri |

Argüman listesiyle çalıştırılan komut **kabuktan geçmez**: Python programı doğrudan başlatır ve her
liste elemanı tek bir argüman olarak iletilir. Boşluk, `;`, `$` veya `*` içeren bir dosya adı olduğu
gibi kalır. `shell=True` verildiğinde ise komut `/bin/sh -c` ile çalışır ve metnin tamamı kabuk
tarafından yorumlanır; dışarıdan gelen bir değer metne eklenmişse ikinci bir komut çalıştırılabilir
(**kabuk enjeksiyonu**). Terminal oturumundaki 5. adım bunu gösterir: `olcum.csv; echo ENJEKSIYON`
adlı bir "dosya" kabukla ikinci bir komut çalıştırır, liste biçiminde ise tek bir argüman olarak kalır.

!!! dikkat "`shell=True` yalnızca sabit komutlarda"
    Kabuk özellikleri (boru, yönlendirme, joker) gerçekten gerekiyorsa ve komut metninin tamamı
    programın içinde sabitse `shell=True` kullanılabilir. Komuta dışarıdan bir değer (kullanıcı girdisi,
    dosya adı, ağdan gelen veri) ekleniyorsa ya liste biçimi kullanılmalı ya da değer `shlex.quote()` ile
    kaçışlanmalıdır. Boru hattı çoğu durumda kabuk olmadan da kurulabilir.

Hata türlerinin ayrımı, betiğin anlamlı bir ileti verebilmesi için önemlidir:

- **`FileNotFoundError`**: Program bulunamadı (`PATH`'te yok); süreç hiç başlamadı.
- **`CalledProcessError`**: Program çalıştı ama sıfırdan farklı kodla bitti (`check=True` ile).
- **`TimeoutExpired`**: Süre doldu; süreç öldürüldü.
- Sinyalle sonlanan süreçte `returncode` negatiftir: `SIGTERM` ile sonlanan süreç için `-15`. Kabuk aynı
  durumu `$?` değişkeninde `128 + 15 = 143` olarak gösterir.

### Boru hattı ve `Popen`

`run()` süreç bitene kadar bekler. Süreçler arasında veri akışı kurmak veya süreç çalışırken çıktısını
okumak için alt düzey `Popen` sınıfı kullanılır. `printf ... | sort` boru hattının kabuk olmadan
kurulması:

```python title="examples/bolum-05/guvenli_surec.py (kesit)"
uretici = subprocess.Popen(["printf", "sensor2\\nsensor0\\nsensor1\\n"], stdout=subprocess.PIPE)
siralayici = subprocess.Popen(["sort"], stdin=uretici.stdout, stdout=subprocess.PIPE, text=True)
uretici.stdout.close()              # sort bitince printf'in SIGPIPE alabilmesi için
cikti, _ = siralayici.communicate(timeout=5)
uretici.wait()
```

<div class="akis" data-senaryo="subprocess-boru"></div>

!!! dikkat "Kilitlenme: boruyu okumadan beklemek"
    `stdout=PIPE` ile başlatılan bir süreç çok çıktı üretirse boru tamponu dolar ve süreç yazmayı
    bekleyerek durur. Ana süreç bu sırada `wait()` ile sürecin bitmesini bekliyorsa iki taraf da
    birbirini bekler. `communicate()` boruları okurken bekler ve bu kilitlenmeyi önler; `stdout` ve
    `stderr`'in ikisi de borulanmışsa yalnızca birini okuyan elle yazılmış döngüler de aynı soruna
    yol açabilir.

<div class="terminal" data-oturum="surec-dosya"></div>

## 5.5 Komut satırı aracı: `argparse`

Bir komut satırı aracının arayüzü üç parçadan oluşur: argümanlar ve seçenekler, standart akışlar ve
çıkış kodu. `argparse` birinci parçayı tanım üzerinden üretir: ayrıştırma, tür dönüşümü, değer
doğrulaması, hata iletisi ve yardım metni.

```python title="examples/sensor-araclari/src/sensor_araclari/cli.py (kesit)"
def arguman_ayristirici() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="sensor-rapor",
        description="Sensör ölçüm dosyalarını (CSV) özetler ve eşik denetimi yapar.",
        epilog="Çıkış kodları: 0 tamam, 1 eşik aşıldı, 2 kullanım hatası, 3 veri hatası.",
    )
    p.add_argument("dosyalar", nargs="+", type=Path, metavar="DOSYA", help="ölçüm dosyası (CSV)")  # (1)!
    p.add_argument("-b", "--bicim", choices=BICIMLER,                                              # (2)!
                   help="çıktı biçimi (ortam: SENSOR_RAPOR_BICIM, varsayılan: tablo)")
    p.add_argument("-e", "--esik", type=float, metavar="DEGER",                                    # (3)!
                   help="bu değeri aşan en büyük ölçüm alarm sayılır")
    p.add_argument("-y", "--yapilandirma", type=Path, metavar="INI")
    grup = p.add_mutually_exclusive_group()                                                        # (4)!
    grup.add_argument("-v", "--ayrintili", action="count", default=0)
    grup.add_argument("-q", "--sessiz", action="store_true")
    p.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    return p
```

1.  **Konumsal argüman:** `nargs="+"` en az bir dosya ister; `type=Path` her değeri `Path` nesnesine çevirir.
2.  **choices:** Geçersiz değerde argparse kullanım iletisini yazar ve **2** koduyla çıkar; programın
    kendi kodu hiç çalışmaz.
3.  **Varsayılan değer verilmemesi:** `--esik` verilmediğinde değer `None` olur. Bu, ortam değişkeni veya
    yapılandırma dosyasından gelecek değerle komut satırının ayırt edilmesini sağlar (5.7).
4.  **Karşılıklı dışlama:** `-v` ve `-q` birlikte verilirse argparse hata verir. `action="count"`, `-vv`
    yazımında değeri 2 yapar.

Birden çok işlevi olan araçlar `git` benzeri alt komutlar için `p.add_subparsers()` kullanır.

**Standart akışların ayrılması:** Aracın asıl çıktısı (tablo, JSON) **stdout**'a, günlük ve hata
iletileri **stderr**'e yazılır. Böylece `sensor-rapor -b json veri.csv > ozet.json` komutu günlük
satırlarını dosyaya karıştırmaz ve `| jq` gibi bir boru hattı bozulmaz.

**Çıkış kodları:** Kod, aracı çağıran kabuk betiğinin, systemd'nin veya CI sisteminin karar vermesini
sağlar. 0 başarı, sıfırdan farklı her değer başarısızlıktır. Kodların anlamı belgelenmeli ve kararlı
tutulmalıdır. `sensor-rapor` dört kod kullanır: 0 tamam, 1 eşik aşıldı, 2 kullanım hatası (argparse'ın
kendi kodu), 3 veri veya dosya hatası. `main()` fonksiyonu kodu döndürür, modülün sonundaki
`sys.exit(main())` onu sürecin çıkış kodu yapar; `[project.scripts]` ile üretilen başlatıcı da aynısını
yapar. Yakalanmayan bir istisna çıkış kodunu 1 yapar ve kullanıcıya traceback gösterir; beklenen
hata durumları bu nedenle `main()` içinde yakalanıp kısa bir iletiye dönüştürülür.

<div class="terminal" data-oturum="sensor-rapor"></div>

## 5.6 Veri biçimleri: JSON, CSV, INI

**JSON** (`json` modülü), Python'un `dict`, `list`, `str`, `int`, `float`, `bool` ve `None` türlerini
doğrudan eşler. `json.dump(veri, f, ensure_ascii=False, indent=2)` Türkçe karakterleri kaçışlamadan,
okunabilir biçimde yazar. Demetler listeye dönüşür; `datetime`, `Path` veya `bytes` gibi türler
doğrudan yazılamaz ve önce metne çevrilmelidir. Python varsayılan olarak `NaN` ve `Infinity` değerlerini
standart dışı biçimde yazar; başka dillerin ayrıştırıcılarıyla uyum gerekiyorsa `allow_nan=False`
verilir ve bu durumda `ValueError` alınır.

**CSV** (`csv` modülü) dosyaları `newline=""` ile açılmalıdır; tırnak içindeki satır sonlarını ve
`\r\n` dönüşümünü modülün kendisi yönetir. `csv.reader` her satırı metin listesi olarak verir;
`csv.DictReader` başlık satırını anahtar olarak kullanır. Değerler her zaman `str`'dir ve sayıya
çevrilmeleri programa aittir. Kitabın `dosya_oku()` fonksiyonu başlık satırını doğrular, `#` ile
başlayan açıklama satırlarını atlar ve her satırı numarasıyla birlikte ayrıştırır.

**INI** (`configparser` modülü) bölümlü anahtar-değer dosyalarını okur. Değerler metindir; `getint`,
`getfloat` ve `getboolean` yöntemleri dönüşüm yapar (`getboolean` `yes/no`, `on/off`, `1/0`,
`true/false` kabul eder). `[DEFAULT]` bölümündeki anahtarlar tüm bölümlere kalıtılır. Varsayılan
`ConfigParser` `%(ad)s` biçiminde değer içi başvuruları genişletir; bu nedenle değerde tek bir `%`
bulunması `InterpolationSyntaxError` verir. Bu davranış istenmiyorsa `ConfigParser(interpolation=None)`
kullanılır.

```ini title="examples/sensor-araclari/ornek-veri/rapor.ini"
[rapor]
bicim = tablo
esik = 30.0
```

`ini.read(yol)` okunamayan dosyaları hata vermeden atlar ve okunan dosyaların listesini döndürür.
`sensor-rapor` bu dönüş değerini kullanır: varsayılan `/etc/sensor-araclari/rapor.ini` yoksa sessizce
devam eder, ancak `-y` ile açıkça verilen dosya okunamazsa hata verir. TOML biçimi için 3.11'den
itibaren standart kütüphanede salt okunur `tomllib` modülü bulunur.

## 5.7 Ortam değişkenleri ve ayar önceliği

`os.environ`, sürecin ortam değişkenlerini metin değerli bir sözlük olarak sunar. `os.environ.get("AD",
"varsayılan")` güvenli okuma, `os.environ["AD"] = "değer"` ise bundan sonra başlatılacak alt süreçler
için ayar yapar. Ortam değişkenleri, kodu değiştirmeden davranışı ayarlamanın standart yoludur:
systemd servis dosyasındaki `Environment=` satırı, CI sistemlerinin değişkenleri ve kapsayıcı
yapılandırmaları bu yolla iletilir.

Bir aracın ayarlarının hangi sırayla değerlendirileceği açıkça tasarlanmalıdır. Yaygın ve sezgisel
sıra, kullanıcıya en yakın kaynağın kazanmasıdır:

```mermaid
flowchart LR
    A["Komut satırı<br/>-b json"] -->|yoksa| B["Ortam değişkeni<br/>SENSOR_RAPOR_BICIM"]
    B -->|yoksa| C["Yapılandırma dosyası<br/>/etc/sensor-araclari/rapor.ini"]
    C -->|yoksa| D["Varsayılan<br/>tablo"]
```

`sensor-rapor` bu sırayı tek satırda uygular:
`bicim = arg.bicim or os.environ.get("SENSOR_RAPOR_BICIM") or bolum.get("bicim", "tablo")`. Bu
yazımın çalışması için argparse seçeneğinin varsayılan değeri bilerek `None` bırakılmıştır.
`or` zinciri boş metni de "yok" saydığından, sayısal ayarlarda (`0` geçerli bir değer olabilir)
`is None` denetimi kullanılır.

## 5.8 Yocto bağlantısı

Bu bölümdeki araçların Yocto'da üç karşılığı vardır:

- **BitBake görevlerinde dış komut:** Python görevlerinde `subprocess` doğrudan kullanılabilir; BitBake
  ayrıca çıktıyı görev günlüğüne yönlendiren `bb.process.run()` yardımcısını sunar. Yol işlemleri için
  OE-Core'un `oe.path` modülü kullanılır (bkz. [Bölüm 8](08-bitbake-python.md)).
- **Komut satırı aracının paketlenmesi:** `[project.scripts]` girdisi, Yocto'nun Python sınıflarıyla
  paketlendiğinde hedefte `/usr/bin/sensor-rapor` başlatıcısını üretir. Başlatıcının shebang satırı hedefin
  `python3` yorumlayıcısını gösterir; tarifte `RDEPENDS:${PN}` içinde `python3-core` bulunmalıdır.
- **Servis olarak çalıştırma:** Araç bir systemd servisiyle çalıştırıldığında çıkış kodu servisin
  durumunu belirler; `Environment=LOG_DUZEYI=DEBUG` gibi ayarlar ortam değişkeni olarak gelir.
  Servis dosyasının paketlenmesi ve denetlenmesi
  <a href="../../yocto-gomulu-linux/bolumler/08-siniflar.html">Yocto kitabı, Bölüm 8</a>'deki
  `ornek-servis` sınıfında ele alınır.

!!! lab "Uygulama 5.1 · Komut satırı aracının sınanması"
    Sanal ortam etkinken `~/ornekler/sensor-araclari` dizininde:

    1. `sensor-rapor --help` çıktısını kaynaktaki `add_argument` satırlarıyla karşılaştırın.
    2. Eşik denetimini üç farklı kaynaktan verin ve önceliği doğrulayın:

        ```bash
        sensor-rapor -y ornek-veri/rapor.ini ornek-veri/olcumler.csv; echo $?            # 1 (dosyadan esik=30)
        sensor-rapor -y ornek-veri/rapor.ini -e 35 ornek-veri/olcumler.csv; echo $?      # 0 (komut satırı kazanır)
        ```

    3. Çıktının stdout'a, günlüklerin stderr'e gittiğini doğrulayın:

        ```bash
        sensor-rapor -v -b json ornek-veri/olcumler.csv 2>/dev/null | python -m json.tool
        sensor-rapor -v ornek-veri/olcumler.csv 2>&1 >/dev/null
        ```

    4. `python ../bolum-05/guvenli_surec.py` çıktısındaki 5. adımı inceleyin ve `shell=True` satırında
       `dosya` değişkeni `shlex.quote(dosya)` ile değiştirildiğinde sonucun nasıl değiştiğini deneyin.

## Özet

- `pathlib.Path` yolları nesne olarak ele alır; `/` ile birleştirme, `glob` ve `read_text` gibi kısayollar sunar.
- Metin kipinde kodlama her zaman açıkça verilir; ikili veriler `"rb"`/`"wb"` ile işlenir.
- Kalıcı dosyalar geçici dosyaya yazılıp `fsync` sonrası `os.replace` ile atomik olarak değiştirilir.
- `with` deyimi kaynakların her durumda serbest bırakılmasını sağlar; `contextmanager` ile kısa bağlam yöneticileri yazılır.
- `subprocess.run` argüman listesiyle kullanılır; `check`, `timeout` ve `capture_output` temel seçeneklerdir.
- `shell=True` ile dışarıdan gelen değer birleştirmek kabuk enjeksiyonuna yol açar.
- Boru hattında `communicate()` kullanılır; ana süreç kendi boru ucunu kapatır.
- `argparse` yardım, doğrulama ve 2 kodlu kullanım hatası üretir; veri stdout'a, günlük stderr'e yazılır.
- Ayar önceliği açıkça tasarlanır: komut satırı > ortam değişkeni > dosya > varsayılan.

## Değerlendirme soruları

<div class="quiz" data-id="b05-1">
<p class="quiz-soru">Cihazın yapılandırma dosyasını güvenle güncellemek için doğru yöntem hangisidir?</p>
<ul>
<li><code>open(yol, "w")</code> ile açıp yeni içeriği yazmak</li>
<li><code>open(yol, "a")</code> ile yeni ayarları sona eklemek</li>
<li data-dogru>Aynı dizinde geçici dosyaya yazıp <code>flush</code> ve <code>os.fsync</code> sonrası <code>os.replace</code> ile asıl dosyanın yerine koymak</li>
<li>Önce asıl dosyayı silip sonra yeni dosyayı yazmak</li>
</ul>
<p class="quiz-aciklama"><code>"w"</code> kipi dosyayı hemen boşaltır; kesinti olursa dosya boş kalır. Aynı dosya sistemindeki yeniden adlandırma atomiktir:
dosya ya eski ya yeni içeriğiyle görülür.</p>
</div>

<div class="quiz" data-id="b05-2">
<p class="quiz-soru"><code>subprocess.run(f"tar czf yedek.tgz {dosya}", shell=True)</code> satırındaki <code>dosya</code> değeri ağdan gelmektedir. Temel risk nedir?</p>
<ul>
<li>tar komutunun yavaş çalışması</li>
<li data-dogru>Değer kabuk tarafından yorumlandığından <code>; rm -rf ...</code> gibi eklerle ikinci bir komut çalıştırılabilmesi</li>
<li>Çıktının <code>bytes</code> olarak dönmesi</li>
<li>Çıkış kodunun her zaman 0 olması</li>
</ul>
<p class="quiz-aciklama">Kabuk enjeksiyonu riskidir. Doğru yazım <code>subprocess.run(["tar", "czf", "yedek.tgz", dosya], check=True)</code> biçimindedir;
liste elemanları kabuktan geçmeden tek argüman olarak iletilir.</p>
</div>

<div class="quiz" data-id="b05-3">
<p class="quiz-soru"><code>subprocess.run(["olmayan-komut"], check=True)</code> çağrısı hangi istisnayı yükseltir?</p>
<ul>
<li><code>CalledProcessError</code></li>
<li data-dogru><code>FileNotFoundError</code></li>
<li><code>TimeoutExpired</code></li>
<li>İstisna yükseltilmez; <code>returncode</code> 127 olur</li>
</ul>
<p class="quiz-aciklama">Program bulunamadığında süreç hiç başlamaz ve <code>FileNotFoundError</code> yükseltilir. 127 kodu, komutu kabuk çalıştırdığında
(<code>shell=True</code>) kabuğun verdiği koddur. <code>CalledProcessError</code> yalnızca çalışan programın sıfırdan farklı kodla bitmesinde yükseltilir.</p>
</div>

<div class="quiz" data-id="b05-4">
<p class="quiz-soru">argparse ile tanımlanmış bir araca <code>choices</code> dışında bir değer verildiğinde ne olur?</p>
<ul>
<li>Değer kabul edilir ve programın içinde denetlenmesi gerekir</li>
<li>Program 1 koduyla çıkar</li>
<li data-dogru>argparse kullanım iletisini ve hatayı stderr'e yazar, program 2 koduyla çıkar</li>
<li><code>ValueError</code> traceback'i gösterilir</li>
</ul>
<p class="quiz-aciklama">argparse ayrıştırma hatalarında <code>SystemExit(2)</code> yükseltir. Bu kod Unix araçlarında yaygın olarak "kullanım hatası" anlamında kullanılır.</p>
</div>

<div class="quiz" data-id="b05-5">
<p class="quiz-soru">Bir aracın JSON çıktısının <code>| jq</code> ile işlenebilmesi için günlük iletileri nereye yazılmalıdır?</p>
<ul>
<li>stdout'a, JSON'dan önce</li>
<li data-dogru>stderr'e</li>
<li>Yalnızca bir günlük dosyasına; terminale hiç yazılmamalı</li>
<li>stdout'a, JSON'un içine <code>"log"</code> anahtarıyla</li>
</ul>
<p class="quiz-aciklama">Boru yalnızca stdout'u bağlar. Veri stdout'ta, tanılama iletileri stderr'de tutulduğunda çıktı bozulmadan işlenir ve
iletiler yine de terminalde görülür.</p>
</div>

!!! alistirma "Alıştırma: Toplu rapor betiği"
    Ağ geçidi her gün bir dizine birden çok ölçüm dosyası bırakmaktadır. Bir dizindeki tüm `*.csv`
    dosyalarını `sensor-rapor` ile özetleyen ve sonucu tek bir JSON dosyasında toplayan `rapor_topla.py`
    betiği yazılacaktır.

    1. Her dosya için `sensor-rapor -q -b json -e 30 DOSYA` komutunu `subprocess.run` ile çalıştırın.
    2. Çıkış kodunu yorumlayın: 0 ve 1 durumunda çıktıyı kullanın (1 ise dosyayı alarm listesine ekleyin),
       diğer kodlarda dosyayı hatalı listesine ekleyin ve stderr'i iletiye katın.
    3. Toplu sonucu atomik olarak yazın.
    4. Betiğin kendi çıkış kodu: hatalı dosya varsa 3, yoksa alarm varsa 1, değilse 0 olsun.

    ??? success "Örnek çözüm"
        ```python
        import json, os, subprocess, sys, tempfile
        from pathlib import Path

        def atomik_yaz(hedef: Path, icerik: str) -> None:
            fd, gecici = tempfile.mkstemp(dir=hedef.parent, prefix=f".{hedef.name}.")
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(icerik); f.flush(); os.fsync(f.fileno())
            os.replace(gecici, hedef)

        def main(dizin: str, cikti: str, esik: str = "30") -> int:
            sonuc, alarm, hatali = {}, [], []
            for yol in sorted(Path(dizin).glob("*.csv")):
                r = subprocess.run(["sensor-rapor", "-q", "-b", "json", "-e", esik, str(yol)],
                                   capture_output=True, text=True, timeout=30)
                if r.returncode in (0, 1):                 # 1: eşik aşıldı, çıktı yine geçerli
                    sonuc[yol.name] = json.loads(r.stdout)
                    if r.returncode == 1:
                        alarm.append(yol.name)
                else:                                      # 2 veya 3: dosya işlenemedi
                    hatali.append(yol.name)
                    print(f"{yol.name}: kod {r.returncode}: {r.stderr.strip()}", file=sys.stderr)
            atomik_yaz(Path(cikti), json.dumps({"dosyalar": sonuc, "alarm": alarm, "hatali": hatali},
                                               ensure_ascii=False, indent=2) + "\n")
            print(f"{len(sonuc)} dosya özetlendi, {len(alarm)} alarm, {len(hatali)} hatalı")
            return 3 if hatali else (1 if alarm else 0)

        if __name__ == "__main__":
            sys.exit(main(*sys.argv[1:]))
        ```
        `olcumler.csv` ve `bozuk.csv` dosyalarını içeren bir dizinde çalıştırıldığında:
        ```text
        bozuk.csv: kod 3: 00:12:31 ERROR   sensor_araclari.cli: satır 3: sayı değil: 'yirmi'
        1 dosya özetlendi, 1 alarm, 1 hatalı
        ```
        Betiğin çıkış kodu 3'tür. `check=True` kullanılmamıştır, çünkü 1 kodu bu araç için hata değil,
        anlamlı bir sonuçtur; kodlar tek tek yorumlanmıştır. `-q` seçeneği uyarı düzeyindeki eşik
        iletisini bastırır, hata iletileri yine stderr'den alınır. `sensor-rapor` komutunun `PATH`'te
        bulunması için sanal ortam etkin olmalı ya da komut tam yoluyla verilmelidir.

**Sonraki bölüm:** [6 · Hata yönetimi, test ve günlük kaydı →](06-hata-test-kayit.md)
