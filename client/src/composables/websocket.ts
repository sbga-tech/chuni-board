import { v4 as uuidv4 } from 'uuid';

interface WebsocketRequest {
    type: 'request';
    action: string;
    args?: any;
    requestId: string;
}

interface WebsocketResponse {
    type: 'response';
    action: string;
    success: boolean;
    data?: any;
    requestId: string;
}

type WebSocketPacket = WebsocketRequest | WebsocketResponse;

type ClientCommandHandlers = Record<string, (args: any) => void>;

const WS_ENDPOINT_URL = `ws://${window.location.hostname}:48200/ws`;

// Singleton variables
let ws: WebSocket | null = null;
const isConnected = ref(false);
const pendingRequests = new Map<string, { resolve: (data: any) => void; reject: (err: any) => void }>();
const commandHandlers: ClientCommandHandlers = {} as ClientCommandHandlers;

const connect = () => {
    if (ws) return; // Prevent multiple connections

    ws = new WebSocket(WS_ENDPOINT_URL);

    ws.onopen = () => {
        isConnected.value = true;
        console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
        const response = JSON.parse(event.data) as WebSocketPacket;

        if (response.type === 'response' && response.requestId) {
            if (pendingRequests.has(response.requestId)) {
                const { resolve, reject } = pendingRequests.get(response.requestId)!;
                pendingRequests.delete(response.requestId);

                response.success ? resolve(response.data) : reject(new Error(`Request failed: ${response.action}`));
            }
        } else if (response.type === 'request' && response.action in commandHandlers) {
            commandHandlers[response.action](response.args);
        }
    };

    ws.onclose = () => {
        isConnected.value = false;
        console.log('WebSocket disconnected');
        ws = null; // Reset the instance so it can reconnect
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
};

// Ensure WebSocket is initialized once
connect();

export function useWebSocketClient() {
    const sendRequest = (action: string, args: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket is not connected'));
                return;
            }

            const requestId = uuidv4();
            const request: WebsocketRequest = {
                type: 'request',
                action,
                args,
                requestId
            };

            pendingRequests.set(requestId, { resolve, reject });

            ws.send(JSON.stringify(request));

            setTimeout(() => {
                if (pendingRequests.has(requestId)) {
                    reject(new Error(`Request timed out: ${requestId}`));
                    pendingRequests.delete(requestId);
                }
            }, 60000);
        });
    };

    const registerCommandHandler = (action: string, handler: (args: any) => void) => {
        commandHandlers[action] = handler;
    };

    const disconnect = () => {
        if (ws) {
            ws.close();
            ws = null;
        }
    };

    return {
        isConnected,
        sendRequest,
        registerCommandHandler,
        disconnect
    };
}
