# 3 · Veri yapıları: liste, sözlük, küme, demet

<div class="kunye" markdown>
<span>Süre: ~45 dk + uygulama</span><span>Düzey: Başlangıç–Orta</span><span>Ön koşul: Bölüm 2</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - `list`, `tuple`, `dict` ve `set` türlerinin iç yapısını ve hangi iş için uygun olduklarını açıklayabilirsiniz.
    - Kavramalar (comprehension) ve üreteç ifadeleriyle okunabilir dönüşümler yazabilirsiniz.
    - Dilimleme söz dizimiyle diziler ve bayt çerçeveleri üzerinde çalışabilirsiniz.
    - Sığ ve derin kopyalama arasındaki farkı ve paylaşılan iç nesnelerin yol açtığı hataları açıklayabilirsiniz.
    - `collections` modülündeki `Counter`, `defaultdict`, `deque`, `namedtuple` ve `ChainMap` türlerini kullanabilirsiniz.
    - Temel işlemlerin zaman karmaşıklığını bilerek veri yapısı seçebilirsiniz.

## 3.1 Doğru veri yapısının önemi

Bir ağ geçidi saniyede yüzlerce ölçüm alabilir, günlük dosyaları milyonlarca satıra ulaşabilir ve
derleme betikleri binlerce paketin adını karşılaştırabilir. Bu işlerde seçilen veri yapısı hem kodun
doğruluğunu hem de hızını belirler. Bir paket adının listede aranması listenin boyuyla orantılı süre
alırken, aynı arama kümede sabit süreye yakındır. Python'un dört yerleşik kap türü bu nedenle farklı
iç yapılara sahiptir:

| Tür | Sözdizimi | Sıralı mı? | Değiştirilebilir mi? | Yinelenen eleman | İç yapı | Tipik kullanım |
|---|---|---|---|---|---|---|
| `list` | `[1, 2]` | Evet | Evet | Olabilir | Dinamik dizi | Sıralı kayıtlar, yığın |
| `tuple` | `(1, 2)` | Evet | Hayır | Olabilir | Sabit dizi | Kayıt, çoklu dönüş değeri, sözlük anahtarı |
| `dict` | `{"a": 1}` | Ekleme sırası | Evet | Anahtar tekil | Özet tablosu | Ada göre erişim, eşleme |
| `set` | `{1, 2}` | Hayır | Evet | Olamaz | Özet tablosu | Üyelik denetimi, küme işlemleri |

## 3.2 Liste

Liste, nesnelere başvuruların tutulduğu **dinamik bir dizidir**: bellekte ardışık bir işaretçi dizisi ve
bir uzunluk bilgisi. Bu yapı iki sonucu doğurur. İndeksle erişim (`liste[i]`) sabit sürelidir. Sona
ekleme (`append`) ortalamada sabit sürelidir; dizi dolduğunda daha büyük bir alan ayrılır ve
başvurular oraya taşınır, ancak bu ara sıra yapıldığı için ortalama maliyet düşüktür. Buna karşılık
**başa ekleme veya baştan silme** (`insert(0, x)`, `pop(0)`) tüm elemanların kaydırılmasını gerektirir ve
liste boyuyla orantılıdır. Kuyruk olarak kullanılacak yapı için `collections.deque` tercih edilir (3.9).

```python
okumalar = [21.4, 21.8]
okumalar.append(22.6)            # sona ekle
okumalar.extend([23.0, 23.1])    # başka bir yinelenebilirin elemanlarını ekle
okumalar.insert(0, 20.9)         # başa ekle (O(n))
son = okumalar.pop()             # sondan çıkar (O(1)); yığın olarak kullanım
okumalar.remove(21.8)            # değere göre ilk eşleşeni sil (O(n))
21.4 in okumalar                 # doğrusal arama (O(n))
```

Sıralama iki biçimde yapılır: `liste.sort()` listeyi yerinde sıralar ve `None` döndürür; `sorted(x)`
herhangi bir yinelenebilirden **yeni** bir liste üretir. İkisi de `key` ve `reverse` parametrelerini
alır ve **kararlıdır**: eşit anahtarlı elemanların özgün sırası korunur. Bu özellik çok aşamalı
sıralamada kullanılır: önce ikincil, sonra birincil anahtara göre sıralamak, birincil anahtara göre
gruplanmış ve her grup içinde ikincil anahtara göre sıralı bir sonuç verir.

