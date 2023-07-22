// content.js
function sendMessage() {
    var movieplayer = document.querySelector("#movie_player > div.ytp-chrome-top > div.ytp-title > div > a");
    var songName = movieplayer.innerHTML;
    var link_raw = movieplayer.getAttribute('href');
    var watch_id = link_raw.slice(link_raw.indexOf('v='));

    var progressbar = document.querySelector("#progress-bar");
    var timeMax = progressbar.ariaValueMax;
    var timeNow = progressbar.ariaValueNow;

    var pauseButton = document.querySelector("#play-pause-button");
    // play = paused : pause = unpaused
    var isPaused = pauseButton.getAttribute('title') === 'Play' ? true : false;

    var artistName = document.getElementsByClassName("byline style-scope ytmusic-player-bar complex-string")[0].innerText;
    var icon = document.getElementsByClassName("image style-scope ytmusic-player-bar")[0].src;

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
    const targetNode = document.querySelector("#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar");

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
    const targetNode = document.querySelector("#play-pause-button");

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
        response: "Message Received! (content)",
    });
});
