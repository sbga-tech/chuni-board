const ERROR_NAME_MAP: Record<string,string> = {
    BilibiliError: "B站API错误",
    ConfigError: "配置文件错误",
    OrderError: "点歌错误",
    ChusanBridgeError: "自动选歌模块错误",
    DatasourceError: "数据源错误",
    SongSearchError: "歌曲搜索错误",
    CoreError: "核心错误",
}

const ERROR_HINT_MAP: Record<string,string> = {
    BilibiliError: "请检查B站API配置并重启核心，或检查网络是否畅通",
    ConfigError: "请检查配置文件并重启核心",
    OrderError: "请检查点歌指令",
    ChusanBridgeError: "请检查自动选歌配置并重启核心",
    DatasourceError: "请检查数据源是否正常，或检查网络是否畅通",
    SongSearchError: "请检查歌曲搜索",
    CoreError: "请检查核心模块并重启核心",
}

export interface ErrorDisplay {
    name: string;
    hint: string;
}

export function getErrorDisplay(errorName: string): ErrorDisplay {
    return {
        name: ERROR_NAME_MAP[errorName] || errorName,
        hint: ERROR_HINT_MAP[errorName] || "请尝试重启核心"
    }
}