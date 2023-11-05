(() => {
    cAPI.storage.sync.get(['ytm_PORT'], (items) => {
        watchFor('ytm-rpc-injected-script', document.documentElement, { subtree: true, childList: true }, () => {
            window.postMessage({ type: 'ytm_PORT', port: items.ytm_PORT });
        });
    });

    cAPI.storage.onChanged.addListener((/** @type {Record<string, unknown>} */ changes, namespace) => {
        for(let [key, { newValue }] of Object.entries(changes)) {
            if(namespace === 'sync' && key === 'ytm_PORT') {
                window.postMessage({ type: 'ytm_PORT', port: newValue });
            }
        }
    });

    /**
     * @description Logs out a message, but pretty.
     * @param {string} msg 
     */
    function log(msg) {
        console.log(
            '%c[YTM] ',
            'color:purple',
            msg
        );
    }

    /**
     * @param {string} id - The ID of the element to watch for. 
     * @param {HTMLElement} what - Where we should watch from 
     * @param {MutationObserverInit} opts - The options to give the MutationObserver
     * @param {((element: unknown) => any | Promise<any>) } cb 
     */
    function watchFor(id, what, opts, cb) {
        new MutationObserver((_, observer) => {
            const search = document.getElementById(id);

            if(search !== void 0 && search !== null) {
                observer.disconnect();
                cb(search);
            }
        }).observe(what, opts);
    }

    /**
     * @description Injects a script into the page.
     * @param {{
     *  id: string;
     *  mainScript: (...args: any[]) => any | Promise<any>;
     *  fns: ((...args: any[]) => any | Promise<any>)[]
     * }} param0 
     */
    function injectScript({ id, mainScript, fns }) {
        const script = document.createElement('script');
        script.id = id;
        /* eslint-disable indent */
        // eslint doesnt like this area
        script.textContent = `
        (function() {
        ${fns.map((fn) => {
            return fn.toString();
        }).join('')}

        (${mainScript})();
        })();
        `;
        /* eslint-enable indent */
        document.documentElement.appendChild(script);
    }

    /**
     * Injects the script into the page after finding the movie player.
     */
    watchFor('movie_player', document.documentElement, { subtree: true, childList: true }, () => {
        log('found player injecting script');
        injectScript({
            id: 'ytm-rpc-injected-script',
            fns: [log, watchFor],
            mainScript: monitorContent
        });
    });

    /**
     * @description The page injected code, used to monitor the song.
     */
    function monitorContent() {
        /**
         * @description The port we send data to.
         * @type {number}
         */
        let port = 2134;

        /* eslint-disable jsdoc/valid-types */
        /**
         * @description The Youtube Music player
         * @type {{ 
         * getVideoData(): Record<string, unknown>;
         * getCurrentTime(): number;
         * getDuration(): number;
         * }}
         */
        /* eslint-enable jsdoc/valid-types */
        const player = document.getElementById('movie_player');
        /**
         * @description A stupid querySelector query to get the album.
         * @type {string}
         */
        const albumQuery = '#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > span > span.subtitle.style-scope.ytmusic-player-bar > yt-formatted-string';

        window.addEventListener('message', (/** @type {MessageEvent<Record<string, unknown>>} */ e) => {
            if(e.data.type !== 'ytm_PORT') {
                return;
            }

            port = e.data.port;
            log(`Updated port to ${e.data.port}`);
        });

        /**
         * @description Attempts to fetch the song data and album art for 7.5 seconds.
         * @param {number} attempts - How many times have we attempted to fetch the song data or album cover?
         * @throws
         */
        function waitAndThenDetectSong(attempts = 0) {
            if(attempts > 15) {
                throw 'We are actually buffering, odd. Pause and unpause to update the state after you finish updating.';
            }

            setTimeout(() => {
                const songData = player.getVideoData();
                const albumText = document.querySelector(albumQuery);
                if(
                    (songData !== null && songData !== void 0)
                    && (albumText !== null && albumText !== void 0)
                    && (albumText.title !== void 0 && albumText.title !== null)
                ) {
                    update(1);
                }
                else {
                    waitAndThenDetectSong(attempts++);
                }
            }, 500);
        }

        /**
         * @description Fetches and sends the data to the server.
         * @param {number} code 
         */
        function update(code) {
            const isPaused = code === 1 ? false : true;
            const songData = player.getVideoData();
            const timeNow = player.getCurrentTime();
            const timeMax = player.getDuration();
            const icon = `https://i1.ytimg.com/vi/${songData.video_id}/1.jpg`;
            const album = document.querySelector(albumQuery).title.split('•')[1];

            const url = `http://localhost:${port ?? 2134}/`;

            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
                body: JSON.stringify({
                    song: songData.title,
                    artist: songData.author,
                    album: album,
                    timeMax: timeMax,
                    timeNow: timeNow,
                    isPaused: isPaused,
                    icon: icon,
                    link: `https://music.youtube.com/watch?v=${songData.video_id}`
                })
            }).then(() => {
                log('posted song data to server (' + songData.title + ')');
            }).catch(console.error);
        }

        player.addEventListener('onStateChange', (/** @type {number} */ code) => {
            // youtube does not like to tell us if we started playing
            // after a buffer, so we'll try to bruteforce it.
            if(code === 5 || code === 3) {
                return waitAndThenDetectSong();
            }

            if(code !== 1 && code !== 2) {
                return;
            }

            update(code);
        });
    }
})();