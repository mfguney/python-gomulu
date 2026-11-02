# 8 · BitBake ve Yocto'da Python

<div class="kunye" markdown>
<span>Süre: ~60 dk + uygulama</span><span>Düzey: Orta–İleri</span><span>Ön koşul: Bölüm 1–6; Yocto kitabı, Bölüm 5</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - BitBake'in Python ile nasıl yazıldığını ve metadata içindeki Python kodunun hangi biçimlerde bulunduğunu açıklayabilirsiniz.
    - Veri deposu nesnesi `d` üzerinde `getVar`, `setVar`, `appendVar` ve bayrak işlemlerini doğru kullanabilirsiniz.
    - `${@...}` satır içi Python ifadesinin ne zaman ve hangi bağlamda değerlendirildiğini açıklayabilirsiniz.
    - Python görevleri (`python do_...`) ve anonim Python işlevleri (`python () {}`) yazabilir, aralarındaki zamanlama farkını açıklayabilirsiniz.
    - `bb.utils.contains`, `oe.utils` yardımcıları ve `bb.note`/`bb.warn`/`bb.fatal` ile okunabilir ve sağlam metadata yazabilirsiniz.
    - Python kodunu katman kütüphanesine (`addpylib`) taşıyıp metadata'dan çağırabilirsiniz.

## 8.1 BitBake bir Python programıdır

Yocto Project'in derleme motoru BitBake, baştan sona Python ile yazılmıştır. `bitbake` komutu bir
istemcidir; asıl işi arka planda başlatılan `bitbake-server` süreci (cooker) yapar ve görevler
`bitbake-worker` süreçlerinde çalıştırılır. Ayrıştırıcı (`bb.parse`), veri deposu
(`bb.data_smart`), görev kuyruğu (`bb.runqueue`), kaynak getiriciler (`bb.fetch2`) ve önbellek
mekanizmasının tamamı `bitbake/lib/bb/` altındaki sıradan Python modülleridir.

Bu mimarinin metadata yazarı için iki sonucu vardır. Birincisi, metadata içinde Python kodu doğrudan
çalıştırılabilir; bu kod BitBake'in kendi süreçlerinde, onun veri yapılarına erişerek çalışır. İkincisi,
BitBake derleme makinesinin Python'uyla çalıştığı için metadata'daki Python kodu da o sürümün
kurallarına uyar. Yocto Project 6.0 *Wrynose* ile gelen BitBake 2.18, açılışta en az Python 3.9
ister (`bb/__init__.py` içindeki denetim). Birçok derleme makinesi daha yeni bir Python kullansa da
katmanların paylaşıldığı ortamlarda 3.10 ile gelen `match` deyimi gibi özellikler metadata'da
kullanılmamalıdır.

Metadata içindeki Python kodu beş biçimde bulunur:

| Biçim | Söz dizimi | Ne zaman çalışır | Tipik kullanım |
|---|---|---|---|
| Satır içi Python | `X = "${@ifade}"` | Değişken genişletildiğinde (`:=` ile ayrıştırma anında bir kez) | Koşullu değer üretmek |
| Python görevi | `python do_ad() { ... }` | Görev yürütülürken, `bitbake-worker` içinde | Derleme adımı, denetim |
| Anonim Python | `python () { ... }` | Her tarifin ayrıştırılmasının sonunda | Değişken hesaplama, tarif atlama, bağımlılık ekleme |
| Python fonksiyonu | `def ad(d): ...` | Çağrıldığında | Yardımcı kod |
| Olay işleyici | `python ad() { ... }` + `addhandler ad` | BitBake olayı oluştuğunda | Derleme istatistikleri, uyarılar |

Bunlara ek olarak katmanın `lib/` dizinindeki Python paketleri `addpylib` yönergesiyle yüklenir (8.7).
Bu bölümdeki örnekler, OE-Core olmadan çalışan küçük bir BitBake projesiyle (`examples/bolum-08/bbmini`)
gerçekten çalıştırılmıştır. Proje yalnızca BitBake kaynak ağacına ihtiyaç duyar:

```bash
git clone -b 2.18 https://git.openembedded.org/bitbake ~/bitbake
cd ~/ornekler/bolum-08/bbmini
export BBPATH=$PWD PATH=~/bitbake/bin:$PATH
bitbake sensor-oku -c bilgi
```

## 8.2 Veri deposu ve `d` nesnesi

BitBake'in tüm değişkenleri bir **veri deposunda** tutulur. Python kodunda bu depo `d` adıyla görülür
ve `bb.data_smart.DataSmart` sınıfının bir örneğidir. Yapılandırma dosyaları genel depoyu oluşturur;
her tarif bu deponun bir kopyası üzerinde ayrıştırılır (bkz.
<a href="../../yocto-gomulu-linux/bolumler/05-bitbake-dili.html">Yocto kitabı, Bölüm 5</a>). Görevler de
tarifin deposunun ayrı bir kopyasıyla çalışır; bir görevde yapılan `setVar` başka bir görevi etkilemez.

