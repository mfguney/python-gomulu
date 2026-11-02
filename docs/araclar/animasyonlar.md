# Animasyonlu şemalar

Bu sayfa, kitaptaki tüm animasyonlu şemaları ve terminal canlandırmalarını bölüm sırasıyla bir araya
getirir. Animasyonlarda ▶ Oynat ile otomatik, ▶| ile adım adım ilerlenir; adım adlarına tıklanarak
doğrudan bir adıma geçilebilir. Terminal canlandırmalarındaki çıktılar örnekler gerçekten
çalıştırılarak alınmıştır.

## Bölüm 1 · Python ortamı

### Derleme makinesindeki yorumlayıcılar ve PEP 668

[Bölüm 1.2](../bolumler/01-python-ortami.md#12-cpython-yorumlayc-nasl-calsr)

<div class="terminal" data-oturum="py-yorumlayicilar"></div>

### Sanal ortamda `python` komutunun çözümlenmesi

[Bölüm 1.5](../bolumler/01-python-ortami.md#15-sanal-ortam-venv-nasl-calsr)

<div class="akis" data-senaryo="venv-cozumleme"></div>

### Sanal ortamın oluşturulması ve paketin kurulması

[Bölüm 1.5](../bolumler/01-python-ortami.md#15-sanal-ortam-venv-nasl-calsr)

<div class="terminal" data-oturum="venv-kurulum"></div>

### `pip install`: paket dizininden site-packages dizinine

[Bölüm 1.6](../bolumler/01-python-ortami.md#16-pip-nasl-calsr)

<div class="akis" data-senaryo="pip-kurulum"></div>

## Bölüm 2 · Dil temelleri

### Ad bağlama, takma ad ve yeniden bağlama

[Bölüm 2.2](../bolumler/02-dil-temelleri.md#22-adlar-nesneler-ve-kimlik)

<div class="akis" data-senaryo="ad-baglama"></div>

### REPL'de adlar, nesneler ve türler

[Bölüm 2.2](../bolumler/02-dil-temelleri.md#22-adlar-nesneler-ve-kimlik)

<div class="terminal" data-oturum="repl-nesneler"></div>

### Sayılar, metin ve `match` deyimi

[Bölüm 2.8](../bolumler/02-dil-temelleri.md#28-match-deyimi)

<div class="terminal" data-oturum="temeller-betik"></div>

## Bölüm 3 · Veri yapıları

### Sığ ve derin kopyalama

[Bölüm 3.8](../bolumler/03-veri-yapilari.md#38-sg-ve-derin-kopyalama)

<div class="akis" data-senaryo="sig-derin-kopya"></div>

### Veri yapılarıyla günlük özeti ve karmaşıklık ölçümü

[Bölüm 3.9](../bolumler/03-veri-yapilari.md#39-collections-modulu)

<div class="terminal" data-oturum="veri-yapilari"></div>

## Bölüm 4 · Fonksiyonlar, modüller, paketler ve sınıflar

### Dekoratörün fonksiyonu sarması

[Bölüm 4.4](../bolumler/04-fonksiyon-modul.md#44-dekoratorler)

<div class="akis" data-senaryo="dekorator-sarma"></div>

### `import serial`: `sys.path` üzerinde arama ve `sys.modules` önbelleği

[Bölüm 4.5](../bolumler/04-fonksiyon-modul.md#45-moduller-ve-import-sistemi)

<div class="akis" data-senaryo="import-cozumleme"></div>

### import sistemi, kapsam ve sınıflar

[Bölüm 4.5](../bolumler/04-fonksiyon-modul.md#45-moduller-ve-import-sistemi)

<div class="terminal" data-oturum="import-sistemi"></div>

## Bölüm 5 · Dosyalar, süreçler ve komut satırı araçları

### Kabuksuz boru hattı: `subprocess.Popen`

[Bölüm 5.4](../bolumler/05-sistem-programlama.md#54-ds-komutlarn-calstrlmas-subprocess)

<div class="akis" data-senaryo="subprocess-boru"></div>

### subprocess ve pathlib örnekleri

[Bölüm 5.4](../bolumler/05-sistem-programlama.md#54-ds-komutlarn-calstrlmas-subprocess)

<div class="terminal" data-oturum="surec-dosya"></div>

### `sensor-rapor`: argparse, yapılandırma ve çıkış kodları

[Bölüm 5.5](../bolumler/05-sistem-programlama.md#55-komut-satr-arac-argparse)

<div class="terminal" data-oturum="sensor-rapor"></div>

## Bölüm 6 · Hata yönetimi, test ve günlük kaydı

### İstisnanın çağrı yığınında yayılması

[Bölüm 6.3](../bolumler/06-hata-test-kayit.md#63-yaylma-ve-traceback)

<div class="akis" data-senaryo="istisna-yayilim"></div>

### İstisna zinciri ve logging çıktıları

[Bölüm 6.3](../bolumler/06-hata-test-kayit.md#63-yaylma-ve-traceback)

<div class="terminal" data-oturum="istisna-kayit"></div>

### pytest: toplama, fixture, test, rapor

[Bölüm 6.7](../bolumler/06-hata-test-kayit.md#67-pytest-ile-test)

<div class="akis" data-senaryo="pytest-akis"></div>

### pytest ile testlerin çalıştırılması

[Bölüm 6.7](../bolumler/06-hata-test-kayit.md#67-pytest-ile-test)

<div class="terminal" data-oturum="pytest-oturum"></div>

## Bölüm 7 · Donanımla iletişim

### `struct.pack` ve bayt sırası

[Bölüm 7.2](../bolumler/07-donanim-iletisim.md#72-struct-alanlardan-baytlara)

<div class="akis" data-senaryo="struct-paketleme"></div>

### struct, bayt sırası ve pyserial `loop://`

[Bölüm 7.2](../bolumler/07-donanim-iletisim.md#72-struct-alanlardan-baytlara)

<div class="terminal" data-oturum="bayt-seri"></div>

### Bir Modbus RTU isteği ve yanıtı

[Bölüm 7.5](../bolumler/07-donanim-iletisim.md#75-pyserial-ile-seri-port)

<div class="akis" data-senaryo="seri-cerceve"></div>

### Sanal seri port ve TCP üzerinden cihaz sorgusu

[Bölüm 7.5](../bolumler/07-donanim-iletisim.md#75-pyserial-ile-seri-port)

<div class="terminal" data-oturum="sanal-cihaz"></div>

## Bölüm 8 · BitBake ve Yocto'da Python

### BitBake veri deposunun doğrudan Python'dan kullanılması

[Bölüm 8.2](../bolumler/08-bitbake-python.md#82-veri-deposu-ve-d-nesnesi)

<div class="terminal" data-oturum="veri-deposu"></div>

### `d.getVar('SERVIS')`: genişletme akışı

[Bölüm 8.3](../bolumler/08-bitbake-python.md#83-genisletme-ve-satr-ici-python)

<div class="akis" data-senaryo="getvar-genisletme"></div>

### BitBake ile Python görevleri ve satır içi Python

[Bölüm 8.5](../bolumler/08-bitbake-python.md#85-python-gorevleri)

<div class="terminal" data-oturum="bitbake-python"></div>

### Python kodunun ayrıştırma ve görev aşamalarında çalışması

[Bölüm 8.6](../bolumler/08-bitbake-python.md#86-anonim-python-islevleri)

<div class="akis" data-senaryo="bitbake-zamanlama"></div>
