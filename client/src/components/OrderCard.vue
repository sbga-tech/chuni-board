<script setup lang="ts">
    import noteDesignerImg from "../assets/chuni/note_designer.png";
    import nodataFrame from "../assets/chuni/nodata.png";
    import ambiguousFrame from "../assets/chuni/ambiguous_frame.png";
    import leftButton from "../assets/chuni/left_button.png";
    import rightButton from "../assets/chuni/right_button.png";
    import leftButtonHover from "../assets/chuni/left_button_hover.png";
    import rightButtonHover from "../assets/chuni/right_button_hover.png";
    import leftButtonClick from "../assets/chuni/left_button_click.png";
    import rightButtonClick from "../assets/chuni/right_button_click.png";
    import darkOverlay from "../assets/chuni/dark_overlay.png";

    import { Difficulty, type Order } from "../model";
    import type { PropType } from "vue";

    const props = defineProps({
        order: {
            type: Object as PropType<Order>,
            default: null,
        },
    });
    const { sendRequest } = useWebSocketClient();

    const DIFFICULTY_FRAME_MAP = {
        [Difficulty.BAS]: "bas_frame.png",
        [Difficulty.ADV]: "adv_frame.png",
        [Difficulty.EXP]: "exp_frame.png",
        [Difficulty.MAS]: "mas_frame.png",
        [Difficulty.ULT]: "ult_frame.png",
        [Difficulty.WE]: "we_frame.png",
    };

    const isOrdered = computed(() => {
        return props.order !== null;
    });

    const frameImg = computed(() => {
        if (props.order === null || props.order.isAmbiguous) {
            return undefined;
        }
        return new URL(
            `../assets/chuni/${DIFFICULTY_FRAME_MAP[props.order.chart!.difficulty]}`,
            import.meta.url
        ).href;
    });

    const levelImg = computed(() => {
        if (props.order === null || props.order.isAmbiguous) {
            return undefined;
        }
        const level = props.order.chart!.level;
        const levelDecimal = props.order.chart!.levelDecimal;
        const levelStr = "" + level + (levelDecimal >= 50 ? "+" : "");
        return new URL(`../assets/chuni/lvl_${levelStr}.png`, import.meta.url).href;
    });

    const noteDesigner = computed(() => {
        if (props.order === null || props.order.isAmbiguous) {
            return undefined;
        }
        return props.order.chart!.levelDesigner;
    });

    const jacket = computed(() => {
        if (props.order === null || props.order.isAmbiguous) {
            return undefined;
        }
        return `http://${window.location.hostname}:48200/jacket/${props.order.song!.image}`;
    });

    const candidates = computed(() => {
        if (props.order === null || !props.order.isAmbiguous) {
            return [];
        }
        return props.order.candidates.slice(0, 7);
    });

    const completeOrder = () => {
        if (props.order === null || props.order.isAmbiguous) {
            return;
        }
        sendRequest("orderComplete", { orderId: props.order.orderId });
    };

    const removeOrder = () => {
        if (props.order === null) {
            return;
        }
        sendRequest("orderRemove", { orderId: props.order.orderId });
    };
</script>