| Çağrı | Anlamı |
|---|---|
| `d.getVar("X")` | Genişletilmiş değer (`str`); değişken tanımlı değilse `None` |
| `d.getVar("X", False)` veya `expand=False` | Genişletilmemiş, ham değer |
| `d.setVar("X", "değer")` | Atama (`=` karşılığı; değer tembel genişletilir) |
| `d.appendVar("X", " ek")` / `d.prependVar(...)` | Sona / başa ekleme; boşluk eklenmez |
| `d.delVar("X")` | Değişkeni siler |
| `d.getVarFlag("do_install", "dirs")` | Bayrak değeri (`do_install[dirs]`) |
| `d.setVarFlag(...)`, `d.appendVarFlag(...)` | Bayrak atama ve ekleme |
| `d.getVarFlags("X")` | Değişkenin tüm bayrakları (sözlük) |
| `d.expand("${PN}-${PV}")` | Bir metindeki başvuruları genişletir; tanımsız başvurular olduğu gibi kalır |
| `bb.data.createCopy(d)` | Bağımsız bir kopya |

`getVar` her zaman metin veya `None` döndürür. Bölüm 2'de belirtildiği gibi BitBake'te her şey
metindir: sayısal karşılaştırma için `int(d.getVar("PARALLEL_MAKE_SAYISI"))` gibi açık dönüşüm, liste
işlemi için `.split()` gerekir. Değişken tanımlı olmayabilecekse `(d.getVar("X") or "").split()`
kalıbı `AttributeError` hatasını önler.

Veri deposu BitBake çalıştırılmadan, doğrudan Python'dan da kullanılabilir. `examples/bolum-08/veri_deposu.py`
betiği bir depo oluşturur ve bu bölümde anlatılan tüm davranışları sırayla gösterir:

```python title="examples/bolum-08/veri_deposu.py (kesit)"
sys.path.insert(0, os.path.join(bitbake, "lib"))
import bb.data, bb.utils

d = bb.data.init()
d.setVar("PN", "sensor-oku")
d.setVar("PV", "1.0")
d.setVar("BP", "${PN}-${PV}")
d.getVar("BP")                    # 'sensor-oku-1.0'
d.getVar("BP", expand=False)      # '${PN}-${PV}'
d.setVar("PV", "1.1")
d.getVar("BP")                    # 'sensor-oku-1.1': tembel genişletme
```

<div class="terminal" data-oturum="veri-deposu"></div>

## 8.3 Genişletme ve satır içi Python

`d.getVar("SERVIS")` çağrısı ham değeri alır, override ve `:append`/`:prepend`/`:remove` işlemlerini
uygular, ardından metindeki `${VAR}` başvurularını özyinelemeli olarak, `${@...}` ifadelerini ise
Python ile değerlendirerek yerine koyar. Aşağıdaki animasyon `SERVIS` değişkeninin genişletilmesini
adım adım gösterir:

<div class="akis" data-senaryo="getvar-genisletme"></div>

Satır içi Python ifadesinin kuralları:

- **Tek bir ifadedir**, deyim değildir: `${@x if a else y}` geçerli, `${@if a: x}` geçersizdir. Çok
  satırlı mantık bir `def` fonksiyonuna taşınır ve ifadeden çağrılır.
- İfadenin bağlamında `d` (veri deposu) ve `bb` hazırdır. OE-Core `BB_GLOBAL_PYMODULES = "os sys time"`
  tanımladığı için bu üç modül de içe aktarma gerekmeden kullanılabilir. `addpylib` ile yüklenen
  paketler (`oe`) ve metadata'da `def` ile tanımlanmış fonksiyonlar da erişilebilirdir.
- Sonuç metne çevrilir: `${@None}` boş metin değil, `None` metnini üretir. Koşul sağlanmadığında boş
  değer gerekiyorsa ifade açıkça `''` döndürmelidir.
- `=` ile atanmış bir değişkendeki ifade **her genişletmede** yeniden çalışır; `:=` ile atanmışsa
  ayrıştırma anında bir kez çalışır ve sonuç sabitlenir. Yocto kitabının 5. bölümündeki
  `DERLEME_TARIHI := "${@time.strftime('%Y%m%d', time.gmtime())}"` örneği, değerin tüm derleme boyunca
  aynı kalması için `:=` kullanır.
- İfadede oluşan bir hata `bb.data_smart.ExpansionError` olarak bildirilir; ileti hangi değişkenin, hangi
  ifadenin ve hangi Python istisnasının sorun çıkardığını içerir. Kendine başvuran bir değişken
  (`P = "${P} ek"`) aynı mekanizmayla "variable P references itself!" hatasını verir.

