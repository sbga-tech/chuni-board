import { BilibiliGameClient, BilibiliClientConfig } from "@/bili-game";
import { ChusanBridgeClient, ChusanBridgeConfig } from "@/chusan-bridge";
import { ClientCommandDispatcher } from "@/client-command";
import ConfigManager from "@/config";
import { WsController } from "@/controller/ws-controller";
import { SongRepository, SongRepositoryUpdater } from "@/data";
import { SongDataSource } from "@/data/datasource";
import { ChusanBridgeDataSource } from "@/data/datasource/chusan-bridge";
import { OtogeDBDataSource } from "@/data/datasource/otogedb";
import { SongPersistence } from "@/data/persistence";
import { BilibiliError, CoreError, ErrorMsg } from "@/error";
import { GameMessageHandler, ConsoleMessageHandler } from "@/message/handler";
import { MessageParser } from "@/message/parser";
import { OrderListManager } from "@/order-list";
import { ServerCommandManager, ServerCommandRegistrar } from "@/server-command";
import { ServerCore } from "@/server-core";
import { createLogger } from "@/util/logger";
import { SongSearch } from "@/util/song-search";

export enum AppStatus {
    INITIALIZED = "INITIALIZED",
    RUNNING = "RUNNING",
    STOPPED = "STOPPED",
    ERROR = "ERROR",
    DESTROYING = "DESTROYING",
}

export class Core {
    private logger = createLogger("Core");
    private isStarting = false;
    private isStopping = false;
    private status: AppStatus;
    private lastErrorMsg?: ErrorMsg;

    private static instance: Core;

    bilibiliGameClient?: BilibiliGameClient;
    serverCommandManager?: ServerCommandManager;
    serverCommandRegistrar?: ServerCommandRegistrar;
    clientCommandDispatcher?: ClientCommandDispatcher;
    chusanBridgeClient?: ChusanBridgeClient;
    songPersistence?: SongPersistence;
    songRepository?: SongRepository;
    orderListManager?: OrderListManager;

    constructor() {
        this.initCommand();
        this.initServer();
        this.initConfig();
        this.status = AppStatus.INITIALIZED;
    }

    public static getInstance(): Core {
        if (!Core.instance) {
            Core.instance = new Core();
        }
        return Core.instance;
    }

    private initCommand() {
        this.serverCommandManager = new ServerCommandManager();
        this.serverCommandRegistrar = new ServerCommandRegistrar(this.serverCommandManager);
    }

    private initServer() {
        const serverBootstrap = new ServerCore();
        const server = serverBootstrap.init();
        this.clientCommandDispatcher = new WsController(server, "/ws", this.serverCommandManager!);
        this.clientCommandDispatcher.addNewClientListener((clientId) => {
            this.clientCommandDispatcher?.dispatch(clientId, {
                action: "setAppStatus",
                args: {
                    status: this.status,
                    err: this.status === AppStatus.ERROR ? this.lastErrorMsg : undefined,
                },
            });
        });
        serverBootstrap.start();
    }

    private initConfig() {
        ConfigManager.getInstance().registerKey("ui");
        ConfigManager.getInstance().registerKey("keymap");
        ConfigManager.getInstance().registerKey("bilibiliClient", { requireRestart: true });
        ConfigManager.getInstance().registerKey("chusanBridge", { requireRestart: true });

        //tell client to set config when they connect
        this.clientCommandDispatcher?.addNewClientListener((clientId) => {
            this.clientCommandDispatcher?.dispatch(clientId, {
                action: "setConfig",
                args: ConfigManager.getInstance().getRawConfigs(),
            });
        });

        //tell all clients to set config when config changes
        ConfigManager.getInstance().registerWatcher("*", async (key, value) => {
            if (value.meta?.requireRestart) {
                //Some config changes require a restart
                await this.restart();
            }
            this.clientCommandDispatcher?.dispatchAll({
                action: "setConfig",
                args: ConfigManager.getInstance().getRawConfigs(),
            });
        });

        this.serverCommandRegistrar?.registerCoreCommands();
        this.serverCommandRegistrar?.registerConfigCommand();
    }
    async start() {
        if (this.status === AppStatus.RUNNING) {
            return;
        }
        if (this.isStarting) {
            return;
        }
        this.isStarting = true;
        try {
            await this.bootGameClient();
            await this.bootChusanBridgeClient();
            await this.bootSongRepository();
            await this.bootOrders();
            await this.bootMessageHandler();

            this.toStatus(AppStatus.RUNNING);
            this.logger.info("核心启动成功");
        } catch (error: any) {
            this.lastErrorMsg = {
                name: error.name,
                message: error.stack,
            };
            this.logger.error("启动过程中发生错误, 正在关闭核心...");
            this.logger.error("请前往WebUI查看详细错误信息");
            this.logger.debug(error);
            await this.stop(true);
        } finally {
            this.isStarting = false;
        }
    }

