enum DMType {
    Normal = 0,
    Emote = 1,
}

interface User {
    uid?: 0;
    open_id: string;
    uname: string;
    uface: string;
}

interface FansMedal {
    guard_level?: number;
    fans_medal_name: string;
    fans_medal_level: number;
    fans_medal_wearing_status: boolean;
}

interface Context {
    room_id: number;
    timestamp?: number;
}

interface ComboInfo {
    combo_base_num: number;
    combo_count: number;
    combo_id: string;
    combo_timeout: number;
}

interface EventMap {
    LIVE_OPEN_PLATFORM_DM: User &
        FansMedal &
        Context & {
            msg: string;
            msg_id: string;
            emoji_img_url: string;
            dm_type: DMType;
            glory_level: number;
            reply_open_id: string;
            reply_uname: string;
            is_admin: number;
        };
    LIVE_OPEN_PLATFORM_SEND_GIFT: User &
        FansMedal &
        Context & {
            gift_id: number;
            gift_name: string;
            gift_num: number;
            price: number;
            r_price: number;
            paid: boolean;
            anchor_info: User;
            msg_id: string;
            gift_icon: string;
            combo_gift: boolean;
            combo_info: ComboInfo;
        };
    LIVE_OPEN_PLATFORM_SUPER_CHAT: User &
        FansMedal &
        Context & {
            message_id: number;
            message: string;
            rmb: number;
            start_time: number;
            end_time: number;
            msg_id: string;
        };
    LIVE_OPEN_PLATFORM_SUPER_CHAT_DEL: Context & {
        message_ids: number[];
        msg_id: string;
    };
    LIVE_OPEN_PLATFORM_GUARD: FansMedal &
        Context & {
            user_info: User;
            guard_num: number;
            guard_unit: string;
            price: number;
            msg_id: string;
        };
    LIVE_OPEN_PLATFORM_LIKE: User &
        FansMedal &
        Context & {
            like_text: string;
            like_count: number;
        };
    LIVE_OPEN_PLATFORM_LIVE_ROOM_ENTER: User & Context;
    LIVE_OPEN_PLATFORM_LIVE_START: Context & {
        open_id: string;
        area_name: string;
        title: string;
    };
    LIVE_OPEN_PLATFORM_LIVE_END: Context & {
        open_id: string;
        area_name: string;
        title: string;
    };
    LIVE_OPEN_PLATFORM_INTERACTION_END: {
        game_id: string;
        timestamp: number;
    };
}

export type EventMessage = {
    [K in keyof EventMap]: { cmd: K; data: EventMap[K] };
}[keyof EventMap];
