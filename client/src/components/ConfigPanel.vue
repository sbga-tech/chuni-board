<script setup lang="ts">
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Hash, Link, RotateCcw, Loader2, ChevronRight, SendHorizontal } from "lucide-vue-next";
    import { mergeWithDefault } from "@/lib/objutils";
    import { ref, watch } from "vue";

    const defaultConfig = {
        bilibiliClient: {
            codeId: "",
        },
        ui: {
            scale: 1,
            orderListDisplaySize: 4,
        },
        chusanBridge: {
            enabled: false,
            chusanServerUrl: "http://localhost:48100",
        },
    };

    // Parent provides config via v-model
    const config = defineModel<Record<string, any>>("config", {
        default: () => ({}),
    });

    const { sendRequest } = useWebSocketClient();

    // 1. Merge the incoming parent config with our default
    const localConfig = ref(mergeWithDefault(config.value, defaultConfig));

    // 2. If the parent’s config changes (from outside), re-merge so local picks up changes
    watch(
        () => config.value,
        (newVal) => {
            localConfig.value = mergeWithDefault(newVal, defaultConfig);
        },
        { deep: true }
    );

    watch(
        () => localConfig.value,
        () => {
            console.log("Local config changed");
        },
        { deep: true }
    );

    function saveConfig() {
        // Here we simply assign the entire local config back into the parent v-model
        config.value = JSON.parse(JSON.stringify(localConfig.value));
        resetOrderListDisplaySize();
    }

    function resetConfig() {
        localConfig.value = mergeWithDefault(config.value, defaultConfig);
        resetOrderListDisplaySize();
    }

    const restarting = ref(false);

    async function restartApp() {
        restarting.value = true;
        try {
            await sendRequest("restart", {});
        } catch (e) {
            console.error(e);
        } finally {
            restarting.value = false;
        }
    }

    const orderListDisplaySize = ref("" + localConfig.value.ui.orderListDisplaySize);

    const resetOrderListDisplaySize = () => {
        validOrderListDisplaySize.value = true;
        orderListDisplaySize.value = "" + localConfig.value.ui.orderListDisplaySize;
    };
    const validOrderListDisplaySize = ref(true);
    const handleOrderListDisplaySizeChange = (value: string) => {
        const parsedValue = Math.floor(value as any);
        if (!parsedValue || parsedValue < 1 || parsedValue > 50) {
            validOrderListDisplaySize.value = false;
            return;
        }
        validOrderListDisplaySize.value = true;
        localConfig.value.ui.orderListDisplaySize = parsedValue;
    };

    const consoleCommand = ref("");
    const sendCommand = async () => {
        console.log("Sending command: ", consoleCommand.value);
        try {
            await sendRequest("message", consoleCommand.value);
        } catch (e) {
            console.error(e);
        } finally {
            consoleCommand.value = "";
        }
    };
</script>

