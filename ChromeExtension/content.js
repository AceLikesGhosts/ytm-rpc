// content.js
function sendMessage() {
    var movieplayer = document.querySelector("#movie_player > div.ytp-chrome-top > div.ytp-title > div > a");
    var songName = movieplayer.innerHTML;
    var link = movieplayer.getAttribute('href');
    var artistName = document.getElementsByClassName("byline style-scope ytmusic-player-bar complex-string")[0].innerText;
    var time = document.getElementsByClassName("time-info style-scope ytmusic-player-bar")[0].innerText.toString().split('/')[1];
    var icon = document.getElementsByClassName("image style-scope ytmusic-player-bar")[0].src;
    console.log(link);
    chrome.runtime.sendMessage({
        song: songName,
        artist: artistName,
        timeMax: time,
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