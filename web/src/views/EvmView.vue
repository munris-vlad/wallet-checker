<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">EVM Stats</h1>
        </div>
        <div class="min-w-full pb-4 pt-4">
            <div class="flex space-x-4 content-center items-center place-content-center">
                <button class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'eth'}" @click="loadNetwork('eth')">Ethereum</button>
                <button class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'arbitrum'}" @click="loadNetwork('arbitrum')">Arbitrum</button>
                <button class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'optimism'}" @click="loadNetwork('optimism')">Optimism</button>
                <button class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'polygon'}" @click="loadNetwork('polygon')">Polygon</button>
                <button class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'bsc'}" @click="loadNetwork('bsc')">BNB</button>
            </div>
        </div>
        <table class="min-w-full border text-center text-sm font-light dark:border-gray-700" v-if="isDataLoaded && !isError">
            <thead class="border-b font-medium dark:border-gray-700">
                <tr>
                    <th v-for="(head, index) in headers" :key="index" :class="thClass" @click="sort(head)">{{ head }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in sortedData" :key="index" class="border-b dark:border-gray-700">
                    <td :class="tdClass">{{ item['n'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-2 pt-3 pb-2">
                            <strong>{{ item['Wallet'] }}</strong>
                            <div class="h-4 w-4" v-if="item['Wallet'] !== 'Total'">
                                <a target="_blank" :href="'https://debank.com/profile/'+item['Wallet']"><img class="rounded-full mb-1" :src="'/debank.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['Wallet'] !== 'Total' && activeNetwork === 'eth'">
                                <a target="_blank" :href="'https://etherscan.io/address/'+item['Wallet']"><img class="rounded-full mb-1" :src="'/scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['Wallet'] !== 'Total' && activeNetwork === 'arbitrum'">
                                <a target="_blank" :href="'https://arbiscan.io/address/'+item['Wallet']"><img class="rounded-full mb-1" :src="'/arb-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['Wallet'] !== 'Total' && activeNetwork === 'optimism'">
                                <a target="_blank" :href="'https://optimistic.etherscan.io/address/'+item['Wallet']"><img class="rounded-full mb-1" :src="'/op-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['Wallet'] !== 'Total' && activeNetwork === 'polygon'">
                                <a target="_blank" :href="'https://polygonscan.com/address/'+item['Wallet']"><img class="rounded-full mb-1" :src="'/polygon-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['Wallet'] !== 'Total' && activeNetwork === 'bsc'">
                                <a target="_blank" :href="'https://bscscan.com/address/'+item['Wallet']"><img class="rounded-full mb-1" :src="'/bsc-scan.png'" alt=""></a>
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">{{ item['TX Count'] }}</td>
                    <td :class="tdClass">{{ item['Gas spent'] }} {{ item['Native token'] }}</td>
                    <td :class="tdClass">{{ item['Days'] }}</td>
                    <td :class="tdClass">{{ item['Weeks'] }}</td>
                    <td :class="tdClass">{{ item['Months'] }}</td>
                    <td :class="tdClass">{{ formatDate(item['First tx']) }}</td>
                    <td :class="tdClass">{{ formatDate(item['Last tx']) }}</td>
                </tr>
            </tbody>
        </table>
        <div class="text-center text-2xl" v-if="!isDataLoaded && !isError">
          Data loading...
        </div>

        <div class="text-center text-2xl" v-if="isError">
          Error: {{ error }}
        </div>
    </div>
</template>

<script>

import {sortMethods} from "@/utils/sorting"
import {formatDate} from "@/utils/formatDate"
import {thClass, tdClass} from "@/utils/tableClass"

export default {
    data() {
        return {
            i: 0,
            activeNetwork: 'eth',
            isDataLoaded: false,
            isError: false,
            error: '',
            data: [],
            thClass: thClass,
            tdClass: tdClass,
            sortDirection: 1,
            sortBy: 'n',
            headers: [
                'n',
                'Wallet',
                'TX Count',
                'Gas spent',
                'Days',
                'Weeks',
                'Months',
                'First tx',
                'Last tx'
            ]
        }
    },
    created() {
        this.loadData()
    },
    computed: {
        sortedData: {
            get() {
                return this.data
            },
            set(value) {
                this.data = value
            },
        },
    },
    methods: {
        formatDate,
        loadData() {
            this.$axios.get('/api/evm').then((response) => {
                this.data = response.data.sort((a, b) => a.n - b.n)
                this.isDataLoaded = true
            }).catch((error) => {
                this.isError = true
                this.error = error.toString()
            })
        },
        loadNetwork(network) {
            this.isDataLoaded = false
            this.activeNetwork = network
            this.$axios.get('/api/evm', {
                params: {
                    network: network
                }
            }).then((response) => {
                this.data = response.data.sort((a, b) => a.n - b.n)
                this.isDataLoaded = true
            }).catch((error) => {
                this.isError = true
                this.error = error.toString()
            })
        },
        sort(head) {
            this.sortBy = head
            this.sortDirection *= -1
            this.sortData()
        },
        sortData() {
            const type = this.sortBy === 'name' ? 'String' : 'Number'
            const direction = this.sortDirection
            const head = this.sortBy
            this.sortedData = this.data.slice().sort(sortMethods(type, head, direction))
        }
    },
}
</script>

<style>
</style>
