import chalk from 'chalk';
import { type Presence } from 'discord-rpc';
import { makePresence } from '../utils';
import { GenericServer } from './GenericServer';
import type { IConstants } from '../types/Constants';

export class WSServer extends GenericServer {
    public constructor(opts: Readonly<IConstants>) {
        super(opts);

        console.log(chalk.blue('ws server ready'));
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

    public override update(presence: Presence): void {
        return void 0;
    }
}