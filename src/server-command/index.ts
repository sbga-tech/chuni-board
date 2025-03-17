import { OrderListManager } from "@/order-list";
import * as SongListCommands from "@/server-command/order-list";
import { Logger } from "winston";
import { createLogger } from "@/util/logger";
import { UpdateConfigAllCommand, UpdateConfigAllArgument } from "@/server-command/config";
import { UpdateSongCommand, UpdateSongArgument } from "@/server-command/song-update";
import { SongRepositoryUpdater } from "@/data";
import { AppRestartArgument, AppRestartCommand } from "@/server-command/core";
import { MessageCommand, MessageArgument } from "@/server-command/message";
import { ConsoleMessageHandler } from "@/message/handler";

interface ServerCommand<R> {
    execute(): R | Promise<R>;
}

interface ServerCommandResult<T> {
    success: boolean;
    data?: T;
}

interface ServerCommandMap {
    orderPush: {
        command: SongListCommands.OrderPushCommand;
        argument: SongListCommands.OrderPushArgument;
    };
    orderAmbiguousPush: {
        command: SongListCommands.OrderAmbiguousPushCommand;
        argument: SongListCommands.OrderAmbiguousPushArgument;
    };
    orderConfirm: {
        command: SongListCommands.OrderConfirmCommand;
        argument: SongListCommands.OrderConfirmArgument;
    };
    orderComplete: {
        command: SongListCommands.OrderCompleteCommand;
        argument: SongListCommands.OrderCompleteArgument;
    };
    orderRemove: {
        command: SongListCommands.OrderRemoveCommand;
        argument: SongListCommands.OrderRemoveArgument;
    };
    orderMove: {
        command: SongListCommands.OrderMoveCommand;
        argument: SongListCommands.OrderMoveArgument;
    };
    updateConfigAll: {
        command: UpdateConfigAllCommand;
        argument: UpdateConfigAllArgument;
    };
    updateSong: {
        command: UpdateSongCommand;
        argument: UpdateSongArgument;
    };
    message: {
        command: MessageCommand;
        argument: MessageArgument;
    };
    restart: {
        command: AppRestartCommand;
        argument: AppRestartArgument;
    };
}

export type ServerCommandActions = keyof ServerCommandMap;
export type ServerCommandArgument<T extends ServerCommandActions> = ServerCommandMap[T]["argument"];
export type ServerCommandArguments = ServerCommandArgument<ServerCommandActions>;
export type ServerCommandReturnType<T extends ServerCommandActions> = ReturnType<
    ServerCommandMap[T]["command"]["execute"]
>;

type Factories = {
    [K in ServerCommandActions]: (
        args: ServerCommandMap[K]["argument"]
    ) => ServerCommandMap[K]["command"];
};

class ServerCommandManager {
    /**
     * 'commands' is a partial record of action -> factory function.
     * Each factory takes the correct argument type and returns the correct command type.
     */
    private commands: Partial<Factories> = {};

    private loggers: Map<ServerCommandActions, Logger> = new Map();

    /**
     * Register a factory function for the given command action.
     */
    register<T extends ServerCommandActions>(action: T, commandFactory: Factories[T]): void {
        this.commands[action] = commandFactory;
        this.loggers.set(action, createLogger(`Command/${action}`));
    }

    /**
     * Clear all registered commands and loggers.
     */
    clear(): void {
        this.commands = {};
        this.loggers.clear();
    }

    /**
     * Create (instantiate) a command for the given action + arguments.
     */
    private create<T extends ServerCommandActions>(
        action: T,
        args: ServerCommandMap[T]["argument"]
    ): ServerCommandMap[T]["command"] | null {
        const factory = this.commands[action];
        return factory ? factory(args) : null;
    }

    /**
     * Shortcut to directly execute the command.
     */
    async run<T extends ServerCommandActions>(
        action: T,
        args: ServerCommandArgument<T>
    ): Promise<ServerCommandResult<Awaited<ServerCommandReturnType<T>>>> {
        try {
            const command = this.create(action, args);
            if (!command) {
                // The command wasn't registered or something is wrong
                return { success: false };
            }

            const data = (await command.execute()) as Awaited<ServerCommandReturnType<T>>;

            this.loggers
                .get(action)
                ?.info(`服务器指令执行完成 ${data ? JSON.stringify(data) : ""}`);

            return {
                success: true,
                data, // If the type is void, this is `undefined`
            };
        } catch (error) {
            this.loggers.get(action)?.error(error);
            return {
                success: false,
            };
        }
    }
}

export class ServerCommandRegistrar {
    constructor(private manager: ServerCommandManager) {}

    public registerCoreCommands() {
        this.manager.register("restart", (args) => new AppRestartCommand(args));
    }

    public registerConfigCommand() {
        this.manager.register("updateConfigAll", (args) => new UpdateConfigAllCommand(args));
    }

    public registerSongUpdateCommand(updater: SongRepositoryUpdater) {
        this.manager.register("updateSong", () => new UpdateSongCommand(updater));
    }

    public registerSongListCommands(orderListManager: OrderListManager) {
        this.manager.register(
            "orderPush",
            (args) => new SongListCommands.OrderPushCommand(orderListManager, args)
        );
        this.manager.register(
            "orderAmbiguousPush",
            (args) => new SongListCommands.OrderAmbiguousPushCommand(orderListManager, args)
        );
        this.manager.register(
            "orderConfirm",
            (args) => new SongListCommands.OrderConfirmCommand(orderListManager, args)
        );
        this.manager.register(
            "orderComplete",
            (args) => new SongListCommands.OrderCompleteCommand(orderListManager, args)
        );
        this.manager.register(
            "orderRemove",
            (args) => new SongListCommands.OrderRemoveCommand(orderListManager, args)
        );
        this.manager.register(
            "orderMove",
            (args) => new SongListCommands.OrderMoveCommand(orderListManager, args)
        );
    }

    public registerMessageCommand(hanlder: ConsoleMessageHandler) {
        this.manager.register("message", (args) => new MessageCommand(hanlder, args));
    }
}

export { ServerCommand, ServerCommandManager };
