import { MikroORM } from "@mikro-orm/core";
import { Song } from "@/data/model";
import config from "@/mikro-orm.config";
import { SongEntity } from "@/data/persistence/entities/song.entity";

export class SongPersistence {
    private orm!: MikroORM;

    async init() {
        this.orm = await MikroORM.init(config);
        await this.orm.getSchemaGenerator().updateSchema();
    }

    async saveAll(songs: Map<number, Song>) {
        const em = this.orm.em.fork();

        // Fetch all existing song IDs from the database
        const existingSongs = await em.find(SongEntity, {});
        const existingIds = new Set(existingSongs.map((song) => song.id));
        const newIds = new Set(songs.keys());

        // Determine songs to delete (entries in DB that are not in `songs` map)
        const idsToDelete = [...existingIds].filter((id) => !newIds.has(id));
        if (idsToDelete.length > 0) {
            await em.nativeDelete(SongEntity, { id: { $in: idsToDelete } });
        }

        // Convert the map values into an array of entities
        const songEntities = Array.from(songs.values()).map(SongEntity.fromModel);

        // Use upsertMany to update or insert songs efficiently
        await em.upsertMany(SongEntity, songEntities);
    }

    async load(): Promise<Map<number, Song>> {
        const em = this.orm.em.fork();
        const songs = await em.find(SongEntity, {}, { populate: ["charts"] });
        return new Map(songs.map((song) => [song.id, song.toModel()]));
    }

    async destroy() {
        if (this.orm) await this.orm.close();
    }
}
