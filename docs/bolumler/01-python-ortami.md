# 1 · Python ortamı: yorumlayıcı, venv ve pip

<div class="kunye" markdown>
<span>Süre: ~45 dk + uygulama</span><span>Düzey: Başlangıç</span><span>Ön koşul: Temel komut satırı bilgisi</span>
</div>

!!! hedef "Öğrenme hedefleri"
    Bu bölümün sonunda:

    - CPython yorumlayıcısının bir kaynak dosyayı nasıl çalıştırdığını ve sürüm farklarının neden önemli olduğunu açıklayabilirsiniz.
    - Bir derleme makinesinde hangi `python3` yorumlayıcısının çalıştığını ve modüllerin nereden yüklendiğini belirleyebilirsiniz.
    - PEP 668 hatasının nedenini ve doğru çözüm yollarını açıklayabilirsiniz.
    - Sanal ortamın (venv) iç yapısını, etkinleştirmenin ne yaptığını ve ortamın neden taşınamadığını açıklayabilirsiniz.
    - pip ile paket kurabilir, sürüm sabitleyebilir ve `pyproject.toml` ile bir proje tanımlayabilirsiniz.
    - Derleme makinesindeki Python ile Yocto'nun hedef cihaz için derlediği Python arasındaki farkı ayırt edebilirsiniz.

## 1.1 Gömülü geliştirici neden Python öğrenir?

Gömülü Linux projelerinde hedef cihazda çalışan kodun önemli bir kısmı C ile yazılır; ancak bu kodu
üreten, sınayan ve cihaza ulaştıran araçların büyük bölümü Python ile yazılmıştır. Yocto Project'in
derleme motoru BitBake bir Python programıdır; tariflerdeki `python do_...()` görevleri, `${@...}`
ifadeleri ve OE-Core'un `meta/lib/oe` kütüphanesi Python kodudur. Seri porttan cihaz günlüğü toplayan
betikler, üretim hattındaki test düzenekleri, Modbus veya CAN üzerinden konuşan tanılama araçları ve
sürekli entegrasyon (CI) betikleri de çoğunlukla Python ile yazılır.

Bu kitap Python'u bu kullanım alanları üzerinden ele alır. Örneklerin tamamı kitaplığın ortak
senaryosuna, yani ekransız bir **endüstriyel sensör ağ geçidine** (`agecidi`) dayanır. Kitap boyunca
`sensor-araclari` adlı bir Python paketi geliştirilir: ölçüm dosyalarını özetleyen `sensor-rapor`
komutu, cihazla Modbus RTU benzeri bir protokolle konuşan `sensor-istemci` komutu ve bunların testleri.
Son bölümde aynı dil bilgisi BitBake metadata'sına uygulanır.

Kitaptaki örnekler deponun `examples/` dizinindedir. Terminal örneklerinde bu dizinin geliştirme
makinesinde `~/ornekler` adıyla bulunduğu varsayılır:

```bash
git clone https://github.com/mfguney/python-gomulu.git
cp -r python-gomulu/examples ~/ornekler
```

## 1.2 CPython: yorumlayıcı nasıl çalışır?

"Python" adı hem dili hem de dilin başvuru uygulamasını anlatır. Linux dağıtımlarında ve Yocto'da
bulunan uygulama C ile yazılmış **CPython**'dur. PyPy veya MicroPython gibi başka uygulamalar da vardır;
bu kitapta yalnızca CPython ele alınır.

CPython bir `.py` dosyasını doğrudan makine koduna çevirmez. Çalıştırma üç aşamada gerçekleşir:

1. **Ayrıştırma:** Kaynak metin sözdizimi ağacına (AST) dönüştürülür. Sözdizimi hataları bu aşamada,
   program çalışmaya başlamadan bildirilir.
2. **Derleme:** AST, yorumlayıcıya özgü **bayt koda** (bytecode) derlenir. İçe aktarılan (import edilen)
   modüllerin bayt kodu `__pycache__/modul.cpython-312.pyc` gibi dosyalara yazılır; kaynak değişmedikçe
   sonraki çalıştırmalarda yeniden derleme yapılmaz. Doğrudan çalıştırılan betiğin bayt kodu ise
   diske yazılmaz.
3. **Yürütme:** Bayt kod, yorumlayıcının sanal makinesinde komut komut yürütülür.

