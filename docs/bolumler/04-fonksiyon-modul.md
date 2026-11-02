# 4 · Fonksiyonlar, modüller, paketler ve sınıflar

<div class="kunye" markdown>
<span>Süre: ~60 dk + uygulama</span><span>Düzey: Orta</span><span>Ön koşul: Bölüm 2–3</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Konumsal, anahtar sözcüklü, konumsal-yalnız ve anahtar-yalnız parametreleri doğru kullanabilirsiniz.
    - Ad çözümlemesinin LEGB kuralını, `global` ve `nonlocal` deyimlerini açıklayabilirsiniz.
    - Kapanışların ve dekoratörlerin nasıl çalıştığını açıklayıp basit bir dekoratör yazabilirsiniz.
    - `import` deyiminin `sys.path` ve `sys.modules` üzerinden nasıl çözümlendiğini açıklayabilirsiniz.
    - Bir Python paketini `src` düzeninde yapılandırıp göreli içe aktarmalar kullanabilirsiniz.
    - Sınıf, kalıtım, `property` ve `dataclass` ile veri modelleri yazabilir, tip ipuçlarıyla belgeleyebilirsiniz.

## 4.1 Fonksiyonlar ve argüman türleri

`def` deyimi bir **fonksiyon nesnesi** oluşturur ve onu bir ada bağlar. Fonksiyonlar diğer nesneler
gibi değişkenlere atanabilir, başka fonksiyonlara argüman olarak verilebilir ve fonksiyonlardan
döndürülebilir. `sorted(kayitlar, key=lambda k: k.deger)` çağrısındaki `key` argümanı bunun en sık
görülen örneğidir.

Python'da parametreler çağrıda konumla veya adla eşleştirilebilir. Bir fonksiyonun imzası, hangi
parametrenin nasıl verilebileceğini açıkça belirleyebilir:

```python title="examples/bolum-04/kapsam_dekorator.py (kesit)"
def oku(sensor, /, adet=1, *, zaman_asimi=1.0, **ek):
    ...

oku("sensor0")                                  # adet=1, zaman_asimi=1.0
oku("sensor0", 3, zaman_asimi=0.5, birim="C")   # birim, ek sözlüğüne gider
oku("sensor0", 3, 0.5)                          # TypeError: zaman_asimi anahtar-yalnızdır
```

| İmza öğesi | Anlamı |
|---|---|
| `sensor, /` | `/` işaretinden öncekiler **konumsal-yalnızdır**; `oku(sensor="s0")` yazılamaz. Ad, ileride değiştirilebilir. |
| `adet=1` | Varsayılan değerli parametre; konumla veya adla verilebilir |
| `*args` | Fazladan konumsal argümanları demet olarak toplar |
| `*` (tek başına) | Sonraki parametreler **anahtar-yalnızdır**; adıyla verilmek zorundadır |
| `**ek` | Fazladan anahtar sözcüklü argümanları sözlük olarak toplar |

Anahtar-yalnız parametreler, özellikle sayısal ve mantıksal ayarlarda okunabilirliği artırır:
`istemci.oku(port, 1, 0, 4, 0.5, True)` çağrısının ne yaptığını anlamak için imzaya bakmak gerekir;
`zaman_asimi=0.5, yeniden_dene=True` yazımında ise anlam çağrıdadır.

### Varsayılan değerler bir kez değerlendirilir

Varsayılan değer ifadesi, fonksiyon **tanımlandığında bir kez** değerlendirilir ve fonksiyon nesnesinde
saklanır; her çağrıda yeniden hesaplanmaz. Değiştirilebilir bir varsayılan (liste, sözlük) bu nedenle
tüm çağrılar arasında paylaşılır:

```python
def ekle_hatali(deger, liste=[]):   # aynı liste her çağrıda yeniden kullanılır
    liste.append(deger)
    return liste

def ekle_dogru(deger, liste=None):  # doğru kalıp: None ile "verilmedi" denetimi
    if liste is None:
        liste = []
    liste.append(deger)
    return liste
```

Aynı ilke değiştirilemez ama zamanla değişen değerler için de geçerlidir. Bu kitabın paketi
geliştirilirken `def yazdir(ozet, bicim, cikti=sys.stdout)` imzası pytest'in çıktı yakalaması altında
çalışmadı: `sys.stdout`, modül içe aktarıldığı anda değerlendirilmiş ve pytest'in sonradan yerleştirdiği
akış hiç görülmemişti. Düzeltilmiş hali `cikti=None` ve gövdede `cikti = cikti or sys.stdout`
biçimindedir (`examples/sensor-araclari/src/sensor_araclari/cli.py`).