!!! dikkat "Satır içi Python yan etkisiz olmalıdır"
    Bir değişkenin kaç kez ve hangi sırayla genişletileceği BitBake'in iç işleyişine bağlıdır: imza
    hesabı, önbellek, `bitbake -e` ve her görev aynı değişkeni yeniden genişletebilir. `${@...}` içinde
    dosya yazmak, `d.setVar` çağırmak veya ağ erişimi yapmak öngörülemeyen sonuçlar doğurur. Ayrıştırma
    sırasında bir dosyanın içeriğini okumak da önbelleği yanıltabilir: BitBake o dosyanın değiştiğini
    bilmez ve tarifi yeniden ayrıştırmaz. Görevin bir dosyaya bağımlılığı `do_gorev[file-checksums]`
    bayrağıyla bildirilmelidir.

## 8.4 Koşul yardımcıları: `bb.utils` ve `oe.utils`

Metadata'da en sık yazılan Python ifadeleri, bir listenin belirli bir kelimeyi içerip içermediğine
göre değer seçer. Bu işi yapan hazır fonksiyonlar, elle yazılmış koşullardan hem daha kısa hem de daha
doğrudur (tam kelime eşleşmesi, `None` güvenliği):

| Fonksiyon | Döndürdüğü | Örnek |
|---|---|---|
| `bb.utils.contains(var, kelimeler, doğru, yanlış, d)` | Kelimelerin **tümü** varsa `doğru` | `${@bb.utils.contains('DISTRO_FEATURES', 'systemd', 'a.service', 'a.init', d)}` |
| `bb.utils.contains_any(var, kelimeler, doğru, yanlış, d)` | Kelimelerden **biri** varsa `doğru` | `contains_any('DISTRO_FEATURES', 'x11 wayland', ...)` |
| `bb.utils.filter(var, kelimeler, d)` | Değişkende bulunan kelimeler (sıralı, boşlukla birleşik) | `filter('DISTRO_FEATURES', 'ipv6 wifi', d)` → `'ipv6'` |
| `bb.utils.to_boolean(metin)` | `"1"`, `"yes"`, `"true"` → `True`; `"0"`, `"no"`, `"false"` → `False` | Bilinmeyen metinde `ValueError` |
| `oe.utils.conditional(var, değer, doğru, yanlış, d)` | Değişken tam olarak `değer` ise `doğru` | `conditional('INIT_MANAGER', 'systemd', ...)` |
| `oe.utils.vartrue(var, doğru, yanlış, d)` | Değişken `oe.types.boolean` ile doğruysa `doğru` | `vartrue('DEBUG_BUILD', '-O0', '-O2', d)` |
| `oe.utils.all_distro_features(d, kelimeler, doğru="1", yanlış="")` | `contains('DISTRO_FEATURES', ...)` kısaltması | |
| `oe.utils.any_distro_features(d, kelimeler, ...)` | `contains_any('DISTRO_FEATURES', ...)` kısaltması | |

`bb.utils.contains` fonksiyonunun kaynağı [Bölüm 3](03-veri-yapilari.md)'te incelenmiştir: değeri
kümeye çevirir ve alt küme denetimi yapar. Son parametrenin `d` olduğu unutulmamalıdır; bu fonksiyonlar
değişkenin **adını** alır ve değeri kendileri okur. `bb.utils.contains(d.getVar('DISTRO_FEATURES'), ...)`
yazımı yanlıştır: değerin kendisi değişken adı olarak aranır.

## 8.5 Python görevleri

Bir görev, `python` önekiyle tanımlandığında Python kodu olarak yürütülür. `addtask` görevi zincire
yerleştirir; bayraklar çalışma koşullarını belirler. Örnek projenin sınıfı:

```bitbake title="examples/bolum-08/bbmini/classes/ornek-bilgi.bbclass"
BILGI_DEGISKENLERI ?= "PN PV PF OVERRIDES"

python do_bilgi() {
    for ad in d.getVar("BILGI_DEGISKENLERI").split():
        bb.plain("%-12s = %s" % (ad, d.getVar(ad)))
    bb.plain("%-12s = %s" % ("SERVIS (ham)", d.getVar("SERVIS", expand=False)))
    bb.note("çalışma dizini: %s" % os.path.relpath(os.getcwd(), d.getVar("TOPDIR")))
}
do_bilgi[doc] = "Seçilen değişkenlerin değerlerini yazdırır"
do_bilgi[nostamp] = "1"
do_bilgi[dirs] = "${B}"
addtask bilgi before do_build
```

Görev gövdesi, BitBake tarafından `def do_bilgi(d):` biçiminde bir fonksiyona dönüştürülür ve
`do_bilgi(d)` olarak çağrılır; bu dönüştürülmüş kod görevin `temp/run.do_bilgi.<pid>` dosyasında
görülür. Görev sırasında:

- `OVERRIDES` değişkeninin başına `task-<görev>` eklenir (`task-bilgi:agecidi:ornekos`); böylece
  `X:task-install = "..."` gibi göreve özgü değerler yazılabilir.
- `[dirs]` bayrağındaki dizinler oluşturulur ve sonuncusu çalışma dizini yapılır; `[cleandirs]` dizini
  önce boşaltır.
- `[nostamp]` görevin damga dosyası yazılmasını engeller; görev her istendiğinde yeniden çalışır.
- Görev bir istisnayla sonlanırsa başarısız sayılır. Dönüş değeri kullanılmaz.

Python görevinden bir kabuk fonksiyonu çalıştırmak için `bb.build.exec_func("kabuk_isi", d)` kullanılır.
Kabuk görevlerinde `${...}` başvuruları görev çalışmadan **önce** BitBake tarafından genişletilir ve
oluşan betik `run.do_<görev>` dosyasına yazılır; terminal oturumundaki `run.do_uret` çıktısı bunu
gösterir. Python görevlerinde ise değerler kod çalışırken `d.getVar` ile okunur.

### Günlük ve hata fonksiyonları

| Fonksiyon | `logging` karşılığı | Konsolda görünür mü? | Etkisi |
|---|---|---|---|
| `bb.debug(düzey, ...)` | DEBUG | `bitbake -D` ile | Ayrıntılı iz |
| `bb.note(...)` | INFO | Yalnızca ayrıntılı kipte; görev günlüğüne yazılır | Bilgi |
| `bb.plain(...)` | (özel düzey) | Evet, öneksiz | Kullanıcıya doğrudan çıktı |
| `bb.warn(...)` | WARNING | Evet, `WARNING:` önekiyle | Derleme sürer; özet satırında sayılır |
| `bb.error(...)` | ERROR | Evet | Derleme sürer ancak sonuç başarısız sayılır |
| `bb.fatal(...)` | CRITICAL + istisna | Evet, `ERROR:` önekiyle | `bb.BBHandledException` yükseltir; görev veya ayrıştırma durur |

Bu fonksiyonlar BitBake'in `BitBake.Main` adlı `logging` günlükçüsünü kullanan ince sarmalayıcılardır
([Bölüm 6](06-hata-test-kayit.md)). İki ayrıntı sık hata kaynağıdır: fonksiyonlar argümanlarını
**boşluksuz birleştirir** ve `%` biçimlendirmesi yapmaz (`bb.note("PN:", pn)` → `PN:sensor-oku`);
biçimli ileti için `bb.note("PN: %s" % pn)` yazılır. Python görevinde `print()` ile yazılan metin ise
konsola değil, yalnızca görev günlüğüne gider.

<div class="terminal" data-oturum="bitbake-python"></div>

## 8.6 Anonim Python işlevleri

`python () { ... }` (veya `python __anonymous () { ... }`) biçiminde adsız tanımlanan işlevler, her
tarifin ayrıştırılması **bittikten sonra** çalışır. Bir tarifte veya devraldığı sınıflarda birden çok
anonim işlev varsa tanım sırasıyla çalışırlar. BitBake belgesinin belirttiği önemli bir ayrıntı, override
ve `:append` gibi işlemlerin anonim işlevlerden **önce** uygulanmasıdır; bu nedenle anonim işlevde
yapılan `d.setVar("FOO", ...)` ataması, daha önceki `FOO:append` satırlarının etkisini de ortadan
kaldırır.

```bitbake title="examples/bolum-08/bbmini/recipes/sensor-oku_1.0.bb (kesit)"
ARALIK ??= "5"

python () {
    aralik = d.getVar("ARALIK")
    if not aralik.isdigit():
        bb.fatal("ARALIK bir tamsayı olmalı, '%s' verildi" % aralik)
    d.setVar("ARALIK_MS", str(int(aralik) * 1000))
    d.appendVar("ETIKETLER", " anonim")
}
```

Anonim işlevlerin başlıca kullanımları:

1. **Türetilmiş değişken hesaplama:** Başka değişkenlerden hesaplanan ve satır içi ifadeye sığmayan değerler.
2. **Yapılandırma doğrulama:** Geçersiz bir ayarda `bb.fatal` ile ayrıştırma aşamasında, derleme başlamadan
   durmak. Hata ne kadar erken bildirilirse o kadar az zaman kaybedilir.
3. **Tarifi atlama:** `raise bb.parse.SkipRecipe("neden")` tarifi bu yapılandırma için devre dışı bırakır.
   OE-Core'un `features_check` sınıfı `REQUIRED_DISTRO_FEATURES` denetimini bu yolla yapar; örnek
   projedeki `eski-panel` tarifi de aynı yöntemle atlanır.
4. **Dinamik bağımlılık:** OE-Core'un `devicetree.bbclass` sınıfı, `KERNEL_INCLUDE` tanımlıysa
   `d.appendVarFlag("do_compile", "depends", " virtual/kernel:do_configure")` ile göreve bağımlılık ekler.