```python
sirali = sorted(kayitlar, key=lambda k: k.deger, reverse=True)   # en yüksek değer önce
x = liste.sort()                                                  # x None'dır: sık yapılan hata
```

## 3.3 Demet ve açma (unpacking)

Demet, değiştirilemez bir dizidir. Parantez değil virgül demet oluşturur: `1, 2` bir demettir, `(1)`
ise yalnızca parantez içindeki `1` sayısıdır; tek elemanlı demet `(1,)` biçiminde yazılır. Demetler
anlamı sıradan belli olan küçük kayıtlar için kullanılır: `(adres, yazmac)`, `(zaman, sensor, deger)`.
Değiştirilemez ve (elemanları özetlenebiliyorsa) özetlenebilir oldukları için sözlük anahtarı
olabilirler:

```python
onbellek = {(1, 0): 214, (1, 1): 455}      # (cihaz adresi, yazmaç no) -> değer
```

**Açma** (unpacking), bir dizinin elemanlarını tek satırda adlara bağlar ve Python kodunda çok sık
kullanılır:

```python
adres, islev, baslangic, adet = struct.unpack(">BBHH", govde)   # Bölüm 7
a, b = b, a                                 # takas: sağ taraf önce demet olarak değerlendirilir
ilk, *kalan = [1, 2, 3]                     # ilk = 1, kalan = [2, 3]
for zaman, sensor, deger in kayitlar: ...   # döngüde açma
```

Eleman sayısı uyuşmazsa `ValueError: too many values to unpack` hatası alınır; bu, beklenmeyen
biçimdeki bir satırın erken yakalanmasını sağlar.

Alanlarına ad ile erişilmesi gereken demetler için `collections.namedtuple` kullanılır. Sınıf yazmadan
okunabilir kayıtlar üretir ve normal demet gibi açılabilir:

```python
Kayit = namedtuple("Kayit", "zaman sensor deger durum")
k = Kayit("10:00:01", "sensor0", 21.4, "TAMAM")
k.sensor, k[2]                              # ('sensor0', 21.4)
```

Daha zengin kayıtlar (varsayılan değer, doğrulama, yöntem) için `dataclass` kullanılır
(bkz. [Bölüm 4](04-fonksiyon-modul.md)).

## 3.4 Sözlük

Sözlük, anahtarları değerlere eşleyen bir **özet tablosudur** (hash table). Anahtarın `hash()` değeri
tablodaki konumu belirler; arama, ekleme ve silme ortalamada sabit sürelidir. Bu nedenle anahtarlar
özetlenebilir (değiştirilemez) olmalıdır. Python 3.7'den itibaren sözlükler **ekleme sırasını** korur;
bu bir uygulama ayrıntısı değil, dil güvencesidir.

```python
ayarlar = {"aralik": 5, "esik": 30.0}
ayarlar["aralik"]                    # 5; anahtar yoksa KeyError
ayarlar.get("port", "/dev/ttyS0")    # anahtar yoksa varsayılan değer
ayarlar.setdefault("hiz", 9600)      # yoksa ekler ve değeri döndürür
ayarlar.pop("esik", None)            # çıkarır; yoksa varsayılanı döndürür
"aralik" in ayarlar                  # anahtar üyeliği (değerlerde arama yapmaz)
for ad, deger in ayarlar.items(): ...
birlesik = varsayilan | kullanici    # 3.9+: sağdaki sözlük öncelikli
```

`KeyError` ile `get()` arasındaki seçim bir tasarım kararıdır. Anahtarın bulunması zorunluysa `[]`
kullanılır ve eksiklik hata olarak ortaya çıkar; isteğe bağlıysa `get()` ile açık bir varsayılan
verilir. Varsayılan değeri `None` olan `get()` çağrılarının sonucu sessizce aşağı akabilir ve hatayı
asıl kaynağından uzakta ortaya çıkarabilir.

