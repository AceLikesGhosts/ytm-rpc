export type SongData<BeenProcessed extends boolean = false> = {
    song: string;
    artist: string;
    album: string;
    link: string;
    timeMax?: BeenProcessed extends true ? number : string;
    timeNow?: BeenProcessed extends true ? number : string;
    icon: string;
    isPaused: boolean;
};