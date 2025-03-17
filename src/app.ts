import { Core } from "@/core";
import beforeShutdown from "@/util/before-shutdown";

const bootsrap = Core.getInstance();

const start = async () => {
    await bootsrap.start();
    beforeShutdown(async () => {
        await bootsrap.stop();
        bootsrap.destroy();
    });
};

start().then();
