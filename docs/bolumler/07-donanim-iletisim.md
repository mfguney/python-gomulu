# 7 · Donanımla iletişim: ikili veri, seri port, soketler

<div class="kunye" markdown>
<span>Süre: ~75 dk + uygulama</span><span>Düzey: Orta</span><span>Ön koşul: Bölüm 2, 5 ve 6</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - `bytes`, `bytearray` ve `memoryview` türlerini ikili veri üzerinde doğru amaçla kullanabilirsiniz.
    - `struct` biçim dizgileriyle ikili protokol alanlarını paketleyip çözebilir, bayt sırası ve hizalama hatalarını tanıyabilirsiniz.
    - CRC'nin amacını açıklayabilir, CRC-16/MODBUS hesaplamasını bilinen değerlerle doğrulayabilirsiniz.
    - Modbus RTU benzeri bir istek/yanıt protokolünü çerçeve düzeyinde uygulayabilirsiniz.
    - pyserial ile seri port açabilir, zaman aşımı davranışını yönetebilir, donanım olmadan sanal port üzerinde deneme yapabilirsiniz.
    - `socket` ve `select` ile zaman aşımlı TCP istemci/sunucu ve UDP iletişimi yazabilirsiniz.

## 7.1 İkili veri türleri

Bir cihazla konuşmak, sonuçta bayt dizileri göndermek ve almaktır. Python bu iş için üç tür sunar:

| Tür | Değiştirilebilir mi? | Kullanım |
|---|---|---|
| `bytes` | Hayır | Gönderilecek veya alınmış tamamlanmış çerçeveler, sabitler, sözlük anahtarları |
| `bytearray` | Evet | Parça parça biriktirilen alma tamponu, yerinde düzenlenen çerçeve |
| `memoryview` | Altındaki tampona bağlı | Büyük tamponların **kopyalamadan** dilimlenmesi |

```python title="examples/bolum-07/bayt_struct.py (kesit)"
cerceve = bytearray(b"\x01\x03\x00\x00")
cerceve += bytes([0x00, 0x04])        # sona ekleme
cerceve[0] = 0x11                     # tek bayt değiştirme: değer 0-255 olmalı
cerceve.hex(" ")                      # '11 03 00 00 00 04'
bytes.fromhex("11 03 00 00 00 04") == cerceve   # True: içerik karşılaştırması

0x1234.to_bytes(2, "big")             # b'\x124'  (12 34)
int.from_bytes(b"\xff\x83", "big", signed=True)  # -125
```

`bytearray` dilimlemesi yeni bir nesne üretir; `memoryview(tampon)[3:11]` ise aynı belleğe bakan bir
görünümdür ve `struct`, `socket.recv_into` ile dosya işlemleri tarafından kabul edilir. `memoryview`'e
ancak ölçüm bir darboğaz gösterdiğinde geçilmesi yeterlidir.

## 7.2 `struct`: alanlardan baytlara

C'de bir protokol başlığı çoğu zaman bir `struct` ile tanımlanır ve bellek doğrudan gönderilir. Bu
yaklaşım derleyicinin hizalama kurallarına ve işlemcinin bayt sırasına bağlıdır. Python'un `struct`
modülü aynı işi **açık bir biçim dizgisiyle** yapar: her alanın genişliği, işareti ve bayt sırası
dizgide yazılıdır ve platformdan bağımsızdır.

| Karakter | C türü | Boyut | Python türü |
|---|---|---|---|
| `B` / `b` | `uint8_t` / `int8_t` | 1 | `int` |
| `H` / `h` | `uint16_t` / `int16_t` | 2 | `int` |
| `I` / `i` | `uint32_t` / `int32_t` | 4 | `int` |
| `Q` / `q` | `uint64_t` / `int64_t` | 8 | `int` |
| `f` / `d` | `float` / `double` | 4 / 8 | `float` |
| `?` | `_Bool` | 1 | `bool` |
| `4s` | `char[4]` | 4 | `bytes` |
| `x` | dolgu baytı | 1 | (değer yok) |

Dizginin ilk karakteri bayt sırasını ve hizalamayı belirler:

| Önek | Bayt sırası | Boyut ve hizalama |
|---|---|---|
| `@` (varsayılan) | İşlemcinin yerel sırası | Yerel; C derleyicisi gibi dolgu eklenir |
| `=` | Yerel | Standart boyut, dolgu yok |
| `<` | Little-endian | Standart boyut, dolgu yok |
| `>` veya `!` | Big-endian (ağ sırası) | Standart boyut, dolgu yok |

