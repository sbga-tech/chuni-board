import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Difficulty, Chart } from "@/data/model";
import { SongEntity } from "@/data/persistence/entities/song.entity";

@Entity()
export class ChartEntity {
    @ManyToOne(() => SongEntity, { primary: true })
    song!: SongEntity;

    @PrimaryKey({ type: "number" })
    difficulty!: Difficulty;

    @Property({ type: "number" })
    level!: number;

    @Property({ type: "number" })
    levelDecimal!: number;

    @Property({ type: "text" })
    levelDesigner!: string;

    @Property({ type: "text" })
    we_kanji!: string;

    @Property({ type: "number" })
    we_star!: number;

    static fromModel(model: Chart): ChartEntity {
        const entity = new ChartEntity();
        entity.difficulty = model.difficulty;
        entity.level = model.level;
        entity.levelDecimal = model.levelDecimal;
        entity.levelDesigner = model.levelDesigner;
        entity.we_kanji = model.we_kanji;
        entity.we_star = model.we_star;
        return entity;
    }

    toModel(): Chart {
        return {
            songId: this.song.id,
            difficulty: this.difficulty,
            level: this.level,
            levelDecimal: this.levelDecimal,
            levelDesigner: this.levelDesigner,
            we_kanji: this.we_kanji,
            we_star: this.we_star,
        };
    }
}
