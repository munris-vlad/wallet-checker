<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">Rabby</h1>
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
                            <div class="h-4 w-4">
                                <a target="_blank" :href="'https://debank.com/profile/' + item['Wallet']"><img
                                        class="rounded-full mb-1" :src="'/debank.png'" alt=""></a>
                            </div>
                        </div>
                    </td>
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
            headers: [
                'n',
                'Wallet',
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
    },
}
</script>

<style>
    .token-font {
        font-size: 0.6rem;
    }
</style>