**Bayt sırası** (endianness), çok baytlı bir sayının baytlarının bellekte veya hatta hangi sırayla
dizildiğidir. x86-64 ve ARM işlemcilerin Linux'ta kullandığı yaygın kip **little-endian**'dır: düşük
anlamlı bayt önce gelir. Ağ protokolleri ve Modbus yazmaçları ise **big-endian** kullanır. Aynı
dört alanın iki sırada paketlenmesi aşağıdaki animasyonda gösterilmiştir:

<div class="akis" data-senaryo="struct-paketleme"></div>

Bayt sırası hatasının en tehlikeli yanı **hata vermemesidir**. `c7 01` baytları little-endian olarak
455, big-endian olarak 50945 okunur; ikisi de geçerli bir `uint16`'dır. Benzer biçimde önek
unutulduğunda (`"BhHI"`) yerel hizalama uygulanır ve araya dolgu baytları girer: dokuz baytlık paket
x86-64 üzerinde 12 bayt olur ve karşı tarafın beklediği düzen bozulur. Kablo veya dosya biçimi tanımlayan
her dizgi bu nedenle `<`, `>` veya `!` ile başlamalıdır.

```python
OLCUM_PAKETI = struct.Struct("<BhHI")       # önceden derlenmiş biçim: tekrar ayrıştırılmaz
OLCUM_PAKETI.size                           # 9
paket = OLCUM_PAKETI.pack(3, -125, 455, 1793613601)
no, sicaklik, nem, zaman = OLCUM_PAKETI.unpack(paket)
struct.unpack_from(">4H", yanit, 3)         # ofsetten okuma: dilim kopyası oluşturmaz
list(struct.iter_unpack("<BhHI", kayit))    # ardışık sabit boyutlu kayıtlar
```

!!! dikkat "Kayan nokta alanları"
    `f` (32 bit) biçimiyle paketlenen 21.4 değeri geri çözüldüğünde `21.399999618530273` olur; çünkü
    Python'un `float` türü 64 bittir ve 32 bitlik gösterim daha az duyarlıdır. Sensör protokolleri bu
    nedenle sık sık ölçeklenmiş tamsayı (214 → 21.4) kullanır. Kayan noktalı alan zorunluysa
    karşılaştırma `math.isclose` ile yapılmalıdır.

`struct` **işaret dönüşümü** için de kullanılır: `struct.unpack(">h", struct.pack(">H", 0xFF83))[0]`
işaretsiz yazmaç değerini `-125` yapar.

<div class="terminal" data-oturum="bayt-seri"></div>

## 7.3 CRC: iletim hatalarının yakalanması

Seri hatlarda gürültü, kablo ve topraklama sorunları tek tek bitlerin değişmesine yol açabilir. Alıcının
bozuk bir çerçeveyi geçerli sanmaması için gönderici çerçevenin sonuna bir **CRC** (döngüsel artıklık
denetimi) ekler. CRC, çerçeve verisinin bir polinoma göre bölümünden kalan değerdir; alıcı aynı hesabı
yapar ve sonuç uyuşmazsa çerçeveyi atar. CRC rastgele iletim hatalarını yakalamak için tasarlanmıştır;
kasıtlı değişikliğe karşı koruma sağlamaz, bu amaçla HMAC veya imza kullanılır.

Bir CRC türü yalnızca polinomla değil; başlangıç değeri, bit yansıtması ve son XOR değeriyle birlikte
tanımlanır. Aynı adı taşıyan farklı CRC-16 türleri farklı sonuç verir. Modbus RTU'nun kullandığı
**CRC-16/MODBUS**: polinom 0x8005 (yansıtılmış biçimiyle 0xA001), başlangıç değeri 0xFFFF, giriş ve
çıkış yansıtmalı, son XOR yok.

```python title="examples/sensor-araclari/src/sensor_araclari/protokol.py (kesit)"
def crc16_modbus(veri: bytes) -> int:
    crc = 0xFFFF
    for bayt in veri:
        crc ^= bayt
        for _ in range(8):
            if crc & 0x0001:
                crc = (crc >> 1) ^ 0xA001
            else:
                crc >>= 1
    return crc
```

