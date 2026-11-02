# 2 · Dil temelleri: türler, ifadeler, akış denetimi

<div class="kunye" markdown>
<span>Süre: ~50 dk + uygulama</span><span>Düzey: Başlangıç</span><span>Ön koşul: Bölüm 1</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - Python'un dinamik ve güçlü tipleme modelini C ile karşılaştırarak açıklayabilirsiniz.
    - Ad, nesne ve kimlik kavramlarını; atamanın ve takma adın (aliasing) nasıl çalıştığını açıklayabilirsiniz.
    - Değiştirilebilir ve değiştirilemez türleri ayırt edip bunun sonuçlarını öngörebilirsiniz.
    - Tamsayı, kayan noktalı sayı, `str` ve `bytes` türlerini donanım verisiyle çalışırken doğru kullanabilirsiniz.
    - f-string biçim belirteçleriyle onaltılık, ikili ve hizalı çıktılar üretebilirsiniz.
    - Koşul, döngü ve `match` deyimleriyle akış denetimi yazabilirsiniz.

## 2.1 Dinamik ve güçlü tipleme

C'de her değişkenin türü derleme anında bildirilir ve değişken bellekte o türe ayrılmış sabit bir
alandır: `int16_t sicaklik;` iki baytlık bir yerdir ve içine yalnızca bu türde değer yazılır. Python'da
ise tür **değişkene değil, değere** aittir. Bir ad önce bir tamsayıya, sonra bir metne bağlanabilir;
denetim, işlem yapılırken çalışma zamanında yapılır. Bu yaklaşıma **dinamik tipleme** denir.

Python aynı zamanda **güçlü tiplidir**: türler arasında örtük dönüşüm yapılmaz. `"21.4" + 1` ifadesi
C'deki gibi bir işaretçi aritmetiğine ya da JavaScript'teki gibi metin birleştirmeye dönüşmez;
`TypeError` yükseltir. Dönüşüm her zaman açıkça yazılır: `float("21.4") + 1`. Bu iki özelliğin
birleşimi şu sonucu doğurur: tür hataları derleyici tarafından değil, ilgili satır çalıştığında
yakalanır. Python'un tip ipuçları (`def oku(adres: int) -> float`) bu durumu değiştirmez; ipuçları
yorumlayıcı tarafından denetlenmez, yalnızca `mypy` gibi araçlar ve okuyucu için belgedir
(bkz. [Bölüm 4](04-fonksiyon-modul.md)).

Çalışma anında tür sorgulanabilir:

```python
type(21.4)                     # <class 'float'>
isinstance(True, int)          # True: bool, int'in alt sınıfıdır
isinstance(21, (int, float))   # birden çok türden biri mi?
```

`type(x) == int` yerine `isinstance(x, int)` tercih edilir; çünkü `isinstance` alt sınıfları da kabul
eder ve kalıtımla genişletilen kodu bozmaz.

## 2.2 Adlar, nesneler ve kimlik

Python'daki her değer bir **nesnedir** ve her nesnenin üç özelliği vardır:

- **Kimlik:** Nesnenin yaşamı boyunca değişmeyen benzersiz numarası, `id(nesne)`. CPython'da bu, nesnenin
  bellekteki adresidir.
- **Tür:** Nesnenin hangi işlemleri desteklediğini belirler, `type(nesne)`.
- **Değer:** Nesnenin taşıdığı veri. Bazı türlerde değer değiştirilebilir, bazılarında değiştirilemez.

Değişken ise bir kutu değil, bir nesneye iliştirilmiş **addır**. `okumalar = [21.4, 21.8]` deyimi önce
bir liste nesnesi oluşturur, sonra `okumalar` adını bu nesneye bağlar. `yedek = okumalar` deyimi kopya
üretmez; ikinci bir adı aynı nesneye bağlar. Bu duruma **takma ad** (aliasing) denir. Aşağıdaki
animasyon adların ve nesnelerin ayrı alanlarda yaşadığını ve atamaların yalnızca bağları değiştirdiğini
gösterir:

<div class="akis" data-senaryo="ad-baglama"></div>

İki karşılaştırma işleci bu ayrıma dayanır:

