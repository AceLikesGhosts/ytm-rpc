# Discord Rich Presence

This project is a Discord Rich Presence bot that displays information about the currently playing music on Discord.

## Installation

1. Clone the repository to your local machine.
2. Navigate to the project directory and install the required dependencies using npm:

```bash
npm install
```

3. Ensure you have a Discord application created and obtain the `client_id` for the RPC. Replace the value of `globals.client_id` in the code with your application's client ID.

4. Add the extension to your web browser (tested in Google Chrome), installation steps very between browsers.

## Prerequisites

- Node.js and npm installed on your machine.

## Usage

1. Start the Express server to listen for incoming requests:

```bash
node index.js
```

2. Ensure your Discord application is running and logged in with the provided `client_id`.

## Notes

- The RPC Client will display the provided song information on Discord Rich Presence (see images below).
- The server uses the Express framework to handle incoming POST requests.
- The `discordStringify` function is used to sanitize strings and parse all HTML entities into their string form and removes all new lines before displaying them on Discord.
- The `update` function updates the Rich Presence status with the provided song information.
- The default image for the bot is 'ytm' (You can customize this in the code).


## Images

!["example rpc image"](images/rpc.png)