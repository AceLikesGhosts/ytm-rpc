import type { Application, WithWebsocketMethod } from 'express-ws';
import type { SongData } from '../types/SongData';
import type { IConstants } from '../types/Constants';
import { GenericServer } from './GenericServer';
import expressWS from 'express-ws';
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
        (this._app as Application & WithWebsocketMethod).ws('/', (ws, req) => {
            console.log(chalk.blue(`WebSocket (${ req.socket.remoteAddress }) connected to WS server`));
            ws.on('close', (code, reason) => {
                // we use 1000 to signify the websocket was turned off on the
                // plugin side
                if(code !== 1000) {
                    console.error(chalk.red(`Websocket (${ req.socket.remoteAddress }) closed connection: ${ reason }`));
                }
                else {
                    console.log(chalk.blue(`Websocket (${ req.socket.remoteAddress }) closed connection: ${ reason }`));
                }
            });
        });

        console.log(chalk.blue('added websocket server to express instance'));

        super.start();
    }

    public fixPresence(presence: SongData<true>): DiscordPresence {
        /**
         * The way that it will be displayed on the client is:
         * 
         * Listening to (name)
         * Details
         * State
         * Large Image Text
         */
        const rp: DiscordPresence = {} as DiscordPresence;
        // required
        rp.application_id = this['_opts'].client_id;
        rp.type = 2;
        rp.flags = 1;

        rp.timestamps = {
            start: presence.timeNow,
            end: presence.timeMax
        };

        rp.assets = {
            large_text: `on ${ presence.album }`,
            small_text: presence.isPaused && this['_opts'].images.pause_img !== undefined ? 'Paused' : '',
            large_image: presence.icon || this['_opts'].images.default_img,
            small_image: ''
        };

        if(presence.isPaused) {
            rp.assets.small_image = this['_opts'].images.pause_img ?? '';
        }
        else {
            rp.assets.small_image = this['_opts'].images.play_img ?? '';
        }

        rp.buttons = [
            '▶ Listen on Youtube Music'
        ];
        rp.metadata = {
            button_urls: [
                presence.link
            ]
        };

        rp.name = `${ presence.artist } • ${ presence.song }`;
        rp.details = presence.song ?? 'Unknown';
        rp.state = `by ${ presence.artist ?? 'Unknown' }`;

        return rp;
    }

    public override update(presence: SongData<true>): void {
        const fixedPresence = this.fixPresence(presence);
        this._expressWs?.getWss().clients.forEach((client) => {
            client.send(JSON.stringify(fixedPresence));
        });
    }
}
