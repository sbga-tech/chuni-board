import { Category, Difficulty, Song } from "@/data/model";
import { SongDataSource } from "@/data/datasource";
import { createLogger } from "@/util/logger";
import axios from "axios";
import { CONSTANTS } from "@/constant";
import { readFile, writeFile } from "@/util/fileutil";
import { getGithubHost } from "@/util/ghutil";
import { DatasourceError } from "@/error";

interface OtogeDBSong {
    id: number;
    catname: Category;
    newflag: number;
    title: string;
    reading: string;
    artist: string;
    lev_bas: string;
    lev_adv: string;
    lev_exp: string;
    lev_mas: string;
    lev_ult: string;
    lev_bas_i?: string;
    lev_bas_designer?: string;
    lev_adv_i?: string;
    lev_adv_designer?: string;
    lev_exp_i?: string;
    lev_exp_designer?: string;
    lev_mas_i?: string;
    lev_mas_designer?: string;
    lev_ult_i?: string;
    lev_ult_designer?: string;
    lev_we_designer?: string;
    we_kanji: string;
    we_star: number;
    image: string;
    bpm: number;
}

const DIFFICULTY_MAP: { [key: string]: Difficulty } = {
    lev_bas: Difficulty.BAS,
    lev_adv: Difficulty.ADV,
    lev_exp: Difficulty.EXP,
    lev_mas: Difficulty.MAS,
    lev_ult: Difficulty.ULT,
    we_kanji: Difficulty.WE,
};

export class OtogeDBDataSource implements SongDataSource {
    private logger = createLogger("OtogeDBDataSource");

    async fetchSongs(songs: Map<number, Song>) {
        const remoteSongs = await this.fetchRemoteSongs();
        for (const remoteSong of remoteSongs) {
            const song = this.convertToModel(remoteSong);
            if (Number.isNaN(song.id)) {
                throw new DatasourceError("无效的歌曲ID: " + remoteSong.id);
            }
            songs.set(song.id, song);
        }
        this.logger.info(`已获取 ${songs.size} 首歌曲信息`);
    }

    private convertToModel(otogeDbSong: OtogeDBSong): Song {
        //I dont know why the json parser is bypassing the type check
        const forcedId = parseInt(otogeDbSong.id as any);
        const forcedBpm = parseInt(otogeDbSong.bpm as any) || 0;
        const model: Song = {
            id: forcedId,
            category: otogeDbSong.catname,
            title: otogeDbSong.title,
            artist: otogeDbSong.artist,
            image: otogeDbSong.image,
            bpm: forcedBpm,
            charts: [],
        };
        for (const [difficulty, level] of Object.entries(otogeDbSong)) {
            if (difficulty in DIFFICULTY_MAP) {
                if (level === "") {
                    continue;
                }
                if (difficulty === "we_kanji") {
                    model.charts.push({
                        songId: forcedId,
                        difficulty: DIFFICULTY_MAP[difficulty],
                        level: 0,
                        levelDecimal: 0,
                        we_kanji: otogeDbSong.we_kanji,
                        we_star: otogeDbSong.we_star,
                        levelDesigner: otogeDbSong.lev_we_designer || "",
                    });
                    continue;
                }
                const levelDecimalKey = `${difficulty}_i` as keyof OtogeDBSong;
                const levelDesigner = (otogeDbSong[`${difficulty}_designer` as keyof OtogeDBSong] ||
                    "") as string;

                const levelValue = parseInt((level as string).replace("+", ""));
                let levelDecimalValue =
                    parseFloat(otogeDbSong[levelDecimalKey] as string) || levelValue;
                levelDecimalValue = Math.round((levelDecimalValue - levelValue) * 100);
                model.charts.push({
                    songId: forcedId,
                    difficulty: DIFFICULTY_MAP[difficulty],
                    level: levelValue,
                    levelDecimal: levelDecimalValue,
                    levelDesigner: levelDesigner,
                    we_kanji: "",
                    we_star: 0,
                });
            }
        }
        return model;
    }

    private async fetchRemoteSongs(): Promise<OtogeDBSong[]> {
        try {
            const url = URL.parse(CONSTANTS.OTOGEDB_REMOTE_URL);
            const orginalHostname = url?.hostname || "";
            const host = await getGithubHost(orginalHostname);
            const remoteUrl = `${url?.protocol}//${host}${url?.pathname}`;
            const response = await axios.get<OtogeDBSong[]>(remoteUrl, {
                headers: {
                    Host: orginalHostname,
                },
            });
            return response.data;
        } catch (err) {
            this.logger.error("无法下载歌曲信息" + JSON.stringify(err));
            return await this.fetchLocalBackupSongs();
        }
    }

    private async fetchLocalBackupSongs(): Promise<OtogeDBSong[]> {
        return await readFile<OtogeDBSong[]>(CONSTANTS.OTOGE_LOCAL_BACKUP_PATH, false);
    }
}
