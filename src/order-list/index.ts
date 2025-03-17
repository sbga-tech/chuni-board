import { ChusanBridgeClient } from "@/chusan-bridge";
import { ClientCommandDispatcher } from "@/client-command";
import { SongRepository } from "@/data";
import { Chart, Difficulty, Song } from "@/data/model";
import { v4 as uuidv4 } from "uuid";
import { OrderListPersistence } from "@/order-list/persistence";
import { OrderError } from "@/error";

interface BaseOrder {
    orderId: string;
    isAmbiguous: boolean;
}

interface UnambiguousOrder extends BaseOrder {
    isAmbiguous: false;
    song?: Song;
    chart?: Chart;
    difficulty?: never; // Prevents difficulty from appearing
    candidates?: never; // Prevents candidates from appearing
}

interface AmbiguousOrder extends BaseOrder {
    isAmbiguous: true;
    candidates: Song[];
    difficulty: Difficulty;
    song?: never; // Prevents song from appearing
    chart?: never; // Prevents chart from appearing
}

export type Order = UnambiguousOrder | AmbiguousOrder;

export class OrderListClientCommandAdapter {
    constructor(private orderListManager: OrderListManager) {}
}

export class OrderListManager {
    private orders: Order[] = [];
    private persistence: OrderListPersistence = new OrderListPersistence();

    constructor(
        private repo: SongRepository,
        private clientCommandDispatcher: ClientCommandDispatcher,
        private bridgeClient?: ChusanBridgeClient
    ) {}

    async init() {
        this.orders = await this.persistence.load();
        this.clientCommandDispatcher.addNewClientListener(this.onNewClient.bind(this));
        this.clientCommandDispatcher.dispatchAll({
            action: "setOrderList",
            args: this.orders,
        });
    }

    private onNewClient(clientId: string) {
        this.clientCommandDispatcher.dispatch(clientId, {
            action: "setOrderList",
            args: this.orders,
        });
    }

    destroy() {
        this.clientCommandDispatcher.removeNewClientListener(this.onNewClient);
    }

    pushOrder(songId: number, difficulty: Difficulty) {
        const song = this.repo.getSong(songId);
        const chart = this.repo.getChart(songId, difficulty);
        if (!chart || !song) {
            throw new OrderError(`未找到曲目 ${songId} 难度 ${difficulty} 对应信息`);
        }
        const order: Order = {
            orderId: uuidv4(),
            isAmbiguous: false,
            song: song,
            chart: chart,
        };
        this.orders.push(order);
        this.updateOrderList(); // Call updateOrderList
        return order.orderId;
    }

    pushAmbiguousOrder(candidates: number[], difficulty: Difficulty) {
        const songs = candidates.map((id) => this.repo.getSong(id)!);
        const order: AmbiguousOrder = {
            orderId: uuidv4(),
            isAmbiguous: true,
            difficulty: difficulty,
            candidates: songs,
        };
        this.orders.push(order);
        this.updateOrderList(); // Call updateOrderList
        return order.orderId;
    }

    confirmOrder(orderId: string, songIdIndex: number) {
        const order = this.orders.find((order) => order.orderId === orderId);
        if (!order) {
            throw new OrderError(`未找到点歌 ${orderId}`);
        }
        if (!order.isAmbiguous) {
            return;
        }
        if (songIdIndex < 0 || songIdIndex >= order.candidates!.length) {
            throw new OrderError(`未找到曲目 ${songIdIndex}`);
        }
        const song = order.candidates![songIdIndex];
        const chart = this.repo.getChart(song.id, order.difficulty);
        if (!chart) {
            this.removeOrder(orderId);
            throw new OrderError(`未找到曲目 ${song.id} 难度 ${order.difficulty} 对应信息`);
        }
        const newOrder: Order = {
            orderId: orderId,
            isAmbiguous: false,
            song: song,
            chart: chart,
        };
        this.replaceOrder(orderId, newOrder);
        this.updateOrderList(); // Call updateOrderList
    }

    async completeOrder(orderId: string) {
        const order = this.orders.find((order) => order.orderId === orderId);
        if (!order) {
            throw new OrderError(`未找到点歌 ${orderId}`);
        }
        if (order.isAmbiguous) {
            throw new OrderError(`点歌 ${orderId} 未确认`);
        }
        const songId = order.song!.id;
        const difficulty = order.chart!.difficulty;
        if (this.bridgeClient) {
            const success = await this.bridgeClient.selectSong(songId, difficulty);
            if (success) {
                this.removeOrder(orderId);
                this.updateOrderList(); // Call updateOrderList
            } else {
                throw new OrderError(`选择曲目 ${songId} 难度 ${difficulty} 失败`);
            }
        } else {
            this.removeOrder(orderId);
            this.updateOrderList(); // Call updateOrderList
        }
    }

    private replaceOrder(orderId: string, order: Order) {
        const index = this.orders.findIndex((order) => order.orderId === orderId);
        if (index !== -1) {
            this.orders[index] = order;
            this.updateOrderList(); // Call updateOrderList
        }
    }

    removeOrder(orderId: string) {
        const index = this.orders.findIndex((order) => order.orderId === orderId);
        if (index !== -1) {
            this.orders.splice(index, 1);
            this.updateOrderList(); // Call updateOrderList
        }
    }

    moveOrder(orderId: string, newIndex: number) {
        const order = this.orders.find((order) => order.orderId === orderId);
        if (!order) {
            throw new OrderError(`未找到点歌 ${orderId}`);
        }
        const index = this.orders.indexOf(order);
        if (index === -1) {
            throw new OrderError(`未找到点歌 ${orderId}`);
        }
        this.orders.splice(index, 1);
        this.orders.splice(newIndex, 0, order);
        this.updateOrderList(); // Call updateOrderList
    }

    updateOrderList() {
        this.clientCommandDispatcher.dispatchAll({
            action: "setOrderList",
            args: this.orders,
        });
        // Shouldn't be saving ambiguous orders
        this.persistence.save(this.orders.filter((order) => !order.isAmbiguous));
    }

    getOrderList() {
        return this.orders;
    }
}