`.pyc` dosyalarının adı yorumlayıcı sürümünü içerir, çünkü bayt kod biçimi sürümler arasında değişir;
Yocto da imaja giren modüllerin `.pyc` dosyalarını hedefin Python sürümüne göre üretir. Sözdizimi
hatası dışındaki hatalar (yanlış tür, tanımsız ad) ise ancak ilgili satır çalıştırıldığında ortaya
çıkar; bu durum testleri C'ye göre daha da önemli kılar (bkz. [Bölüm 6](06-hata-test-kayit.md)).

Yorumlayıcı dört temel biçimde çalıştırılır:

| Biçim | Örnek | Not |
|---|---|---|
| Betik dosyası | `python3 ortam_bilgisi.py` | Dosyanın dizini `sys.path[0]` olur |
| Modül olarak | `python3 -m venv .venv` | Modül `sys.path` üzerinde aranır ve `__main__` olarak çalıştırılır |
| Komut dizgisi | `python3 -c 'import sys; print(sys.version)'` | Kısa denetimler; `sys.path[0]` geçerli dizindir |
| Etkileşimli (REPL) | `python3` veya `python3 -q` | Deneme ve keşif; her ifadenin sonucu yazdırılır |

`-I` (yalıtılmış kip) seçeneği betik dizinini ve kullanıcı dizinini `sys.path`'e eklemez, `PYTHON*`
ortam değişkenlerini yok sayar; root yetkisiyle çalışan betiklerde yerel bir dosyanın yanlışlıkla
içe aktarılmasını önler.

### Sürümler

CPython'un yeni bir ara sürümü (3.12, 3.13, 3.14) her yıl Ekim ayında yayımlanır ve her ara sürüm
yaklaşık beş yıl boyunca güncellenir. Ara sürümler arasında dil özellikleri eklenir, standart
kütüphaneden eski modüller kaldırılabilir ve C uzantılarının ikili arayüzü değişir. Bu nedenle
"Python 3" demek yetmez; bir aracın hangi ara sürümlerde çalıştığı açıkça belirtilmelidir. Bu kitabın
örnekleri Python 3.10 ve sonrasını hedefler (`match` deyimi 3.10 ile gelmiştir) ve 3.12 ile 3.13
üzerinde çalıştırılmıştır.

Bir gömülü projede aynı anda birden çok Python bulunur:

| Nerede | Sürüm | Kim yönetir |
|---|---|---|
| Geliştirme makinesi, Ubuntu 24.04 | 3.12 | Dağıtım (`apt`) |
| Geliştirme makinesi, Debian 12 | 3.11 | Dağıtım (`apt`) |
| BitBake 2.18 (Yocto 6.0) için derleme makinesi | en az 3.9 | BitBake yalnızca denetler |
| Yocto 6.0 ile üretilen hedef imaj (`python3` tarifi) | 3.14 | OE-Core tarifi |

Derleme makinesinde çalışan araçlar ile hedef cihazda çalışacak betikler farklı yorumlayıcılarla
çalışır. Hedefte çalışacak bir betik, geliştirme makinesindeki 3.12 ile sınanmış olsa bile hedefteki
sürümde ayrıca sınanmalıdır.

<div class="terminal" data-oturum="py-yorumlayicilar"></div>

Yukarıdaki oturumda makinede iki ayrı Python vardır: kaynaktan derlenip `/usr/local` altına kurulmuş
3.13 ve dağıtımın 3.12'si. `python3` komutu `PATH`'te ilk bulunanı çalıştırır. Bir betiğin hangi
yorumlayıcıyla çalıştığından emin olmak için `sys.executable` yazdırılmalı veya yorumlayıcı tam yoluyla
ya da sürüm numaralı adıyla (`python3.12`) çağrılmalıdır.

## 1.3 Modüller nereden yüklenir?

