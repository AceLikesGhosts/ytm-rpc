import Server from './Server';
import type Song from '../utils/Song';
import type { Application, WithWebsocketMethod } from 'express-ws';
import expressWS from 'express-ws';
import chalk from 'chalk';

export default class WSServer extends Server {
    private _expressWs: expressWS.Instance | undefined;

    public constructor() {
        super();

        process.on('SIGINT', () => {
            this._expressWs?.getWss().clients.forEach((client) => {
                client.send(JSON.stringify({
                    closing: true
                }));

                process.exit(0);
            });
        });
    }
    public override start(): void {
        this._expressWs = expressWS(this['express']);
        // we don't care what we send/get from here, ever!
        (this['express'] as Application & WithWebsocketMethod).ws('/', (ws, req) => {
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

    public update(song: Song | undefined): void {
        if(!song) {
            this._expressWs?.getWss().clients.forEach((client) => client.send('{}'));
            return;
        }

        this._expressWs?.getWss().clients.forEach((client) => client.send(JSON.stringify(song.toNative())));
    }
}