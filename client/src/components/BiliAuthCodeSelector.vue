<script setup lang="ts">
    import { IdCard } from "lucide-vue-next";
    import { ref, watch } from "vue";
    import { debounce } from "lodash";
    import { fetchAnchorInfo, type AnchorInfo } from "@/lib/biliutils";

    const anchorInfo = ref<AnchorInfo | null>(null);
    const searchQuery = defineModel("model-value", { default: "" });
    const loading = ref(false);
    const errorMessage = ref("");
    const isEdited = ref(false);

    const fetchAnchor = async (query: string) => {
        if (!query) {
            errorMessage.value = `身份码不存在`;
            return;
        }

        console.log(`Fetching anchor info for ${query}`);

        try {
            anchorInfo.value = await fetchAnchorInfo(query);
            if (anchorInfo.value === null) {
                errorMessage.value = `身份码不存在`;
            }
        } catch (error) {
            errorMessage.value = `错误: ${error}`;
            anchorInfo.value = null;
        }
        loading.value = false;
    };

    // // Debounced watch function to optimize API calls
    const debouncedFetch = debounce(fetchAnchor, 500);

    const stopUpdateOnce = ref(false);

    watch(searchQuery, (newQuery) => {
        if (!focused.value) {
            return;
        }
        if (stopUpdateOnce.value) {
            stopUpdateOnce.value = false;
            return;
        }
        console.log("Query changed");
        isEdited.value = true;
        doUpdate(newQuery);
    });

    const doUpdate = (query: string) => {
        loading.value = true;
        errorMessage.value = "";
        anchorInfo.value = null;
        debouncedFetch(query);
    };

    const focused = ref(false);
    const onFocus = () => {
        focused.value = true;
        if (anchorInfo.value === null && searchQuery.value.length > 0) {
            doUpdate(searchQuery.value);
        }
    };
    const onBlur = () => {
        focused.value = false;
        if (anchorInfo.value === null && isEdited.value) {
            searchQuery.value = "";
        }
    };

    const open = computed(() => focused.value && searchQuery.value.length > 0);

    watch(open, (isOpen) => {
        if (isOpen) {
            nextTick(() => {
                if (inputField.value) {
                    const inputWidth = inputField.value.inputField.offsetWidth;
                    popOverEle.value?.parentElement?.setAttribute(
                        "style",
                        `width: ${inputWidth}px`
                    );
                }
            });
        }
    });

    const handleScroll = (_: Event) => {
        inputField.value?.inputField.blur();
    };

    onMounted(() => {
        window.addEventListener("scroll", handleScroll);
    });

    onUnmounted(() => {
        window.removeEventListener("scroll", handleScroll);
        loading.value = false;
        errorMessage.value = "";
        anchorInfo.value = null;
        debouncedFetch.cancel();
    });

    const inputField = ref<{ inputField: HTMLInputElement } | null>(null);
    const popOverEle = ref<HTMLElement | null>(null);
    const isError = computed(
        () => isEdited.value && (errorMessage.value.length > 0 || !searchQuery.value)
    );
</script>

<template>
    <Popover class="w-full" :open="open">
        <PopoverTrigger class="w-full">
            <div class="relative w-full h-14 items-center">
                <Input
                    ref="inputField"
                    class="w-full text-xl h-full pl-14"
                    :class="{ 'border-red-400': isError, 'placeholder:text-red-400': isError }"
                    v-model:model-value="searchQuery"
                    placeholder="请输入身份码..."
                    @focus="onFocus"
                    @blur="onBlur">
                </Input>
                <span class="absolute start-0 inset-y-0 flex items-center justify-center pl-4">
                    <IdCard
                        class="size-6 text-muted-foreground"
                        :class="{ 'text-red-400': isError }" />
                </span>
            </div>
        </PopoverTrigger>
        <PopoverContent :align="'start'">
            <div ref="popOverEle">
                <div v-if="errorMessage" class="px-4">
                    <span class="text-red-400 text-xl">{{ errorMessage }}</span>
                </div>
                <div
                    v-else-if="loading"
                    class="flex flex-initial flex-row w-full gap-4 items-center">
                    <div class="flex flex-col items-center">
                        <Skeleton class="w-[3.25rem] h-[3.25rem] rounded-full" />
                    </div>
                    <div class="flex flex-col">
                        <Skeleton
                            class="text-xl bg-secondary w-[12rem] h-[20px] mb-[8px] mt-[8px] rounded" />
                        <Skeleton
                            class="text-lg text-muted-foreground bg-secondary w-[18rem] h-[18px] mb-[8px] rounded" />
                    </div>
                </div>
                <div
                    v-else-if="anchorInfo"
                    class="anchor-item my-[-0.5rem] flex flex-initial flex-row w-full gap-4 items-center px-4 py-[0.5rem] rounded">
                    <div class="flex flex-col items-center">
                        <Avatar class="w-[3.25rem] h-[3.25rem]">
                            <AvatarImage
                                :src="anchorInfo?.uface!"
                                referrerpolicy="no-referrer"
                                alt="avatar" />
                        </Avatar>
                    </div>
                    <div class="flex flex-col">
                        <h4 class="text-xl mt-[6px]">{{ anchorInfo?.uname! }}</h4>
                        <p class="text-lg text-muted-foreground">
                            {{ `${anchorInfo?.room_id!} (${anchorInfo?.code_id!})` }}
                        </p>
                    </div>
                </div>
            </div>
        </PopoverContent>
    </Popover>
</template>

<style scoped>
    .anchor-item {
        background-color: theme("colors.background");
        cursor: pointer;
    }
    .anchor-item:hover {
        background-color: theme("colors.secondary.DEFAULT");
    }
    * {
        font-family: "MS P Gothic", sans-serif;
    }
</style>
