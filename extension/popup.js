void (async () => {
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
