<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">EVM Stats</h1>
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
                    <th :class="thClass">TX Count</th>
                    <th :class="thClass">Gas spent</th>
                    <th :class="thClass">Days</th>
                    <th :class="thClass">Weeks</th>
                    <th :class="thClass">Months</th>
                    <th :class="thClass">First tx</th>
                    <th :class="thClass">Last tx</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in tableData" :key="index" class="border-b dark:border-gray-700">
                    <td :class="tdClass">{{ item['n'] }}</td>
                    <td :class="tdClass + ' text-left'"><strong>{{ item['Wallet'] }}</strong></td>
                    <td :class="tdClass">{{ item['TX Count'] }}</td>
                    <td :class="tdClass">{{ item['Gas spent'] }}</td>
                    <td :class="tdClass">{{ item['Days'] }}</td>
                    <td :class="tdClass">{{ item['Weeks'] }}</td>
                    <td :class="tdClass">{{ item['Months'] }}</td>
                    <td :class="tdClass">{{ item['First tx'] }}</td>
                    <td :class="tdClass">{{ item['Last tx'] }}</td>
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
            i: 0,
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
            this.$axios.get('/api/evm').then((response) => {
                this.tableData = response.data.sort((a, b) => a.n - b.n)
                this.isDataLoaded = true
            }).catch((error) => {
                console.error('Ошибка при загрузке данных:', error)
            })
        },

        loadNetwork(network) {
            this.isDataLoaded = false
            this.$axios.get('/api/evm', {
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
