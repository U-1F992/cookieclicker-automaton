import os
import time
import sys

from glob import glob
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

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

    log = ''

    cookies = str(driver.execute_script('return Game.cookies'))
    cps = str(driver.execute_script('return Game.cookiesPs'))
    next_name = str(driver.execute_script('return next_to_buy'))

    log += 'Cookies\t: ' + cookies + '\n'
    log += 'CpS\t: ' + cps + '\n'
    log += '\n'
    log += 'Next => ' + next_name + '\n'

    Cursor_Previous_Line = '\033[F'
    Cursor_Horizontal_Absolute = '\033[G'
    Erase_in_entire_Line = '\033[2K'

    sys.stdout.write(Cursor_Previous_Line + Erase_in_entire_Line + Cursor_Previous_Line + Erase_in_entire_Line + Cursor_Horizontal_Absolute + "%s" % log)
    sys.stdout.flush()

    time.sleep(0.1)

def main():
    options = Options()
    options.add_argument('--headless')

    driver = webdriver.Chrome('chromedriver', options=options)
    driver.get('https://orteil.dashnet.org/cookieclicker')
    time.sleep(5)

    cc_import_bkp(driver, './bkp')

    js = open('full-auto-cookie-clicker.js', 'r').read()
    driver.execute_script(js)

    print('dummy_output\n')
    try:
        while True:
            cc_write_log(driver)

    except KeyboardInterrupt:
        # press Ctrl+C to exit
        pass

    sys.stdout.write("\033[2K\033[G%s" % 'exit\n')
    sys.stdout.flush()

    try:
        driver.close()
        driver.quit()
    except:
        pass

if __name__ == "__main__":
    main()
