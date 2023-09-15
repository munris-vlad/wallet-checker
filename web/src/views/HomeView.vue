<template>
    <div class="home" v-if="isDataLoaded">
        <div class="min-w-full header pb-4 pt-4">
            <h1 class="text-3xl">Кошельки загружены</h1>

            <ul class="pt-5">
                <li class="pt-2">ZkSync: {{ data.zksync_wallets.length }}</li>
                <li class="pt-2">Starknet: {{ data.starknet_wallets.length }}</li>
                <li class="pt-2">Zora: {{ data.zora_wallets.length }}</li>
                <li class="pt-2">Aptos: {{ data.aptos_wallets.length }}</li>
                <li class="pt-2">Linea: {{ data.linea_wallets.length }}</li>
                <li class="pt-2">EVM / Балансы: {{ data.evm_wallets.length }}</li>
            </ul>
        </div>
    </div>
</template>

<script>

export default {
    data() {
        return {
            data: [],
            isDataLoaded: false,
        }
    },
    created() {
        this.loadData()
    },
    methods: {
        loadData() {
            this.$axios.get('/api/stats').then((response) => {
                this.data = response.data
                this.isDataLoaded = true
            }).catch((error) => {
                console.error('Ошибка при загрузке данных:', error)
            })
        },
    },
}
</script>
