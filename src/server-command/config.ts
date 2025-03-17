import { ServerCommand } from "@/server-command";
import ConfigManager from "@/config";

export type UpdateConfigAllArgument = Record<string, any>;

//Command for client to update config in the server
export class UpdateConfigAllCommand implements ServerCommand<void> {
    constructor(private argument: UpdateConfigAllArgument) {}
    execute() {
        ConfigManager.getInstance().updateConfig(this.argument);
    }
}
