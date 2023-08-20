import { Logger, common, settings } from 'replugged';
const { fluxDispatcher } = common;

const logger = new Logger('Plugin', 'YTM');
export const pluginSettings = await settings.init<{
    port: number;
    intervalDurationSeconds: number;
}>('me.acelikesghosts.ytm');
let ws: WebSocket | undefined;
let reconnectInterval: NodeJS.Timeout;
// let getAsset: (key: string) => Promise<string>;

// Only the parts we care enough about to need typed
interface WebSocketData {
    assets: {
        large_image: string;
        small_image: string;
    };
}

function reconnectWS(reconnect: () => void): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    reconnectInterval = setTimeout(() => {
        logger.log('Attempting to reconnect to WebSoket server');
        reconnect();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    }, pluginSettings.get('intervalDurationSeconds', 15));
}

function connectWS(): void {
    if(typeof ws !== 'undefined') {
        if(ws.readyState === ws.OPEN) {
            logger.log('Closed WebSocket due to another call to `connectWS` occuring.');
            ws.close(1000, 'Replugged plugin requested shutdown in order to restart the client.');
        }
    }

    ws = new WebSocket('ws://localhost:' + pluginSettings.get('port', 2134));
    ws.onmessage = (ev: MessageEvent<string>) => handleMessage(ev);
    ws.onopen = () => {
        clearTimeout(reconnectInterval);
        logger.log('Connected WebSocekt');
    };

    ws.onclose = () => reconnectWS(connectWS);
}

function handleMessage(ev: MessageEvent<string>): void {
    logger.log('Recieved WebSocket message');

    const data: WebSocketData & { closing: string; } = JSON.parse(ev.data);

    if(data && data.closing) {
        logger.log('Master server shut down.');
        ws?.close(1000, 'Master server shutdown');
        fluxDispatcher.dispatch({
            type: 'LOCAL_ACTIVITY_UPDATE',
            activity: {}
        });
    }

    void setActivity(data);
}

async function setActivity(data: WebSocketData): Promise<void> {
    logger.log(`ASSETS: ${ JSON.stringify(data.assets) }`);
    const large = 'mp:' + data.assets.large_image;
    const small = 'mp:' + data.assets.small_image;

    data.assets.large_image = large;
    data.assets.small_image = small;

    logger.log('Updated activity');
    logger.log(data);

    fluxDispatcher.dispatch({
        type: 'LOCAL_ACTIVITY_UPDATE',
        activity: data
    });
}

// from BetterDiscord's source code/port of zeres plugin libs thing
// function byStrings(...strings: string[]) {
//     return (module: any) => {
//         if(!module?.toString || typeof (module?.toString) !== 'function') return; // Not stringable
//         let moduleString = '';
//         try { moduleString = module?.toString([]); }
//         catch(err) { moduleString = module?.toString(); }
//         if(!moduleString) return false; // Could not create string
//         for(const s of strings) {
//             if(!moduleString.includes(s)) return false;
//         }
//         return true;
//     };
// }



export async function start(): Promise<void> {
    // const filter = byStrings('getAssetImage: size must === [number, number] for Twitch');
    // const assetManager: Record<string, any> = webpack.getModule((m: Record<string, unknown>) => typeof m === 'object' && Object.values(m).some(filter))!;

    // let foundGetAsset: (clientId: string, thing: [key: string, undef: undefined]) => Promise<string[]>;

    // for(const key in assetManager) {
    //     const member = assetManager[key];
    //     if(member.toString().includes('apply(')) {
    //         foundGetAsset = member;
    //         break;
    //     }
    // }

    // getAsset = async (key: string) => {
    //     return (await foundGetAsset('1075993095138713612', [key, undefined]))[0];
    // };

    connectWS();
}

export function stop(): void {
    if(ws && (ws.readyState !== ws.CLOSED && ws.readyState !== ws.CLOSING)) {
        ws.onclose = null;
        ws.close(1000, 'Replugged plugin shut down');
        ws = void 0;
        logger.log('Closed WebSocket due to plugin shutting down.');
    }
}

