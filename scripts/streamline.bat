@echo off
setlocal

REM These are the equivalent commands for TypeScript (although it doesn't make sense in BAT).
set "INSTALL_COMMAND=npm ci --quiet"
set "BUILD_COMMAND=npm --silent run ts:build"

REM Install Replugged function (equivalent BAT function)
:installReplugged
(
  REM WARNING: this is hardcoded, seethe!
  call :runGeneric "npm run --silent build" "Finished transpiling Replugged plugin." "%~dp0..\client-mods\replugged"
) &

REM Function to get BetterDiscord plugin folder (equivalent BAT function)
:getBetterDiscordPluginFolder
if "%PROCESSOR_ARCH%"=="AMD64" (
  set "pluginFolder=%USERPROFILE%\AppData\Roaming\BetterDiscord\plugins"
) else (
  set "pluginFolder=%USERPROFILE%\.config\BetterDiscord\plugins"
)
goto :eof

REM Install BetterDiscord function (equivalent BAT function)
:installBetterDiscord
set "pluginFolder="
call :getBetterDiscordPluginFolder
set "bdPluginFolder=%~dp0..\client-mods\BetterDiscord"
set "PLUGIN=%bdPluginFolder%\YTM.plugin.js"

if exist "%pluginFolder%" if exist "%PLUGIN%" if exist "%bdPluginFolder%" (
  copy "%PLUGIN%" "%pluginFolder%"
  echo ✔ Installed BetterDiscord plugin.
) else (
  echo The installation script does not have enough permissions to access a required folder to copy the BetterDiscord plugin. >&2
)
goto :eof

REM Function to run commands (equivalent BAT function)
:runGeneric
set "command=%~1"
set "finish=%~2"
set "cwd=%~3"

(
  if defined cwd (
    pushd "%cwd%" && %command%
  ) else (
    %command%
  )
) || (
  echo Failed to run command. >&2
  exit /b 1
)

echo ✔ %finish%
goto :eof

REM Start streamlining script
set "queuedThings="
set "missingArgs=0"

for %%I in (%*) do (
  set "arg=%%~I"
  if /i "%arg%"=="--deps" (
    call :runGeneric "%INSTALL_COMMAND%" "Finished installing Node (server) dependencies." "%~dp0.."
  ) else if /i "%arg%"=="--build" (
    call :runGeneric "%BUILD_COMMAND%" "Finished transpiling server." "%~dp0.."
  ) else if /i "%arg:~0,9%"=="--client=" (
    set "client=%arg:~9%"
    if /i "!client!"=="bd" (
      call :installBetterDiscord
    ) else if /i "!client!"=="replugged" (
      call :installReplugged
    ) else (
      echo Expected 'bd' | 'replugged' but got '!client!' >&2
      exit /b 1
    )
  ) else (
    set "missingArgs=1"
  )
)

if not defined queuedThings (
  echo Missing required arguments!
  echo This script supports the following arguments:
  echo --deps -> Install dependencies for the Node server.
  echo --build -> Build the TypeScript server.
  echo --client -> Install a client mod. Supported options are 'bd' and 'replugged'.
  echo Example: %~nx0 --deps --build --client=bd
) else if "%missingArgs%"=="0" (
  echo You are still required to manually install the Chromium extension which enables
  echo the server to work! Installation steps can be seen on the Github's README!
)

for %%I in (%queuedThings%) do (
  call %%I
  call :wait
)

goto :eof

REM Function to wait for background processes (equivalent BAT function)
:wait
for /l %%C in (1,1,1) do (
  set "running="
  for %%P in (%queuedThings%) do (
    tasklist /fi "PID eq %%C" | find /i "cmd.exe" | find /i "%%P" >nul && set "running=1" && exit /b
  )
  if not defined running exit /b
)
goto :eof
