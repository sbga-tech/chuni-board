import { Chart, Difficulty, Song } from "@/data/model";
import { SongDataSource } from "@/data/datasource";
import { createLogger } from "@/util/logger";
import { ChusanBridgeClient } from "@/chusan-bridge";

export class ChusanBridgeDataSource implements SongDataSource {
    private logger = createLogger("ChusanBridgeDataSource");

    private bridgeClient: ChusanBridgeClient;
    constructor(bridgeClient: ChusanBridgeClient) {
        this.bridgeClient = bridgeClient;
    }

    async fetchSongs(songs: Map<number, Song>) {
        const songMetas = await this.bridgeClient.getSongMetas();
        for (const [songId, song] of songs.entries()) {
            //Remove song if not found in songMetas
            const songMeta = songMetas.find((songMeta) => songMeta.song_id === songId);
            if (!songMeta) {
                songs.delete(song.id);
                continue;
            }

            const newCharts = songMeta.charts
                .map((chartMeta) => {
                    const chart = song.charts.find(
                        (chart) => chart.difficulty === chartMeta.difficulty
                    );
                    if (!chart) {
                        this.logger.warn(
                            `未找到曲目 ${songId} 难度${chartMeta.difficulty} 对应信息`
                        );
                        return null;
                    }
                    // Skip WE difficulty
                    if (chartMeta.difficulty !== Difficulty.WE) {
                        chart.level = chartMeta.level;
                        chart.levelDecimal = chartMeta.levelDecimal;
                    }
                    return chart;
                })
                .filter((chart) => chart !== null);
            song.charts = newCharts as Chart[];
        }
    }
}
