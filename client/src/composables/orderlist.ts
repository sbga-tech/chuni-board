import type { Order } from '@/model';

const orderList = ref<Order[]>([]);

export function useOrderList() {
    const { isConnected, registerCommandHandler } = useWebSocketClient();

    registerCommandHandler('setOrderList', (args) => {
        console.log('Updating order list:', args);
        orderList.value = args;
    });

    return {
        orderList,
        isConnected
    };
}