import * as zlib from "zlib";

export enum ProtoOp {
    HEARTBEAT = 2, // 客户端发送心跳包 (30秒发送一次)
    HEARTBEAT_REPLY = 3, // 服务器收到心跳包的回复
    SEND_SMS_REPLY = 5, // 服务器推送的弹幕消息包
    AUTH = 7, // 客户端发送的鉴权包
    AUTH_REPLY = 8, // 服务器收到鉴权包后的回复
}
export class Proto {
    packetLen: number = 0;
    headerLen: number = 16;
    ver: number = 1;
    op: ProtoOp = ProtoOp.AUTH;
    seq: number = 1;
    body: string = "";
    private static readonly maxBody = 2048;

    /**
     * Encode a message into a buffer for sending.
     */
    public pack(): Buffer {
        const bodyBuffer = Buffer.from(this.body, "utf-8");
        this.packetLen = bodyBuffer.length + this.headerLen;

        const buf = Buffer.alloc(this.packetLen);
        buf.writeInt32BE(this.packetLen, 0); // Packet length
        buf.writeInt16BE(this.headerLen, 4); // Header length
        buf.writeInt16BE(this.ver, 6); // Protocol version
        buf.writeInt32BE(this.op, 8); // Operation code
        buf.writeInt32BE(this.seq, 12); // Sequence number
        bodyBuffer.copy(buf, this.headerLen);

        return buf;
    }

    /**
     * Decode a received buffer into a structured Proto object.
     */
    public unpack(buf: Buffer) {
        if (buf.length < this.headerLen) {
            console.error("[Proto] Received buffer is too small!");
            return;
        }

        this.packetLen = buf.readInt32BE(0);
        this.headerLen = buf.readInt16BE(4);
        this.ver = buf.readInt16BE(6);
        this.op = buf.readInt32BE(8);
        this.seq = buf.readInt32BE(12);

        // Handle compression if needed
        if (this.ver === 2) {
            this.body = zlib.inflateSync(buf.subarray(this.headerLen)).toString("utf-8");
        } else {
            this.body = buf.subarray(this.headerLen, this.packetLen).toString("utf-8");
        }

        if (this.packetLen > Proto.maxBody) {
            console.error("[Proto] Body length exceeds max limit:", this.packetLen);
            return;
        }

        return this;
    }
}
