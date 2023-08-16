export type IConstants = Readonly<Constants>;
export interface Constants {
    client_id: string;
    port: number;
    images: {
        default_img: string;
        pause_img: string;
        play_img: string;
    };
}