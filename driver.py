import os
import time
import sys
import threading

from glob import glob
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ERASE_PREV_LINE = '\033[F\033[2K\033[G'
HEADER = """
################################
##                            ##
##  Full Auto Cookie Clicker  ##
##  v2.0                      ##
##                            ##
##  press Ctrl+C to exit      ##
##                            ##
################################
"""

_next_name = ''
_next_price = ''
_count = ''
_quit = False

lock = threading.Lock()

def count_files_in(dir):
    """
    Count files in directory.

    Parameters
    ----------
    dir : str
        directory to search (not recursive)

    Returns
    -------
    int
        number of files

    """
    return len([name for name in os.listdir(dir) if os.path.isfile(os.path.join(dir, name))])

def get_latest_file(dir):
    """
    Return latest modified file path.

    Parameters
    ----------
    dir : str
        directory to search (not recursive)

    Returns
    -------
    str
        latest modified file path

    """
    target = os.path.join(dir, '*')
    files = [(f, os.path.getmtime(f)) for f in glob(target)]
    latest_modified_file_path = sorted(files, key=lambda files: files[1])[-1]
    return latest_modified_file_path[0]

def cc_import_bkp(driver, dir):
    """
    If exists, import latest save file in directory.
    
    Parameters
    ----------
    driver : selenium.webdriver.chrome.webdriver.WebDriver
        chromedriver object
    dir : str
        directory to search (not recursive)
    """
    if count_files_in(dir) != 0:
        save = open(get_latest_file(dir))
        driver.execute_script('Game.ImportSaveCode("' + save.read() + '");')
        save.close()

def cc_write_log(driver):
    """
    Write log to stdout

    Parameters
    ----------
    driver : selenium.webdriver.chrome.webdriver.WebDriver
        chromedriver object
    """

    global _next_name
    global _next_price
    global _count

    cookies = str(driver.execute_script('return Game.cookies'))
    cps = str(driver.execute_script('return Game.cookiesPs'))
    next_name = str(driver.execute_script('return document.getElementById("__script_next_to_buy_name").value'))
    next_price = str(driver.execute_script('return document.getElementById("__script_next_to_buy_price").value'))
    meter = str(driver.execute_script('return Game.ascendMeterLevel'))
    count = str(driver.execute_script('return document.getElementById("__script_ascension_count").value'))

    log = ''

    log += 'Next\t: ' + next_price + ' (' + next_name + ')\n'
    log += 'Cookies\t: ' + cookies + '\n'
    log += 'CpS\t: ' + cps + '\n'
    log += '\n'
    log += 'Ascend\n'
    log += '  Meter\t: ' + meter + ' / 250\n'
    log += '  Count\t: ' + count + '\n'

    sys.stdout.write(ERASE_PREV_LINE * 7)
    sys.stdout.write(log)
    sys.stdout.flush()

def main():
    
    global _quit

    print(HEADER)

    options = Options()
    options.add_argument('--headless')

    driver = webdriver.Chrome('chromedriver', options=options)
    driver.get('https://orteil.dashnet.org/cookieclicker')
    time.sleep(5)

    cc_import_bkp(driver, './bkp')

    js = open('full-auto-cookie-clicker.js', 'r').read()
    driver.execute_script(js)

    print('dummy_output\n' * 6)
    try:
        while True:
            cc_write_log(driver)

    except KeyboardInterrupt:
        # press Ctrl+C to exit
        sys.stdout.write('\033[2K')
        _quit = True
        pass

    sys.stdout.write(ERASE_PREV_LINE * 7)
    sys.stdout.flush()

    try:
        driver.close()
        driver.quit()
    except:
        pass

if __name__ == "__main__":
    main()
