/* Gömülü Geliştirici için Python: animasyon ve terminal senaryoları
 *
 * Animasyon senaryosu:   window.AkisSenaryolari["ad"] = { baslik, istasyonlar:[{id,ad,yol}], dosyalar:[{id,ad,tur,yer,etiket?}],
 *                                                       kod?:{baslik,satirlar:[],tumunuGoster}, adimlar:[...] }
 * Terminal oturumu:      window.TerminalOturumlari["ad"] = { baslik, istem, adimlar:[{komut,cikti,aciklama,hata?,yorum?,istem?}] }
 * Ayrıntılar: _ortak/BENIOKU.md
 *
 * Terminal çıktıları Ubuntu 24.04 üzerinde Python 3.12.3 (sanal ortam) ve 3.13 ile, BitBake 2.18 kaynak
 * ağacı kullanılarak gerçekten çalıştırılmış komutlardan alınmıştır. Saat damgaları ve süreler çalıştırmaya göre değişir.
 */
window.AkisSenaryolari = window.AkisSenaryolari || {};
window.TerminalOturumlari = window.TerminalOturumlari || {};

/* ================================================================== */
/* Bölüm 1                                                             */
/* ================================================================== */
window.AkisSenaryolari["venv-cozumleme"] = {
  baslik: "Sanal ortamda python komutu hangi yorumlayıcıya ve hangi paket dizinine çözülür?",
  istasyonlar: [
    { id: "path", ad: "Kabuk: PATH araması", yol: "$PATH (soldan sağa)" },
    { id: "venvbin", ad: "Ortamın bin dizini", yol: "~/ornekler/sensor-araclari/.venv/bin/" },
    { id: "cfg", ad: "Ortam tanımı", yol: ".venv/pyvenv.cfg" },
    { id: "temel", ad: "Temel yorumlayıcı", yol: "/usr/bin/python3.12" },
    { id: "stdlib", ad: "Standart kütüphane (base_prefix)", yol: "/usr/lib/python3.12/" },
    { id: "venvsite", ad: "Ortamın site-packages dizini (prefix)", yol: ".venv/lib/python3.12/site-packages/" },
    { id: "syssite", ad: "Dağıtımın paketleri", yol: "/usr/lib/python3/dist-packages/" }
  ],
  dosyalar: [
    { id: "pathdeg", ad: "PATH=/usr/local/bin:/usr/bin:/bin", tur: "metin", etiket: "ENV", yer: "path" },
    { id: "ln", ad: "python -> python3.12 (sembolik bağlantı)", tur: "betik", etiket: "LNK", yer: "venvbin" },
    { id: "cfgdos", ad: "home = /usr/bin", tur: "conf", yer: "cfg" },
    { id: "cfgdos2", ad: "include-system-site-packages = false", tur: "conf", yer: "cfg" },
    { id: "elf", ad: "python3.12 (ELF)", tur: "ikili", yer: "temel" },
    { id: "std", ad: "json/ struct.py os.py ...", tur: "python", yer: "stdlib" },
    { id: "pipv", ad: "pip/", tur: "python", yer: "venvsite" },
    { id: "apt", ad: "apt ile kurulan python3-* modülleri", tur: "python", yer: "syssite" }
  ],
  kod: {
    baslik: "kabuk",
    satirlar: [
      "source .venv/bin/activate",
      "python ortam_bilgisi.py",
      "pip install -e '.[test]'",
      "python -c 'import serial'"
    ],
    tumunuGoster: false
  },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Ortam oluşturulmuş ancak etkinleştirilmemiştir. PATH yalnızca sistem dizinlerini içerir; python3 komutu /usr/local/bin veya /usr/bin altında aranır.", vurgula: ["path"] },
    { gorev: "activate", komut: "source .venv/bin/activate",
      aciklama: "activate betiği PATH değişkeninin başına ortamın bin dizinini ekler, VIRTUAL_ENV değişkenini tanımlar ve istemi değiştirir. Başka hiçbir şey yapmaz.",
      islemler: [{ yeniden: "pathdeg", ad: "PATH=~/…/.venv/bin:/usr/local/bin:/usr/bin:/bin" }, { vurgu: "pathdeg" }],
      vurgula: ["path"], kodGoster: [0], kodSatir: [0] },
    { gorev: "PATH araması", komut: "python ortam_bilgisi.py",
      aciklama: "Kabuk python adını PATH dizinlerinde soldan sağa arar; ilk eşleşme .venv/bin/python'dır. Bu bir kopya değil, temel yorumlayıcıya sembolik bağlantıdır.",
      islemler: [{ olustur: { id: "cmd", ad: "python", tur: "surec", etiket: "CMD" }, hedef: "venvbin", kaynak: "pathdeg" }, { vurgu: "ln" }],
      vurgula: ["venvbin"], kodGoster: [1], kodSatir: [1] },
    { gorev: "Yorumlayıcı başlar", aciklama: "Bağlantı izlenir ve /usr/bin/python3.12 çalıştırılır. Ancak sys.executable, çağrıldığı yol olan .venv/bin/python olarak kalır.",
      islemler: [{ tasi: "cmd", hedef: "temel" }, { yeniden: "cmd", ad: "sys.executable = .venv/bin/python" }],
      vurgula: ["temel"] },
    { gorev: "pyvenv.cfg", aciklama: "Yorumlayıcı açılışta sys.executable yolunun bulunduğu dizinde veya bir üst dizinde pyvenv.cfg dosyasını arar. Bulduğunda sys.prefix ortamın dizinine, sys.base_prefix ise home satırındaki kuruluma ayarlanır.",
      islemler: [{ vurgu: "cfgdos" }, { olustur: { id: "pfx", ad: "sys.prefix = ~/…/.venv · sys.base_prefix = /usr", tur: "veri" }, hedef: "cfg", kaynak: "cmd" }],
      vurgula: ["cfg"] },
    { gorev: "Standart kütüphane", aciklama: "Standart kütüphane base_prefix altından yüklenir: ortam standart kütüphanenin kopyasını içermez, temel kurulumla paylaşır.",
      islemler: [{ vurgu: "std" }, { not: "stdlib", metin: "sys.path: /usr/lib/python3.12, lib-dynload" }],
      vurgula: ["stdlib"] },
    { gorev: "site modülü", aciklama: "Açılışta çalışan site modülü, site-packages dizinini sys.prefix'e göre (ortamın içinden) sys.path'e ekler.",
      islemler: [{ vurgu: "pipv" }, { not: "venvsite", metin: "sys.path'e eklendi" }],
      vurgula: ["venvsite"] },
    { gorev: "Sistem paketleri dışarıda", aciklama: "include-system-site-packages = false olduğundan dağıtımın paket dizini sys.path'e eklenmez; apt ile kurulmuş modüller ortamdan görünmez. Ortamın yalıtımı buradan gelir.",
      islemler: [{ vurgu: "cfgdos2" }, { soluk: "apt" }, { not: "syssite", metin: "sys.path'te yok" }],
      vurgula: ["cfg", "syssite"] },
    { gorev: "pip install", komut: "pip install -e '.[test]'",
      aciklama: "pip de .venv/bin altından çözülür ve ortamın yorumlayıcısıyla çalışır; bu nedenle paketleri ortamın site-packages dizinine yazar. Düzenlenebilir kurulum için yalnızca src dizinini gösteren bir .pth dosyası eklenir.",
      islemler: [
        { olustur: { id: "ser", ad: "serial/ · pyserial-3.5.dist-info/", tur: "python" }, hedef: "venvsite" },
        { olustur: { id: "pth", ad: "__editable__.sensor_araclari-0.3.0.pth", tur: "metin" }, hedef: "venvsite" },
        { olustur: { id: "ep", ad: "sensor-rapor · sensor-istemci", tur: "betik" }, hedef: "venvbin" }
      ],
      vurgula: ["venvsite", "venvbin"], kodGoster: [2], kodSatir: [2] },
    { gorev: "import serial", komut: "python -c 'import serial'",
      aciklama: "import, sys.path'i sırayla tarar ve serial paketini ortamın site-packages dizininde bulur. Aynı makinedeki başka bir ortamın veya sistemin paketleri bu sonucu etkilemez.",
      islemler: [{ vurgu: "ser" }, { notSil: "venvsite" }, { not: "venvsite", metin: "serial/__init__.py yüklendi" }],
      vurgula: ["venvsite"], kodGoster: [3], kodSatir: [3] }
  ]
};

window.AkisSenaryolari["pip-kurulum"] = {
  baslik: "pip install pyserial: paket dizininden site-packages dizinine",
  istasyonlar: [
    { id: "istek", ad: "Kurulum isteği", yol: ".venv/bin/pip install pyserial" },
    { id: "dizin", ad: "Paket dizini (Simple API)", yol: "https://pypi.org/simple/pyserial/" },
    { id: "cache", ad: "pip önbelleği", yol: "~/.cache/pip/" },
    { id: "site", ad: "site-packages", yol: ".venv/lib/python3.12/site-packages/" },
    { id: "dist", ad: "Kurulum kaydı", yol: "site-packages/pyserial-3.5.dist-info/" },
    { id: "bin", ad: "Komut başlatıcıları", yol: ".venv/bin/" }
  ],
  dosyalar: [
    { id: "gereksinim", ad: "pyserial (sürüm kısıtı yok)", tur: "metin", etiket: "REQ", yer: "istek" }
  ],
  adimlar: [
    { gorev: "Başlangıç", komut: "pip install pyserial", aciklama: "pip, istenen adı ve varsa sürüm kısıtını (pyserial>=3.5 gibi) bir gereksinim olarak ele alır.", vurgula: ["istek"] },
    { gorev: "Dizin sorgusu", aciklama: "pip, yapılandırılmış paket dizininden (varsayılan PyPI) projenin dosya listesini ister. Liste kaynak arşivleri (sdist) ve önceden derlenmiş wheel dosyalarını içerir.",
      islemler: [
        { olustur: { id: "sdist", ad: "pyserial-3.5.tar.gz (sdist)", tur: "paket" }, hedef: "dizin" },
        { olustur: { id: "whl", ad: "pyserial-3.5-py2.py3-none-any.whl", tur: "paket" }, hedef: "dizin" }
      ], vurgula: ["dizin"] },
    { gorev: "Aday seçimi", aciklama: "Kısıtı sağlayan en yeni sürüm seçilir. Uyumlu bir wheel varsa sdist yerine tercih edilir: py2.py3-none-any etiketi saf Python olduğunu, her yorumlayıcı ve mimaride çalıştığını gösterir.",
      islemler: [{ soluk: "sdist" }, { vurgu: "whl" }], vurgula: ["dizin"] },
    { gorev: "İndirme", aciklama: "Wheel dosyası indirilir ve önbelleğe alınır; aynı sürüm ikinci kez kurulurken ağdan indirilmez. Dosyanın özeti dizinin bildirdiği değerle karşılaştırılır.",
      islemler: [{ kopyala: "whl", hedef: "cache", yeniId: "whl2" }], vurgula: ["cache"] },
    { gorev: "Bağımlılık çözümü", aciklama: "Wheel içindeki METADATA dosyasının Requires-Dist satırları okunur ve her bağımlılık için aynı süreç yinelenir. pyserial'ın zorunlu bağımlılığı yoktur.",
      islemler: [{ not: "cache", metin: "Requires-Dist: (zorunlu bağımlılık yok)" }], vurgula: ["cache"] },
    { gorev: "Açma", aciklama: "Wheel bir zip arşividir; derleme yapılmaz, içerik doğrudan site-packages dizinine açılır.",
      islemler: [{ notSil: "cache" }, { olustur: { id: "pkg", ad: "serial/ (__init__.py, serialposix.py, tools/ ...)", tur: "python" }, hedef: "site", kaynak: "whl2" }],
      vurgula: ["site"] },
    { gorev: "Kurulum kaydı", aciklama: "dist-info dizini kurulan dağıtımı tanımlar: METADATA (ad, sürüm, bağımlılıklar), RECORD (kurulan her dosya ve özeti), INSTALLER (pip). pip uninstall ve pip show bu kaydı kullanır.",
      islemler: [
        { olustur: { id: "meta", ad: "METADATA", tur: "metin" }, hedef: "dist", kaynak: "whl2" },
        { olustur: { id: "rec", ad: "RECORD", tur: "metin" }, hedef: "dist", kaynak: "whl2" },
        { olustur: { id: "epx", ad: "entry_points.txt", tur: "metin" }, hedef: "dist", kaynak: "whl2" }
      ], vurgula: ["dist"] },
    { gorev: "Komutlar", aciklama: "entry_points.txt içindeki [console_scripts] girdileri için bin dizinine küçük başlatıcı betikler yazılır. Betiğin shebang satırı ortamın python yorumlayıcısını mutlak yolla gösterir.",
      islemler: [
        { olustur: { id: "mt", ad: "pyserial-miniterm", tur: "betik" }, hedef: "bin", kaynak: "epx" },
        { olustur: { id: "pt", ad: "pyserial-ports", tur: "betik" }, hedef: "bin", kaynak: "epx" }
      ], vurgula: ["bin"] }
  ]
};

/* ================================================================== */
/* Bölüm 2                                                             */
/* ================================================================== */
window.AkisSenaryolari["ad-baglama"] = {
  baslik: "Adlar nesnelere bağlanır: takma ad, yerinde değişiklik ve yeniden bağlama",
  istasyonlar: [
    { id: "adlar", ad: "Ad alanı", yol: "globals() · __main__" },
    { id: "nesneler", ad: "Nesneler (yığın bellek)", yol: "her nesnenin id() değeri, türü ve başvuru sayısı vardır" },
    { id: "cop", ad: "Başvurusu kalmayan nesneler", yol: "CPython: başvuru sayısı 0 → bellek geri verilir" }
  ],
  dosyalar: [],
  kod: {
    baslik: "REPL",
    satirlar: [
      "okumalar = [21.4, 21.8]",
      "yedek = okumalar",
      "yedek.append(22.6)",
      "yedek = yedek + [23.0]",
      "sayac = 10",
      "sayac += 1",
      "del okumalar"
    ],
    tumunuGoster: false
  },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Python'da değişken bir kutu değil, bir nesneye iliştirilmiş addır. Atama, sağ taraftaki nesneyi oluşturur veya bulur ve soldaki adı ona bağlar.", vurgula: ["adlar", "nesneler"] },
    { gorev: "Atama", komut: "okumalar = [21.4, 21.8]",
      aciklama: "Önce liste nesnesi oluşturulur, sonra okumalar adı ona bağlanır. Nesnenin başvuru sayısı 1'dir.",
      islemler: [
        { olustur: { id: "L1", ad: "list [21.4, 21.8] · başvuru 1", tur: "veri", etiket: "LIST" }, hedef: "nesneler" },
        { olustur: { id: "nOk", ad: "okumalar → list#1", tur: "metin", etiket: "AD" }, hedef: "adlar", kaynak: "L1" }
      ], vurgula: ["nesneler", "adlar"], kodGoster: [0], kodSatir: [0] },
    { gorev: "Takma ad", komut: "yedek = okumalar",
      aciklama: "Kopya oluşmaz: yedek adı aynı nesneye bağlanır ve başvuru sayısı 2 olur. yedek is okumalar ifadesi True döndürür.",
      islemler: [
        { olustur: { id: "nYe", ad: "yedek → list#1", tur: "metin", etiket: "AD" }, hedef: "adlar", kaynak: "nOk" },
        { yeniden: "L1", ad: "list [21.4, 21.8] · başvuru 2" }
      ], vurgula: ["adlar"], kodGoster: [1], kodSatir: [1] },
    { gorev: "Yerinde değişiklik", komut: "yedek.append(22.6)",
      aciklama: "append nesnenin kendisini değiştirir. Nesne tek olduğundan değişiklik okumalar adı üzerinden de görülür.",
      islemler: [{ yeniden: "L1", ad: "list [21.4, 21.8, 22.6] · başvuru 2" }, { vurgu: "L1" }, { vurgu: "nOk" }],
      vurgula: ["nesneler"], kodGoster: [2], kodSatir: [2] },
    { gorev: "Yeniden bağlama", komut: "yedek = yedek + [23.0]",
      aciklama: "+ işleci yeni bir liste üretir. Atama yalnızca yedek adını yeni nesneye taşır; okumalar eski listeyi göstermeye devam eder.",
      islemler: [
        { olustur: { id: "L2", ad: "list [21.4, 21.8, 22.6, 23.0] · başvuru 1", tur: "veri", etiket: "LIST" }, hedef: "nesneler", kaynak: "L1" },
        { yeniden: "nYe", ad: "yedek → list#2" },
        { yeniden: "L1", ad: "list [21.4, 21.8, 22.6] · başvuru 1" }
      ], vurgula: ["nesneler", "adlar"], kodGoster: [3], kodSatir: [3] },
    { gorev: "Değiştirilemez nesne", komut: "sayac = 10",
      aciklama: "int değiştirilemez (immutable) bir türdür; değeri olan 10, nesne var olduğu sürece 10 kalır.",
      islemler: [
        { olustur: { id: "I10", ad: "int 10", tur: "veri", etiket: "INT" }, hedef: "nesneler" },
        { olustur: { id: "nSa", ad: "sayac → int 10", tur: "metin", etiket: "AD" }, hedef: "adlar", kaynak: "I10" }
      ], vurgula: ["nesneler"], kodGoster: [4], kodSatir: [4] },
    { gorev: "+= int'te", komut: "sayac += 1",
      aciklama: "Değiştirilemez türde += yerinde değişiklik yapamaz: 11 değerinde yeni bir nesne bulunur ve ad ona bağlanır. Başka ada bağlı olmayan 10'un başvurusu kalmaz. (Listede += ise yerinde genişletir.)",
      islemler: [
        { olustur: { id: "I11", ad: "int 11", tur: "veri", etiket: "INT" }, hedef: "nesneler", kaynak: "I10" },
        { yeniden: "nSa", ad: "sayac → int 11" },
        { tasi: "I10", hedef: "cop" }, { soluk: "I10" }
      ], vurgula: ["nesneler", "cop"], kodGoster: [5], kodSatir: [5] },
    { gorev: "del", komut: "del okumalar",
      aciklama: "del nesneyi değil adı siler. list#1'e başka başvuru kalmadığından CPython nesneyi hemen serbest bırakır; döngüsel başvurular için ayrıca çöp toplayıcı (gc) çalışır.",
      islemler: [{ sil: "nOk" }, { yeniden: "L1", ad: "list [21.4, 21.8, 22.6] · başvuru 0" }, { tasi: "L1", hedef: "cop" }, { soluk: "L1" }],
      vurgula: ["cop"], kodGoster: [6], kodSatir: [6] }
  ]
};

