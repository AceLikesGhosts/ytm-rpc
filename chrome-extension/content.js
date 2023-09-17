(function() {
    chrome.storage.sync.get(['ytm_PORT'], (items) => {
        new MutationObserver((_, observer) => {
            const injectedScript = document.getElementById('ytm-rpc-injected-script');

            if(injectedScript !== void 0 && injectedScript !== null) {
                observer.disconnect();
                document.dispatchEvent(new CustomEvent('ytm_PORT', { detail: { port: items.ytm_PORT } }));
            }
        }).observe(document.documentElement, {
            subtree: true,
            childList: true
        });
    });

    chrome.storage.onChanged.addListener((/** @type {Record<string, unknown>} */ changes, namespace) => {
        for(let [key, { newValue }] of Object.entries(changes)) {
            if(namespace === 'sync' && key === 'ytm_PORT') {
                document.dispatchEvent(new CustomEvent('ytm_PORT', { detail: { port: newValue } }));
            }
        }
    });

    function log(msg) {
        console.log(
            '%c[YTM] %c' + msg,
            'color:purple',
            'color:white'
        );
    }

    function waitForMoviePlayer() {
        new MutationObserver((_, observer) => {
            const player = document.getElementById('movie_player');
            if(player !== null) {
                log('found player injecting script');
                injectScript();
                observer.disconnect();
            }
        }).observe(document.documentElement, {
            subtree: true,
            childList: true
        });
    }

    function monitorContent() {
        let port = 2134;

        document.addEventListener('ytm_PORT', (p) => {
            port = p.detail.port;
            log(`Updated port to ${p.detail.port}`);
        });

        const player = document.getElementById('movie_player');
        const albumQuery = '#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > span > span.subtitle.style-scope.ytmusic-player-bar > yt-formatted-string';
        const log = function log(msg) {
            console.log(
                '%c[YTM] %c' + msg,
                'color:purple',
                'color:white'
            );
        };

        function waitAndThenDetectSong(attempts = 0) {
            if(attempts > 15) {
                throw 'We are actually buffering, odd. Pause and unpause to update the state after you finish updating.';
            }

            setTimeout(() => {
                const songData = player.getVideoData();
                const albumCover = document.querySelector(albumQuery);
                if((songData !== null && songData !== void 0) && (albumCover !== null && albumCover !== void 0) && (albumCover.innerHTML !== void 0 && albumCover.innerHTML !== void 0)) {
                    update(1);
                }
                else {
                    waitAndThenDetectSong(attempts++);
                }
            }, 500);
        }

        function update(code) {
            const isPaused = code === 1 ? false : true;
            const songData = player.getVideoData();
            const timeNow = player.getCurrentTime();
            const timeMax = player.getDuration();
            const icon = `https://i1.ytimg.com/vi/${songData.video_id}/1.jpg`;
            const album = document.querySelector(albumQuery).title.split('•')[1];

            log('above making http request');
            log(`port ${port}`);
            const url = `http://localhost:${port}/`;

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

            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
                body: JSON.stringify(requestData)
            }).then(() => {
                log('posted song data to server (' + requestData.song + ')');
            }).catch(console.error);
        }

        player.addEventListener('onStateChange', (code) => {
            // youtube does not like to tell us if we started playing
            // after a buffer, so we'll try to bruteforce it.
            if(code === 5) {
                return waitAndThenDetectSong();
            }

            if(code !== 1 && code !== 2) {
                return;
            }

            update(code);
        });
    }

    function injectScript() {
        const script = document.createElement('script');
        script.id = 'ytm-rpc-injected-script';
        script.textContent = `(${monitorContent})();`;
        document.documentElement.appendChild(script);
    }

    waitForMoviePlayer();
})();