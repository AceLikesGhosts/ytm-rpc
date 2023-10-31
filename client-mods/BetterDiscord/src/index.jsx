/**
 * @name YTMTEST
 * @description A simple WebSocket connection to a local YTM-RPC server, to display your Youtube Music data more.. "properly"
 * @version 1.0.0
 * @author ace.
 */
module.exports = class YTM extends BdApi.React.Component {
    defaultSettings = {
        // default settings
        port: 2134,
        clientId: '1075993095138713612',
        reconnectionTimeout: 15,
        timeBar: false
    };

    /** 
     * WebSocket connection to the server (started on plugin start)
     * @type {WebSocket}
     */
    ws = void 0;

    /**
     * @type {{
     *  port: number;
     *  reconnectionTimeout: number;
     *  clientId: string;
     *  timeBar: boolean;
     * }}
     */
    settings = void 0;

    /**
     * Discord's React components (found on start)
     * @type {any}
     */
    components = void 0;

    /**
     * Discord's margin classes
     * @type {Record<string, unknown>}
     */
    margins = void 0;

    /**
     * Discord's Dispatcher
     * @type {{ dispatch: ( data: { type: string } & Record<string, unknown> ) => void | Promise<void> }}
     */
    dispatcher = void 0;

    /**
     * Discord's activity renderer
     * @type { { prototype: { renderTimeBar: () => JSX.Element } } }
     */
    activityRenderer = void 0;

    /**
     * Turns external links into Discord's cached links for activities
     * @type {(url: string) => Promise<string>}
     */
    getAsset = void 0;

    /**
     * Stores the interval we are using to attempt to reconnect to the WebSocket
     * @see ws
     * @type {NodeJS.Timeout}
     */
    reconnectInterval = void 0;

    /**
     * Sets the activity.
     * @param {{ assets: { large_image: string; small_image: string } }} activity 
     */
    async setActivity(activity) {
        const large = activity.assets.large_image ? await this.getAsset(activity.assets.large_image) : undefined;
        const small = activity.assets.small_image ? await this.getAsset(activity.assets.small_image) : undefined;

        activity.assets.large_image = large;
        activity.assets.small_image = small;

        console.log('[YTM] Updated activity', activity);
        void this.dispatcher.dispatch({
            type: 'LOCAL_ACTIVITY_UPDATE',
            activity,
            socketId: 'YoutubeMusicRPC'
        });
    }

    /**
     * @param {{ data: string }} ev 
     */
    handleWSMessage(ev) {
        console.log('[YTM] Recieved Websocket message');

        // If we get sent nothing, get the fuck out
        if(ev.data === '{}') {
            void this.dispatcher.dispatch({
                type: 'LOCAL_ACTIVITY_UPDATE',
                activity: {},
                socketId: 'YoutubeMusicRPC'
            });

            return;
        }

        const data = JSON.parse(ev.data);

        if(data && data.closing) {
            console.log('[YTM] Master server shut down.');
            this.ws.close(1000, 'Master server shutdown');
            void this.dispatcher.dispatch({
                type: 'LOCAL_ACTIVITY_UPDATE',
                activity: {},
                socketId: 'YoutubeMusicRPC'
            });
            return;
        }

        // I DONT CARE!
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        void this.setActivity(data);
    }
    
    connectWS() {
        if(this.isWebsocketOpen()) {
            this.ws.onclose = null;
            this.ws.close(1000, 'BetterDiscord restarted WS conection while it was running (will reconnect soon)');
            // wait 2s before reconnecting
            return setTimeout(() => {
                this.connectWS();
            }, 2 * 1000);
        }

        this.ws = new WebSocket(`ws://localhost:${this.settings.port}`);
        this.ws.onclose = this.wsOnClose.bind(this);
        this.ws.onmessage = this.handleWSMessage.bind(this);
        this.ws.onopen = () => {
            clearInterval(this.reconnectInterval);
            console.log('[YTM] Connected WebSocket');
        };
    }

    wsOnClose() {
        this.reconnectInterval = setTimeout(() => {
            console.log('[YTM] Attempting to reconnect the WebSocket');
            this.connectWS();
        }, this.settings.reconnectionTimeout * 1000);
    }

    isWebsocketOpen() {
        return this.ws && (this.ws.readyState !== WebSocket.CLOSING && this.ws.readyState !== WebSocket.CLOSED);
    }

    start() {
        this.dispatcher = BdApi.Webpack.getByKeys('dispatch', '_subscriptions');
        this.settings = BdApi.loadData('YTM', 'Settings') || this.defaultSettings;

        this.activityRenderer = BdApi.Webpack.getByStrings('renderTimeBar');
        this.components = BdApi.Webpack.getByKeys('Button', 'Switch', 'Select');
        this.margins = BdApi.Webpack.getByKeys('marginBottom40', 'marginTop4');

        // #region getAsset 
        /**
         * This section of code is licensed under the following license, found below.
         * @license MIT License
         * Copyright (c) 2022 dimden
         * [More Information Here](https://choosealicense.com/licenses/mit/)
         */
        // https://github.com/Riddim-GLiTCH/BDLastFMRPC/blob/main/LastFMRichPresence.plugin.js
        // i love you
        const filter = BdApi.Webpack.Filters.byStrings('getAssetImage: size must === [number, number] for Twitch');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        // @ts-expect-error I DONT CARE
        const assetManager = BdApi.Webpack.getModule((/** @type {Record<string, unknown>} */ m) => typeof m === 'object' && Object.values(m).some(filter));
        let foundGetAsset;
        for(const key in assetManager) {
            const member = assetManager[key];
            if(member.toString().includes('APPLICATION_ASSETS_FETCH_SUCCESS')) {
                foundGetAsset = member;
                break;
            }
        }
        this.getAsset = async key => {
            return (await foundGetAsset('1075993095138713612', [key, undefined]))[0];
        };
        // #endregion

        this.connectWS();
    }

    stop() {
        console.log('[YTM] Stopping plugin.');

        // disconnect from WS server
        if(!this.isWebsocketOpen()) {
            // Remove our handler that attempts to reconnect
            this.ws.onclose = void 0;
            // close the websocket with a nice message
            this.ws.close(1000, 'BetterDiscord plugin shut down.');
            // yeet that mf
            this.ws = void 0;
        }

        // if we are waiting for the interval (allows for us to stop the interval on plugin stop)
        if(this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = void 0;
        }

        // remove RPC
        void this.dispatcher.dispatch({
            type: 'LOCAL_ACTIVITY_UPDATE',
            activity: {},
            socketId: 'YoutubeMusicRPC'
        });

        this.components = void 0;
        this.getAsset = void 0;
        this.dispatcher = void 0;

        BdApi.saveData('YTM', 'settings', this.settings);
    }

    getSettingsPanel() {
        return YTMRenderSettingPanel.bind(this);
    }
};

