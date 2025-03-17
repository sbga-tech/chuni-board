import fs from "fs-extra";
import path from "path";

const buildPath = "./build/chuni-board.exe";
const distPath = "./dist";

async function copyFile(src, dest) {
    try {
        await fs.copy(src, dest);
        console.log(`Copied ${src} to ${dest}`);
    } catch (error) {
        console.error(`Error copying ${src}:`, error);
    }
}

(async () => {
    await fs.ensureDir(distPath);
    console.log("Copying dist files...");
    await copyFile(buildPath, path.join(distPath, "chuni-board.exe"));
    console.log("Build process completed.");
})();
