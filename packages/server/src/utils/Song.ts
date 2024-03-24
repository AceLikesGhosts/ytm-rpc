import { Constants } from '../';
import { milliToTime, stringify } from '.';
import type { Presence } from 'discord-rpc';
import type { Content } from '../servers/Server';

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
    private readonly data: Content;

    public constructor(content: Content) {
        // preform the weird mutations before settings anything
        if(content.album) content.album = stringify(content.album, 'Song::album_parsing_1');
        else content.album = 'Unknown';
        content.song = stringify(content.song, 'Song::song');
        content.artist = stringify(content.artist, 'Song::artist');

        /**
         * Parses the album text to see if it contains a view counter which indicates it's a video and not a song
         * For example:
         * 150K views -> true
         * 5M views -> true
         */
        const viewsRegex = /\d{0,}(?:,\d{3})*(?:\.\d+)?[KM] views/gm;
        const matches = content.album.match(viewsRegex);

        // if it contains a view counter remove the album
        if(matches) {
            (content.album as unknown) = void 0;
        }

        // time mutations
        content.timeMax = milliToTime(content.timeMax);

        this.data = content;
    }

    get isPaused(): boolean {
        return this.data.isPaused as boolean;
    }

    get endTime(): number {
        const currentTime = Date.now();
        const endTime = currentTime + (this.data.timeMax - this.data.timeNow); // Calculate the correct end time
        return endTime;
    }

    public toPresence(): Presence {
        const albumText: string = this.data.album ? `• ${ this.data.album }` : '';
        const icon: string = this.data.icon || Constants.images.default_img;
        const link: string = this.data.link || 'https://music.youtube.com';

        if(this.isPaused) {
            return {
                details: `Paused: ${ this.data.song }`,
                state: `${ this.data.artist } ${ albumText }`,
                largeImageKey: icon,
                largeImageText: this.data.song,
                smallImageKey: Constants.images.pause_img,
                smallImageText: 'Paused',
                buttons: [
                    {
                        label: '▶ Listen on Youtube Music',
                        url: link
                    }
                ],
                instance: true
            };
        }

        return {
            details: this.data.song,
            state: `${ this.data.artist } ${ albumText }`,
            startTimestamp: this.data.timeNow || 0,
            endTimestamp: this.endTime || 0,
            largeImageKey: icon,
            largeImageText: this.data.song,
            smallImageKey: Constants.images.play_img,
            smallImageText: 'Playing',
            buttons: [
                {
                    label: '▶ Listen on Youtube Music',
                    url: link
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
        // if(this.data.timeMax == undefined && this.data.timeNow == undefined) {
        //     rp.timestamps = {
        //         start: this.data.timeNow,
        //         end: this.endTime
        //     };
        // }

        rp.assets = {
            large_text: `${ this.data.album ? `on ${ this.data.album }` : 'As video' }`,
            small_text: '',
            large_image: this.data.icon || Constants.images.default_img,
            small_image: ''
        };

        if(this.data.isPaused) {
            rp.assets.small_image = Constants.images.pause_img;
            rp.assets.small_text = 'Paused';
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

        rp.name = Constants.show_song_title ? `${ this.data.artist ? this.data.artist.concat(' • ') : '' }${ this.data.song }` : 'Youtube Music';
        rp.details = this.data.song ?? 'Unknown';
        rp.state = `by ${ this.data.artist ?? 'Unknown' }`;

        return rp;
    }
}