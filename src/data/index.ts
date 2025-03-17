import { createLogger } from "@/util/logger";
import { SongDataSource } from "@/data/datasource";
import { Song, Chart } from "@/data/model";
import { SongPersistence } from "@/data/persistence";

export class SongRepository {
    private songs: Map<number, Song>;
    private persistence: SongPersistence;
    constructor() {
        this.persistence = new SongPersistence();
        this.songs = new Map();
    }

    getSong(songId: number): Song | undefined {
        return this.songs.get(songId);
    }

    getAll(): Map<number, Song> {
        return this.songs;
    }

    setAll(songs: Map<number, Song>) {
        this.songs = songs;
    }

    getChart(songId: number, difficulty: number): Chart | undefined {
        const song = this.getSong(songId);
        return song?.charts.find((chart) => chart.difficulty === difficulty);
    }

    removeSongs(songIds: number[]) {
        for (const songId of songIds) {
            this.songs.delete(songId);
        }
    }

    async init() {
        await this.persistence.init();
        this.songs = await this.persistence.load();
    }

    async save() {
        await this.persistence.saveAll(this.songs);
    }

    async destroy() {
        await this.persistence.destroy();
    }
}

export class SongRepositoryUpdater {
    private logger = createLogger("SongRepositoryUpdater");
    constructor(
        private repository: SongRepository,
        private dataSources: SongDataSource[]
    ) {}

    async updateRepository() {
        const tempSongs = new Map(this.repository.getAll().entries());

        this.logger.info(`正在执行数据更新...`);
        try {
            const dataSourceCount = this.dataSources.length;
            let currentDataSourceIndex = 0;
            for (const dataSource of this.dataSources) {
                await dataSource.fetchSongs(tempSongs);
                this.logger.info(
                    `数据源 ${currentDataSourceIndex + 1}/${dataSourceCount} 更新完成`
                );
                currentDataSourceIndex++;
            }
        } catch (error) {
            this.logger.error("Error occurred while updating from data sources:", error);
        }

        this.logger.info(`数据更新完成, 正在提交更改...`);
        try {
            if (tempSongs.size === 0) {
                this.logger.warn("数据源未返回任何数据, 不提交更改");
                return;
            }
            this.repository.setAll(tempSongs);
            await this.repository.save();
        } catch (error) {
            //this.logger.error("Error occurred while committing changes to database:", error);
            throw error;
        }
    }
}
