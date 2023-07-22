const chalk = require('chalk'); // colors
const express = require('express'); // server
const Discord = require('discord-rpc'); // rpc wrapper
const he = require('he'); // html entities
const { config } = require('dotenv'); config(); // dotenv

const rpc = new Discord.Client({ transport: 'ipc' });
const app = express();

/** @type {Readonly<{ client_id: string; port: number; default_img: string; tempTime: string; }>} */
const globals = {
    client_id: process.env.CLIENT_ID || '1075993095138713612', // client id of discord rpc app
    port: process.env.PORT || 2134,                // port for webserver (if you change it you have to change it in the extension as well)
    default_img: process.env.DEFAULT_IMG || 'ytm', // link or asset name
    tempTime: '0'
};

rpc.on('ready', () => {
    console.log(chalk.blue('rpc client ready'));
    update('Nothing playing', 'Waiting for music..', undefined, undefined, undefined, undefined);
});

app.use(express.json({ limit: '10mb' }));
app.post('/', (req, res) => {
    /** @type { { content: string; song: string; timeMax: number; timeNow: number; icon: string; } } */
    let content = req.body;

    if(content.song == undefined || content.song == null || globals.tempTime == content.timeNow || content.timeMax == '0' || content.timeNow === content.timeMax) {
        return res.status(400).json({
            ok: false,
            message: 'Missing required field `song` or `timeMax` was equal to the cached time.'
        });
    }

    if(globals.current_song == content.song) {
        console.log(chalk.red(`song "${globals.current_song}" and "${content.song}" are the same`));
        return res.status(400).json({
            ok: false,
            message: 'Current song and posted song are the same.'
        });
    }

    globals.tempTime = content.timeNow;

    const dataString =
        `${content.song} • ${content.artist} ${content.timeMax.replace(' ', '')}`
            .replace(/\d\d\d\d/g, '')
            .replace(/\s{2,}/gm, ' ')
            .replace(/(\r\n|\n|\r)/gm, '')
            .trim();

    console.log(`${chalk.green('playing')} ${dataString}`);

    update(content.song, content.artist, timeToMilli(content.timeNow), timeToMilli(content.timeMax), content.icon, content.link);
    res.sendStatus(200);
    return;
});

/**
 * @description Turns a time string seperated by `:`s into a millisecond time.
 * @param {number} time 
 * @returns {number}
 */
function timeToMilli(time) {
    var temp = Date.now();
    temp += Math.round(parseFloat(time) * 1000);
    return temp;
}

/**
 * @description Replaces HTML entities with the proper character, and removes new lines.
 * @param {string} str - The string to decode HTML entities within.
 * @returns {string} - A string with HTML entities removed.
 */
function replaceHTMLEntities(str) {
    if(str && typeof str === 'string') {
        str = he.decode(str);

        // remove any new lines
        str = str.replace(/(\r\n|\n|\r)/gm, '');
    }

    return str;
}

/**
 * @description Updates the Discord RPC locally.
 * @param {string} song   - The name of the song
 * @param {string} artist - The artist of the song
 * @param {number} timeNow - How far into the song we are (milliseconds)
 * @param {number} timeMax - How long the song lasts (milliseconds)
 * @param {string} icon - The link to the album cover/icon
 * @param {string} link - The link to the song on Youtube Music
 */
function update(song, artist, timeNow, timeMax, icon, link) {
    song = replaceHTMLEntities(song);
    artist = replaceHTMLEntities(artist);
    artist = artist.substr(0, artist.length - 6); // removes the year + the bullet point + the space (EX: The Day * 2009 -> The Day)

    if(song.length >= 127) {
        song = song.substr(0, 127 - 3);
        song += '...';
    }

    if(artist.length >= 127) {
        song = song.substr(0, 127 - 3);
        song += '...';
    }

    const currentTime = Date.now();
    const endTime = currentTime + (timeMax - timeNow); // Calculate the correct end time

    rpc.setActivity({
        details: replaceHTMLEntities(song),
        state: replaceHTMLEntities(artist),
        startTimestamp: timeNow || 0,
        endTimestamp: endTime || 0,
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