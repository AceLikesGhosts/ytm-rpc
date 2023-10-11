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