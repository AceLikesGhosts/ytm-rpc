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

    private makePresence(
        { song, artist, album, timeNow, timeMax, icon, link, isPaused }: SongData<true>
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

        if(!isPaused) {
            return {
                details: song,
                state: `${artist} ${album ? '• ' + album : ''}`,
                startTimestamp: timeNow || 0,
                endTimestamp: endTime || 0,
                largeImageKey: icon || this['_opts'].images.default_img,
                largeImageText: song,
                smallImageKey: this['_opts'].images.play_img || undefined,
                smallImageText: this['_opts'].images.play_img !== undefined ? 'Playing' : undefined,
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
                details: `Paused: ${song}`,
                state: `${artist} ${album ? '• ' + album : ''}`,
                largeImageKey: icon || this['_opts'].images.default_img,
                largeImageText: song,
                smallImageKey: this['_opts'].images.pause_img || undefined,
                smallImageText: this['_opts'].images.pause_img !== undefined ? 'Paused' : undefined,
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

    public override update(presence: SongData<true>): void {
        void this._rpc.setActivity(this.makePresence(presence) ?? void 0);
    }
}