| İşleç | Sorduğu soru | Kullanım |
|---|---|---|
| `a == b` | Değerleri eşit mi? (`__eq__` yöntemi) | Sayı, metin, liste karşılaştırmaları |
| `a is b` | Aynı nesne mi? (kimlik) | Yalnızca `None`, `True`, `False` gibi tekil nesneler ve kasıtlı kimlik denetimi |

!!! dikkat "`is` sayı ve metin karşılaştırmasında kullanılmaz"
    CPython küçük tamsayıları ve bazı kısa metinleri önbellekte tutar; bu nedenle `x is 5` bazen `True`,
    bazen `False` sonuç verir. Bu bir uygulama ayrıntısıdır ve dil tarafından güvence altına alınmaz.
    Python 3.8'den itibaren derleyici bu kullanımı `SyntaxWarning: "is" with 'int' literal` uyarısıyla
    bildirir. Değer karşılaştırması her zaman `==` ile, `None` denetimi her zaman `is None` ile yapılır.

### Fonksiyonlara argüman geçirme

Fonksiyon çağrısı da bir ad bağlamadır: parametre adı, çağıranın verdiği nesneye bağlanır. Değer
kopyalanmaz (C'deki değerle geçirme değildir) ve çağıranın adı fonksiyona verilmez (C++'taki başvuruyla
geçirme de değildir). Sonuç şöyle özetlenir: fonksiyon, aldığı **nesneyi değiştirebilir**, ancak
parametresini **yeniden bağlaması** çağıranı etkilemez.

```python title="examples/bolum-02/ad_baglama.py (kesit)"
def ekle(liste, deger):
    liste.append(deger)          # çağıranın nesnesini değiştirir
    liste = [deger]              # yalnızca yerel adı yeniden bağlar; çağıranı etkilemez
    return liste

ana = [1]
donen = ekle(ana, 2)             # ana -> [1, 2], donen -> [2]
```

<div class="terminal" data-oturum="repl-nesneler"></div>

## 2.3 Değiştirilebilir ve değiştirilemez türler

| Değiştirilemez (immutable) | Değiştirilebilir (mutable) |
|---|---|
| `int`, `float`, `complex`, `bool` | `list` |
| `str`, `bytes` | `bytearray` |
| `tuple`, `frozenset` | `dict`, `set` |
| `None` | Çoğu sınıf örneği |

Değiştirilemez bir nesnenin değeri, nesne var olduğu sürece aynı kalır. `sayac += 1` deyimi `10`
nesnesini `11` yapmaz; `11` değerinde başka bir nesne bulur ve `sayac` adını ona bağlar. Aynı işleç
listede ise nesneyi yerinde genişletir. Bu fark, takma adlarla birlikte kullanıldığında belirginleşir:

```python
a = b = [1]; a += [2]      # b de [1, 2] olur: liste yerinde genişledi
a = b = (1,); a += (2,)    # b (1,) kalır: yeni bir demet oluştu ve yalnızca a bağlandı
```

Değiştirilebilirliğin üç önemli sonucu vardır:

1. **Özet değeri (hash):** Sözlük anahtarları ve küme elemanları `hash()` değerine göre yerleştirilir.
   Değeri değişebilen bir nesnenin özeti de değişeceğinden, değiştirilebilir yerleşik türlerin özet
   değeri yoktur; liste sözlük anahtarı olamaz, demet olabilir (içindeki tüm elemanlar özetlenebiliyorsa).
2. **Paylaşılan durum:** Bir fonksiyona veya başka bir nesneye verilen liste, verenin elinde de değişir.
   Kopyalama gerektiğinde açıkça yapılmalıdır (bkz. [Bölüm 3](03-veri-yapilari.md)).
3. **Değiştirilebilir varsayılan argümanlar:** `def f(x, liste=[])` biçimindeki varsayılan liste her
   çağrıda paylaşılır (bkz. [Bölüm 4](04-fonksiyon-modul.md)).

Demetin değiştirilemezliği yüzeyseldir: `(1, [2, 3])` demetinin elemanları başka nesnelere
bağlanamaz, ancak içindeki liste değiştirilebilir. REPL oturumundaki `a[1].append(4)` satırı bu
durumu gösterir.

## 2.4 Sayılar

