import axios, { AxiosInstance } from "axios";
import { getEncodeHeader } from "@/bili-game/util";
import { DanmakuSocket } from "@/bili-game/socket";
import { EventMessage } from "@/bili-game/event-message";
import { Logger } from "winston";
import { createLogger } from "@/util/logger";
import { CONSTANTS } from "@/constant";
import { BilibiliError } from "@/error";

export interface AnchorInfo {
    room_id: number;
    uid: number;
    open_id: string;
    uname: string;
    uface: string;
}

export interface BilibiliClientConfig {
    codeId: string;
}

export class BilibiliGameClient {
    private api: AxiosInstance;
    private gameId: string = "";
    private anchorInfo: AnchorInfo | null = null;
    private heartBeatTimer: ReturnType<typeof setInterval> | null = null;
    private danmakuSocket: DanmakuSocket = new DanmakuSocket();
    private logger: Logger = createLogger("BilibiliClient");
    private heartBeatCallback: ((success: boolean) => void) | null = null;

    constructor(private config: BilibiliClientConfig) {
        if (!config.codeId) {
            throw new BilibiliError("配置文件中缺少 bilibiliClient.codeId");
        }

        this.api = axios.create({ baseURL: CONSTANTS.BILIBILI_REMOTE_URL });
        this.api.interceptors.request.use(async (config) => {
            const headers = await getEncodeHeader(
                config.data,
                CONSTANTS.BILIBILI_APP_KEY,
                CONSTANTS.BILIBILI_APP_SECRET
            );
            config.headers = headers as any;
            return config;
        });
    }

    public async start() {
        const { codeId } = this.config;

        try {
            const { data } = await this.api.post("/v2/app/start", {
                code: codeId,
                app_id: Number(CONSTANTS.BILIBILI_APP_ID),
            });

            if (data.code !== 0) {
                throw new BilibiliError("游戏开始失败，原因: " + JSON.stringify(data));
            }

            const { game_info, websocket_info, anchor_info } = data.data;
            this.gameId = game_info.game_id;
            this.anchorInfo = anchor_info as AnchorInfo;

            this.logger.info("游戏开始成功");
            this.logger.debug(`返回GameId: ${this.gameId}`);

            this.startHeartBeat();
            this.danmakuSocket.connect(websocket_info.auth_body, websocket_info.wss_link);
        } catch (err) {
            this.logger.error("游戏开始失败", err);
            throw BilibiliError.fromAxiosError(err, "游戏开始失败");
        }
    }

    public getAnchorInfo() {
        return this.anchorInfo;
    }

    public isAnchor(open_id: string) {
        return this.anchorInfo?.open_id === open_id;
    }

    public onEventMessage(callback: (data: EventMessage) => void) {
        this.danmakuSocket.onRecv((body) => {
            const eventMessage: EventMessage = JSON.parse(body);
            callback(eventMessage);
        });
    }

    private startHeartBeat() {
        if (!this.gameId) {
            this.logger.error("未获取到gameId");
            return;
        }

        if (this.heartBeatTimer) clearInterval(this.heartBeatTimer);

        this.heartBeatTimer = setInterval(() => {
            this.heartBeatThis(this.gameId);
        }, 20000);
    }

    private async heartBeatThis(gameId: string) {
        try {
            const { data } = await this.api.post("/v2/app/heartbeat", { game_id: gameId });

            if (data.code === 0) {
                this.logger.debug("心跳成功");
                this.heartBeatCallback?.(true);
            } else {
                this.logger.debug("心跳失败，原因：" + JSON.stringify(data));
                this.heartBeatCallback?.(false);
            }
        } catch (err) {
            this.logger.error("心跳失败", err);
            this.heartBeatCallback?.(false);
        }
    }

    public async destroy() {
        this.logger.info("游戏关闭中...");
        if (this.heartBeatTimer) clearInterval(this.heartBeatTimer);

        await this.endGame();
        this.danmakuSocket.destroy();
    }

    private async endGame() {
        if (!this.gameId) {
            this.logger.error("未获取到gameId");
            return;
        }

        try {
            const { data } = await this.api.post("/v2/app/end", {
                game_id: this.gameId,
                app_id: Number(CONSTANTS.BILIBILI_APP_ID),
            });

            if (data.code === 0) {
                this.logger.info("游戏关闭成功");
                this.logger.debug("返回：" + JSON.stringify(data));
            } else {
                this.logger.error("游戏关闭失败，原因：" + JSON.stringify(data));
            }
        } catch (err) {
            this.logger.error("游戏关闭失败", err);
        }
    }

    public onHeartBeat(callback: (success: boolean) => void) {
        this.heartBeatCallback = callback;
    }
}
