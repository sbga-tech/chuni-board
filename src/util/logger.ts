import { DefaultLogger, LogContext, LoggerNamespace } from "@mikro-orm/core";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

export function createLogger(moduleName: string) {
    const logFormat = winston.format.combine(
        winston.format.label({ label: moduleName }),
        winston.format.timestamp(),
        winston.format.printf(({ label, timestamp, level, message }) => {
            return `[${timestamp}] [${level.toUpperCase()}] [${label}] ${message}`;
        })
    );

    const logger = winston.createLogger({
        level: "debug", // Default log level
        format: winston.format.combine(
            winston.format.label({ label: `[${moduleName}]` }),
            winston.format.timestamp(),

            logFormat
        ),
        transports: [
            // Console transport only for 'info' level
            new winston.transports.Console({
                level: "info",
                format: winston.format.combine(
                    logFormat,
                    winston.format.colorize({
                        all: true,
                    })
                ),
            }),
            // Daily rotating file transport for 'debug' logs
            new DailyRotateFile({
                filename: "./logs/chuni-board-%DATE%.log",
                datePattern: "YYYY-MM-DD",
                level: "debug",
                maxFiles: "14d", // Keep logs for 14 days
                zippedArchive: true, // Compress older logs
            }),
        ],
    });

    return logger;
}

export class DBLogger extends DefaultLogger {
    loggers: Record<LoggerNamespace, winston.Logger> = {
        query: createLogger("db.query"),
        "query-params": createLogger("db.query-params"),
        schema: createLogger("db.schema"),
        discovery: createLogger("db.discovery"),
        info: createLogger("db.info"),
        deprecated: createLogger("db.deprecated"),
    };

    log(namespace: LoggerNamespace, message: string, context?: LogContext): void {
        this.loggers[namespace].debug(message);
    }
}
