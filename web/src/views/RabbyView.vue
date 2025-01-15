<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">Rabby</h1>
        </div>
        <div class="flex justify-between items-center pb-1 pt-4 pl-0" v-if="isDataLoaded && !isError">
            <div class="text-gray-500 hover:text-gray-600 px-2 cursor-pointer select-none pl-0 w-32"></div>
            <div class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded cursor-pointer select-none mb-2" @click="refreshData">
                Refresh data
            </div>
        </div>
        <table class="min-w-full border text-center text-sm font-light dark:border-gray-700"
            v-if="isDataLoaded && !isError">
            <thead class="border-b font-medium dark:border-gray-700">
                <tr>
                    <th v-for="(head, index) in headers" :key="index" :class="thClass" @click="sort(head)">{{ head }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in sortedData" :key="index" class="border-b dark:border-gray-700">
                    <td :class="tdClass">{{ item['n'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-2 pt-3 pb-2">
                            <strong>{{ item['Wallet'] }}</strong>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'Total'">
                                <a target="_blank" :href="'https://debank.com/profile/' + item['Wallet']"><img
                                        class="rounded-full mb-1" :src="'/debank.png'" alt=""></a>
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">{{ item['Points'] }}</td>
                    <td :class="tdClass">${{ item['Total'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-5 pt-2 pb-12 select-none" v-if="item['chains']" >
                            <div class="w-7 h-7 text-center" v-for="(chain, index) in item['chains'].slice(0, 10)" :key="index" :title="chain.name">
                                <div class="relative pb-3">
                                    <img class="rounded-full w-7 h-7 rounded-full chain cursor-pointer" ref="chains" @click="fetchChain(chain, item['Wallet'], $event)" :src="chain.logo_url" :alt="chain.name">
                                </div>
                                <span class="text-xs protocol-text">${{ parseInt(chain.usd_value) }}</span>
                            </div>
                        </div>

                        <div class="flex space-x-5 pt-2 pb-12 select-none border-t border-purple-300 pt-4" v-if="tokens[item['Wallet']]">
                            <div class="w-7 h-7 text-center" v-for="(token, index) in tokens[item['Wallet']].slice(0, 10)" :key="index" :title="token.name">
                                <div class="relative pb-3">
                                    <img class="rounded-full w-7 h-7 rounded-full chain" :src="token.logo_url" :alt="token.name">
                                </div>
                                <span class="text-xs protocol-text">${{ parseInt(token.amount * token.price) }}</span> <br>
                                <span class="text-xs token-font opacity-50">{{ processNumber(token.amount) }}</span>
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">
                        <button class="cursor-pointer refresh text-blue-400 text-xl" @click="fetchWallet(item['Wallet'], index)" :disabled="loading[index]" v-if="item['wallet'] !== 'Total'">
                            <svg :class="{ 'motion-safe:animate-spin': loading[index] }" class="text-blue-400" fill="#3B82F6" height="15px" width="15px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 489.645 489.645" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M460.656,132.911c-58.7-122.1-212.2-166.5-331.8-104.1c-9.4,5.2-13.5,16.6-8.3,27c5.2,9.4,16.6,13.5,27,8.3 c99.9-52,227.4-14.9,276.7,86.3c65.4,134.3-19,236.7-87.4,274.6c-93.1,51.7-211.2,17.4-267.6-70.7l69.3,14.5 c10.4,2.1,21.8-4.2,23.9-15.6c2.1-10.4-4.2-21.8-15.6-23.9l-122.8-25c-20.6-2-25,16.6-23.9,22.9l15.6,123.8 c1,10.4,9.4,17.7,19.8,17.7c12.8,0,20.8-12.5,19.8-23.9l-6-50.5c57.4,70.8,170.3,131.2,307.4,68.2 C414.856,432.511,548.256,314.811,460.656,132.911z"></path> </g> </g></svg>
                        </button>
                    </td>
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

import { sortMethods } from "@/utils/sorting"
import { formatDate } from "@/utils/formatDate"
import { thClass, tdClass } from "@/utils/tableClass"

export default {
    data() {
        return {
            isDataLoaded: false,
            isError: false,
            error: '',
            data: [],
            thClass: thClass,
            tdClass: tdClass,
            sortDirection: 1,
            sortBy: 'n',
            tokens: {},
            loading: [],
            headers: [
                'n',
                'Wallet',
                'Points',
                'Total',
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
        async fetchChain(chain, wallet, event) {
            this.$refs.chains.forEach(element => {
                element.classList.remove('border-purple-600')
                element.classList.remove('border-2')
            })
            event.target.classList.toggle('border-2')
            event.target.classList.toggle('border-purple-600')

            this.$axios.get('/api/rabby-chain', { 
                params: { 
                    wallet: wallet,
                    chainId: chain.id
                } 
            }).then((response) => {
                this.tokens[wallet] = response.data
            }).catch()
        },
        loadData() {
            this.$axios.get('/api/rabby').then((response) => {
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
        },
        processNumber(numStr) {
            const num = parseFloat(numStr)

            if (Number.isInteger(num)) {
                if (num.toFixed(0).length > 5) {
                    return num.toFixed(0).slice(0, 3) + '...'
                } else {
                    return num
                }
            }

            return parseFloat(num).toFixed(3)
        },
        fetchWallet(wallet, index) {
            this.loading[index] = true
            this.$axios.get('/api/rabby/refresh', {params: {wallet: wallet}}).then(() => {
                this.loadData()
                this.loading[index] = false
            }).catch((error) => {
                this.isError = true
                this.error = error.toString()
            })
        },
        refreshData() {
            this.isDataLoaded = false
            this.$axios.get('/api/rabby/clean').then(() => {
                this.loadData()
            }).catch((error) => {
                this.isError = true
                this.error = error.toString()
            })
        }
    },
}
</script>

<style>
    .token-font {
        font-size: 0.6rem;
    }
</style>
