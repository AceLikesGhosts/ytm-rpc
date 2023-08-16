import { config } from 'dotenv'; config();
import { RPCServer } from './servers/RPCServer';
import type { Globals as IGlobals } from './types/Globals';

export const Globals: IGlobals = {
    client_id: process.env.CLIENT_ID || '1075993095138713612',
    port: Number(process.env.PORT) || 2134,
    images: {
        default_img: process.env.DEFAULT_IMG || 'ytm',
        pause_img: process.env.PAUSE_IMG || 'paused',
        play_img: process.env.PLAY_IMG || 'playing'
    }
};

// TODO: logic to decide what server to use
new RPCServer(Globals).start();