import { ServerCommand } from "@/server-command";
import { Difficulty } from "@/data/model";
import { OrderListManager } from "@/order-list";

export interface OrderPushArgument {
    songId: number;
    difficulty: Difficulty;
}
export class OrderPushCommand implements ServerCommand<string> {
    constructor(
        private songListManager: OrderListManager,
        private argument: OrderPushArgument
    ) {}
    execute(): string {
        return this.songListManager.pushOrder(this.argument.songId, this.argument.difficulty);
    }
}
export interface OrderAmbiguousPushArgument {
    candidates: number[];
    difficulty: Difficulty;
}
export class OrderAmbiguousPushCommand implements ServerCommand<string> {
    constructor(
        private songListManager: OrderListManager,
        private argument: OrderAmbiguousPushArgument
    ) {}
    execute(): string {
        return this.songListManager.pushAmbiguousOrder(
            this.argument.candidates,
            this.argument.difficulty
        );
    }
}
export interface OrderConfirmArgument {
    orderId: string;
    songIdIndex: number;
}
export class OrderConfirmCommand implements ServerCommand<void> {
    constructor(
        private songListManager: OrderListManager,
        private argument: OrderConfirmArgument
    ) {}
    execute(): void {
        this.songListManager.confirmOrder(this.argument.orderId, this.argument.songIdIndex);
    }
}
export interface OrderCompleteArgument {
    orderId: string;
}
export class OrderCompleteCommand implements ServerCommand<void> {
    constructor(
        private songListManager: OrderListManager,
        private argument: OrderCompleteArgument
    ) {}
    async execute(): Promise<void> {
        await this.songListManager.completeOrder(this.argument.orderId);
    }
}
export interface OrderRemoveArgument {
    orderId: string;
}
export class OrderRemoveCommand implements ServerCommand<void> {
    constructor(
        private songListManager: OrderListManager,
        private argument: OrderRemoveArgument
    ) {}
    execute(): void {
        this.songListManager.removeOrder(this.argument.orderId);
    }
}
export interface OrderMoveArgument {
    orderId: string;
    newIndex: number;
}
export class OrderMoveCommand implements ServerCommand<void> {
    constructor(
        private songListManager: OrderListManager,
        private argument: OrderMoveArgument
    ) {}
    execute(): void {
        this.songListManager.moveOrder(this.argument.orderId, this.argument.newIndex);
    }
}