CRC uygulamasının doğruluğu her zaman **bilinen değerlerle** sınanır. CRC katalogları her tür için
`"123456789"` ASCII dizgisinin sonucunu (check değeri) verir; CRC-16/MODBUS için bu değer `0x4B37`'dir.
İkinci sınama, belgelerde yaygın olarak verilen gerçek çerçevelerdir: `01 03 00 00 00 0A C5 CD`.
Kitabın testleri bu iki değeri kullanır (bkz. [Bölüm 6](06-hata-test-kayit.md)). Standart kütüphane
başka türler için hazır fonksiyonlar içerir: `zlib.crc32` (Ethernet ve zip'in CRC-32'si; check değeri
`0xCBF43926`) ve `binascii.crc_hqx(veri, 0)` (CRC-16/XMODEM; check değeri `0x31C3`).

## 7.4 Modbus RTU benzeri bir protokol

Endüstriyel sensörlerin önemli bir kısmı RS-485 üzerinden **Modbus RTU** protokolüyle konuşur. Bir ana
cihaz (ağ geçidi) istek gönderir; adresi eşleşen bağımlı cihaz (sensör) yanıt verir. Kitabın protokol
modülü bu yapının en sık kullanılan işlevini, **yazmaç okuma**yı (işlev kodu 0x03) uygular:

| Çerçeve | Alanlar | Uzunluk |
|---|---|---|
| İstek | adres (1) · işlev 0x03 (1) · başlangıç (2, BE) · adet (2, BE) · CRC (2, LE) | 8 bayt |
| Yanıt | adres (1) · işlev 0x03 (1) · bayt sayısı (1) · veri (2 × adet, BE) · CRC (2, LE) | 5 + 2 × adet |
| Hata yanıtı | adres (1) · işlev kodu, 0x80 biti kurulu (1) · hata kodu (1) · CRC (2, LE) | 5 bayt |

Aynı çerçevede iki farklı bayt sırası bulunduğuna dikkat edilmelidir: yazmaç değerleri big-endian,
CRC ise düşük bayt önce gönderilir. Bu, Modbus'ın tanımından gelir ve kitabın kodunda iki ayrı
`struct.Struct` nesnesiyle açıkça ifade edilmiştir (`_ISTEK = ">BBHH"`, `_CRC = "<H"`).

Benzetici cihazın yazmaç haritası şöyledir: 0 sıcaklık × 10 (işaretli), 1 bağıl nem × 10, 2 basınç
(hPa), 3 durum bitleri. Adres 1'den dört yazmaç okuyan istek ve yanıt:

```text
İstek : 01 03 00 00 00 04 44 09
Yanıt : 01 03 08 00 D6 01 C7 03 F5 00 01 47 AC
        │  │  │  └──┬┘ └──┬┘ └──┬┘ └──┬┘ └─CRC─┘
        │  │  │   214   455  1013    1
        │  │  └ bayt sayısı (8)
        │  └ işlev kodu
        └ adres
```

Yanıt çözülürken denetimlerin sırası önemlidir: önce CRC (bozuk çerçevenin hiçbir alanına
güvenilmez), sonra adres, işlev kodu ve bayt sayısı. İşlev kodunun yüksek biti kuruluysa (0x83) çerçeve
bir hata yanıtıdır ve üçüncü bayt hata kodunu taşır; protokol modülü bu durumda `CihazHatasi` yükseltir.
Gerçek Modbus RTU'da çerçeveler arasındaki ayrım 3,5 karakter süresi sessizlikle yapılır; kitabın
istemcisi beklenen yanıt uzunluğunu istekten hesapladığı için bu zamanlamaya ihtiyaç duymaz.

## 7.5 pyserial ile seri port

**pyserial**, Linux'ta termios arayüzünü, Windows'ta Win32 API'yi saran ve aynı Python arayüzünü sunan
kütüphanedir. Bir portun açılması:

```python
import serial

port = serial.Serial("/dev/ttyUSB0", baudrate=9600, bytesize=8, parity="N", stopbits=1, timeout=1.0)
```

Seri hat ayarı genellikle kısaca **9600 8N1** biçiminde yazılır: saniyede 9600 bit, 8 veri biti, eşlik
biti yok, 1 durma biti. İki tarafın ayarı birebir aynı olmalıdır; uyuşmazlık genellikle anlamsız
baytlar veya çerçeve hatası olarak görülür.

**`timeout` parametresi**, okuma davranışını belirleyen en önemli ayardır:

| Değer | `read(n)` davranışı |
|---|---|
| `None` | n bayt gelene kadar **süresiz** bekler; cihaz yanıt vermezse program asılı kalır |
| `0` | Engellemez; o anda tamponda ne varsa (boş olabilir) hemen döndürür |
| `1.0` | n bayt gelene veya 1 saniye dolana kadar bekler; süre dolunca **elindekini** döndürür |

