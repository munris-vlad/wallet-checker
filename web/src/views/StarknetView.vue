<template>
    <div class="pb-10">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">Starknet</h1>
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
                    <td :class="tdClass + ' text-left'"><strong>{{ item['wallet'] }}</strong></td>
                    <td :class="[tdClass, parseFloat(item['ETH']) < 0.001 ? 'text-red-500' : '']">{{ item['ETH'] }} (${{ item['ETH USDVALUE'] }})</td>
                    <td :class="tdClass">{{ item['USDC'] }}</td>
                    <td :class="tdClass">{{ item['USDC'] }}</td>
                    <td :class="tdClass">{{ item['DAI'] }}</td>
                    <td :class="tdClass">{{ item['TX Count'] }}</td>
                    <td :class="tdClass">{{ item['Volume'] > 0 ? '$'+item['Volume'] : '' }}</td>
                    <td :class="tdClass">{{ item['Contracts'] }}</td>
                    <td :class="tdClass">{{ item['Bridge to / from'] }}</td>
                    <td :class="tdClass">{{ item['Days'] }}</td>
                    <td :class="tdClass">{{ item['Weeks'] }}</td>
                    <td :class="tdClass">{{ item['Months'] }}</td>
                    <td :class="tdClass">{{ formatDate(item['First tx']) }}</td>
                    <td :class="tdClass">{{ formatDate(item['Last tx']) }}</td>
                    <td :class="tdClass">{{ item['Total gas spent'] }} (${{ item['Total gas spent USDVALUE'] }})</td>
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
                'ETH',
                'USDC',
                'USDT',
                'DAI',
                'TX Count',
                'Volume',
                'Contracts',
                'Bridge to / from',
                'Days',
                'Weeks',
                'Months',
                'First tx',
                'Last tx',
                'Total gas spent'
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
            this.$axios.get('/api/starknet').then((response) => {
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
