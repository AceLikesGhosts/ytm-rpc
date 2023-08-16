import type { Application, WithWebsocketMethod } from 'express-ws';
import expressWS from 'express-ws';
import { type Presence } from 'discord-rpc';
import type { SongPresenceData} from '../utils';
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

        const actualArtist: string = presence.state!.substring(0, presence.state!.indexOf('•'));

        rp.application_id = ((<any>this)._opts).client_id;
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
        rp.name = actualArtist + ' - ' + original && original?.song ? original.song : presence.details ? presence.details : 'Undefined';
        rp.details = original?.song ? original.song : presence.details ? presence.details : 'Undefined';
        rp.state = presence.state ? presence.state.replace('•', '-') : 'Unknown';
        rp.type = 2; // Listening to
        rp.flags = 1; // no clue tbh but its needed to work

        return rp;
    }

    public override update(presence: Presence, original: SongPresenceData | null): void {
        const fixedPresence = this.fixPresence(presence, original);
        this._expressWs?.getWss().clients.forEach((client) => {
            client.send(JSON.stringify(fixedPresence));
        });

        return void 0;
    }
}