
# full-auto-cookie-clicker.js

全自動 Cookie Clicker (v2.031対応)

## Version

v1.6

## Requirements

- Python3
    - python2-selenium
- google-chrome
- chromedriver

```sh
# python3-selenium
sudo apt install python3-selenium

# google-chrome
curl -O https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt update
sudo apt install ./google-chrome-stable_current_amd64.deb

# chromedriver
#  adjust to version of google-chrome
# https://chromedriver.chromium.org/downloads
curl -O https://chromedriver.storage.googleapis.com/93.0.4577.63/chromedriver_linux64.zip
unzip chromedriver_linux64.zip
sudo mv chromedriver /usr/local/bin/

# confirm
which google-chrome
which chrome-driver
```

## 基本方針

全施設と一部のアップグレードについて、以下が最小の要素を購入する
```
(購入費用) * (1 + (現在の基礎CpS) / (購入によるCpS上昇))
```

## 平行要素

- 自動クリック(実測 150~200回/s)
- Golden Cookieは常時監視して瞬時に潰す
- 全てのwrinklerを瞬時に潰す
- 上記以外のアップグレードは購入可能時に逐次購入する
  - 基本方針に割り込みが発生し、購入順序が変わる可能性がある
- Heavenly ChipをTARGET_HC枚稼ぐ毎にAscendする
  - Prestigeは可能な限り購入する
  - 7秒後にReincarnate
- BACKUP_INTERVAL毎にセーブをダウンロードさせる

## 参考

- [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/)
- [cookie clicker 日本語wiki](https://w.atwiki.jp/cookieclickerjpn/)
- [Cookie Clicker で効率的に True Neverclick を取得する方法](https://inuwara-note.hateblo.jp/entry/cookie-clicker-2)
- [【クッキー】CookieClicker【ババア】 9枚目](https://uni.5ch.net/test/read.cgi/gameswf/1380563429/275?v=pc)

## 既知の問題点

- オブジェクト毎の現在のCpSを取得する手順が確立していない
  - cps(), baseCps, storedCpsは同じ値を返し、storedTotalCpsはこれらにamountをかけた値を返すが、いずれも現在のCpSとは異なる？
