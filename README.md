# Gömülü Geliştirici için Python

**Python dilini otomasyon, test, donanım iletişimi ve BitBake metadata'sı bağlamında anlatan açık kaynak, Türkçe öğretim kitabı.**

Kitap, gömülü Linux geliştiricisinin günlük işlerinde karşılaştığı Python kullanımını temelden ele
alır: yorumlayıcı ve sanal ortamlar, dilin nesne modeli, veri yapıları, modüller ve sınıflar, dosya ve
süreç işlemleri, hata yönetimi ve test, ikili protokoller, seri port ve soketler, son olarak BitBake ve
Yocto metadata'sındaki Python. Her bölüm kavramsal anlatım, gerçekten çalıştırılmış terminal
örnekleri, animasyonlu şemalar, uygulama çalışmaları, özet, etkileşimli değerlendirme soruları ve bir
alıştırmadan oluşur. Örnekler, kitaplığın ortak senaryosu olan ekransız bir **endüstriyel sensör ağ
geçidi** üzerinden ilerler.

- **Çevrimiçi sürüm:** https://mfguney.github.io/python-gomulu/
- **Kapsam:** Python 3.10+ (çıktılar Python 3.12 ve 3.13 ile alınmıştır); BitBake 2.18 / Yocto Project 6.0 *Wrynose*
- **Etkileşimli öğeler:** 13 animasyonlu şema, 14 terminal canlandırması, 43 değerlendirme sorusu
- **Gömülü Linux Kitaplığı'nın bir parçasıdır:** [Yocto Project ile Gömülü Linux](https://mfguney.github.io/yocto-gomulu-linux/) kitabını tamamlar.

## Bölümler

| Bölüm | Konu |
|---|---|
| 1 | Python ortamı: yorumlayıcı, venv ve pip |
| 2 | Dil temelleri: türler, ifadeler, akış denetimi |
| 3 | Veri yapıları: liste, sözlük, küme, demet |
| 4 | Fonksiyonlar, modüller, paketler ve sınıflar |
| 5 | Dosyalar, süreçler ve komut satırı araçları |
| 6 | Hata yönetimi, test ve günlük kaydı |
| 7 | Donanımla iletişim: ikili veri, seri port, soketler |
| 8 | BitBake ve Yocto'da Python |

## Örnekler

- [`examples/sensor-araclari`](examples/sensor-araclari): kitap boyunca geliştirilen Python paketi
  (`sensor-rapor` ve `sensor-istemci` komutları, Modbus RTU benzeri protokol, cihaz benzeticisi, 29 pytest testi)
- [`examples/bolum-01` … `bolum-07`](examples): bölümlerde kullanılan bağımsız betikler
- [`examples/bolum-08/bbmini`](examples/bolum-08/bbmini): OE-Core gerektirmeyen küçük BitBake projesi
- [`examples/README.md`](examples/README.md): hangi dosyanın hangi bölümde kullanıldığı

Tüm örnekler tek komutla sınanır:

```bash
cd examples/sensor-araclari && python3 -m venv .venv && . .venv/bin/activate
pip install -e '.[test]' && cd ..
sh hepsini-dene.sh                       # Bölüm 1-7
BITBAKE=~/bitbake sh hepsini-dene.sh     # Bölüm 8 dahil (git clone -b 2.18 https://git.openembedded.org/bitbake ~/bitbake)
```

## Yerel önizleme

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
mkdocs serve          # http://127.0.0.1:8000
```

## GitHub Pages'te yayınlama

1. GitHub'da `mfguney/python-gomulu` adlı bir depo oluşturun ve bu klasörü `main` dalına gönderin.
2. Depo ayarlarında **Settings → Pages → Source: GitHub Actions** seçeneğini etkinleştirin.
3. `main` dalına yapılan her gönderimde `.github/workflows/yayinla.yml` siteyi derler ve
   https://mfguney.github.io/python-gomulu/ adresinde yayınlar.

## Lisans

- Kitap metni ve görseller: [CC BY-SA 4.0](LICENSE)
- `examples/` altındaki kodlar ve sitedeki JavaScript dosyaları: [MIT](examples/COPYING.MIT)

Python, Python Software Foundation'ın; Yocto Project, Linux Foundation'ın tescilli markasıdır. Bu kitap
bağımsız bir topluluk çalışmasıdır; bu kuruluşlar tarafından yayımlanmamış veya onaylanmamıştır.