!!! dikkat "Dolaşılırken sözlük boyutu değiştirilemez"
    `for k in d:` döngüsü içinde `d`'ye anahtar eklemek veya silmek
    `RuntimeError: dictionary changed size during iteration` hatası verir. Silinecek anahtarlar önce
    ayrı bir listeye toplanmalı ya da sözlüğün kopyası dolaşılmalıdır: `for k in list(d): ...`.

## 3.5 Küme

Küme, yalnızca anahtarlardan oluşan bir özet tablosudur: elemanlar tekildir, sıra yoktur ve üyelik
denetimi sabit sürelidir. Matematiksel küme işlemleri işleçlerle yazılır:

```python
dagitim = set("systemd usrmerge ipv6".split())
{"systemd"} <= dagitim               # True: alt küme mi?
{"systemd", "x11"} <= dagitim        # False
dagitim & {"ipv6", "wifi"}           # {'ipv6'}: kesişim
dagitim | {"wifi"}                   # birleşim
dagitim - {"ipv6"}                   # fark
```

Kümelerin sırası yoktur; yazdırıldığında elemanların sırası çalıştırmadan çalıştırmaya değişebilir.
Sıralı çıktı gerektiğinde `sorted(kume)` kullanılır. Değiştirilemez küme türü `frozenset`, sözlük
anahtarı veya başka bir kümenin elemanı olarak kullanılabilir. Boş küme `{}` ile değil `set()` ile
oluşturulur; `{}` boş bir sözlüktür.

Yocto'da sıkça kullanılan `bb.utils.contains()` fonksiyonu tam olarak bu işlemi yapar. BitBake
kaynak kodundaki uygulaması (kısaltılmış):

```python title="bitbake/lib/bb/utils.py (kesit)"
def contains(variable, checkvalues, truevalue, falsevalue, d):
    val = d.getVar(variable)
    if not val:
        return falsevalue
    val = set(val.split())
    if isinstance(checkvalues, str):
        checkvalues = set(checkvalues.split())
    else:
        checkvalues = set(checkvalues)
    if checkvalues.issubset(val):
        return truevalue
    return falsevalue
```

Boşlukla ayrılmış bir metin önce kümeye çevrilir, ardından alt küme denetimi yapılır. `contains_any()`
ise `issubset` yerine kesişim (`checkvalues & val`) kullanır. Bu nedenle `DISTRO_FEATURES` içinde
`x11-extra` bulunması `x11` denetimini doğru çıkarmaz: eşleşme alt dizgiyle değil, tam kelimeyle yapılır.

## 3.6 Kavramalar ve üreteç ifadeleri

**Kavrama** (comprehension), bir yinelenebilirden filtreleyerek ve dönüştürerek yeni bir kap üreten
kısa söz dizimidir:

```python
degerler = [k.deger for k in kayitlar if k.durum == "TAMAM"]          # liste kavraması
sensorler = {k.sensor for k in kayitlar}                              # küme kavraması
ortalama = {s: sum(v) / len(v) for s, v in gruplar.items()}           # sözlük kavraması
```

Köşeli parantez yerine normal parantez kullanıldığında sonuç bir liste değil **üreteçtir**: değerler
önceden hesaplanmaz, istendikçe tek tek üretilir. Büyük günlük dosyalarında bu fark bellek kullanımını
belirler. Bu bölüm için yapılan bir ölçümde 10 000 elemanlı listenin kendisi yaklaşık 85 KB tutarken,
aynı değerleri üreten üreteç nesnesi 200 baytın altında kalmıştır:

```python
toplam = sum(k.deger for k in kayitlar)                # ara liste oluşmaz
en_yuksek = max((k for k in kayitlar), key=lambda k: k.deger)
```

Bir üreteç yalnızca bir kez dolaşılabilir; ikinci kez dolaşıldığında boş görünür. Değerler birden çok
kez kullanılacaksa listeye çevrilmelidir. Kavramalar kısa dönüşümler için okunabilirdir; iç içe birden
çok `for` ve `if` içeren bir kavrama ise normal döngü olarak yazıldığında daha anlaşılır olur.

### Yineleme protokolü

`for` döngüsü, kavramalar, `sum()`, `sorted()`, `list()` ve açma söz dizimi aynı protokolü kullanır.
Bir nesne **yinelenebilir** ise `iter(nesne)` çağrısı bir **yineleyici** döndürür; yineleyicinin her
`next()` çağrısı sıradaki elemanı verir ve elemanlar bittiğinde `StopIteration` yükseltilir. `for`
döngüsü bu istisnayı yakalayarak sona erer:

