import { AppStatus } from "@/core";
import { ErrorMsg } from "@/error";
import { Order } from "@/order-list";

interface BaseClientCommand {
    action: string;
    args: any;
}

interface SetOrderListCommand extends BaseClientCommand {
    action: "setOrderList";
    args: Order[];
}

interface SetConfigCommand extends BaseClientCommand {
    action: "setConfig";
    args: Record<string, any>;
}

interface SetAppStatusCommand extends BaseClientCommand {
    action: "setAppStatus";
    args: {
        status: AppStatus;
        err?: ErrorMsg;
    };
}

export type ClientCommand = SetOrderListCommand | SetConfigCommand | SetAppStatusCommand;
export type ClientCommandActions = ClientCommand["action"];
export type ClientCommandArguments = ClientCommand["args"];

export interface ClientCommandDispatcher {
    addNewClientListener(callback: (clientId: string) => void): void;
    removeNewClientListener(callback: (clientId: string) => void): void;
    dispatchAll(command: ClientCommand): void;
    dispatch(clientId: string, command: ClientCommand): void;
}
