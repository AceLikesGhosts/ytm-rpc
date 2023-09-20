import { config } from 'dotenv'; config();
import { RPCServer } from './servers/RPCServer';
import type { IConstants } from './types/Constants';
import { WSServer } from './servers/WSServer';

const Constants: IConstants = {
    using_ws: process.env.USING_WS === 'true' ? true : false,
    client_id: process.env.CLIENT_ID || '1075993095138713612',
    port: Number(process.env.PORT) || 2134,
    // holy 1 liner
    style: process.env.STYLE && ['show', 'hide'].includes(process.env.STYLE) ? process.env.STYLE as 'show' | 'hide' : undefined,
    images: {
        default_img: process.env.DEFAULT_IMG || 'ytm',
        pause_img: process.env.PAUSE_IMG || 'paused',
        play_img: process.env.PLAY_IMG || 'playing'
    }
} as const;

if(Constants.using_ws === true) {
    new WSServer(Constants).start();
}
else {
    new RPCServer(Constants).start();
}