```python
y = iter([21.4, 21.8])
next(y), next(y)          # (21.4, 21.8)
next(y)                   # StopIteration
next(y, None)             # varsayılan verilirse istisna yerine None döner
```

Liste, demet, sözlük, küme ve metin yinelenebilirdir ve her `iter()` çağrısında baştan başlayan yeni
bir yineleyici verir. Açık dosya nesneleri, üreteçler, `map`, `zip` ve `enumerate` sonuçları ise
**kendileri yineleyicidir**: bir kez tüketildiklerinde biterler. Bir dosyanın satırları iki kez
dolaşılmak istendiğinde ikinci döngünün hiç çalışmaması bu nedenledir.

Bu protokol, büyük veriyi parça parça işleyen kodun temelidir. Kitabın paketindeki `dosya_oku()`
fonksiyonu `yield` kullanan bir **üreteç fonksiyonudur**: CSV dosyasını satır satır okur ve her
çağrıda tek bir ölçüm üretir; dosyanın tamamı belleğe alınmaz. Çağıran taraf bu üreteci doğrudan
`ozetle(dosya_oku(yol))` biçiminde başka bir fonksiyona verebilir. Seri porttan sürekli gelen veriyi
işleyen bir okuma döngüsü de aynı biçimde, değerleri üreten bir üreteç olarak yazılabilir; böylece
okuma, ayrıştırma ve özetleme birbirinden ayrı ve ayrı ayrı sınanabilir parçalar olur.

## 3.7 Dilimleme

Dizi türleri (`list`, `tuple`, `str`, `bytes`, `bytearray`) `dizi[başlangıç:bitiş:adım]` söz dizimiyle
dilimlenir. Başlangıç dahil, bitiş hariçtir; negatif indeksler sondan sayar. Sınırların dışına taşan
dilimler hata vermez, yalnızca kısalır.

```python
x = list(range(10))
x[2:8:2]        # [2, 4, 6]
x[-3:]          # [7, 8, 9]: son üç eleman
x[::-1]         # ters sıra (yeni liste)
x[:]            # sığ kopya
x[1:3] = ["a"]  # dilime atama: iki eleman yerine bir eleman konur
```

Bayt çerçevelerinin ayrıştırılması dilimlemenin en tipik kullanımıdır. Modbus RTU çerçevesinin son iki
baytı CRC'dir:

```python title="examples/sensor-araclari/src/sensor_araclari/protokol.py (kesit)"
govde, (gelen,) = cerceve[:-2], _CRC.unpack(cerceve[-2:])
```

Liste ve bayt dilimleri **kopya** üretir. Büyük tamponlarda kopyalamadan dilimleme için
`memoryview` kullanılır (bkz. [Bölüm 7](07-donanim-iletisim.md)).

## 3.8 Sığ ve derin kopyalama

Bölüm 2'de gösterildiği gibi atama kopya üretmez. Kopya gerektiğinde iki düzey vardır:

- **Sığ kopya** (`copy.copy(x)`, `list(x)`, `x.copy()`, `x[:]`): Yalnızca en dıştaki kap yeniden
  oluşturulur. İçindeki nesneler paylaşılır.
- **Derin kopya** (`copy.deepcopy(x)`): İç içe tüm değiştirilebilir nesneler özyinelemeli olarak
  kopyalanır.

Fark, iç içe yapılarda ortaya çıkar. Varsayılan yapılandırmanın sığ kopyası üzerinde çalışan bir kod,
iç listeyi değiştirdiğinde farkında olmadan varsayılanı da değiştirir:

<div class="akis" data-senaryo="sig-derin-kopya"></div>

Aynı tuzağın daha yaygın bir biçimi, çarpma işleciyle iç içe liste oluşturmaktır. `[[]] * 3` üç ayrı
liste değil, **aynı listeye üç başvuru** içerir:

```python
tablo = [[]] * 3;               tablo[0].append(1)   # [[1], [1], [1]]
tablo = [[] for _ in range(3)]; tablo[0].append(1)   # [[1], [], []]
```

