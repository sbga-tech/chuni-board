import { Entity, PrimaryKey, Property, OneToMany, Collection, Cascade } from "@mikro-orm/core";
import { Category, Song } from "@/data/model";
import { ChartEntity } from "@/data/persistence/entities/chart.entity";

@Entity()
export class SongEntity {
    @PrimaryKey({ type: "number" })
    id!: number;

    @Property({ type: "text" })
    category!: Category;

    @Property({ type: "text" })
    title!: string;

    @Property({ type: "text" })
    artist!: string;

    @Property({ type: "text" })
    image!: string;

    @Property({ type: "number" })
    bpm!: number;

    @OneToMany(() => ChartEntity, (chartEntity) => chartEntity.song, {
        cascade: [Cascade.ALL],
        orphanRemoval: true,
    })
    charts = new Collection<ChartEntity>(this);

    static fromModel(model: Song): SongEntity {
        const entity = new SongEntity();
        entity.id = model.id;
        entity.category = model.category;
        entity.title = model.title;
        entity.artist = model.artist;
        entity.image = model.image;
        entity.bpm = model.bpm;
        entity.charts.set(model.charts.map(ChartEntity.fromModel));
        return entity;
    }

    toModel(): Song {
        return {
            id: this.id,
            category: this.category,
            title: this.title,
            artist: this.artist,
            image: this.image,
            bpm: this.bpm,
            charts: this.charts.getItems().map((chart) => chart.toModel()),
        };
    }
}
