void (async () => {
    chrome.storage.sync.get(['ytm_PORT'], (items) => {
        document.getElementById('port')
            .value = items.ytm_PORT || 2134;
    });

    async function handleChange(type, message) {
        const toSend = {};
        toSend[type] = message;
        void chrome.storage.sync.set(toSend);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const portInput = document.getElementById('port');

        portInput.addEventListener('change', (e) => void handleChange('ytm_PORT', e.target.value));
        portInput.addEventListener('input', (e) => void handleChange('ytm_PORT', e.target.value));
    });
})();