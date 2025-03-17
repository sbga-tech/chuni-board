import { CONSTANTS } from "@/constant";
import fs from "fs";
import { readFileSync, resolveRootPath, writeFileSync } from "@/util/fileutil";
import { ConfigError } from "@/error";
import { createLogger } from "@/util/logger";

const CONFIG_FILE = resolveRootPath(CONSTANTS.CONFIG_FILE_PATH);

/** Utility function for deep comparison */
function deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/** ConfigEntry Interface */
interface ConfigEntry<T = any> {
    config: T;
    meta?: any;
}

/** ConfigManager: Handles centralized config management */
class ConfigManager {
    private static instance: ConfigManager;
    private config: Record<string, any> = {};
    private registeredKeys: Map<string, any> = new Map();
    private watchers: Map<string, Set<(key: string, entry: ConfigEntry) => void>> = new Map();
    private globalWatchers: Set<(key: string, entry: ConfigEntry) => void> = new Set();
    private watcherActive: boolean = true;
    private logger = createLogger("Config");

    private constructor() {
        this.config = this.readConfigFile();
        this.watchConfigFile();
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    /** Get all registered configs */
    public getConfigs(): Record<string, ConfigEntry> {
        const filteredConfig: Record<string, ConfigEntry> = {};
        for (const key of this.registeredKeys.keys()) {
            filteredConfig[key] = { config: this.config[key], meta: this.registeredKeys.get(key) };
        }
        return filteredConfig;
    }

    public getRawConfigs(): Record<string, any> {
        const filteredConfig: Record<string, any> = {};
        for (const key of this.registeredKeys.keys()) {
            filteredConfig[key] = this.config[key];
        }
        return filteredConfig;
    }

    /** Get a specific registered config */
    public get<T>(key: string, defaultValue?: T): ConfigEntry<T> {
        if (!this.registeredKeys.has(key)) {
            throw new ConfigError(`Config key '${key}' is not registered.`);
        }
        let value: T;
        if (this.config[key] !== undefined) {
            value = this.config[key] as T;
        } else if (defaultValue !== undefined) {
            this.setDefaultValue(key, defaultValue);
            value = defaultValue;
        } else {
            throw new ConfigError(`Config key '${key}' not found and no default value provided.`);
        }
        return { config: value as T, meta: this.registeredKeys.get(key) };
    }

    private setDefaultValue<T>(key: string, value: T): void {
        this.config[key] = value;
        this.writeConfigFile();
    }
    /** Set a config value */
    public set<T>(key: string, value: T): void {
        if (!this.registeredKeys.has(key)) {
            throw new ConfigError(`Cannot set unregistered key '${key}'.`);
        }
        if (!deepEqual(this.config[key], value)) {
            this.config[key] = value;
            this.writeConfigFile();
            this.notifyWatchers(key, value);
        }
    }

    /** Register a key with optional metadata */
    public registerKey(key: string, meta?: any): void {
        if (this.registeredKeys.has(key)) {
            throw new ConfigError(`Config key '${key}' is already registered.`);
        }
        this.registeredKeys.set(key, meta);
    }

    /** Update multiple configs (only registered keys) */
    public updateConfig(newConfig: Record<string, any>): void {
        for (const key of Object.keys(newConfig)) {
            if (this.registeredKeys.has(key) && !deepEqual(this.config[key], newConfig[key])) {
                this.config[key] = newConfig[key];
                this.notifyWatchers(key, newConfig[key]);
            }
        }
        this.writeConfigFile();
    }

    /** Register a watcher for specific keys or all */
    public registerWatcher(
        keys: string[] | "*",
        callback: (key: string, entry: ConfigEntry) => void
    ): void {
        if (keys === "*") {
            this.globalWatchers.add(callback);
        } else {
            keys.forEach((key) => {
                if (!this.registeredKeys.has(key)) {
                    throw new ConfigError(`Cannot watch unregistered key '${key}'.`);
                }
                if (!this.watchers.has(key)) {
                    this.watchers.set(key, new Set());
                }
                this.watchers.get(key)!.add(callback);
            });
        }
    }

    /** Unregister a watcher */
    public unregisterWatcher(
        keys: string[] | "*",
        callback: (key: string, entry: ConfigEntry) => void
    ): void {
        if (keys === "*") {
            this.globalWatchers.delete(callback);
        } else {
            keys.forEach((key) => this.watchers.get(key)?.delete(callback));
        }
    }

    /** Notify watchers of a config change */
    private notifyWatchers(key: string, value: any): void {
        const entry: ConfigEntry = { config: value, meta: this.registeredKeys.get(key) };

        // Notify specific key watchers
        if (this.watchers.has(key)) {
            this.watchers.get(key)!.forEach((callback) => callback(key, entry));
        }
        // Notify all global watchers
        this.globalWatchers.forEach((callback) => callback(key, entry));
    }

    /** Load configuration file (with default fallback) */
    private readConfigFile(): Record<string, any> {
        try {
            return readFileSync<Record<string, any>>(CONSTANTS.CONFIG_FILE_PATH);
        } catch (error) {
            this.logger.error("Failed to load config file:", error);
            return {}; // Return empty object if something went wrong
        }
    }
    /** Write configuration file */
    private writeConfigFile(): void {
        this.watcherActive = false;
        try {
            writeFileSync(CONSTANTS.CONFIG_FILE_PATH, this.config);
        } catch (error) {
            this.logger.error("Failed to write config file:", error);
        } finally {
            this.watcherActive = true;
        }
    }

    /** Watch for external changes to the config file */
    private watchConfigFile(): void {
        fs.watch(CONFIG_FILE, (eventType) => {
            if (eventType === "change" && this.watcherActive) {
                try {
                    const newConfig = this.readConfigFile();

                    // Notify only for registered keys that actually changed
                    for (const key of Object.keys(newConfig)) {
                        if (
                            this.registeredKeys.has(key) &&
                            !deepEqual(this.config[key], newConfig[key])
                        ) {
                            this.config[key] = newConfig[key];
                            this.notifyWatchers(key, newConfig[key]);
                        }
                    }
                } catch (error) {
                    this.logger.error("Failed to reload config file:", error);
                }
            }
        });
    }
}

export default ConfigManager;