## 4.2 Kapsam: LEGB kuralı

Bir ad kullanıldığında Python onu dört kapsamda sırayla arar: **L**ocal (fonksiyonun yereli),
**E**nclosing (kapsayan fonksiyonların yerelleri), **G**lobal (modülün ad alanı) ve **B**uilt-in
(`len`, `print`, `int` gibi yerleşikler). İlk bulunan kullanılır.

Belirleyici kural şudur: bir fonksiyonun gövdesinde bir ada **atama** yapılıyorsa, o ad fonksiyonun
tamamında yerel kabul edilir. Bu karar derleme anında verilir. Aşağıdaki kod bu nedenle hata verir:

```python
sayac = 0
def artir():
    sayac += 1          # UnboundLocalError: cannot access local variable 'sayac'
                        # where it is not associated with a value
```

Global bir adı fonksiyon içinden yeniden bağlamak için `global sayac`, kapsayan fonksiyonun adını
yeniden bağlamak için `nonlocal sayac` yazılır. Ancak global durumun fonksiyonlardan değiştirilmesi
kodun sınanmasını zorlaştırır; değerin parametre olarak alınıp dönüş değeri olarak verilmesi ya da bir
sınıfın niteliğinde tutulması tercih edilir.

!!! dikkat "Yerleşik adların gölgelenmesi"
    `list`, `dict`, `id`, `type`, `input`, `max`, `bytes` gibi adlar ayrılmış sözcük değildir; değişken adı
    olarak kullanıldıklarında o kapsamda yerleşik fonksiyonu gizlerler. `id = 3` yazılan bir modülde
    sonraki `id(nesne)` çağrısı `TypeError: 'int' object is not callable` verir. Cihaz kimliği için
    `cihaz_id`, ham veri için `veri` gibi adlar seçilmelidir.

## 4.3 Kapanışlar

İç içe tanımlanan bir fonksiyon, kapsayan fonksiyonun yerel değişkenlerine başvurduğunda bu
değişkenler **hücrelerde** (cell) saklanır ve kapsayan fonksiyon döndükten sonra da yaşamaya devam eder.
İç fonksiyon ile birlikte taşınan bu ortama **kapanış** (closure) denir:

```python
def sayac_uret(baslangic=0):
    deger = baslangic
    def artir(adim=1):
        nonlocal deger            # nonlocal olmadan atama yeni bir yerel ad oluştururdu
        deger += adim
        return deger
    return artir

hata_sayaci = sayac_uret()
hata_sayaci(); hata_sayaci(); hata_sayaci()     # 3
hata_sayaci.__closure__[0].cell_contents        # 3: hücrenin içeriği
```

Kapanışlar, yapılandırmayı bir kez alıp sonra tekrar tekrar kullanılan geri çağırma (callback)
fonksiyonları üretmek için kullanılır: belirli bir eşiğe göre alarm veren denetleyiciler, belirli bir
cihaz adresine istek gönderen fonksiyonlar gibi.

!!! dikkat "Geç bağlama"
    Kapanış değişkenin **değerini değil, kendisini** saklar; değer, iç fonksiyon çağrıldığında okunur.
    Döngüde üretilen fonksiyonlar bu nedenle döngü değişkeninin son değerini görür:
    `[lambda: i for i in range(3)]` listesindeki her fonksiyon `2` döndürür. O anki değeri dondurmak
    için varsayılan argüman kullanılır: `[lambda i=i: i for i in range(3)]`.

## 4.4 Dekoratörler

Dekoratör, bir fonksiyonu alıp yerine başka bir fonksiyon (genellikle özgününü saran bir kapanış)
döndüren fonksiyondur. `@` söz dizimi yalnızca bir kısaltmadır:

```python
@yeniden_dene(deneme=3)
def sicaklik_oku(): ...

# ile tamamen aynıdır:
def sicaklik_oku(): ...
sicaklik_oku = yeniden_dene(deneme=3)(sicaklik_oku)
```

Cihaz iletişiminde geçici hatalara karşı yeniden deneme mantığını her fonksiyona tek tek yazmak
yerine bir dekoratörde toplamak yaygın bir kalıptır:

```python title="examples/bolum-04/kapsam_dekorator.py (kesit)"
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
```

