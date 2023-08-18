import chalk from 'chalk';
import express, { type Application } from 'express';
import { makePresence, milliToTime } from '../utils';
import type { Presence } from 'discord-rpc';
import type { IConstants } from '../types/Constants';
import type { Server } from '../types/Server';

type ContentRequest = {
    song: string;
    artist: string;
    link: string;
    timeMax: string;
    timeNow: string;
    icon: string;
    isPaused: boolean;
};

export abstract class GenericServer implements Server {
    private readonly _opts: Readonly<IConstants>;
    public _app: Application;
    private _lastState: ContentRequest = {} as ContentRequest;

    public constructor(opts: Readonly<IConstants>) {
        this._opts = opts;

        this._app = express();
        this._app.use(express.json({ limit: '10mb' }));
    }

    public getApp(): Application {
        return this._app;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public abstract update(_presence: Presence): void;

    public start(): void {
        this._app.post('/', (req, res) => {
            const content: ContentRequest = req.body;

            if(content.song === undefined || content.song === null) {
                return res.status(400).json({
                    ok: false,
                    message: 'Missing required field `song`.'
                });
            }

            if(this._lastState && content === this._lastState) {
                return res.status(400).json({
                    ok: false,
                    message: 'Same exact state as last update.'
                });
            }

            /** @constant */
            const dataString =
                `${ content.song } • ${ content.artist.substring(0, content.artist.length - 6) } ${ content.timeMax.replace(' ', '') }`
                    .replace(/(\r\n|\n|\r)/gm, '')
                    .trim();

            if(this._lastState.song !== content.song) {
                console.log(`${ chalk.green('playing') } ${ dataString }`);
            }// else {
            //  console.log(`${chalk.green('updated')} ${dataString}`);
            // }

            this._lastState = content;
            this.update(
                makePresence(
                    {
                        song: content.song,
                        artist: content.artist,
                        timeNow: milliToTime(content.timeNow),
                        timeMax: milliToTime(content.timeMax),
                        icon: content.icon,
                        link: content.link,
                        isPlaying: !content.isPaused
                    },
                    this._opts
                )!
            );
            return res.status(200).json({
                ok: true,
                message: 'Updated RPC'
            });
        });

        this._app.listen(this._opts.port, () => {
            console.log(chalk.blue('started express application'));
        });
    }
}