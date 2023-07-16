// content.js
function sendMessage()
{
    var songName = document.getElementsByClassName("title style-scope ytmusic-player-bar")[0].innerHTML;
    var artistName = document.getElementsByClassName("byline style-scope ytmusic-player-bar complex-string")[0].innerText;
    var time = document.getElementsByClassName("time-info style-scope ytmusic-player-bar")[0].innerText.toString().split('/')[1];
    var icon = document.getElementsByClassName("image style-scope ytmusic-player-bar")[0].src;
    // var link = document.getElementById('share-url').value;
    chrome.runtime.sendMessage({
        song: songName,
        artist: artistName,
        timeMax: time,
        icon: icon,
        // link: link
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    sendResponse({
        response: "Message Received! (content)"
    });

    if (document.getElementsByClassName("byline style-scope ytmusic-player-bar complex-string")[0] != undefined)
    {
        sendMessage();
    }
});