import express from "express";
import cors from "cors";
import { createServer, Server } from "http";
import { LaplaceBilibiliCodeAccess, BilibiliCodeAccess } from "@/bili-game/authcode";
import path from "path";
import { createLogger } from "@/util/logger";
import { networkInterfaces } from "os";
import { getGithubHost } from "@/util/ghutil";
import axios from "axios";
import { CONSTANTS } from "@/constant";
import { resolvePkgPath, resolveRootPath } from "@/util/fileutil";
import * as fs from "fs-extra";
import { CoreError } from "@/error";

const STATIC_PAGE_PATH = resolvePkgPath("public");

export class ServerCore {
    server: Server | null = null;
    logger = createLogger("ServerCore");
    init() {
        const app = express();
        app.use(cors());
        app.use(express.json());
        this.initBilibiliCodeAccessEndpoint(app, new LaplaceBilibiliCodeAccess());
        this.initJacketProxyEndpoint(app);
        this.initStaticPageEndpoint(app);
        this.server = createServer(app);
        return this.server;
    }

    start() {
        if (!this.server) {
            throw new CoreError("Server not initialized");
        }
        const port = 48200;
        this.server.listen(port, () => {
            this.printConnectionInfo(port);
        });
    }

    private printConnectionInfo(port: number) {
        if (process.env.NODE_ENV === "production") {
            this.logger.info(`服务器已启动, 请使用浏览器或OBS打开以下地址之一`);
            this.logger.info(`Local: http://localhost:${port}`);
            const localIp = this.getLocalIp();
            for (const netInterface in localIp) {
                for (const ip of localIp[netInterface]) {
                    this.logger.info(`${netInterface}: http://${ip}:${port}`);
                }
            }
        }
    }

    private getLocalIp() {
        const nets = networkInterfaces();
        const results: any = {};
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]!) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
                const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
                if (net.family === familyV4Value && !net.internal) {
                    if (!results[name]) {
                        results[name] = [];
                    }
                    results[name].push(net.address);
                }
            }
        }
        return results;
    }

    initBilibiliCodeAccessEndpoint(app: express.Express, codeAccess: BilibiliCodeAccess) {
        app.get("/bilibili-open/auth/:codeId", async (req, res) => {
            const { codeId } = req.params;
            try {
                const anchorInfo = await codeAccess.getAnchorInfo(codeId);
                res.json({
                    data: anchorInfo,
                });
            } catch (error) {
                res.status(500).json({
                    message: error,
                });
            }
        });
    }

    initJacketProxyEndpoint(app: express.Express) {
        app.get("/jacket/:filename", async (req, res) => {
            const { filename } = req.params;
            const imageUrlStr = CONSTANTS.OTOGEDB_JACKET_URL + filename;
            const imageUrl = URL.parse(imageUrlStr);
            const originalHost = imageUrl!.host;
            const proxyUrl = `${imageUrl!.protocol}//${await getGithubHost(originalHost)}${
                imageUrl!.pathname
            }`;
            const cachePath = resolveRootPath(path.join(CONSTANTS.IMAGE_CACHE_PATH, filename));

            // Ensure the cache directory exists
            await fs.ensureDir(CONSTANTS.IMAGE_CACHE_PATH);

            // Check if the image exists in cache first
            if (await fs.pathExists(cachePath)) {
                fs.createReadStream(cachePath).pipe(res);
                return;
            }

            // If not in cache, attempt to download and cache it
            try {
                const resp = await axios.get(proxyUrl, {
                    headers: { Host: originalHost },
                    responseType: "stream",
                });

                // Stream the data to both the cache file and response
                const writeStream = fs.createWriteStream(cachePath);
                resp.data.pipe(writeStream);
                resp.data.pipe(res);

                writeStream.on("error", (err) => {
                    this.logger.error("无法写入缓存: ", err);
                });
            } catch (err) {
                this.logger.error("无法下载图片: ", err);
                res.status(404).send("Not found");
            }
        });
    }

    initStaticPageEndpoint(app: express.Express) {
        if (process.env.NODE_ENV === "production") {
            // Serve static files from the public directory
            app.use(express.static(STATIC_PAGE_PATH));

            // Serve index.html for all unknown routes (for SPA support)
            app.get("*", (req, res) => {
                res.sendFile(path.join(STATIC_PAGE_PATH, "index.html"));
            });
        }
    }
}
