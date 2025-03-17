import { build } from "esbuild";
import esbuildPluginTsc from "esbuild-plugin-tsc";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { spawnAsync } from "./util.mjs";
import fs from "fs-extra";

async function buildClient() {
    console.log("Building client...");
    await spawnAsync('npm', ['run', 'build'], { cwd: 'client' });

    console.log("Copying client build to server public directory...");
    await fs.remove("./public"); // Remove old build
    await fs.copy("./client/dist", "./public");
    console.log("Finished client build.");
}

async function buildServer() {
    console.log("Building server...");
    const envDefaults = {
        BILIBILI_APP_KEY: "",
        BILIBILI_APP_SECRET: "",
        BILIBILI_APP_ID: "",
    };

    const define = {};

    for (const k in envDefaults) {
        define[`process.env.${k}`] = JSON.stringify(process.env[k]) || envDefaults[k];
    }
    await build({
        entryPoints: ["src/app.ts"], // Main entry file
        outdir: "build", // Output directory
        bundle: true,
        platform: "node",
        format: "cjs",
        target: "es2022",
        sourcemap: true,
        minify: true,
        plugins: [
            esbuildPluginTsc(),
            nodeExternalsPlugin({
                allowList: ["axios"],
            }),
        ],
        // banner: {
        //     js: "import {createRequire} from 'module';const require = createRequire(import.meta.url);import { dirname } from 'path';import { fileURLToPath } from 'url';const __dirname = dirname(fileURLToPath(import.meta.url));"
        // },
        define,
    });
    console.log("Finished server build.");
}

async function main() {
    try {
        await buildClient();
        await buildServer();
    } catch (error) {
        console.error("Error during build:", error);
        process.exit(1);
    }
}

main().then();