Ayrıştırma ve görev aşamalarının sırası ve her aşamada çalışan Python kodu aşağıdaki animasyonda
gösterilmiştir:

<div class="akis" data-senaryo="bitbake-zamanlama"></div>

!!! dikkat "Anonim işlevler her tarifte çalışır"
    `INHERIT` ile genel olarak devralınan bir sınıftaki anonim işlev, katmanlardaki her tarifin
    ayrıştırılmasında, yani binlerce kez çalışır. Bu işlevlerde dosya sistemi taraması, alt süreç
    çalıştırma veya ağ erişimi gibi yavaş işlemler ayrıştırma süresini belirgin biçimde uzatır. Pahalı
    işlemler mümkünse görev zamanına ertelenmelidir.

`bitbake-getvar` aracı anonim işlevlerin etkisini de kaydeder. Terminal oturumundaki `ETIKETLER`
geçmişinde `d.appendVar` çağrısı, anonim işlevin dahili adıyla birlikte ayrı bir işlem olarak görülür.

## 8.7 Fonksiyonlar ve katman kütüphaneleri

Metadata'da `def` ile tanımlanan fonksiyonlar sıradan Python fonksiyonlarıdır; `d` parametresini açıkça
alırlar ve satır içi ifadelerden, görevlerden ve diğer fonksiyonlardan çağrılabilirler:

```bitbake title="examples/bolum-08/bbmini/recipes/sensor-oku_1.0.bb (kesit)"
def ozet_metni(d):
    return "%s-%s / %s" % (d.getVar("PN"), d.getVar("PV"), d.getVar("MACHINE"))

OZET = "${@ozet_metni(d)}"
```

Birden çok tarifin ve sınıfın kullandığı veya birkaç satırı aşan Python kodu, katmanın `lib/` dizininde
bir paket olarak tutulmalıdır. OE-Core'un kendisi bu yöntemi kullanır: `meta/conf/layer.conf` dosyasında
`addpylib ${LAYERDIR}/lib oe` satırı bulunur ve `meta/lib/oe/__init__.py` içindeki `BBIMPORTS` listesi
hangi alt modüllerin (`utils`, `path`, `types` ...) yükleneceğini belirler. Örnek projede aynı yapı
küçük ölçekte kurulmuştur:

```text
bbmini/
├── conf/bitbake.conf        # ... addpylib ${TOPDIR}/lib ornek
└── lib/ornek/
    ├── __init__.py          # BBIMPORTS = ["yardimci"]
    └── yardimci.py          # def sensor_listesi(d): ...
```

```python title="examples/bolum-08/bbmini/lib/ornek/yardimci.py (kesit)"
def sensor_listesi(d):
    """SENSOR_SAYISI değişkenine göre 'sensor0 sensor1 ...' listesini üretir."""
    adet = int(d.getVar("SENSOR_SAYISI") or "1")
    return " ".join("sensor%d" % i for i in range(adet))
```

Tarifte `SENSORLER = "${@ornek.yardimci.sensor_listesi(d)}"` yazılır. `addpylib`, Bölüm 4'te anlatılan
import sisteminin doğrudan bir uygulamasıdır: dizin `sys.path`'e eklenir ve paket içe aktarılır.
BitBake ayrıca `BBIMPORTS` ile alınan modüllerdeki fonksiyonların kaynağını kendi kod çözümleyicisiyle
inceler; böylece bu fonksiyonların hangi değişkenleri okuduğu bağımlılık hesaplarında izlenebilir.

Kütüphaneye taşınan kodun en önemli kazancı **sınanabilirliktir**. `sensor_listesi(d)` yalnızca `d`
parametresine bağlıdır; Bölüm 6'daki pytest yöntemleriyle, `bb.data.init()` ile oluşturulmuş gerçek bir
veri deposu veya `getVar` yöntemi olan basit bir sahte nesne verilerek BitBake çalıştırılmadan sınanabilir.

## 8.8 Python modüllerinin Yocto'da paketlenmesi

Bölüm 1'de geliştirme makinesinde `pip install -e .` ile kurulan `sensor-araclari` paketinin hedef
imaja girmesi, OE-Core'un Python sınıflarıyla yazılan bir tarifle sağlanır. Derleme arka ucuna göre
uygun sınıf seçilir:

| `pyproject.toml` derleme arka ucu | Sınıf |
|---|---|
| `setuptools.build_meta` | `python_setuptools_build_meta` |
| `flit_core.buildapi` | `python_flit_core` |
| `hatchling.build` | `python_hatchling` |
| `poetry.core.masonry.api` | `python_poetry_core` |
| `mesonpy` | `python_mesonpy` |
| Rust uzantılı (`maturin`) | `python_maturin` |

