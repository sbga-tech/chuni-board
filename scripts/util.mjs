import { spawn } from "child_process";

export async function spawnAsync(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: "inherit", shell: true, ...options });

        child.on("error", (err) => {
            reject(err);
        });

        child.on("close", (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
}
