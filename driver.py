import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.binary_location = '/usr/bin/google-chrome'
options.add_argument('--kiosk')

driver = webdriver.Chrome('chromedriver', options=options)
driver.get('https://orteil.dashnet.org/cookieclicker')

time.sleep(3)
js = open('full-auto-cookie-clicker.js', 'r').read()
driver.execute_script(js)