Parametre alan bir dekoratör üç katmanlıdır: dış fonksiyon (`yeniden_dene`) parametreleri alır ve
asıl dekoratörü döndürür; dekoratör fonksiyonu alır ve sarmalayıcıyı döndürür; sarmalayıcı her
çağrıda çalışır. Aşağıdaki animasyon tanımdan çağrıya kadar nesnelerin nasıl oluştuğunu gösterir:

<div class="akis" data-senaryo="dekorator-sarma"></div>

`functools.wraps` kullanılmazsa sarmalanan fonksiyonun adı `sarmalayici` olarak görünür; günlük
kayıtları, hata iletileri ve pytest raporları yanıltıcı hale gelir. Standart kütüphane ve yaygın
kütüphaneler birçok dekoratör sunar: `@property`, `@classmethod`, `@staticmethod` (4.7),
`@functools.cache` ve `@functools.lru_cache` (sonuç önbelleği), `@dataclass` (4.8),
`@contextlib.contextmanager` ([Bölüm 5](05-sistem-programlama.md)) ve `@pytest.fixture`
([Bölüm 6](06-hata-test-kayit.md)).

## 4.5 Modüller ve import sistemi

Her `.py` dosyası bir **modüldür**; modülün adı dosyanın adıdır. `import` deyimi iki iş yapar: modülü
bulur ve yükler (yalnızca ilk seferde) ve bir adı modül nesnesine bağlar. Adımlar şöyledir:

1. **Önbellek:** `sys.modules` sözlüğünde modül varsa doğrudan o nesne kullanılır; dosya sistemine gidilmez.
2. **Bulma:** `sys.meta_path` üzerindeki bulucular sırayla sorulur: yerleşik modüller, dondurulmuş
   modüller ve son olarak `sys.path` listesindeki dizinleri dolaşan `PathFinder`. Sonuç bir
   `ModuleSpec` nesnesidir: modülün adı, yükleyicisi ve dosya yolu.
3. **Yükleme:** Boş bir modül nesnesi oluşturulur, **kod çalıştırılmadan önce** `sys.modules`'a eklenir
   ve ardından modülün kodu bu nesnenin ad alanında baştan sona çalıştırılır.
4. **Bağlama:** `import serial` için `serial` adı modül nesnesine; `from serial import Serial` için
   `Serial` adı modülün niteliğine bağlanır.

<div class="akis" data-senaryo="import-cozumleme"></div>

Bu işleyişin üç önemli sonucu vardır:

- **Modül kodu bir kez çalışır.** Modül düzeyindeki `print`, yapılandırma okuma veya bağlantı açma gibi
  yan etkiler yalnızca ilk içe aktarmada gerçekleşir. Uzun süre çalışan bir süreçte kaynak dosyası
  değiştirildiğinde değişiklik görülmez; süreç yeniden başlatılmalıdır.
- **Gölgeleme:** `sys.path[0]` betiğin dizini olduğundan, betiğin yanına konmuş `serial.py`, `json.py` veya
  `logging.py` adlı bir dosya aynı adlı kurulu modülün yerine yüklenir. Hata genellikle
  `AttributeError: module 'serial' has no attribute 'Serial'` biçiminde, asıl nedenden uzakta ortaya
  çıkar. Çözüm dosyayı yeniden adlandırmak ve yanında oluşmuş `__pycache__` dizinini silmektir.
- **Döngüsel import:** `a` modülü `b`'yi, `b` de `a`'yı içe aktarıyorsa, `b` çalışırken `a` modülü
  `sys.modules`'ta yarım yüklenmiş halde bulunur; `from a import x` satırı `ImportError: cannot import name`
  verebilir. Çözüm, ortak kodu üçüncü bir modüle taşımak veya içe aktarmayı kullanıldığı fonksiyonun
  içine almaktır.

### `__name__` ve `if __name__ == "__main__":`

Her modülün `__name__` niteliği, içe aktarıldığında modülün adını (`"ayarlar"`), doğrudan
çalıştırıldığında ise `"__main__"` değerini taşır. Bu ayrım, bir dosyanın hem içe aktarılabilir modül
hem de çalıştırılabilir betik olmasını sağlar:

