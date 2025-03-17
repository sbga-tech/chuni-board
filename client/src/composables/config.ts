const config = ref<Record<string, any>>({});
let isUpdatingFromServer = false; // Flag to prevent infinite update loop

export function useConfig() {
    const { isConnected, registerCommandHandler, sendRequest } = useWebSocketClient();

    // Handle server-initiated config updates
    registerCommandHandler("setConfig", (args: Record<string, any>) => {
        console.log("Received config update from server:", args);
        isUpdatingFromServer = true;
        config.value = { ...args };
        setTimeout(() => (isUpdatingFromServer = false), 50); // Small delay to avoid race conditions
    });

    // Watch for local updates and send them to the server
    watch(
        config,
        (newConfig) => {
            if (!isUpdatingFromServer) {
                console.log("Sending config update to server:", newConfig);
                sendRequest("updateConfigAll", newConfig).catch((err: any) =>
                    console.error("Failed to update config:", err)
                );
            }
        },
        { deep: true }
    );

    return {
        config,
        isConnected,
    };
}
