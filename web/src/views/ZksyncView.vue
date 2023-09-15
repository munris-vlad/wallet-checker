<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">ZkSync</h1>
        </div>
        <table class="min-w-full border text-center text-sm font-light dark:border-gray-700" v-if="isDataLoaded">
            <thead class="border-b font-medium dark:border-gray-700">
                <tr>
                    <th :class="thClass"></th>
                    <th :class="thClass">Wallet</th>
                    <th :class="thClass">ETH</th>
                    <th :class="thClass">USDC</th>
                    <th :class="thClass">USDT</th>
                    <th :class="thClass">DAI</th>
                    <th :class="thClass">TX Count</th>
                    <th :class="thClass">Volume</th>
                    <th :class="thClass">Contracts</th>
                    <th :class="thClass">Days</th>
                    <th :class="thClass">Weeks</th>
                    <th :class="thClass">Months</th>
                    <th :class="thClass">First tx</th>
                    <th :class="thClass">Last tx</th>
                    <th :class="thClass">Total gas spent</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in tableData" :key="index" class="border-b dark:border-gray-700">
                    <td :class="tdClass">{{ item['n'] }}</td>
                    <td :class="tdClass + ' text-left'"><strong>{{ item['wallet'] }}</strong></td>
                    <td :class="[tdClass, parseFloat(item['ETH']) < 0.005 ? 'text-red-500' : '']">{{ item['ETH'] }}</td>
                    <td :class="tdClass">{{ item['USDC'] }}</td>
                    <td :class="tdClass">{{ item['USDC'] }}</td>
                    <td :class="tdClass">{{ item['DAI'] }}</td>
                    <td :class="tdClass">{{ item['TX Count'] }}</td>
                    <td :class="tdClass">{{ item['Volume'] }}</td>
                    <td :class="tdClass">{{ item['Contracts'] }}</td>
                    <td :class="tdClass">{{ item['Days'] }}</td>
                    <td :class="tdClass">{{ item['Weeks'] }}</td>
                    <td :class="tdClass">{{ item['Months'] }}</td>
                    <td :class="tdClass">{{ item['First tx'] }}</td>
                    <td :class="tdClass">{{ item['Last tx'] }}</td>
                    <td :class="tdClass">{{ item['Total gas spent'] }}</td>
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
            this.$axios.get('/api/zksync').then((response) => {
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
