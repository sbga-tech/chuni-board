import { defineConfig } from "@mikro-orm/better-sqlite";
import { SqlHighlighter } from "@mikro-orm/sql-highlighter";
import { ChartEntity } from "@/data/persistence/entities/chart.entity";
import { SongEntity } from "@/data/persistence/entities/song.entity";
import { DBLogger } from "@/util/logger";

export default defineConfig({
    dbName: "song.db",
    entities: [SongEntity, ChartEntity],
    colors: false,
    debug: true,
    loggerFactory: (options) => new DBLogger(options),
});