/* ================================================================== */
/* Bölüm 3                                                             */
/* ================================================================== */
window.AkisSenaryolari["sig-derin-kopya"] = {
  baslik: "copy.copy ve copy.deepcopy: iç içe yapılandırma sözlüğünde hangi nesneler paylaşılır?",
  istasyonlar: [
    { id: "asil", ad: "varsayilan (asıl sözlük)", yol: "dict" },
    { id: "sig", ad: "sig = copy.copy(varsayilan)", yol: "yeni dict, aynı iç nesneler" },
    { id: "ortak", ad: "İç nesneler", yol: "asıl ve sığ kopyanın ortak başvurduğu" },
    { id: "derin", ad: "derin = copy.deepcopy(varsayilan)", yol: "yeni dict, yeni iç nesneler" }
  ],
  dosyalar: [
    { id: "d0", ad: "{'aralik': 5, 'sensorler': →, 'seri': →}", tur: "veri", etiket: "DICT", yer: "asil" },
    { id: "lst", ad: "list ['sensor0', 'sensor1']", tur: "veri", etiket: "LIST", yer: "ortak" },
    { id: "ser", ad: "dict {'hiz': 9600}", tur: "veri", etiket: "DICT", yer: "ortak" }
  ],
  kod: {
    baslik: "kopyalama.py",
    satirlar: [
      "sig = copy.copy(varsayilan)",
      "derin = copy.deepcopy(varsayilan)",
      "sig['aralik'] = 10",
      "sig['sensorler'].append('sensor2')",
      "derin['seri']['hiz'] = 115200"
    ],
    tumunuGoster: false
  },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Sözlüğün değerlerinden biri sayı, ikisi başka nesnelere (liste ve sözlük) başvurudur. Sözlük bu nesneleri içermez, onlara bağlanır.", vurgula: ["asil", "ortak"] },
    { gorev: "Sığ kopya", komut: "sig = copy.copy(varsayilan)",
      aciklama: "Yalnızca en dıştaki sözlük kopyalanır. Yeni sözlüğün değerleri asıl sözlükteki nesnelerin aynılarıdır: iç liste ve iç sözlük iki taraf arasında paylaşılır.",
      islemler: [{ kopyala: "d0", hedef: "sig", yeniId: "d1" }, { not: "ortak", metin: "2 sözlük aynı nesnelere bağlı" }],
      vurgula: ["sig", "ortak"], kodGoster: [0], kodSatir: [0] },
    { gorev: "Derin kopya", komut: "derin = copy.deepcopy(varsayilan)",
      aciklama: "deepcopy yapıyı özyinelemeli dolaşır ve her değiştirilebilir iç nesnenin de kopyasını üretir. Aynı nesneye birden çok başvuru varsa kopyada da tek nesne olarak korunur (memo sözlüğü).",
      islemler: [
        { kopyala: "d0", hedef: "derin", yeniId: "d2" },
        { kopyala: "lst", hedef: "derin", yeniId: "lst2" },
        { kopyala: "ser", hedef: "derin", yeniId: "ser2" }
      ], vurgula: ["derin"], kodGoster: [1], kodSatir: [1] },
    { gorev: "Üst düzey atama", komut: "sig['aralik'] = 10",
      aciklama: "Sığ kopyanın kendi anahtarına atama yapılır; asıl sözlük etkilenmez. Üst düzeyde iki sözlük gerçekten bağımsızdır.",
      islemler: [{ yeniden: "d1", ad: "{'aralik': 10, 'sensorler': →, 'seri': →}" }, { vurgu: "d1" }],
      vurgula: ["sig"], kodGoster: [2], kodSatir: [2] },
    { gorev: "Paylaşılan listeye ekleme", komut: "sig['sensorler'].append('sensor2')",
      aciklama: "Bu satır sığ kopyayı değil, paylaşılan liste nesnesini değiştirir. Değişiklik asıl sözlükten de görülür; sık rastlanan bir hata kaynağıdır (varsayılan yapılandırmanın farkında olmadan değişmesi).",
      islemler: [{ yeniden: "lst", ad: "list ['sensor0', 'sensor1', 'sensor2']" }, { vurgu: "lst" }, { notSil: "ortak" }, { not: "ortak", metin: "değişiklik asılda da görülür" }],
      vurgula: ["ortak", "asil"], kodGoster: [3], kodSatir: [3] },
    { gorev: "Derin kopyada değişiklik", komut: "derin['seri']['hiz'] = 115200",
      aciklama: "Derin kopyanın iç sözlüğü ayrı bir nesnedir; değişiklik yalnızca orada görülür. Derin kopya kendi listesinde sensor2'yi de içermez, çünkü ekleme kopyalamadan sonra yapılmıştır.",
      islemler: [{ yeniden: "ser2", ad: "dict {'hiz': 115200}" }, { vurgu: "ser2" }],
      vurgula: ["derin"], kodGoster: [4], kodSatir: [4] }
  ]
};

/* ================================================================== */
/* Bölüm 4                                                             */
/* ================================================================== */
window.AkisSenaryolari["import-cozumleme"] = {
  baslik: "import serial: modül sys.path üzerinde nasıl bulunur ve sys.modules'a nasıl girer?",
  istasyonlar: [
    { id: "kod", ad: "import deyimi", yol: "sensor_araclari/istemci.py" },
    { id: "modules", ad: "Modül önbelleği", yol: "sys.modules" },
    { id: "meta", ad: "Bulucular", yol: "sys.meta_path: BuiltinImporter, FrozenImporter, PathFinder" },
    { id: "p0", ad: "sys.path[0]: betiğin dizini", yol: "~/ornekler/bolum-07/" },
    { id: "std", ad: "Standart kütüphane", yol: "/usr/lib/python3.12/ · lib-dynload/" },
    { id: "site", ad: "site-packages", yol: ".venv/lib/python3.12/site-packages/" },
    { id: "ad", ad: "İçe aktaran modülün ad alanı", yol: "istemci.__dict__" }
  ],
  dosyalar: [
    { id: "imp", ad: "import serial", tur: "python", etiket: "IMP", yer: "kod" },
    { id: "m1", ad: "'sys', 'builtins', 'os', ...", tur: "veri", yer: "modules" },
    { id: "sp", ad: "serial/__init__.py", tur: "python", yer: "site" }
  ],
  adimlar: [
    { gorev: "Başlangıç", aciklama: "import serial deyimi iki iş yapar: modülü bulup yükler (gerekirse) ve serial adını içe aktaran modülün ad alanına bağlar.", vurgula: ["kod"] },
    { gorev: "Önbellek denetimi", aciklama: "İlk bakılan yer sys.modules sözlüğüdür. Modül daha önce yüklenmişse dosya sistemine hiç gidilmez. Bu ilk import olduğundan 'serial' anahtarı yoktur.",
      islemler: [{ olustur: { id: "ara", ad: "aranan: 'serial'", tur: "veri", etiket: "FIND" }, hedef: "modules", kaynak: "imp" }, { not: "modules", metin: "'serial' yok" }], vurgula: ["modules"] },
    { gorev: "Bulucular", aciklama: "sys.meta_path'teki bulucular sırayla sorulur. serial yerleşik (C ile derlenmiş, yorumlayıcıya gömülü) veya dondurulmuş bir modül değildir; PathFinder sys.path listesini dolaşmaya başlar.",
      islemler: [{ notSil: "modules" }, { tasi: "ara", hedef: "meta" },
        { olustur: { id: "bi", ad: "BuiltinImporter: yok", tur: "metin" }, hedef: "meta" }, { olustur: { id: "fi", ad: "FrozenImporter: yok", tur: "metin" }, hedef: "meta" },
        { soluk: "bi" }, { soluk: "fi" }], vurgula: ["meta"] },
    { gorev: "sys.path[0]", aciklama: "İlk aranan yer çalıştırılan betiğin dizinidir. Burada serial.py veya serial/ bulunsaydı kurulu paket yerine o yüklenirdi (gölgeleme). Bulunamadı.",
      islemler: [{ tasi: "ara", hedef: "p0" }, { olustur: { id: "p0y", ad: "serial.py / serial/ yok", tur: "metin" }, hedef: "p0" }, { soluk: "p0y" }], vurgula: ["p0"] },
    { gorev: "Standart kütüphane", aciklama: "python312.zip, /usr/lib/python3.12 ve lib-dynload (C uzantıları) sırayla denenir. Bulunamadı.",
      islemler: [{ tasi: "ara", hedef: "std" }, { olustur: { id: "stdy", ad: "serial yok (json/, struct.py ...)", tur: "metin" }, hedef: "std" }, { soluk: "stdy" }], vurgula: ["std"] },
    { gorev: "site-packages", aciklama: "serial/ dizini ve içinde __init__.py bulunur. PathFinder bir ModuleSpec döndürür: ad, yükleyici (SourceFileLoader) ve dosya yolu (origin).",
      islemler: [{ sil: "ara" }, { vurgu: "sp" }, { olustur: { id: "spec", ad: "ModuleSpec(name='serial', origin=…/serial/__init__.py)", tur: "veri" }, hedef: "site", kaynak: "sp" }],
      vurgula: ["site"] },
    { gorev: "Modül nesnesi", aciklama: "Boş bir modül nesnesi oluşturulur ve kodu çalıştırılmadan önce sys.modules'a eklenir; döngüsel import'lar bu sayede sonsuz döngüye girmez. Ardından __init__.py çalıştırılır; derlenmiş bayt kod __pycache__ altına yazılır.",
      islemler: [{ olustur: { id: "mod", ad: "<module 'serial'>", tur: "nesne", etiket: "MOD" }, hedef: "modules", kaynak: "spec" }, { olustur: { id: "pyc", ad: "__pycache__/__init__.cpython-312.pyc", tur: "ikili", etiket: "PYC" }, hedef: "site", kaynak: "sp" }],
      vurgula: ["modules", "site"] },
    { gorev: "Ad bağlama", aciklama: "serial adı, içe aktaran modülün ad alanında bu modül nesnesine bağlanır. from serial import Serial yazılsaydı modülün kendisi değil Serial niteliği bağlanırdı.",
      islemler: [{ yeniden: "imp", ad: "import serial (tamamlandı)" }, { olustur: { id: "adb", ad: "serial → <module 'serial'>", tur: "metin", etiket: "AD" }, hedef: "ad", kaynak: "mod" }],
      vurgula: ["ad"] },
    { gorev: "İkinci import", aciklama: "Aynı süreçte başka bir modül import serial yazdığında sys.modules'taki nesne doğrudan döndürülür: modül kodu ikinci kez çalışmaz. Değişikliklerin görülmesi için süreç yeniden başlatılmalı veya importlib.reload kullanılmalıdır.",
      islemler: [{ vurgu: "mod" }, { not: "modules", metin: "önbellekten döndü" }],
      vurgula: ["modules"] }
  ]
};

window.AkisSenaryolari["dekorator-sarma"] = {
  baslik: "@yeniden_dene(deneme=3): dekoratör fonksiyonu nasıl sarar ve çağrı nasıl akar?",
  istasyonlar: [
    { id: "tanim", ad: "def deyimi", yol: "kapsam_dekorator.py" },
    { id: "fabrika", ad: "Dekoratör fabrikası", yol: "yeniden_dene(deneme=3)" },
    { id: "sarma", ad: "Kapanış (closure)", yol: "sarmalayici.__closure__" },
    { id: "ad", ad: "Modül ad alanı", yol: "globals()" },
    { id: "cagri", ad: "Çağrı akışı", yol: "sicaklik_oku()" }
  ],
  dosyalar: [],
  kod: {
    baslik: "kapsam_dekorator.py (kısaltılmış)",
    satirlar: [
      "def yeniden_dene(deneme=3, ...):",
      "    def dekorator(fonk):",
      "        @functools.wraps(fonk)",
      "        def sarmalayici(*args, **kwargs):",
      "            for n in range(1, deneme + 1):",
      "                try: return fonk(*args, **kwargs)",
      "                except hatalar: ...",
      "        return sarmalayici",
      "    return dekorator",
      "",
      "@yeniden_dene(deneme=3)",
      "def sicaklik_oku(): ..."
    ],
    tumunuGoster: true
  },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Dekoratör söz dizimi, fonksiyon tanımından hemen sonra yapılan bir çağrı ve yeniden bağlamadır: sicaklik_oku = yeniden_dene(deneme=3)(sicaklik_oku).", vurgula: ["tanim"], kodSatir: [10, 11] },
    { gorev: "def", aciklama: "def deyimi bir fonksiyon nesnesi oluşturur. Henüz ada bağlanmamıştır; önce dekoratör ifadesine verilecektir.",
      islemler: [{ olustur: { id: "f", ad: "function sicaklik_oku (özgün)", tur: "python", etiket: "FN" }, hedef: "tanim" }],
      vurgula: ["tanim"], kodSatir: [11] },
    { gorev: "Fabrika çağrısı", aciklama: "@ işaretinden sonraki ifade değerlendirilir: yeniden_dene(deneme=3) çağrılır ve iç fonksiyon dekorator döndürülür. deneme=3 değeri dekorator'ın kapanışında saklanır.",
      islemler: [{ olustur: { id: "dek", ad: "dekorator (deneme=3 kapanışta)", tur: "python", etiket: "FN" }, hedef: "fabrika" }],
      vurgula: ["fabrika"], kodSatir: [0, 8, 10] },
    { gorev: "Sarma", aciklama: "dekorator(özgün fonksiyon) çağrılır. sarmalayici adlı yeni bir fonksiyon oluşur; fonk, deneme, bekleme ve hatalar değişkenleri kapanış hücrelerinde (cell) tutulur.",
      islemler: [
        { kopyala: "f", hedef: "sarma", yeniId: "fk", yeniAd: "hücre fonk → özgün sicaklik_oku" },
        { olustur: { id: "sar", ad: "function sarmalayici", tur: "python", etiket: "FN" }, hedef: "sarma", kaynak: "dek" },
        { olustur: { id: "cell", ad: "hücreler: fonk, deneme=3, bekleme, hatalar", tur: "veri" }, hedef: "sarma" }
      ], vurgula: ["sarma"], kodSatir: [1, 3, 7] },
    { gorev: "functools.wraps", aciklama: "wraps, özgün fonksiyonun __name__, __doc__, __qualname__ ve __module__ niteliklerini sarmalayıcıya kopyalar ve __wrapped__ ile özgün fonksiyona başvuru bırakır. Böylece günlükler ve testler doğru adı görür.",
      islemler: [{ yeniden: "sar", ad: "sarmalayici (__name__='sicaklik_oku')" }, { vurgu: "sar" }],
      vurgula: ["sarma"], kodSatir: [2] },
    { gorev: "Ad bağlama", aciklama: "sicaklik_oku adı artık sarmalayıcıya bağlanır. Özgün fonksiyona yalnızca kapanış (ve __wrapped__) üzerinden ulaşılabilir.",
      islemler: [{ olustur: { id: "adb", ad: "sicaklik_oku → sarmalayici", tur: "metin", etiket: "AD" }, hedef: "ad", kaynak: "sar" }, { soluk: "dek" }, { soluk: "f" }],
      vurgula: ["ad"] },
    { gorev: "Çağrı: 1. deneme", komut: "sicaklik_oku()", aciklama: "Çağrı önce sarmalayıcıya gelir; sarmalayıcı kapanıştaki fonk'u çağırır. Özgün fonksiyon TimeoutError yükseltir; except bloğu yakalar, iletiyi yazar ve bekler.",
      islemler: [{ olustur: { id: "c1", ad: "deneme 1/3 → TimeoutError", tur: "surec" }, hedef: "cagri", kaynak: "adb" }],
      vurgula: ["cagri"], kodSatir: [4, 5, 6] },
    { gorev: "Çağrı: 2. deneme", aciklama: "Döngü sürer; ikinci deneme de zaman aşımına uğrar.",
      islemler: [{ soluk: "c1" }, { olustur: { id: "c2", ad: "deneme 2/3 → TimeoutError", tur: "surec" }, hedef: "cagri" }],
      vurgula: ["cagri"], kodSatir: [4, 5, 6] },
    { gorev: "Çağrı: 3. deneme", aciklama: "Üçüncü denemede özgün fonksiyon 21.4 döndürür ve return ile değer çağırana iletilir. Son deneme de başarısız olsaydı raise ile özgün istisna yeniden yükseltilirdi.",
      islemler: [{ soluk: "c2" }, { olustur: { id: "c3", ad: "deneme 3/3 → 21.4", tur: "veri" }, hedef: "cagri" }, { vurgu: "c3" }],
      vurgula: ["cagri"], kodSatir: [5] }
  ]
};