Derin kopya her durumda doğru çözüm değildir: büyük yapılarda yavaştır ve dosya, soket veya kilit gibi
kopyalanamayan nesneler içeren yapılarda hata verir. Çoğu durumda daha iyi tasarım, varsayılan
değerleri değiştirmek yerine her seferinde yeni bir yapı üreten bir fonksiyon yazmaktır.

## 3.9 `collections` modülü

Standart kütüphanenin `collections` modülü yerleşik türlerin özelleşmiş biçimlerini sunar. Günlük
analizi örneği bunların çoğunu birlikte kullanır:

```python title="examples/bolum-03/olcum_ozet.py (kesit)"
hatalar = Counter(k.durum for k in kayitlar if k.durum != "TAMAM")     # (1)!
gruplar = defaultdict(list)                                             # (2)!
for k in kayitlar:
    if k.durum == "TAMAM":
        gruplar[k.sensor].append(k.deger)
pencere = deque(maxlen=3)                                               # (3)!
for d in gruplar["sensor0"]:
    pencere.append(d)
    print(f"kayan ort. {sum(pencere) / len(pencere):.2f}")
```

1.  **`Counter`**: Sayım sözlüğü. `most_common(n)` en sık n değeri sıralı verir; iki sayaç toplanıp çıkarılabilir.
2.  **`defaultdict(list)`**: Eksik anahtara erişildiğinde verilen fabrika fonksiyonuyla (burada `list`) bir
    değer üretir. `if k not in d: d[k] = []` kalıbını ortadan kaldırır.
3.  **`deque(maxlen=3)`**: İki uçlu kuyruk. Her iki uçta ekleme ve çıkarma sabit sürelidir; `maxlen`
    verildiğinde dolu kuyruğa eklenen eleman öbür uçtakini düşürür. Sabit boyutlu halka arabellek budur.

`ChainMap`, birden çok sözlüğü tek bir görünüm olarak birleştirir ve aramayı sırayla yapar. Komut
satırı aracının ayar önceliği (komut satırı > ortam değişkeni > dosya > varsayılan) bu türle doğrudan
ifade edilir:

```python
ayar = ChainMap(komut_satiri, ortam, dosya, varsayilan)
ayar["esik"]          # ilk sözlükte varsa oradan, yoksa sıradakinden
```

`OrderedDict` artık yalnızca `move_to_end()` ve sıraya duyarlı eşitlik gibi özel işlemler için
gereklidir; ekleme sırasının korunması için normal `dict` yeterlidir.

<div class="terminal" data-oturum="veri-yapilari"></div>

## 3.10 Zaman karmaşıklığı

Aşağıdaki tablo CPython'daki ortalama maliyetleri özetler (n: kaptaki eleman sayısı):

| İşlem | `list` | `dict` / `set` | `deque` |
|---|---|---|---|
| İndeksle erişim `x[i]` | O(1) | — | O(n) (uçlarda O(1)) |
| Anahtarla erişim / üyelik `in` | O(n) | O(1) | O(n) |
| Sona ekleme | O(1) ortalama | O(1) ortalama | O(1) |
| Başa ekleme / baştan çıkarma | O(n) | — | O(1) |
| Ortadan silme | O(n) | O(1) | O(n) |
| Sıralama | O(n log n) | — | — |

Terminal oturumundaki ölçümler tabloyu doğrular: 10 000 elemanlı listede üyelik denetimi mikrosaniyeler,
kümede ise onlarca nanosaniye mertebesindedir. Mutlak süreler makineye göre değişir; önemli olan
büyüme biçimidir. Bir paket listesinin her elemanı için başka bir listede `in` denetimi yapan iç içe
döngü O(n·m) maliyetlidir; ikinci liste önce kümeye çevrildiğinde maliyet O(n + m) olur.

!!! iyi "Önce ölç, sonra iyileştir"
    Performans sorunu varsayımla değil ölçümle belirlenir. Küçük kod parçaları için `python3 -m timeit`,
    bütün bir program için `python3 -m cProfile -s cumtime betik.py` kullanılır. Ağ geçidi gibi düşük
    güçlü işlemcilerde ölçüm, geliştirme makinesinde değil hedef cihazda yapılmalıdır.

