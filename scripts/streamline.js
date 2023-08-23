/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
// these are stupid requirements for Typescript, this isnt
// Typescript.

const child_process = require('node:child_process');
const { join } = require('path');
const { copyFileSync, accessSync } = require('node:fs');

const COMMANDS = {
    install: 'npm ci',
    build: 'npm run ts:build'
};

/**
 * node streamline.js --deps --build --client=bd
 */
async function handleArgs() {
    let parsedArgs = {
        deps: true,
        build: true,
        client: null
    };

    for(const arg of process.argv.slice(2, process.argv.length)) {
        const newArg = arg.startsWith('--') ? arg.slice(2, arg.length) : arg;

        // --client=bd 
        // -> 'client': 'bd'
        if(newArg.indexOf('=') > -1) {
            const indx = newArg.indexOf('=');
            const key = newArg.slice(0, indx);
            const value = newArg.slice(indx + 1);

            parsedArgs[key] = value;
        }
        else {
            parsedArgs[newArg] = true;
        }
    }

    await handleChosenOptions(parsedArgs);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
async function installReplugged() {
    return async () => {
        // WARNING: this is hardcoded, seethe!
        void runGeneric('npm run build', 'Finished transpiling Replugged plugin.', join(__dirname, '..', 'client-mods', 'replugged'));
    };
}

function getBetterDiscordPluginFolder() {
    /** @type {string} */
    const WIN_PATH = process.env.APPDATA;
    /** @type {string} */
    const LINUX_PATH = process.env.XDG_CONFIG_HOME ? process.env.XDG_CONFIG_HOME : join(process.env.HOME, '.config');

    return require('os').platform().indexOf('win') > -1 ? join(WIN_PATH, 'BetterDiscord', 'plugins') : join(LINUX_PATH, 'BetterDiscord', 'plugins');
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
async function installBetterDiscord() {
    return async () => {
        const pluginFolder = getBetterDiscordPluginFolder();
        const bdPluginFolder = join(__dirname, '..', 'client-mods', 'BetterDiscord');
        const PLUGIN = join(bdPluginFolder, 'YTM.plugin.js');
        try {
            accessSync(pluginFolder);
            accessSync(PLUGIN);
            accessSync(bdPluginFolder);
            copyFileSync(PLUGIN, pluginFolder);
            console.log('✔ Installed BetterDiscord plugin.');
        } 
        catch(_) {
            console.error('The installation script does not have enough permissions in order to access a required folder to copy the BetterDiscord plugin.');
        }
    };
}

async function handleChosenOptions(opts) {
    opts = {
        deps: opts.deps !== undefined ? opts.deps : true,
        build: opts.build !== undefined ? opts.deps : true,
        client: opts.client !== null ? opts.client : null,
    };

    console.log('Starting streamlining script:');
    console.log('You are still required to manually install the Chromium extension which enables');
    console.log('the server to work! Installation steps can be seen on the Github\'s README!');

    let queuedThings = [];

    if(opts.deps) {
        queuedThings.push(runGeneric(COMMANDS.install, 'Finished installing Node (server) dependencies.'));
    }

    if(opts.build) {
        queuedThings.push(runGeneric(COMMANDS.build, 'Finished transpiling server.'));
    }

    /* eslint-disable indent */
    if(opts.client !== null) {
        switch(opts.client.toLowerCase()) {
            case 'bd': case 'betterdiscord': {
                queuedThings.push(installBetterDiscord());
                break;
            }
            case 'replugged': case 'powercord': {
                queuedThings.push(installReplugged());
                break;
            }
            case 'vencord': case 'shitcord': {
                console.error('Vencord is currently not supported.');
                break;
            }
            default: {
                throw new Error(`Expected 'bd' | 'replugged' | 'vencord' but got '${opts.client}'`);
            }
        }
    }
    /* eslint-enable indent */

    for(let i = 0; i < queuedThings.length; i++) {
        const toCall = await queuedThings[i];
        await toCall();
    }
}

/**
 * @param {string} command 
 * @param {string} finish 
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
async function runGeneric(command, finish, cwd) {
    return async () => {
        child_process.exec(command, cwd ? { cwd: cwd } : void 0, (err) => {
            if(err) {
                console.error('Failed to run command.');
                throw err;
            }

            console.log('✔ ' + finish);
        });
    };
}

// if they passed args we are not going to ask them questions and just
// parse them and do what they want
if(process.argv.length > 2) {
    return handleArgs();
}
else {
    console.error('Missing required arguments!');
    console.error('This script is supports the following arguments:');
    console.error('--deps -> Having this argument will install dependencies for the Node server.');
    console.error('--build -> Having this argument will build the Typescript server.');
    console.error('--client -> Allows setting for a client mod to install, supported options are `bd`, `replugged`, and `vencord`');
    console.error('ie: node streamline.js --deps --build --client=bd');
}