/* ================================================================== */
/* Bölüm 5                                                             */
/* ================================================================== */
window.AkisSenaryolari["subprocess-boru"] = {
  baslik: "printf | sort boru hattının subprocess.Popen ile kabuk olmadan kurulması",
  istasyonlar: [
    { id: "py", ad: "Ana süreç", yol: "python guvenli_surec.py" },
    { id: "p1", ad: "Alt süreç 1", yol: "printf 'sensor2\\nsensor0\\nsensor1\\n'" },
    { id: "boru1", ad: "Boru 1 (çekirdek tamponu)", yol: "p1.stdout → p2.stdin" },
    { id: "p2", ad: "Alt süreç 2", yol: "sort" },
    { id: "boru2", ad: "Boru 2", yol: "p2.stdout → ana süreç" },
    { id: "sonuc", ad: "communicate() sonucu", yol: "cikti, returncode" }
  ],
  dosyalar: [],
  kod: {
    baslik: "guvenli_surec.py (6. adım)",
    satirlar: [
      "uretici = Popen(['printf', ...], stdout=PIPE)",
      "siralayici = Popen(['sort'], stdin=uretici.stdout, stdout=PIPE, text=True)",
      "uretici.stdout.close()",
      "cikti, _ = siralayici.communicate(timeout=5)",
      "uretici.wait()"
    ],
    tumunuGoster: false
  },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Argüman listesiyle çalıştırılan komutlar kabuktan geçmez: Python fork/exec (veya posix_spawn) ile programı doğrudan başlatır. Boru hattı da kabuk yerine Python tarafından kurulur.", vurgula: ["py"] },
    { gorev: "Popen printf", aciklama: "stdout=PIPE ile bir boru oluşturulur. Yazma ucu alt sürecin standart çıktısı olur; okuma ucu ana süreçte uretici.stdout olarak kalır.",
      islemler: [{ olustur: { id: "pu", ad: "uretici (Popen)", tur: "python" }, hedef: "py" }, { olustur: { id: "pr1", ad: "printf (PID n)", tur: "surec" }, hedef: "p1", kaynak: "pu" }, { olustur: { id: "fd1", ad: "uretici.stdout (okuma ucu)", tur: "veri", etiket: "FD" }, hedef: "py" }],
      vurgula: ["p1", "boru1"], kodGoster: [0], kodSatir: [0] },
    { gorev: "Popen sort", aciklama: "İkinci sürecin stdin'i olarak birinci borunun okuma ucu verilir; sort'un çıktısı için ikinci bir boru açılır.",
      islemler: [{ olustur: { id: "ps", ad: "siralayici (Popen)", tur: "python" }, hedef: "py" }, { olustur: { id: "pr2", ad: "sort (PID n+1)", tur: "surec" }, hedef: "p2", kaynak: "ps" }, { kopyala: "fd1", hedef: "p2", yeniId: "fd1b", yeniAd: "stdin = boru 1" }],
      vurgula: ["p2"], kodGoster: [1], kodSatir: [1] },
    { gorev: "Ucu kapatma", aciklama: "Ana süreç kendi elindeki okuma ucunu kapatır. Böylece boruyu okuyan tek süreç sort olur; sort erken çıkarsa printf SIGPIPE alarak sonlanabilir.",
      islemler: [{ sil: "fd1" }], vurgula: ["py"], kodGoster: [2], kodSatir: [2] },
    { gorev: "Veri akışı", aciklama: "printf satırları boruya yazar. Veri çekirdeğin boru tamponunda bekler (Linux'ta varsayılan 64 KiB); tampon dolarsa yazan süreç bloklanır.",
      islemler: [{ olustur: { id: "v1", ad: "b'sensor2\\nsensor0\\nsensor1\\n'", tur: "veri" }, hedef: "boru1", kaynak: "pr1" }],
      vurgula: ["boru1"] },
    { gorev: "EOF", aciklama: "printf çıkar ve borunun yazma ucu kapanır. sort okuma sırasında dosya sonu (EOF) görür; sort tüm girdiyi okumadan sıralayamayacağı için çıktıyı bu ana kadar bekletir.",
      islemler: [{ soluk: "pr1" }, { kopyala: "v1", hedef: "p2", yeniId: "v1b" }, { yeniden: "v1", ad: "boş · yazma ucu kapandı (EOF)" }, { soluk: "v1" }, { not: "p1", metin: "returncode 0" }],
      vurgula: ["p2"] },
    { gorev: "Sıralı çıktı", aciklama: "sort sonucu ikinci boruya yazar ve çıkar.",
      islemler: [{ olustur: { id: "v2", ad: "'sensor0\\nsensor1\\nsensor2\\n'", tur: "veri" }, hedef: "boru2", kaynak: "v1b" }, { sil: "v1b" }, { soluk: "pr2" }],
      vurgula: ["boru2"] },
    { gorev: "communicate", aciklama: "communicate() boruyu EOF'a kadar okur ve sürecin bitmesini bekler. stdout ve stderr'in ikisi de PIPE olduğunda kilitlenmeyi önlemek için ikisini birlikte okur; timeout aşılırsa TimeoutExpired yükseltir.",
      islemler: [{ kopyala: "v2", hedef: "sonuc", yeniId: "v3", yeniAd: "cikti = 'sensor0\\nsensor1\\nsensor2\\n'" }, { yeniden: "v2", ad: "boş · EOF okundu" }, { soluk: "v2" }, { olustur: { id: "rc", ad: "returncode: 0 0", tur: "metin" }, hedef: "sonuc" }],
      vurgula: ["sonuc"], kodGoster: [3, 4], kodSatir: [3, 4] }
  ]
};

/* ================================================================== */
/* Bölüm 6                                                             */
/* ================================================================== */
window.AkisSenaryolari["istisna-yayilim"] = {
  baslik: "İstisna çağrı yığınında yukarı doğru yayılır, dönüştürülür ve en üstte yakalanır",
  istasyonlar: [
    { id: "main", ad: "main()", yol: "try / except AgecidiHatasi / finally" },
    { id: "baslat", ad: "baslat()", yol: "except yok" },
    { id: "ayar", ad: "ayar_yukle('aralik')", yol: "try / except (KeyError, ValueError)" },
    { id: "deger", ad: "deger_oku('aralik')", yol: "except yok" },
    { id: "int", ad: "int('beş')", yol: "yerleşik fonksiyon" },
    { id: "cikis", ad: "Program çıkışı", yol: "stderr · sys.exit(main())" }
  ],
  dosyalar: [
    { id: "c", ad: "çağrı", tur: "surec", etiket: "CALL", yer: "main" }
  ],
  kod: {
    baslik: "istisna_zinciri.py",
    satirlar: [
      "def deger_oku(anahtar):",
      "    return int(AYARLAR[anahtar])",
      "def ayar_yukle(anahtar):",
      "    try: return deger_oku(anahtar)",
      "    except (KeyError, ValueError) as hata:",
      "        raise YapilandirmaHatasi(anahtar, hata) from hata",
      "def main():",
      "    try: baslat()",
      "    except AgecidiHatasi as hata: ...; return 1",
      "    finally: print('finally: ...')"
    ],
    tumunuGoster: true
  },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "main → baslat → ayar_yukle → deger_oku → int sırasıyla çağrılır. Her çağrı yığına bir çerçeve (frame) ekler.",
      vurgula: ["main"] },
    { gorev: "Çağrılar", aciklama: "Çağrı yığınının en altına inilir. AYARLAR['aralik'] değeri 'beş' metnidir.",
      islemler: [
        { olustur: { id: "fr1", ad: "çerçeve: main", tur: "surec", etiket: "FRM" }, hedef: "main", kaynak: "c" },
        { olustur: { id: "fr2", ad: "çerçeve: baslat", tur: "surec", etiket: "FRM" }, hedef: "baslat", kaynak: "c" },
        { olustur: { id: "fr3", ad: "çerçeve: ayar_yukle", tur: "surec", etiket: "FRM" }, hedef: "ayar", kaynak: "c" },
        { olustur: { id: "fr4", ad: "çerçeve: deger_oku", tur: "surec", etiket: "FRM" }, hedef: "deger", kaynak: "c" },
        { tasi: "c", hedef: "int" }], vurgula: ["main", "baslat", "ayar", "deger", "int"], kodSatir: [1] },
    { gorev: "Hata doğar", aciklama: "int() metni sayıya çeviremez ve ValueError yükseltir. Bundan sonra normal akış durur; yorumlayıcı yığında yukarı doğru uygun bir except arar.",
      islemler: [{ yeniden: "c", ad: "int('beş'): çağrı sonlandı" }, { soluk: "c" }, { olustur: { id: "ve", ad: "ValueError: invalid literal for int() ... 'beş'", tur: "veri", etiket: "EXC" }, hedef: "int" }],
      vurgula: ["int"], kodSatir: [1] },
    { gorev: "Yayılma", aciklama: "deger_oku'da try bloğu yoktur; çerçeve sonlandırılır ve istisna çağırana geçer. Traceback'e bu çerçevenin satırı eklenir.",
      islemler: [{ tasi: "ve", hedef: "deger" }, { yeniden: "fr4", ad: "çerçeve: deger_oku (kapatıldı)" }, { soluk: "fr4" }], vurgula: ["deger"], kodSatir: [0, 1] },
    { gorev: "Yakalama", aciklama: "ayar_yukle'deki except (KeyError, ValueError) eşleşir. Hata burada anlamlı, uygulamaya özgü bir istisnaya dönüştürülür.",
      islemler: [{ tasi: "ve", hedef: "ayar" }], vurgula: ["ayar"], kodSatir: [3, 4] },
    { gorev: "raise ... from", aciklama: "YapilandirmaHatasi oluşturulur ve __cause__ niteliğine özgün ValueError bağlanır. Özgün hata kaybolmaz; traceback'te 'direct cause' olarak görünür.",
      islemler: [{ olustur: { id: "yh", ad: "YapilandirmaHatasi · __cause__ = ValueError", tur: "veri", etiket: "EXC" }, hedef: "ayar", kaynak: "ve" }, { soluk: "ve" }],
      vurgula: ["ayar"], kodSatir: [5] },
    { gorev: "Yayılma", aciklama: "baslat hatayla ilgilenmez; istisna bir üst çerçeveye geçer. Ara katmanların try/except yazmak zorunda olmaması, hata işlemenin tek bir yerde toplanmasını sağlar.",
      islemler: [{ tasi: "yh", hedef: "baslat" }, { yeniden: "fr3", ad: "çerçeve: ayar_yukle (kapatıldı)" }, { soluk: "fr3" }], vurgula: ["baslat"] },
    { gorev: "En üstte yakalama", aciklama: "main'deki except AgecidiHatasi, alt sınıf olan YapilandirmaHatasi ile eşleşir. Kullanıcıya kısa bir ileti yazılır.",
      islemler: [{ tasi: "yh", hedef: "main" }, { vurgu: "yh" }, { yeniden: "fr2", ad: "çerçeve: baslat (kapatıldı)" }, { soluk: "fr2" }], vurgula: ["main"], kodSatir: [7, 8] },
    { gorev: "finally ve çıkış", aciklama: "finally bloğu her durumda (başarı, yakalanan veya yakalanmayan hata, return) çalışır. main 1 döndürür; sys.exit bu değeri sürecin çıkış kodu yapar.",
      islemler: [{ olustur: { id: "out", ad: "HATA: 'aralik' ayarı geçersiz ... · çıkış kodu 1", tur: "metin" }, hedef: "cikis", kaynak: "yh" }, { soluk: "yh" }],
      vurgula: ["cikis"], kodSatir: [9] }
  ]
};

window.AkisSenaryolari["pytest-akis"] = {
  baslik: "pytest: toplama → fixture kurulumu → test → temizlik → rapor",
  istasyonlar: [
    { id: "yap", ad: "Yapılandırma", yol: "pyproject.toml [tool.pytest.ini_options]" },
    { id: "topla", ad: "Toplama (collection)", yol: "tests/test_*.py" },
    { id: "conf", ad: "conftest.py", yol: "tests/conftest.py" },
    { id: "fix", ad: "Fixture kurulumu", yol: "istek sırasına göre" },
    { id: "test", ad: "Test gövdesi", yol: "assert yeniden yazılmış" },
    { id: "rapor", ad: "Rapor", yol: "terminal özeti · çıkış kodu" }
  ],
  dosyalar: [
    { id: "ini", ad: "testpaths = ['tests'] · addopts = '-ra'", tur: "conf", yer: "yap" }
  ],
  adimlar: [
    { gorev: "Başlangıç", komut: "pytest", aciklama: "pytest kök dizini (rootdir) ve yapılandırma dosyasını belirler. testpaths ayarı yalnızca tests/ dizininin taranmasını sağlar.", vurgula: ["yap"] },
    { gorev: "Dosyaların toplanması", aciklama: "test_*.py veya *_test.py adlı dosyalar modül olarak içe aktarılır. İçe aktarmadan önce assert ifadeleri, başarısızlıkta ara değerleri gösterecek biçimde yeniden yazılır.",
      islemler: [
        { olustur: { id: "t1", ad: "test_cli.py", tur: "python" }, hedef: "topla" },
        { olustur: { id: "t2", ad: "test_olcum.py", tur: "python" }, hedef: "topla" },
        { olustur: { id: "t3", ad: "test_protokol.py", tur: "python" }, hedef: "topla" }
      ], vurgula: ["topla"] },
    { gorev: "conftest.py", aciklama: "Test dizinindeki conftest.py otomatik yüklenir; burada tanımlanan fixture'lar import edilmeden tüm testlerde kullanılabilir.",
      islemler: [
        { olustur: { id: "f1", ad: "ornek_csv", tur: "veri", etiket: "FIX" }, hedef: "conf" },
        { olustur: { id: "f2", ad: "gecici_csv (tmp_path ister)", tur: "veri", etiket: "FIX" }, hedef: "conf" },
        { olustur: { id: "f3", ad: "cihaz", tur: "veri", etiket: "FIX" }, hedef: "conf" }
      ], vurgula: ["conf"] },
    { gorev: "Test öğeleri", aciklama: "test_ ile başlayan fonksiyonlar test öğesine dönüşür. parametrize ile işaretlenen test_satir_ayristir_hatali üç ayrı öğe üretir: [sayi-degil], [eksik-alan], [gecersiz-birim]. Toplam 29 öğe toplanır.",
      islemler: [{ olustur: { id: "oge", ad: "test_ozetle(gecici_csv)", tur: "python", etiket: "TEST" }, hedef: "topla", kaynak: "t2" }, { not: "topla", metin: "collected 29 items" }],
      vurgula: ["topla"] },
    { gorev: "Fixture çözümü", aciklama: "pytest testin parametre adlarına bakar: gecici_csv istenmiştir; o da yerleşik tmp_path fixture'ını ister. Bağımlılıklar önce kurulur: her test için ayrı bir geçici dizin oluşturulur.",
      islemler: [
        { olustur: { id: "tp", ad: "tmp_path = /tmp/pytest-of-gelistirici/pytest-N/test_ozetle0", tur: "dizin" }, hedef: "fix" },
        { kopyala: "f2", hedef: "fix", yeniId: "f2k", yeniAd: "gecici_csv → yaz() fonksiyonu" }
      ], vurgula: ["fix"] },
    { gorev: "Test çalışır", aciklama: "Fixture değerleri argüman olarak verilir ve test gövdesi çalışır. assert başarısız olsaydı AssertionError, iki tarafın değerleriyle birlikte raporlanırdı.",
      islemler: [{ tasi: "oge", hedef: "test" }, { yeniden: "oge", ad: "test_ozetle PASSED" }, { vurgu: "oge" }],
      vurgula: ["test"] },
    { gorev: "Temizlik", aciklama: "Fixture'ın kapsamı (scope) varsayılan olarak fonksiyondur: test bitince yok edilir. yield kullanan fixture'larda yield'den sonraki kod burada çalışır. pytest son birkaç çalıştırmanın geçici dizinlerini saklar.",
      islemler: [{ soluk: "f2k" }, { soluk: "tp" }], vurgula: ["fix"] },
    { gorev: "Rapor", aciklama: "Tüm öğeler aynı döngüden geçtikten sonra özet yazılır. Çıkış kodu 0 tüm testlerin geçtiğini, 1 en az bir başarısızlığı, 5 hiç test toplanmadığını gösterir; CI bu koda göre karar verir.",
      islemler: [{ olustur: { id: "oz", ad: "29 passed in 0.14s · çıkış kodu 0", tur: "metin" }, hedef: "rapor", kaynak: "oge" }],
      vurgula: ["rapor"] }
  ]
};

