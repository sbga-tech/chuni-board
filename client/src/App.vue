<script setup lang="ts">
    import { gsap } from "gsap";

    import { ScrollTrigger } from "gsap/ScrollTrigger";
    import { ScrollToPlugin } from "gsap/ScrollToPlugin";
    import { useConfig } from "./composables/config";
    import { AppStatus, useAppStatus } from "./composables/appstatus";
    import { ArrowDownToLine } from "lucide-vue-next";

    import badge from "@/assets/chuni/badge.png";
    import { useWebSocketClient } from "./composables/websocket";
import { getErrorDisplay } from "@/lib/errutil";

    const page = ref(null);
    const slideUpPanel = ref(null);
    const mainContainer = ref(null);

    const { config } = useConfig();
    const { appStatus } = useAppStatus();
    const { isConnected } = useWebSocketClient();

    onMounted(() => {
        gsap.config({
            force3D: true,
        });
        gsap.registerPlugin(ScrollTrigger);
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: page.value,
                start: "top top",
                end: "+=30%",
                scrub: 1,
                pin: true,
            },
        });
        tl.fromTo(
            slideUpPanel.value,
            { y: "0%", scale: 0.7 },
            {
                y: "-100%",
                scale: 1,
                ease: "power2.inOut",
            },
            0
        );

        tl.fromTo(
            mainContainer.value,
            {
                filter: "blur(0px) brightness(100%)",
            },
            {
                filter: "blur(10px) brightness(50%)",
                ease: "power2.out",
            },
            0.1
        );
    });

    const statusText = computed(() => {
        switch (appStatus.value.status) {
            case AppStatus.INITIALIZED:
                return "程序已初始化";
            case AppStatus.RUNNING:
                return "点歌服务运行中...";
            case AppStatus.STOPPED:
                return "点歌服务已停止运行";
            case AppStatus.ERROR:
                return "点歌服务运行出错";
            case AppStatus.DESTROYING:
                return "正在退出程序";
            default:
                return "UNKNOWN";
        }
    });

    const scrollToConfig = () => {
        gsap.registerPlugin(ScrollToPlugin);
        gsap.to(window, {
            duration: 0.2,
            scrollTo: {
                y: slideUpPanel.value!
            },
        });
    };

    const uiScale = computed(() => config.value.ui?.scale ?? 1);
</script>

<template>
    <div v-show="isConnected">
        <div ref="page" class="page-container">
            <div ref="mainContainer" class="main-container">
                <div class="origin-top-left" :style="{ transform: `scale(${uiScale * 100}%)` }">
                    <div class="w-[277px] h-[54px] mb-2 relative cn-text-container">
                        <img :src="badge" alt="" />
                        <span
                            class="absolute top-[18px] left-[16px] w-[90%] text-center text-black font-bold text-[20px]">
                            {{ statusText }}
                        </span>
                    </div>
                    <div
                        v-if="appStatus.status === AppStatus.ERROR"
                        class="cn-text-container p-4 px-8 bg-secondary text-white">
                        <div class="text-2xl font-bold mb-2">运行出错！请修改配置并重新启动核心</div>
                        <Button
                            @click="scrollToConfig"
                            variant="default"
                            class="text-lg min-w-[150px] h-8 mb-4"
                            ><ArrowDownToLine class="min-w-5 min-h-5 mr-[0.1rem] ml-[-0.5rem]" />转到配置
                        </Button>
                        <h2 class="text-2xl font-bold">{{ getErrorDisplay(appStatus.err!.name).name }}</h2>
                        <p class="text-md font-normal mb-4">{{ getErrorDisplay(appStatus.err!.name).hint }}</p>
                        <h2 class="text-xl font-bold">错误日志:</h2>
                        <div class="ml-2">
                            <code class="text-sm font-normal whitespace-pre-line">{{ appStatus.err!.message }}</code>
                        </div>
                    </div>
                    <OrderList
                        class="translate-x-[4px] scale-[0.5] origin-top-left"
                        v-if="appStatus.status === AppStatus.RUNNING"></OrderList>
                </div>
            </div>
            <div ref="slideUpPanel" class="panel bg-background text-white">
                <!-- <span>{{ appStatus.status }}</span><span>{{ config }}</span> -->
                <ConfigPanel v-model:config="config"></ConfigPanel>
            </div>
        </div>
    </div>
    <div v-show="!isConnected">
        <div class="p-4 px-8 bg-secondary text-white cn-text-container">
            <div class="text-4xl font-bold">无法连接到服务器, 请启动点歌应用并刷新</div>
        </div>
    </div>
</template>

<style scoped>
    .main-container {
        height: 100vh;
    }
    .panel {
        display: block;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
    }

    .page-container {
        height: 100vh;
        width: 100vw;
        overflow: hidden;
    }
    .cn-text-container * {
        font-family: "MS P Gothic", sans-serif;
    }

    code {
        font-family: Monaco, monospace !important;
    }
</style>
