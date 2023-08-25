(function() {
    function waitForMoviePlayer() {
        new MutationObserver((_, observer) => {
            const player = document.getElementById('movie_player');
            if(player !== null) {
                console.log('found player injecting script');
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

        player.addEventListener('onStateChange', (code) => {
            console.log('state change');
            // if we arent playing, or pausing, we dont really care.
            if(code !== 1 && code !== 2) {
                return;
            }

            const isPaused = code === 1 ? false : true;
            const songData = player.getVideoData();
            const timeNow = player.getCurrentTime();
            const timeMax = player.getDuration();
            const icon = document.getElementsByClassName('image style-scope ytmusic-player-bar')[0].src;
            const album = document.querySelector('#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > span > span.subtitle.style-scope.ytmusic-player-bar > yt-formatted-string > a:nth-child(3)').innerHTML;

            const xhr = new XMLHttpRequest();
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

            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onreadystatechange = function() {
                if(xhr.readyState === 4) {
                    if(xhr.status !== 200) {
                        throw new Error('Request failed: ' + xhr.statusText);
                    }
                }
            };

            xhr.send(JSON.stringify(requestData));

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