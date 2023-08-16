import type { Application, WithWebsocketMethod } from 'express-ws';
import expressWS from 'express-ws';
import { type Presence } from 'discord-rpc';
import { makePresence } from '../utils';
import { GenericServer } from './GenericServer';
import type { IConstants } from '../types/Constants';
import chalk from 'chalk';

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
            )!
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

    public override update(presence: Presence): void {
        this._expressWs?.getWss().clients.forEach((client) => {
            client.send(JSON.stringify(presence));
        });

        return void 0;
    }
}