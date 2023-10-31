import type { PlaintextPatch } from 'replugged/dist/types';

export default [
    {
        find: /renderTimeBar\(.\){if\(!\(0,.\.default\)\(.\)\)/,
        replacements: [
            {
                match: /if\(!\(.+\)\(.\)\)return null;/,
                replace: 'if(!replugged?.plugins?.getExports("me.acelikesghosts.ytm")?.PluginSettings?.get("showTimeBar", false)return null;'
            }
        ]
    }
] as PlaintextPatch[];