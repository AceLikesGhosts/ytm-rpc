@echo off

REM These are the stupid requirements for TypeScript, this isn't TypeScript.

REM Define commands as associative array
setlocal enabledelayedexpansion
set "COMMANDS[install]=npm ci"
set "COMMANDS[build]=npm run ts:build"

REM Function to install Replugged
:installReplugged
(
  REM WARNING: this is hardcoded, seethe!
  call :runGeneric "npm run build" "Finished transpiling Replugged plugin." "%~dp0..\client-mods\replugged"
)
goto :eof

REM Function to get BetterDiscord plugin folder
:getBetterDiscordPluginFolder
if "%PROCESSOR_ARCHitecture%"=="AMD64" (
  set "pluginFolder=%USERPROFILE%\AppData\Roaming\BetterDiscord\plugins"
) else (
  set "pluginFolder=%USERPROFILE%\.config\BetterDiscord\plugins"
)
echo !pluginFolder!
goto :eof

REM Function to install BetterDiscord
:installBetterDiscord
set "bdPluginFolder=%~dp0..\client-mods\BetterDiscord"
set "PLUGIN=%bdPluginFolder%\YTM.plugin.js"

if exist "%pluginFolder%" if exist "%PLUGIN%" if exist "%bdPluginFolder%" (
  copy "%PLUGIN%" "%pluginFolder%"
  echo ✔ Installed BetterDiscord plugin.
) else (
  echo The installation script does not have enough permissions to access a required folder to copy the BetterDiscord plugin. 1>&2
)
goto :eof

REM Function to run generic commands
:runGeneric
set "command=%~1"
set "finish=%~2"
set "cwd=%~3"
(
  if defined cwd (
    pushd "%cwd%" && call %command%
  ) else (
    call %command%
  )
) || (
  echo Failed to run command. 1>&2
  exit /b 1
)

echo ✔ %finish%
goto :eof

REM Start streamlining script
echo Starting streamlining script:
echo You are still required to manually install the Chromium extension which enables
echo the server to work! Installation steps can be seen on the Github's README!

set "queuedThings="

REM Process arguments
for %%a in (%*) do (
  set "arg=%%a"
  if "!arg!"=="--deps" (
    set "queuedThings=!queuedThings!call :runGeneric "!COMMANDS[install]!" "Finished installing Node (server) dependencies." "%~dp0.."
  )
  if "!arg!"=="--build" (
    set "queuedThings=!queuedThings!call :runGeneric "!COMMANDS[build]!" "Finished transpiling server." "%~dp0.."
  )
  if "!arg:~0,8!"=="--client" (
    set "client=!arg:~9!"
    if "!client!"=="bd" (
      set "queuedThings=!queuedThings!call :installBetterDiscord"
    )
    if "!client!"=="replugged" (
      set "queuedThings=!queuedThings!call :installReplugged"
    )
  )
)

REM Execute queued commands
if "!queuedThings!"=="" (
  echo Missing required arguments!
  echo This script supports the following arguments:
  echo --deps -> Install dependencies for the Node server.
  echo --build -> Build the TypeScript server.
  echo --client -> Install a client mod. Supported options are 'bd' and 'replugged'.
  echo Example: %~nx0 --deps --build --client=bd
) else (
  for %%q in (!queuedThings!) do (
    %%q
  )
)
