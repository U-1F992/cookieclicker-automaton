ARG VERSION_CHROMEDRIVER="98.0.4758.48"

FROM debian:11
ARG VERSION_CHROMEDRIVER
RUN \
    #
    # Install dependencies
    #
    apt update && apt -y install \ 
        curl \
        git \
        python3 \
        python3-selenium \
        unzip && \
    \
    #
    # Install google-chrome+chromedriver
    #
    cd /tmp/ && \
    curl https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -O && \
    apt -y install ./google-chrome-stable_current_amd64.deb && \
    curl https://chromedriver.storage.googleapis.com/$VERSION_CHROMEDRIVER/chromedriver_linux64.zip -O && \
    unzip chromedriver_linux64.zip && \
    mv chromedriver /usr/bin/ && \
    rm google-chrome-stable_current_amd64.deb chromedriver_linux64.zip && \
    \
    #
    # Install cookieclicker-automaton
    #
    cd /usr/local/ && \
    git clone --depth 1 https://github.com/mukai1011/cookieclicker-automaton.git && \
    # to run google-chrome as root
    sed -i -e "s/options = Options()/options = Options()\n    options.add_argument('--no-sandbox')/" cookieclicker-automaton/cc_driver.py && \
    \
    #
    # Remove install dependencies
    #
    apt remove --purge -y \
        git \
        unzip && \
    apt autoremove -y && \
    \
    #
    # Create entry point script
    #
    echo "#!/bin/sh -eu\ncd /usr/local/cookieclicker-automaton/\npython3 cc_driver.py" > /entrypoint.sh && chmod +x /entrypoint.sh

CMD ["/bin/sh", "/entrypoint.sh"]