import { Song } from "@/data/model";

export interface SongDataSource {
    fetchSongs(songs: Map<number, Song>): Promise<void>;
}
