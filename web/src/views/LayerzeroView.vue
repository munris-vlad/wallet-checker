<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">Layerzero</h1>
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
                    <td :class="tdClass">${{ item['Volume'] }}</td>
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
            headers: [
                'n',
                'Wallet',
                'Clusters',
                'TX Count',
                'Volume',
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
        }
    },
}
</script>

<style>
</style>
