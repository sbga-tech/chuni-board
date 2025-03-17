import { Logger } from "winston";
import { ProtoOp, Proto } from "@/bili-game/socket/proto";

import WebSocket from "ws";
import { createLogger } from "@/util/logger";

class DanmakuSocket {
    private ws: WebSocket | null = null;
    private authBody: string = "";
    private wssLinks: string[] = [];
    private heartBeatTimer: ReturnType<typeof setTimeout> | null = null;
    private recvCallback: ((res: string) => void) | null = null;
    private heartBeatCallback: ((data: any) => void) | null = null;
    private logger: Logger = createLogger("DanmakuSocket");

    /**
     * 创建 WebSocket 连接
     * @param authBody 鉴权信息
     * @param wssLinks WebSocket 服务器地址列表
     */
    public connect(authBody: string, wssLinks: string[]) {
        if (this.ws) {
            this.logger.warn("WebSocket 已存在，关闭旧连接...");
            this.destroy();
        }

        this.authBody = authBody;
        this.wssLinks = wssLinks;

        if (!wssLinks.length) {
            this.logger.error("没有可用的 WebSocket 服务器地址");
            return;
        }

        const wsUrl = wssLinks[0]; // 取第一个 WebSocket 地址
        this.logger.debug(`获取到 WebSocket 地址: ${wsUrl}`);

        this.ws = new WebSocket(wsUrl);

        this.ws.on("open", () => {
            this.logger.info("WebSocket 连接成功");
            this.authenticate();
        });

        this.ws.on("message", (data) => this.handleMessage(data));

        this.ws.on("error", (err) => {
            this.logger.error("WebSocket 错误:", err);
            this.destroy();
        });

        this.ws.on("close", () => {
            this.logger.info("WebSocket 连接关闭");
            this.destroy();
        });
    }

    /**
     * 发送鉴权信息
     */
    private authenticate() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.logger.error("WebSocket 未连接，无法鉴权");
            return;
        }

        const proto = new Proto();
        proto.op = ProtoOp.AUTH;
        proto.body = this.authBody;
        this.ws.send(proto.pack());
        this.logger.info("发送鉴权数据");

        // 开启心跳
        this.startHeartbeat();
    }

    /**
     * 处理 WebSocket 消息
     * @param data 收到的数据
     */
    private handleMessage(data: WebSocket.Data) {
        const proto = new Proto().unpack(data as Buffer);

        if (!proto) return;

        switch (proto.op) {
            case ProtoOp.AUTH_REPLY:
                this.logger.info("鉴权成功");
                break;
            case ProtoOp.HEARTBEAT_REPLY:
                this.logger.debug("收到心跳回应");
                if (this.heartBeatCallback) this.heartBeatCallback(proto.body);
                break;
            case ProtoOp.SEND_SMS_REPLY:
                this.logger.debug("收到弹幕消息: " + proto.body);
                if (this.recvCallback) this.recvCallback(proto.body);
                break;
            default:
                this.logger.warn(`收到未知消息: ${JSON.stringify(proto)}`);
        }
    }

    /**
     * 发送心跳
     */
    private startHeartbeat() {
        if (!this.ws) return;

        if (this.heartBeatTimer) clearInterval(this.heartBeatTimer);

        this.heartBeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const heartBeatPacket = new Proto();
                heartBeatPacket.op = ProtoOp.HEARTBEAT;
                this.ws.send(heartBeatPacket.pack());
                this.logger.debug("发送心跳");
            }
        }, 20000);
    }

    /**
     * 关闭 WebSocket 连接
     */
    public destroy() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        if (this.heartBeatTimer) {
            clearInterval(this.heartBeatTimer);
            this.heartBeatTimer = null;
        }

        this.logger.info("连接已关闭");
    }

    /**
     * 监听接收消息
     */
    public onRecv(callback: (res: any) => void) {
        this.recvCallback = callback;
    }

    /**
     * 监听心跳回应
     */
    public onHeartBeatReply(callback: (data: any) => void) {
        this.heartBeatCallback = callback;
    }
}

export { DanmakuSocket };
