import { Server } from 'ws';

export default function startServer(): void {
    const wss = new Server({
        port: Number(process.env.PORT) || 2134
    });

    process.on('SIGINT', (code) => {
        wss.clients.forEach((client) => client.send('{"closing":true}'));
        process.exit(Number(code) || 1);
    });

}