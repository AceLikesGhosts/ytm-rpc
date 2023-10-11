
import { milliToTime, stringify } from '../utils';
import type { IConstants } from '../types/Constants';
import type { Server } from '../types/Server';
import type { SongData } from '../types/SongData';
import express, { type Application } from 'express';
import chalk from 'chalk';
import cors from 'cors';

export abstract class GenericServer implements Server {
    private readonly _opts: Readonly<IConstants>;
    public _app: Application;
    private _lastState: SongData = {} as SongData;

    public constructor(opts: Readonly<IConstants>) {
        this._opts = opts;

        this._app = express();
        this._app.use(express.json({ limit: '10mb' }));
        this._app.use(cors());
    }

    public getApp(): Application {
        return this._app;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public abstract update(_presence: SongData<true> | undefined): void;

    public start(): void {
        this._app.post('/', (req, res) => {
            const content: SongData = req.body;

            if(content.song === undefined || content.song === null) {
                console.log(content.song === undefined || content.song === null);
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
                `${ stringify(content.song) } • ${ stringify(content.artist) } ${ content.timeMax }`
                    .trim();

            if(this._lastState.song !== content.song) {
                console.log(`${ chalk.green('playing') } ${ dataString }`);
            }// else {
            //  console.log(`${chalk.green('updated')} ${dataString}`);
            // }

            this._lastState = content;

            const viewsRegex = /\d{0,}(?:,\d{3})*(?:\.\d+)?[KM] views/gm;
            const matches = content.album!.match(viewsRegex);

            // if it matches, remove it.
            if(matches) {
                content.album = void 0;
            }

            if(content.isPaused) {
                if(this['_opts'].style === 'hide') {
                    this.update(undefined);
                }
                else {
                    this.update(
                        {
                            ...content,
                            timeNow: undefined,
                            timeMax: undefined
                        } as SongData<true>
                    );
                }
            }
            else this.update(
                {
                    ...content,
                    timeNow: milliToTime(content.timeNow!),
                    timeMax: milliToTime(content.timeMax!)
                } as SongData<true>
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