import { BilibiliGameClient } from "@/bili-game";
import { EventMessage } from "@/bili-game/event-message";
import { OrderListManager } from "@/order-list";
import { MessageParser } from "@/message/parser";
import { ServerCommandManager } from "@/server-command";
import { createLogger } from "@/util/logger";

export class GameMessageHandler {
    private ambiguousOrderMap: Map<string, string> = new Map();
    private logger = createLogger("GameMessageHandler");

    constructor(
        private gameClient: BilibiliGameClient,
        private messageParser: MessageParser,
        private orderListManager: OrderListManager,
        private commandManager: ServerCommandManager
    ) {
        this.gameClient.onEventMessage((event: EventMessage) => this.handleMessage(event));
    }

    async handleMessage(event: EventMessage) {
        if (event.cmd === "LIVE_OPEN_PLATFORM_DM") {
            const user = event.data;
            const message = user.msg;
            const isAdmin = user.is_admin === 1 || this.gameClient.isAnchor(user.open_id);
            const isGuard = (user.guard_level ?? 0) > 0;
            await this.processMessage(message, event.data.open_id, isGuard, isAdmin);
        } else if (event.cmd === "LIVE_OPEN_PLATFORM_SUPER_CHAT") {
            const user = event.data;
            const message = user.message;
            await this.processMessage(message, event.data.open_id, true);
        }
    }

    private async processMessage(
        message: string,
        userId: string,
        pin: boolean = false,
        isAdmin: boolean = false
    ) {
        this.logger.debug(`收到弹幕 ${message}`);
        if (!isNaN(parseInt(message))) {
            // If message is purely a number, it is confirming an ambiguous order
            const orderId = this.ambiguousOrderMap.get(userId);
            if (orderId) {
                const result = await this.commandManager.run("orderConfirm", {
                    orderId,
                    songIdIndex: parseInt(message) - 1,
                });
                if (result.success) {
                    this.ambiguousOrderMap.delete(userId);
                }
            }
            return;
        }
        try {
            const parsed = this.messageParser.parse(message.trim());
            this.logger.info(`收到弹幕指令 ${parsed.action} ${JSON.stringify(parsed.args)}`);
            let orderId;
            switch (parsed.action) {
                case "orderAmbiguousPush":
                    orderId = await this.commandManager.run(parsed.action, parsed.args);
                    if (!orderId.success) {
                        break;
                    }
                    this.handleAmbiguousOrder(userId, orderId.data!);
                    if (pin) {
                        await this.commandManager.run("orderMove", {
                            orderId: orderId.data!,
                            newIndex: 0,
                        });
                    }
                    break;
                case "orderPush":
                    orderId = await this.commandManager.run(parsed.action, parsed.args);
                    if (pin && orderId.success)
                        await this.commandManager.run("orderMove", {
                            orderId: orderId.data!,
                            newIndex: 0,
                        });
                    break;
                case "orderRemove":
                    if (isAdmin) await this.commandManager.run(parsed.action, parsed.args);
                    break;
                case "orderMove":
                    if (isAdmin) await this.commandManager.run(parsed.action, parsed.args);
                    break;
            }
        } catch (e) {
            this.logger.debug(e);
        }
    }

    private handleAmbiguousOrder(userId: string, orderId: string) {
        if (this.ambiguousOrderMap.has(userId))
            this.commandManager.run("orderRemove", {
                orderId: this.ambiguousOrderMap.get(userId)!,
            });
        this.ambiguousOrderMap.set(userId, orderId);
    }
}

export class ConsoleMessageHandler {
    private logger = createLogger("ConsoleMessageHandler");

    private ambiguousOrderId: string | null = null;

    constructor(
        private messageParser: MessageParser,
        private commandManager: ServerCommandManager
    ) {}

    public async handleMessage(message: string) {
        if (!isNaN(parseInt(message))) {
            // If message is purely a number, it is confirming an ambiguous order
            const orderId = this.ambiguousOrderId;
            if (orderId) {
                const result = await this.commandManager.run("orderConfirm", {
                    orderId,
                    songIdIndex: parseInt(message) - 1,
                });
                if (result.success) {
                    this.ambiguousOrderId = null;
                }
            }
            return;
        }

        try {
            const parsed = this.messageParser.parse(message.trim());
            this.logger.info(`收到控制台指令 ${parsed.action} ${JSON.stringify(parsed.args)}`);
            const res = await this.commandManager.run(parsed.action, parsed.args);
            if (parsed.action === "orderAmbiguousPush") {
                if (res.success) {
                    this.ambiguousOrderId = res.data!;
                }
            }
        } catch (e) {
            this.logger.debug(e);
        }
    }
}
