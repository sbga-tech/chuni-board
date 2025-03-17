export enum AppStatus {
    INITIALIZED = "INITIALIZED",
    RUNNING = "RUNNING",
    STOPPED = "STOPPED",
    ERROR = "ERROR",
    DESTROYING = "DESTROYING",
}

export interface ErrorMsg {
    name: string;
    message: string;
}

const appStatus = ref<{ status: AppStatus; err?: ErrorMsg }>({ status: AppStatus.INITIALIZED });

export function useAppStatus() {
    const { isConnected, registerCommandHandler } = useWebSocketClient();

    registerCommandHandler('setAppStatus', (args) => {
        console.log('Updating app status:', args);
        appStatus.value = args;
    });

    return {
        appStatus,
        isConnected
    };
}
