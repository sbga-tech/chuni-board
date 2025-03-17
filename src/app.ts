import { Core } from "@/core";
import beforeShutdown from "@/util/before-shutdown";

const bootsrap = Core.getInstance();

const start = async () => {
    console.log("Running in:", process.env.NODE_ENV);
    await bootsrap.start();
    beforeShutdown(async () => {
        await bootsrap.stop();
        bootsrap.destroy();
    });
};

start().then();
