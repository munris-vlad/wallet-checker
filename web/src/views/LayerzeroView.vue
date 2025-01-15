<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">Layerzero</h1>
        </div>
        <div class="flex justify-between items-center pb-1 pt-4 pl-0" v-if="isDataLoaded && !isError">
            <div class="text-gray-500 hover:text-gray-600 px-2 cursor-pointer select-none pl-0 w-32"></div>
            <div class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded cursor-pointer select-none mb-2" @click="refreshData">
                Refresh data
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
                            <div class="h-4 w-4">
                                <a target="_blank" :href="'https://debank.com/profile/'+item['Wallet']"><img class="rounded-full mb-1" :src="'/debank.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'Total'">
                                <a target="_blank" :href="'https://layerzeroscan.com/address/'+item['Wallet']"><img class="rounded-full mb-1" :src="'/layerzero.png'" alt=""></a>
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">{{ item['Clusters'] }}</td>
                    <td :class="tdClass">{{ item['TX Count'] }}</td>
                    <td :class="tdClass">{{ item['Source chains'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-2 pt-3 pb-4 select-none max-w-sm">
                            <div class="h-4 w-4 text-center" v-for="(count, source) in item['sources']" :key="source" :title="source">
                                <img class="rounded-full mb-1" :src="`https://icons-ckg.pages.dev/lz-scan/networks/${source}.svg`" :alt="source">
                                <span class="text-xs protocol-text">{{ count }}</span>
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass + ' text-left'">
                        <strong>Total: {{ Object.keys(item['protocols']).length }}</strong>

                        <div class="flex space-x-2 pt-3 pb-4 select-none max-w-sm">
                            <div class="h-4 w-4 text-center" v-for="(count, protocol) in item['protocols']" :key="protocol" :title="protocol">
                                <img class="rounded-full mb-1" :src="`https://icons-ckg.pages.dev/lz-scan/protocols/${protocol}.svg`" :alt="protocol">
                                <span class="text-xs protocol-text">{{ count }}</span>
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">{{ item['Dest chains'] }}</td>
                    <td :class="tdClass">{{ item['Contracts'] }}</td>
                    <td :class="tdClass">{{ item['Days'] }}</td>
                    <td :class="tdClass">{{ item['Weeks'] }}</td>
                    <td :class="tdClass">{{ item['Months'] }}</td>
                    <td :class="tdClass">{{ formatDate(item['First tx']) }}</td>
                    <td :class="tdClass">{{ formatDate(item['Last tx']) }}</td>
                    <td :class="tdClass">
                        <button class="cursor-pointer refresh text-blue-400 text-xl" @click="fetchWallet(item['Wallet'], index)" :disabled="loading[index]">
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

import {sortMethods} from "@/utils/sorting"
import {formatDate} from "@/utils/formatDate"
import {thClass, tdClass} from "@/utils/tableClass"

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
            loading: [],
            headers: [
                'n',
                'Wallet',
                'Clusters',
                'TX Count',
                'Source chains',
                'Source chains list',
                'Protocols',
                'Dest chains',
                'Contracts',
                'Days',
                'Weeks',
                'Months',
                'First tx',
                'Last tx',
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
            this.$axios.get('/api/layerzero').then((response) => {
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
        fetchWallet(wallet, index) {
            this.loading[index] = true
            this.$axios.get('/api/layerzero/refresh', {params: {wallet: wallet}}).then(() => {
                this.loadData()
                this.loading[index] = false
            }).catch((error) => {
                this.isError = true
                this.error = error.toString()
            })
        },
        refreshData() {
            this.isDataLoaded = false
            this.$axios.get('/api/layerzero/clean').then(() => {
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
</style>