Zaman aşımında pyserial istisna yükseltmez; dönen verinin istenenden kısa olması zaman aşımı demektir
ve bunun denetimi uygulamaya aittir. `sensor-istemci` bu nedenle her okumanın uzunluğunu denetler ve
eksiklikte `TimeoutError` yükseltir. Diğer önemli yöntemler: `write(veri)` (yazılan bayt sayısını
döndürür; yazma tarafı için ayrıca `write_timeout`), `read_until(b"\r\n")` (ayraca kadar okuma),
`in_waiting` (tamponda bekleyen bayt sayısı), `reset_input_buffer()` (önceki işlemden kalan
baytları atma) ve `flush()` (çıkış tamponunun gönderilmesini bekleme).

`serial.serial_for_url()` aynı arayüzü farklı taşıyıcılar üzerinde sunar ve donanımsız deneme için
çok değerlidir:

| URL | Anlamı |
|---|---|
| `/dev/ttyUSB0`, `/dev/ttyS0` | Gerçek seri port |
| `loop://` | Geri döngü: yazılan bayt aynı porttan okunur |
| `socket://127.0.0.1:5020` | TCP bağlantısı üzerinden ham bayt akışı |
| `spy://ttyUSB0?file=iz.txt` | Asıl portu açar ve tüm trafiği onaltılık döküm olarak dosyaya yazar |

!!! dikkat "Port izinleri ve kalıcı adlar"
    Seri aygıt dosyaları genellikle `root:dialout` sahipliğindedir. Kullanıcı `dialout` grubuna eklenmeden
    açma denemesi `PermissionError: [Errno 13]` verir; çözüm `sudo` değil, `sudo usermod -aG dialout $USER`
    ve yeniden oturum açmaktır. USB-seri dönüştürücülerin `/dev/ttyUSB0`, `/dev/ttyUSB1` numaraları takılma
    sırasına göre değişebilir; betiklerde `/dev/serial/by-id/` altındaki kalıcı bağlantılar kullanılmalıdır.

### Sanal seri port üzerinde uçtan uca deneme

Donanım olmadan gerçekçi bir deneme için bir **pty** (sözde terminal) çifti kullanılır: bir uç cihaz
benzeticisine, diğer uç (`/dev/pts/N`) istemciye verilir. İstemci açısından bu, gerçek bir seri porttan
farksızdır; termios ayarları, zaman aşımları ve tamponlama aynı biçimde çalışır. Kitabın
`sanal_cihaz.py` betiği pty çiftini `os.openpty()` ile oluşturur, cihaz ucunu `tty.setraw()` ile ham
kipe alır (aksi halde satır düzeni `\r` ve `\n` baytlarını dönüştürür) ve benzeticiyi ayrı bir iş
parçacığında çalıştırır.

<div class="akis" data-senaryo="seri-cerceve"></div>

İstemcinin okuma stratejisi, protokolün yapısından türetilmiştir. Normal yanıtın uzunluğu adetten
hesaplanabilir, ancak cihaz bir hata yanıtı (5 bayt) da gönderebilir. İstemci önce 5 bayt okur; ikinci
bayttaki hata bitine bakarak ya durur ya da kalan baytları okur. Böylece hata yanıtında gereksiz yere
zaman aşımı beklenmez:

```python title="examples/sensor-araclari/src/sensor_araclari/istemci.py (kesit)"
def oku(port: serial.Serial, adres: int, baslangic: int, adet: int) -> list[int]:
    istek = protokol.istek_olustur(adres, baslangic, adet)
    port.reset_input_buffer()            # önceki işlemden kalan baytları at
    port.write(istek)
    bas = port.read(5)
    if len(bas) < 5:
        raise TimeoutError(f"zaman aşımı: {len(bas)} bayt alındı")
    if bas[1] & protokol.HATA_BITI:
        yanit = bas
    else:
        kalan = protokol.yanit_uzunlugu(adet) - 5
        yanit = bas + port.read(kalan)
    return protokol.yanit_coz(yanit, adres)
```

<div class="terminal" data-oturum="sanal-cihaz"></div>

## 7.6 Soketler: TCP ve UDP

Ağ geçidi ölçümleri yalnızca seri hattan okumaz; çoğu zaman bir sunucuya iletir veya Modbus TCP gibi
ağ protokolleriyle de konuşur. Python'un `socket` modülü işletim sisteminin BSD soket arayüzünü
neredeyse birebir sunar.

