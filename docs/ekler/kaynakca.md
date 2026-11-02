# Kaynakça ve ileri okuma

## Resmî Python belgeleri

- **Python belgeleri** (dil başvurusu, standart kütüphane, nasıl yapılır kılavuzları): <https://docs.python.org/3/>
- **Python öğreticisi** (The Python Tutorial): <https://docs.python.org/3/tutorial/>
- **İçe aktarma sistemi** (The import system): <https://docs.python.org/3/reference/import.html>
- **venv: sanal ortamlar**: <https://docs.python.org/3/library/venv.html>
- **Logging HOWTO**: <https://docs.python.org/3/howto/logging.html>
- **struct modülü**: <https://docs.python.org/3/library/struct.html>
- **subprocess modülü**: <https://docs.python.org/3/library/subprocess.html>
- **argparse öğreticisi**: <https://docs.python.org/3/howto/argparse.html>
- **unittest.mock**: <https://docs.python.org/3/library/unittest.mock.html>

## PEP belgeleri (Python Enhancement Proposals)

| PEP | Konu | Bölüm |
|---|---|---|
| [PEP 8](https://peps.python.org/pep-0008/) | Python kod stili | Tümü |
| [PEP 405](https://peps.python.org/pep-0405/) | Sanal ortamlar (venv) | 1 |
| [PEP 440](https://peps.python.org/pep-0440/) | Sürüm numaraları ve kısıtları | 1 |
| [PEP 517](https://peps.python.org/pep-0517/) / [PEP 518](https://peps.python.org/pep-0518/) | Derleme arka ucu arayüzü, `pyproject.toml` | 1, 8 |
| [PEP 621](https://peps.python.org/pep-0621/) | `pyproject.toml` içinde proje meta verisi | 1 |
| [PEP 660](https://peps.python.org/pep-0660/) | Düzenlenebilir kurulum | 1 |
| [PEP 668](https://peps.python.org/pep-0668/) | Dış yönetimli Python ortamları | 1 |
| [PEP 701](https://peps.python.org/pep-0701/) | f-string söz diziminin resmîleştirilmesi (3.12) | 2 |
| [PEP 634](https://peps.python.org/pep-0634/) / [PEP 636](https://peps.python.org/pep-0636/) | Yapısal kalıp eşleme: belirtim ve öğretici | 2 |
| [PEP 420](https://peps.python.org/pep-0420/) | Ad alanı paketleri | 4 |
| [PEP 484](https://peps.python.org/pep-0484/) | Tip ipuçları | 4 |
| [PEP 557](https://peps.python.org/pep-0557/) | dataclass | 4 |
| [PEP 3151](https://peps.python.org/pep-3151/) | OSError hiyerarşisinin yeniden düzenlenmesi | 6 |
| [PEP 654](https://peps.python.org/pep-0654/) | ExceptionGroup ve `except*` | 6 |
| [PEP 686](https://peps.python.org/pep-0686/) | UTF-8 kipinin varsayılan yapılması | 5 |

## Paketleme, test ve araçlar

- **Python Packaging User Guide**: <https://packaging.python.org/>
- **pip belgeleri**: <https://pip.pypa.io/>
- **pytest belgeleri**: <https://docs.pytest.org/>
- **mypy belgeleri**: <https://mypy.readthedocs.io/>
- **pyserial belgeleri**: <https://pyserial.readthedocs.io/>

## Yocto Project ve BitBake

- **BitBake User Manual** (özellikle "Syntax and Operators" ve "Functions You Can Call From Within Python"): <https://docs.yoctoproject.org/bitbake/>
- **Yocto Project Reference Manual** (sınıflar ve değişkenler sözlüğü): <https://docs.yoctoproject.org/ref-manual/>
- **Yocto Project Development Tasks Manual**: <https://docs.yoctoproject.org/dev-manual/>
- **BitBake kaynak deposu**: <https://git.openembedded.org/bitbake>
- **OpenEmbedded-Core kaynak deposu** (`meta/lib/oe`, `meta/classes-recipe`): <https://git.openembedded.org/openembedded-core>
- Kitaplığın Yocto kitabı: <a href="../../yocto-gomulu-linux/index.html">Yocto Project ile Gömülü Linux</a>, özellikle
  <a href="../../yocto-gomulu-linux/bolumler/05-bitbake-dili.html">Bölüm 5 (BitBake dili)</a> ve
  <a href="../../yocto-gomulu-linux/bolumler/08-siniflar.html">Bölüm 8 (Sınıflar)</a>

## Protokoller

- **Modbus belirtimleri** (MODBUS Application Protocol Specification; MODBUS over Serial Line Specification and Implementation Guide): <https://modbus.org/specs.php>
- **CRC kataloğu** (Catalogue of parametrised CRC algorithms; CRC-16/MODBUS ve check değerleri): <https://reveng.sourceforge.io/crc-catalogue/>

## Kitaplar

- Luciano Ramalho, *Fluent Python*, 2. baskı, O'Reilly, 2022. Python'un veri modeli, kapanışlar, dekoratörler ve yineleyiciler üzerine derinlemesine başvuru.
- David Beazley, Brian K. Jones, *Python Cookbook*, 3. baskı, O'Reilly, 2013. Dosya, süreç ve ikili veri işlemleri için tarif biçiminde örnekler.
- Brett Slatkin, *Effective Python*, 2. baskı, Addison-Wesley, 2019. İyi uygulamaların maddeler halinde gerekçeli anlatımı.
- Brian Okken, *Python Testing with pytest*, 2. baskı, Pragmatic Bookshelf, 2022. pytest, fixture ve eklentiler.

## Eğitim materyalleri

- **Bootlin Yocto Project ve OpenEmbedded eğitim materyalleri** (açık lisanslı slaytlar ve uygulamalar): <https://bootlin.com/training/yocto/>
- **Python öğreticisi** (resmî, ücretsiz): <https://docs.python.org/3/tutorial/>
