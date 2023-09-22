(function() {
    /**
     * @type {{
     *  storage: chrome.storage
     * }}
     */
    const cAPI = {};

    if(typeof chrome !== 'undefined') {
        if(typeof browser !== 'undefined') {
            cAPI.storage = {
                sync: {}
            };

            /**
             * @param {string | string[]} keys
             * @param {string | string[] | Record<string, unknown>} cb
             */
            cAPI.storage.sync.get = function(keys, cb) {
                browser.storage.sync.get(keys)
                    .then(cb)
                    .catch(e => {
                        throw e;
                    });
            };

            cAPI.storage.onChanged = {};
            /**
             * @param {((changes: Record<string, unknown>, areaName: 'sync' | 'local' | 'managed' | 'session') => void) } cb 
             */
            cAPI.storage.onChanged.addListener = function(cb) {
                browser.storage.onChanged.addListener((/** @type {Record<string, unknown>} */ ch) => {
                    cb(ch, 'sync');
                });
            };
        }
        else {
            cAPI.storage = chrome.storage;
        }
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

    function waitForMoviePlayer() {
        watchFor('movie_player', document.documentElement, { subtree: true, childList: true }, () => {
            console.log(
                '%c[YTM] ',
                'color:purple',
                'found player, injecting script'
            );
            injectScript();
        });
    }

    /**
     * @description INJECTED INTO THE PAGE
     * @throws
     */
    function monitorContent() {
        let port = 2134;

        window.addEventListener('message', (/** @type {MessageEvent<Record<string, unknown>>} */ e) => {
            if(e.data.type !== 'ytm_PORT') {
                return;
            }

            port = e.data.port;
            log(`Updated port to ${e.data.port}`);
        });

        const player = document.getElementById('movie_player');
        const log = function log(msg) {
            console.log(
                '%c[YTM] ',
                'color:purple',
                msg
            );
        };


        /**
         * Album data is lazy-loaded so we are forced to fetch it in this manner
         */
        async function waitForAlbum() {
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    const query = document.getElementsByClassName('byline style-scope ytmusic-player-bar complex-string');
                    if(query.length > 0) {
                        clearInterval(interval);
                        resolve(query[0].title.split('•')[1].trim());
                    }
                }, 100);
            });
        }

        async function update(event) {
            const isPaused = (event.target || event).paused;
            const songData = player.getVideoData();
            const timeNow = player.getCurrentTime();
            const timeMax = player.getDuration();
            const icon = `https://i1.ytimg.com/vi/${songData.video_id}/1.jpg`;
            const album = await waitForAlbum();
            const url = `http://localhost:${port ?? 2134}/`;

            const requestData = {
                song: songData.title,
                artist: songData.author,
                album: album,
                timeMax: timeMax,
                timeNow: timeNow,
                isPaused: isPaused,
                icon: icon,
                link: `https://music.youtube.com/watch?v=${songData.video_id}`
            };

            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
                body: JSON.stringify(requestData)
            }).then(() => {
                log('posted song data to server (' + requestData.song + ')');
            }).catch(console.error);
        }

        const videoElements = document.getElementsByTagName('video');
        if(!videoElements || !videoElements[0]) {
            throw 'Unable to find Video element, odd.';
        }

        videoElements[0].addEventListener('play', update);
        videoElements[0].addEventListener('pause', update);
        videoElements[0].addEventListener('seeked', update);

        /** @type {boolean} */
        let wasFirstPlay;
        new MutationObserver(() => {
            if(!wasFirstPlay) {
                wasFirstPlay = true;
                return;
            }

            void update(videoElements[0]);
        }).observe(document.querySelector('#movie_player > div.ytp-spinner'), { childList: true, attributes: true });
    }

    function injectScript() {
        const script = document.createElement('script');
        script.id = 'ytm-rpc-injected-script';
        script.textContent = `(${monitorContent})();`;
        document.documentElement.appendChild(script);
    }

    waitForMoviePlayer();
})();