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

    if(lastSongData === JSON.stringify(data)) {
        return;
    }

    lastSongData = JSON.stringify(data);

    fetch('http://localhost:2134/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        mode: 'cors'
    })
}

// Check if the event listener is already registered
if(!chrome.tabs.onUpdated.hasListener(tabUpdatedListener)) {
    chrome.tabs.onUpdated.addListener(tabUpdatedListener);
}

/**
 * @param {number} tabId 
 * @param {chrome.tabs.TabChangeInfo} changeInfo 
 * @param {chrome.tabs.Tab} tab 
 * @returns {void}
 */
function tabUpdatedListener(tabId, changeInfo, tab) {
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