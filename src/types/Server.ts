import type { Presence } from 'discord-rpc';

export interface Server {
    update(presence: Presence): void;
    start(): void;
}