```python
def main() -> int:
    ...
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

Bu kalıpta program mantığı `main()` içinde durur ve testlerden doğrudan çağrılabilir
(`cli.main(["dosya.csv"])`); modül içe aktarıldığında hiçbir şey çalışmaz.

<div class="terminal" data-oturum="import-sistemi"></div>

## 4.6 Paketler

**Paket**, modülleri bir araya getiren dizindir. İçinde `__init__.py` bulunan dizin normal pakettir;
paket içe aktarıldığında bu dosya çalışır ve paketin ad alanını oluşturur. `__init__.py` bulunmayan
dizinler de PEP 420 **ad alanı paketi** olarak içe aktarılabilir; ancak bu tür paketler birden çok
dizine yayılan büyük projeler içindir ve yanlışlıkla oluştuklarında modül arama sorunlarını gizler.
Uygulama paketlerinde `__init__.py` her zaman yazılmalıdır.

Kitabın paketinin yapısı:

```text
sensor-araclari/                 # proje dizini (dağıtım adı: sensor-araclari)
├── pyproject.toml
├── src/
│   └── sensor_araclari/         # içe aktarma paketi (import sensor_araclari)
│       ├── __init__.py          # __version__, dışa açılan adlar (__all__)
│       ├── olcum.py             # Olcum, ozetle, dosya_oku
│       ├── protokol.py          # çerçeveler, CRC (Bölüm 7)
│       ├── benzetici.py         # sensör cihazı benzeticisi
│       ├── kayit.py             # logging yapılandırması (Bölüm 6)
│       ├── cli.py               # sensor-rapor (Bölüm 5)
│       └── istemci.py           # sensor-istemci (Bölüm 7)
├── tests/                       # pytest testleri (Bölüm 6)
└── ornek-veri/
```

Paket içindeki modüller birbirini **göreli içe aktarma** ile kullanır: `from . import protokol`,
`from .olcum import ozetle`. Nokta, içinde bulunulan paketi gösterir. Göreli içe aktarmalar yalnızca
modül bir paketin parçası olarak yüklendiğinde çalışır; `python src/sensor_araclari/cli.py` biçiminde
dosya yoluyla çalıştırıldığında `ImportError: attempted relative import with no known parent package`
hatası verilir. Paket içindeki bir modül `python -m sensor_araclari.cli` ile ya da kurulumla oluşan
`sensor-rapor` komutuyla çalıştırılmalıdır.

`__init__.py` dosyası paketin dışa açık yüzünü tanımlar:

```python title="examples/sensor-araclari/src/sensor_araclari/__init__.py (kesit)"
__version__ = "0.3.0"

from .olcum import Olcum, OlcumHatasi, ozetle, satir_ayristir

__all__ = ["Olcum", "OlcumHatasi", "ozetle", "satir_ayristir", "__version__"]
```

Böylece kullanıcı `from sensor_araclari import Olcum` yazabilir ve iç modül yapısı değiştiğinde dış
arayüz korunur. `__all__`, `from sensor_araclari import *` satırının hangi adları getireceğini
belirler; yıldızlı içe aktarma ise hangi adın nereden geldiğini gizlediği için uygulama kodunda
kullanılmamalıdır.

## 4.7 Sınıflar

Sınıf, veriyi ve o veri üzerinde çalışan fonksiyonları (yöntemleri) bir arada tutan bir türdür.
Sınıftan oluşturulan her nesne bir **örnektir**. Python'da sınıflar da nesnedir ve `class` deyimi,
`def` gibi, bir sınıf nesnesi oluşturup ada bağlar.

```python title="examples/bolum-04/siniflar.py (kesit)"
class Sensor:
    sayac = 0                                    # (1)!

    def __init__(self, ad: str, adres: int) -> None:
        self.ad = ad                             # (2)!
        self._adres = adres
        Sensor.sayac += 1

    @property
    def adres(self) -> int:                      # (3)!
        return self._adres

    @adres.setter
    def adres(self, yeni: int) -> None:
        if not 1 <= yeni <= 247:
            raise ValueError(f"Modbus adresi 1-247 olmalı: {yeni}")
        self._adres = yeni

    @classmethod
    def yapilandirmadan(cls, satir: str) -> "Sensor":   # (4)!
        ad, adres = satir.split(":")
        return cls(ad, int(adres))

    def __repr__(self) -> str:                   # (5)!
        return f"{type(self).__name__}(ad={self.ad!r}, adres={self._adres})"


class SicaklikSensoru(Sensor):                   # (6)!
    def __init__(self, ad: str, adres: int, kayma: float = 0.0) -> None:
        super().__init__(ad, adres)
        self.kayma = kayma

    def oku(self) -> float:
        return round(21.4 + self.kayma, 1)
