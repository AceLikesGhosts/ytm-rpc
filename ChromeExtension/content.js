// self isolate
// same as `(function() {})();`
new function() {
    // sends the request to the background script (which then sends to the server)
    function sendMessage() {
        var progressbar = document.querySelector('#progress-bar');

        if(progressbar.ariaValueText === '0:00 of NaN:NaN') {
            console.error('%c[YTM-RPC] %cProgress Bar did not have proper data!', 'color:purple;', 'color:white;');
            return; // there was no data
        }

        var movieplayer = document.querySelector('#movie_player > div.ytp-chrome-top > div.ytp-title > div > a');
        // inner content of the movie player is the name of the song
        var songName = movieplayer.innerHTML;
        // link to the movieplayer is the 'queuelist''s URL AND the 
        // URL to the currently playing song
        // EX: music.youtube.com/watch?v=aaa&list=aaa
        // all we are doing is extracting the `v=aaa` aka the
        // actual song URL
        var link_raw = movieplayer.getAttribute('href');
        var watch_id = link_raw.slice(link_raw.indexOf('v='));

        // progress bar contains `ariaValueMax` & `ariaValueNow` which is
        // how far we have progressed into the song and the total amount of time
        // in the song (in seconds)
        var timeMax = progressbar.ariaValueMax;
        var timeNow = progressbar.ariaValueNow;

        var pauseButton = document.querySelector('#play-pause-button');
        // play = paused : pause = unpaused
        var isPaused = pauseButton.getAttribute('title') === 'Play' ? true : false;

        // the bar where the artist's name can be located
        var artistFormattedString = document.querySelector("#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > span > span.subtitle.style-scope.ytmusic-player-bar > yt-formatted-string")
        
        if(artistFormattedString === undefined || !artistFormattedString.title) {
            console.error('%c[YTM-RPC] %cFailed to fetch artists, formatted string bat was undefined.', 'color:purple;', 'color:white;');
            return;
        }

        var artistName = artistFormattedString.title;

        // rip the URL from the album cover
        var icon = document.getElementsByClassName('image style-scope ytmusic-player-bar')[0].src;

        if(isPaused === undefined || isPaused === null) {
            isPaused = false;
        }

        chrome.runtime.sendMessage({
            song: songName,
            artist: artistName,
            timeMax: timeMax,
            timeNow: timeNow,
            icon: icon,
            isPaused: isPaused,
            link: 'https://music.youtube.com/watch?' + watch_id
        });
    }

    /**
     * @description Adds an observer that calls `sendMessage`
     * @param {string} name 
     */
    function setUpObserver(name) {
        const targetNode = document.querySelector(name);

        // Create a MutationObserver instance
        const observer = new MutationObserver(() => {
            // Whenever there is a mutation in the targetNode, send the message
            sendMessage();
        });

        // Configuration for the observer (we want to observe any changes in the targetNode and its descendants)
        const config = { childList: true, subtree: true };

        // Start observing the targetNode with the specified configuration
        observer.observe(targetNode, config);
    }

    // song in view
    setUpObserver('#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar');
    // pause/play button
    setUpObserver('#play-pause-button');

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        sendResponse({
            response: 'Message Received! (content)',
        });
    });
}();