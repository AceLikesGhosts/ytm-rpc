/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Constants } from '../';
import { milliToTime, stringify } from '.';
import type { Presence } from 'discord-rpc';

type DiscordPresence = {
    application_id: string;
    buttons: string[];
    details: string;
    name: string;
    state: string;
    metadata?: {
        button_urls: string[];
    };
    assets?: {
        large_image: string;
        large_text: string;
        small_image: string;
        small_text: string;
    },
    timestamps?: {
        start: number;
        end: number;
    };
    type: number;
    flags: number;
};

export default class Song {
    private readonly data: any;
    private readonly s_song: string;
    private readonly s_artist: string;

    public constructor(content: any) {
        // preform the weird mutations before settings anything
        content.album ??= 'Unknown';
        content.album = stringify(content.album!, 'Song::album_parsing_1');
        const viewsRegex = /\d{0,}(?:,\d{3})*(?:\.\d+)?[KM] views/gm;
        const matches = content.album!.match(viewsRegex);

        // if it matches, remove it.
        if(matches) {
            (content.album as unknown) = void 0;
        }

        // time mutations
        content.timeMax = milliToTime(content.timeMax);

        this.data = content;
        this.s_song = stringify(content.song!, 'Song::s_song');
        this.s_artist = stringify(content.artist!, 'Song::s_song');
    }

    get isPaused(): boolean {
        return this.data.isPaused as boolean;
    }

    get endTime(): number {
        const currentTime = Date.now();
        const endTime = currentTime + (this.data.timeMax! - this.data.timeNow!); // Calculate the correct end time
        return endTime;
    }

    public toPresence(): Presence {
        if(this.isPaused) {
            return {
                details: `Paused: ${ this.s_song }`,
                state: `${ this.s_artist } ${ this.data.album ? '• ' + this.data.album : '' }`,
                largeImageKey: this.data.icon || Constants.images.default_img,
                largeImageText: this.s_song,
                smallImageKey: Constants.images.pause_img || undefined,
                smallImageText: Constants.images.pause_img !== undefined ? 'Paused' : undefined,
                buttons: [
                    {
                        label: '▶ Listen on Youtube Music',
                        url: this.data.link || 'https://music.youtube.com'
                    }
                ],
                instance: true
            };
        }

        return {
            details: this.s_song,
            state: `${ this.s_artist } ${ this.data.album ? '• ' + this.data.album : '' }`,
            startTimestamp: this.data.timeNow || 0,
            endTimestamp: this.endTime || 0,
            largeImageKey: this.data.icon || Constants.images.default_img,
            largeImageText: this.s_song,
            smallImageKey: Constants.images.play_img || undefined,
            smallImageText: Constants.images.play_img !== undefined ? 'Playing' : undefined,
            buttons: [
                {
                    label: '▶ Listen on Youtube Music',
                    url: this.data.link || 'https://music.youtube.com'
                }
            ],
            instance: true
        };
    }

    public toNative(): DiscordPresence {
        const rp: DiscordPresence = {} as DiscordPresence;

        rp.application_id = Constants.client_id;
        rp.type = 2;
        rp.flags = 1;

        // discord doesnt display it so there is no point in sending it
        // if(this.data.timeMax !== undefined && this.data.timeNow !== undefined) {
        //     rp.timestamps = {
        //         start: this.data.timeNow,
        //         end: this.endTime
        //     };
        // }

        rp.assets = {
            large_text: `on ${ this.data.album }`,
            small_text: '',
            large_image: this.data.icon || Constants.images.default_img,
            small_image: ''
        };

        if(this.data.isPaused) {
            rp.assets.small_image = Constants.images.pause_img;
            rp.assets.small_text = 'Pauesd';
        }
        else {
            rp.assets.small_image = Constants.images.play_img;
            rp.assets.small_text = 'Playing';
        }

        rp.buttons = [
            '▶ Listen on Youtube Music'
        ];

        rp.metadata = {
            button_urls: [
                this.data.link
            ]
        };

        rp.name = Constants.show_song_title ? `${ this.s_artist } • ${ this.s_song }` : 'Youtube Music';
        rp.details = this.s_song ?? 'Unknown';
        rp.state = `by ${ this.data.artist ?? 'Unknown' }`;

        return rp;
    }
}