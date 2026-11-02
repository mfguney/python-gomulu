#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""pyserial temelleri: loop:// geri döngü portuyla donanımsız deneme (Bölüm 7).

loop:// adresine yazılan her bayt aynı porttan geri okunur. Gerçek bir portta
yalnızca URL değişir: serial.Serial("/dev/ttyUSB0", 9600, timeout=0.5).
"""
import time

import serial

with serial.serial_for_url("loop://", baudrate=9600, timeout=0.5) as port:
    print("port        :", port.name, "| hız:", port.baudrate, "| ayar:", f"{port.bytesize}{port.parity}{port.stopbits}")

    istek = bytes.fromhex("01 03 00 00 00 04 44 09")
    yazilan = port.write(istek)
    print("yazılan     :", yazilan, "bayt")
    print("bekleyen    :", port.in_waiting, "bayt")

    print("read(4)     :", port.read(4).hex(" "))
    print("read(100)   :", port.read(100).hex(" "), "(yalnızca kalan 4 bayt; zaman aşımına kadar beklendi)")

    t0 = time.monotonic()
    bos = port.read(8)
    print(f"boş okuma   : {bos!r} {time.monotonic() - t0:.2f} s sonra (timeout=0.5)")

    port.write(b"OKU sensor0\r\nDURUM\r\n")
    print("read_until  :", port.read_until(b"\r\n"), port.read_until(b"\r\n"))

    port.timeout = 0                  # engellemeyen kip: hemen döner
    print("timeout=0   :", port.read(10))
