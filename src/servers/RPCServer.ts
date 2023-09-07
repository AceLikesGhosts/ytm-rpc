import chalk from 'chalk';
import type { Presence } from 'discord-rpc';
import { Client } from 'discord-rpc';
import { GenericServer } from './GenericServer';
import type { IConstants } from '../types/Constants';
import type { SongData } from 'src/types/SongData';
import { stringify } from '../utils';

type SongPresenceData = {
    song: string;
    artist: string;
    album?: string;
    timeNow?: number;
    timeMax?: number;
    icon?: string;
    link?: string;
    isPlaying?: boolean;
};

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
                    icon: undefined,
                    link: undefined,
                    timeMax: undefined,
                    timeNow: undefined,
                    isPlaying: true
                }
                // makePresence(
                //     {
                //         song: 'Nothing playing',
                //         artist: 'Waiting for music..      ',
                //         icon: undefined,
                //         link: undefined,
                //         timeMax: undefined,
                //         timeNow: undefined,
                //         isPlaying: true
                //     },
                //     opts
                // )!
            );
        });

        void this._rpc.login({ clientId: opts.client_id });
    }

    public override update(presence: SongData<true> | SongPresenceData): void {
        function makePresence(
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

        void this._rpc.setActivity(makePresence(presence, this['_opts'])!);
    }
}