Bu sınıfların ortak tabanı `python_pep517` sınıfıdır: derleme arka ucunu çağırarak bir wheel üretir ve
wheel'i hedefin site-packages dizinine kurar. PyPI'den alınan paketlerde `inherit pypi` kaynak adresini
üretir; adres, `pypi.bbclass` içindeki `def pypi_package(d)` fonksiyonuyla tarif adından türetilir
(bkz. [Bölüm 4](04-fonksiyon-modul.md)). Hedefte testlerin çalıştırılması için `ptest-python-pytest`
sınıfı kullanılır ([Bölüm 6](06-hata-test-kayit.md)). Python modüllerinin çalışma bağımlılıkları
otomatik algılanmaz; `RDEPENDS:${PN}` elle yazılmalıdır
(<a href="../../yocto-gomulu-linux/bolumler/06-tarifler.html">Yocto kitabı, Bölüm 6</a>).

## 8.9 Sık yapılan hatalar

| Belirti | Neden | Çözüm |
|---|---|---|
| `AttributeError: 'NoneType' object has no attribute 'split'` | Değişken tanımsız; `getVar` `None` döndürdü | `(d.getVar("X") or "").split()` |
| Koşul her zaman doğru çıkıyor | `if d.getVar("ETKIN"):` ifadesinde `"0"` metni doğrudur | `bb.utils.to_boolean(d.getVar("ETKIN"))` veya `oe.types.boolean` |
| `bb.utils.contains` beklenenden farklı sonuç veriyor | Değişken adı yerine değer verilmiş veya `d` unutulmuş | İlk parametre değişkenin adıdır, son parametre `d` |
| Değer `None` metni içeriyor | `${@...}` ifadesi `None` döndürdü | İfadeden açıkça `''` döndürülmeli |
| Görevde yapılan `setVar` sonraki görevde görülmüyor | Her görev tarifin deposunun kopyasıyla çalışır | Değer anonim Python'da hesaplanmalı veya dosya üzerinden aktarılmalı |
| `print()` çıktısı konsolda yok | Görev çıktısı günlüğe yönlendirilir | `bb.plain` veya `bb.warn`; günlük `temp/log.do_<görev>` |
| Ayrıştırma çok yavaş | Genel sınıftaki anonim işlevde pahalı işlem | İşlemi göreve taşımak, sonucu önbelleğe almak |
| Dosya değiştiği halde görev yeniden çalışmıyor | Ayrıştırmada okunan dosya imzaya katılmadı | `do_gorev[file-checksums]` ile bağımlılık bildirmek |

!!! lab "Uygulama 8.1 · Küçük BitBake projesinde Python"
    1. BitBake kaynak ağacını alın ve örnek projeyi çalıştırın:

        ```bash
        git clone -b 2.18 https://git.openembedded.org/bitbake ~/bitbake
        cd ~/ornekler/bolum-08/bbmini
        export BBPATH=$PWD PATH=~/bitbake/bin:$PATH
        bitbake sensor-oku -c bilgi
        ```

    2. `conf/bitbake.conf` dosyasında `DISTRO_FEATURES` değerinden `systemd` kelimesini çıkarın ve
       komutu yineleyin. `SERVIS` değerinin `sensor-oku.init` olduğunu doğrulayın.
    3. Komut satırından geçersiz bir değer verin ve anonim işlevin ayrıştırmayı durdurduğunu gözlemleyin.
       BitBake ortamdan yalnızca izin verilen değişkenleri alır; bu nedenle değişken
       `BB_ENV_PASSTHROUGH_ADDITIONS` ile birlikte verilir:

        ```bash
        ARALIK=bes BB_ENV_PASSTHROUGH_ADDITIONS=ARALIK bitbake sensor-oku -c bilgi
        ```

    4. `recipes/servis-denetle_1.0.bb` tarifinde `EXEC_SATIRI` değişkenine
       `"ExecStart=/usr/bin/sensor-rapor /var/lib/sensor/olcumler.csv"` değerini verin ve `bitbake servis-denetle`
       komutunun yalnızca uyarıyla tamamlandığını doğrulayın.
    5. `BITBAKE=~/bitbake python3 ../veri_deposu.py` betiğini çalıştırın ve her satırı bu bölümdeki
       ilgili kuralla eşleştirin.

## Özet

