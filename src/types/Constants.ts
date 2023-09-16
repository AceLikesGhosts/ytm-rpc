export interface IConstants {
    readonly using_ws: boolean;
    readonly client_id: string;
    readonly port: number;
    readonly images: {
        readonly default_img: string;
        readonly pause_img: string;
        readonly play_img: string;
    };
}