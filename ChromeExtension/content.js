(function() {
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
        const player = document.getElementById('movie_player');
        const log = function log(msg) {
            console.log(
                '%c[YTM] %c' + msg,
                'color:purple',
                'color:white'
            );
        };
        player.addEventListener('onStateChange', (code) => {
            if(code !== 1 && code !== 2) {
                log(`code failed: ${code}`)
                return;
            }

            log('below state change check: ' + code);

            const isPaused = code === 1 ? false : true;
            const songData = player.getVideoData();
            const timeNow = player.getCurrentTime();
            const timeMax = player.getDuration();
            const icon = document.getElementsByClassName('image style-scope ytmusic-player-bar')[0].src;
            const album = document.querySelector('#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > span > span.subtitle.style-scope.ytmusic-player-bar > yt-formatted-string > a:nth-child(3)').innerHTML;

            log('above making http request');
            const url = 'http://localhost:2134/';

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
            });
        });
    }

    function injectScript() {
        const script = document.createElement('script');
        script.id = 'ytm-rpc-injected-script';
        script.textContent = `(${monitorContent})(/** arguments */);`;
        document.documentElement.appendChild(script);
    }

    waitForMoviePlayer();
})();