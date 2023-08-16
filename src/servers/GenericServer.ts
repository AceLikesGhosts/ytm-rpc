import chalk from 'chalk';
import express, { type Application } from 'express';
import { type Presence } from 'discord-rpc';
import type { Globals } from '../types/Globals';
import type { Server } from '../types/Server';
import { makePresence, milliToTime } from '../utils';

type ContentRequest = {
    song: string;
    artist: string;
    link: string;
    timeMax: string;
    timeNow: string;
    icon: string;
    isPaused: boolean;
};

export class GenericServer implements Server {
    private readonly _opts: Readonly<Globals>;
    private readonly _app: Application;
    private _lastState: ContentRequest = {} as ContentRequest;

    public constructor(opts: Readonly<Globals>) {
        this._opts = opts;

        this._app = express();
        this._app.use(express.json({ limit: '10mb' }));
    }

    public update(_presence: Presence): void {
        throw new Error('`update` on `Server` is not implemented.');
    }

    public start(): void {
        this._app.post('/', (req, res) => {
            const content: ContentRequest = req.body;

            if(content.song == undefined || content.song == null) {
                return res.status(400).json({
                    ok: false,
                    message: 'Missing required field `song`.'
                });
            }

            if(JSON.stringify(content) === JSON.stringify(this._lastState)) {
                return res.status(400).json({
                    ok: false,
                    message: 'Same exact state as last update.'
                });
            }

            /** @constant */
            const dataString =
                `${content.song} • ${content.artist.substring(0, content.artist.length - 6)} ${content.timeMax.replace(' ', '')}`
                    .replace(/(\r\n|\n|\r)/gm, '')
                    .trim();

            if(this._lastState.song !== content.song) {
                console.log(`${chalk.green('playing')} ${dataString}`);
            }// else {
            //  console.log(`${chalk.green('updated')} ${dataString}`);
            // }

            this._lastState = content;
            this.update(
                makePresence(
                    content.song,
                    content.artist,
                    milliToTime(content.timeNow),
                    milliToTime(content.timeMax),
                    content.icon,
                    content.link,
                    !content.isPaused
                )!
            );
            res.status(200).json({
                ok: true,
                message: 'Updated RPC'
            });
            return;
        });

        this._app.listen(this._opts.port, () => {
            console.log(chalk.blue('started express application'));
        });
    }
}