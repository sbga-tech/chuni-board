import { Core } from "@/core";
import { ServerCommand } from "@/server-command";

export interface AppRestartArgument {}

export class AppRestartCommand implements ServerCommand<void> {
    constructor(private argument: AppRestartArgument) {}
    async execute(): Promise<void> {
        await Core.getInstance().restart();
    }
}
