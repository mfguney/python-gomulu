#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Çalışan yorumlayıcının kimliğini ve modül arama yolunu gösterir (Bölüm 1).

Aynı betik sistem Python'u ile ve bir sanal ortam içinden çalıştırılarak
sys.prefix / sys.base_prefix farkı gözlemlenir.
"""
import platform
import site
import sys
import sysconfig

sanal = sys.prefix != sys.base_prefix

print(f"sürüm        : {platform.python_implementation()} {platform.python_version()}")
print(f"yorumlayıcı  : {sys.executable}")
print(f"sys.prefix   : {sys.prefix}")
print(f"base_prefix  : {sys.base_prefix}")
print(f"sanal ortam  : {'evet' if sanal else 'hayır'}")
print(f"site-packages: {sysconfig.get_paths()['purelib']}")
print(f"kullanıcı    : {site.getusersitepackages()} (etkin: {site.ENABLE_USER_SITE})")
print("sys.path:")
for yol in sys.path:
    print(f"  {yol or '(boş dizgi = geçerli dizin)'}")