- BitBake Python ile yazılmıştır; metadata'daki Python kodu BitBake'in süreçlerinde ve derleme makinesinin Python'uyla çalışır.
- `d` bir `DataSmart` nesnesidir; `getVar` metin veya `None` döndürür, `expand=False` ham değeri verir.
- Görevler ve tarifler veri deposunun kopyalarıyla çalışır; bir görevdeki `setVar` diğerlerini etkilemez.
- `${@...}` tek bir ifadedir; `=` ile her genişletmede, `:=` ile bir kez çalışır ve yan etkisiz olmalıdır.
- `bb.utils.contains` değişkenin adını ve `d`'yi alır; tam kelime ve alt küme denetimi yapar.
- Python görevleri `bitbake-worker` içinde çalışır; `OVERRIDES` başına `task-<görev>` eklenir.
- `bb.fatal` istisna yükselterek durdurur; `bb.*` fonksiyonları argümanları biçimlendirmeden birleştirir; `print` yalnızca günlüğe gider.
- Anonim Python ayrıştırma sonunda, override ve `:append` işlemlerinden sonra çalışır; doğrulama, `SkipRecipe` ve dinamik bağımlılık için kullanılır.
- Büyük yardımcı kod `addpylib` ile yüklenen katman kütüphanesinde tutulur ve pytest ile sınanabilir.

## Değerlendirme soruları

<div class="quiz" data-id="b08-1">
<p class="quiz-soru"><code>A = "1"</code>, <code>B = "${@int(d.getVar('A')) * 2}"</code>, <code>C := "${@int(d.getVar('A')) * 2}"</code>, <code>A = "5"</code> satırlarından sonra B ve C'nin değerleri nedir?</p>
<ul>
<li>B = 2, C = 2</li>
<li data-dogru>B = 10, C = 2</li>
<li>B = 10, C = 10</li>
<li>B = 2, C = 10</li>
</ul>
<p class="quiz-aciklama"><code>=</code> ile atanan satır içi ifade, B her okunduğunda yeniden çalışır ve o anki A değerini görür. <code>:=</code> ifadeyi
atama anında çalıştırıp sonucu sabitler. Bu davranış Yocto kitabının 5. bölümündeki <code>=</code>/<code>:=</code> kuralıyla aynıdır.</p>
</div>

<div class="quiz" data-id="b08-2">
<p class="quiz-soru">Aşağıdakilerden hangisi doğru bir <code>bb.utils.contains</code> kullanımıdır?</p>
<ul>
<li><code>bb.utils.contains(d.getVar('DISTRO_FEATURES'), 'systemd', 'a', 'b', d)</code></li>
<li><code>bb.utils.contains('DISTRO_FEATURES', 'systemd', 'a', 'b')</code></li>
<li data-dogru><code>bb.utils.contains('DISTRO_FEATURES', 'systemd', 'a', 'b', d)</code></li>
<li><code>'systemd' in d.getVar('DISTRO_FEATURES', 'a', 'b')</code></li>
</ul>
<p class="quiz-aciklama">İlk parametre değişkenin adıdır; fonksiyon değeri kendisi okur. Son parametre veri deposu <code>d</code>'dir ve zorunludur.</p>
</div>

<div class="quiz" data-id="b08-3">
<p class="quiz-soru">Bir tarifte <code>FOO:append = " b"</code> satırı ve ardından <code>python () { d.setVar("FOO", "a") }</code> anonim işlevi vardır. Ayrıştırma sonunda <code>FOO</code> nedir?</p>
<ul>
<li><code>"a b"</code></li>
<li data-dogru><code>"a"</code></li>
<li><code>" b"</code></li>
<li>Tanımsız</li>
</ul>
<p class="quiz-aciklama">Override ve <code>:append</code> işlemleri anonim işlevlerden önce uygulanır; anonim işlevdeki <code>setVar</code> sonucu tamamen değiştirir.
Ek korunmak isteniyorsa <code>d.appendVar</code> veya <code>d.prependVar</code> kullanılır.</p>
</div>

<div class="quiz" data-id="b08-4">
<p class="quiz-soru">Bir Python görevinde <code>bb.note("Sürüm:", d.getVar("PV"))</code> yazılmıştır. Görev günlüğünde hangi satır görülür?</p>
<ul>
<li><code>NOTE: Sürüm: 1.0</code></li>
<li data-dogru><code>NOTE: Sürüm:1.0</code></li>
<li><code>NOTE: ('Sürüm:', '1.0')</code></li>
<li><code>TypeError</code> yükseltilir</li>
</ul>
<p class="quiz-aciklama"><code>bb.note</code> argümanlarını <code>''.join(args)</code> ile boşluksuz birleştirir; <code>print</code> gibi boşluk koymaz ve <code>%</code> biçimlendirmesi yapmaz.</p>
</div>

<div class="quiz" data-id="b08-5">
<p class="quiz-soru">Belirli bir dağıtım özelliği yoksa tarifin tamamen devre dışı kalması için hangi yöntem kullanılır?</p>
<ul>
<li>Görevin içinde <code>bb.warn</code> çağırmak</li>
<li data-dogru>Anonim Python işlevinde <code>raise bb.parse.SkipRecipe("neden")</code></li>
<li><code>${@...}</code> içinde <code>sys.exit(0)</code></li>
<li><code>do_build[noexec] = "1"</code></li>
</ul>
<p class="quiz-aciklama"><code>SkipRecipe</code> ayrıştırma aşamasında tarifi atlar; tarif istendiğinde BitBake atlanma nedenini bildirir. OE-Core'un
<code>features_check</code> sınıfı <code>REQUIRED_DISTRO_FEATURES</code> denetimini bu yolla yapar.</p>
</div>