/* ================================================================== */
/* Bölüm 7                                                             */
/* ================================================================== */
window.AkisSenaryolari["struct-paketleme"] = {
  baslik: "struct.pack: alanlar bayt dizisine dönüşür; '<' ve '>' bayt sırası farkı",
  istasyonlar: [
    { id: "alan", ad: "Python değerleri", yol: "(3, -125, 455, 1793613601)" },
    { id: "bicim", ad: "Biçim dizgisi", yol: "B h H I = u8, i16, u16, u32" },
    { id: "le", ad: "struct.pack('<BhHI', ...)", yol: "little-endian, dolgusuz: 9 bayt" },
    { id: "be", ad: "struct.pack('>BhHI', ...)", yol: "big-endian (ağ sırası), dolgusuz: 9 bayt" },
    { id: "hat", ad: "Hat (UART / UDP)", yol: "baytlar soldan sağa gönderilir" },
    { id: "alici", ad: "Alıcı: struct.unpack", yol: "biçim gönderenle aynı olmalı" }
  ],
  dosyalar: [
    { id: "a1", ad: "sensör no = 3", tur: "veri", etiket: "u8", yer: "alan" },
    { id: "a2", ad: "sıcaklık x10 = -125", tur: "veri", etiket: "i16", yer: "alan" },
    { id: "a3", ad: "nem x10 = 455", tur: "veri", etiket: "u16", yer: "alan" },
    { id: "a4", ad: "zaman = 1793613601", tur: "veri", etiket: "u32", yer: "alan" },
    { id: "f1", ad: "'<BhHI'", tur: "metin", etiket: "FMT", yer: "bicim" },
    { id: "f2", ad: "'>BhHI'", tur: "metin", etiket: "FMT", yer: "bicim" }
  ],
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Python int'leri bellekte sabit genişlikli değildir. Bir cihaza gönderilecek pakette her alanın genişliği, işareti ve bayt sırası biçim dizgisiyle açıkça belirtilir.", vurgula: ["alan", "bicim"] },
    { gorev: "B: 1 bayt", aciklama: "B işaretsiz 8 bittir; tek bayt olduğu için bayt sırası önemsizdir: 3 → 03.",
      islemler: [{ kopyala: "a1", hedef: "le", yeniId: "l1", yeniAd: "03" }, { kopyala: "a1", hedef: "be", yeniId: "b1", yeniAd: "03" }],
      vurgula: ["le", "be"] },
    { gorev: "h: ikiye tümleyen", aciklama: "h işaretli 16 bittir. -125, ikiye tümleyen gösterimde 0xFF83'tür. Little-endian'da düşük bayt önce (83 FF), big-endian'da yüksek bayt önce (FF 83) yazılır.",
      islemler: [{ kopyala: "a2", hedef: "le", yeniId: "l2", yeniAd: "83 ff" }, { kopyala: "a2", hedef: "be", yeniId: "b2", yeniAd: "ff 83" }],
      vurgula: ["le", "be"] },
    { gorev: "H: 16 bit", aciklama: "455 = 0x01C7. Little-endian: C7 01, big-endian: 01 C7.",
      islemler: [{ kopyala: "a3", hedef: "le", yeniId: "l3", yeniAd: "c7 01" }, { kopyala: "a3", hedef: "be", yeniId: "b3", yeniAd: "01 c7" }],
      vurgula: ["le", "be"] },
    { gorev: "I: 32 bit", aciklama: "1793613601 = 0x6AE85F21 (2026-11-02 10:00:01 UTC). Little-endian'da baytlar tamamen ters sırada yazılır.",
      islemler: [{ kopyala: "a4", hedef: "le", yeniId: "l4", yeniAd: "21 5f e8 6a" }, { kopyala: "a4", hedef: "be", yeniId: "b4", yeniAd: "6a e8 5f 21" }],
      vurgula: ["le", "be"] },
    { gorev: "Hizalama notu", aciklama: "Önek verilmezse ('@') yerel hizalama uygulanır: h alanı 2'nin, I alanı 4'ün katına hizalanır ve araya dolgu baytları girer; paket 12 bayt olur. Kablo protokollerinde her zaman '<', '>' veya '!' kullanılır.",
      islemler: [{ not: "bicim", metin: "'@BhHI' → 12 bayt (3 dolgu baytı)" }], vurgula: ["bicim"] },
    { gorev: "Hatta gönderim", aciklama: "Cihazın beklediği biçim little-endian olsun. Paketin 9 baytı sırayla hatta çıkar: 03 83 ff c7 01 21 5f e8 6a.",
      islemler: [{ notSil: "bicim" }, { olustur: { id: "w", ad: "03 83 ff c7 01 21 5f e8 6a", tur: "ag" }, hedef: "hat", kaynak: "l4" }, { soluk: "b1" }, { soluk: "b2" }, { soluk: "b3" }, { soluk: "b4" }],
      vurgula: ["hat"] },
    { gorev: "Doğru çözme", aciklama: "Alıcı aynı biçimle (<BhHI) çözer ve özgün değerleri elde eder: sıcaklık -125 / 10 = -12.5 C.",
      islemler: [{ kopyala: "w", hedef: "alici", yeniId: "r1", yeniAd: "(3, -125, 455, 1793613601)", tur: "veri" }],
      vurgula: ["alici"] },
    { gorev: "Yanlış bayt sırası", aciklama: "Alıcı '>' kullansaydı hata oluşmazdı; yalnızca değerler yanlış olurdu: c7 01 baytları 455 yerine 50945 olarak okunur. Bu nedenle protokol belgesinde bayt sırası açıkça yazılmalı ve bilinen değerlerle test edilmelidir.",
      islemler: [{ olustur: { id: "r2", ad: "'>H' ile c7 01 → 50945 (yanlış)", tur: "veri" }, hedef: "alici" }, { vurgu: "r2" }],
      vurgula: ["alici"] }
  ]
};

window.AkisSenaryolari["seri-cerceve"] = {
  baslik: "sensor-istemci ile benzetici arasında bir Modbus RTU isteği ve yanıtı",
  istasyonlar: [
    { id: "ist", ad: "İstemci", yol: "sensor_araclari.istemci.oku()" },
    { id: "port", ad: "pyserial", yol: "serial_for_url('ttySANAL0', timeout=1.0)" },
    { id: "pty", ad: "Sanal kablo (pty)", yol: "/dev/pts/0 ↔ ana uç" },
    { id: "cihaz", ad: "Cihaz benzeticisi", yol: "SensorBenzetici.isle()" },
    { id: "dog", ad: "Doğrulama", yol: "protokol.yanit_coz(): CRC, adres, işlev, uzunluk" },
    { id: "sonuc", ad: "Uygulama değerleri", yol: "isaretli16(), / 10" }
  ],
  dosyalar: [
    { id: "pcfg", ad: "9600 8N1 · timeout=1.0", tur: "aygit", yer: "port" },
    { id: "ptyd", ad: "/dev/pts/0 · ham kip (tty.setraw)", tur: "aygit", yer: "pty" }
  ],
  kod: {
    baslik: "istemci.py · oku()",
    satirlar: [
      "istek = protokol.istek_olustur(adres, 0, 4)",
      "port.reset_input_buffer()",
      "port.write(istek)",
      "bas = port.read(5)",
      "yanit = bas + port.read(yanit_uzunlugu(4) - 5)",
      "return protokol.yanit_coz(yanit, adres)"
    ],
    tumunuGoster: true
  },
  adimlar: [
    { gorev: "Başlangıç", aciklama: "İstemci adres 1'deki cihazdan 0 numaralı yazmaçtan başlayarak 4 yazmaç okuyacaktır.", vurgula: ["ist"] },
    { gorev: "İstek çerçevesi", aciklama: "struct.pack('>BBHH', 1, 3, 0, 4) 6 bayt üretir; ardından CRC-16/MODBUS (0x0944) düşük bayt önce eklenir.",
      islemler: [{ olustur: { id: "req", ad: "01 03 00 00 00 04 | 44 09", tur: "veri" }, hedef: "ist" }],
      vurgula: ["ist"], kodSatir: [0] },
    { gorev: "Yazma", aciklama: "Önce giriş tamponunda kalmış eski baytlar atılır; sonra istek yazılır. write() baytları işletim sisteminin tamponuna bırakır ve hemen döner.",
      islemler: [{ kopyala: "req", hedef: "pty", yeniId: "req2" }, { yeniden: "req", ad: "gönderildi: 01 03 00 00 00 04 44 09" }, { soluk: "req" }],
      vurgula: ["port", "pty"], kodSatir: [1, 2] },
    { gorev: "Cihaz isteği alır", aciklama: "Benzetici akıştan 8 bayt biriktirir, CRC'yi doğrular ve adresin kendisine ait olduğunu denetler. Bozuk veya başka adrese giden çerçeveye yanıt vermez.",
      islemler: [{ tasi: "req2", hedef: "cihaz" }, { yeniden: "req2", ad: "istek: adres 1, işlev 3, başlangıç 0, adet 4" }],
      vurgula: ["cihaz"] },
    { gorev: "Yanıt", aciklama: "Yazmaçlar (214, 455, 1013, 1) big-endian 16 bit olarak paketlenir; başa adres, işlev ve bayt sayısı (8), sona CRC eklenir: toplam 13 bayt.",
      islemler: [{ olustur: { id: "resp", ad: "01 03 08 00 D6 01 C7 03 F5 00 01 | 47 AC", tur: "veri" }, hedef: "cihaz", kaynak: "req2" }, { soluk: "req2" }],
      vurgula: ["cihaz"] },
    { gorev: "İki aşamalı okuma", aciklama: "İstemci önce 5 bayt okur: bu bir hata yanıtının tamamı ya da normal yanıtın başıdır. İkinci bayttaki 0x80 biti yoksa kalan 8 bayt okunur. Her read() en fazla timeout süresi kadar bekler.",
      islemler: [{ tasi: "resp", hedef: "pty" }, { tasi: "resp", hedef: "port" }, { tasi: "resp", hedef: "ist" }],
      vurgula: ["port", "ist"], kodSatir: [3, 4] },
    { gorev: "Doğrulama", aciklama: "CRC yeniden hesaplanır ve gelenle karşılaştırılır; adres, işlev kodu ve bayt sayısı denetlenir. Tek bir bitin bozulması CerceveHatasi ile yakalanır.",
      islemler: [{ tasi: "resp", hedef: "dog" }, { not: "dog", metin: "CRC 0xAC47 = 0xAC47 · bayt sayısı 8" }],
      vurgula: ["dog"], kodSatir: [5] },
    { gorev: "Değerler", aciklama: "Yazmaçlar işaretsiz çözülür; sıcaklık yazmacı ikiye tümleyen olarak yorumlanıp 10'a bölünür: 214 → 21.4 C. 0xFF83 gelseydi -12.5 C olurdu.",
      islemler: [{ notSil: "dog" }, { olustur: { id: "val", ad: "21.4 C · %45.5 · 1013 hPa · hazır", tur: "metin" }, hedef: "sonuc", kaynak: "resp" }, { soluk: "resp" }],
      vurgula: ["sonuc"] }
  ]
};

/* ================================================================== */
/* Bölüm 8                                                             */
/* ================================================================== */
window.AkisSenaryolari["getvar-genisletme"] = {
  baslik: "d.getVar('SERVIS'): ham değerden genişletilmiş sonuca",
  istasyonlar: [
    { id: "cagri", ad: "Çağrı", yol: "d.getVar('SERVIS')  (expand=True)" },
    { id: "depo", ad: "Veri deposu", yol: "DataSmart: değişken → ham değer, bayraklar, geçmiş" },
    { id: "ovr", ad: "Override ve işlemler", yol: "OVERRIDES · :append · :prepend · :remove" },
    { id: "exp", ad: "Genişletme", yol: "${VAR} başvuruları (özyinelemeli)" },
    { id: "py", ad: "Satır içi Python", yol: "${@...}: d ve bb erişilebilir" },
    { id: "sonuc", ad: "Sonuç", yol: "str (veya tanımsızsa None)" }
  ],
  dosyalar: [
    { id: "ham", ad: "SERVIS = \"${@bb.utils.contains('DISTRO_FEATURES', 'systemd', 'sensor-oku.service', 'sensor-oku.init', d)}\"", tur: "tarif", yer: "depo" },
    { id: "df", ad: "DISTRO_FEATURES = \"systemd usrmerge ipv6\"", tur: "conf", yer: "depo" },
    { id: "kon", ad: "KONSOL = \"ttyS0\" · KONSOL:agecidi = \"ttyAMA0\"", tur: "tarif", yer: "depo" },
    { id: "ovd", ad: "OVERRIDES = \"agecidi:ornekos\"", tur: "conf", yer: "ovr" }
  ],
  adimlar: [
    { gorev: "Başlangıç", aciklama: "Atama satırları değerleri genişletmeden saklar (= tembeldir). Genişletme, değer okunduğu anda getVar içinde yapılır.", vurgula: ["depo"] },
    { gorev: "getVar çağrısı", komut: "d.getVar('SERVIS')", aciklama: "Bir Python görevi veya anonim işlev SERVIS'in değerini ister. expand=False verilseydi ham dizge olduğu gibi döndürülürdü.",
      islemler: [{ olustur: { id: "q", ad: "getVar('SERVIS')", tur: "python", etiket: "CALL" }, hedef: "cagri" }], vurgula: ["cagri"] },
    { gorev: "Ham değer", aciklama: "Değişkenin _content bayrağındaki ham değer bulunur.",
      islemler: [{ kopyala: "q", hedef: "depo", yeniId: "qq", yeniAd: "SERVIS: ham değer alındı", tur: "veri" }, { vurgu: "ham" }], vurgula: ["depo"] },
    { gorev: "Override seçimi", aciklama: "Değişkenin :koşul varyantları varsa OVERRIDES'taki koşullara göre seçim yapılır; ardından :append, :prepend ve en son :remove uygulanır. SERVIS'te varyant yoktur. (KONSOL okunsaydı agecidi koşulu etkin olduğundan ttyAMA0 seçilirdi.)",
      islemler: [{ tasi: "qq", hedef: "ovr" }, { vurgu: "ovd" }, { vurgu: "kon" }, { not: "ovr", metin: "SERVIS: varyant yok" }], vurgula: ["ovr"] },
    { gorev: "${@...} bulundu", aciklama: "Genişletici ${...} ve ${@...} kalıplarını arar. ${@...} içindeki ifade derlenir ve d ile bb adlarının tanımlı olduğu bir bağlamda çalıştırılır.",
      islemler: [{ notSil: "ovr" }, { tasi: "qq", hedef: "py" }, { olustur: { id: "expr", ad: "bb.utils.contains('DISTRO_FEATURES', 'systemd', ...)", tur: "python" }, hedef: "py", kaynak: "ham" }],
      vurgula: ["py"] },
    { gorev: "İç içe getVar", aciklama: "bb.utils.contains kendi içinde d.getVar('DISTRO_FEATURES') çağırır. Bu çağrı da aynı genişletme sürecinden geçer; değer boşluklardan bölünüp kümeye çevrilir.",
      islemler: [{ kopyala: "df", hedef: "exp", yeniId: "df2", yeniAd: "{'systemd', 'usrmerge', 'ipv6'}", tur: "veri" }],
      vurgula: ["exp", "depo"] },
    { gorev: "Koşulun değerlendirilmesi", aciklama: "{'systemd'} kümesi DISTRO_FEATURES kümesinin alt kümesidir; truevalue döndürülür. İfadenin sonucu ${@...} yerine metin olarak yerleştirilir.",
      islemler: [{ yeniden: "expr", ad: "→ 'sensor-oku.service'" }, { vurgu: "expr" }, { soluk: "df2" }], vurgula: ["py"] },
    { gorev: "Sonuç", aciklama: "Genişletilmiş değer çağırana döner. Satır içi Python her getVar çağrısında yeniden çalışır; DISTRO_FEATURES'tan systemd çıkarılırsa aynı çağrı sensor-oku.init döndürür. Değişken := ile atanmış olsaydı ifade yalnızca ayrıştırma anında bir kez çalışırdı.",
      islemler: [{ tasi: "qq", hedef: "sonuc" }, { yeniden: "qq", ad: "'sensor-oku.service'" }, { yeniden: "q", ad: "getVar('SERVIS') → döndü" }, { soluk: "q" }, { soluk: "expr" }], vurgula: ["sonuc"] }
  ]
};

