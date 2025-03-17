import {
    ServerCommandActions,
    ServerCommandArguments,
    ServerCommandManager,
} from "@/server-command";
import { Server as HttpServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import {
    ClientCommand,
    ClientCommandActions,
    ClientCommandArguments,
    ClientCommandDispatcher,
} from "@/client-command";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "@/util/logger";

interface WebsocketRequest<T, U> {
    type: "request";
    action: T;
    args: U;
}

interface WebsocketResponse<T> {
    type: "response";
    action: T;
    success: boolean;
    data?: any;
}

// Define the communication initiated by the client
interface ServerCommandRequest
    extends WebsocketRequest<ServerCommandActions, ServerCommandArguments> {
    requestId: string;
}
interface ServerCommandResponse extends WebsocketResponse<ServerCommandActions> {
    requestId: string;
}

interface ClientCommandRequest
    extends WebsocketRequest<ClientCommandActions, ClientCommandArguments> {}

export class WsController implements ClientCommandDispatcher {
    private wss: WebSocketServer;
    private logger = createLogger("WsController");
    private clients = new Map<string, WebSocket>();

    private newClientListeners: ((clientId: string) => void)[] = [];

    constructor(
        server: HttpServer,
        path: string,
        private command: ServerCommandManager
    ) {
        // Create the WebSocket server using the provided HTTP server
        // and set the path to /ws.
        this.wss = new WebSocketServer({ server, path });

        // Listen for new WebSocket connections
        this.wss.on("connection", this.handleConnection.bind(this));
    }

    addNewClientListener(callback: (clientId: string) => void): void {
        this.newClientListeners.push(callback);
    }

    removeNewClientListener(callback: (clientId: string) => void): void {
        const index = this.newClientListeners.indexOf(callback);
        if (index !== -1) {
            this.newClientListeners.splice(index, 1);
        }
    }

    private handleConnection(socket: WebSocket) {
        this.logger.info("有新的客户端连接");

        const clientId = uuidv4(); // A unique ID for this socket
        this.clients.set(clientId, socket);

        // Notify all listeners of the new client
        for (const listener of this.newClientListeners) {
            listener(clientId);
        }

        // Listen for messages from the client
        socket.on("message", (message: WebSocket.Data) => {
            this.onMessage(message.toString(), socket);
        });

        // Optionally listen for closure, errors, etc.
        socket.on("close", () => {
            this.logger.info("客户端断开连接");
        });
    }

    private async onMessage(message: string, socket: WebSocket) {
        // Parse the incoming message
        let command: ServerCommandRequest;
        try {
            command = JSON.parse(message);
        } catch (error) {
            this.logger.error("Failed to parse incoming message:", error);
            return;
        }

        // Execute the command
        const responseRaw = await this.command.run(command.action, command.args);

        const response: ServerCommandResponse = {
            type: "response",
            action: command.action,
            success: responseRaw.success,
            data: responseRaw.data,
            requestId: command.requestId,
        };

        // Send the response back to the client
        socket.send(JSON.stringify(response));
    }

    dispatchAll(command: ClientCommand): void {
        // Send to all connected sockets
        for (const [clientId, ws] of this.clients) {
            this.dispatch(clientId, command);
        }
    }

    /**
     * Sends the given command to exactly one client.
     */
    dispatch(clientId: string, command: ClientCommand): void {
        const ws = this.clients.get(clientId);
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const request: ClientCommandRequest = {
            type: "request",
            action: command.action,
            args: command.args,
        };

        this.logger.debug(`Sending command to client ${clientId}: ${JSON.stringify(request)}`);

        ws.send(JSON.stringify(request));
    }
}
