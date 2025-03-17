import { ConsoleMessageHandler } from "@/message/handler";
import { ServerCommand } from "@/server-command";

export type MessageArgument = string;

//Command for client to update config in the server
export class MessageCommand implements ServerCommand<void> {
    constructor(
        private handler: ConsoleMessageHandler,
        private argument: MessageArgument
    ) {}
    execute() {
        this.handler.handleMessage(this.argument);
    }
}