window.AkisSenaryolari["bitbake-zamanlama"] = {
  baslik: "BitBake'te Python kodu ne zaman çalışır? Ayrıştırma ve görev aşamaları",
  istasyonlar: [
    { id: "conf", ad: "Yapılandırma ayrıştırma", yol: "conf/bitbake.conf" },
    { id: "tarif", ad: "Tarif ayrıştırma", yol: "recipes/sensor-oku_1.0.bb + classes/" },
    { id: "son", ad: "Ayrıştırma sonu", yol: "override/:append → anonim python ()" },
    { id: "cache", ad: "Ayrıştırma önbelleği", yol: "tmp/cache/bb_cache.dat" },
    { id: "worker", ad: "Görev yürütme", yol: "bitbake-worker · do_bilgi" },
    { id: "log", ad: "Görev dosyaları", yol: "tmp/work/sensor-oku-1.0/temp/" }
  ],
  dosyalar: [
    { id: "bbconf", ad: "bitbake.conf", tur: "conf", yer: "conf" },
    { id: "bb", ad: "sensor-oku_1.0.bb", tur: "tarif", yer: "tarif" }
  ],
  adimlar: [
    { gorev: "Başlangıç", komut: "bitbake sensor-oku -c bilgi", aciklama: "BitBake önce tüm yapılandırmayı, sonra her tarifi ayrıştırır; görevler en son çalışır. Python kodunun hangi aşamada çalıştığı, hangi değişkenleri görebileceğini belirler.", vurgula: ["conf"] },
    { gorev: "addpylib", aciklama: "Yapılandırmadaki addpylib satırı lib/ dizinini sys.path'e ekler ve ornek paketini içe aktarır; BBIMPORTS'taki alt modüller satır içi Python'dan ornek.yardimci adıyla kullanılabilir. BB_GLOBAL_PYMODULES ise os, sys ve time modüllerini her ifadeye açar.",
      islemler: [{ olustur: { id: "lib", ad: "ornek.yardimci (sys.path'e lib/)", tur: "python" }, hedef: "conf", kaynak: "bbconf" }], vurgula: ["conf"] },
    { gorev: "Tarif okunur", aciklama: "Tarif satır satır işlenir. = atamaları ham haliyle saklanır; ${@...} ifadeleri bu aşamada çalıştırılmaz. def ile tanımlanan işlevler ve python () blokları kaydedilir.",
      islemler: [
        { olustur: { id: "inl", ad: "SERVIS = \"${@...}\" (ham)", tur: "metin" }, hedef: "tarif", kaynak: "bb" },
        { olustur: { id: "deff", ad: "def ozet_metni(d)", tur: "python" }, hedef: "tarif", kaynak: "bb" },
        { olustur: { id: "anon", ad: "python () { ... }", tur: "python" }, hedef: "tarif", kaynak: "bb" }
      ], vurgula: ["tarif"] },
    { gorev: "inherit", aciklama: "inherit ornek-bilgi satırı sınıf dosyasını tam o noktada metne katar; sınıftaki python do_bilgi() görevi ve addtask satırı tarifin parçası olur.",
      islemler: [{ olustur: { id: "task", ad: "python do_bilgi() · addtask bilgi", tur: "sinif" }, hedef: "tarif" }], vurgula: ["tarif"] },
    { gorev: "Anonim Python", aciklama: "Ayrıştırma bitince önce override ve :append işlemleri, ardından anonim işlevler tanım sırasıyla çalışır. ARALIK_MS burada hesaplanır; bb.fatal veya bb.parse.SkipRecipe bu aşamada tarifi durdurur veya atlar.",
      islemler: [{ tasi: "anon", hedef: "son" }, { olustur: { id: "ams", ad: "ARALIK_MS = \"5000\" · ETIKETLER += anonim", tur: "veri" }, hedef: "son", kaynak: "anon" }],
      vurgula: ["son"] },
    { gorev: "Önbellek", aciklama: "Ayrıştırma sonucu önbelleğe yazılır. Tarif ve bağımlı dosyalar değişmedikçe sonraki çalıştırmalarda yeniden ayrıştırılmaz (çıktıdaki 'Loaded 4 entries from dependency cache').",
      islemler: [{ olustur: { id: "ch", ad: "4 tarif (1 atlandı)", tur: "veri" }, hedef: "cache", kaynak: "ams" }], vurgula: ["cache"] },
    { gorev: "Görev başlar", aciklama: "Görev ayrı bir süreçte (bitbake-worker) tarifin veri deposunun bir kopyasıyla çalışır. OVERRIDES'ın başına task-bilgi eklenir; dirs bayrağındaki ${B} oluşturulup geçerli dizin yapılır.",
      islemler: [{ tasi: "task", hedef: "worker" }, { yeniden: "task", ad: "do_bilgi · OVERRIDES = task-bilgi:agecidi:ornekos" }],
      vurgula: ["worker"] },
    { gorev: "Görev zamanında genişletme", aciklama: "do_bilgi içindeki d.getVar('SERVIS') çağrısı satır içi Python'u şimdi çalıştırır. Görevde yapılan setVar yalnızca bu kopyayı etkiler; başka görevlere aktarılmaz.",
      islemler: [{ tasi: "inl", hedef: "worker" }, { yeniden: "inl", ad: "SERVIS = sensor-oku.service" }], vurgula: ["worker"] },
    { gorev: "Günlük dosyaları", aciklama: "Her görev için temp/ altında run.do_<görev>.<pid> (çalıştırılan kod) ve log.do_<görev>.<pid> (çıktı) yazılır; sürümsüz adlar en son çalıştırmayı gösteren bağlantılardır. bb.plain, bb.note, bb.warn ve bb.fatal iletileri hem günlüğe hem konsola gider.",
      islemler: [
        { olustur: { id: "run", ad: "run.do_bilgi.<pid>", tur: "python" }, hedef: "log", kaynak: "task" },
        { olustur: { id: "lg", ad: "log.do_bilgi.<pid>", tur: "metin" }, hedef: "log", kaynak: "task" }
      ], vurgula: ["log"] }
  ]
};

/* ================================================================== */
/* Terminal oturumları                                                 */
/* ================================================================== */
window.TerminalOturumlari["py-yorumlayicilar"] = {
  "baslik": "Derleme makinesindeki Python yorumlayıcıları ve PEP 668",
  "istem": "gelistirici@derleme:~$",
  "adimlar": [
    {
      "yorum": true,
      "komut": "PATH üzerinde birden çok python3 bulunabilir; ilk bulunan çalışır"
    },
    {
      "komut": "which -a python3",
      "aciklama": "which -a, PATH'teki tüm eşleşmeleri sırasıyla listeler. /usr/local/bin kaynaktan derlenmiş bir Python, /usr/bin ise dağıtımın Python'udur.",
      "cikti": "/usr/local/bin/python3\n/usr/bin/python3\n/bin/python3"
    },
    {
      "komut": "python3 --version",
      "aciklama": "python3 komutu PATH'te ilk bulunan yorumlayıcıyı (burada /usr/local/bin/python3) çalıştırır.",
      "cikti": "Python 3.13.18"
    },
    {
      "komut": "python3.12 --version",
      "aciklama": "Ubuntu 24.04'ün kendi araçlarının kullandığı sistem Python'u 3.12'dir. Sürüm numaralı ad belirli bir yorumlayıcıyı seçer.",
      "cikti": "Python 3.12.3"
    },
    {
      "komut": "python3 -c 'import sys; print(sys.executable); print(sys.prefix)'",
      "aciklama": "sys.executable çalışan yorumlayıcının yolunu, sys.prefix ise standart kütüphanenin ve site-packages dizininin kökünü verir.",
      "cikti": "/usr/local/bin/python3\n/usr/local"
    },
    {
      "komut": "ls /usr/lib/python3.12/EXTERNALLY-MANAGED",
      "aciklama": "Bu işaret dosyası (PEP 668), dağıtımın bu Python'un paketlerini kendisinin yönettiğini bildirir.",
      "cikti": "/usr/lib/python3.12/EXTERNALLY-MANAGED"
    },
    {
      "komut": "python3.12 -m pip install pyserial",
      "aciklama": "pip işaret dosyasını gördüğü için sistem geneline kurulumu reddeder. Önerilen çözüm sanal ortamdır; --break-system-packages yalnızca kapsayıcı gibi atılabilir ortamlarda kullanılmalıdır.",
      "cikti": "error: externally-managed-environment\n\n× This environment is externally managed\n╰─> To install Python packages system-wide, try apt install\n    python3-xyz, where xyz is the package you are trying to\n    install.\n    \n    If you wish to install a non-Debian-packaged Python package,\n    create a virtual environment using python3 -m venv path/to/venv.\n    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make\n    sure you have python3-full installed.\n    \n    If you wish to install a non-Debian packaged Python application,\n    it may be easiest to use pipx install xyz, which will manage a\n    virtual environment for you. Make sure you have pipx installed.\n    \n    See /usr/share/doc/python3.12/README.venv for more information.\n\nnote: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.\nhint: See PEP 668 for the detailed specification.",
      "hata": true
    },
    {
      "komut": "python3.12 -m pip install --user pyserial",
      "aciklama": "PEP 668 kullanıcı dizinine (--user) kurulumu da kapsar; çünkü ~/.local altındaki paketler de sistem Python'u tarafından içe aktarılır.",
      "cikti": "error: externally-managed-environment\n\n...",
      "hata": true
    }
  ]
};

window.TerminalOturumlari["venv-kurulum"] = {
  "baslik": "Sanal ortamın oluşturulması ve paketin kurulması",
  "istem": "gelistirici@derleme:~/ornekler/sensor-araclari$",
  "adimlar": [
    {
      "komut": "python3.12 -m venv .venv",
      "aciklama": "venv modülü .venv dizininde yeni bir ortam oluşturur. Komut başarılı olduğunda çıktı vermez."
    },
    {
      "komut": "cat .venv/pyvenv.cfg",
      "aciklama": "pyvenv.cfg, yorumlayıcının açılışta okuduğu dosyadır: home temel Python'un dizinini, include-system-site-packages sistem paketlerinin görünürlüğünü belirler.",
      "cikti": "home = /usr/bin\ninclude-system-site-packages = false\nversion = 3.12.3\nexecutable = /usr/bin/python3.12\ncommand = /usr/bin/python3.12 -m venv /home/gelistirici/ornekler/sensor-araclari/.venv"
    },
    {
      "komut": "ls -l .venv/bin/ | grep python",
      "aciklama": "Ortamdaki python bir kopya değil, temel yorumlayıcıya sembolik bağlantıdır. Ortamı ayıran şey ikili dosya değil, yanındaki pyvenv.cfg'dir.",
      "cikti": "lrwxrwxrwx 1 gelistirici gelistirici   10 Nov  2 21:26 python -> python3.12\nlrwxrwxrwx 1 gelistirici gelistirici   10 Nov  2 21:26 python3 -> python3.12\nlrwxrwxrwx 1 gelistirici gelistirici   19 Nov  2 21:26 python3.12 -> /usr/bin/python3.12"
    },
    {
      "komut": "ls .venv/lib/python3.12/site-packages/",
      "aciklama": "Yeni ortamın site-packages dizininde yalnızca pip bulunur.",
      "cikti": "pip\npip-24.0.dist-info"
    },
    {
      "komut": "source .venv/bin/activate",
      "aciklama": "activate betiği PATH'in başına .venv/bin ekler ve istemi değiştirir. Etkinleştirme zorunlu değildir; .venv/bin/python doğrudan da çalıştırılabilir."
    },
    {
      "komut": "which python pip",
      "istem": "(.venv) gelistirici@derleme:~/ornekler/sensor-araclari$",
      "aciklama": "python ve pip artık ortamın bin dizininden çözülür.",
      "cikti": "/home/gelistirici/ornekler/sensor-araclari/.venv/bin/python\n/home/gelistirici/ornekler/sensor-araclari/.venv/bin/pip"
    },
    {
      "komut": "python ../bolum-01/ortam_bilgisi.py",
      "istem": "(.venv) gelistirici@derleme:~/ornekler/sensor-araclari$",
      "aciklama": "sys.prefix ortamın dizinini, sys.base_prefix temel kurulumu gösterir; ikisinin farklı olması sanal ortamda çalışıldığını gösterir. sys.path'te /usr/lib/python3/dist-packages yer almaz.",
      "cikti": "sürüm        : CPython 3.12.3\nyorumlayıcı  : /home/gelistirici/ornekler/sensor-araclari/.venv/bin/python\nsys.prefix   : /home/gelistirici/ornekler/sensor-araclari/.venv\nbase_prefix  : /usr\nsanal ortam  : evet\nsite-packages: /home/gelistirici/ornekler/sensor-araclari/.venv/lib/python3.12/site-packages\nkullanıcı    : /home/gelistirici/.local/lib/python3.12/site-packages (etkin: False)\nsys.path:\n  /home/gelistirici/ornekler/bolum-01\n  /usr/lib/python312.zip\n  /usr/lib/python3.12\n  /usr/lib/python3.12/lib-dynload\n  /home/gelistirici/ornekler/sensor-araclari/.venv/lib/python3.12/site-packages"
    },
    {
      "komut": "pip install -e '.[test]' | tail -n 3",
      "istem": "(.venv) gelistirici@derleme:~/ornekler/sensor-araclari$",
      "aciklama": "Paket, pyproject.toml'daki bağımlılıklarıyla birlikte düzenlenebilir (-e) kipte kurulur; [test] isteğe bağlı bağımlılık grubunu (pytest) da ekler.",
      "cikti": "Successfully built sensor-araclari\nInstalling collected packages: pyserial, sensor-araclari, pygments, pluggy, packaging, iniconfig, pytest\nSuccessfully installed iniconfig-2.3.1 packaging-26.3 pluggy-1.7.0 pygments-2.21.0 pyserial-3.5 pytest-9.2.0 sensor-araclari-0.3.0"
    },
    {
      "komut": "pip list",
      "istem": "(.venv) gelistirici@derleme:~/ornekler/sensor-araclari$",
      "aciklama": "Düzenlenebilir kurulumlarda paket kaynağın bulunduğu dizinden çalışır; kaynakta yapılan değişiklik yeniden kurulum gerektirmez.",
      "cikti": "Package         Version Editable project location\n--------------- ------- ------------------------------------------\niniconfig       2.3.1\npackaging       26.3\npip             24.0\npluggy          1.7.0\nPygments        2.21.0\npyserial        3.5\npytest          9.2.0\nsensor-araclari 0.3.0   /home/gelistirici/ornekler/sensor-araclari"
    },
    {
      "komut": "head -n 3 .venv/bin/sensor-rapor",
      "istem": "(.venv) gelistirici@derleme:~/ornekler/sensor-araclari$",
      "aciklama": "[project.scripts] girdisi için pip küçük bir başlatıcı betik üretir. Betiğin shebang satırı ortamın yorumlayıcısını mutlak yolla gösterir; bu nedenle ortam taşınamaz.",
      "cikti": "#!/home/gelistirici/ornekler/sensor-araclari/.venv/bin/python3.12\n# -*- coding: utf-8 -*-\nimport re"
    },
    {
      "komut": "pip freeze --exclude-editable > requirements.txt",
      "istem": "(.venv) gelistirici@derleme:~/ornekler/sensor-araclari$",
      "aciklama": "pip freeze kurulu tüm paketleri tam sürümleriyle yazar. Bu dosya ortamın aynısını başka bir makinede kurmak için kullanılır."
    },
    {
      "komut": "cat requirements.txt",
      "istem": "(.venv) gelistirici@derleme:~/ornekler/sensor-araclari$",
      "aciklama": "Dolaylı bağımlılıklar (pluggy, iniconfig gibi pytest bağımlılıkları) da sabitlenir.",
      "cikti": "iniconfig==2.3.1\npackaging==26.3\npluggy==1.7.0\nPygments==2.21.0\npyserial==3.5\npytest==9.2.0"
    },
    {
      "komut": "deactivate",
      "istem": "(.venv) gelistirici@derleme:~/ornekler/sensor-araclari$",
      "aciklama": "deactivate PATH'i ve istemi eski haline getirir."
    },
    {
      "komut": "which python3",
      "aciklama": "Ortam dışında python3 yeniden PATH'teki ilk yorumlayıcıya çözülür.",
      "cikti": "/usr/local/bin/python3"
    }
  ]
};

