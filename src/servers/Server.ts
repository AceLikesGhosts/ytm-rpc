import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import type { Application } from 'express';
import Song from '../utils/Song';
import { Constants } from '../';

export type Content = {
    song: string;
    artist: string;
    album: string;
    icon: string;
    timeMax: number;
    timeNow: number;
    isPaused: boolean;
    link: string;
};

export default abstract class Server {
    private readonly express: Application;
    private _lastSong: Song | undefined;

    public constructor() {
        this.express = express();
        this.express.use(express.json());
        this.express.use(cors());
    }

    public abstract update(song: Song | undefined): void;

    public start(): void {
        this.express.post('/', (req, res) => {
            const content: Content = req.body;

            if(!content || !content.song) {
                res.json({
                    ok: false,
                    message: 'No content provided.'
                });

                return;
            }

            const song = new Song(content);

            if(song === this._lastSong) {
                res.json({
                    ok: false,
                    message: 'Same as last song data'
                });

                return;
            }


            if((!this._lastSong) || (this._lastSong!['data']?.song !== song['data']?.song)) {
                // if(this._lastSong && this._lastSong!['s_song'] !== song['s_song']) {
                console.log(`${ chalk.green('playing') } ${ song['data']?.song } by ${ song['data']?.artist } ${ song['data']['album'] ? `on ${ song['data']['album'] }` : '' } for ${ content.timeMax }`);
            }

            this._lastSong = song;

            if(song.isPaused && Constants.style === 'hide') {
                this.update(void 0);
                return;
            }

            this.update(song);
            res.status(200).json({
                ok: true,
                message: 'Updated RPC'
            });
        });

        const server = this.express.listen(Constants.port, () => {
            console.log(chalk.blue(`started express application @ localhost:${ Constants.port }`));
        });

        server.setTimeout(1000 * 60 * 10);
    }
}