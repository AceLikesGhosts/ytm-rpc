import type { Globals } from './Globals';
import type { Presence } from 'discord-rpc';

export interface ServerConstructor {
    new(options: Globals): Server;
}

export interface Server {
    update(presence: Presence): void;
    start(): void;
}