window.TerminalOturumlari["repl-nesneler"] = {
  "baslik": "REPL'de adlar, nesneler ve türler",
  "istem": "gelistirici@derleme:~$",
  "adimlar": [
    {
      "komut": "python3 -q",
      "aciklama": "-q sürüm başlığını göstermeden etkileşimli yorumlayıcıyı (REPL) açar. Bu oturumdaki çıktılar python3 3.13 ile alınmıştır."
    },
    {
      "komut": "okumalar = [21.4, 21.8]",
      "istem": ">>>",
      "aciklama": "Bir liste nesnesi oluşturulur ve okumalar adı bu nesneye bağlanır. Atama deyimi değer döndürmez."
    },
    {
      "komut": "yedek = okumalar",
      "istem": ">>>",
      "aciklama": "Kopya oluşmaz: yedek adı aynı liste nesnesine bağlanır."
    },
    {
      "komut": "yedek is okumalar",
      "istem": ">>>",
      "cikti": "True",
      "aciklama": "is, iki adın aynı nesneyi gösterip göstermediğini (kimlik) sınar."
    },
    {
      "komut": "yedek.append(22.6); okumalar",
      "istem": ">>>",
      "cikti": "[21.4, 21.8, 22.6]",
      "aciklama": "Nesne yerinde değiştirildiğinden değişiklik iki ad üzerinden de görülür."
    },
    {
      "komut": "yedek = yedek + [23.0]; okumalar, yedek is okumalar",
      "istem": ">>>",
      "cikti": "([21.4, 21.8, 22.6], False)",
      "aciklama": "+ işleci yeni bir liste üretir; yalnızca yedek adı yeni nesneye bağlanır, okumalar etkilenmez."
    },
    {
      "komut": "a = (1, [2, 3]); a[1].append(4); a",
      "istem": ">>>",
      "cikti": "(1, [2, 3, 4])",
      "aciklama": "Demet değiştirilemez, ancak içindeki liste değiştirilebilir bir nesnedir; demet yalnızca hangi nesneleri gösterdiğini sabitler."
    },
    {
      "komut": "a[0] = 9",
      "istem": ">>>",
      "hata": true,
      "cikti": "Traceback (most recent call last):\n  File \"<stdin>\", line 1, in <module>\n    a[0] = 9\n    ~^^^\nTypeError: 'tuple' object does not support item assignment",
      "aciklama": "Demetin bir elemanının başka bir nesneye bağlanması TypeError verir."
    },
    {
      "komut": "hash([1, 2])",
      "istem": ">>>",
      "hata": true,
      "cikti": "Traceback (most recent call last):\n  File \"<stdin>\", line 1, in <module>\n    hash([1, 2])\n    ~~~~^^^^^^^^\nTypeError: unhashable type: 'list'",
      "aciklama": "Değiştirilebilir nesnelerin özet (hash) değeri yoktur; bu nedenle sözlük anahtarı veya küme elemanı olamazlar."
    },
    {
      "komut": "\"sıcaklık\".encode()",
      "istem": ">>>",
      "cikti": "b's\\xc4\\xb1cakl\\xc4\\xb1k'",
      "aciklama": "str Unicode metindir; encode() varsayılan olarak UTF-8 bayt dizisi üretir. 'ı' harfi iki bayt (C4 B1) tutar."
    },
    {
      "komut": "b\"\\x01\\x03\"[0], b\"\\x01\\x03\"[0:1]",
      "istem": ">>>",
      "cikti": "(1, b'\\x01')",
      "aciklama": "bytes'ın tek elemanı int'tir; dilim ise yine bytes döndürür."
    },
    {
      "komut": "\"21.4\" + 1",
      "istem": ">>>",
      "hata": true,
      "cikti": "Traceback (most recent call last):\n  File \"<stdin>\", line 1, in <module>\n    \"21.4\" + 1\n    ~~~~~~~^~~\nTypeError: can only concatenate str (not \"int\") to str",
      "aciklama": "Python dinamik ama güçlü tiplidir: türler örtük olarak dönüştürülmez."
    },
    {
      "komut": "int(\"21\"), float(\"21.4\"), int(\"0x1F\", 16), int(\"ff\", 16)",
      "istem": ">>>",
      "cikti": "(21, 21.4, 31, 255)",
      "aciklama": "Dönüşümler açıkça yapılır; int() taban parametresiyle onaltılık metni de çözer."
    },
    {
      "komut": "bool(\"\"), bool(\"0\"), bool(0), bool([]), bool(None)",
      "istem": ">>>",
      "cikti": "(False, True, False, False, False)",
      "aciklama": "Boş kaplar, sıfır ve None yanlış sayılır. \"0\" boş olmayan bir metin olduğundan doğrudur."
    },
    {
      "komut": "x = 7; f\"{x:#06b} {x:>4} {x/3:.3f} {x=}\"",
      "istem": ">>>",
      "cikti": "'0b0111    7 2.333 x=7'",
      "aciklama": "f-string biçim belirteçleri: önekli ve sıfır dolgulu ikili, sağa hizalama, ondalık duyarlık ve hata ayıklama biçimi (=)."
    }
  ]
};

window.TerminalOturumlari["temeller-betik"] = {
  "baslik": "Sayılar, metin ve match deyimi",
  "istem": "gelistirici@derleme:~/ornekler/bolum-02$",
  "adimlar": [
    {
      "komut": "python3 sayilar_metin.py",
      "aciklama": "int taşmaz; // ve % negatif sayılarda aşağı yuvarlar; float ikili kesir olduğundan 0.1 + 0.2 tam 0.3 değildir; Türkçe karakterler UTF-8'de iki bayt tutar.",
      "cikti": "2**64        = 18446744073709551616\nbit işlemleri: 0b10100011 0x3 10 10100011\ntamsayı bölme: 3 -4 1 2\n0.1 + 0.2    = 0.30000000000000004 | eşit mi: False\nisclose      : True\nstr uzunluğu : 8 | UTF-8 bayt: 10 b's\\xc4\\xb1cakl\\xc4\\xb1k'\nbytes[0]     : 115 | bytes[0:1]: b's'\ngeri çözme   : sıcaklık\nhata         : 'ascii' codec can't decode byte 0xc4 in position 1: ordinal not in range(128)\n[sensor0 ] [   21.46] [+2.1e+01] [0x00ff] [1,013]\ndeger=21.5 sensor='sensor0'"
    },
    {
      "komut": "python3 ad_baglama.py",
      "aciklama": "Takma ad, yeniden bağlama ve fonksiyona geçirilen değiştirilebilir nesne davranışı betik olarak tekrarlanır.",
      "cikti": "aynı nesne mi : True True\nokumalar      : [21.4, 21.8, 22.6]\nyeniden bağlama: [21.4, 21.8, 22.6] | [21.4, 21.8, 22.6, 23.0] | aynı mı: False\nint           : 10 11\nfonksiyon     : [1, 2] [2]\nNone denetimi : True"
    },
    {
      "komut": "python3 komut_esle.py",
      "aciklama": "match deyimi komut satırlarını yapısına göre ayrıştırır. CIKIS komutu SystemExit yükselttiği için listenin geri kalanı işlenmez ve çıkış kodu 0 olur.",
      "cikti": "> OKU sensor0        sensor0: 21.4 C\n> OKU                HATA: kullanım: OKU sensorN\n> AYARLA aralik 10   TAMAM aralik=10\n> AYARLA esik sicak  HATA: esik için geçersiz değer: sicak\n> DURUM              aralik=10 esik=30.0\n> SIFIRLA            HATA: bilinmeyen komut: SIFIRLA"
    },
    {
      "komut": "python3 komut_esle.py 'OKU sicaklik' 'AYARLA esik 35.5' 'DURUM'",
      "aciklama": "Korumalı durum (if sensor.startswith(...)) eşleşmediğinde sonraki case denenir.",
      "cikti": "> OKU sicaklik       HATA: kullanım: OKU sensorN\n> AYARLA esik 35.5   TAMAM esik=35.5\n> DURUM              aralik=5 esik=35.5"
    }
  ]
};

window.TerminalOturumlari["veri-yapilari"] = {
  "baslik": "Veri yapılarıyla günlük özeti ve karmaşıklık ölçümü",
  "istem": "gelistirici@derleme:~/ornekler/bolum-03$",
  "adimlar": [
    {
      "komut": "python3 olcum_ozet.py",
      "aciklama": "namedtuple, küme kavraması, Counter, defaultdict, sözlük kavraması ve deque(maxlen=3) aynı günlük üzerinde kullanılır.",
      "cikti": "kayıt sayısı     : 9 | ilk: Kayit(zaman='10:00:01', sensor='sensor0', deger=21.4, durum='TAMAM')\nsensörler        : ['sensor0', 'sensor1', 'sensor2']\nhata sayıları    : [('E_ZAMAN_ASIMI', 2), ('E_CRC', 1)]\ngruplar          : {'sensor0': [21.4, 21.8, 22.6, 31.2], 'sensor1': [19.0, 19.5]}\nortalamalar      : {'sensor0': 24.25, 'sensor1': 19.25}\n  pencere [21.4]               kayan ort. 21.40\n  pencere [21.4, 21.8]         kayan ort. 21.60\n  pencere [21.4, 21.8, 22.6]   kayan ort. 21.93\n  pencere [21.8, 22.6, 31.2]   kayan ort. 25.20\nen yüksek iki    : [('sensor0', 31.2), ('sensor0', 22.6)]\nters sıra zaman  : ['10:00:21', '10:00:16', '10:00:16']"
    },
    {
      "komut": "python3 kopyalama.py",
      "aciklama": "Sığ kopya iç içe nesneleri paylaşır: kopyadaki listeye eklenen sensor2 asıl sözlükte de görülür. Derin kopya tamamen bağımsızdır.",
      "cikti": "varsayilan: {'aralik': 5, 'sensorler': ['sensor0', 'sensor1', 'sensor2'], 'seri': {'hiz': 9600}}\nsig       : {'aralik': 10, 'sensorler': ['sensor0', 'sensor1', 'sensor2'], 'seri': {'hiz': 9600}}\nderin     : {'aralik': 5, 'sensorler': ['sensor0', 'sensor1'], 'seri': {'hiz': 115200}}\niç liste aynı nesne mi? sığ: True | derin: False\n[[]] * 3  : [[1], [1], [1]]\nkavrama   : [[1], [], []]"
    },
    {
      "komut": "python3 karmasiklik.py",
      "aciklama": "list'te üyelik denetimi O(n), set ve dict'te ortalama O(1)'dir. list.pop(0) her çağrıda tüm elemanları kaydırır; deque.popleft() sabit sürelidir. Süreler makineye göre değişir.",
      "cikti": "'in' list :   98.974 µs/işlem\n'in' set  :    0.042 µs/işlem\n'in' dict :    0.043 µs/işlem\nbastan_cek_list  :  192.886 ms\nbastan_cek_deque :    0.396 ms"
    },
    {
      "komut": "python3 -m timeit -s 'k = set(range(10_000))' '9_999 in k'",
      "aciklama": "timeit modülü komut satırından da kullanılabilir: -s hazırlık kodudur ve ölçüme katılmaz.",
      "cikti": "10000000 loops, best of 5: 27.3 nsec per loop"
    },
    {
      "komut": "python3 -m timeit -s 'l = list(range(10_000))' '9_999 in l'",
      "aciklama": "Aynı işlem listede binlerce kat daha uzun sürer (nsec ve usec birimlerine dikkat).",
      "cikti": "5000 loops, best of 5: 86.9 usec per loop"
    }
  ]
};

window.TerminalOturumlari["import-sistemi"] = {
  "baslik": "import sistemi, kapsam ve sınıflar",
  "istem": "(.venv) gelistirici@derleme:~/ornekler/bolum-04$",
  "adimlar": [
    {
      "komut": "python ithal_izle.py",
      "aciklama": "find_spec modülün hangi dosyadan yükleneceğini gösterir. İlk import modülü çalıştırır ve sys.modules'a ekler; ikinci import önbellekten gelir. Son adımda geçerli dizindeki serial.py, kurulu pyserial paketini gölgeler.",
      "cikti": "1) sys.path[0] (betiğin dizini): bolum-04\n2) find_spec ile modülün bulunacağı yer:\n   ayarlar        -> /home/gelistirici/ornekler/bolum-04/ayarlar.py\n   json           -> /usr/lib/python3.12/json/__init__.py\n   sys            -> built-in\n   serial         -> /home/gelistirici/ornekler/sensor-araclari/.venv/lib/python3.12/site-packages/serial/__init__.py\n   olmayan_modul  -> bulunamadı\n3) ilk import modülü çalıştırır ve sys.modules'a ekler:\n   önce : False\n  [ayarlar.py çalıştı; __name__ = 'ayarlar']\n   sonra: True | aralık=5\n4) ikinci import önbellekten gelir (modül yeniden çalışmaz):\n   aynı nesne: True\n5) importlib.reload modülü yeniden çalıştırır:\n  [ayarlar.py çalıştı; __name__ = 'ayarlar']\n6) gölgeleme: geçerli dizindeki serial.py, pyserial'ı gizler\n   serial.py sahte"
    },
    {
      "komut": "python ayarlar.py",
      "aciklama": "Doğrudan çalıştırılan modülün __name__ değeri '__main__' olur; if __name__ == '__main__' bloğu yalnızca bu durumda çalışır.",
      "cikti": "  [ayarlar.py çalıştı; __name__ = '__main__']\n  doğrudan çalıştırıldı: aralık=5"
    },
    {
      "komut": "PYTHONPATH=/opt/ornek python -c 'import sys; print(sys.path[:3])'",
      "aciklama": "-c ile çalıştırmada sys.path[0] boş dizgidir (geçerli dizin). PYTHONPATH'teki dizinler bunun hemen ardından, standart kütüphaneden önce gelir.",
      "cikti": "['', '/opt/ornek', '/usr/lib/python312.zip']"
    },
    {
      "komut": "python -m sensor_araclari.cli --version",
      "aciklama": "-m seçeneği modülü sys.path üzerinden bulur ve __main__ olarak çalıştırır; paket içi göreli import'lar bu yolla çalışır.",
      "cikti": "sensor-rapor 0.3.0"
    },
    {
      "komut": "python kapsam_dekorator.py",
      "aciklama": "Konumsal-yalnız ve anahtar-yalnız argümanlar, değiştirilebilir varsayılan değer tuzağı, LEGB sırası, nonlocal ile kapanış, geç bağlama ve functools.wraps kullanan bir yeniden deneme dekoratörü.",
      "cikti": "oku('sensor0', adet=1, zaman_asimi=1.0, ek={})\noku('sensor0', adet=3, zaman_asimi=0.5, ek={'birim': 'C'})\nTypeError: oku() takes from 1 to 2 positional arguments but 3 were given\nhatalı: [1, 2] [1, 2]\ndoğru : [1] [2]\nLEGB  : K C 3\nkapanış: 3 3\ngeç bağlama: [2, 2, 2] | varsayılanla: [0, 1, 2]\n  sicaklik_oku: deneme 1/3 başarısız (yanıt yok)\n  sicaklik_oku: deneme 2/3 başarısız (yanıt yok)\ndekoratör: 21.4 | sicaklik_oku | Cihazdan sıcaklık okur (benzetim)."
    },
    {
      "komut": "python siniflar.py",
      "aciklama": "property ile doğrulama, alternatif kurucu olarak classmethod, super() ile kalıtım, Protocol ile yapısal tip ve order=True ile sıralanabilir dataclass.",
      "cikti": "SicaklikSensoru(ad='sensor0', adres=1) SicaklikSensoru(ad='sensor1', adres=2) | oluşturulan: 2\nokuma     : 21.4 19.0 | ortalama: 20.2\nisinstance: True | MRO: ['SicaklikSensoru', 'Sensor', 'object']\nproperty  : Modbus adresi 1-247 olmalı: 300\nsıralı    : ['sıcaklık kritik', 'nem yüksek', 'pil zayıf']\ndataclass : Alarm(oncelik=1, ileti='sıcaklık kritik', etiketler=['sensor0'])\neşitlik   : True"
    }
  ]
};

window.TerminalOturumlari["sensor-rapor"] = {
  "baslik": "sensor-rapor: argparse, yapılandırma ve çıkış kodları",
  "istem": "(.venv) gelistirici@derleme:~/ornekler/sensor-araclari$",
  "adimlar": [
    {
      "komut": "sensor-rapor --help",
      "aciklama": "argparse, tanımlanan argümanlardan yardım metnini otomatik üretir; epilog çıkış kodlarını belgeler.",
      "cikti": "usage: sensor-rapor [-h] [-b {tablo,json,csv}] [-e DEGER] [-y INI] [-v | -q] [--version]\n                    DOSYA [DOSYA ...]\n\nSensör ölçüm dosyalarını (CSV) özetler ve eşik denetimi yapar.\n\npositional arguments:\n  DOSYA                 ölçüm dosyası (CSV)\n\noptions:\n  -h, --help            show this help message and exit\n  -b {tablo,json,csv}, --bicim {tablo,json,csv}\n                        çıktı biçimi (ortam: SENSOR_RAPOR_BICIM, varsayılan: tablo)\n  -e DEGER, --esik DEGER\n                        bu değeri aşan en büyük ölçüm alarm sayılır\n  -y INI, --yapilandirma INI\n                        yapılandırma dosyası (varsayılan: /etc/sensor-araclari/rapor.ini)\n  -v, --ayrintili       daha çok günlük (-vv: ayıklama)\n  -q, --sessiz          yalnızca hataları göster\n  --version             show program's version number and exit\n\nÇıkış kodları: 0 tamam, 1 eşik aşıldı, 2 kullanım hatası, 3 veri hatası."
    },
    {
      "komut": "sensor-rapor ornek-veri/olcumler.csv; echo \"çıkış kodu: $?\"",
      "aciklama": "Varsayılan biçim tablodur. Eşik verilmediği için çıkış kodu 0'dır.",
      "cikti": "sensör      adet     min     max     ort\nsensor0        4    21.4    31.2   24.25\nsensor1        4    19.0    19.5   19.20\nçıkış kodu: 0"
    },
    {
      "komut": "sensor-rapor -b json -e 30 ornek-veri/olcumler.csv; echo \"çıkış kodu: $?\"",
      "aciklama": "JSON stdout'a, uyarı stderr'e yazılır. sensor0'ın en büyük değeri (31.2) eşiği aştığından çıkış kodu 1'dir; bir kabuk betiği veya systemd bu kodla karar verebilir.",
      "cikti": "{\n  \"sensor0\": {\n    \"adet\": 4,\n    \"min\": 21.4,\n    \"max\": 31.2,\n    \"ort\": 24.25\n  },\n  \"sensor1\": {\n    \"adet\": 4,\n    \"min\": 19.0,\n    \"max\": 19.5,\n    \"ort\": 19.2\n  }\n}\n21:26:36 WARNING sensor_araclari.cli: eşik 30.0 aşıldı: sensor0\nçıkış kodu: 1"
    },
    {
      "komut": "SENSOR_RAPOR_BICIM=csv sensor-rapor ornek-veri/olcumler.csv",
      "aciklama": "Komut satırında biçim verilmediğinde ortam değişkeni kullanılır.",
      "cikti": "sensor,adet,min,max,ort\nsensor0,4,21.4,31.2,24.25\nsensor1,4,19.0,19.5,19.2"
    },
    {
      "komut": "sensor-rapor -v -y ornek-veri/rapor.ini ornek-veri/olcumler.csv; echo \"çıkış kodu: $?\"",
      "aciklama": "INI dosyasındaki esik = 30.0 değeri kullanılır. -v bilgi düzeyindeki günlükleri açar; günlükler stderr'e gittiği için çıktıyı bozmaz.",
      "cikti": "21:26:36 INFO    sensor_araclari.cli: okunuyor: ornek-veri/olcumler.csv\nsensör      adet     min     max     ort\nsensor0        4    21.4    31.2   24.25\nsensor1        4    19.0    19.5   19.20\n21:26:36 WARNING sensor_araclari.cli: eşik 30.0 aşıldı: sensor0\nçıkış kodu: 1"
    },
    {
      "komut": "sensor-rapor ornek-veri/bozuk.csv; echo \"çıkış kodu: $?\"",
      "aciklama": "Ayrıştırma hatası satır numarasıyla bildirilir ve program 3 koduyla çıkar; traceback kullanıcıya gösterilmez.",
      "cikti": "21:26:37 ERROR   sensor_araclari.cli: satır 3: sayı değil: 'yirmi'\nçıkış kodu: 3"
    },
    {
      "komut": "sensor-rapor -b xml ornek-veri/olcumler.csv; echo \"çıkış kodu: $?\"",
      "aciklama": "Geçersiz seçenek değerini argparse yakalar, kullanım bilgisini yazar ve 2 koduyla çıkar.",
      "cikti": "usage: sensor-rapor [-h] [-b {tablo,json,csv}] [-e DEGER] [-y INI] [-v | -q] [--version]\n                    DOSYA [DOSYA ...]\nsensor-rapor: error: argument -b/--bicim: invalid choice: 'xml' (choose from 'tablo', 'json', 'csv')\nçıkış kodu: 2"
    },
    {
      "komut": "sensor-rapor -q ornek-veri/olcumler.csv > ozet.txt && echo \"rapor hazır: $(wc -l < ozet.txt) satır\"",
      "aciklama": "0 çıkış kodu kabuğun && işlecinin sağ tarafını çalıştırır.",
      "cikti": "rapor hazır: 3 satır"
    }
  ]
};