```

1.  **Sınıf niteliği:** Tüm örnekler tarafından paylaşılır. Örnek üzerinden atama (`self.sayac = 1`)
    sınıf niteliğini değiştirmez, örneğe aynı adlı yeni bir nitelik ekler.
2.  **Örnek niteliği:** `self`, yöntemin çağrıldığı örnektir; C++'taki `this` gibi, ancak açıkça yazılır.
    Alt çizgiyle başlayan adlar (`_adres`) "iç kullanım" anlamına gelen bir gelenektir; erişim engellenmez.
3.  **property:** Nitelik gibi okunan (`s.adres`) ama arkasında yöntem çalışan erişimci. Doğrulama veya
    hesaplama, çağıran kodu değiştirmeden eklenebilir.
4.  **classmethod:** İlk parametresi örnek değil sınıftır (`cls`); alternatif kurucular için kullanılır.
    Alt sınıf üzerinden çağrıldığında alt sınıfın örneğini üretir.
5.  **Özel yöntemler:** `__repr__`, `__eq__`, `__len__`, `__iter__`, `__enter__`/`__exit__` gibi çift alt
    çizgili yöntemler, nesnenin yerleşik işlemlerdeki davranışını belirler.
6.  **Kalıtım:** `super().__init__(...)` temel sınıfın kurucusunu çağırır. Yöntem arama sırası
    `SicaklikSensoru.__mro__` ile görülür.

Python'da bir fonksiyonun bir nesneyi kullanabilmesi için o nesnenin belirli bir sınıftan türemesi
gerekmez; gereken yöntemlere sahip olması yeterlidir (ördek tiplemesi). Bu sözleşme tip ipuçlarında
`typing.Protocol` ile ifade edilir:

```python
class Okunabilir(Protocol):
    def oku(self) -> float: ...

def ortalama(kaynaklar: list[Okunabilir]) -> float:
    return sum(k.oku() for k in kaynaklar) / len(kaynaklar)
```

`ortalama()` fonksiyonuna `oku()` yöntemi olan herhangi bir nesne verilebilir: gerçek bir sensör sınıfı,
bir benzetici veya testteki sahte nesne. Bu, donanım bağımlı kodun donanımsız sınanmasını kolaylaştırır
([Bölüm 6](06-hata-test-kayit.md)). Kalıtım "bir türüdür" ilişkisi gerçekten varsa kullanılmalı;
yalnızca kod paylaşmak için derin sınıf hiyerarşileri yerine nesneleri birbirinin içinde kullanmak
(bileşim) tercih edilmelidir.

## 4.8 dataclass

Yalnızca veri taşıyan sınıflar için `__init__`, `__repr__` ve `__eq__` yöntemlerini elle yazmak
tekrarlı ve hataya açıktır. `@dataclass` dekoratörü bu yöntemleri sınıf gövdesindeki tip ipuçlu
alanlardan üretir:

```python title="examples/sensor-araclari/src/sensor_araclari/olcum.py (kesit)"
@dataclass(frozen=True, slots=True)
class Olcum:
    zaman: str
    sensor: str
    deger: float
    birim: str = "C"

    def __post_init__(self) -> None:
        if self.birim not in GECERLI_BIRIMLER:
            raise OlcumHatasi(f"bilinmeyen birim: {self.birim!r}")
