const chalk = require('chalk'); // colors
const express = require('express'); // server
const Discord = require('discord-rpc'); // rpc wrapper
const he = require('he'); // html entities
const { config } = require('dotenv'); config(); // dotenv

const rpc = new Discord.Client({ transport: 'ipc' });
const app = express();

/** @private @type {Readonly<{ client_id: string; port: number; default_img: string; tempTime: string; last_state: { song: string; timeMax: number; timeNow: number; icon: string; isPaused: boolean; } }>} */
const globals = {
    client_id: process.env.CLIENT_ID || '1075993095138713612', // client id of discord rpc app
    port: process.env.PORT || 2134,                // port for webserver (if you change it you have to change it in the extension as well)
    default_img: process.env.DEFAULT_IMG || 'ytm', // link or asset name
    last_state: {}
};

rpc.on('ready', () => {
    console.log(chalk.blue('rpc client ready'));
    update('Nothing playing', 'Waiting for music..', undefined, undefined, undefined, undefined);
});

app.use(express.json({ limit: '10mb' }));
app.post('/', (req, res) => {
    /** @constant @type { { song: string; timeMax: number; timeNow: number; icon: string; isPaused: boolean; } } */
    const content = req.body;

    if(content.song == undefined || content.song == null) {
        return res.status(400).json({
            ok: false,
            message: 'Missing required field `song`.'
        });
    }

    if(JSON.stringify(content) === JSON.stringify(globals.last_state)) {
        return res.status(400).json({
            ok: false,
            message: 'Same exact state as last update.'
        });
    }

    /** @constant */
    const dataString =
        `${content.song} • ${content.artist.substring(0, content.artist.length - 6)} ${content.timeMax.replace(' ', '')}`
            .replace(/(\r\n|\n|\r)/gm, '')
            .trim();

    if(globals.last_state.song !== content.song) {
        console.log(`${chalk.green('playing')} ${dataString}`);
    }// else {
    //  console.log(`${chalk.green('updated')} ${dataString}`);
    //}

    globals.last_state = content;
    update(content.song, content.artist, timeToMilli(content.timeNow), timeToMilli(content.timeMax), content.icon, content.link, !content.isPaused);
    res.sendStatus(200);
    return;
});

/**
 * @description Turns a time string seperated by `:`s into a millisecond time.
 * @param {number} time 
 * @returns {number}
 */
function timeToMilli(time) {
    let temp = Date.now();
    temp += Math.round(parseFloat(time) * 1000);
    return temp;
}

/**
 * @description Replaces HTML entities with the proper character, and removes new lines.
 * @param {string} str - The string to decode HTML entities within.
 * @returns {string} - A string with HTML entities removed.
 */
function discordStringify(str) {
    if(str && typeof str === 'string') {
        if(str === '' || str === ' ') {
            throw new Error(`failed to parse string -> it was empty.`);
        }
        
        str = he.decode(str);

        // remove any new lines
        str = str.replace(/(\r\n|\n|\r)/gm, '');

        if(str.length >= 127) {
            str = str.substring(0, 124);
            str += '...';
        }
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
 * @param {boolean} isPaused - If the song is paused.
 */
function update(song, artist, timeNow, timeMax, icon, link, isPaused) {
    song = discordStringify(song);
    artist = discordStringify(artist);
    artist = artist.substring(0, artist.length - 6); // removes the year + the bullet point + the space (EX: The Day * 2009 -> The Day)

    const currentTime = Date.now();
    const endTime = currentTime + (timeMax - timeNow); // Calculate the correct end time

    if(isPaused) {
        rpc.setActivity({
            details: song,
            state: artist,
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
    } else {
        rpc.setActivity({
            details: `Paused: ${song}`,
            state: artist,
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
}

rpc.login({ clientId: globals.client_id });
app.listen(globals.port, () => console.log(chalk.blue('started express application')));