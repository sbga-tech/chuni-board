import { SongRepository } from "@/data";
import { readFile } from "@/util/fileutil";
import { CONSTANTS } from "@/constant";
import Fuse, { FuseResult } from "fuse.js";
import { containsJapanese, convertKanjiToChinese } from "@/util/jputil";
import { SongSearchError } from "@/error";

interface AliasEntry {
    alias: string;
    songId: number;
}

export class SongSearch {
    private searchList: AliasEntry[] = [];
    private fuse?: Fuse<AliasEntry>;
    constructor(private songRepository: SongRepository) {}

    async load() {
        await this.buildSearchList();
        this.fuse = new Fuse(this.searchList, {
            keys: ["alias"], // Only search within the alias field
            threshold: 0.3, // Lower value = stricter matching
            distance: 100, // Max distance between characters for matching
            includeScore: true, // Include score in results
        });
    }

    private async buildSearchList() {
        const songNames = Array.from(this.songRepository.getAll().entries()).map(
            ([songId, song]) => {
                return {
                    alias: song.title,
                    songId: songId,
                };
            }
        );
        const songNameTransforms = songNames.map((entry) => {
            let name = entry.alias;
            if (containsJapanese(name)) {
                name = convertKanjiToChinese(name);
            } else {
                name = extractAbbreviation(name);
            }
            return {
                alias: name,
                songId: entry.songId,
            };
        });
        songNames.push(...songNameTransforms);
        const aliases = await readFile<AliasEntry[]>(CONSTANTS.SONG_ALIASES_FILE_PATH);
        songNames.push(...aliases);
        this.searchList = songNames;
    }

    match(songName: string): number[] {
        if (!this.fuse) {
            throw new SongSearchError("Search list not loaded");
        }
        const results = this.fuse.search(songName);
        if (results.length === 0) {
            return [];
        }
        const bestScore = results[0].score!;
        const topMatches = results.filter(
            (result) => Math.abs(result.score! - bestScore) < Number.EPSILON
        );
        return Array.from(new Set(topMatches.map((match) => match.item.songId)));
    }
}

function extractAbbreviation(title: string): string {
    // Remove special characters, split by spaces or remaining characters
    const words = title.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/);

    // Extract the first letter of each word to form an abbreviation
    return words
        .map((word) => word[0])
        .join("")
        .toLowerCase();
}
