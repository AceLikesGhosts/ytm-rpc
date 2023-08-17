import type { Presence } from 'discord-rpc';
import type { SongPresenceData } from 'src/utils';

export interface Server {
    update(presence: Presence, original: SongPresenceData): void;
    start(): void;
}