window.TerminalOturumlari["surec-dosya"] = {
  "baslik": "subprocess ve pathlib örnekleri",
  "istem": "(.venv) gelistirici@derleme:~/ornekler/bolum-05$",
  "adimlar": [
    {
      "komut": "python guvenli_surec.py",
      "aciklama": "1-4: run() ile başarı, başarısız komut, bulunamayan komut ve zaman aşımı. 5: shell=True ile dışarıdan gelen metin ikinci bir komut çalıştırır; liste biçiminde aynı metin tek bir argümandır. 6: iki süreç kabuk olmadan boruyla bağlanır.",
      "cikti": "1) stdout: ['sensor1', 'sensor0'] | returncode: 0\n2) ['ls', '/olmayan/dizin'] -> kod 2; stderr: ls: cannot access '/olmayan/dizin': No such file or directory\n3) FileNotFoundError: No such file or directory olmayan-komut\n4) TimeoutExpired: ['sleep', '5'] 0.2 s\n5) shell=True : ['işleniyor: olcum.csv', 'ENJEKSIYON']\n   liste      : ['işleniyor: olcum.csv; echo ENJEKSIYON']\n   shlex.quote: 'olcum.csv; echo ENJEKSIYON'\n6) boru hattı: ['sensor0', 'sensor1', 'sensor2'] | kodlar: 0 0\n7) input/env : sensor0 VERI"
    },
    {
      "komut": "python dosya_islemleri.py",
      "aciklama": "pathlib ile yol işlemleri ve glob; geçici dosya ile atomik yazma; Latin-5 kodlu bir dosyanın UTF-8 olarak okunamaması; bağlam yöneticisinin çıkışta dizini ve dosyayı geri vermesi.",
      "cikti": "1) parçalar : 2026-11-02 veri .csv ['.tar', '.gz']\n2) glob     : ['sensor0.csv', 'sensor1.csv', 'sensor2.csv']\n3) rglob    : 3 dosya\n4) atomik   : {'aralik': 5, 'sensorler': ['sensor0']} ['ayar.json', 'veri']\n5) kodlama  : invalid start byte konum 1\n   replace  : s�cakl�k\n   doğru    : sıcaklık\n6) bağlam   : 2026-11-02 ['sensor0.csv', 'sensor1.csv', 'sensor2.csv']\n   çıkışta  : True\n7) with     : zaman,sensor,deger,birim | kapandı mı: False\n   sonra    : kapandı mı: True"
    }
  ]
};

window.TerminalOturumlari["pytest-oturum"] = {
  "baslik": "pytest ile testlerin çalıştırılması",
  "istem": "(.venv) gelistirici@derleme:~/ornekler/sensor-araclari$",
  "adimlar": [
    {
      "komut": "pytest",
      "aciklama": "pytest, pyproject.toml'daki testpaths ayarına göre tests/ dizinini tarar; test_ ile başlayan dosya ve fonksiyonları toplar. Her nokta geçen bir testtir.",
      "cikti": "======================================= test session starts ========================================\nplatform linux -- Python 3.12.3, pytest-9.2.0, pluggy-1.7.0\nrootdir: /home/gelistirici/ornekler/sensor-araclari\nconfigfile: pyproject.toml\ntestpaths: tests\ncollected 29 items\n\ntests/test_cli.py ........                                                                   [ 27%]\ntests/test_olcum.py .........                                                                [ 58%]\ntests/test_protokol.py ............                                                          [100%]\n\n======================================== 29 passed in 0.71s ========================================"
    },
    {
      "komut": "pytest -v tests/test_olcum.py",
      "aciklama": "-v her testi adıyla gösterir. parametrize ile üretilen testler köşeli parantez içindeki kimlikleriyle (ids) listelenir.",
      "cikti": "======================================= test session starts ========================================\nplatform linux -- Python 3.12.3, pytest-9.2.0, pluggy-1.7.0 -- /home/gelistirici/ornekler/sensor-araclari/.venv/bin/python3.12\ncachedir: .pytest_cache\nrootdir: /home/gelistirici/ornekler/sensor-araclari\nconfigfile: pyproject.toml\ncollecting ... collected 9 items\n\ntests/test_olcum.py::test_satir_ayristir_gecerli PASSED                                      [ 11%]\ntests/test_olcum.py::test_satir_ayristir_hatali[sayi-degil] PASSED                           [ 22%]\ntests/test_olcum.py::test_satir_ayristir_hatali[eksik-alan] PASSED                           [ 33%]\ntests/test_olcum.py::test_satir_ayristir_hatali[gecersiz-birim] PASSED                       [ 44%]\ntests/test_olcum.py::test_hata_nedeni_korunur PASSED                                         [ 55%]\ntests/test_olcum.py::test_olcum_degistirilemez PASSED                                        [ 66%]\ntests/test_olcum.py::test_dosya_oku_yorumlari_atlar PASSED                                   [ 77%]\ntests/test_olcum.py::test_ozetle PASSED                                                      [ 88%]\ntests/test_olcum.py::test_bozuk_satirin_numarasi_bildirilir PASSED                           [100%]\n\n======================================== 9 passed in 0.03s ========================================="
    },
    {
      "komut": "pytest -q -k 'crc or zaman_asimi'",
      "aciklama": "-k, test adları üzerinde mantıksal ifadeyle seçim yapar; seçilmeyenler 'deselected' olarak sayılır.",
      "cikti": "...                                                                                          [100%]\n3 passed, 26 deselected in 0.13s"
    },
    {
      "yorum": true,
      "komut": "CRC polinomunda bilerek hata oluşturulur"
    },
    {
      "komut": "sed -i 's/0xA001/0xA000/' src/sensor_araclari/protokol.py",
      "aciklama": "Düzenlenebilir kurulum sayesinde kaynak değişikliği yeniden kurulum gerektirmeden etkin olur."
    },
    {
      "komut": "pytest -q -x tests/test_protokol.py",
      "aciklama": "-x ilk başarısızlıkta durur. pytest, assert ifadesinin iki tarafının değerini (0x4B37 ile hesaplanan değer) ayrıntılı gösterir; ek bir assertEqual yöntemine gerek yoktur.",
      "cikti": "F\n============================================= FAILURES =============================================\n______________________________________ test_crc_bilinen_deger ______________________________________\n\n    def test_crc_bilinen_deger():\n        # CRC-16/MODBUS için standart sınama değeri: \"123456789\" -> 0x4B37\n>       assert protokol.crc16_modbus(b\"123456789\") == 0x4B37\nE       AssertionError: assert 25614 == 19255\nE        +  where 25614 = <function crc16_modbus at 0x7f16d6d17100>(b'123456789')\nE        +    where <function crc16_modbus at 0x7f16d6d17100> = protokol.crc16_modbus\n\ntests/test_protokol.py:10: AssertionError\n===================================== short test summary info ======================================\nFAILED tests/test_protokol.py::test_crc_bilinen_deger - AssertionError: assert 25614 == 19255\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! stopping after 1 failures !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n1 failed in 0.07s",
      "hata": true
    },
    {
      "komut": "sed -i 's/0xA000/0xA001/' src/sensor_araclari/protokol.py && pytest -q",
      "aciklama": "Hata giderildiğinde tüm testler yeniden geçer.",
      "cikti": ".............................                                                                [100%]\n29 passed in 0.46s"
    },
    {
      "komut": "pytest --fixtures tests/test_olcum.py | grep -A1 -E '^(ornek_csv|gecici_csv|tmp_path) '",
      "aciklama": "--fixtures kullanılabilir tüm fixture'ları ve belge dizgilerini listeler: conftest.py'de tanımlananlar ve pytest'in yerleşik olanları (tmp_path gibi).",
      "cikti": "tmp_path -- .venv/lib/python3.12/site-packages/_pytest/tmpdir.py:328\n    Return a temporary directory (as :class:`pathlib.Path` object)\n--\nornek_csv -- tests/conftest.py:12\n    Depodaki örnek ölçüm dosyası (salt okunur kullanılır).\n--\ngecici_csv -- tests/conftest.py:18\n    İçeriği teste göre yazılan geçici bir CSV dosyası üreten fabrika fixture'ı."
    }
  ]
};

window.TerminalOturumlari["istisna-kayit"] = {
  "baslik": "İstisna zinciri ve logging çıktıları",
  "istem": "(.venv) gelistirici@derleme:~/ornekler/bolum-06$",
  "adimlar": [
    {
      "komut": "python istisna_zinciri.py; echo \"çıkış kodu: $?\"",
      "aciklama": "Hata en alt düzeyde doğar, ara düzeyde YapilandirmaHatasi'na dönüştürülür ve en üst düzeyde tek bir except ile yakalanır. __cause__ özgün hatayı taşır; finally her durumda çalışır.",
      "cikti": "HATA: 'aralik' ayarı geçersiz: invalid literal for int() with base 10: 'beş'\n  tür      : YapilandirmaHatasi\n  __cause__: ValueError(\"invalid literal for int() with base 10: 'beş'\")\nfinally: kaynaklar serbest bırakıldı\nçıkış kodu: 1"
    },
    {
      "komut": "python istisna_zinciri.py --yakalama",
      "aciklama": "Yakalanmayan istisnada yorumlayıcı iki traceback'i zincir halinde yazar: 'direct cause' satırı raise ... from kullanımını gösterir. Program 1 koduyla sonlanır.",
      "cikti": "Traceback (most recent call last):\n  File \"/home/gelistirici/ornekler/bolum-06/istisna_zinciri.py\", line 30, in ayar_yukle\n    return deger_oku(anahtar)\n           ^^^^^^^^^^^^^^^^^^\n  File \"/home/gelistirici/ornekler/bolum-06/istisna_zinciri.py\", line 25, in deger_oku\n    return int(AYARLAR[anahtar])\n           ^^^^^^^^^^^^^^^^^^^^^\nValueError: invalid literal for int() with base 10: 'beş'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"/home/gelistirici/ornekler/bolum-06/istisna_zinciri.py\", line 55, in <module>\n    baslat()\n  File \"/home/gelistirici/ornekler/bolum-06/istisna_zinciri.py\", line 36, in baslat\n    aralik = ayar_yukle(\"aralik\")\n             ^^^^^^^^^^^^^^^^^^^^\n  File \"/home/gelistirici/ornekler/bolum-06/istisna_zinciri.py\", line 32, in ayar_yukle\n    raise YapilandirmaHatasi(anahtar, hata) from hata\nYapilandirmaHatasi: 'aralik' ayarı geçersiz: invalid literal for int() with base 10: 'beş'",
      "hata": true
    },
    {
      "komut": "python kayit_ornegi.py",
      "aciklama": "Günlükçüler noktalı adlarla hiyerarşi oluşturur. Yalnızca agecidi.seri.modbus için DEBUG açılabilir; log.exception iletinin ardından traceback'i de yazar.",
      "cikti": "--- düzey INFO: DEBUG iletileri görünmez\nINFO    agecidi.seri         adres 1 sorgulandı\n--- yalnızca agecidi.seri.modbus için DEBUG\nDEBUG   agecidi.seri.modbus  istek hazırlanıyor: adres=2\nINFO    agecidi.seri         adres 2 sorgulandı\n--- istisna kaydı: log.exception traceback'i de yazar\nDEBUG   agecidi.seri.modbus  istek hazırlanıyor: adres=300\nERROR   agecidi.seri         sorgu başarısız\nTraceback (most recent call last):\n  File \"/home/gelistirici/ornekler/bolum-06/kayit_ornegi.py\", line 35, in <module>\n    sorgula(300)\n  File \"/home/gelistirici/ornekler/bolum-06/kayit_ornegi.py\", line 15, in sorgula\n    raise ValueError(f\"geçersiz adres {adres}\")\nValueError: geçersiz adres 300\n--- düzeyler: ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']\n--- etkin düzey: INFO DEBUG"
    },
    {
      "komut": "LOG_DUZEYI=DEBUG sensor-rapor ../sensor-araclari/ornek-veri/olcumler.csv",
      "aciklama": "Uygulamanın kayit modülü LOG_DUZEYI ortam değişkenini okur; servis dosyasına Environment=LOG_DUZEYI=DEBUG yazılarak kod değiştirmeden ayrıntılı günlük alınabilir.",
      "cikti": "21:26:45 DEBUG   sensor_araclari.cli: yapılandırma: yok\n21:26:45 INFO    sensor_araclari.cli: okunuyor: ../sensor-araclari/ornek-veri/olcumler.csv\nsensör      adet     min     max     ort\nsensor0        4    21.4    31.2   24.25\nsensor1        4    19.0    19.5   19.20"
    }
  ]
};

window.TerminalOturumlari["bayt-seri"] = {
  "baslik": "struct, bayt sırası ve pyserial loop://",
  "istem": "(.venv) gelistirici@derleme:~/ornekler/bolum-07$",
  "adimlar": [
    {
      "komut": "python bayt_struct.py",
      "aciklama": "Aynı dört alan '<' (little-endian) ve '>' (big-endian) ile 9 bayt, '@' (yerel hizalama) ile 12 bayt tutar. Yanlış bayt sırasıyla çözme hata vermez, yalnızca yanlış sayı üretir.",
      "cikti": "sistemin bayt sırası: little\nbytearray : 11 03 00 00 00 04 | uzunluk 6 | cerceve[1] = 3\nfromhex   : True | bytes ile karşılaştırma içerik üzerinden\nto_bytes  : big 12 34 | little 34 12\nfrom_bytes: -125 65411\n<BhHI :  9 bayt  03 83 ff c7 01 21 5f e8 6a\n>BhHI :  9 bayt  03 ff 83 01 c7 6a e8 5f 21\n@BhHI : 12 bayt  03 00 83 ff c7 01 00 00 21 5f e8 6a\nunpack    : (3, -125, 455, 1793613601) | sıcaklık -12.5 C\nyanlış sıra: 50945 (doğrusu 455 )\nunpack_from: 1 3 8 (214, 455, 1013, 1)\nmemoryview : 00 d6 01 c7 03 f5 00 01 | aynı tampon: True\nbitler     : {'hazir': True, 'kalibre': False, 'isitici': True}"
    },
    {
      "komut": "python seri_dongu.py",
      "aciklama": "read(n) ya n bayt gelene ya da zaman aşımı dolana kadar bekler; zaman aşımında elindekini (boş da olabilir) döndürür ve hata yükseltmez. Eksik yanıtın denetimi uygulamaya aittir.",
      "cikti": "port        : loop:// | hız: 9600 | ayar: 8N1\nyazılan     : 8 bayt\nbekleyen    : 8 bayt\nread(4)     : 01 03 00 00\nread(100)   : 00 04 44 09 (yalnızca kalan 4 bayt; zaman aşımına kadar beklendi)\nboş okuma   : b'' 0.50 s sonra (timeout=0.5)\nread_until  : b'OKU sensor0\\r\\n' b'DURUM\\r\\n'\ntimeout=0   : b''"
    },
    {
      "komut": "python -m serial.tools.list_ports -v",
      "aciklama": "pyserial ile gelen araç sistemdeki seri portları listeler. Bu makinede yalnızca sanal makinenin /dev/ttyS0 portu vardır ve USB tanımlayıcısı (hwid) yoktur; USB-seri dönüştürücü takıldığında /dev/ttyUSB0 gibi girişler üretici ve seri numarası bilgisiyle görülür.",
      "cikti": "/dev/ttyS0          \n    desc: n/a\n    hwid: n/a\n1 ports found"
    }
  ]
};

