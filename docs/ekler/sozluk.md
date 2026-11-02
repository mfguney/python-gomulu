# Terimler sözlüğü

Kitapta kullanılan Türkçe terimler ve İngilizce karşılıkları. İngilizce terim, belgelerde ve hata
iletilerinde arama yapılırken kullanılabilir. Bazı terimler (fixture, wheel, mock) Türkçe metinde de
yaygın olarak özgün biçimiyle kullanıldığından kitapta da öyle bırakılmıştır.

| Türkçe | İngilizce | Açıklama | Bölüm |
|---|---|---|---|
| Yorumlayıcı | Interpreter | Kaynak kodu bayt koda derleyip yürüten program (CPython) | 1 |
| Bayt kod | Bytecode | Yorumlayıcının sanal makinesinin yürüttüğü ara kod; `.pyc` dosyalarında saklanır | 1 |
| Etkileşimli kabuk | REPL (Read–Eval–Print Loop) | Satır satır kod çalıştırıp sonucu gösteren yorumlayıcı kipi | 1 |
| Sanal ortam | Virtual environment (venv) | Temel kurulumu paylaşan, kendi site-packages dizini olan yalıtılmış ortam | 1 |
| Dış yönetimli ortam | Externally managed environment | Paketlerini dağıtımın yönettiği Python kurulumu (PEP 668) | 1 |
| Paket dizini | Package index | Dağıtım paketlerinin yayımlandığı sunucu (PyPI) | 1 |
| Kaynak dağıtımı | Source distribution (sdist) | Kurulmadan önce derlenmesi gereken `.tar.gz` paket | 1 |
| Wheel | Wheel | Derleme gerektirmeden açılarak kurulan hazır paket (`.whl`) | 1 |
| Derleme arka ucu | Build backend | `pyproject.toml`'daki projeyi paketleyen araç (setuptools, hatchling) | 1 |
| Düzenlenebilir kurulum | Editable install | Paketi kopyalamadan kaynak dizinini `sys.path`'e ekleyen kurulum (`pip install -e`) | 1 |
| Sürüm sabitleme | Version pinning | Bağımlılıkların tam sürümlerinin kaydedilmesi (`requirements.txt`) | 1 |
| Dinamik tipleme | Dynamic typing | Türün değişkene değil değere ait olması | 2 |
| Güçlü tipleme | Strong typing | Türler arasında örtük dönüşüm yapılmaması | 2 |
| Ad bağlama | Name binding | Bir adın bir nesneyi göstermesi; atamanın yaptığı iş | 2 |
| Takma ad | Aliasing | İki adın aynı nesneye bağlı olması | 2 |
| Kimlik | Identity | Nesnenin yaşamı boyunca değişmeyen numarası (`id()`, `is`) | 2 |
| Değiştirilebilir | Mutable | Değeri yerinde değiştirilebilen nesne (list, dict, set, bytearray) | 2 |
| Değiştirilemez | Immutable | Değeri oluşturulduktan sonra değişmeyen nesne (int, str, bytes, tuple) | 2 |
| Özet değeri | Hash | Sözlük ve kümede yerleşimi belirleyen tamsayı (`hash()`) | 2, 3 |
| Kayan noktalı sayı | Floating-point number | IEEE 754 çift duyarlıklı sayı (`float`) | 2 |
| Kodlama | Encoding | Metin ile bayt dizisi arasındaki dönüşüm kuralı (UTF-8, ISO 8859-9) | 2, 5 |
| Kod noktası | Code point | Unicode'da bir karakterin numarası | 2 |
| Biçim belirteci | Format specifier | f-string'de `:` sonrasındaki biçim tanımı (`:>8.2f`) | 2 |
| Kısa devre değerlendirme | Short-circuit evaluation | `and`/`or` işleçlerinin sağ tarafı gerekmedikçe değerlendirmemesi | 2 |
| Yapısal kalıp eşleme | Structural pattern matching | `match`/`case` deyimi | 2 |
| Yinelenebilir | Iterable | `iter()` ile yineleyici üretebilen nesne | 3 |
| Yineleyici | Iterator | `next()` ile sıradaki elemanı veren nesne | 3 |
| Üreteç | Generator | `yield` kullanan, değerleri istendikçe üreten fonksiyon veya ifade | 3 |
| Kavrama | Comprehension | `[x for x in y if ...]` biçimindeki kısa kap oluşturma söz dizimi | 3 |
| Açma | Unpacking | Bir dizinin elemanlarını tek satırda adlara bağlama (`a, b = ...`) | 3 |
| Dilimleme | Slicing | `dizi[başlangıç:bitiş:adım]` ile alt dizi alma | 3 |
| Sığ kopya | Shallow copy | Yalnızca dış kabın kopyalandığı, iç nesnelerin paylaşıldığı kopya | 3 |
| Derin kopya | Deep copy | İç içe tüm nesnelerin kopyalandığı kopya | 3 |
| Halka arabellek | Ring buffer | Dolduğunda en eski elemanı düşüren sabit boyutlu kuyruk (`deque(maxlen=n)`) | 3 |
| Zaman karmaşıklığı | Time complexity | İşlem süresinin veri boyutuyla büyüme biçimi (O(1), O(n)) | 3 |
| Kapsam | Scope | Bir adın geçerli olduğu bölge; LEGB kuralı | 4 |
| Kapanış | Closure | İç fonksiyonun kapsayan fonksiyonun değişkenlerini taşıması | 4 |
| Dekoratör | Decorator | Bir fonksiyonu alıp sarmalanmış halini döndüren fonksiyon (`@`) | 4 |
| Konumsal-yalnız parametre | Positional-only parameter | `/` işaretinden önce tanımlanan, adla verilemeyen parametre | 4 |
| Anahtar-yalnız parametre | Keyword-only parameter | `*` işaretinden sonra tanımlanan, yalnızca adla verilebilen parametre | 4 |
| Modül | Module | Tek bir `.py` dosyası ve onun ad alanı | 4 |
| Paket | Package | `__init__.py` içeren, modülleri gruplayan dizin | 4 |
| Ad alanı | Namespace | Adları nesnelere eşleyen yapı (modül, fonksiyon, sınıf) | 4 |
| İçe aktarma | Import | Modülün bulunup yüklenmesi ve bir ada bağlanması | 4 |
| Gölgeleme | Shadowing | Aynı adlı yerel bir modülün veya değişkenin asıl olanı gizlemesi | 4 |
| Örnek | Instance | Bir sınıftan oluşturulmuş nesne | 4 |
| Kalıtım | Inheritance | Bir sınıfın başka bir sınıfın davranışını devralması | 4 |
| Yöntem çözümleme sırası | Method resolution order (MRO) | Kalıtımda yöntemlerin aranma sırası | 4 |
| Tip ipucu | Type hint | Çalışma anında denetlenmeyen tür bilgisi (`x: int`) | 4 |
| Ördek tiplemesi | Duck typing | Nesnenin türüne değil sahip olduğu yöntemlere bakılması (`Protocol`) | 4 |
| Bağlam yöneticisi | Context manager | `with` deyimiyle giriş ve çıkış işlemlerini güvenceye alan nesne | 5 |
| Atomik yazma | Atomic write | Dosyanın ya eski ya yeni haliyle görüldüğü güncelleme yöntemi | 5 |
| Alt süreç | Subprocess | Bir programın başlattığı başka bir süreç | 5 |
| Boru | Pipe | Bir sürecin çıktısını diğerinin girdisine bağlayan çekirdek tamponu | 5 |
| Kabuk enjeksiyonu | Shell injection | Dışarıdan gelen metnin kabukta komut olarak yorumlanması | 5 |
| Çıkış kodu | Exit status | Sürecin sonlanırken döndürdüğü tamsayı; 0 başarı | 5 |
| Ortam değişkeni | Environment variable | Sürece ve alt süreçlerine aktarılan ad–değer çifti | 5 |
| İstisna | Exception | Hata durumunu taşıyan ve akışı kesen nesne | 6 |
| Çağrı yığını | Call stack | Etkin fonksiyon çağrılarının çerçeveleri | 6 |
| Geri izleme | Traceback | İstisnanın geçtiği çağrı çerçevelerinin dökümü | 6 |
| Hata zinciri | Exception chaining | Yeni istisnanın özgün hatayı `__cause__` ile taşıması | 6 |
| Günlükçü | Logger | `logging`'de iletinin kaynağı; noktalı adlarla hiyerarşi kurar | 6 |
| İşleyici | Handler | Günlük iletisinin hedefi (stderr, syslog, dosya) | 6 |
| Fixture | Fixture | pytest'te testin hazırlık ve temizlik işini yapan fonksiyon | 6 |
| Parametreli test | Parametrized test | Aynı testin farklı girdilerle yinelenmesi | 6 |
| Sahte nesne | Mock | Gerçek nesnenin yerine geçen, davranışı programlanan test nesnesi | 6 |
| Bayt sırası | Endianness (byte order) | Çok baytlı sayının baytlarının diziliş sırası | 7 |
| Dolgu baytı | Padding byte | Hizalama için alanların arasına eklenen bayt | 7 |
| İkiye tümleyen | Two's complement | İşaretli tamsayıların ikili gösterimi | 7 |
| Döngüsel artıklık denetimi | Cyclic redundancy check (CRC) | İletim hatalarını yakalamak için eklenen denetim değeri | 7 |
| Çerçeve | Frame | Protokolde tek bir istek veya yanıtı oluşturan bayt dizisi | 7 |
| Yazmaç | Register | Modbus'ta 16 bitlik veri birimi | 7 |
| Zaman aşımı | Timeout | Bir işlemin en fazla bekleyebileceği süre | 7 |
| Sözde terminal | Pseudo-terminal (pty) | Bir ucu programa, diğeri terminal aygıtına bağlı çekirdek nesnesi | 7 |
| Soket | Socket | Ağ iletişiminin uç noktası | 7 |
| Veri birimi | Datagram | UDP'de bütün olarak taşınan tek ileti | 7 |
| Veri deposu | Datastore | BitBake'in değişkenleri tuttuğu yapı (`d`) | 8 |
| Genişletme | Expansion | `${VAR}` ve `${@...}` başvurularının değerle değiştirilmesi | 8 |
| Satır içi Python | Inline Python | Değişken değerindeki `${@ifade}` | 8 |
| Anonim Python işlevi | Anonymous Python function | Ayrıştırma sonunda çalışan `python () {}` | 8 |
| Görev | Task | BitBake'in yürüttüğü iş birimi (`do_compile`) | 8 |
| Değişken bayrağı | Variable flag | Değişkene iliştirilmiş ek bilgi (`do_install[dirs]`) | 8 |
| Katman kütüphanesi | Layer library | `addpylib` ile yüklenen `lib/` altındaki Python paketi | 8 |
