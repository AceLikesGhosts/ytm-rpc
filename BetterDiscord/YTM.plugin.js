/**
 * @name YTM
 * @description A simple WebSocket connection to a local YTM-RPC server, to display your Youtube Music data more.. "properly"
 * @version 0.0.1
 * @author ace.
 * @authorId 249746236008169473
 * @website https://github.com/acelikesghosts/ytm-rpc
 * @source https://raw.githubusercontent.com/AceLikesGhosts/ytm-rpc/master/BetterDiscord/YTM.plugin.js
 */
/* eslint-disable jsdoc/no-bad-blocks */
/* eslint-disable jsdoc/require-asterisk-prefix */
/** @cc_on
 @if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/
module.exports = class YTM {
    // #region Metadata
    getName() {
        return 'YTM';
    }

    getDescription() {
        return 'A simple WebSocket connection to a local YTM-RPC server, to display your Youtube Music data more.. "properly"';
    }

    getVersion() {
        return '0.0.1';
    }

    getAuthor() {
        return 'ace.';
    }
    // #endregion

    /** @type {WebSocket} */
    ws = void 0;
    /**
     * @type {number}
     */
    port = 2134;
    assetManager = void 0;
    rpc = void 0;
    getAsset = void 0;
    /**
     * @type {string}
     */
    clientID;
    /**
     * @type {number}
     */
    intervalDurationSeconds = 15;
    /**
     * @type {NodeJS.Timeout}
     */
    reconnectInterval = void 0;

    async setActivity(activity) {
        // activity.assets.large_image
        // activity.assets.small_image
        const large = await this.getAsset(activity.assets.large_image);
        const small = await this.getAsset(activity.assets.small_image);

        activity.assets.large_image = large;
        activity.assets.small_image = small;

        console.log('[YTM] Updated activity');
        console.log(activity);
        this.rpc.dispatch({
            type: 'LOCAL_ACTIVITY_UPDATE',
            activity
        });
    }

    connectWS() {
        if(typeof this.ws !== 'undefined') {
            if(this.ws.readyState === this.ws.OPEN) {
                console.log('[YTM] Closed Websocket due to another call to `connectWS` occuring.');
                this.ws.close(1000, 'BetterDiscord plugin requested shutdown in order to restart it');
            }
        }

        this.ws = new WebSocket('ws://localhost:' + this.port);
        this.ws.onmessage = (ev) => this.handleWSMessage(ev);
        this.ws.onopen = () => {
            clearInterval(this.reconnectInterval);
            console.log('[YTM] Connected WebSocket');
        };
        this.ws.onclose = () => this.reconnectWS(this.connectWS);
    }

    reconnectWS(reconnect) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this;
        this.reconnectInterval = setTimeout(() => {
            console.log('[YTM] Attemping to reconnect the WebSocket');
            reconnect.bind(that)();
        }, this.intervalDurationSeconds * 1000);
    }


    /**
     * @param {{ data: string }} ev 
     */
    handleWSMessage(ev) {
        console.log('[YTM] Recieved Websocket message');

        const data = JSON.parse(ev.data);

        if(data && data.closing) {
            console.log('[YTM] Master server shut down.');
            this.ws.close(1000, 'Master server shutdown');
            this.rpc.dispatch({
                type: 'LOCAL_ACTIVITY_UPDATE',
                activity: {}
            });
            return;
        }

        void this.setActivity(data);
    }

    start() {
        console.log('[YTM] Started plugin');
        const settings = BdApi.loadData('YTM', 'settings') || { port: 2134 };
        this.port = settings.port;
        this.intervalDurationSeconds = settings.intervalDurationSeconds;
        this.rpc = BdApi.Webpack.getByKeys('dispatch', '_subscriptions');

        // https://github.com/Riddim-GLiTCH/BDLastFMRPC/blob/main/LastFMRichPresence.plugin.js
        // i love you
        let filter = BdApi.Webpack.Filters.byStrings('getAssetImage: size must === [number, number] for Twitch');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        let assetManager = BdApi.Webpack.getModule(m => typeof m === 'object' && Object.values(m).some(filter));
        let foundGetAsset;
        for(const key in assetManager) {
            const member = assetManager[key];
            if(member.toString().includes('apply(')) {
                foundGetAsset = member;
                break;
            }
        }
        this.getAsset = async key => {
            return (await foundGetAsset('1075993095138713612', [key, undefined]))[0];
        };

        this.connectWS();
    }

    stop() {
        console.log('[YTM] Stopped plugin.');
        if(this.ws && this.ws.readyState !== this.ws.CLOSED) {
            this.ws.onclose = void 0; // Forcefully remove our onclose reconnecter
            this.ws.close(1000, 'BetterDiscord plugin shut down.');
            this.ws = void 0;
        }

        if(this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
        }

        // clear RPC
        this.rpc.dispatch({
            type: 'LOCAL_ACTIVITY_UPDATE',
            activity: {}
        });

        this.rpc = void 0;
        this.assetManager = void 0;
        this.getAsset = void 0;

        BdApi.saveData('YTM', 'settings', {
            port: this.port,
            interval: this.intervalDurationSeconds
        });
    }

    getSettingsPanel() {
        // returns HTML element w our settings
        const DIV_CONTAINER = document.createElement('div');
        DIV_CONTAINER.style = 'color:white';

        const WARNING_DIV = document.createElement('div');

        const WARNING_SPAN_1 = document.createElement('span');
        WARNING_SPAN_1.innerText = 'When modifiying the ';

        const WARNING_CODE = document.createElement('code');
        WARNING_CODE.innerText = 'port';

        const WARNING_SPAN_2 = document.createElement('span');
        WARNING_SPAN_2.innerText = ' it will restart the WebSocket and attempt to reconnect upon submitting (pressing enter/clicking off)';

        WARNING_DIV.append(WARNING_SPAN_1, WARNING_CODE, WARNING_SPAN_2);

        DIV_CONTAINER.append(WARNING_DIV);

        const PORT_INPUT = document.createElement('input');
        PORT_INPUT.id = 'PORT-INPUT';
        PORT_INPUT.type = 'number';
        PORT_INPUT.value = this.port;
        PORT_INPUT.placeholder = this.port;

        PORT_INPUT.addEventListener('change', (e) => {
            this.port = e.data;
            this.connectWS();
        });

        PORT_INPUT.style = 'background: transparent;color:white';

        const DELAY_RECONNECT_INPUT = document.createElement('input');
        DELAY_RECONNECT_INPUT.type = 'number';
        DELAY_RECONNECT_INPUT.placeholder = DELAY_RECONNECT_INPUT.value = this.intervalDurationSeconds;
        DELAY_RECONNECT_INPUT.style = 'background:transparent;color:white';
        DELAY_RECONNECT_INPUT.addEventListener('change', (e) => {
            this.intervalDurationSeconds = e.data;
            clearInterval(this.reconnectInterval);
        });

        DIV_CONTAINER.append(PORT_INPUT);
        DIV_CONTAINER.append(DELAY_RECONNECT_INPUT);

        return DIV_CONTAINER;
    }
};
/* @end@ */
