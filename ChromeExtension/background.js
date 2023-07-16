function updateRichPresence(songName, artistName, timeMax, icon, link) {
    var data = {
        song: songName,
        artist: artistName,
        timeMax: timeMax,
        icon: icon || 'ytm',
        link: link
    };

    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "http://localhost:2134/",
        "method": "POST",
        "headers": {
            "content-type": "application/json"
        },
        "processData": false,
        "data": JSON.stringify(data)
    };

    $.ajax(settings);
}

// Check if the event listener is already registered
if(!chrome.tabs.onUpdated.hasListener(tabUpdatedListener)) {
    chrome.tabs.onUpdated.addListener(tabUpdatedListener);
}

function tabUpdatedListener(tabId, changeInfo, tab) {
    chrome.tabs.sendMessage(tabId, {
        message: 'send'
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    updateRichPresence(request.song, request.artist, request.timeMax, request.icon, null);
});