import fs from "fs-extra";
import path from "path";
import { createWriteStream } from "fs";
import archiver from "archiver";

const buildPath = "./build/chuni-board.exe";
const distPath = "./dist";
const tmpPath = "./dist/tmp";
const defaultDistPath = "./dist/default";
const zipFilePath = "./dist/chuni-board.zip";

async function copyFile(src, dest) {
    try {
        await fs.copy(src, dest);
        console.log(`Copied ${src} to ${dest}`);
    } catch (error) {
        console.error(`Error copying ${src}:`, error);
    }
}

async function copyDirectory(src, dest) {
    try {
        await fs.copy(src, dest, { overwrite: true });
        console.log(`Copied directory ${src} to ${dest}`);
    } catch (error) {
        console.error(`Error copying directory ${src}:`, error);
    }
}

async function zipDirectory(source, out) {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = createWriteStream(out);

    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on("error", err => reject(err))
            .pipe(stream);

        stream.on("close", resolve);
        archive.finalize();
    });
}

async function cleanUp() {
    try {
        await fs.remove(tmpPath);
        console.log("Cleanup completed.");
    } catch (error) {
        console.error("Error cleaning up tmp folder:", error);
    }
}

(async () => {
    console.log("Starting build script...");
    await fs.ensureDir(tmpPath);
    await copyFile(buildPath, path.join(tmpPath, "chuni-board.exe"));
    await copyDirectory(defaultDistPath, tmpPath);
    console.log("Creating ZIP archive...");
    await zipDirectory(tmpPath, zipFilePath);
    console.log("ZIP archive created.");
    console.log("Cleaning up...");
    await cleanUp();
    console.log("Build process completed.");
})();
