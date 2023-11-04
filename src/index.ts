import type { IConstants } from './types/Constants';
import { config } from 'dotenv'; config();
import { RPCServer } from './servers/RPCServer';
import { WSServer } from './servers/WSServer';
import { join } from 'path';
import Updater from './updater';

const Constants: IConstants = {
    using_ws: process.env.USING_WS === 'true' ? true : false,
    client_id: process.env.CLIENT_ID || '1075993095138713612',
    port: Number(process.env.PORT) || 2134,
    // holy 1 liner
    style: process.env.STYLE && ['show', 'hide'].includes(process.env.STYLE) ? process.env.STYLE as 'show' | 'hide' : undefined,
    show_song_title: process.env.SHOW_TITLE?.toLowerCase() === 'true' ? true : false,
    images: {
        default_img: process.env.DEFAULT_IMG || 'ytm',
        pause_img: process.env.PAUSE_IMG || 'paused',
        play_img: process.env.PLAY_IMG || 'playing'
    }
} as const;

void new Updater(
    'acelikesghosts',
    'ytm-rpc',
    join(__dirname, '..')
).checkForUpdates();

if(Constants.using_ws === true) {
    new WSServer(Constants).start();
}
else {
    new RPCServer(Constants).start();
}