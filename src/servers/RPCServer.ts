import { Client, type Presence } from 'discord-rpc';
import { GenericServer } from './GenericServer';
import type { Globals } from '../types/Globals';
import chalk from 'chalk';
import { makePresence } from '../utils';

export class RPCServer extends GenericServer {
    private readonly _rpc: Client;

    public constructor(opts: Readonly<Globals>) {
        super(opts);
        this._rpc = new Client({ transport: 'ipc' });

        this._rpc.on('ready', () => {
            console.log(chalk.blue('rpc client ready'));
            this.update(
                makePresence(
                    'Nothing playing',
                    'Waiting for music..      ',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    true
                )!
            );
        });

        this._rpc.login({ clientId: opts.client_id });
    }

    public override update(presence: Presence): void {
        this._rpc.setActivity(presence);
    }
}