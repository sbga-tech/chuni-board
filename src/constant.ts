export const CONSTANTS = {
    BILIBILI_APP_KEY: process.env.BILIBILI_APP_KEY || "",
    BILIBILI_APP_SECRET: process.env.BILIBILI_APP_SECRET || "",
    BILIBILI_APP_ID: process.env.BILIBILI_APP_ID || "",
    BILIBILI_REMOTE_URL: "https://live-open.biliapi.com",
    LAPLACE_API_ENDPOINT: "https://heartbeater.laplace.cn/api/bilibili-open/auth/",
    OTOGEDB_REMOTE_URL:
        "https://raw.githubusercontent.com/zvuc/otoge-db/refs/heads/master/chunithm/data/music-ex.json",
    OTOGEDB_JACKET_URL:
        "https://raw.githubusercontent.com/zvuc/otoge-db/refs/heads/master/chunithm/jacket/",
    ORDER_LIST_FILE_PATH: "order-list.json",
    SONG_ALIASES_FILE_PATH: "song-aliases.json",
    CONFIG_FILE_PATH: "config.json",
    OTOGE_LOCAL_BACKUP_PATH: "music-ex.json",
    IMAGE_CACHE_PATH: ".img-cache",
};
