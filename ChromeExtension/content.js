// content.js
function sendMessage() {
    var movieplayer = document.querySelector("#movie_player > div.ytp-chrome-top > div.ytp-title > div > a");
    var songName = movieplayer.innerHTML;
    var link = movieplayer.getAttribute('href');

    var progressbar = document.querySelector("#progress-bar");
    var timeMax = progressbar.ariaValueMax;
    var timeNow = progressbar.ariaValueNow;

    var artistName = document.getElementsByClassName("byline style-scope ytmusic-player-bar complex-string")[0].innerText;
    var icon = document.getElementsByClassName("image style-scope ytmusic-player-bar")[0].src;

    chrome.runtime.sendMessage({
        song: songName,
        artist: artistName,
        timeMax: timeMax,
        timeNow: timeNow,
        icon: icon,
        link: link
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    sendResponse({
        response: "Message Received! (content)"
    });

    if(document.getElementsByClassName("byline style-scope ytmusic-player-bar complex-string")[0] != undefined) {
        sendMessage();
    }
});