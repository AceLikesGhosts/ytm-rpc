import type { SongData } from './SongData';

export interface Server {
    update(presence: SongData<true>): void;
    start(): void;
}