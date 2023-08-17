import type { Application, WithWebsocketMethod } from 'express-ws';
import expressWS from 'express-ws';
import { type Presence } from 'discord-rpc';
import type { SongPresenceData } from '../utils';
import { makePresence } from '../utils';
import { GenericServer } from './GenericServer';
import type { IConstants } from '../types/Constants';
import chalk from 'chalk';

type DiscordPresence = {
    application_id: string;
    buttons: string[];
    details: string;
    name: string;
    state: string;
    metadata: {
        button_urls: string[];
    };
    assets: {
        large_image: string;
        large_text: string;
        small_image: string;
        small_text: string;
    },
    timestamps: {
        start: number;
        end: number;
    };
    type: number;
    flags: number;
};

export class WSServer extends GenericServer {
    private _expressWs: expressWS.Instance | undefined;

    public constructor(opts: Readonly<IConstants>) {
        super(opts);

        this.update(
            makePresence(
                {
                    song: 'Nothing playing',
                    artist: 'Waiting for music..      ',
                    icon: undefined,
                    link: undefined,
                    timeMax: undefined,
                    timeNow: undefined,
                    isPlaying: true
                },
                opts
            )!,
            null
        );

        process.on('SIGINT', () => {
            this._expressWs?.getWss().clients.forEach((client) => {
                client.send(JSON.stringify({
                    closing: true
                }));
            });

            process.exit(0);
        });
    }

    public override start(): void {
        this._expressWs = expressWS(this._app);
        this._app = this._expressWs.app;

        // we don't care what we send/get from here, ever!
        (this._app as Application & WithWebsocketMethod).ws('/', () => void 0);
        console.log(chalk.blue('added websocket server to express instance'));

        super.start();
    }

    public fixPresence(presence: Presence, original: SongPresenceData | null): DiscordPresence {
        const rp: DiscordPresence = {} as DiscordPresence;

        rp.application_id = ((<any>this)._opts).client_id;
        rp.timestamps = {
            start: presence.startTimestamp as number,
            end: presence.endTimestamp as number
        };
        rp.assets = {
            large_image: presence.largeImageKey!,
            large_text: presence.largeImageText!,
            small_image: presence.smallImageKey!,
            small_text: presence.smallImageText!
        };
        rp.buttons = [
            ...presence.buttons!.map((button) => button.label)
        ];
        rp.metadata = {
            button_urls: [
                ...presence.buttons!.map((button) => button.url)
            ]
        };
        const splitStr: string[] | undefined = original?.artist?.split('•') || presence.state?.split('•');
        const actualArtist = splitStr![0];
        // const actualAlbum = splitStr![1];

        // rp.name = actualArtist + ' - ' + original && original?.song ? original.song : presence.details || 'Unknown';
        rp.name = `${ actualArtist } • ${ original && original.song ? original.song : presence.details }`;
        // rp.details = original?.song ? original.song : presence.details ? presence.details : 'Undefined';
        // rp.state = presence.state ? presence.state.replace('•', '-') : 'Unknown';
        // rp.state = 'By ' + actualArtist;
        rp.details = original && original.song ? original.song : presence && presence.details ? presence.details : 'Unknown';
        rp.state = `by ${ actualArtist }`;
        rp.type = 2; // Listening to
        rp.flags = 1;

        return rp;
    }

    public override update(presence: Presence, original: SongPresenceData | null): void {
        if(presence.largeImageKey === this['_opts'].images.default_img) {
            return;
        }

        const fixedPresence = this.fixPresence(presence, original);
        this._expressWs?.getWss().clients.forEach((client) => {
            client.send(JSON.stringify(fixedPresence));
        });

        return void 0;
    }
}