<template>
    <div class="container container-xl mx-auto mt-10 px-4">
        <h1 class="text-4xl font-bold">Chuni Board 配置菜单</h1>
        <Tabs default-value="general" class="w-full mt-6">
            <TabsList class="w-full flex justify-start gap-4 flex-wrap">
                <TabsTrigger value="general" class="max-w-[200px] w-full text-xl">
                    通用
                </TabsTrigger>
                <TabsTrigger value="ui" class="max-w-[200px] w-full text-xl"> 界面 </TabsTrigger>
                <TabsTrigger value="keymap" class="max-w-[200px] w-full text-xl">
                    按键
                </TabsTrigger>
                <TabsTrigger value="chunibridge" class="max-w-[200px] w-full text-xl">
                    自动选歌
                </TabsTrigger>
            </TabsList>
            <TabsContent value="general" class="py-4">
                <h2 class="text-lg ml-1 mb-2">配置身份码</h2>
                <BiliAuthCodeSelector
                    v-model:model-value="localConfig.bilibiliClient.codeId"></BiliAuthCodeSelector>
            </TabsContent>
            <TabsContent value="ui" class="py-4">
                <h2 class="text-lg ml-1 mb-2">UI缩放</h2>
                <div class="flex flex-row gap-4 items-center mb-8">
                    <span class="ml-1 text-lg">{{ localConfig.ui.scale.toFixed(2) + "x" }}</span>
                    <Slider
                        :default-value="[1]"
                        :max="2"
                        :min="0"
                        :step="0.01"
                        :model-value="[localConfig.ui.scale]"
                        @update:model-value="value => {localConfig.ui.scale = value![0]}" />
                </div>
                <h2 class="text-lg ml-1 mb-2">点歌显示数量</h2>
                <div class="relative w-full h-14 items-center">
                    <Input
                        ref="inputField"
                        class="w-full text-xl h-full pl-14"
                        v-model:model-value="orderListDisplaySize"
                        @update:model-value="handleOrderListDisplaySizeChange"
                        :class="{
                            'border-red-400': !validOrderListDisplaySize,
                            'placeholder:text-red-400': !validOrderListDisplaySize,
                        }"
                        placeholder="请输入数量..." />
                    <span class="absolute start-0 inset-y-0 flex items-center justify-center pl-4">
                        <Hash
                            class="size-6 text-muted-foreground"
                            :class="{ 'text-red-400': !validOrderListDisplaySize }" />
                    </span>
                </div>
            </TabsContent>
            <TabsContent value="chunibridge" class="py-4">
                <h2 class="text-lg ml-1 mb-2">自动选歌服务器URL</h2>
                <div class="relative w-full h-14 items-center mb-4">
                    <Input
                        ref="inputField"
                        class="w-full text-xl h-full pl-14"
                        v-model:model-value="localConfig.chusanBridge.chusanServerUrl"
                        placeholder="请输入地址..." />
                    <span class="absolute start-0 inset-y-0 flex items-center justify-center pl-4">
                        <Link class="size-6 text-muted-foreground" />
                    </span>
                </div>
                <div class="flex items-center space-x-6 h-14 ml-2">
                    <Switch
                        id="toggle-chuni-bridge"
                        class="scale-[1.4] mt-1"
                        v-model:model-value="localConfig.chusanBridge.enabled" />
                    <Label for="toggle-chuni-bridge " class="text-xl">启用自动选歌</Label>
                </div>
            </TabsContent>
        </Tabs>
        <div class="mt-12 flex flex-row flex-initial gap-4">
            <Button @click="saveConfig" class="text-xl min-w-[150px] h-10">保存更改</Button>
            <Button @click="resetConfig" variant="destructive" class="text-xl min-w-[150px] h-10"
                >放弃更改</Button
            >
            <Button
                @click="restartApp"
                :disabled="restarting"
                variant="secondary"
                class="text-xl min-w-[150px] h-10"
                ><template v-if="!restarting">
                    <RotateCcw class="min-w-5 min-h-5 mr-1" />重启核心
                </template>
                <template v-else>
                    <Loader2 class="min-w-5 min-h-5 mr-1 animate-spin" />请稍候...
                </template>
            </Button>
        </div>
        <div class="mt-12">
            <h2 class="text-lg ml-1 mb-2">发送指令</h2>
            <div class="relative w-full h-14 items-center mb-4">
                <Input
                    ref="inputField"
                    class="w-full text-xl h-full pl-14"
                    v-model:model-value="consoleCommand"
                    @keyup.enter="sendCommand"
                    placeholder="请输入指令..." />
                <span class="absolute start-0 inset-y-0 flex items-center justify-center pl-4">
                    <ChevronRight class="size-6 text-muted-foreground" />
                </span>
                <span
                    class="absolute end-0 inset-y-0 flex items-center justify-center pr-4 cursor-pointer"
                    @click="sendCommand">
                    <SendHorizontal class="size-6 text-muted-foreground" />
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
    * {
        font-family: "MS P Gothic", sans-serif;
    }
</style>
