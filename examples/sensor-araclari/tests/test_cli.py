# SPDX-License-Identifier: MIT
import json
from unittest import mock

import pytest
import serial

from sensor_araclari import cli, istemci, protokol


def test_tablo_ciktisi(ornek_csv, capsys):
    kod = cli.main([str(ornek_csv)])
    cikti = capsys.readouterr().out
    assert kod == cli.CIKIS_TAMAM
    assert cikti.splitlines()[1].split() == ["sensor0", "4", "21.4", "31.2", "24.25"]


def test_json_ve_esik_alarmi(ornek_csv, capsys):
    kod = cli.main([str(ornek_csv), "--bicim", "json", "--esik", "30"])
    veri = json.loads(capsys.readouterr().out)
    assert kod == cli.CIKIS_ALARM
    assert veri["sensor0"]["max"] == 31.2


def test_ortam_degiskeni_bicimi(ornek_csv, capsys, monkeypatch):
    monkeypatch.setenv("SENSOR_RAPOR_BICIM", "csv")
    cli.main([str(ornek_csv)])
    assert capsys.readouterr().out.startswith("sensor,adet,min,max,ort\n")


def test_komut_satiri_ortamdan_once_gelir(ornek_csv, capsys, monkeypatch):
    monkeypatch.setenv("SENSOR_RAPOR_BICIM", "csv")
    cli.main([str(ornek_csv), "-b", "json"])
    assert capsys.readouterr().out.lstrip().startswith("{")


def test_eksik_dosya_veri_hatasi(tmp_path, capsys):
    # cli.main() logging'i dictConfig ile yeniden yapılandırdığından caplog yerine
    # günlüklerin yazıldığı stderr denetlenir.
    kod = cli.main([str(tmp_path / "yok.csv")])
    assert kod == cli.CIKIS_VERI
    assert "ERROR" in capsys.readouterr().err


def test_gecersiz_secenek_kullanim_hatasi(capsys):
    with pytest.raises(SystemExit) as bilgi:
        cli.main(["--bicim", "xml", "a.csv"])
    assert bilgi.value.code == 2
    assert "invalid choice" in capsys.readouterr().err


def test_istemci_mock_port_ile():
    """Gerçek port yerine davranışı programlanmış bir sahte (mock) nesne kullanılır."""
    yanit = protokol.yanit_olustur(1, [0xFF83, 455, 1013, 1])
    port = mock.create_autospec(serial.Serial, instance=True)
    port.read.side_effect = [yanit[:5], yanit[5:]]       # ilk read 5 bayt, ikincisi kalanı

    assert istemci.oku(port, 1, 0, 4) == [0xFF83, 455, 1013, 1]
    port.write.assert_called_once_with(protokol.istek_olustur(1, 0, 4))
    assert port.read.call_args_list == [mock.call(5), mock.call(8)]


def test_istemci_zaman_asimi():
    port = mock.create_autospec(serial.Serial, instance=True)
    port.read.return_value = b""                          # cihaz hiç yanıt vermiyor
    with pytest.raises(TimeoutError):
        istemci.oku(port, 1, 0, 4)
