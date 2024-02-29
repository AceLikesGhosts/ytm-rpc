export const Constants = {
    port: Number(process.env.PORT) || 2134,

    clientId: process.env.CLIENT_ID || '',
    style: process.env.STYLE && ['show', 'hide'].includes(process.env.STYLE) ? process.env.STYLE as 'show' | 'hide' : undefined,

    formatting: {
        name: process.env.TITLE_FORMAT || '%name% by %artist%',
        details: process.env.DETAILS_FORMAT || '%name%',
        state: process.env.STATE_FORMAT || 'by %artist%',
        unknown: process.env.UNKNOWN_FORMAT || 'Unknown'
    },

    images: {
        defaultImg: process.env.DEFAULT_IMG || 'ytm',
        pauseImg: process.env.PAUSE_IMG || 'paused',
        playImg: process.env.PLAY_IMG || 'playing'
    }
} as const;

type Replacement = 'artist' | 'name' | 'album';
export function format(
    key: Omit<keyof typeof Constants['formatting'], 'unknown'>,
    replacements: [Replacement, string][]
): string {
    let toFormat = Constants.formatting[key as keyof typeof Constants['formatting']];
    if(!toFormat) throw new Error('invalid key was passed to "replace", recieved "' + key + '", which did not match ' + Object.keys(Constants.formatting));
    replacements.forEach(([replacement, value]) => toFormat = toFormat.replace(new RegExp(`/${replacement}/`), value));
    return toFormat;
}