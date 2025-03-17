import { Difficulty } from "@/data/model";
import { OrderListManager } from "@/order-list";
import {
    OrderPushArgument,
    OrderAmbiguousPushArgument,
    OrderRemoveArgument,
    OrderMoveArgument,
} from "@/server-command/order-list";
import { SongSearch } from "@/util/song-search";

type ParsedCommand =
    | { action: "orderPush"; args: OrderPushArgument }
    | { action: "orderAmbiguousPush"; args: OrderAmbiguousPushArgument }
    | { action: "orderRemove"; args: OrderRemoveArgument }
    | { action: "orderMove"; args: OrderMoveArgument };

class MessageParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MessageParseError";
    }
}

const exactDifficultyMap: { [key: string]: Difficulty } = {
    绿: Difficulty.BAS,
    黄: Difficulty.ADV,
    红: Difficulty.EXP,
    紫: Difficulty.MAS,
    黑: Difficulty.ULT,
    彩: Difficulty.WE,
};
const difficultyMap: { [key: string]: Difficulty } = {
    bas: Difficulty.BAS,
    adv: Difficulty.ADV,
    ex: Difficulty.EXP,
    ma: Difficulty.MAS,
    ult: Difficulty.ULT,
    we: Difficulty.WE,
    "worlds end": Difficulty.WE,
    "world's end": Difficulty.WE,
};

export class MessageParser {
    constructor(
        private orderListManager: OrderListManager,
        private songSearch: SongSearch
    ) {}

    parse(message: string): ParsedCommand {
        if (message.startsWith("点歌")) {
            const args = this.parseArguments(message.slice(2));
            if (args.length === 0) {
                throw new MessageParseError("Invalid arguments");
            }
            const { songName, difficulty } = this.parseOrder(args);
            const matchedSongs = this.songSearch.match(songName);
            if (matchedSongs.length === 0) {
                throw new MessageParseError(`未找到曲目: ${songName}`);
            } else if (matchedSongs.length === 1) {
                return {
                    action: "orderPush",
                    args: { songId: matchedSongs[0], difficulty },
                };
            } else {
                return {
                    action: "orderAmbiguousPush",
                    args: { candidates: matchedSongs, difficulty },
                };
            }
        } else if (message.startsWith("删除")) {
            const args = this.parseArguments(message.slice(2));
            if (args.length !== 1) {
                throw new MessageParseError("Invalid arguments");
            }
            if (isNaN(parseInt(args[0]))) {
                throw new MessageParseError("Invalid arguments");
            }
            const orderIndex = parseInt(args[0]) - 1;
            const orderList = this.orderListManager.getOrderList();
            if (orderIndex < 0 || orderIndex >= orderList.length) {
                throw new MessageParseError("Invalid arguments");
            }
            const orderId = orderList[orderIndex].orderId;
            return {
                action: "orderRemove",
                args: { orderId: orderId },
            };
        } else if (message.startsWith("置顶")) {
            const args = this.parseArguments(message.slice(2));
            if (args.length !== 1) {
                throw new MessageParseError("Invalid arguments");
            }
            if (isNaN(parseInt(args[0]))) {
                throw new MessageParseError("Invalid arguments");
            }
            const orderIndex = parseInt(args[0]) - 1;
            const orderList = this.orderListManager.getOrderList();
            if (orderIndex < 0 || orderIndex >= orderList.length) {
                throw new MessageParseError("Invalid arguments");
            }
            const orderId = orderList[orderIndex].orderId;
            return {
                action: "orderMove",
                args: { orderId: orderId, newIndex: 0 },
            };
        }
        throw new MessageParseError("Unknown command");
    }

    private parseOrder(args: string[]): { songName: string; difficulty: Difficulty } {
        const firstChar = args[0].charAt(0);
        // Edge case were the song is a single character
        if (args.length === 1 && args[0].length === 1) {
            return {
                songName: args[0],
                difficulty: Difficulty.MAS,
            };
        }
        // front difficulty case
        if (this.isDifficulty(firstChar)) {
            args[0] = args[0].slice(1);
            return {
                songName: args.join(" "),
                difficulty: this.parseDifficulty(firstChar),
            };
        }
        // back difficulty case

        if (this.isDifficulty(args[args.length - 1])) {
            const difficulty = this.parseDifficulty(args[args.length - 1]);
            return {
                songName: args.slice(0, args.length - 1).join(" "),
                difficulty: difficulty,
            };
        }
        // default difficulty case
        return {
            songName: args.join(" "),
            difficulty: Difficulty.MAS,
        };
    }

    private parseArguments(message: string): string[] {
        return message.split(" ").filter((arg) => arg !== "");
    }

    private isDifficulty(difficulty: string): boolean {
        const normalizedDifficulty = difficulty.toLowerCase();
        if (difficulty in exactDifficultyMap) {
            return true;
        }
        return Object.keys(difficultyMap).some((prefix) => normalizedDifficulty.startsWith(prefix));
    }

    private parseDifficulty(difficulty: string): Difficulty {
        const normalizedDifficulty = difficulty.toLowerCase();

        if (normalizedDifficulty in exactDifficultyMap) {
            return exactDifficultyMap[normalizedDifficulty];
        }

        for (const prefix in difficultyMap) {
            if (normalizedDifficulty.startsWith(prefix)) {
                return difficultyMap[prefix];
            }
        }

        throw new MessageParseError(`Unknown difficulty: ${difficulty}`);
    }
}
