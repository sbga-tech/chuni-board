<script setup lang="ts">
    const props = defineProps({
        index: {
            type: Number,
            default: 0
        },
        name: {
            type: String,
            default: ""
        },
    })

    const rankImg = computed(() => {
    return new URL(`../assets/chuni/ranking_${Math.max(Math.min(props.index,3),0)}.png`, import.meta.url).href;
});

</script>

<template>
    <div class="rank_block" :style="{ backgroundImage: `url(${rankImg})` }">
        <div class="rank_block_inner">
            <div class="rank_block_rank">{{ index + 1 }}</div>
            <div class="rank_block_name">{{ name }}</div>
        </div>
    </div>
</template>

<style scoped>
    .rank_block {
        width: 400px;
        height: 50px;
        background-size: 100%;
        background-position: center;
        text-align: center;
    }
    .rank_block_inner {
        display: block;
        margin: 0 auto;
        text-align: left;
    }

    .rank_block_rank {
        display: inline-block;
        width: 96px;
        height: 50px;
        padding: 14px 12px 4px 4px;
        color: #000;
        font-weight: bold;
        font-size: 2rem;
        text-shadow: 1px 1px 1px rgba(255,255,255,0.7), -1px -1px 1px rgba(0, 0, 0, 0.5);
        text-align: center;
        vertical-align: middle;
        line-height: 100%;
    }

    .rank_block_name {
        display: inline-block;
        width: 270px;
        height: auto;
        margin: 0 0 0 20px;
        padding: 3px 5px 0 0;
        font-weight: bold;
        text-align: center;
        vertical-align: middle;
        color: #fff;
        font-size: 1.2rem;
        line-height: 110%;
        overflow: hidden;
        text-overflow: ellipsis;
        text-wrap: nowrap;
    }

    .rank_block_rating {
        display: flex;
        align-items: center;
    }

    .rank_block_rating_num {
        display: flex;
        align-items: center;
    }

    .rank_rating_comma {
        margin: 0 5px;
    }
</style>
