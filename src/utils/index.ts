import he from 'he';

/**
 * @description Stringified and sanitizes an input string. Transforms HTML entities to proper text as well.
 * @param {string} str - The input string.
 * @returns A sanitized string (that also stringifies it)
 * @throws
 */
export function stringify(str: string, argName: string = 'unknown'): string {
    if(!str || typeof str !== 'string') {
        throw new Error(`${ argName ? `(${ argName }) ` : '' }` + 'Invalid argument was passed to stringify, was passed to Stringify, it does not exist or was a non-string value.');
    }

    if(str === '' || str === ' ') {
        throw new Error(`${ argName ? '(' + argName + ') ' : '' }Failed to parse string -> it was empty`);
    }

    str = he.decode(str);
    str = str.replace(/(\r\n|\n|\r)/gm, '');
    str = str.trim();

    if(str.length >= 127) {
        str = str.substring(0, 124);
        str += '...';
    }

    return str;
}

export function milliToTime(millis: string): number {
    let temp = Date.now();
    temp += Math.round(parseFloat(millis) * 1000);
    return temp;
}