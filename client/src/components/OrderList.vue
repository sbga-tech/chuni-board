<script setup lang="ts">

    const { orderList } = useOrderList();

    const { config } = useConfig();

    const showingCount = computed(() => config.value.ui?.orderListDisplaySize ?? 4);

    const showingOrderList = computed(() => {
        const showingOrders = [];
        for (let i = 0; i < showingCount.value; i++) {
            showingOrders.push(orderList.value[i] || null);
        }
        return showingOrders;
    });
</script>

<template>
    <div class="card-container">
        <OrderCard v-for="order in showingOrderList" :order="order" />
    </div>
</template>

<style scoped>
    .card-container {
        display: flex;
        justify-content: flex-start;
        gap: 20px;
        margin: 0;
    }
</style>
