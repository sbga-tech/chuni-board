enum Category {
    ORIGINAL = "ORIGINAL",
    POP_AND_ANIME = "POPS & ANIME",
    VARIETY = "VARIETY",
    NICONICO = "niconico",
    IRODORIMIDORI = "イロドリミドリ",
    GEKIMAI = "ゲキマイ",
    TOUHOU = "東方Project",
}

interface Song {
    id: number;
    category: Category;
    title: string;
    artist: string;
    image: string;
    bpm: number;
    charts: Chart[];
}

enum Difficulty {
    BAS = 0,
    ADV = 1,
    EXP = 2,
    MAS = 3,
    ULT = 4,
    WE = 5,
}

interface Chart {
    songId: number;
    difficulty: Difficulty;
    level: number;
    levelDecimal: number;
    we_kanji: string;
    we_star: number;
    levelDesigner: string;
}

export { Song, Chart, Category, Difficulty };
