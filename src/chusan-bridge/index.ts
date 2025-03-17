import axios, { AxiosInstance } from "axios";
import { Difficulty } from "@/data/model";
import { createLogger } from "@/util/logger";
import { ChusanBridgeError } from "@/error";

interface SongMeta {
    song_id: number;
    charts: ChartMeta[];
}

interface ChartMeta {
    difficulty: Difficulty;
    level: number;
    levelDecimal: number;
}
export interface ChusanBridgeConfig {
    enabled: boolean;
    chusanServerUrl: string;
}

export class ChusanBridgeClient {
    private api: AxiosInstance;

    private logger = createLogger("ChusanBridge");

    constructor(chusanBridgeConfig: ChusanBridgeConfig) {
        if (chusanBridgeConfig.chusanServerUrl === "")
            throw new ChusanBridgeError("配置文件中缺少 chusanBridge.chusanServerUrl");
        this.api = axios.create({
            baseURL: chusanBridgeConfig.chusanServerUrl,
        });
    }

    async connect() {
        try {
            await this.startPoll();
            this.logger.info("连接成功");
        } catch (error) {
            this.logger.error("连接失败");
            throw error;
        }
    }

    private pollingActive = false;

    private async startPoll({ interval = 2000, maxAttempts = 10 } = {}) {
        let attempts = 0;
        this.pollingActive = true;

        while (attempts < maxAttempts && this.pollingActive) {
            attempts++;

            try {
                const response = await this.api.get("/ready");
                if (response.status === 200 && response.data.ready) {
                    this.logger.info("已就绪");
                    return;
                }
            } catch (err) {
                this.logger.error(`第${attempts}次尝试发生错误, 原因: `, err);
            }
            console.warn(`在 ${interval}ms 后重试... (第${attempts}次尝试)`);
            await new Promise((resolve) => setTimeout(resolve, interval));
        }

        if (!this.pollingActive) {
            this.logger.warn("轮询已停止");
            return;
        }

        // If we exit the loop, it means we never met the success condition
        throw new ChusanBridgeError(`在${maxAttempts}次尝试重连后仍未成功`);
    }

    destroy() {
        this.pollingActive = false;
    }

    async getSongMetas() {
        try {
            const { data } = await this.api.get("/songs", { timeout: 5000 });
            return data as SongMeta[];
        } catch (err) {
            this.logger.error("获取曲目数据失败");
            this.logger.error(err);
            throw err;
        }
    }

    async selectSong(songId: number, difficulty: Difficulty) {
        try {
            const resp = await this.api.post("/select", {
                song_id: songId,
                difficulty,
            });
            const data = resp.data;
            if (data.success) {
                this.logger.info(`选择曲目 ${songId} 难度 ${difficulty} 成功`);
                return true;
            }
            this.logger.error(`选择曲目 ${songId} 难度 ${difficulty} 失败`);
            return false;
        } catch (err) {
            this.logger.error(`选择曲目 ${songId} 难度 ${difficulty} 时发生错误`);
            this.logger.error(err);
            return false;
        }
    }
}
