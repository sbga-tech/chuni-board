import axios from "axios";
import { createLogger } from "@/util/logger";

let host: string[][] | null = null;
const logger = createLogger("ghutil");

export async function getGithubHost(hostname: string) {
    if (host === null) {
        const { data } = await axios.get("https://raw.hellogithub.com/hosts.json");
        host = data;
    }
    if (host === null) {
        logger.error("无法获取Github Hosts");
        return hostname;
    }

    for (const value of host) {
        if (hostname.includes(value[1])) {
            return value[0];
        }
    }
}