`import json` yazıldığında Python, `sys.path` listesindeki dizinleri sırayla dolaşır ve modülü bulduğu
ilk yerden yükler (ayrıntılı işleyiş [Bölüm 4](04-fonksiyon-modul.md)'te ele alınır). Liste açılışta
şu kaynaklardan oluşturulur:

1. Çalıştırılan betiğin dizini (`-c` ve REPL için geçerli dizin),
2. `PYTHONPATH` ortam değişkenindeki dizinler,
3. standart kütüphane (`/usr/lib/python3.12` ve C uzantıları için `lib-dynload`),
4. `site` modülünün eklediği **site-packages** dizinleri: kullanıcı dizini
   (`~/.local/lib/python3.12/site-packages`) ve sistem dizini. Debian ve Ubuntu'da `apt` ile kurulan
   modüller `/usr/lib/python3/dist-packages` dizinine gider.

Bu listenin iki önemli dayanağı vardır: `sys.prefix` site-packages dizininin kökünü, `sys.base_prefix`
ise standart kütüphanenin bulunduğu temel kurulumu gösterir. Normal bir kurulumda ikisi aynıdır;
sanal ortamda ise farklılaşırlar. Kitabın `examples/bolum-01/ortam_bilgisi.py` betiği bu değerleri
yazdırır; aynı betik bir sanal ortamın içinden çalıştırılarak fark gözlenir (bkz. 1.5).

## 1.4 PEP 668: "externally-managed-environment" hatası

Debian 12, Ubuntu 23.04 ve sonrası gibi güncel dağıtımlarda sistem Python'una `pip install` ile paket
kurmak aşağıdaki hatayla reddedilir:

```text
error: externally-managed-environment

× This environment is externally managed
```

**Neden:** Dağıtımın kendi araçları (paket yöneticisi yardımcıları, ağ yapılandırıcıları, sistem
betikleri) aynı Python'u ve aynı modülleri kullanır. `apt` ile kurulmuş `python3-serial` paketinin
üzerine pip ile farklı bir `pyserial` sürümü yazıldığında, iki paket yöneticisi aynı dosyalar üzerinde
birbirinden habersiz işlem yapar. Sonuç, bir dağıtım güncellemesinden sonra bozulan bir sistem olabilir.
PEP 668 bu durumu önlemek için bir işaret dosyası tanımlar: standart kütüphane dizininde
`EXTERNALLY-MANAGED` dosyası bulunuyorsa pip (23.0 ve sonrası) sistem geneline ve kullanıcı dizinine
kurulum yapmayı reddeder. Sanal ortamlarda bu işaret dikkate alınmaz, çünkü ortamın site-packages
dizini dağıtıma ait değildir.

Doğru çözüm, kurulumun amacına göre seçilir:

| Amaç | Yöntem |
|---|---|
| Bir proje için geliştirme ortamı | Projeye özgü sanal ortam: `python3 -m venv .venv` |
| Komut satırı aracı kurmak (ör. `bitbake-setup`) | Araca özgü sanal ortam veya `pipx install <araç>` |
| Dağıtımın paketlediği bir modül | `sudo apt install python3-serial` |
| Atılabilir kapsayıcı veya CI imajı | `pip install --break-system-packages ...` kabul edilebilir |

!!! dikkat "`--break-system-packages` bir çözüm değil, bir onaydır"
    Bu seçenek koruma mekanizmasını devre dışı bırakır; adı da sonucunu açıkça söyler. Geliştirici
    makinesinde kullanıldığında yukarıda açıklanan çakışma riski geri gelir. Yalnızca her derlemede
    sıfırdan oluşturulan bir kapsayıcı gibi, bozulduğunda yeniden üretilebilen ortamlarda kullanılmalıdır.
    `sudo pip install` ise hiçbir durumda kullanılmamalıdır: root olarak çalışan pip, dağıtımın
    dosyalarının üzerine yazabilir ve paketin kurulum betiklerini root yetkisiyle çalıştırır.

## 1.5 Sanal ortam (venv) nasıl çalışır?

Sanal ortam, temel bir Python kurulumunu paylaşan ancak **kendi site-packages dizinine** sahip olan bir
dizindir. Standart kütüphane ve yorumlayıcı ikili dosyası kopyalanmaz; yalnızca paketlerin kurulacağı
yer ayrılır. Böylece her projenin bağımlılıkları birbirinden ve sistemden yalıtılır.

`python3 -m venv .venv` komutunun oluşturduğu yapı:

```text
.venv/
├── pyvenv.cfg                 # home = /usr/bin, include-system-site-packages = false, version = 3.12.3
├── bin/
│   ├── python -> python3.12   # sembolik bağlantılar: python3.12 -> /usr/bin/python3.12
│   ├── pip, pip3, pip3.12     # bu ortama kurulum yapan pip
│   └── activate               # kabuk için etkinleştirme betiği (activate.fish, activate.csh da var)
├── include/
└── lib/python3.12/site-packages/   # yalnızca bu ortamın paketleri
```

Ortamı ayırt eden şey ikili dosya değil, `pyvenv.cfg` dosyasıdır. Yorumlayıcı açılırken çalıştırıldığı
yolun dizininde veya bir üst dizinde bu dosyayı arar. Bulduğunda `sys.prefix` değerini ortamın
dizinine, `sys.base_prefix` değerini `home` satırındaki temel kuruluma ayarlar. `site` modülü
site-packages dizinini `sys.prefix` altından ekler; `include-system-site-packages = false` olduğundan
dağıtımın paket dizini eklenmez. Aşağıdaki animasyon bu çözümleme zincirini adım adım gösterir:

<div class="akis" data-senaryo="venv-cozumleme"></div>

**Etkinleştirme** (`source .venv/bin/activate`) yalnızca kabuk ortamını değiştirir: `PATH`'in başına
`.venv/bin` eklenir, `VIRTUAL_ENV` değişkeni tanımlanır, istem değişir ve `deactivate` işlevi
tanımlanır. Python'un kendisi etkinleştirmeden haberdar değildir. Bu nedenle betiklerde, systemd
servislerinde ve CI adımlarında etkinleştirme yerine yorumlayıcı tam yoluyla çağrılabilir:

```bash
~/ornekler/sensor-araclari/.venv/bin/python -m pytest
~/ornekler/sensor-araclari/.venv/bin/sensor-rapor --version
```

<div class="terminal" data-oturum="venv-kurulum"></div>

`venv` modülünün sık kullanılan seçenekleri:

| Seçenek | Etkisi |
|---|---|
| `--system-site-packages` | Dağıtımın paketlerini de görünür kılar (ör. yalnızca `apt` ile kurulabilen bir modül gerekiyorsa) |
| `--clear` | Var olan ortam dizinini silip yeniden oluşturur |
| `--upgrade-deps` | Ortamdaki pip'i PyPI'deki en son sürüme yükseltir |
| `--without-pip` | pip içermeyen bir ortam oluşturur |
| `--prompt AD` | İstemde `.venv` yerine verilen adı gösterir |

!!! dikkat "Sanal ortam taşınamaz ve paylaşılmaz"
    `bin/` altındaki betiklerin shebang satırları ve `pyvenv.cfg` mutlak yollar içerir. Ortam dizini
    başka bir yere taşındığında veya kopyalandığında komutlar çalışmaz; temel Python'un ara sürümü
    değiştiğinde (3.12'den 3.13'e geçiş gibi) ortam kullanılamaz hale gelir. Ortam bir derleme çıktısı
    gibi ele alınmalıdır: sürüm kontrolüne eklenmez (`.gitignore` içine `.venv/` yazılır) ve
    `requirements.txt` veya `pyproject.toml` dosyasından yeniden oluşturulur.

## 1.6 pip nasıl çalışır?

pip, Python paketlerini bir **paket dizininden** (varsayılan olarak PyPI) bulan, indiren ve çalışan
yorumlayıcının site-packages dizinine kuran araçtır. Burada "paket" sözcüğü iki anlamda kullanılır:
`import serial` ile içe aktarılan **içe aktarma paketi** (bir dizin) ve PyPI'de `pyserial` adıyla
yayımlanan **dağıtım paketi**. Adların farklı olabilmesi yaygın bir karışıklık kaynağıdır:
`pip install pyserial` ile kurulan paket `import serial` ile kullanılır.

Bir dağıtım paketi iki biçimde yayımlanır:

- **Kaynak dağıtımı (sdist):** `.tar.gz` arşivi. Kurulmadan önce bir derleme arka ucu (setuptools,
  hatchling, flit vb.) ile derlenmesi gerekir; C uzantısı varsa derleyici ve başlık dosyaları gerekir.
- **Wheel:** `.whl` uzantılı, doğrudan açılarak kurulan hazır arşiv. Dosya adındaki etiketler
  uyumluluğu belirtir: `pyserial-3.5-py2.py3-none-any.whl` saf Python'dur ve her yerde çalışır;
  `...-cp312-cp312-manylinux_2_17_x86_64.whl` biçimindeki bir ad ise yalnızca CPython 3.12 ve x86-64
  Linux için derlenmiş bir paketi gösterir.

<div class="akis" data-senaryo="pip-kurulum"></div>

pip her zaman çalıştığı yorumlayıcıya kurulum yapar. `pip` komutunun hangi yorumlayıcıya ait olduğu
belirsiz olabileceğinden, özellikle betiklerde `python -m pip` biçimi tercih edilir: bu biçimde paket,
açıkça çağrılan yorumlayıcıya kurulur.

| Komut | İşlevi |
|---|---|
| `python -m pip install 'pyserial>=3.5'` | Kısıtı sağlayan en yeni sürümü kurar |
| `python -m pip install -r requirements.txt` | Dosyadaki tüm gereksinimleri kurar |
| `python -m pip install -e '.[test]'` | Geçerli dizindeki projeyi düzenlenebilir kipte, `test` ek bağımlılıklarıyla kurar |
| `python -m pip uninstall pyserial` | Kurulumu kaldırır (dist-info içindeki RECORD listesine göre) |
| `python -m pip list` / `show -f pyserial` | Kurulu paketleri / bir paketin ayrıntılarını ve dosyalarını gösterir |
| `python -m pip freeze` | Kurulu paketleri `ad==sürüm` biçiminde yazar |
| `python -m pip check` | Kurulu paketlerin bağımlılıklarının karşılanıp karşılanmadığını denetler |
| `python -m pip download -d dizin pyserial` | Kurmadan indirir (çevrimdışı kurulum için) |

Sürüm kısıtları PEP 440'a göre yazılır: `==3.5` tam sürüm, `>=3.5` alt sınır, `~=3.5` "3.5 ve sonraki
3.x sürümleri", `!=3.4` dışlama. Kısıtlar virgülle birleştirilebilir: `pytest>=8,<10`.

!!! iyi "Ortamın dışına kurulumu engellemek"
    `PIP_REQUIRE_VIRTUALENV=1` ortam değişkeni veya `--require-virtualenv` seçeneği, etkin bir sanal
    ortam yokken pip'in kurulum yapmasını engeller. Bu değişken geliştirici makinesinin kabuk
    yapılandırmasına eklendiğinde yanlışlıkla sistem Python'una kurulum yapılması önlenir.

## 1.7 `requirements.txt` ve `pyproject.toml`

Bir projenin bağımlılıkları iki farklı amaçla yazılır ve bu iki amaç farklı dosyalara karşılık gelir:

- **Soyut bağımlılıklar** (`pyproject.toml`): Paketin çalışması için *hangi* paketlerin *hangi sürüm
  aralığında* gerektiği. Örnek: `pyserial>=3.5`. Paket başka projelerde de kullanılabileceği için
  aralık geniş tutulur.
- **Somut sabitleme** (`requirements.txt`): Belirli bir ortamın *tam olarak* hangi sürümlerden
  oluştuğu; dolaylı bağımlılıklar dahil. Örnek: `pyserial==3.5`, `pluggy==1.7.0`. CI'da ve üretim
  test düzeneklerinde ortamın her seferinde aynı kurulması için kullanılır.

`pyproject.toml`, PEP 517/518 ile tanımlanan ve PEP 621 ile proje meta verisini de taşıyan standart
proje dosyasıdır. Kitabın paketinin tanımı:

```toml title="examples/sensor-araclari/pyproject.toml (kısaltılmış)"
[build-system]                                   # (1)!
requires = ["setuptools>=77"]
build-backend = "setuptools.build_meta"

[project]                                        # (2)!
name = "sensor-araclari"
version = "0.3.0"
requires-python = ">=3.10"
license = "MIT"
dependencies = [
    "pyserial>=3.5",
]

[project.optional-dependencies]                  # (3)!
test = ["pytest>=8"]

[project.scripts]                                # (4)!
sensor-rapor = "sensor_araclari.cli:main"
sensor-istemci = "sensor_araclari.istemci:main"

[tool.setuptools.packages.find]                  # (5)!
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

1.  **Derleme arka ucu.** pip, paketi derlemek için yalıtılmış geçici bir ortam oluşturur, `requires`
    listesini oraya kurar ve `build-backend` ile belirtilen nesneyi çağırır (yalıtılmış derleme).
    `license = "MIT"` biçimindeki SPDX ifadesi setuptools 77 ile desteklendiğinden alt sınır budur.
2.  **Proje meta verisi.** `requires-python`, uyumsuz bir yorumlayıcıya kurulumu pip düzeyinde engeller.
3.  **İsteğe bağlı bağımlılıklar.** `pip install -e '.[test]'` ile kurulur; üretim kurulumuna pytest girmez.
4.  **Komut giriş noktaları.** Kurulumda `bin/` altına `sensor-rapor` adlı bir başlatıcı yazılır; başlatıcı
    `sensor_araclari.cli` modülündeki `main()` fonksiyonunu çağırır ve dönüş değerini çıkış kodu yapar.
5.  **src düzeni.** Paket kodu `src/` altında tutulur. Böylece testler, depo kökündeki dosyalar yerine
    kurulmuş paketi kullanmak zorunda kalır; eksik bildirilmiş bir dosya gibi kurulum hataları
    geliştiricinin makinesinde de görülür.

**Düzenlenebilir kurulum** (`-e`, PEP 660) paketi kopyalamaz; site-packages dizinine kaynak dizinini
gösteren bir `.pth` dosyası (`__editable__.sensor_araclari-0.3.0.pth`) yazar. `site` modülü açılışta
bu dosyadaki yolu `sys.path`'e ekler. Kaynakta yapılan değişiklik yeniden kurulum gerektirmez;
yalnızca `pyproject.toml` değiştiğinde (yeni bağımlılık veya yeni komut) kurulum yinelenir.

`pip freeze` ile üretilen sabitleme dosyası ve bu dosyadan aynı ortamın kurulması:

```bash
python -m pip freeze --exclude-editable > requirements.txt          # geliştirme makinesinde
python3 -m venv .venv && .venv/bin/python -m pip install -r requirements.txt -e .   # CI'da
```

Kitabın deposunda bu yolla üretilmiş dosya `examples/bolum-01/requirements.txt` olarak bulunur.

!!! sss "`requirements.txt` hâlâ gerekli mi?"
    `pyproject.toml` paketin ne istediğini, `requirements.txt` ise bir ortamın neyle sınandığını kaydeder.
    Kütüphane olarak dağıtılan paketlerde yalnızca `pyproject.toml` yeterlidir. Bir test düzeneği,
    üretim hattı aracı veya CI ortamı gibi aynı kalması gereken ortamlarda tam sürümleri içeren bir
    sabitleme dosyası tutulmalıdır. Bu dosyayı otomatik güncelleyen `pip-tools` (`pip-compile`) gibi
    araçlar da kullanılabilir.

## 1.8 Yocto'da Python ortamı

Yocto'da iki ayrı Python dünyası vardır ve birbirine karıştırılmamalıdır:

- **Derleme makinesinin Python'u:** BitBake ve `bitbake-setup` bu yorumlayıcıyla çalışır. Yocto kitabında
  `bitbake-setup` aracının ayrı bir sanal ortama kurulması önerilir
  (<a href="../../yocto-gomulu-linux/bolumler/03-ilk-derleme.html">Yocto kitabı, Bölüm 3</a>); bu öneri,
  bu bölümde anlatılan PEP 668 ve venv ilkelerinin doğrudan uygulamasıdır.
- **Hedef cihazın Python'u:** OE-Core'daki `python3` tarifiyle çapraz derlenir ve imaja paketler halinde
  girer. Standart kütüphane de parçalara bölünür: `python3-core`, `python3-json`, `python3-logging`,
  `python3-io` gibi. Hedefte pip ile paket kurulmaz; her Python modülü bir tarifle paketlenir. PyPI'deki
  bir proje için tarif `inherit pypi python_setuptools_build_meta` gibi sınıflarla yazılır: `pypi`
  sınıfı kaynak adresini üretir, `python_setuptools_build_meta` ise `pyproject.toml`'daki derleme arka
  ucunu çağırarak bir wheel üretir ve bunu imajın site-packages dizinine kurar.

Bu ayrımın pratik sonucu şudur: `sensor-araclari` paketinin `pyproject.toml` dosyası geliştirme
makinesinde `pip install -e .` ile, Yocto'da ise bir tarif aracılığıyla kullanılır. Tarif,
`dependencies` listesindeki paketleri ve kullanılan standart kütüphane parçalarını `RDEPENDS:${PN}`
ile ayrıca bildirmelidir; Yocto `pyproject.toml`'daki bağımlılıkları imaja kendiliğinden eklemez
(<a href="../../yocto-gomulu-linux/bolumler/06-tarifler.html">Yocto kitabı, Bölüm 6</a>):

```bitbake title="sensor-araclari_0.3.0.bb (taslak; bu ortamda derlenmemiştir)"
SUMMARY = "Sensör ağ geçidi için Python araçları"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "git://github.com/mfguney/python-gomulu.git;protocol=https;branch=main"
SRCREV = "<sabit commit>"
S = "${UNPACKDIR}/${BP}/examples/sensor-araclari"

inherit python_setuptools_build_meta

# python3-pyserial tarifi meta-openembedded deposunun meta-python katmanındadır
RDEPENDS:${PN} += "python3-core python3-json python3-logging python3-io python3-pyserial"
```

!!! lab "Uygulama 1.1 · Geliştirme ortamının kurulması"
    1. Sistem Python'unun sürümünü ve PEP 668 işaretini denetleyin:

        ```bash
        python3 --version
        ls /usr/lib/python3*/EXTERNALLY-MANAGED
        ```

    2. Kitabın paketi için sanal ortam oluşturun ve paketi test bağımlılıklarıyla kurun:

        ```bash
        cd ~/ornekler/sensor-araclari
        python3 -m venv .venv
        source .venv/bin/activate
        python -m pip install -e '.[test]'
        ```

    3. Ortamın etkin olduğunu doğrulayın: `python ../bolum-01/ortam_bilgisi.py` çıktısında
       `sanal ortam  : evet` satırı ve `sys.path` listesinde ortamın `site-packages` dizini ile
       paketin `src` dizini görülmelidir.

    4. Komutların çalıştığını doğrulayın:

        ```bash
        sensor-rapor --version          # sensor-rapor 0.3.0
        python -m pytest -q             # 29 passed
        ```

    5. `deactivate` ile ortamdan çıkın ve `sensor-rapor --version` komutunun artık bulunamadığını,
       `.venv/bin/sensor-rapor --version` komutunun ise çalıştığını gözlemleyin.

## Özet

- CPython kaynak kodu önce bayt koda derler, sonra sanal makinede yürütür; `.pyc` dosyaları sürüme özgüdür.
- Bir makinede birden çok Python bulunabilir; çalışan yorumlayıcı `sys.executable` ile doğrulanır.
- `sys.path` modüllerin aranacağı dizinlerin sıralı listesidir; `sys.prefix` site-packages kökünü belirler.
- PEP 668 işareti, dağıtımın Python'una pip ile kurulumu engeller; çözüm sanal ortam, `pipx` veya `apt`'tir.
- Sanal ortam kendi site-packages dizinine sahip, `pyvenv.cfg` ile tanımlanan bir dizindir; etkinleştirme yalnızca `PATH`'i değiştirir.
- Sanal ortamlar taşınamaz; `requirements.txt` veya `pyproject.toml` dosyasından yeniden oluşturulur.
- `pyproject.toml` soyut bağımlılıkları, `requirements.txt` ise sınanmış ortamın tam sürümlerini tutar.
- Yocto'da hedef Python paketleri pip ile değil tariflerle kurulur; çalışma bağımlılıkları `RDEPENDS` ile bildirilir.

## Değerlendirme soruları

<div class="quiz" data-id="b01-1">
<p class="quiz-soru">Bir sanal ortam etkinleştirildiğinde <code>python</code> komutunun ortamın yorumlayıcısına çözülmesini sağlayan nedir?</p>
<ul>
<li>Yorumlayıcının <code>VIRTUAL_ENV</code> değişkenini okuyarak kendini yeniden başlatması</li>
<li data-dogru><code>activate</code> betiğinin <code>PATH</code> değişkeninin başına <code>.venv/bin</code> eklemesi</li>
<li><code>/usr/bin/python3</code> bağlantısının geçici olarak ortama yönlendirilmesi</li>
<li>pip'in ortam içine yorumlayıcının bir kopyasını derlemesi</li>
</ul>
<p class="quiz-aciklama">Etkinleştirme yalnızca kabuk ortamını değiştirir. Kabuk komutu PATH'te aradığı için ilk eşleşme
<code>.venv/bin/python</code> olur. Ortamın yorumlayıcısı temel yorumlayıcıya sembolik bağlantıdır; ortamı ayıran <code>pyvenv.cfg</code> dosyasıdır.</p>
</div>

<div class="quiz" data-id="b01-2">
<p class="quiz-soru">Ubuntu 24.04'te <code>pip install pyserial</code> komutu <code>externally-managed-environment</code> hatası veriyor. Bir geliştirme makinesinde en uygun çözüm hangisidir?</p>
<ul>
<li><code>sudo pip install pyserial</code></li>
<li><code>pip install --break-system-packages pyserial</code></li>
<li data-dogru>Projeye özgü bir sanal ortam oluşturup pyserial'ı orada kurmak</li>
<li><code>EXTERNALLY-MANAGED</code> dosyasını silmek</li>
</ul>
<p class="quiz-aciklama">PEP 668 işareti, dağıtımın yönettiği Python'un pip tarafından değiştirilmesini önler. Koruma devre dışı
bırakıldığında apt ile pip aynı dosyalar üzerinde çakışabilir. Sanal ortam bu riski tamamen ortadan kaldırır.</p>
</div>

<div class="quiz" data-id="b01-3">
<p class="quiz-soru">Sanal ortamda <code>sys.prefix</code> ve <code>sys.base_prefix</code> değerleri için hangisi doğrudur?</p>
<ul>
<li>İkisi de her zaman <code>/usr</code> değerini taşır</li>
<li data-dogru><code>sys.prefix</code> ortamın dizinini, <code>sys.base_prefix</code> temel Python kurulumunu gösterir</li>
<li><code>sys.base_prefix</code> ortamın, <code>sys.prefix</code> temel kurulumun dizinidir</li>
<li>Sanal ortamda bu değişkenler tanımlı değildir</li>
</ul>
<p class="quiz-aciklama">Standart kütüphane <code>sys.base_prefix</code> altından, site-packages ise <code>sys.prefix</code> altından yüklenir.
İkisinin farklı olması kodun sanal ortamda çalıştığını gösterir.</p>
</div>

<div class="quiz" data-id="b01-4">
<p class="quiz-soru">Bir sanal ortam dizini <code>~/proje/.venv</code> konumundan <code>~/yeni/.venv</code> konumuna taşınıyor. Ne olur?</p>
<ul>
<li>Ortam sorunsuz çalışmaya devam eder; yollar görelidir</li>
<li>Yalnızca pip çalışmaz, diğer her şey çalışır</li>
<li data-dogru><code>bin/</code> altındaki komutların shebang satırları ve <code>pyvenv.cfg</code> eski mutlak yolları gösterdiği için ortam güvenilir biçimde çalışmaz; yeniden oluşturulmalıdır</li>
<li>Python ortamı ilk çalıştırmada kendiliğinden onarır</li>
</ul>
<p class="quiz-aciklama">Sanal ortamlar taşınabilir değildir. Ortam bir derleme çıktısı gibi ele alınmalı ve sabitleme
dosyasından yeniden oluşturulmalıdır.</p>
</div>

<div class="quiz" data-id="b01-5">
<p class="quiz-soru"><code>pyproject.toml</code> içindeki <code>dependencies = ["pyserial>=3.5"]</code> satırı ile <code>requirements.txt</code> içindeki <code>pyserial==3.5</code> satırı arasındaki fark nedir?</p>
<ul>
<li>Fark yoktur; ikisi de aynı işi görür</li>
<li data-dogru>İlki paketin kabul ettiği sürüm aralığını, ikincisi belirli bir ortamın sınanmış tam sürümünü belirtir</li>
<li>İlki yalnızca Yocto'da, ikincisi yalnızca pip'te kullanılır</li>
<li><code>requirements.txt</code> dolaylı bağımlılıkları içeremez</li>
</ul>
<p class="quiz-aciklama">Soyut bağımlılık paketin ihtiyacını, somut sabitleme ortamın tam durumunu kaydeder. <code>pip freeze</code> çıktısı
dolaylı bağımlılıkları da içerir.</p>
</div>

!!! alistirma "Alıştırma: İkinci yorumlayıcıyla yeniden üretilebilir ortam"
    Kitabın paketi Python 3.12 ile sınanmıştır. Aynı ortamın başka bir Python ara sürümüyle (makinede
    varsa `python3.13`) kurulup kurulamayacağı denetlenecektir.

    1. `~/ornekler/sensor-araclari` dizininde `.venv313` adlı ikinci bir ortam oluşturun.
    2. `examples/bolum-01/requirements.txt` dosyasını kullanarak bağımlılıkları kurun, ardından paketi
       bağımlılıklarını yeniden çözmeden düzenlenebilir kipte ekleyin.
    3. Testleri bu ortamda çalıştırın ve iki ortamın `pip freeze` çıktılarını karşılaştırın.
    4. Ortamın hangi yorumlayıcıyı kullandığını `pyvenv.cfg` dosyasından doğrulayın.

    ??? success "Örnek çözüm"
        ```bash
        cd ~/ornekler/sensor-araclari
        python3.13 -m venv .venv313
        .venv313/bin/python -m pip install -r ../bolum-01/requirements.txt
        .venv313/bin/python -m pip install --no-deps -e .
        .venv313/bin/python -m pytest -q
        diff <(.venv/bin/python -m pip freeze --exclude-editable) \
             <(.venv313/bin/python -m pip freeze --exclude-editable)
        grep -E '^(home|version)' .venv313/pyvenv.cfg
        ```
        `--no-deps`, bağımlılıkların sabitleme dosyasından zaten kurulduğunu ve pip'in başka sürüm
        çekmemesi gerektiğini belirtir. Paketlerin hepsi saf Python olduğundan `diff` çıktısı boştur;
        C uzantısı içeren bir paket olsaydı ikinci ortama farklı etiketli bir wheel kurulurdu, ancak
        sürüm numarası aynı kalırdı. Her komut ortamın yorumlayıcısıyla doğrudan çağrıldığından iki ortam
        aynı kabukta, etkinleştirme yapılmadan karıştırılmadan kullanılabilir. Ortamın adı `.gitignore`
        dosyasına `.venv*/` biçiminde eklenmelidir.

**Sonraki bölüm:** [2 · Dil temelleri: türler, ifadeler, akış denetimi →](02-dil-temelleri.md)
