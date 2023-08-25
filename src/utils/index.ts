import he from 'he';
import type { Presence } from 'discord-rpc';
import type { IConstants } from 'src/types/Constants';

export function stringify(str: string): string {
    if(!str || typeof str !== 'string') {
        throw new Error('Invaliid argument was pasesd to stringify, a non-string value!');
    }

    if(str === '' || str === ' ') {
        throw new Error('Failed to parse string -> it was empty');
    }

    str = he.decode(str);
    str = str.replace(/(\r\n|\n|\r)/gm, '');

    if(str.length >= 127) {
        str = str.substring(0, 124);
        str += '...';
    }

    return str;
}

export function milliToTime(millis: string): number {
    let temp = Date.now();
    temp += Math.round(parseFloat(millis) * 1000);
    return temp;
}

export type SongPresenceData = {
    song: string;
    artist: string;
    album?: string;
    timeNow?: number;
    timeMax?: number;
    icon?: string;
    link?: string;
    isPlaying?: boolean;
};

export function makePresence(
    { song, artist, album, timeNow, timeMax, icon, link, isPlaying }: SongPresenceData,
    constants: IConstants
): Presence | null {
    song = stringify(song);
    artist = stringify(artist);

    if(!song || song === undefined || song.length < 1) {
        console.error('No song name was passed to `update`.');
        return null;
    }

    if(!artist || artist === undefined || artist.length < 1) {
        console.error('No artist was passed to `update`.');
        return null;
    }

    const currentTime = Date.now();
    const endTime = currentTime + (timeMax! - timeNow!); // Calculate the correct end time

    if(isPlaying) {
        return {
            details: song,
            state: `${ artist } ${ album ? '• ' + album : '' }`,
            startTimestamp: timeNow || 0,
            endTimestamp: endTime || 0,
            largeImageKey: icon || constants.images.default_img,
            largeImageText: song,
            smallImageKey: constants.images.play_img || undefined,
            smallImageText: constants.images.play_img !== undefined ? 'Playing' : undefined,
            buttons: [
                {
                    label: '▶ Listen on Youtube Music',
                    url: link || 'https://music.youtube.com'
                }
            ],
            instance: true
        };
    }
    else {
        return {
            details: `Paused: ${ song }`,
            state: `${ artist } ${ album ? '• ' + album : '' }`,
            largeImageKey: icon || constants.images.default_img,
            largeImageText: song,
            smallImageKey: constants.images.pause_img || undefined,
            smallImageText: constants.images.pause_img !== undefined ? 'Paused' : undefined,
            buttons: [
                {
                    label: '▶ Listen on Youtube Music',
                    url: link || 'https://music.youtube.com'
                }
            ],
            instance: true
        };
    }
}