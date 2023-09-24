void (async () => {
    /**
     * @type {{
     *  storage: chrome.storage
     * }}
     */
    const cAPI = {};

    if(typeof chrome !== 'undefined') {
        if(typeof browser !== 'undefined') {
            cAPI.storage = {
                sync: {}
            };

            /**
             * @param {string | string[]} keys
             * @param {string | string[] | Record<string, any>} cb
             */
            cAPI.storage.sync.get = function(keys, cb) {
                browser.storage.sync.get(keys)
                    .then(cb)
                    .catch(e => {
                        throw e;
                    });
            };

            /**
             * @param {Record<string, any>} items 
             */
            cAPI.storage.sync.set = function(items) {
                void browser.storage.sync.set(items);
            };
        }
        else {
            cAPI.storage = chrome.storage;
        }
    }

    cAPI.storage.sync.get(['ytm_PORT'], (items) => {
        document.getElementById('port')
            .value = items.ytm_PORT || 2134;
    });

    async function handleChange(type, message) {
        /** @type {Record<string, unknown>} */
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
