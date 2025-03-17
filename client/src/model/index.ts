export enum Category {
    ORIGINAL = "ORIGINAL",
    POP_AND_ANIME = "POPS & ANIME",
    VARIETY = "VARIETY",
    NICONICO = "niconico",
    IRODORIMIDORI = "イロドリミドリ",
    GEKIMAI = "ゲキマイ",
    TOUHOU = "東方Project"
}

export interface Song {
    id: number;
    category: Category;
    title: string;
    artist: string;
    image: string;
    bpm: number;
    charts: Chart[];
}

export enum Difficulty {
    BAS = 0,
    ADV = 1,
    EXP = 2,
    MAS = 3,
    ULT = 4,
    WE = 5
}

export interface Chart {
    songId: number;
    difficulty: Difficulty;
    level: number;
    levelDecimal: number;
    we_kanji: string;
    we_star: number;
    levelDesigner: string;
}

interface BaseOrder {
    orderId: string;
    isAmbiguous: boolean;
}

interface UnambiguousOrder extends BaseOrder {
    isAmbiguous: false;
    song?: Song;
    chart?: Chart;
    difficulty?: never;  // Prevents difficulty from appearing
    candidates?: never;  // Prevents candidates from appearing
}

interface AmbiguousOrder extends BaseOrder {
    isAmbiguous: true;
    candidates: Song[];
    difficulty: Difficulty;
    song?: never;  // Prevents song from appearing
    chart?: never; // Prevents chart from appearing
}

export type Order = UnambiguousOrder | AmbiguousOrder;