!!! lab "Uygulama 3.1 · Günlük özetinin genişletilmesi"
    1. `examples/bolum-03/olcum_ozet.py` betiğini çalıştırın ve her satırın hangi veri yapısıyla
       üretildiğini kaynakla eşleştirin.
    2. Betiğe, her sensörün **son iki** başarılı okumasını tutan bir yapı ekleyin. Yapı
       `defaultdict(lambda: deque(maxlen=2))` biçiminde olmalıdır.
    3. Hata kodlarını sensöre göre sayan bir `Counter` ekleyin; anahtar olarak `(sensor, durum)` demeti
       kullanın. Sonuç `Counter({('sensor1', 'E_ZAMAN_ASIMI'): 1, ...})` biçiminde olmalıdır.
    4. `examples/bolum-03/kopyalama.py` betiğinde `copy.copy` satırını `dict(varsayilan)` ile
       değiştirin ve sonucun değişmediğini doğrulayın.

## Özet

- Liste dinamik dizidir: sona ekleme ve indeksle erişim hızlı, başa ekleme ve arama yavaştır.
- Demet değiştirilemez kayıttır; açma söz dizimiyle elemanlar tek satırda adlara bağlanır.
- Sözlük ve küme özet tablosudur; anahtarlar özetlenebilir olmalıdır. Sözlük ekleme sırasını korur.
- `bb.utils.contains()` boşlukla ayrılmış metni kümeye çevirip alt küme denetimi yapar.
- Kavramalar kısa dönüşümler içindir; üreteç ifadeleri ara liste oluşturmadan değer üretir.
- Dilimleme yeni bir kopya üretir; sınır dışı dilimler hata vermez.
- Sığ kopya iç nesneleri paylaşır; `[[]] * n` aynı listeye n başvuru içerir.
- `Counter`, `defaultdict`, `deque(maxlen)` ve `ChainMap` sık karşılaşılan kalıpları kısaltır.
- Veri yapısı seçimi karmaşıklık tablosuna göre yapılır; performans ölçülerek doğrulanır.

## Değerlendirme soruları

<div class="quiz" data-id="b03-1">
<p class="quiz-soru">Yeni gelen ölçümlerin sona eklendiği ve en eskisinin baştan çıkarıldığı bir kuyruk için en uygun tür hangisidir?</p>
<ul>
<li><code>list</code> ve <code>pop(0)</code></li>
<li data-dogru><code>collections.deque</code> ve <code>popleft()</code></li>
<li><code>set</code></li>
<li><code>tuple</code></li>
</ul>
<p class="quiz-aciklama"><code>list.pop(0)</code> tüm elemanları kaydırdığı için O(n) maliyetlidir. <code>deque</code> iki uçta da sabit süreli ekleme
ve çıkarma sağlar; <code>maxlen</code> ile sabit boyutlu halka arabelleğe dönüşür.</p>
</div>

<div class="quiz" data-id="b03-2">
<p class="quiz-soru"><code>DISTRO_FEATURES = "x11-extra wifi"</code> iken <code>bb.utils.contains('DISTRO_FEATURES', 'x11', 'evet', 'hayır', d)</code> ne döndürür?</p>
<ul>
<li><code>'evet'</code>, çünkü <code>x11</code> metni değerin içinde geçer</li>
<li data-dogru><code>'hayır'</code>, çünkü değer kelimelere bölünüp kümeye çevrilir ve <code>x11</code> kümede yoktur</li>
<li><code>None</code></li>
<li><code>KeyError</code> yükseltilir</li>
</ul>
<p class="quiz-aciklama">Fonksiyon <code>set(val.split())</code> ile tam kelimelerden bir küme oluşturur ve alt küme denetimi yapar; alt dizgi araması yapılmaz.</p>
</div>

<div class="quiz" data-id="b03-3">
<p class="quiz-soru"><code>v = {"sensorler": ["s0"]}</code>, <code>k = v.copy()</code>, <code>k["sensorler"].append("s1")</code> satırlarından sonra <code>v["sensorler"]</code> nedir?</p>
<ul>
<li><code>["s0"]</code></li>
<li data-dogru><code>["s0", "s1"]</code></li>
<li><code>["s1"]</code></li>
<li><code>AttributeError</code></li>
</ul>
<p class="quiz-aciklama"><code>dict.copy()</code> sığ kopyadır: iki sözlük aynı liste nesnesine başvurur. Bağımsız bir kopya için <code>copy.deepcopy</code> kullanılmalıdır.</p>
</div>