**`int`** sınırsız duyarlıklıdır: `2**64` taşmaz, gerektiği kadar bellek kullanır. Donanım
yazmaçlarıyla çalışırken bu özellik bir tuzak oluşturabilir. C'de `uint16_t` toplamı kendiliğinden
65536'ya göre kalan alır; Python'da bu davranış maskeyle açıkça üretilmelidir:

```python
(0xFFF0 + 0x20) & 0xFFFF       # 16: 16 bitlik sayaç taşması
yazmac = 0b1010_0011           # alt çizgi okunabilirlik içindir
yazmac & 0x0F, yazmac >> 4     # (3, 10): alt ve üst dört bit
yazmac | (1 << 2)              # 2. biti kurma
yazmac & ~(1 << 0)             # 0. biti temizleme
int("1F", 16), int("0b101", 0) # (31, 5): taban verilerek metinden çevirme; 0 öneki tanır
```

Tamsayı bölmesi `//` ve kalan `%`, C'den farklı olarak **aşağı doğru** yuvarlar: `-7 // 2` sonucu
`-4`, `-7 % 3` sonucu `2`'dir. C'deki sıfıra doğru kesme davranışı gerekiyorsa `int(-7 / 2)` veya
`math.trunc` kullanılır. `/` işleci her zaman `float` döndürür.

**`float`**, IEEE 754 çift duyarlıklı sayıdır ve C'deki `double` ile aynıdır. `0.1` ikili tabanda tam
gösterilemediği için `0.1 + 0.2 == 0.3` yanlıştır. Ölçüm değerleri karşılaştırılırken
`math.isclose(a, b, abs_tol=0.05)` kullanılır. Para veya kesin ondalık gereken yerlerde `decimal.Decimal`
tercih edilir. `round()` fonksiyonu "en yakın çifte yuvarlama" kuralını uygular: `round(2.5)` sonucu
`2`, `round(3.5)` sonucu `4`'tür.

Sensör verilerinde sık kullanılan yaklaşım, değerin cihazda **ölçeklenmiş tamsayı** olarak taşınmasıdır:
sıcaklık 21.4 °C yerine 214 değeri gönderilir ve uygulama 10'a böler. Böylece kayan nokta biçimi
cihazla bilgisayar arasında taşınmaz (bkz. [Bölüm 7](07-donanim-iletisim.md)).

### `bool` ve `None`

`bool` türünün yalnızca iki örneği vardır: `True` ve `False`. Tarihsel nedenlerle `bool`, `int`'in alt
sınıfıdır; `True + True` sonucu `2`'dir ve `sum(k.durum == "TAMAM" for k in kayitlar)` gibi bir ifade
doğru koşulları sayar. Bu özellik kullanışlıdır, ancak bir fonksiyonun `int` beklediği yerde yanlışlıkla
`bool` alması hata vermez; bu nedenle tür denetimi gereken yerlerde `type(x) is bool` ayrımı ayrıca
yapılır.

`None`, "değer yok" anlamına gelen tekil nesnedir ve türü `NoneType`'tır. Dönüş değeri yazılmayan her
fonksiyon `None` döndürür. "Ayar verilmedi" ile "ayar sıfır" durumlarını ayırmak için `None` kullanılır:
`esik=None` parametresi eşik denetiminin hiç yapılmayacağını, `esik=0.0` ise sıfır derecede yapılacağını
anlatır. Bu ayrım `if esik:` ile değil `if esik is not None:` ile denetlenmelidir; aksi halde sıfır değeri
"verilmedi" gibi işlem görür.

### İşleç önceliği ve kısa devre

Python'un işleç önceliği C'ye benzer, ancak bit işleçleri ile karşılaştırma işleçlerinin sırası
C'den farklıdır ve bu fark donanım kodunda önemlidir:

| Öncelik (yüksekten düşüğe) | İşleçler |
|---|---|
| Üs alma | `**` |
| Tekli | `-x`, `+x`, `~x` |
| Çarpımsal | `*`, `/`, `//`, `%` |
| Toplamsal | `+`, `-` |
| Kaydırma | `<<`, `>>` |
| Bit düzeyinde VE, XOR, VEYA | `&`, `^`, <code>&#124;</code> |
| Karşılaştırma, üyelik, kimlik | `<`, `<=`, `==`, `!=`, `in`, `is` ... |
| Mantıksal | `not`, `and`, `or` |

