import chalk from 'chalk';
import { Client, type Presence } from 'discord-rpc';
import { makePresence } from '../utils';
import { GenericServer } from './GenericServer';
import type { IConstants } from '../types/Constants';

export class RPCServer extends GenericServer {
    private readonly _rpc: Client;

    public constructor(opts: Readonly<IConstants>) {
        super(opts);
        this._rpc = new Client({ transport: 'ipc' });

        this._rpc.on('ready', () => {
            console.log(chalk.blue('rpc client ready'));
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
        });

        void this._rpc.login({ clientId: opts.client_id });
    }

    public override update(presence: Presence): void {
        void this._rpc.setActivity(presence);
    }
}