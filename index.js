const chalk = require('chalk'); // colors
const express = require('express'); // server
const Discord = require('discord-rpc'); // rpc wrapper
const he = require('he'); // html entities
const { config } = require('dotenv'); config(); // dotenv

const rpc = new Discord.Client({ transport: 'ipc' });
const app = express();

/** @type {Readonly<{ client_id: string; port: number; default_img: string; current_song: string; tempTime: string; }>} */
const globals = {
    client_id: process.env.CLIENT_ID || '1075993095138713612', // client id of discord rpc app
    port: process.env.PORT || 2134,                // port for webserver (if you change it you have to change it in the extension as well)
    default_img: process.env.DEFAULT_IMG || 'ytm', // link or asset name
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

/**
 * @description Turns a time string seperated by `:`s into a millisecond time.
 * @param {string} time 
 * @returns {number}
 */
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

/**
 * @description Stringifies a string to use on
 * @param {string} str 
 * @returns {string} A string with HTML entities removed.
 */
function discordStringify(str) {
    if(str && typeof str === 'string') {
        str = he.decode(str);

        // remove any new lines
        str = str.replace(/(\r\n|\n|\r)/gm, '');
    }

    return str;
}

/**
 * @description Updates the Discord RPC locally.
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