**TCP bir bayt akışıdır, ileti akışı değildir.** Gönderici `sendall()` ile 13 baytlık bir yanıt yollasa
bile alıcının `recv(1024)` çağrısı 5 bayt, ardından 8 bayt döndürebilir; ya da iki ayrı yanıt tek bir
`recv` ile birleşik gelebilir. İletilerin sınırını uygulama protokolü belirler: sabit uzunluk, uzunluk
alanı veya ayraç. Bu nedenle tam uzunlukta okuma her zaman bir döngüyle yapılır:

```python title="examples/bolum-07/tcp_istemci.py (kesit)"
def tam_oku(s: socket.socket, n: int) -> bytes:
    parcalar = []
    while n:
        parca = s.recv(n)
        if not parca:                           # b"": karşı taraf bağlantıyı kapattı
            raise ConnectionError("sunucu bağlantıyı kapattı")
        parcalar.append(parca)
        n -= len(parca)
    return b"".join(parcalar)

with socket.create_connection(("127.0.0.1", 5020), timeout=1.0) as s:
    s.sendall(istek)                            # send() kısmi gönderim yapabilir; sendall döngüyle tamamlar
    yanit = tam_oku(s, protokol.yanit_uzunlugu(2))
```

`create_connection` ad çözümleme, bağlanma ve zaman aşımı ayarını tek çağrıda yapar. `timeout`
verildiğinde sonraki her soket işlemi bu sürede tamamlanmazsa `TimeoutError` yükseltilir; sunucu
çalışmıyorsa bağlantı hemen `ConnectionRefusedError` ile reddedilir.

**Sunucu tarafı** `bind`, `listen` ve `accept` adımlarından oluşur. Birden çok istemciye iş parçacığı
açmadan hizmet vermenin klasik yolu `select` çağrısıdır: işletim sistemine bir soket listesi verilir ve
hangilerinin okunmaya hazır olduğu sorulur. Zaman aşımı parametresi, hiçbir olay olmasa bile döngünün
belirli aralıklarla uyanıp başka işler (durma koşulu, sağlık denetimi) yapabilmesini sağlar:

```python title="examples/bolum-07/tcp_sunucu.py (kesit)"
okunabilir, _, _ = select.select([dinleyici, *tamponlar], [], [], 0.5)   # en fazla 0,5 s bekle
for s in okunabilir:
    if s is dinleyici:                       # dinleyici okunabilir: yeni bağlantı bekliyor
        baglanti, adres = dinleyici.accept()
        baglanti.setblocking(False)
        tamponlar[baglanti] = b""
        continue
    veri = s.recv(1024)
    if not veri:                             # bağlantı kapandı
        del tamponlar[s]; s.close(); continue
    tamponlar[s] += veri                     # her istemcinin kendi tamponu
    while len(tamponlar[s]) >= ISTEK_BOYU:   # akışı sabit uzunluklu isteklere böl
        ...
```

