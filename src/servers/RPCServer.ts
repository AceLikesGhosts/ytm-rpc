import Server from './Server';
import chalk from 'chalk';
import { Client } from 'discord-rpc';
import type Song from '../utils/Song';

export default class RPCServer extends Server {
    private readonly _rpc: Client;

    public constructor() {
        super();
        this._rpc = new Client({ transport: 'ipc' });

        this._rpc.on('ready', () => {
            console.log(chalk.blue('rpc client ready'));
        });
    }

    public update(song: Song | undefined): void {
        void this._rpc.setActivity(song?.toPresence() ?? void 0);
    }
}