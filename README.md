# Discord Rich Presence

This project is a Discord Rich Presence bot that displays information about the currently playing music on Discord.

## Features
| Features          | Status    |
| ----------------  | --------- |
| Song Name         | :white_check_mark: |
| Album Cover       | :white_check_mark: |
| Pausing/Unpausing | :white_check_mark: |
| Share Button      | :white_check_mark: |

## Installation

1. Clone the repository to your local machine.
2. Navigate to the project directory and install the required dependencies using npm:

```bash
npm install
```

3. Run the setup script (creates `.env`)
```bash
npm run setup
# OR
# ./setup.sh
```

4. Ensure you have a Discord application created and obtain the `client_id` for the RPC. Replace the value of `CLIENT_ID` in the `.env` file with your application's client ID.

5. Add the extension to your web browser (tested in Google Chrome), installation steps very between browsers.

## Prerequisites

- Node.js and npm installed on your machine.

## Usage

1. Start the Express server to listen for incoming requests:

```bash
node index.js
```

2. Ensure that the Chrome extension is active.

## Updating

Updating your local version of the project is rather simple, and all you have to do is:

1. Navigate to where it is installed and update the Git repo
```bash
git pull
```

2. Update the required dependencies using npm:
```bash
npm install
```

3. Navigate to [Chrome's extension manager](chrome://extensions) (chrome://extensions) and press `Update`
!["update image"](images/update.png)


## Notes

- The RPC Client will display the provided song information on Discord Rich Presence (see images below).
- The server uses the Express framework to handle incoming POST requests.
- The `replaceHTMLEntities` function is used to sanitize strings and parse all HTML entities into their string form and removes all new lines before displaying them on Discord.
- The `update` function updates the Rich Presence status with the provided song information.
- The default image for the bot is 'ytm' (You can customize this in the code, or set your own in the `.env`).


## Images

!["screenshot of RPC"](images/rpc.png)
!["screenshot of paused RPC state"](images/paused.png)
