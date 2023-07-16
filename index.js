const chalk = require('chalk'); // colors
const express = require('express'); // server
const Discord = require('discord-rpc'); // rpc wrapper

const rpc = new Discord.Client({ transport: 'ipc' });
const app = express();

const globals = {
    client_id: '1075993095138713612',
    port: 2134,
    default_img: 'ytm', // link or asset name
    current_song: 'Nothing playing',
    tempTime: '0'
};

rpc.on('ready', () => {
    console.log(chalk.blue('rpc client ready'));
    update('Nothing playing', 'Waiting for music..', undefined, undefined, undefined, undefined)
});

app.use(express.json({ limit: '10mb' }));
app.post('/', (req, res) => {
    /** @type { { content: string; song: string; timeMax: string; icon: string; } } */
    let content = req.body;

    if(content.song == undefined || content.song == null || globals.tempTime == content.timeMax.replace(' ', '') || content.timeMax.replace(' ', '') == '0:00') {
        res.sendStatus(200);
        return;
    }

    if(globals.current_song == content.song) {
        console.log(`song ${globals.current_song} and ${content.song} are the same`)
        res.sendStatus(200);
        return;
    }

    globals.tempTime = content.timeMax.replace(' ', '');
    globals.current_song = content.song;

    const dataString =
        `${content.song} ${content.artist} ${content.timeMax.replace(' ', '')}`
            .replace(/\d\d\d\d/g, '')
            .replace(content.song, `${content.song} •`)
            .replace(/\s{2,}/gm, ' ')
            .replace(/(\r\n|\n|\r)/gm, '')
            .trim();

    console.log(`${chalk.green('playing')} ${dataString}`);

    update(content.song, content.artist, new Date(), timeToMilli(content.timeMax.replace(' ', '')), content.icon, content.link);
    res.sendStatus(200);
    return;
});

function timeToMilli(time) {
    var temp = Date.now();
    if(time.split(':').length == 2) {
        temp += Math.round(parseFloat(time.split(':')[0]) * 60000);
        temp += Math.round(parseFloat(time.split(':')[1]) * 1000);
    } else if(time.split(':').length == 3) {
        temp += Math.round(parseFloat(time.split(':')[0]) * 3600000);
        temp += Math.round(parseFloat(time.split(':')[1]) * 60000);
        temp += Math.round(parseFloat(time.split(':')[2]) * 1000);
    }
    return temp;
}

// this is safe
/**
 * @param {string} str 
 * @returns {string} A string with HTML entities removed.
 */
function discordStringify(str) {
    if(str && typeof str === 'string') {
        // strip script/html tags
        str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
        str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');

        // remove any new lines
        str = str.replace(/(\r\n|\n|\r)/gm, '');
    }

    return str;
}

/**
 * 
 * @param {string} song 
 * @param {string} artist 
 * @param {number} timeNow 
 * @param {number} timeMax 
 * @param {string} icon 
 * @param {string} link 
 */
function update(song, artist, timeNow, timeMax, icon, link) {
    song = discordStringify(song);
    artist = discordStringify(artist);

    if(song.length >= 127) {
        song = song.substr(0, 127 - 3);
        song += '...';
    }

    if(artist.length >= 127) {
        song = song.substr(0, 127 - 3);
        song += '...';
    }

    rpc.setActivity({
        details: discordStringify(song),
        state: discordStringify(artist),
        startTimestamp: timeNow || 0,
        endTimestamp: timeMax || 0,
        largeImageKey: icon || globals.default_img,
        largeImageText: song,
        buttons: [
            {
                label: '▶ Listen on Youtube Music',
                url: link || 'https://music.youtube.com'
            }
        ],
        instance: true
    });
}

rpc.login({ clientId: globals.client_id });
app.listen(globals.port, () => console.log(chalk.blue('started express application')));