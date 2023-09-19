void (async () => {
    /**
     * @type {{
     *  storage: chrome.storage
     * }}
     */
    const cAPI = {};

    if(typeof chrome !== 'undefined') {
        if(typeof browser !== 'undefined') {
            cAPI.storage = {};
            cAPI.storage.sync = {};
            /**
             * @param {string | string[]} keys
             */
            cAPI.storage.sync.get = function(keys, cb) {
                browser.storage.sync.get(keys)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    .then(cb)
                    .catch(e => {
                        throw e;
                    });
            };

            cAPI.storage.sync.set = function(items) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                void browser.storage.sync.set(items);
            };

            cAPI.storage.onChanged = {};
            cAPI.storage.onChanged.addListener = function(cb) {
                browser.storage.onChanged.addListener((ch) => {
                    cb(ch, 'sync');
                });
            };
        }
        else {
            cAPI.storage = chrome.storage;
        }
    }

    cAPI.storage.sync.get(['ytm_PORT'], (items) => {
        console.log(`inside storage sync set popup.js -> items: ${JSON.stringify(items)}`);
        document.getElementById('port')
            .value = items.ytm_PORT || 2134;
    });

    async function handleChange(type, message) {
        console.log(`inside handlechange ${type} -> ${message}`);
        const toSend = {};
        toSend[type] = message;
        void cAPI.storage.sync.set(toSend);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const portInput = document.getElementById('port');

        portInput.addEventListener('change', (e) => void handleChange('ytm_PORT', e.target.value));
        portInput.addEventListener('input', (e) => void handleChange('ytm_PORT', e.target.value));
    });
})();