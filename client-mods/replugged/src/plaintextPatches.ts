// I DONT CARE.
/* eslint-disable jsdoc/require-asterisk-prefix */

import type { PlaintextPatch } from 'replugged/dist/types';

/**
renderTimeBar(i) {
                if (!(0,
                _.default)(i))
                    return null;
                let {timestamps: t} = i;
                if (null == t)
                    return null;
                let {start: a, end: r} = t;
                return null == a || null == r ? null : (0,
                e.jsx)(T.default, {
                    start: a,
                    end: r,
                    className: this.getTypeClass("timeBar"),
                    themed: this.props.type === o.VOICE_CHANNEL || this.props.type === o.USER_POPOUT || this.props.type === o.USER_POPOUT_V2 || this.props.type === o.PROFILE_V2
                })
            }
 */

export default [
    {
        find: /renderTimeBar\(.\){/,
        replacements: [
            {
                match: /if\(!\(0,\s?.\.default\)\(.*\)\)[^;]*;/,
                replace: 'console.log("inside check"); if(!replugged?.plugins?.getExports?.("me.acelikesghosts.ytm")?.pluginSettings?.get("showTimeBar", false))return null;'
            }
        ]
    }
] as PlaintextPatch[];