<template>
    <div class="home" v-if="isDataLoaded">
        <div class="min-w-full header pb-4 pt-4">
            <h1 class="text-3xl">Wallet checker by Munris</h1>

            <div class="pt-5 pb-5">
                Для работы чекера zkSync/Starknet/Zora/Aptos/Linea нужно добавить адреса в папке addresses в соответствующие файлы.<br>
                Для работы EVM чекера, переименовываем .env.example в .env и заполняем MORALIS_API_KEY. Для баланс чекера добавляем ANKR_API_KEY в .env
            </div>

            <h2 class="text-3xl">Кошельки загружены</h2>

            <ul class="pt-5">
                <li class="pt-2">ZkSync: {{ data.zksync_wallets.length }}</li>
                <li class="pt-2">Starknet: {{ data.starknet_wallets.length }}</li>
                <li class="pt-2">Zora: {{ data.zora_wallets.length }}</li>
                <li class="pt-2">Aptos: {{ data.aptos_wallets.length }}</li>
                <li class="pt-2">Linea: {{ data.linea_wallets.length }}</li>
                <li class="pt-2">EVM / Балансы: {{ data.evm_wallets.length }}</li>
            </ul>

            <ul class="pt-5">
                <li class="pt-2">Author: <a href="https://t.me/munris_vlad" class="text-green-500 hover:text-green-600" target="_blank">Munris</a></li>
                <li class="pt-2">Канал: <a href="https://t.me/munris_scripts" class="text-green-500 hover:text-green-600" target="_blank">Скрипты от Munris</a></li>
                <li class="pt-2">Donate: munris.eth</li>
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
