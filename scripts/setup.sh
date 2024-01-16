#!/bin/bash

# Commands
COMMANDS=(
    [install]="npm install --quiet"
    [build]="npm --silent run build --workspaces"
)

# copy env
function copyEnv {
    envFile="$(dirname "$0")/../.env"
    envExampleFile="$(dirname "$0")/../.env.example"
    
    if [[ ! -e "$envFile" && -e "$envExampleFile" ]]; then
        cp "$envExampleFile" "$envFile"
        echo "Copied .env.example to .env."
    fi
}

function warnMessage {
    echo "WARNING! You are still required to add the Chromium extension manually!"
}

# Install Replugged plugin
function installReplugged {
    runGeneric "npm run --silent build" "Finished transpiling Replugged plugin." "$(dirname "$0")/../packages/replugged"
}

function getAppdata {
    if [[ "$(uname)" == "Darwin" ]]; then
        echo "$HOME/Library/Application Support"
    else
        echo "$HOME/.config"
    fi
}

# Install BetterDiscord plugin
function installBetterDiscord {
    local appData
    appData=$(getAppdata)
    pluginFolder="$appData/BetterDiscord/plugins"
    bdPluginFolder="$(dirname "$0")/../packages/BetterDiscord"
    PLUGIN="$bdPluginFolder/dist/YTM.plugin.js"
    
    runGeneric "npm install" "Installed BetterDiscord plugin dependencies." "$(dirname "$0")/../packages/BetterDiscord"
    runGeneric "npm run build" "Finished transpiling BetterDiscord plugin." "$(dirname "$0")/../packages/BetterDiscord"
    
    if [[ -d "$pluginFolder" && -e "$PLUGIN" && -d "$bdPluginFolder" ]]; then
        cp "$PLUGIN" "$pluginFolder"
        echo "✔ Installed BetterDiscord plugin."
    else
        echo "Not enough permissions to copy the BetterDiscord plugin." >&2
    fi
}

# Run command and display finish message
function runGeneric {
    command="$1"
    finish="$2"
    cwd="$3"
    
    {
        if [[ -n "$cwd" ]]; then
            (cd "$cwd" && eval "$command")
        else
            eval "$command"
        fi
        } || {
        echo "Failed to run command." >&2
        exit 1
    }
    
    echo "✔ $finish"
}

# Process arguments
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 --deps --build --client=<bd|replugged>"
    exit 1
fi

warnMessage
copyEnv

for arg in "$@"; do
    case "$arg" in
        --deps) runGeneric "${COMMANDS[install]}" "Installed Node dependencies." "$(dirname "$0")/.." ;;
        --build) runGeneric "${COMMANDS[build]}" "Transpiled server." "$(dirname "$0")/.." ;;
        --client=*)
            client="${arg#*=}"
            case "$client" in
                bd | betterdiscord) installBetterDiscord ;;
                replugged | powercord) installReplugged ;;
                *)
                    echo "Invalid client mod: '$client'" >&2
                    exit 1
                ;;
            esac
        ;;
        *)
            echo "Invalid argument: '$arg'" >&2
            exit 1
        ;;
    esac
done

echo "Done!"