C'de `yazmac & 0x01 == 0` ifadesi `yazmac & (0x01 == 0)` olarak değerlendirilir ve sık rastlanan bir
hatadır. Python'da bit işleçleri karşılaştırmadan önce geldiğinden aynı ifade beklendiği gibi
`(yazmac & 0x01) == 0` anlamına gelir. Yine de okunabilirlik için parantez yazılması önerilir.

`and` ve `or` işleçleri **kısa devre** yapar ve sonuç olarak `True`/`False` değil, işlenenlerden birini
döndürür: `a or b`, `a` doğruysa `a`'yı, değilse `b`'yi; `a and b`, `a` yanlışsa `a`'yı, değilse `b`'yi
döndürür. Sağ taraf yalnızca gerektiğinde değerlendirilir. Bu özellik `port and port.close()` gibi
kalıplarda kullanılır, ancak `ayar.get("aralik") or 5` ifadesinde `0` değerinin de 5'e dönüşeceği
unutulmamalıdır.

## 2.5 Metin (`str`) ve bayt (`bytes`)

Python 3'te metin ve ikili veri ayrı türlerdir ve bu ayrım, donanımla çalışan kod için dilin en
önemli özelliklerinden biridir:

- **`str`**: Unicode kod noktalarından oluşan değiştirilemez dizi. `len("sıcaklık")` sonucu 8'dir.
- **`bytes`**: 0–255 arası tamsayılardan oluşan değiştirilemez dizi. Seri porttan, soketten veya ikili
  dosyadan okunan veri her zaman `bytes`'tır.

İkisi arasında geçiş yalnızca **kodlama** belirtilerek yapılır: `metin.encode("utf-8")` ve
`veri.decode("utf-8")`. "sıcaklık" metni UTF-8'de 10 bayttır, çünkü `ı` harfi iki bayt (C4 B1) tutar.
Kodlamanın varsayılan değere bırakılması, metnin farklı bir makinede farklı çözülmesine yol açabilir;
bu nedenle dosya ve süreç işlemlerinde kodlama her zaman açıkça yazılır (bkz. [Bölüm 5](05-sistem-programlama.md)).

`bytes` nesnesinin tek bir elemanı `int`'tir, dilimi ise yine `bytes`'tır: `b"\x01\x03"[0]` sonucu
`1`, `b"\x01\x03"[0:1]` sonucu `b'\x01'`. Bu ayrım, bir çerçevenin işlev kodu okunurken
`if cerceve[1] == 0x03` yazılmasını sağlar. Okunabilir onaltılık gösterim için `veri.hex(" ")` ve
tersi için `bytes.fromhex("01 03 00 00")` kullanılır.

Dizgi sabitlerinde ters eğik çizgi kaçış dizisi başlatır: `"\r\n"` satır başı ve satır sonu, `"\x1b"`
ESC karakteri, `"ı"` ise `ı` harfidir. Düzenli ifade kalıplarında ve kaçışın istenmediği her yerde
**ham dizgi** kullanılır: `r"\d+\.\d"` yazımında ters eğik çizgiler olduğu gibi kalır. Tanınmayan bir
kaçış dizisi (`"\d"`) güncel sürümlerde `SyntaxWarning` uyarısı verir ve gelecekte hataya dönüşecektir.

Metin işlemede en sık kullanılan yöntemler:

```python
satir = "  sensor0  21.4 C\r\n"
satir.strip()                    # 'sensor0  21.4 C': baştaki ve sondaki boşluk ve satır sonları
satir.split()                    # ['sensor0', '21.4', 'C']: boşluklara göre bölme
"aralik=5".partition("=")        # ('aralik', '=', '5'): ilk ayraçta ikiye bölme
" ".join(["sensor0", "sensor1"]) # 'sensor0 sensor1'
"sensor0".startswith("sensor")   # True
"OKU".lower(), "straße".casefold()   # büyük-küçük harf duyarsız karşılaştırma için casefold
```