<div class="quiz" data-id="b03-4">
<p class="quiz-soru">Aşağıdakilerden hangisi sözlük anahtarı olarak kullanılamaz?</p>
<ul>
<li><code>(1, 0)</code></li>
<li><code>"sensor0"</code></li>
<li data-dogru><code>[1, 0]</code></li>
<li><code>frozenset({"a"})</code></li>
</ul>
<p class="quiz-aciklama">Sözlük anahtarlarının özet (hash) değeri olmalıdır. Liste değiştirilebilir olduğundan özetlenemez; demet,
metin ve <code>frozenset</code> özetlenebilir.</p>
</div>

<div class="quiz" data-id="b03-5">
<p class="quiz-soru"><code>s = [3, 1, 2]</code> için <code>x = s.sort()</code> satırından sonra <code>x</code> ve <code>s</code> nedir?</p>
<ul>
<li><code>x = [1, 2, 3]</code>, <code>s = [3, 1, 2]</code></li>
<li><code>x = [1, 2, 3]</code>, <code>s = [1, 2, 3]</code></li>
<li data-dogru><code>x = None</code>, <code>s = [1, 2, 3]</code></li>
<li><code>x = None</code>, <code>s = [3, 1, 2]</code></li>
</ul>
<p class="quiz-aciklama">Nesneyi yerinde değiştiren yöntemler (<code>sort</code>, <code>append</code>, <code>reverse</code>) <code>None</code> döndürür. Yeni bir
sıralı liste gerekiyorsa <code>sorted(s)</code> kullanılır.</p>
</div>

!!! alistirma "Alıştırma: Yinelenen çerçevelerin ayıklanması"
    Cihaz, her ölçüm çerçevesine artan bir sıra numarası ekler. Kablosuz bağlantıda yeniden gönderim
    nedeniyle bazı çerçeveler iki kez gelmektedir. Gelen çerçeveler `(sira_no, sensor, deger)` demetleri
    olarak verilmiştir:

    ```python
    cerceveler = [(1, "sensor0", 21.4), (2, "sensor1", 19.0), (2, "sensor1", 19.0),
                  (3, "sensor0", 21.8), (4, "sensor0", 22.6), (5, "sensor0", 31.2),
                  (3, "sensor0", 21.8)]
    ```

    1. Daha önce görülen sıra numaralarını tutarak yinelenen çerçeveleri atın ve kaç çerçevenin
       atıldığını sayın.
    2. Her sensör için yalnızca son üç değeri tutan bir yapı oluşturun.
    3. Seçtiğiniz veri yapılarının üyelik denetimi ve ekleme maliyetlerini açıklayın.

    ??? success "Örnek çözüm"
        ```python
        from collections import defaultdict, deque

        gorulen = set()
        son = defaultdict(lambda: deque(maxlen=3))
        tekrar = 0
        for sira, sensor, deger in cerceveler:
            if sira in gorulen:          # küme: O(1) üyelik denetimi
                tekrar += 1
                continue
            gorulen.add(sira)
            son[sensor].append(deger)    # deque: O(1) ekleme, en eski değer kendiliğinden düşer

        print(tekrar, {s: list(v) for s, v in son.items()})
        # 2 {'sensor0': [21.8, 22.6, 31.2], 'sensor1': [19.0]}
        ```
        Görülen numaralar liste yerine kümede tutulur; aksi halde her çerçevede doğrusal arama yapılırdı.
        Uzun süre çalışan bir serviste `gorulen` kümesi sınırsız büyür. Sıra numaraları arttığına göre
        yalnızca son N numarayı tutmak yeterlidir: bunun için küme yanında `deque(maxlen=N)` ile en eski
        numara izlenip kümeden çıkarılabilir veya sıra numarası taşmasız artıyorsa "en son görülen
        numaradan küçük veya eşitse at" kuralı uygulanabilir.

**Sonraki bölüm:** [4 · Fonksiyonlar, modüller, paketler ve sınıflar →](04-fonksiyon-modul.md)