<div class="quiz" data-id="b08-6">
<p class="quiz-soru"><code>do_compile</code> görevinde <code>d.setVar("SURUM_DOSYASI", "/tmp/x")</code> yapılıyor. <code>do_install</code> görevinde <code>d.getVar("SURUM_DOSYASI")</code> ne döndürür?</p>
<ul>
<li><code>"/tmp/x"</code></li>
<li data-dogru>Tarifte tanımlı değilse <code>None</code>; görevler deponun ayrı kopyalarıyla çalışır</li>
<li>Hata verir; görevlerde <code>setVar</code> kullanılamaz</li>
<li>Rastgele; görevlerin sırasına bağlıdır</li>
</ul>
<p class="quiz-aciklama">Her görev tarifin veri deposunun bir kopyasıyla, çoğu zaman ayrı bir süreçte çalışır. Görevler arası bilgi, ayrıştırma
aşamasında hesaplanan değişkenlerle veya dosyalarla aktarılır.</p>
</div>

!!! alistirma "Alıştırma: Katman kütüphanesine fonksiyon eklemek ve sınamak"
    Örnek projedeki `ornek.yardimci` modülüne `ozellik_secimi(d, ozellik, varsa, yoksa="")` fonksiyonu
    zaten eklenmiştir. Bu fonksiyon kullanılarak:

    1. `sensor-oku` tarifine `AG_ARACLARI` değişkenini ekleyin: `DISTRO_FEATURES` içinde `ipv6` varsa
       `"iproute2 ping6"`, yoksa `"iproute2"` olsun. Değeri `do_bilgi` çıktısına ekleyin.
    2. `ozellik_secimi` fonksiyonu için BitBake çalıştırmadan, `bb.data.init()` ile oluşturulan bir veri
       deposuyla çalışan bir pytest testi yazın; `ipv6` var ve yok durumlarını parametreli olarak sınayın.
    3. Testi `BITBAKE=~/bitbake` ortam değişkeniyle çalıştırın.

    ??? success "Örnek çözüm"
        Tarif değişikliği (`recipes/sensor-oku_1.0.bb`):
        ```bitbake
        BILGI_DEGISKENLERI = "PF OVERRIDES KONSOL SERVIS SENSORLER ETIKETLER ARALIK ARALIK_MS OZET AG_ARACLARI"
        AG_ARACLARI = "${@ornek.yardimci.ozellik_secimi(d, 'ipv6', 'iproute2 ping6', 'iproute2')}"
        ```
        `bitbake sensor-oku -c bilgi` çıktısına `AG_ARACLARI  = iproute2 ping6` satırı eklenir.

        Test (`bbmini/lib/test_yardimci.py`):
        ```python
        import os, sys
        import pytest

        sys.path.insert(0, os.path.join(os.path.expanduser(os.environ.get("BITBAKE", "~/bitbake")), "lib"))
        sys.path.insert(0, os.path.dirname(__file__))
        import bb.data
        from ornek import yardimci


        @pytest.mark.parametrize("ozellikler, beklenen", [
            ("systemd ipv6", "iproute2 ping6"),
            ("systemd", "iproute2"),
            ("", "iproute2"),
        ])
        def test_ozellik_secimi(ozellikler, beklenen):
            d = bb.data.init()
            d.setVar("DISTRO_FEATURES", ozellikler)
            assert yardimci.ozellik_secimi(d, "ipv6", "iproute2 ping6", "iproute2") == beklenen


        def test_sensor_listesi_varsayilan():
            d = bb.data.init()                       # SENSOR_SAYISI tanımsız
            assert yardimci.sensor_listesi(d) == "sensor0"
        ```
        ```bash
        BITBAKE=~/bitbake python3 -m pytest -q lib/test_yardimci.py     # 4 passed
        ```
        Boş `DISTRO_FEATURES` durumu `bb.utils.contains` içindeki `if not val` dalını sınar. Testler BitBake
        sunucusunu başlatmadan, saniyenin altında çalışır; katman kütüphanesine taşınan her fonksiyon bu
        yolla CI'da sınanabilir.

**Kitabın sonu.** Kitaplığın diğer kitapları için: <a href="../../yocto-gomulu-linux/index.html">Yocto Project ile Gömülü Linux</a> ·
<a href="../../bash-komut-satiri/index.html">Linux Komut Satırı ve Bash</a> · <a href="../../git-surum-kontrolu/index.html">Git ile Sürüm Kontrolü</a> ·
<a href="../../c-derleme/index.html">C, Make ve CMake ile Derleme</a>.