<template>
    <div class="order-card">
        <div v-if="!isOrdered">
            <img :src="nodataFrame" class="frame-image" alt="" />
        </div>
        <div v-else-if="!props.order.isAmbiguous">
            <img
                :src="jacket"
                class="absolute w-[316px] h-[316px] top-[29px] left-[54px] object-contain z-[-100]"
                alt="" />
            <img :src="frameImg" class="frame-image" alt="" />
            <img :src="levelImg" class="overlay-image" alt="" />
            <div v-if="noteDesigner && noteDesigner !== ''">
                <img :src="noteDesignerImg" class="overlay-image" alt="" />
                <div
                    class="absolute top-[481px] left-[140px] text-[12px] font-bold tracking-[0.5px] text-[#29354c] max-w-[200px] truncate"
                    ref="text">
                    {{ noteDesigner }}
                </div>
            </div>
            <div
                class="absolute top-[409px] left-0 w-[90%] transform translate-x-[6%] text-center text-[28px] font-bold tracking-[1px] text-[#29354c] truncate">
                {{ order.song!.title }}
            </div>
            <div
                class="absolute top-[449px] left-0 w-[90%] transform translate-x-[6%] text-center text-[14px] font-bold tracking-[1px] text-gray-600 truncate">
                {{ order.song!.artist }}
            </div>

            <div
                class="absolute top-[478px] left-[380px] text-[16px] font-bold tracking-[0.5px] text-[#29354c]">
                {{ Math.floor(order.song!.bpm) }}
            </div>
        </div>
        <div v-else>
            <div class="ranking-list">
                <Ranking
                    class="ranking-item"
                    v-for="(song, index) in candidates"
                    :key="index"
                    :index="index"
                    :name="song.title" />
            </div>
            <img :src="ambiguousFrame" class="frame-image" alt="" />
            <div
                class="absolute top-[432px] left-0 w-[90%] transform translate-x-[6%] text-center text-[28px] font-bold tracking-[1px] text-[#4f514f] truncate cn-text">
                请发送数字选择备选曲目
            </div>
        </div>

        <div class="interactor overlay-image" v-if="isOrdered">
            <img :src="darkOverlay" class="dark-overlay" alt="" />
            <div v-if="!props.order.isAmbiguous" class="cursor-pointer" @click="completeOrder">
                <div class="left-interactor"></div>
                <img :src="leftButton" class="left-button" alt="" />
                <img :src="leftButtonHover" class="left-button-hover" alt="" />
                <img :src="leftButtonClick" class="left-button-click" alt="" />
                <div
                    class="left-button-text absolute top-[460px] left-0 w-[90%] transform translate-x-[-22%] text-center text-[24px] font-bold tracking-[1px] text-[#fff] truncate cn-text">
                    完成
                </div>
            </div>
            <div class="cursor-pointer" @click="removeOrder">
                <div class="right-interactor"></div>
                <img :src="rightButton" class="right-button" alt="" />
                <img :src="rightButtonHover" class="right-button-hover" alt="" />

                <img :src="rightButtonClick" class="right-button-click" alt="" />
                <div
                    class="right-button-text absolute top-[460px] left-0 w-[90%] transform translate-x-[32%] text-center text-[24px] font-bold tracking-[1px] text-[#fff] truncate cn-text">
                    删除
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    img {
        pointer-events: none;
    }

    .cn-text {
        font-family: "MS P Gothic", sans-serif;
    }

    .order-card {
        position: relative;
        margin: 0;
        min-width: 427px;
        min-height: 510px;
        overflow: hidden;
    }

    .overlay-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .frame-image {
        @extend .overlay-image;
        z-index: -10;
    }

    .ranking-list {
        padding: 5px 0.75rem;
    }

    .ranking-item {
        margin: 6px 0;
    }

    .interactor {
        opacity: 0;
        transition: opacity 0.2s;
    }

    .interactor img {
        position: absolute;
        width: 100%;
        height: 100%;
        transition: opacity 0.1s;
    }

    .left-button-hover,
    .right-button-hover,
    .left-button-click,
    .right-button-click {
        opacity: 0;
    }

    .interactor:hover,
    .interactor:active {
        opacity: 1;
    }

    .left-interactor,
    .right-interactor {
        position: absolute;
        top: 0;
        width: 50%;
        height: 100%;
        z-index: 10;
    }

    .left-interactor {
        left: 0;
    }
    .right-interactor {
        right: 0;
    }

    .left-interactor:hover ~ .left-button {
        opacity: 0.5;
    }

    .left-interactor:active ~ .left-button-click {
        opacity: 0.8;
    }

    .left-interactor:hover ~ .left-button-text {
        opacity: 0.7;
    }

    .left-interactor:active ~ .left-button {
        opacity: 0.5;
    }

    .left-interactor:active ~ .left-button-text {
        opacity: 1;
        text-shadow: none;
    }

    .right-interactor:hover ~ .right-button {
        opacity: 0.5;
    }

    .right-interactor:active ~ .right-button-click {
        opacity: 0.8;
    }

    .right-interactor:active ~ .right-button {
        opacity: 0.5;
    }

    .right-interactor:hover ~ .right-button-text {
        opacity: 0.7;
    }

    .right-interactor:active ~ .right-button-text {
        opacity: 1;
        text-shadow: none;
    }

    .left-button-text,
    .right-button-text {
        text-shadow: 0px 0px 3px black, 0px 0px 3px rgba(0, 0, 0, 0.5);
    }
</style>
