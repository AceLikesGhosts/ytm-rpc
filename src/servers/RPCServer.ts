import chalk from 'chalk';
import type { Presence } from 'discord-rpc';
import type { SongData } from 'src/types/SongData';
import type { IConstants } from '../types/Constants';
import { Client } from 'discord-rpc';
import { GenericServer } from './GenericServer';
import { stringify } from '../utils';

export class RPCServer extends GenericServer {
    private readonly _rpc: Client;

    public constructor(opts: Readonly<IConstants>) {
        super(opts);
        this._rpc = new Client({ transport: 'ipc' });

        this._rpc.on('ready', () => {
            console.log(chalk.blue('rpc client ready'));
            this.update(
                {
                    album: this['_opts'].images.default_img,
                    artist: 'Waiting for music..',
                    song: 'Nothing playing',
                    icon: this['_opts'].images.default_img,
                    link: 'https://music.youtube.com',
                    timeMax: undefined,
                    timeNow: undefined,
                    isPaused: false
                }
            );
        });

        void this._rpc.login({ clientId: opts.client_id });
    }

    public override update(presence: SongData<true> | undefined): void {
        if(!presence) {
            void this._rpc.setActivity(void 0);
            return;
        }

        let discordPresence: Presence = {};

        const song = stringify(presence.song);
        const artist = stringify(presence.artist);
        const album = stringify(presence.album);

        if(!song || song === undefined || song.length < 1) {
            console.error('No song name was passed to `update`.');
            return;
        }

        if(!artist || artist === undefined || artist.length < 1) {
            console.error('No artist was passed to `update`.');
            return;
        }

        const currentTime = Date.now();
        const endTime = currentTime + (presence.timeMax! - presence.timeNow!); // Calculate the correct end time

        if(!presence.isPaused) {
            discordPresence = {
                details: song,
                state: `${ artist } ${ album ? '• ' + album : '' }`,
                startTimestamp: presence.timeNow || 0,
                endTimestamp: endTime || 0,
                largeImageKey: presence.icon || this['_opts'].images.default_img,
                largeImageText: song,
                smallImageKey: this['_opts'].images.play_img || undefined,
                smallImageText: this['_opts'].images.play_img !== undefined ? 'Playing' : undefined,
                buttons: [
                    {
                        label: '▶ Listen on Youtube Music',
                        url: presence.link || 'https://music.youtube.com'
                    }
                ],
                instance: true
            };
        }
        else {
            discordPresence = {
                details: `Paused: ${ song }`,
                state: `${ artist } ${ album ? '• ' + album : '' }`,
                largeImageKey: presence.icon || this['_opts'].images.default_img,
                largeImageText: song,
                smallImageKey: this['_opts'].images.pause_img || undefined,
                smallImageText: this['_opts'].images.pause_img !== undefined ? 'Paused' : undefined,
                buttons: [
                    {
                        label: '▶ Listen on Youtube Music',
                        url: presence.link || 'https://music.youtube.com'
                    }
                ],
                instance: true
            };
        }

        void this._rpc.setActivity(discordPresence || void 0);
    }
}