!!! dikkat "Türkçe büyük-küçük harf dönüşümü"
    `str.lower()` ve `str.upper()` dile duyarlı değildir ve Unicode'un genel kurallarını uygular:
    `"I".lower()` sonucu `"ı"` değil `"i"`, `"İ".lower()` sonucu ise iki kod noktasından oluşan `"i̇"`
    (i ve birleşik nokta) olur. Komut veya anahtar karşılaştırmalarında bu nedenle ASCII adlar
    (`SICAKLIK`, `sicaklik`) kullanılmalı ya da karşılaştırma büyük-küçük harf dönüşümü yapılmadan
    yapılmalıdır.

## 2.6 f-string ile biçimlendirme

f-string (`f"..."`) içindeki `{ifade:biçim}` alanları çalışma anında değerlendirilir. Biçim kısmı
"biçim belirteci mini dili" ile yazılır: `[[dolgu]hiza][işaret][#][0][genişlik][,][.duyarlık][tür]`.

| Yazım | Sonuç | Anlamı |
|---|---|---|
| `f"{21.4567:.2f}"` | `21.46` | 2 ondalık basamak |
| `f"{21.4567:>8.2f}"` | `   21.46` | 8 karakter genişlikte, sağa hizalı |
| `f"{'sensor0':<10}"` | `sensor0   ` | sola hizalı, 10 karakter |
| `f"{255:#06x}"` | `0x00ff` | `0x` önekli, sıfır dolgulu, toplam 6 karakter |
| `f"{163:08b}"` | `10100011` | 8 basamaklı ikili |
| `f"{1013:,}"` | `1,013` | binlik ayırıcı |
| `f"{-12.5:+.1f}"` | `-12.5` | işaret her zaman yazılır |
| `f"{deger=:.1f}"` | `deger=21.5` | hata ayıklama biçimi: ifade ve değeri |

f-string'ler 3.12'den itibaren (PEP 701) iç içe aynı tırnak türünü ve çok satırlı ifadeleri de kabul
eder; 3.10 ve 3.11'i desteklemesi gereken kodda içteki tırnaklar farklı türden seçilmelidir. Eski `%`
biçimlendirmesi (`"%s: %.1f" % (ad, deger)`) güncel kodda yerini f-string'e bırakmıştır, ancak iki
yerde hâlâ önemlidir: `logging` iletileri (bkz. [Bölüm 6](06-hata-test-kayit.md)) ve BitBake
metadata'sındaki `bb.note("... %s" % d.getVar("PN"))` gibi yaygın kalıplar.

## 2.7 Akış denetimi

Python'da bloklar girintiyle belirlenir; süslü parantez veya `end` sözcüğü yoktur. Girinti için dört
boşluk kullanılması gelenekseldir; sekme ile boşluğun karıştırılması `TabError` verir.

**Doğruluk değeri:** `if` ve `while` koşullarında her nesne bir doğruluk değerine çevrilir. `False`,
`None`, sayısal sıfır (`0`, `0.0`) ve boş kaplar (`""`, `b""`, `[]`, `{}`, `set()`) yanlış; diğer her şey
doğrudur. `"0"` boş olmayan bir metin olduğundan doğrudur; yapılandırma dosyasından okunan `"0"` veya
`"false"` değerleri bu nedenle açıkça dönüştürülmelidir.

```python
if 0 <= adres < 248:              # karşılaştırma zinciri: 0 <= adres and adres < 248
    ...
elif adres == 0xFF:
    ...
else:
    raise ValueError(adres)

port = ayar.get("port") or "/dev/ttyS0"   # or, ilk doğru işleneni döndürür
durum = "hazır" if yazmac & 1 else "hazır değil"   # koşullu ifade
```

**Döngüler:** `for` bir **yinelenebilir** (iterable) nesnenin elemanlarını sırayla dolaşır; C'deki
sayaçlı döngü karşılığı `range()` ile yazılır. İndeks gerektiğinde `enumerate`, iki diziyi birlikte
dolaşmak için `zip` kullanılır:

```python
for i in range(3): ...                        # 0, 1, 2
for no, satir in enumerate(satirlar, start=1): ...
for ad, deger in zip(["sicaklik", "nem"], yazmaclar): ...

for deneme in range(3):
    if baglan():
        break
else:                                         # döngü break ile bitmediyse çalışır
    raise TimeoutError("3 denemede bağlanılamadı")
```

`while` döngüsünde atama ifadesi (`:=`, Python 3.8) okuma ile denetimi tek satırda birleştirir; seri
porttan veri bitene kadar okuma bunun tipik örneğidir:

```python
while (parca := port.read(64)):               # boş bytes dönünce döngü biter
    tampon += parca
```

## 2.8 `match` deyimi

Python 3.10 ile gelen `match`, C'deki `switch` deyiminden daha güçlüdür: değeri yalnızca sabitlerle
değil, **yapısıyla** karşılaştırır ve eşleşen parçaları adlara bağlar. Ağ geçidinin metin tabanlı bakım
arayüzü için yazılan ayrıştırıcı:

```python title="examples/bolum-02/komut_esle.py (kesit)"
def isle(satir: str) -> str:
    match satir.split():
        case []:                                           # (1)!
            return ""
        case ["OKU", sensor] if sensor.startswith("sensor"):   # (2)!
            return f"{sensor}: 21.4 C"
        case ["OKU", *_]:                                  # (3)!
            return "HATA: kullanım: OKU sensorN"
        case ["AYARLA", ("aralik" | "esik") as ad, deger]: # (4)!
            ...
        case ["DURUM"]:
            return " ".join(f"{k}={v}" for k, v in ayarlar.items())
        case ["CIKIS" | "QUIT"]:
            raise SystemExit(0)
        case [komut, *_]:                                  # (5)!
            return f"HATA: bilinmeyen komut: {komut}"
```

1.  **Dizi kalıbı:** Boş liste yalnızca boş satırla eşleşir.
2.  **Yakalama ve koruma:** `sensor` adı ikinci elemana bağlanır; `if` koruması sağlanmazsa sonraki `case` denenir.
3.  **Yıldızlı kalıp:** `*_` kalan elemanları (sıfır veya daha fazla) yutar.
4.  **VEYA kalıbı ve `as`:** İkinci eleman iki sabitten biriyse eşleşir ve değer `ad`'a bağlanır.
5.  **Genel durum:** En az bir elemanlı her liste eşleşir; ilk eleman `komut` adına bağlanır.

!!! dikkat "Çıplak ad her zaman yakalar"
    `case ESIK:` yazıldığında `ESIK` sabitiyle karşılaştırma yapılmaz; her değer eşleşir ve `ESIK` adına
    bağlanır. Sabitlerle karşılaştırma için noktalı ad (`case Komut.OKU:`, `case protokol.YAZMAC_OKU:`)
    veya değer kalıbı kullanılmalıdır.

`match` sözlük ve sınıf kalıplarını da destekler: `case {"tur": "olcum", "deger": float(d)}` bir JSON
iletisinin yapısını ve türünü tek satırda denetler.

<div class="terminal" data-oturum="temeller-betik"></div>

## 2.9 Yocto bağlantısı: BitBake'te her şey metindir

BitBake veri deposundaki tüm değişkenler metin olarak saklanır. `d.getVar("PARALLEL_MAKE")` bir
`str` döndürür; sayısal karşılaştırma için `int()` ile dönüştürülmesi gerekir. Değişken tanımlı
değilse sonuç `None` olur ve doğrudan `.split()` çağrısı `AttributeError` verir; bu nedenle
`(d.getVar("X") or "").split()` kalıbı OE-Core'da sık görülür. Mantıksal değerler için "1", "yes",
"true" gibi metinleri yorumlayan `bb.utils.to_boolean()` ve `oe.types.boolean()` kullanılır. Bu
konular [Bölüm 8](08-bitbake-python.md)'de ve
<a href="../../yocto-gomulu-linux/bolumler/05-bitbake-dili.html">Yocto kitabı, Bölüm 5</a>'te ayrıntılı
ele alınır.

!!! lab "Uygulama 2.1 · Nesne modelinin REPL'de incelenmesi"
    1. `python3 -q` ile REPL'i açın ve terminal oturumundaki satırları sırayla yazın. Her adımda sonucu
       çalıştırmadan önce tahmin edin.
    2. Aşağıdaki satırların sonucunu `id()` değerlerini karşılaştırarak açıklayın:

        ```python
        a = [1, 2]; b = a; b += [3]; a, id(a) == id(b)
        a = (1, 2); b = a; b += (3,); a, id(a) == id(b)
        ```

    3. `examples/bolum-02/sayilar_metin.py` betiğini çalıştırın ve `-7 // 2` ile `int(-7 / 2)`
       sonuçlarının neden farklı olduğunu açıklayın.
    4. `komut_esle.py` betiğine `SIFIRLA <ad>` komutunu ekleyin: ayarı ilk değerine döndürsün ve
       `TAMAM <ad>=<değer>` yanıtını versin. Betiği `python3 komut_esle.py 'AYARLA aralik 9' 'SIFIRLA aralik' DURUM`
       ile sınayın.

