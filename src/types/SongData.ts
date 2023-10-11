export type SongData<BeenProcessed extends boolean = false> = {
    song: string;
    artist: string;
    link: string;
    /**
     * This field can mutate based on if it is from a song or video, if it is from a video it will be undefined.
     */
    album?: string;
    timeMax?: BeenProcessed extends true ? number : string;
    timeNow?: BeenProcessed extends true ? number : string;
    icon: string;
    isPaused: boolean;
};