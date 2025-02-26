<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">Balance</h1>
        </div>
        <div class="min-w-full pb-4 pt-4">
            <div class="flex space-x-4 content-center items-center place-content-center">
                <button v-if="appconfig.modules.balance.networks['ETH'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'ETH'}" @click="loadNetwork('ETH')">Ethereum</button>
                <button v-if="appconfig.modules.balance.networks['Arbitrum'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Arbitrum'}" @click="loadNetwork('Arbitrum')">Arbitrum</button>
                <button v-if="appconfig.modules.balance.networks['Optimism'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Optimism'}" @click="loadNetwork('Optimism')">Optimism</button>
                <button v-if="appconfig.modules.balance.networks['Base'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Base'}" @click="loadNetwork('Base')">Base</button>
                <button v-if="appconfig.modules.balance.networks['Linea'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Linea'}" @click="loadNetwork('Linea')">Linea</button>
                <button v-if="appconfig.modules.balance.networks['Polygon'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Polygon'}" @click="loadNetwork('Polygon')">Polygon</button>
                <button v-if="appconfig.modules.balance.networks['BSC'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'BSC'}" @click="loadNetwork('BSC')">BNB</button>
                <button v-if="appconfig.modules.balance.networks['opBNB'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'opBNB'}" @click="loadNetwork('opBNB')">opBNB</button>
                <button v-if="appconfig.modules.balance.networks['Avalanche'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Avalanche'}" @click="loadNetwork('Avalanche')">Avalanche</button>
                <button v-if="appconfig.modules.balance.networks['Core'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Core'}" @click="loadNetwork('Core')">Core</button>
                <button v-if="appconfig.modules.balance.networks['Celo'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Celo'}" @click="loadNetwork('Celo')">Celo</button>
                <button v-if="appconfig.modules.balance.networks['Klaytn'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Klaytn'}" @click="loadNetwork('Klaytn')">Klaytn</button>
                <button v-if="appconfig.modules.balance.networks['Fantom'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Fantom'}" @click="loadNetwork('Fantom')">Fantom</button>
                <button v-if="appconfig.modules.balance.networks['Moonbeam'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Moonbeam'}" @click="loadNetwork('Moonbeam')">Moonbeam</button>
                <button v-if="appconfig.modules.balance.networks['Moonriver'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Moonriver'}" @click="loadNetwork('Moonriver')">Moonriver</button>
                <button v-if="appconfig.modules.balance.networks['Redstone'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Redstone'}" @click="loadNetwork('Redstone')">Redstone</button>
                <button v-if="appconfig.modules.balance.networks['Blast'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Blast'}" @click="loadNetwork('Blast')">Blast</button>
                <button v-if="appconfig.modules.balance.networks['Taiko'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Taiko'}" @click="loadNetwork('Taiko')">Taiko</button>
                <button v-if="appconfig.modules.balance.networks['Manta'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Manta'}" @click="loadNetwork('Manta')">Manta</button>
                <button v-if="appconfig.modules.balance.networks['Zero'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Zero'}" @click="loadNetwork('Zero')">Zero</button>
                <button v-if="appconfig.modules.balance.networks['Ink'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Ink'}" @click="loadNetwork('Ink')">Ink</button>
                <button v-if="appconfig.modules.balance.networks['Soneium'].enabled" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeNetwork === 'Soneium'}" @click="loadNetwork('Soneium')">Soneium</button>
            </div>
        </div>
        <table class="min-w-full border text-center text-sm font-light dark:border-gray-700" v-if="isDataLoaded && !isError">
            <thead class="border-b font-medium dark:border-gray-700">
                <tr v-if="activeNetwork === 'all'">
                    <th v-for="(head, index) in headersAll" :key="index" :class="thClass" @click="sort(head)">{{ head }}</th>
                </tr>
                <tr v-if="activeNetwork !== 'all'">
                    <th v-for="(head, index) in headers" :key="index" :class="thClass" @click="sort(head)">{{ head }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in sortedData" :key="index" class="border-b dark:border-gray-700">
                    <td :class="tdClass">{{ item['n'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-2 pt-3 pb-2">
                            <strong>{{ item['wallet'] }}</strong>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL'">
                                <a target="_blank" :href="'https://debank.com/profile/'+item['wallet']"><img class="rounded-full mb-1" :src="'/debank.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'ETH'">
                                <a target="_blank" :href="'https://etherscan.io/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Arbitrum'">
                                <a target="_blank" :href="'https://arbiscan.io/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/arb-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Optimism'">
                                <a target="_blank" :href="'https://optimistic.etherscan.io/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/op-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Base'">
                                <a target="_blank" :href="'https://basescan.org/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/base-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Linea'">
                                <a target="_blank" :href="'https://lineascan.build/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/linea-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Polygon'">
                                <a target="_blank" :href="'https://polygonscan.com/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/polygon-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'BSC'">
                                <a target="_blank" :href="'https://bscscan.com/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/bsc-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'opBNB'">
                                <a target="_blank" :href="'https://opbnb.bscscan.com/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/bsc-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Avalanche'">
                                <a target="_blank" :href="'https://avascan.info/blockchain/c/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/ava-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Core'">
                                <a target="_blank" :href="'https://scan.coredao.org/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/core-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Celo'">
                                <a target="_blank" :href="'https://explorer.celo.org/mainnet/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/celo-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Klaytn'">
                                <a target="_blank" :href="'https://klaytnscope.com/account/'+item['wallet']"><img class="rounded-full mb-1" :src="'/klaytn-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Fantom'">
                                <a target="_blank" :href="'https://ftmscan.com/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/ftm-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Moonbeam'">
                                <a target="_blank" :href="'https://moonbeam.moonscan.io/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/moonbeam-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Moonriver'">
                                <a target="_blank" :href="'https://moonriver.moonscan.io/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/moonriver-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Redstone'">
                                <a target="_blank" :href="'https://explorer.redstone.xyz/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/redstone.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Blast'">
                                <a target="_blank" :href="'https://blastscan.io/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/blast.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Taiko'">
                                <a target="_blank" :href="'https://taikoscan.io/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/taiko.svg'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Manta'">
                                <a target="_blank" :href="'https://manta.socialscan.io/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/manta.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Zero'">
                                <a target="_blank" :href="'https://explorer.zero.network/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/zero.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Ink'">
                                <a target="_blank" :href="'https://explorer.inkonchain.com/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/ink-scan.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'TOTAL' && activeNetwork === 'Soneium'">
                                <a target="_blank" :href="'https://soneium.blockscout.com/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/soneium.svg'" alt=""></a>
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">{{ item['Tx count'] }}</td>
                    <td v-if="activeNetwork !== 'all'" :class="[tdClass, parseFloat(item['Native']) < appconfig.modules.balance.minBalanceHighlight ? 'text-red-500' : '']">{{ item['Native'] }} {{ item['Native_name'] }}</td>
                    <td :class="tdClass">${{ item['NativeUSD'] }}</td>
                    <td :class="tdClass">${{ item['USDT'] }}</td>
                    <td :class="tdClass">${{ item['USDC'] }}</td>
                    <td :class="tdClass">${{ item['DAI'] }}</td>
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
import {thClass, tdClass} from "@/utils/tableClass"

export default {
    data() {
        return {
            appconfig: this.$appconfig,
            activeNetwork: 'ETH',
            isDataLoaded: false,
            isError: false,
            error: '',
            thClass: thClass,
            tdClass: tdClass,
            data: [],
            sortDirection: 1,
            sortBy: 'n',
            headersAll: [
                'n',
                'Wallet',
                'Tx count',
                'NativeUSD',
                'USDT',
                'USDC',
                'DAI'
            ],
            headers: [
                'n',
                'Wallet',
                'Tx count',
                'Native',
                'NativeUSD',
                'USDT',
                'USDC',
                'DAI'
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
        loadData() {
            this.$axios.get('/api/balances?network=ETH').then((response) => {
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
            this.$axios.get('/api/balances', {
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