Sunucunun dinleyici soketine `SO_REUSEADDR` seçeneği verilir; aksi halde sunucu yeniden
başlatıldığında eski bağlantıların `TIME_WAIT` durumu nedeniyle `OSError: [Errno 98] Address already
in use` alınabilir. Daha yüksek düzeyli `selectors` modülü aynı mantığı platformun en verimli
mekanizmasıyla (Linux'ta `epoll`) uygular; çok sayıda eşzamanlı bağlantı için `asyncio` tercih edilir.

**UDP** ise ileti (datagram) tabanlıdır: her `sendto()` alıcıda tek bir `recvfrom()` ile bütün olarak
alınır; birleşme veya bölünme olmaz. Buna karşılık teslim, sıra ve tekrarsızlık güvence altında değildir.
Ağ geçidinin yerel ağa periyodik ölçüm yayınlaması gibi kaybın tolere edilebildiği durumlar için
uygundur. Kitabın `udp_olcum.py` örneği 9 baytlık `<BhHI` paketlerini gönderir ve alıcıda
`settimeout(0.5)` ile yeni paket gelmediğini anlar.

## 7.7 Sağlam iletişim kodu için ilkeler

Bu bölümdeki örnekler, sahada çalışan iletişim kodunda gözetilmesi gereken ilkeleri birlikte uygular:

1. **Her engelleyen işlemin bir zaman aşımı vardır.** Yanıt vermeyen tek bir cihaz bütün ağ geçidini kilitlememelidir.
2. **Kısmi okuma olağandır.** `read(n)` ve `recv(n)` n'den az bayt döndürebilir; uzunluk her zaman denetlenir.
3. **Önce bütünlük, sonra anlam.** CRC doğrulanmadan çerçevenin hiçbir alanı kullanılmaz.
4. **Eşzamanlama kaybından kurtulma.** Her istekten önce `reset_input_buffer()` ile eski baytlar atılır.
5. **Geçici hatalar yeniden denenir, kalıcı hatalar bildirilir.** Zaman aşımı ve CRC hatası yeniden
   denenebilir (Bölüm 4'teki `yeniden_dene`); cihazın hata yanıtları denemeyle düzelmez.
6. **Süre ölçümünde monoton saat.** `time.monotonic()` kullanılır; `time.time()` NTP ile atlayabilir.
7. **Her katman ayrı sınanır.** Protokol bilinen çerçevelerle; iletişim sahte port, `loop://` ve sanal portla.

## 7.8 Yocto bağlantısı

- **Paketleme:** pyserial'ın Yocto tarifi `python3-pyserial` adıyla meta-openembedded deposunun
  meta-python katmanında bulunur. `socket`, `select` ve `struct` modülleri OE-Core'un `python3`
  tarifinin `python3-core` ve `python3-io` paketlerindedir; `sanal_cihaz.py`'nin kullandığı `tty` ve `pty`
  modülleri ise `python3-terminal` paketindedir. Hangi modülün hangi pakette olduğu OE-Core'daki
  `python3-manifest.json` dosyasında tanımlıdır.
- **Seri konsol çakışması:** Makine yapılandırmasındaki `SERIAL_CONSOLES` değişkeni, hangi seri portlarda
  oturum açma isteminin (getty) başlatılacağını belirler
  (<a href="../../yocto-gomulu-linux/bolumler/10-makine-bsp.html">Yocto kitabı, Bölüm 10</a>). Modbus
  için kullanılacak bir UART bu listede bulunmamalıdır; aksi halde getty ile uygulama aynı portu okur ve
  baytlar iki süreç arasında paylaşılır.

!!! lab "Uygulama 7.1 · Sanal cihazla uçtan uca iletişim"
    Sanal ortam etkinken `~/ornekler/bolum-07` dizininde:

    1. Benzeticiyi ayrı bir terminalde başlatın: `python sanal_cihaz.py --bag ttySANAL0`
    2. İkinci terminalde istemciyi trafiği izleyerek çalıştırın:

        ```bash
        sensor-istemci 'spy://ttySANAL0?file=iz.txt'
        cat iz.txt
        ```

        `iz.txt` dosyasında giden (`TX`) 8 bayt ve gelen (`RX`) 13 bayt, okuma çağrılarına göre iki parça
        halinde görülmelidir.

    3. `examples/sensor-araclari/src/sensor_araclari/benzetici.py` dosyasında sıcaklık yazmacının ilk
       değerini `0xFF83` yapın, benzeticiyi yeniden başlatın ve istemcinin `-12.5 C` gösterdiğini doğrulayın.
    4. `python tcp_sunucu.py` ile sunucuyu başlatın; iki ayrı terminalden aynı anda
       `sensor-istemci socket://127.0.0.1:5020` çalıştırarak sunucunun iki bağlantıyı da yanıtladığını gözlemleyin.

## Özet

- `bytes` tamamlanmış çerçeveler, `bytearray` biriktirme tamponları, `memoryview` kopyasız dilimleme içindir.
- `struct` biçim dizgileri her alanın genişliğini, işaretini ve bayt sırasını açıkça tanımlar; kablo biçimleri `<`, `>` veya `!` ile başlar.
- Bayt sırası hatası istisna üretmez, yanlış sayı üretir; bilinen değerlerle test edilmelidir.
- CRC rastgele iletim hatalarını yakalar; tür parametreleriyle birlikte tanımlanır ve check değeriyle doğrulanır.
- Modbus RTU'da yazmaçlar big-endian, CRC little-endian taşınır; denetim sırası CRC → adres → işlev → uzunluktur.
- pyserial'da `timeout` zaman aşımında istisna değil kısa veri döndürür; uzunluk uygulamada denetlenir.
- `serial_for_url` ile `loop://`, `socket://`, `spy://` ve pty tabanlı sanal portlar donanımsız deneme sağlar.
- TCP bir bayt akışıdır; iletiler tam uzunluk döngüsüyle okunur. `select` zaman aşımlı çoklu bağlantı yönetimi sağlar.
- UDP datagram sınırlarını korur ancak teslimi güvence altına almaz.

## Değerlendirme soruları

<div class="quiz" data-id="b07-1">
<p class="quiz-soru"><code>struct.calcsize("BhHI")</code> x86-64 üzerinde 12, <code>struct.calcsize("&lt;BhHI")</code> ise 9 döndürür. Farkın nedeni nedir?</p>
<ul>
<li>Little-endian kipte alanlar sıkıştırılır</li>
<li data-dogru>Önek verilmeyen dizgide yerel hizalama uygulanır ve alanların arasına dolgu baytları eklenir</li>
<li><code>I</code> alanı yerel kipte 8 bayttır</li>
<li><code>B</code> alanı yerel kipte 4 bayttır</li>
</ul>
<p class="quiz-aciklama"><code>@</code> (varsayılan) C derleyicisinin hizalama kurallarını uygular: <code>h</code> 2'nin, <code>I</code> 4'ün katı olan ofsete yerleştirilir.
<code>&lt;</code>, <code>&gt;</code> ve <code>!</code> önekleri standart boyut kullanır ve dolgu eklemez.</p>
</div>

<div class="quiz" data-id="b07-2">
<p class="quiz-soru">Cihazdan gelen <code>c7 01</code> baytları <code>struct.unpack("&gt;H", veri)</code> ile çözülüyor ve 50945 elde ediliyor. Cihaz little-endian gönderiyorsa doğru değer nedir ve hata nasıl fark edilir?</p>
<ul>
<li>Doğru değer 50945'tir; <code>struct</code> bayt sırasını otomatik algılar</li>
<li data-dogru>Doğru değer 455'tir; <code>struct</code> hata vermediği için yanlışlık ancak bilinen değerlerle yapılan testlerle fark edilir</li>
<li><code>struct.error</code> yükseltilir</li>
<li>Değer negatif çıkar</li>
</ul>
<p class="quiz-aciklama">0x01C7 = 455. Her iki bayt sırası da geçerli bir sayı üretir; bayt sırası hataları sessizdir ve protokol belgesindeki
örnek çerçevelerle yazılmış testlerle yakalanır.</p>
</div>

<div class="quiz" data-id="b07-3">
<p class="quiz-soru"><code>serial.Serial(..., timeout=1.0)</code> ile açılan bir portta <code>port.read(13)</code> çağrısı yapıldı ve cihaz yalnızca 5 bayt gönderdi. Ne olur?</p>
<ul>
<li><code>serial.SerialTimeoutException</code> yükseltilir</li>
<li>Çağrı 13 bayt gelene kadar süresiz bekler</li>
<li data-dogru>1 saniye sonra gelen 5 bayt döndürülür; eksikliğin denetimi uygulamaya aittir</li>
<li>Boş <code>bytes</code> döndürülür ve 5 bayt tamponda kalır</li>
</ul>
<p class="quiz-aciklama">Okuma zaman aşımı istisna üretmez. <code>sensor-istemci</code> dönen uzunluğu denetler ve eksiklikte kendisi <code>TimeoutError</code> yükseltir.</p>
</div>

<div class="quiz" data-id="b07-4">
<p class="quiz-soru">Bir TCP istemcisi 13 baytlık yanıtı <code>s.recv(13)</code> ile tek seferde okumaktadır. Bu kod neden güvenilir değildir?</p>
<ul>
<li><code>recv</code> en fazla 8 bayt okuyabilir</li>
<li data-dogru>TCP bir bayt akışıdır; <code>recv(13)</code> 13'ten az bayt döndürebilir ve kalanlar sonraki çağrıda gelir</li>
<li>TCP baytları ters sırayla teslim edebilir</li>
<li><code>recv</code> her zaman UDP datagramı döndürür</li>
</ul>
<p class="quiz-aciklama">TCP sırayı ve teslimi güvence eder, ileti sınırlarını korumaz. Tam uzunlukta okuma <code>recv</code> çağrısını döngüde yineleyen
<code>tam_oku</code> gibi bir yardımcıyla yapılır.</p>
</div>

<div class="quiz" data-id="b07-5">
<p class="quiz-soru">Modbus RTU yanıtı çözülürken alanların denetim sırası neden CRC ile başlar?</p>
<ul>
<li>CRC çerçevenin ilk alanı olduğu için</li>
<li data-dogru>CRC uyuşmuyorsa çerçevenin hiçbir alanına (adres, işlev, bayt sayısı) güvenilemez</li>
<li>CRC hesabı en hızlı denetim olduğu için</li>
<li>Modbus'ta CRC yalnızca adresi korur</li>
</ul>
<p class="quiz-aciklama">Bozuk bir çerçevede herhangi bir bit değişmiş olabilir. Önce bütünlük doğrulanır, ardından alanların anlamı denetlenir.</p>
</div>

!!! alistirma "Alıştırma: Yazmaç yazma işlevi (0x06)"
    Ağ geçidinin sensörün durum yazmacını (3 numaralı yazmaç) ayarlayabilmesi için Modbus'ın
    "tek yazmaç yaz" işlevi (0x06) eklenecektir. İstek yapısı: adres (1) · 0x06 (1) · yazmaç no (2, BE) ·
    değer (2, BE) · CRC (2, LE). Başarılı yanıt, isteğin birebir aynısıdır.

    1. `yaz_istegi(adres, yazmac, deger)` fonksiyonunu yazın ve sonucu belgelerdeki örnek çerçeveyle
       doğrulayın: adres 0x11, yazmaç 1, değer 3 için `11 06 00 01 00 03 9A 9B`.
    2. `SensorBenzetici` sınıfından türeyen bir sınıf yazarak 0x06 isteklerini işleyin: yalnızca 3 numaralı
       yazmaç yazılabilsin, diğerleri için hata kodu 2 dönsün; diğer istekler temel sınıfa bırakılsın.
    3. Yazma sonrasında 0x03 ile okunan değerin değiştiğini doğrulayın.

    ??? success "Örnek çözüm"
        ```python
        import struct
        from sensor_araclari import protokol
        from sensor_araclari.benzetici import SensorBenzetici

        YAZMAC_YAZ = 0x06
        _YAZ = struct.Struct(">BBHH")          # adres, işlev, yazmaç, değer

        def yaz_istegi(adres: int, yazmac: int, deger: int) -> bytes:
            if not 0 <= deger <= 0xFFFF:
                raise ValueError(f"değer 16 bite sığmıyor: {deger}")
            govde = _YAZ.pack(adres, YAZMAC_YAZ, yazmac, deger)
            return govde + protokol.crc16_modbus(govde).to_bytes(2, "little")

        class YazilabilirBenzetici(SensorBenzetici):
            YAZILABILIR = {3}                  # yalnızca durum yazmacı yazılabilir

            def isle(self, istek: bytes) -> bytes | None:
                if len(istek) == 8 and istek[1] == YAZMAC_YAZ:
                    try:
                        govde = protokol._crc_dogrula(istek)
                    except protokol.CerceveHatasi:
                        return None
                    adres, _, yazmac, deger = _YAZ.unpack(govde)
                    if adres != self.adres:
                        return None
                    if yazmac not in self.YAZILABILIR:
                        return protokol.hata_yaniti_olustur(adres, YAZMAC_YAZ, 2)
                    self.yazmaclar[yazmac] = deger
                    return istek               # başarılı yazmanın yanıtı isteğin aynısıdır
                return super().isle(istek)

        print(protokol.onaltilik(yaz_istegi(0x11, 1, 3)))             # 11 06 00 01 00 03 9A 9B
        c = YazilabilirBenzetici(adres=1)
        print(c.isle(yaz_istegi(1, 3, 5)) == yaz_istegi(1, 3, 5), c.yazmaclar)
        print(protokol.onaltilik(c.isle(yaz_istegi(1, 0, 99))))       # 01 86 02 C3 A1
        print(protokol.yanit_coz(c.isle(protokol.istek_olustur(1, 3, 1)), 1))   # [5]
        ```
        İkinci satırın çıktısı `True [214, 455, 1013, 5]` olur. Çözüm, protokol modülünün iç kullanım için
        ayrılmış `_crc_dogrula` fonksiyonunu kullanır; kalıcı bir eklemede bu fonksiyon modülün dışa açık
        arayüzüne alınmalı ve `yaz_istegi` ile yanıt doğrulaması `protokol.py` içine taşınarak testleri
        yazılmalıdır. Yazma işlemleri cihazın durumunu değiştirdiği için okuma işlemlerinden farklı olarak
        körü körüne yeniden denenmemelidir: yanıt zaman aşımına uğradıysa yazmanın gerçekleşip
        gerçekleşmediği önce okunarak doğrulanmalıdır.

**Sonraki bölüm:** [8 · BitBake ve Yocto'da Python →](08-bitbake-python.md)
