<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">Баланс</h1>
        </div>
        <div class="min-w-full pb-4 pt-4">
            <div class="flex space-x-4 content-center items-center place-content-center">
                <button class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" @click="loadNetwork('eth')">Ethereum</button>
                <button class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" @click="loadNetwork('arbitrum')">Arbitrum</button>
                <button class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" @click="loadNetwork('optimism')">Optimism</button>
                <button class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" @click="loadNetwork('polygon')">Polygon</button>
                <button class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" @click="loadNetwork('bsc')">BNB</button>
            </div>
        </div>
        <table class="min-w-full border text-center text-sm font-light dark:border-gray-700" v-if="isDataLoaded">
            <thead class="border-b font-medium dark:border-gray-700">
                <tr>
                    <th :class="thClass"></th>
                    <th :class="thClass">Wallet</th>
                    <th :class="thClass">Native</th>
                    <th :class="thClass">USDT</th>
                    <th :class="thClass">USDC</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in tableData" :key="index" class="border-b dark:border-gray-700">
                    <td :class="tdClass">{{ item['n'] }}</td>
                    <td :class="tdClass + ' text-left'"><strong>{{ item['wallet'] }}</strong></td>
                    <td :class="[tdClass, parseFloat(item['native']) < 0.005 ? 'text-red-500' : '']">{{ item['native'] }}</td>
                    <td :class="tdClass">{{ item['USDT'] }}</td>
                    <td :class="tdClass">{{ item['USDC'] }}</td>
                </tr>
            </tbody>
        </table>
        <div class="text-center text-2xl" v-else>
          Загрузка данных...
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            isDataLoaded: false,
            tableData: [],
            thClass: 'border-b border-r font-medium dark:border-gray-700 text-xs px-2 py-2',
            tdClass: 'whitespace-nowrap border-r px-3 py-2 font-regular text-xs dark:border-gray-700'
        }
    },
    created() {
        this.loadData()
    },
    methods: {
        loadData() {
            this.$axios.get('/api/balances').then((response) => {
                this.tableData = response.data.sort((a, b) => a.n - b.n)
                this.isDataLoaded = true
            }).catch((error) => {
                console.error('Ошибка при загрузке данных:', error)
            })
        },

        loadNetwork(network) {
            this.isDataLoaded = false
            this.$axios.get('/api/balances', {
                params: {
                    network: network
                }
            }).then((response) => {
                this.tableData = response.data.sort((a, b) => a.n - b.n)
                this.isDataLoaded = true
            }).catch((error) => {
                console.error('Ошибка при загрузке данных:', error)
            })
        },
    },
}
</script>

<style>
</style>
