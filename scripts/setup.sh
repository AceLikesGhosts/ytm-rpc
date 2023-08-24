#!/bin/bash

# These are the stupid requirements for TypeScript, this isn't TypeScript.

COMMANDS=(
  [install]="npm ci --quiet"
  [build]="npm --silent run ts:build"
)

function installReplugged {
  {
    # WARNING: this is hardcoded, seethe!
    runGeneric "npm run --silent build" "Finished transpiling Replugged plugin." "$(dirname "$0")/../client-mods/replugged"
  } &
}

function getBetterDiscordPluginFolder {
  if [[ "$(uname)" == "Darwin" ]]; then
    echo "$HOME/Library/Application Support/BetterDiscord/plugins"
  else
    echo "$HOME/.config/BetterDiscord/plugins"
  fi
}

function installBetterDiscord {
  local pluginFolder
  pluginFolder=$(getBetterDiscordPluginFolder)
  bdPluginFolder="$(dirname "$0")/../client-mods/BetterDiscord"
  PLUGIN="$bdPluginFolder/YTM.plugin.js"

  if [[ -d "$pluginFolder" && -e "$PLUGIN" && -d "$bdPluginFolder" ]]; then
    cp "$PLUGIN" "$pluginFolder"
    echo "✔ Installed BetterDiscord plugin."
  else
    echo "The installation script does not have enough permissions in order to access a required folder to copy the BetterDiscord plugin." >&2
  fi
}

function runGeneric {
  {
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
  } &
}

# Start streamlining script
queuedThings=()
missingArgs=0

for arg in "$@"; do
  case "$arg" in
    --deps) queuedThings+=("runGeneric '${COMMANDS[install]}' 'Finished installing Node (server) dependencies.' '$(dirname "$0")/..'") ;;
    --build) queuedThings+=("runGeneric '${COMMANDS[build]}' 'Finished transpiling server.' '$(dirname "$0")/..'") ;;
    --client=*)
      client="${arg#*=}"
      case "$client" in
        bd | betterdiscord) queuedThings+=("installBetterDiscord") ;;
        replugged | powercord) queuedThings+=("installReplugged") ;;
        *)
          echo "Expected 'bd' | 'replugged' but got '$client'" >&2
          exit 1
          ;;
      esac
      ;;
    *)
      missingArgs=1
      ;;
  esac
done

if [[ ${#queuedThings[@]} -eq 0 ]]; then
  echo "Missing required arguments!"
  echo "This script supports the following arguments:"
  echo "--deps -> Install dependencies for the Node server."
  echo "--build -> Build the TypeScript server."
  echo "--client -> Install a client mod. Supported options are 'bd' and 'replugged'."
  echo "Example: ./streamline.sh --deps --build --client=bd"
elif [[ $missingArgs -eq 0 ]]; then
  echo "You are still required to manually install the Chromium extension which enables"
  echo "the server to work! Installation steps can be seen on the Github's README!"
fi

for ((i = 0; i < ${#queuedThings[@]}; i++)); do
  eval "${queuedThings[i]}"
  wait
done
