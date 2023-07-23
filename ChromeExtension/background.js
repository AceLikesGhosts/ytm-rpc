var lastSongData = null;

function updateRichPresence(songName, artistName, timeNow, timeMax, icon, link, isPaused) {
    var data = {
        song: songName,
        artist: artistName,
        timeMax: timeMax,
        timeNow: timeNow,
        icon: icon,
        link: link,
        isPaused: isPaused
    };

    if(JSON.stringify(lastSongData) === JSON.stringify(data)) {
        return;
    }

    var settings = {
        'async': true,
        'crossDomain': true,
        'url': 'http://localhost:2134/',
        'method': "POST",
        'headers': {
            'content-type': 'application/json'
        },
        'processData': false,
        'data': JSON.stringify(data)
    };

    $.ajax(settings);
}

// Check if the event listener is already registered
if(!chrome.tabs.onUpdated.hasListener(tabUpdatedListener)) {
    chrome.tabs.onUpdated.addListener(tabUpdatedListener);
}

function tabUpdatedListener(tabId, changeInfo, tab) {
    if(tab.incognito) {
        return;
    }

    if(!tab.url.startsWith('music.youtube.com')) {
        return;
    }

    chrome.tabs.sendMessage(tabId, {
        message: 'send'
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    updateRichPresence(request.song, request.artist, request.timeNow, request.timeMax, request.icon, request.link, request.isPaused);
});