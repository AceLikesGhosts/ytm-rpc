export type Globals = Readonly<IGlobals>;
interface IGlobals {
    client_id: string;
    port: number;
    images: {
        default_img: string;
        pause_img: string;
        play_img: string;
    }
}