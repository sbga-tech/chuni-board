import * as fs from "fs-extra";
import path from "path";
import { createLogger } from "@/util/logger";

// export function getDirname(metaUrl?: string) {
//     // If running under CommonJS, __dirname is already defined by Node.
//     if (typeof __dirname !== "undefined") {
//       return __dirname;
//     }

//     // Otherwise, we're in ESM (import.meta.url is available).
//     return path.dirname(fileURLToPath(metaUrl!));
//   }

class FileError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FileError";
    }
}

const logger = createLogger("FileUtil");

export function resolveRootPath(fileName: string): string {
    return path.join(process.cwd(), fileName);
}

export function resolvePkgPath(fileName: string): string {
    if ((process as any).pkg?.entrypoint === undefined) {
        return path.join(process.cwd(), fileName);
    }
    return path.join(__dirname, "..", fileName);
}

export function readFileSync<T>(fileName: string, useDefault: boolean = true): T {
    const target = resolveRootPath(fileName);

    if (useDefault && !fs.existsSync(target)) {
        logger.warn(`未找到 ${fileName} 文件，将使用默认值。`);

        // Locate default file
        const defaultFilePath = resolvePkgPath(`default/${fileName}`);

        if (fs.existsSync(defaultFilePath)) {
            fs.ensureDirSync(path.dirname(target));
            fs.copyFileSync(defaultFilePath, target);
        } else {
            throw new FileError(`${fileName} 文件未找到默认值。`);
        }
    }

    try {
        const data = fs.readFileSync(target, "utf-8");
        return JSON.parse(data) as T;
    } catch (err) {
        logger.error("无法读取文件：", err);
        throw err;
    }
}

export function writeFileSync(fileName: string, data: any): void {
    const target = resolveRootPath(fileName);
    try {
        fs.writeFileSync(target, JSON.stringify(data, null, 2));
    } catch (error) {
        logger.error("无法写入文件：", error);
        throw error;
    }
}

export async function readFile<T>(fileName: string, useDefault: boolean = true): Promise<T> {
    const target = resolveRootPath(fileName);

    if (useDefault && !fs.existsSync(target)) {
        logger.warn(`未找到 ${fileName} 文件，将使用默认值。`);

        // Locate default file
        const defaultFilePath = resolvePkgPath(`default/${fileName}`);

        if (fs.existsSync(defaultFilePath)) {
            await fs.ensureDir(path.dirname(target));
            await fs.copyFile(defaultFilePath, target);
        } else {
            throw new FileError(`${fileName} 文件未找到默认值。`);
        }
    }

    try {
        const data = await fs.promises.readFile(target, "utf-8");
        return JSON.parse(data) as T;
    } catch (err) {
        logger.error("无法读取文件：", err);
        throw err;
    }
}

export function writeFile(fileName: string, data: any): Promise<void> {
    const target = resolveRootPath(fileName);
    return new Promise((resolve, reject) => {
        fs.writeFile(target, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                logger.error("无法写入文件：", err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
