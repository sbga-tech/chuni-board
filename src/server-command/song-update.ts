import { ServerCommand } from "@/server-command";
import { SongRepositoryUpdater } from "@/data";

export interface UpdateSongArgument {}

export class UpdateSongCommand implements ServerCommand<void> {
    constructor(private updater: SongRepositoryUpdater) {}
    async execute() {
        this.updater.updateRepository();
    }
}