    private toStatus(status: AppStatus) {
        this.status = status;
        this.clientCommandDispatcher?.dispatchAll({
            action: "setAppStatus",
            args: {
                status: this.status,
                err: this.status === AppStatus.ERROR ? this.lastErrorMsg : undefined,
            },
        });
    }

    private async bootGameClient() {
        const configEntry = ConfigManager.getInstance().get<BilibiliClientConfig>(
            "bilibiliClient",
            {
                codeId: "",
            }
        );
        this.bilibiliGameClient = new BilibiliGameClient(configEntry.config);
        this.bilibiliGameClient.onHeartBeat = (success) => {
            if (!success) {
                throw new BilibiliError("BilibiliGameClient心跳失败");
            }
        };
        await this.bilibiliGameClient.start();
    }

    private async bootChusanBridgeClient() {
        const configEntry = ConfigManager.getInstance().get<ChusanBridgeConfig>("chusanBridge", {
            enabled: false,
            chusanServerUrl: "",
        });
        if (!configEntry.config.enabled) {
            return;
        }
        this.chusanBridgeClient = new ChusanBridgeClient(configEntry.config);
        await this.chusanBridgeClient.connect();
    }

    private async bootSongRepository() {
        this.songRepository = new SongRepository();
        await this.songRepository.init();

        const datasources: SongDataSource[] = [new OtogeDBDataSource()];
        if (this.chusanBridgeClient) {
            datasources.push(new ChusanBridgeDataSource(this.chusanBridgeClient));
        }
        const updater = new SongRepositoryUpdater(this.songRepository, datasources);
        await updater.updateRepository();
        this.serverCommandRegistrar?.registerSongUpdateCommand(updater);
    }

    private async bootOrders() {
        this.orderListManager = new OrderListManager(
            this.songRepository!,
            this.clientCommandDispatcher!,
            this.chusanBridgeClient
        );
        await this.orderListManager.init();
        this.serverCommandRegistrar?.registerSongListCommands(this.orderListManager);
    }

    private async bootMessageHandler() {
        const songSearcher = new SongSearch(this.songRepository!);
        await songSearcher.load();
        const messageParser = new MessageParser(this.orderListManager!, songSearcher!);
        const gameMessageHandler = new GameMessageHandler(
            this.bilibiliGameClient!,
            messageParser,
            this.orderListManager!,
            this.serverCommandManager!
        );
        const consoleMessageHandler = new ConsoleMessageHandler(
            messageParser,
            this.serverCommandManager!
        );
        this.serverCommandRegistrar?.registerMessageCommand(consoleMessageHandler);
    }

    async restart() {
        if (this.isStarting || this.isStopping) {
            return;
        }
        const beforeStatus = this.status;
        await this.stop();
        if (this.status !== beforeStatus) {
            await this.restartCountdown(5);
        }
        await this.start();
    }

    async restartCountdown(from: number) {
        await new Promise<void>((resolve) => {
            let current = from;
            const timer = setInterval(() => {
                current--;
                this.logger.warn(`将在 ${current} 秒后重启`);
                if (current <= 0) {
                    clearInterval(timer);
                    resolve();
                }
            }, 1000);
        });
    }

    async stop(isErroneous = false) {
        if (this.status !== AppStatus.RUNNING && !isErroneous) {
            return;
        }

        if (this.isStopping) {
            return;
        }
        this.isStopping = true;
        try {
            this.orderListManager?.destroy();
            this.chusanBridgeClient?.destroy();
            const stopBilibiliClient = this.bilibiliGameClient?.destroy();
            const stopSongRepo = await this.songRepository?.destroy();
            await Promise.all([stopBilibiliClient, stopSongRepo]);
            this.orderListManager = undefined;
            this.chusanBridgeClient = undefined;
            this.bilibiliGameClient = undefined;
            this.songRepository = undefined;
            this.toStatus(isErroneous ? AppStatus.ERROR : AppStatus.STOPPED);
        } finally {
            this.isStopping = false;
        }
    }

    destroy() {
        if (this.status === AppStatus.DESTROYING) {
            return;
        }
        if (this.status === AppStatus.RUNNING) {
            throw new CoreError("核心正在运行中, 请先停止核心");
        }
        this.toStatus(AppStatus.DESTROYING);
    }
}
