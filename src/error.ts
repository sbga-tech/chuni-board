import axios from "axios";

export interface ErrorMsg {
    name: string;
    message: string;
}

export class BilibiliError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BilibiliError";
    }
    static fromAxiosError(error: any, contextMessage: string = "Bilibili API 错误"): BilibiliError {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const bilibiliMessage = data?.message || data?.msg;

            const message = `${contextMessage}: ${bilibiliMessage || error.message}`;
            return new BilibiliError(message);
        } else {
            return new BilibiliError(`${contextMessage}: ${error.message || "未知错误"}`);
        }
    }
}

export class ConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigError";
    }
}

export class OrderError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "OrderError";
    }
}

export class ChusanBridgeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ChusanBridgeError";
    }
}

export class DatasourceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DatasourceError";
    }
}

export class SongSearchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SongSearchError";
    }
}

export class CoreError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CoreError";
    }
}
