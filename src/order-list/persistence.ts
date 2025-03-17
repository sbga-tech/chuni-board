import { CONSTANTS } from "@/constant";
import { Order } from "@/order-list";
import { readFile, writeFile } from "@/util/fileutil";

//TODO
export class OrderListPersistence {
    constructor() {}
    async load(): Promise<Order[]> {
        return await readFile<Order[]>(CONSTANTS.ORDER_LIST_FILE_PATH);
    }

    async save(orderList: Order[]): Promise<void> {
        await writeFile(CONSTANTS.ORDER_LIST_FILE_PATH, orderList);
    }
}