## Özet

- Python'da tür değere aittir (dinamik tipleme) ve türler arasında örtük dönüşüm yapılmaz (güçlü tipleme).
- Değişken, bir nesneye bağlanmış addır; atama nesneyi kopyalamaz. `==` değeri, `is` kimliği karşılaştırır.
- Fonksiyon aldığı nesneyi değiştirebilir, ancak parametresini yeniden bağlaması çağıranı etkilemez.
- `int` sınırsızdır; yazmaç genişliği maskeyle (`& 0xFFFF`) üretilir. `//` ve `%` aşağı doğru yuvarlar.
- `str` Unicode metin, `bytes` ham veridir; geçiş her zaman kodlama belirtilerek yapılır.
- f-string biçim belirteçleri hizalı, onaltılık ve ikili çıktı üretir; `{x=}` hata ayıklamada kullanılır.
- Boş kaplar, sıfır ve `None` yanlış sayılır; `"0"` metni doğrudur.
- `match` deyimi değeri yapısına göre eşleştirir; çıplak ad sabitle karşılaştırılmaz, yakalanır.

## Değerlendirme soruları

<div class="quiz" data-id="b02-1">
<p class="quiz-soru"><code>a = [1]</code>, <code>b = a</code>, <code>b = b + [2]</code> satırlarından sonra <code>a</code> nedir?</p>
<ul>
<li data-dogru><code>[1]</code></li>
<li><code>[1, 2]</code></li>
<li><code>[2]</code></li>
<li><code>TypeError</code> yükseltilir</li>
</ul>
<p class="quiz-aciklama"><code>b + [2]</code> yeni bir liste üretir ve yalnızca <code>b</code> adı bu nesneye bağlanır. <code>b += [2]</code> yazılsaydı
liste yerinde genişler ve <code>a</code> da <code>[1, 2]</code> olurdu.</p>
</div>

<div class="quiz" data-id="b02-2">
<p class="quiz-soru">Seri porttan okunan <code>veri = b"\x01\x03\x08"</code> için <code>veri[1]</code> ifadesinin değeri ve türü nedir?</p>
<ul>
<li><code>b'\x03'</code>, <code>bytes</code></li>
<li data-dogru><code>3</code>, <code>int</code></li>
<li><code>'\x03'</code>, <code>str</code></li>
<li><code>0x03</code>, <code>hex</code></li>
</ul>
<p class="quiz-aciklama"><code>bytes</code> nesnesinin tek bir elemanı 0–255 aralığında bir tamsayıdır. Dilim (<code>veri[1:2]</code>) ise <code>bytes</code> döndürür.</p>
</div>

<div class="quiz" data-id="b02-3">
<p class="quiz-soru">16 bitlik bir sayacın taşmasını Python'da doğru benzeten ifade hangisidir?</p>
<ul>
<li><code>(sayac + 1) % 0xFFFF</code></li>
<li data-dogru><code>(sayac + 1) &amp; 0xFFFF</code></li>
<li><code>int16(sayac + 1)</code></li>
<li>Gerek yoktur; Python <code>int</code> türü 16 bitte taşar</li>
</ul>
<p class="quiz-aciklama">Python <code>int</code> türü taşmaz. 16 bitlik davranış alt 16 biti tutan maske ile üretilir. <code>% 0xFFFF</code>
65535'e göre kalan alır ve 65535 değerini sıfıra çevirir; doğru modül 65536 (<code>0x10000</code>) olurdu.</p>
</div>