window.TerminalOturumlari["sanal-cihaz"] = {
  "baslik": "Sanal seri port ve TCP üzerinden cihaz sorgusu",
  "istem": "(.venv) gelistirici@derleme:~/ornekler/bolum-07$",
  "adimlar": [
    {
      "komut": "python sanal_cihaz.py --bag ttySANAL0 > cihaz.log 2>&1 &",
      "aciklama": "Benzetici arka planda bir pty çifti açar ve istemcinin kullanacağı ucu ttySANAL0 adıyla bağlar."
    },
    {
      "komut": "cat cihaz.log; ls -l ttySANAL0 | cut -c1-10,40-",
      "aciklama": "Sanal portun gerçek adı /dev/pts/N biçimindedir; sembolik bağlantı sabit bir ad sağlar (socat'ın link= seçeneğine benzer).",
      "cikti": "sanal port: /dev/pts/1 -> ttySANAL0  (çıkmak için Ctrl+C)\nlrwxrwxrwx Nov  2 21:26 ttySANAL0 -> /dev/pts/1"
    },
    {
      "komut": "sensor-istemci ttySANAL0 -vv",
      "aciklama": "İstemci 8 baytlık isteği yazar, önce 5 bayt, ardından kalan 8 baytı okur, CRC'yi doğrular ve yazmaçları çözer.",
      "cikti": "21:26:47 DEBUG   sensor_araclari.istemci: gönderilen: 01 03 00 00 00 04 44 09\n21:26:47 DEBUG   sensor_araclari.istemci: alınan   : 01 03 08 00 D6 01 C7 03 F5 00 01 47 AC\nsıcaklık : 21.4 C\nnem      : 45.5 %RH\nbasınç   : 1013 hPa\ndurum    : hazır"
    },
    {
      "komut": "sensor-istemci ttySANAL0 -a 5 -t 0.3; echo \"çıkış kodu: $?\"",
      "aciklama": "Adres 5'te cihaz yoktur; Modbus'ta yanlış adrese yanıt verilmez. read() 0.3 s sonra boş döner ve istemci zaman aşımını 5 koduyla bildirir.",
      "cikti": "21:26:48 ERROR   sensor_araclari.istemci: cihaz yanıt vermedi: zaman aşımı: 0 bayt alındı\nçıkış kodu: 5"
    },
    {
      "komut": "kill %1; cat cihaz.log",
      "aciklama": "Benzeticinin kaydı iki isteği de gösterir: ilkine yanıt verilmiş, ikincisi başka adrese gittiği için yanıtsız bırakılmıştır.",
      "cikti": "sanal port: /dev/pts/1 -> ttySANAL0  (çıkmak için Ctrl+C)\n[cihaz] alındı 01 03 00 00 00 04 44 09 -> 01 03 08 00 D6 01 C7 03 F5 00 01 47 AC\n[cihaz] alındı 05 03 00 00 00 04 45 8D -> yanıt yok"
    },
    {
      "komut": "python tcp_sunucu.py --sure 5 > sunucu.log &",
      "aciklama": "select tabanlı sunucu 127.0.0.1:5020'de dinlemeye başlar ve aynı benzeticiyi TCP üzerinden sunar; --sure 5 ile 5 saniye sonra kendiliğinden kapanır."
    },
    {
      "komut": "python tcp_istemci.py",
      "aciklama": "socket ile istemci: create_connection zaman aşımıyla bağlanır, sendall isteğin tamamını gönderir, tam_oku yanıtın tamamı gelene kadar recv çağırır.",
      "cikti": "gönderildi: 01 03 00 00 00 02 C4 0B\nalındı    : 01 03 04 00 D6 01 C7 5B C9\nsonuç     : 21.4 C, %45.5"
    },
    {
      "komut": "sensor-istemci socket://127.0.0.1:5020",
      "aciklama": "Aynı istemci kodu, pyserial'ın socket:// URL desteği sayesinde seri port yerine TCP bağlantısıyla çalışır.",
      "cikti": "sıcaklık : 21.4 C\nnem      : 45.5 %RH\nbasınç   : 1013 hPa\ndurum    : hazır"
    },
    {
      "komut": "wait; cat sunucu.log",
      "aciklama": "Sunucu iki bağlantıyı da ayrı ayrı kabul etmiş, her bağlantı kapandığında tamponunu silmiştir. select'in 0,5 s zaman aşımı, sunucunun hiçbir istemci yokken de --sure süresini denetleyebilmesini sağlar.",
      "cikti": "[sunucu] 127.0.0.1:5020 dinleniyor\n[sunucu] bağlandı: 127.0.0.1:37620\n[sunucu] 01 03 00 00 00 02 C4 0B -> yanıt\n[sunucu] bağlantı kapandı\n[sunucu] bağlandı: 127.0.0.1:37622\n[sunucu] 01 03 00 00 00 04 44 09 -> yanıt\n[sunucu] bağlantı kapandı"
    },
    {
      "komut": "python udp_olcum.py",
      "aciklama": "UDP'de her sendto bir datagramdır ve alıcıda tek recvfrom ile bütün olarak alınır. Yeni paket gelmediğinde settimeout ile belirlenen süre sonunda TimeoutError yükselir.",
      "cikti": "gönderildi: 00 d6 00 c7 01 21 5f e8 6a  (9 bayt)\ngönderildi: 01 83 ff c7 01 22 5f e8 6a  (9 bayt)\ngönderildi: 02 be 00 c7 01 23 5f e8 6a  (9 bayt)\nalındı    : sensor0 +21.4 C %45.5 t=1793613601 kaynak 127.0.0.1\nalındı    : sensor1 -12.5 C %45.5 t=1793613602 kaynak 127.0.0.1\nalındı    : sensor2 +19.0 C %45.5 t=1793613603 kaynak 127.0.0.1\nzaman aşımı: başka paket yok"
    }
  ]
};

window.TerminalOturumlari["bitbake-python"] = {
  "baslik": "BitBake ile Python görevleri ve satır içi Python",
  "istem": "gelistirici@derleme:~/ornekler/bolum-08/bbmini$",
  "adimlar": [
    {
      "komut": "export BBPATH=$PWD PATH=~/bitbake/bin:$PATH",
      "aciklama": "OE-Core olmadan çalışan küçük bir BitBake projesi kullanılır. BBPATH, conf/bitbake.conf ve classes/ dizinlerinin aranacağı yerdir."
    },
    {
      "komut": "bitbake --version",
      "aciklama": "Yocto Project 6.0 Wrynose, BitBake 2.18 serisini kullanır.",
      "cikti": "BitBake Build Tool Core version 2.18.0"
    },
    {
      "komut": "bitbake sensor-oku -c bilgi",
      "aciklama": "Python görevi do_bilgi değişkenleri yazdırır. SERVIS satır içi Python ile, SENSORLER addpylib ile yüklenen katman kütüphanesiyle, ETIKETLER'in sonundaki 'anonim' anonim Python işleviyle üretilmiştir. Görev sırasında OVERRIDES'ın başına task-bilgi eklenir.",
      "cikti": "Loading cache...done.\nLoaded 0 entries from dependency cache.\nParsing recipes...done.\nParsing of 4 .bb files complete (0 cached, 4 parsed). 4 targets, 1 skipped, 0 masked, 0 errors.\nNOTE: Resolving any missing task queue dependencies\nInitialising tasks...done.\nNOTE: No setscene tasks\nNOTE: Executing Tasks\nNOTE: Running task 1 of 1 (/home/gelistirici/ornekler/bolum-08/bbmini/recipes/sensor-oku_1.0.bb:do_bilgi)\nNOTE: recipe sensor-oku-1.0: task do_bilgi: Started\nPF           = sensor-oku-1.0\nOVERRIDES    = task-bilgi:agecidi:ornekos\nKONSOL       = ttyAMA0\nSERVIS       = sensor-oku.service\nSENSORLER    = sensor0 sensor1 sensor2\nETIKETLER    = temel append anonim\nARALIK       = 5\nARALIK_MS    = 5000\nOZET         = sensor-oku-1.0 / agecidi\nSERVIS (ham) = ${@bb.utils.contains('DISTRO_FEATURES', 'systemd', 'sensor-oku.service', 'sensor-oku.init', d)}\nNOTE: recipe sensor-oku-1.0: task do_bilgi: Succeeded\nNOTE: Tasks Summary: Attempted 1 tasks of which 0 didn't need to be rerun and all succeeded."
    },
    {
      "komut": "bitbake-getvar -r sensor-oku ETIKETLER",
      "aciklama": "bitbake-getvar değişkenin geçmişini gösterir: atama, :append ve anonim Python içindeki d.appendVar çağrısı ayrı ayrı kaydedilmiştir.",
      "cikti": "#\n# $ETIKETLER [3 operations]\n#   set /home/gelistirici/ornekler/bolum-08/bbmini/recipes/sensor-oku_1.0.bb:24\n#     \"temel\"\n#   :append /home/gelistirici/ornekler/bolum-08/bbmini/recipes/sensor-oku_1.0.bb:25\n#     \" append\"\n#   append sensor-oku_1.0.bb:34 [__anon_35__home_gelistirici_ornekler_bolum_08_bbmini_recipes_sensor_oku_1_0_bb]\n#     \" anonim\"\n# pre-expansion value:\n#   \"temel append anonim\"\nETIKETLER=\"temel append anonim\""
    },
    {
      "komut": "bitbake gunluk-ornek -c yazdir",
      "aciklama": "Konsolda yalnızca bb.plain iletisi görülür. print() ve bb.note() çıktıları varsayılan ayrıntı düzeyinde yalnızca görev günlüğüne yazılır.",
      "cikti": "...\nNOTE: recipe gunluk-ornek-1.0: task do_yazdir: Started\nbb.plain ile yazıldı\nNOTE: recipe gunluk-ornek-1.0: task do_yazdir: Succeeded\nNOTE: Tasks Summary: Attempted 1 tasks of which 0 didn't need to be rerun and all succeeded."
    },
    {
      "komut": "cat tmp/work/gunluk-ornek-1.0/temp/log.do_yazdir",
      "aciklama": "Görev günlüğü tüm çıktıları içerir. print() tamponlandığı için satırı, kendisinden sonra çalışan kabuk işlevinin DEBUG satırının arkasında görülür. bb.note argümanları boşluksuz birleştirir; % biçimlendirmesi yapmaz.",
      "cikti": "DEBUG: Executing python function do_yazdir\nNOTE: bb.note: gunluk-ornek\nbb.plain ile yazıldı\nDEBUG: Executing shell function kabuk_isi\nprint ile yazıldı\nkabuk işlevi: gunluk-ornek agecidi\nDEBUG: Shell function kabuk_isi finished\nDEBUG: Python function do_yazdir finished"
    },
    {
      "komut": "bitbake servis-denetle",
      "aciklama": "Kabuk görevi do_uret servis dosyasını üretir; Python görevi do_denetle dosyayı okur. bb.warn uyarı verir ve devam eder; bb.fatal görevi durdurur ve günlük dosyasının yolu bildirilir.",
      "cikti": "Loading cache...done.\nLoaded 4 entries from dependency cache.\nNOTE: Resolving any missing task queue dependencies\nInitialising tasks...done.\nNOTE: No setscene tasks\nNOTE: Executing Tasks\nNOTE: Running task 1 of 3 (/home/gelistirici/ornekler/bolum-08/bbmini/recipes/servis-denetle_1.0.bb:do_uret)\nNOTE: recipe servis-denetle-1.0: task do_uret: Started\nNOTE: recipe servis-denetle-1.0: task do_uret: Succeeded\nNOTE: Running task 2 of 3 (/home/gelistirici/ornekler/bolum-08/bbmini/recipes/servis-denetle_1.0.bb:do_denetle)\nNOTE: recipe servis-denetle-1.0: task do_denetle: Started\nWARNING: servis-denetle-1.0 do_denetle: sensor-oku.service: [Install] bölümü yok; servis açılışta etkinleştirilemez\nERROR: servis-denetle-1.0 do_denetle: sensor-oku.service: ExecStart= satırı bulunamadı\nERROR: Logfile of failure stored in: /home/gelistirici/ornekler/bolum-08/bbmini/tmp/work/servis-denetle-1.0/temp/log.do_denetle.15779\nNOTE: recipe servis-denetle-1.0: task do_denetle: Failed\nERROR: Task (/home/gelistirici/ornekler/bolum-08/bbmini/recipes/servis-denetle_1.0.bb:do_denetle) failed with exit code '1'\nNOTE: Tasks Summary: Attempted 2 tasks of which 0 didn't need to be rerun and 1 failed.\n\nSummary: 1 task failed:\n  /home/gelistirici/ornekler/bolum-08/bbmini/recipes/servis-denetle_1.0.bb:do_denetle\n    log: /home/gelistirici/ornekler/bolum-08/bbmini/tmp/work/servis-denetle-1.0/temp/log.do_denetle.15779\nSummary: There was 1 WARNING message.\nSummary: There was 1 ERROR message, returning a non-zero exit code.",
      "hata": true
    },
    {
      "komut": "sed -n '/^do_uret()/,/^}/p' tmp/work/servis-denetle-1.0/temp/run.do_uret",
      "aciklama": "run.do_uret, BitBake'in çalıştırdığı gerçek betiktir: ${B}, ${SERVIS_DOSYASI} ve ${EXEC_SATIRI} başvuruları görev başlamadan önce genişletilmiştir (EXEC_SATIRI boş olduğu için \"\" görülür).",
      "cikti": "do_uret() {\n    printf '[Unit]\\nDescription=Sensör okuma servisi\\n\\n[Service]\\n%s\\n' \"\" > /home/gelistirici/ornekler/bolum-08/bbmini/tmp/work/servis-denetle-1.0/build/sensor-oku.service\n}"
    },
    {
      "komut": "bitbake eski-panel",
      "aciklama": "Anonim Python'da yükseltilen bb.parse.SkipRecipe tarifi ayrıştırma aşamasında devre dışı bırakır; BitBake tarifin neden atlandığını bildirir.",
      "cikti": "Loading cache...done.\nLoaded 4 entries from dependency cache.\nERROR: Nothing PROVIDES 'eski-panel'\neski-panel was skipped: DISTRO_FEATURES içinde x11 yok\n\nSummary: There was 1 ERROR message, returning a non-zero exit code.",
      "hata": true
    }
  ]
};

window.TerminalOturumlari["veri-deposu"] = {
  "baslik": "BitBake veri deposunun doğrudan Python'dan kullanılması",
  "istem": "gelistirici@derleme:~/ornekler/bolum-08$",
  "adimlar": [
    {
      "komut": "BITBAKE=~/bitbake OE_CORE=~/openembedded-core python3 veri_deposu.py",
      "aciklama": "bb.data.init() ile oluşturulan veri deposu, tariflerdeki d nesnesiyle aynı sınıftandır. Tembel genişletme, ${@...} değerlendirmesi, override ve :append/:remove uygulanması, bayraklar, bb.utils ve oe.utils yardımcıları tek tek gözlenir.",
      "cikti": "getVar('BP')                      : 'sensor-oku-1.0'\ngetVar('BP', expand=False)        : '${PN}-${PV}'\ngetVar('TANIMSIZ')                : None\nPV değişince getVar('BP')         : 'sensor-oku-1.1'\nSABIT_BP (':=' benzeri)           : 'sensor-oku-1.1'\nSERVIS                            : 'sensor-oku.service'\nsystemd çıkarılınca SERVIS        : 'sensor-oku.init'\nBUYUK_AD                          : 'SENSOR_OKU'\nKONSOL (agecidi override)         : 'ttyAMA0'\nPAKETLER (:append, :remove)       : 'sensor-oku  nano'\nappendVar sonrası                 : 'sensor-oku  nano sensor-servis'\ngetVarFlag(doc)                   : 'Değişkenleri yazdırır'\ngetVarFlag(dirs)                  : '/tmp/work/sensor-oku-2.0/build'\ngetVarFlags                       : ['dirs', 'doc']\nexpand                            : 'sensor-oku -> ${bindir}/sensor-oku'\ncontains('systemd ipv6')          : 'evet'\ncontains('systemd x11')           : 'hayır'\ncontains_any('wayland x11')       : 'hayır'\nfilter('ipv6 wifi')               : 'ipv6'\nto_boolean('yes')                 : True\nkopyada / asılda PN               : ('baska-tarif', 'sensor-oku')\n${@None}                          : '-None-'\nExpansionError (Q)                : Failure expanding variable Q, expression was ${@d.getVar('TANIMSIZ').split()} which triggered exception AttributeError: 'NoneType' object has no attribute 'split'\nExpansionError (P)                : Failure expanding variable P, expression was ${P} ek which triggered exception Exception: variable P references itself!\noe.utils.conditional              : 'servis'\noe.utils.vartrue(DEBUG_BUILD)     : '-O0'\noe.utils.all_distro_features      : 'evet'\noe.utils.trim_version             : '6.0'"
    },
    {
      "komut": "python3 -c 'import sys; sys.path.insert(0, \"/home/gelistirici/bitbake/lib\"); import bb; print(bb.__version__)'",
      "aciklama": "bb paketi sıradan bir Python paketidir; sürümü bb.__version__ ile okunur.",
      "cikti": "2.18.0"
    }
  ]
};

