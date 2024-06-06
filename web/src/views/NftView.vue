<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">NFT</h1>
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
                            <strong>{{ item['wallet'] }}</strong>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'Total'">
                                <a target="_blank" :href="'https://debank.com/profile/' + item['wallet']"><img
                                        class="rounded-full mb-1" :src="'/debank.png'" alt=""></a>
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">${{ item['total'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-10 pt-2 pb-16 select-none text-center" v-if="item.data">
                            <div class="w-7 h-7 text-center" v-for="(nft, index) in item.data" :key="index" :title="nft.name">
                                <div class="relative pb-3">
                                    <img class="rounded-full w-7 h-7 rounded-full chain cursor-pointer" ref="nfts" :src="nft.logo_url ? nft.logo_url : '/nft.png'" :alt="nft.name">
                                    <img class="absolute w-3.5 h-3.5 bottom-2 -right-1 rounded-full"
                                        :src="nft.native_token.logo_url"
                                        :alt="nft.native_token.symbol">
                                </div>
                                <span class="text-xs protocol-text">{{ nft.nft_list.length }} x {{ nft.floor_price.toFixed(2) }}</span> <br>
                                <span class="text-xs token-font opacity-75">{{ parseFloat(nft.nft_list.length * nft.floor_price).toFixed(2) }} {{ nft.native_token.symbol }}</span> <br>
                                <span class="text-xs token-font opacity-50">${{ parseInt((nft.floor_price * nft.nft_list.length) * nft.native_token.price) }}</span>
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
        async showNft(event) {
            this.$refs.chains.forEach(element => {
                element.classList.remove('border-purple-600')
                element.classList.remove('border-2')
            })
            event.target.classList.toggle('border-2')
            event.target.classList.toggle('border-purple-600')
        },
        loadData() {
            this.$axios.get('/api/nft').then((response) => {
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