<div class="quiz" data-id="b02-4">
<p class="quiz-soru">Yapılandırma dosyasından <code>etkin = "0"</code> metni okunmuştur. <code>if etkin:</code> koşulunun sonucu nedir?</p>
<ul>
<li>Yanlış; çünkü değer sıfırdır</li>
<li data-dogru>Doğru; çünkü boş olmayan her metin doğrudur</li>
<li><code>TypeError</code> yükseltilir</li>
<li>Python sürümüne göre değişir</li>
</ul>
<p class="quiz-aciklama">Doğruluk değeri türe göre belirlenir: yalnızca boş metin yanlıştır. Metin olarak okunan mantıksal ayarlar
<code>int()</code>, <code>configparser.getboolean()</code> veya <code>bb.utils.to_boolean()</code> gibi bir dönüşümle yorumlanmalıdır.</p>
</div>

<div class="quiz" data-id="b02-5">
<p class="quiz-soru">Aşağıdaki <code>match</code> bloğunda <code>ESIK = 30</code> tanımlıyken <code>deger = 12</code> için hangi dal çalışır?<br>
<code>match deger:</code> · <code>case ESIK: print("eşik")</code> · <code>case _: print("diğer")</code></p>
<ul>
<li><code>diğer</code> yazdırılır</li>
<li data-dogru>Python bu bloğu derlemez; çıplak ad her değerle eşleştiği için sonraki dala hiç ulaşılamaz ve <code>SyntaxError</code> verilir</li>
<li><code>eşik</code> yazdırılır ve <code>ESIK</code> değişmez</li>
<li><code>NameError</code> yükseltilir</li>
</ul>
<p class="quiz-aciklama">Çıplak ad bir yakalama kalıbıdır ve her değerle eşleşir. Ardından başka bir <code>case</code> geldiğinde derleyici
"name capture 'ESIK' makes remaining patterns unreachable" hatası verir. Sabitlerle karşılaştırma için noktalı ad kullanılmalıdır.</p>
</div>

!!! alistirma "Alıştırma: Durum yazmacının çözümlenmesi"
    Sensör cihazının 16 bitlik durum yazmacında bit 0 "hazır", bit 1 "kalibre", bit 2 "ısıtıcı açık"
    bayraklarıdır; bit 8–11 ise hata kodunu (0–15) taşır. Ayrıca sıcaklık yazmacı işaretli 16 bit ve
    10 ile ölçeklenmiştir.

    1. `durum_coz(yazmac: int) -> dict` fonksiyonunu yazın: bayrakları `bool`, hata kodunu `int` olarak döndürsün.
    2. `sicaklik_coz(yazmac: int) -> float` fonksiyonunu `struct` kullanmadan, yalnızca bit işlemleriyle yazın
       (`0xFF83` → `-12.5`).
    3. Sonucu `f"{yazmac:#06x} {yazmac:016b}"` biçiminde onaltılık ve ikili gösterimle birlikte yazdırın.

    ??? success "Örnek çözüm"
        ```python
        def durum_coz(yazmac: int) -> dict:
            return {
                "hazir": bool(yazmac & 1 << 0),
                "kalibre": bool(yazmac & 1 << 1),
                "isitici": bool(yazmac & 1 << 2),
                "hata": (yazmac >> 8) & 0x0F,
            }

        def sicaklik_coz(yazmac: int) -> float:
            if yazmac & 0x8000:              # işaret biti kuruluysa ikiye tümleyen
                yazmac -= 0x10000
            return yazmac / 10

        for y in (0x0305, 0x0001):
            print(f"{y:#06x} {y:016b} {durum_coz(y)}")
        print(sicaklik_coz(0xFF83), sicaklik_coz(214))
        ```
        Çıktı:
        ```text
        0x0305 0000001100000101 {'hazir': True, 'kalibre': False, 'isitici': True, 'hata': 3}
        0x0001 0000000000000001 {'hazir': True, 'kalibre': False, 'isitici': False, 'hata': 0}
        -12.5 21.4
        ```
        `<<` işlecinin önceliği `&` işlecinden yüksek olduğundan `yazmac & 1 << 2` ifadesi
        `yazmac & (1 << 2)` olarak değerlendirilir; okunabilirlik için parantez yazılması da uygundur.
        Aynı dönüşüm [Bölüm 7](07-donanim-iletisim.md)'de `struct.unpack(">h", ...)` ile yapılır.

**Sonraki bölüm:** [3 · Veri yapıları: liste, sözlük, küme, demet →](03-veri-yapilari.md)
