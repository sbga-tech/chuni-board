import axios, { AxiosInstance } from "axios";
import { CONSTANTS } from "@/constant";
import { getEncodeHeader } from "@/bili-game/util";
import { AnchorInfo } from "@/bili-game";
import { BilibiliError } from "@/error";

export interface BilibiliCodeAccess {
    getAnchorInfo(codeId: string): Promise<AnchorInfo | null>;
}

class HttpBilibiliCodeAccess implements BilibiliCodeAccess {
    private api: AxiosInstance;
    constructor() {
        this.api = axios.create({ baseURL: CONSTANTS.BILIBILI_REMOTE_URL });
        this.api.interceptors.request.use((config) => {
            const headers = getEncodeHeader(
                config.data,
                CONSTANTS.BILIBILI_APP_KEY,
                CONSTANTS.BILIBILI_APP_SECRET
            );
            config.headers = headers as any;
            return config;
        });
    }

    public async getAnchorInfo(codeId: string): Promise<AnchorInfo | null> {
        try {
            const resp = await this.api.post("/v2/app/start", {
                code: codeId,
                app_id: Number(CONSTANTS.BILIBILI_APP_ID),
            });
            const data = resp.data;
            console.log(JSON.stringify(data));
            if (data.code === 0) {
                const res = data.data;
                const { game_info, anchor_info } = res;
                const anchorInfo = anchor_info as AnchorInfo;
                await this.endGame(game_info.game_id);
                return anchorInfo;
            } else {
                return null;
            }
        } catch (err) {
            throw err;
        }
    }

    private async endGame(game_id: string) {
        try {
            const { data } = await this.api.post("/v2/app/end", {
                game_id: game_id,
                app_id: Number(CONSTANTS.BILIBILI_APP_ID),
            });
            console.log(JSON.stringify(data));
            if (data.code !== 0) {
                throw new BilibiliError("游戏关闭失败");
            }
        } catch (err) {
            throw err;
        }
    }
}

//Thanks to laplace.live for their API
//https://chat.laplace.live/
export class LaplaceBilibiliCodeAccess implements BilibiliCodeAccess {
    constructor() {}
    public async getAnchorInfo(codeId: string): Promise<AnchorInfo | null> {
        try {
            const { data } = await axios.get(CONSTANTS.LAPLACE_API_ENDPOINT + codeId);
            if (data.code === 0) {
                return data.data.anchor_info as AnchorInfo;
            } else if (data.code === 403) {
                return null;
            }
            throw new BilibiliError(JSON.stringify(data));
        } catch (error) {
            throw BilibiliError.fromAxiosError(error, "Laplace API Error");
        }
    }
}