```

| Parametre | Etkisi |
|---|---|
| `frozen=True` | Alanlara atama `FrozenInstanceError` verir; nesne özetlenebilir olur ve küme/sözlük anahtarı olabilir |
| `slots=True` (3.10+) | `__slots__` üretir: örnek başına bellek azalır, tanımsız nitelik eklenemez |
| `order=True` | `<`, `>` karşılaştırmalarını alan sırasına göre üretir; `sorted()` doğrudan çalışır |
| `field(default_factory=list)` | Değiştirilebilir varsayılan değer her örnek için yeniden üretilir |
| `field(compare=False)` | Alan eşitlik ve sıralama karşılaştırmasına katılmaz |

`__post_init__`, üretilen `__init__` tamamlandıktan sonra çağrılır ve doğrulama için kullanılır.
`dataclass`, değiştirilebilir varsayılan değer tuzağına karşı da korur: `etiketler: list[str] = []`
yazıldığında sınıf tanımı `ValueError` ile reddedilir ve `field(default_factory=list)` kullanılması
istenir.

## 4.9 Tip ipuçları

Tip ipuçları (`def ozetle(olcumler: Iterable[Olcum]) -> dict[str, dict[str, float]]`) çalışma anında
denetlenmez; yorumlayıcı bunları yalnızca `__annotations__` niteliğinde saklar. Değerleri üç yerden
gelir: okuyucuya belge olmaları, düzenleyicilerin otomatik tamamlama ve uyarıları, ve `mypy` gibi
statik denetleyicilerin hataları kod çalışmadan bulması. Kitabın paketi mypy 2.4 ile denetlenmiştir;
denetim sırasında iki gerçek eksiklik bulunmuş ve düzeltilmiştir (boş bir listenin eleman türünün
belirtilmemesi ve seri port parametresinin çok genel bir türle bildirilmesi):

```bash
python -m pip install mypy types-pyserial
mypy src/          # Success: no issues found in 7 source files
```

Güncel sözdiziminde `list[int]`, `dict[str, float]` (3.9+) ve `int | None` (3.10+) yazılır; eski kodda
görülen `List`, `Dict`, `Optional` adları `typing` modülünden gelir ve eşdeğerdir. Dosyanın başına
yazılan `from __future__ import annotations`, ipuçlarının değerlendirilmesini erteler; böylece henüz
tanımlanmamış bir sınıfa (`-> Sensor`) tırnak olmadan başvurulabilir.

## 4.10 Yocto bağlantısı

BitBake metadata'sı da Python'un fonksiyon ve modül kavramlarını kullanır. Bir sınıf veya tarifte
`def` ile tanımlanan fonksiyonlar satır içi Python'dan çağrılabilir. OE-Core'un `pypi.bbclass` dosyası
bunun tipik örneğidir:

```bitbake title="openembedded-core/meta/classes-recipe/pypi.bbclass (kesit)"
def pypi_package(d):
    bpn = d.getVar('BPN')
    if bpn.startswith('python-'):
        return bpn[7:]
    elif bpn.startswith('python3-'):
        return bpn[8:]
    return bpn