function YTMRenderSettingPanel() {
    const { FormItem, FormSwitch, FormTitle, TextInput } = this.components;

    const [clientId, setClientId] = BdApi.React.useState(this.settings.clientId);
    const [reconnectDuration, setReconnectDuration] = BdApi.React.useState(this.settings.reconnectionTimeout);
    const [port, setPort] = BdApi.React.useState(this.settings.port);
    const [timeBar, setTimeBar] = BdApi.React.useState(this.settings.timeBar);

    BdApi.React.useEffect(() => {
        const settings = {
            clientId,
            reconnectionTimeout: reconnectDuration,
            port,
            timeBar
        };

        BdApi.saveData('YTM', 'settings', settings);
        this.settings = settings;
        console.log('[YTM] Saved settings', settings);
    }, [clientId, reconnectDuration, port, timeBar]);

    return (
        <div>
            <FormItem className={this.margins.marginBottom20}>
                <FormTitle>Port</FormTitle>
                <TextInput
                    value={port}
                    onChange={(/** @type {string} */ value) => {
                        if(!Number.isInteger(value)) {
                            return;
                        }

                        setPort(value);
                        this.connectWS();
                    }}
                />
            </FormItem>

            <FormItem className={this.margins.marginBottom20}>
                <FormTitle>Client ID</FormTitle>
                <TextInput
                    value={clientId}
                    onChange={(/** @type {string} */ value) => {
                        setClientId(value);
                    }}
                />
            </FormItem>

            <FormItem className={this.margins.marginBottom20}>
                <FormTitle>WebSocket Reconnect Timeout</FormTitle>
                <TextInput
                    value={reconnectDuration}
                    onChange={(/** @type {string} */ value) => {
                        if(!Number.isInteger(value)) {
                            return;
                        }

                        setReconnectDuration(value);
                    }}
                />
            </FormItem>

            <FormItem className={this.margins.marginBottom20}>
                <FormSwitch
                    value={timeBar}
                    disabled
                    onChange={(/** @type {boolean} */ checked) => {
                        setTimeBar(checked);
                        this.patchTimeBar(checked);
                    }}
                >
                    Show time bar (locally)
                </FormSwitch>
            </FormItem>
        </div>
    );
}