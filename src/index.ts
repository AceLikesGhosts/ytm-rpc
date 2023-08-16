import { config } from 'dotenv'; config();
import { RPCServer } from './servers/RPCServer';
import type { IConstants } from './types/Constants';
import { WSServer } from './servers/WSServer';

const Constants: IConstants = {
    using_bd_plugin: Boolean(process.env.USING_BD_PLUGIN) || false,
    client_id: process.env.CLIENT_ID || '1075993095138713612',
    port: Number(process.env.PORT) || 2134,
    images: {
        default_img: process.env.DEFAULT_IMG || 'ytm',
        pause_img: process.env.PAUSE_IMG || 'paused',
        play_img: process.env.PLAY_IMG || 'playing'
    }
} as const;

Constants.using_bd_plugin ?
    new WSServer(Constants).start()
    : new RPCServer(Constants).start();