PYPI_PACKAGE ?= "${@pypi_package(d)}"
```

Büyük yardımcı kod ise katmanın `lib/` dizinindeki sıradan Python paketlerinde tutulur ve
`addpylib ${LAYERDIR}/lib oe` satırıyla BitBake'e tanıtılır; OE-Core'un `oe.utils`, `oe.path` ve
`oe.types` modülleri böyle yüklenir. Bu mekanizma, bu bölümde anlatılan `sys.path` ve paket yapısının
doğrudan bir uygulamasıdır ve [Bölüm 8](08-bitbake-python.md)'de çalışan bir örnekle ele alınır.

!!! lab "Uygulama 4.1 · Pakete yeni bir modül eklenmesi"
    1. `src/sensor_araclari/birimler.py` adlı bir modül oluşturun ve içine `c_to_f(c: float) -> float`
       ile `f_to_c(f: float) -> float` fonksiyonlarını yazın.
    2. Modülü `__init__.py` üzerinden dışa açın ve `__all__` listesine ekleyin.
    3. Düzenlenebilir kurulum sayesinde yeniden kurulum gerekmediğini doğrulayın:

        ```bash
        python -c 'from sensor_araclari import c_to_f; print(c_to_f(21.4))'      # 70.52
        python -c 'import sensor_araclari.birimler as b, sys; print(b.__file__, "sensor_araclari.birimler" in sys.modules)'
        ```

    4. `birimler.py` dosyasının başına `print("birimler yüklendi")` ekleyin ve modülü aynı süreçte
       iki kez içe aktaran bir komutla yalnızca bir kez yazdırıldığını gözlemleyin.
    5. Değişiklikleri `mypy src/` ile denetleyin.

## Özet

- Fonksiyonlar birinci sınıf nesnelerdir; `/` ve `*` ile konumsal-yalnız ve anahtar-yalnız parametreler tanımlanır.
- Varsayılan değerler tanım anında bir kez değerlendirilir; değiştirilebilir varsayılan yerine `None` kullanılır.
- Ad çözümlemesi LEGB sırasıyla yapılır; fonksiyonda atanan her ad o fonksiyonda yereldir.
- Kapanışlar değişkenin kendisini saklar ve geç bağlanır; dekoratörler kapanışlar üzerine kuruludur.
- `functools.wraps`, sarmalanan fonksiyonun adını ve belgesini korur.
- `import` önce `sys.modules`'a, sonra `sys.path`'e bakar; modül kodu süreç başına bir kez çalışır.
- Betiğin yanındaki aynı adlı dosya kurulu modülü gölgeler.
- Paketler `__init__.py` içeren dizinlerdir; paket içinde göreli içe aktarma kullanılır ve modüller `-m` ile çalıştırılır.
- `dataclass` veri sınıflarının yöntemlerini üretir; `frozen`, `slots` ve `default_factory` güvenli kullanım sağlar.
- Tip ipuçları çalışma anında denetlenmez; `mypy` ile statik olarak denetlenir.

## Değerlendirme soruları

<div class="quiz" data-id="b04-1">
<p class="quiz-soru"><code>def f(x, liste=[]): liste.append(x); return liste</code> tanımından sonra <code>f(1)</code> ve ardından <code>f(2)</code> çağrılıyor. İkinci çağrının sonucu nedir?</p>
<ul>
<li><code>[2]</code></li>
<li data-dogru><code>[1, 2]</code></li>
<li><code>[2, 1]</code></li>
<li><code>TypeError</code></li>
</ul>
<p class="quiz-aciklama">Varsayılan liste fonksiyon tanımlanırken bir kez oluşturulur ve tüm çağrılar aynı nesneyi kullanır. Doğru kalıp
<code>liste=None</code> ve gövdede yeni liste oluşturmaktır.</p>
</div>

<div class="quiz" data-id="b04-2">
<p class="quiz-soru">Bir betiğin bulunduğu dizinde <code>logging.py</code> adlı bir dosya vardır. Betik <code>import logging</code> çalıştırdığında ne olur?</p>
<ul>
<li>Standart kütüphanedeki <code>logging</code> her zaman önceliklidir</li>
<li data-dogru>Betiğin dizini <code>sys.path[0]</code> olduğu için yerel <code>logging.py</code> yüklenir ve standart modül gölgelenir</li>
<li>Python iki modülü birleştirir</li>
<li><code>ImportError</code> yükseltilir</li>
</ul>
<p class="quiz-aciklama">Modül araması <code>sys.path</code> sırasıyla yapılır ve ilk eşleşme kullanılır. Standart kütüphane veya kurulu paketlerle
aynı adı taşıyan dosyalar bu nedenle sorun yaratır; <code>-I</code> seçeneği betik dizinini aramaya katmaz.</p>
</div>

<div class="quiz" data-id="b04-3">
<p class="quiz-soru">Aynı süreçte <code>import ayarlar</code> satırı iki farklı modülde çalıştırılıyor. <code>ayarlar.py</code> içindeki modül düzeyi <code>print</code> kaç kez çalışır?</p>
<ul>
<li data-dogru>Bir kez; ikinci içe aktarma <code>sys.modules</code>'taki nesneyi döndürür</li>
<li>İki kez</li>
<li>Hiç; modül kodu yalnızca doğrudan çalıştırıldığında çalışır</li>
<li><code>__pycache__</code> varsa hiç</li>
</ul>
<p class="quiz-aciklama">İlk içe aktarma modülü çalıştırıp önbelleğe koyar. Modülün yeniden çalıştırılması için <code>importlib.reload</code> gerekir;
<code>__pycache__</code> yalnızca derleme adımını atlatır, çalıştırmayı değil.</p>
</div>

<div class="quiz" data-id="b04-4">
<p class="quiz-soru">Bir dekoratör <code>functools.wraps</code> kullanmadan yazılmıştır. Sarmalanan <code>sicaklik_oku</code> fonksiyonunun <code>__name__</code> değeri ne olur?</p>
<ul>
<li><code>"sicaklik_oku"</code></li>
<li data-dogru>Sarmalayıcı fonksiyonun adı (ör. <code>"sarmalayici"</code>)</li>
<li><code>None</code></li>
<li><code>"&lt;lambda&gt;"</code></li>
</ul>
<p class="quiz-aciklama">Dekoratör sonrasında ad sarmalayıcıya bağlıdır. <code>wraps</code>, özgün fonksiyonun <code>__name__</code>, <code>__doc__</code> ve
<code>__qualname__</code> niteliklerini sarmalayıcıya kopyalar.</p>
</div>

<div class="quiz" data-id="b04-5">
<p class="quiz-soru"><code>src/sensor_araclari/cli.py</code> içinde <code>from . import kayit</code> satırı vardır. <code>python src/sensor_araclari/cli.py</code> komutu neden hata verir?</p>
<ul>
<li>Dosyada <code>if __name__ == "__main__"</code> bloğu olmadığı için</li>
<li data-dogru>Dosya yoluyla çalıştırılan modülün bir üst paketi olmadığından göreli içe aktarma çözülemez</li>
<li><code>kayit</code> modülü ayrıca kurulmadığı için</li>
<li>Tip ipuçları çalışma anında denetlendiği için</li>
</ul>
<p class="quiz-aciklama">Dosya yoluyla çalıştırılan betik <code>__main__</code> adlı, paketi olmayan bir modüldür. Paket içindeki modüller
<code>python -m sensor_araclari.cli</code> veya kurulumla oluşan komutla çalıştırılmalıdır.</p>
</div>

<div class="quiz" data-id="b04-6">
<p class="quiz-soru"><code>@dataclass(frozen=True)</code> ile tanımlanmış bir <code>Olcum</code> nesnesinin <code>deger</code> alanına atama yapılırsa ne olur?</p>
<ul>
<li>Atama sessizce yok sayılır</li>
<li>Yeni bir nesne oluşturulur ve ad ona bağlanır</li>
<li data-dogru><code>dataclasses.FrozenInstanceError</code> yükseltilir</li>
<li>Yalnızca tip denetleyicisi uyarı verir</li>
</ul>
<p class="quiz-aciklama"><code>frozen=True</code>, üretilen <code>__setattr__</code> yöntemiyle atamayı engeller. Değiştirilmiş bir kopya için
<code>dataclasses.replace(o, deger=22.0)</code> kullanılır.</p>
</div>

!!! alistirma "Alıştırma: Süre ölçen dekoratör"
    Ağ geçidindeki yavaş işlemleri bulmak için fonksiyonların çalışma süresini günlüğe yazan bir
    dekoratör yazılacaktır.

    1. `sure_olc` adlı bir dekoratör yazın: fonksiyonun süresini `time.perf_counter()` ile ölçsün ve
       fonksiyonun modülüne ait günlükçüye DEBUG düzeyinde yazsın. Fonksiyon istisna yükseltse bile
       süre yazılmalıdır.
    2. Dekoratörü `sensor_araclari.olcum.ozetle` fonksiyonuna, kaynak dosyasını değiştirmeden uygulayın.
    3. Sarmalanmış fonksiyonun adının ve özgün fonksiyona erişimin korunduğunu doğrulayın.

    ??? success "Örnek çözüm"
        ```python
        import functools, logging, time, sys
        from pathlib import Path
        from sensor_araclari import olcum

        def sure_olc(fonk):
            log = logging.getLogger(fonk.__module__)
            @functools.wraps(fonk)
            def sarmalayici(*args, **kwargs):
                bas = time.perf_counter()
                try:
                    return fonk(*args, **kwargs)
                finally:                          # istisnada da çalışır
                    log.debug("%s %.3f ms sürdü", fonk.__qualname__,
                              (time.perf_counter() - bas) * 1e3)
            return sarmalayici

        logging.basicConfig(level=logging.DEBUG, format="%(levelname)s %(name)s: %(message)s")
        ozetle = sure_olc(olcum.ozetle)           # @ söz dizimi olmadan uygulama
        s = ozetle(olcum.dosya_oku(Path("ornek-veri/olcumler.csv")))
        print(s["sensor0"], ozetle.__name__, ozetle.__wrapped__ is olcum.ozetle)
        ```
        Örnek çıktı (süre makineye göre değişir):
        ```text
        DEBUG sensor_araclari.olcum: ozetle 1.040 ms sürdü
        {'adet': 4, 'min': 21.4, 'max': 31.2, 'ort': 24.25} ozetle True
        ```
        Ölçülen süre dosya okumayı da içerir, çünkü `dosya_oku()` bir üreteçtir ve satırlar `ozetle()`
        içinde tüketildikçe okunur. Günlük iletisinde f-string yerine `%` biçimi kullanılması, DEBUG düzeyi
        kapalıyken biçimlendirme maliyetinin oluşmamasını sağlar ([Bölüm 6](06-hata-test-kayit.md)).
        Dekoratörün modüle kalıcı uygulanması gerekirse `olcum.ozetle = sure_olc(olcum.ozetle)` atamasının,
        `ozetle`'yi daha önce `from ... import ozetle` ile almış modülleri etkilemeyeceği unutulmamalıdır.

**Sonraki bölüm:** [5 · Dosyalar, süreçler ve komut satırı araçları →](05-sistem-programlama.md)
