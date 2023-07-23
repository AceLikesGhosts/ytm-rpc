// sends the request to the background script (which then sends to the server)
function sendMessage() {
    
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
    var progressbar = document.querySelector('#progress-bar');
    var timeMax = progressbar.ariaValueMax;
    var timeNow = progressbar.ariaValueNow;

    var pauseButton = document.querySelector('#play-pause-button');
    // play = paused : pause = unpaused
    var isPaused = pauseButton.getAttribute('title') === 'Play' ? true : false;

    // the artist's name
    var artistName = document.getElementsByClassName('byline style-scope ytmusic-player-bar complex-string')[0].innerText;
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

// Function to set up the MutationObserver
function songInViewObserver() {
    const targetNode = document.querySelector('#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar');

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

// Function to set up the MutationObserver
function pauseObserver() {
    const targetNode = document.querySelector('#play-pause-button');

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

songInViewObserver();
pauseObserver();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    sendResponse({
        response: 'Message Received! (content)',
    });
});
