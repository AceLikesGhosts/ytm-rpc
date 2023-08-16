import type { Presence } from 'discord-rpc';
import type { Application } from 'express';

export interface Server {
    update(presence: Presence): void;
    getApp(): Application;
    start(): void;
}