export interface IConstants {
    readonly using_ws: boolean;
    readonly client_id: string;
    readonly port: number;
    readonly style: 'show' | 'hide' | undefined;
    readonly show_song_title: boolean;
    readonly images: {
        readonly default_img: string;
        readonly pause_img: string;
        readonly play_img: string;
    };
}