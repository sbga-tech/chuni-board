import axios from "axios";
import { createLogger } from "@/util/logger";

// use suning api to get server time
//TODO: support for other time sync methods
const SERVER_TIME_URL = "http://f.m.suning.com/api/ct.do";

export class TimeSyncService {
    private timeDelta: number = 0; // Server time - local time
    private lastLocalTime: number = 0; // Timestamp of last local time
    private lastPerfTime = 0;
    private lastSyncTime: number = 0; // Timestamp of last sync
    private accumulativeDrift: number = 0; // Accumulative drift in ms
    private readonly DRIFT_THRESHOLD = 30 * 60 * 1000;
    private logger = createLogger("TimeSync");

    /**
     * Get current synchronized timestamp (auto re-sync if drifted more than 30 mins)
     */
    public async getTimestamp(): Promise<number> {
        const now = Date.now();
        const perfNow = performance.now();

        // If first time or never synced before
        if (this.lastSyncTime === 0 || this.lastPerfTime === 0) {
            this.logger.warn("正在同步服务器时间...");
            await this.syncTime();
        } else {
            // Calculate how much local time has advanced vs. how much real time has advanced
            const localDelta = now - this.lastLocalTime;
            const realDelta = perfNow - this.lastPerfTime;

            // If the difference between these deltas is > 30 minutes, assume a clock jump
            if (Math.abs(localDelta - realDelta) > 30 * 60 * 1000) {
                this.logger.warn("检测到本地时间跳跃超过30分钟, 正在重新同步...");
                await this.syncTime();
            }
        }

        // Update our stored times
        this.lastLocalTime = now;
        this.lastPerfTime = perfNow;

        // Return adjusted timestamp
        return Date.now() + this.timeDelta;
    }

    /**
     * Perform a time sync with the server
     */
    private async syncTime(): Promise<void> {
        try {
            const response = await axios.get(SERVER_TIME_URL);
            const data = response.data;

            if (data.code !== "1" || typeof data.currentTime !== "number") {
                throw new Error("服务器响应格式错误");
            }

            const serverTime = data.currentTime;
            const localTime = Date.now();

            this.timeDelta = serverTime - localTime;
            this.lastSyncTime = localTime;

            this.logger.info(`已成功同步。 偏移: ${this.timeDelta} ms`);
        } catch (error) {
            this.logger.error("同步失败:", error);
        }
    }
}
